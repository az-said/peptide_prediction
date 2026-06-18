"""B19 — Cohort comparison routes.

Currently exposes a single endpoint: ``POST /api/cohorts/compare``, which
runs Welch's two-sample t-test on a chosen biochemical metric between
two precomputed cohorts.

Precomputed cohort JSON files live under ``backend/data/precomputed/``
and are produced by the M2 dataset pre-compute job. The expected shape
is the same as ``RowsResponse`` from ``/api/predict/batch``:

    {
        "pvl_version": "0.3.0",
        "precomputed_at": "2026-06-18T12:00:00Z",
        "rows": [PeptideRow, ...],
        ...
    }

The route reads ``rows`` and extracts a numeric vector per cohort for
the requested metric. Missing-metric and missing-cohort cases return
clean 404 / 422 errors rather than 500s so the UI can render a
specific message.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.cohort_stats import welch_t_test
from services.logger import log_info, log_warning

router = APIRouter()

# Resolve the precomputed directory at import time so tests can monkeypatch
# this module attribute without touching the filesystem.
PRECOMPUTED_DIR: Path = Path(__file__).resolve().parent.parent.parent / "data" / "precomputed"

# Only these three metrics are exposed via the API. Adding a new one is
# a one-line change here; we keep the surface explicit to prevent the
# route from silently exposing every PeptideRow field.
ALLOWED_METRICS = ("muH", "hydrophobicity", "charge")
MetricName = Literal["muH", "hydrophobicity", "charge"]


class CohortCompareRequest(BaseModel):
    """Body for ``POST /api/cohorts/compare``."""

    a: str = Field(..., min_length=1, max_length=128, description="Cohort A dataset id")
    b: str = Field(..., min_length=1, max_length=128, description="Cohort B dataset id")
    metric: MetricName = Field(
        ..., description="Biochemical metric to compare. One of: muH, hydrophobicity, charge."
    )


class CohortCompareResponse(BaseModel):
    """Response for ``POST /api/cohorts/compare``."""

    a: str
    b: str
    metric: str
    n_a: int
    n_b: int
    t: float
    p: float
    df: float


def _load_cohort_rows(dataset_id: str) -> list[dict]:
    """Read precomputed cohort JSON and return its ``rows`` list.

    Raises ``HTTPException`` for missing file or malformed JSON so the
    route layer translates the failure into a meaningful HTTP status
    rather than a 500.
    """
    # Reject path traversal cheaply by rejecting non-alphanumeric ids.
    if not all(ch.isalnum() or ch in "._-" for ch in dataset_id):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid dataset id {dataset_id!r} (allowed: alnum, '.', '_', '-')",
        )
    path = PRECOMPUTED_DIR / f"{dataset_id}.json"
    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail=(
                f"Precomputed dataset {dataset_id!r} not found at {path}. "
                "Run `make precompute-datasets` (M2) to build the artifact."
            ),
        )
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Precomputed dataset {dataset_id!r} is not valid JSON: {exc}",
        ) from exc
    rows = payload.get("rows") if isinstance(payload, dict) else None
    if not isinstance(rows, list):
        raise HTTPException(
            status_code=500,
            detail=(
                f"Precomputed dataset {dataset_id!r} does not contain a 'rows' "
                "list — was it produced by the M2 precompute pipeline?"
            ),
        )
    return rows


def _extract_metric(rows: list[dict], metric: str) -> list[float | None]:
    """Pull the metric column from a list of normalized PeptideRow dicts."""
    return [row.get(metric) for row in rows]


@router.post("/api/cohorts/compare", response_model=CohortCompareResponse)
async def compare_cohorts(req: CohortCompareRequest) -> CohortCompareResponse:
    """Welch's t-test on a metric between two precomputed cohorts."""
    if req.a == req.b:
        raise HTTPException(
            status_code=422,
            detail=f"Cohorts a and b must differ (both were {req.a!r}).",
        )

    rows_a = _load_cohort_rows(req.a)
    rows_b = _load_cohort_rows(req.b)
    vec_a = _extract_metric(rows_a, req.metric)
    vec_b = _extract_metric(rows_b, req.metric)

    try:
        result = welch_t_test(vec_a, vec_b)
    except ValueError as exc:
        # Includes the "fewer than 2 valid samples" case.
        log_warning(
            "cohort_compare_invalid",
            f"Welch's t-test rejected inputs: {exc}",
            metric=req.metric,
            a=req.a,
            b=req.b,
            error=str(exc),
        )
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    n_a = sum(1 for v in vec_a if v is not None)
    n_b = sum(1 for v in vec_b if v is not None)

    log_info(
        "cohort_compare",
        f"a={req.a} b={req.b} metric={req.metric} n_a={n_a} n_b={n_b} t={result['t']:.4f} p={result['p']:.4g}",
        metric=req.metric,
        a=req.a,
        b=req.b,
        n_a=n_a,
        n_b=n_b,
        t=result["t"],
        p=result["p"],
        df=result["df"],
    )

    return CohortCompareResponse(
        a=req.a,
        b=req.b,
        metric=req.metric,
        n_a=n_a,
        n_b=n_b,
        t=result["t"],
        p=result["p"],
        df=result["df"],
    )
