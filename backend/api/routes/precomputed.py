"""Precomputed dataset endpoint.

GET /api/precomputed/{dataset_id} returns the pre-computed pipeline
response for a registered reference dataset, bypassing the live
TANGO + S4PRED pipeline.

The precomputed JSON files are produced by ``make precompute-datasets``
(see ``backend/scripts/precompute_dataset.py``) and stored under
``backend/data/precomputed/<dataset_id>.json``. The artifact contains
a ``response`` field with the same shape as ``POST /api/predict/batch``,
so the frontend can pass it straight to ``ingestBackendRows()`` without
a second normalization pass.

If the precomputed file is missing the route returns 404 and the
frontend falls back to the live-pipeline path so the UX never breaks —
it just runs slower until the precompute job is run on the deploy host.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from services.logger import log_info

router = APIRouter()

PRECOMPUTED_DIR: Path = Path(__file__).resolve().parent.parent.parent / "data" / "precomputed"


@router.get("/api/precomputed/{dataset_id}")
def get_precomputed_dataset(dataset_id: str) -> dict:
    """Serve a pre-computed prediction response for a reference dataset.

    Returns the inner ``response`` payload (rows + meta + provider stats)
    so the frontend can ingest it the same way it ingests a live batch
    response. 404 on missing file; 422 on path-traversal attempts.
    """
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
                f"Precomputed dataset {dataset_id!r} not found. "
                "Run `make precompute-datasets` on the deploy host to generate it."
            ),
        )

    try:
        artifact = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Precomputed dataset {dataset_id!r} is malformed: {exc}",
        ) from exc

    response = artifact.get("response")
    if not isinstance(response, dict) or "rows" not in response:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Precomputed dataset {dataset_id!r} is missing a 'response.rows' "
                "field. Regenerate with `make precompute-datasets`."
            ),
        )

    log_info(
        "precomputed_served",
        f"Served precomputed dataset {dataset_id}",
        dataset_id=dataset_id,
        n_rows=len(response.get("rows", [])),
    )
    return response
