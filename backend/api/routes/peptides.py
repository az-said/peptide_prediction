"""Peptide-centric routes:

Wave 2 §D — POST /api/peptides/similar             (vector similarity search)
Wave 2 §I — GET  /api/peptide/{accession}          (peptide detail lookup)
Wave 2 §I — POST /api/rank                         (multi-signal ranking)
Wave 2 §I — POST /api/compare                      (cohort delta stats)

Path naming follows the §I dispatch literally — singular `/api/peptide/`,
de-namespaced `/api/rank` and `/api/compare`. The pre-existing
`/api/peptides/similar` (plural, namespaced) stays where it is for
backwards compatibility. Reconciling the inconsistency is a T1 future-
cleanup concern.

All §I routes are thin shaping layers — the real logic lives in
``services/vector_store.py``, ``services/peptide_rank.py``, and
``services/peptide_compare.py``. Keeping the routes thin lets the same
code back the MCP tools, the future pvl-py client, and the frontend
without forking the implementation.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from schemas.peptides import (
    CohortFlatStats,
    CompareDifference,
    CompareRequest,
    CompareResponse,
    FindSimilarRequest,
    FindSimilarResponse,
    PeptideDetailResponse,
    RankedPeptide,
    RankRequest,
    RankResponse,
    SimilarPeptideResult,
)
from services import peptide_compare, peptide_rank, vector_store
from services.logger import log_info

# §I dispatch fixes the method identifier so peer reviewers can cite the
# exact scoring formula. Bump these strings if the algorithm changes.
_RANK_METHOD = "weighted-sum-v1"

router = APIRouter()


# ---------------------------------------------------------------------------
# Wave 2 §D — similarity search
# ---------------------------------------------------------------------------


@router.post("/api/peptides/similar", response_model=FindSimilarResponse)
async def find_similar_peptides(req: FindSimilarRequest) -> FindSimilarResponse:
    """Return the k peptides most similar to ``reference_id`` by embedding distance.

    Behaviour notes that match the frontend contract:

    - The reference peptide itself is never included in ``results``.
    - If the reference is not in the index, ``results`` is an empty list
      (NOT a 404). The UI shows the "no similar peptides found" empty state.
    - If the vector index is disabled (``VECTOR_INDEX_ENABLED=0`` or model
      load failed), results are empty and ``method`` is ``"disabled"`` so the
      UI / MCP tool can surface a helpful message.
    """
    # CodeRabbit #1: LanceDB read + ESM-2 embed are synchronous CPU/IO work.
    # Calling them directly from an `async def` route blocks the event loop
    # so a slow query stalls every other in-flight request. asyncio.to_thread
    # offloads to the default thread pool — the route stays cooperative.
    payload = await asyncio.to_thread(
        vector_store.find_similar,
        reference_id=req.reference_id,
        k=req.k,
        dataset_id=req.dataset_id,
    )

    log_info(
        "peptides_similar",
        f"reference={req.reference_id} k={req.k} found={len(payload['results'])}",
        reference_id=req.reference_id,
        k=req.k,
        dataset_id=req.dataset_id,
        result_count=len(payload["results"]),
        method=payload["method"],
        elapsed_ms=payload["elapsed_ms"],
        disabled_reason=payload.get("disabled_reason"),
    )

    return FindSimilarResponse(
        reference_id=req.reference_id,
        results=[_to_result(row) for row in payload["results"]],
        method=payload["method"],
        elapsed_ms=payload["elapsed_ms"],
    )


@router.get("/api/peptides/similar/stats")
def similar_stats() -> Dict[str, Any]:
    """Diagnostic — row count + index health. Cheap, used by the runbook."""
    return vector_store.stats()


# ---------------------------------------------------------------------------
# Wave 2 §I — detail / rank / compare
# ---------------------------------------------------------------------------


@router.get("/api/peptide/{accession}", response_model=PeptideDetailResponse)
async def get_peptide_detail(accession: str) -> PeptideDetailResponse:
    """Return the indexed row for ``accession`` (canonical PVL camelCase).

    PVL is stateless by design — analyses run on-demand. This endpoint
    surfaces whatever the vector store remembers from the last analysis
    that touched this id. If the peptide isn't in the index (never
    analyzed, or wiped via the reindex script), the response is a 404.

    For full-pipeline data (TANGO curves, S4PRED segments, structure
    overlays), re-run the peptide through ``POST /api/predict``. The
    vector index intentionally only stores the narrow subset used by the
    classification pills + similarity reference card.

    Validation: empty / overly long ``accession`` is rejected with 422.
    """
    if not accession or not accession.strip():
        raise HTTPException(status_code=422, detail="accession must be non-empty.")
    if len(accession) > 64:
        raise HTTPException(
            status_code=422, detail="accession exceeds 64 character limit."
        )

    peptide = await asyncio.to_thread(vector_store.get_peptide, accession)
    if peptide is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Peptide {accession!r} not found in the index. Analyse it via "
                "POST /api/predict (single) or POST /api/predict/batch (bulk) "
                "first — analysis auto-indexes."
            ),
        )
    log_info(
        "peptides_detail",
        f"accession={accession} found=True",
        accession=accession,
    )
    return PeptideDetailResponse(accession=accession, peptide=peptide, source="index")


@router.post("/api/rank", response_model=RankResponse)
async def rank_peptides_route(req: RankRequest) -> RankResponse:
    """Rank peptides by configurable multi-signal weights.

    Accepts either a pre-analysed list (``sequences``) or a ``dataset_id``
    that resolves to indexed rows. The frontend ranking-engine in
    ``ui/src/lib/ranking.ts`` is the canonical formula — the Python port
    in ``services/peptide_rank.py`` mirrors it line-for-line so MCP tool
    callers, pvl-py users, and the frontend agree on the score for the
    same input.

    Empty input is not an error: returns ``results=[]`` with the preset
    + effective weights echoed back so callers can keep their UI rendered
    while they fix the upstream filter.
    """
    if req.sequences is not None and req.dataset_id is not None:
        raise HTTPException(
            status_code=422,
            detail="Pass exactly one of 'sequences' or 'dataset_id', not both.",
        )

    started = time.perf_counter()

    if req.dataset_id is not None:
        candidates = await asyncio.to_thread(vector_store.list_peptides_in_dataset, req.dataset_id)
        if not candidates:
            log_info(
                "peptides_rank_empty_dataset",
                f"dataset_id={req.dataset_id} candidates=0",
                dataset_id=req.dataset_id,
            )
    else:
        candidates = list(req.sequences or [])

    # ``tango_available`` defaults match the frontend default (True). When
    # a caller passes False (typical for FF-only quick runs), TANGO-gated
    # metrics are dropped from the active set before scoring.
    tango_available = True if req.tango_available is None else bool(req.tango_available)

    try:
        payload = await asyncio.to_thread(
            peptide_rank.rank_peptides,
            candidates,
            preset=req.preset,
            weights=req.weights,
            tango_available=tango_available,
            top_n=req.top_n,
        )
    except ValueError as exc:
        # Unknown preset / malformed weights → surface as 422 (the request
        # was syntactically valid Pydantic but logically invalid).
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    elapsed_ms = int((time.perf_counter() - started) * 1000)

    log_info(
        "peptides_rank",
        f"preset={req.preset} candidates={len(candidates)} top_n={req.top_n}",
        preset=req.preset,
        candidates=len(candidates),
        top_n=req.top_n,
        used_dataset_id=req.dataset_id is not None,
        elapsed_ms=elapsed_ms,
    )

    return RankResponse(
        ranked=[
            RankedPeptide(
                peptide=row["peptide"],
                score=row["score"],
                metric_percentiles=row["metric_percentiles"],
                reasons=row["reasons"],
            )
            for row in payload["results"]
        ],
        method=_RANK_METHOD,
        elapsed_ms=elapsed_ms,
        preset=payload["preset"],
        effective_weights=payload["effective_weights"],
        total_candidates=payload["total_candidates"],
    )


@router.post("/api/compare", response_model=CompareResponse)
async def compare_peptide_cohorts(req: CompareRequest) -> CompareResponse:
    """Compute per-cohort stats + per-metric deltas with significance.

    Response shape matches the §I dispatch:

    - ``stats`` — two flat blocks keyed ``dataset_a`` / ``dataset_b``,
      each carrying ``n`` + class fractions + biochem means.
    - ``differences`` — one row per comparable metric with the signed
      delta, direction (``a>b`` / ``b>a`` / ``=``), and significance
      marker (``ns`` / ``*`` / ``**`` / ``***``).
    - ``method`` — algorithm identifier (currently ``two-sided-chi2`` for
      proportion comparisons; continuous metrics report no inferential
      test at v0.x).
    """
    payload = await asyncio.to_thread(
        peptide_compare.compare_cohorts,
        req.cohort_a,
        req.cohort_b,
        label_a=req.label_a,
        label_b=req.label_b,
    )

    log_info(
        "peptides_compare",
        f"sizes a={len(req.cohort_a)} b={len(req.cohort_b)}",
        label_a=req.label_a,
        label_b=req.label_b,
        size_a=len(req.cohort_a),
        size_b=len(req.cohort_b),
    )

    return CompareResponse(
        stats={
            "dataset_a": CohortFlatStats(**payload["stats"]["dataset_a"]),
            "dataset_b": CohortFlatStats(**payload["stats"]["dataset_b"]),
        },
        differences=[CompareDifference(**d) for d in payload["differences"]],
        method=payload["method"],
        labels=payload["labels"],
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _to_result(row: Dict[str, Any]) -> SimilarPeptideResult:
    """Reshape a vector_store result into the canonical SimilarPeptideResult.

    Builds a partial PeptideRow-shaped dict (camelCase) so the frontend's
    ``Peptide`` type can render classification pills directly from the
    response without any extra mapping.
    """
    metadata = row.get("metadata") or {}
    peptide: Dict[str, Any] = {
        "id": row["accession"],
        "sequence": row["sequence"],
    }

    # Translate the vector-store snake_case metadata back to PVL camelCase.
    for src, dst in (
        ("organism", "species"),
        ("length", "length"),
        ("helix_flag", "helixFlag"),
        ("ff_helix_flag", "ffHelixFlag"),
        ("ssw_prediction", "sswPrediction"),
        ("ssw_score", "sswScore"),
        ("ff_ssw_flag", "ffSswFlag"),
        ("s4pred_helix_prediction", "s4predHelixPrediction"),
        ("s4pred_ssw_prediction", "s4predSswPrediction"),
        ("tango_agg_max", "tangoAggMax"),
        ("mu_h", "muH"),
        ("hydrophobicity", "hydrophobicity"),
        ("charge", "charge"),
    ):
        value = metadata.get(src)
        if value is not None:
            peptide[dst] = value

    return SimilarPeptideResult(peptide=peptide, distance=row["distance"])
