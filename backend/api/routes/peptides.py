"""Peptide similarity route (Wave 2 §D, ADR-016).

Backs the ``POST /api/peptides/similar`` endpoint that the V9-1 frontend
(``SimilarPeptidesInspector``) and the ``find_similar_peptides`` MCP tool
both call. The actual vector work happens in
``backend/services/vector_store.py``; this route is a thin shaping layer.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

from schemas.peptides import (
    FindSimilarRequest,
    FindSimilarResponse,
    SimilarPeptideResult,
)
from services import vector_store
from services.logger import log_info

router = APIRouter()


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
    payload = vector_store.find_similar(
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
