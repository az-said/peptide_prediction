"""Request / response schemas for the peptide-similarity route (Wave 2 §D).

Kept in a NEW file (not in protected ``api_models.py``) so this work obeys
ADR-002 (only NEW NULLABLE additions) and the project rule that
``schemas/api_models.py`` is the single source of truth for the canonical
PeptideRow shape.

The request schema mirrors the contract that the V9-1 frontend
(``ui/src/components/drilldown/SimilarPeptidesInspector.tsx``) ships with:

    POST /api/peptides/similar
      Body:     { reference_id, k?, dataset_id? }
      Response: { reference_id, results: [{peptide, distance}], method, elapsed_ms }
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class FindSimilarRequest(BaseModel):
    """Body for ``POST /api/peptides/similar``.

    Strict (ADR-002): unknown fields produce 422 instead of being silently
    dropped. Both snake_case and camelCase aliases are accepted because the
    frontend, MCP server, and pvl-py / pvl-cli clients spell things slightly
    differently.
    """

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    reference_id: str = Field(
        ...,
        validation_alias=AliasChoices("reference_id", "referenceId"),
        min_length=1,
        max_length=128,
        description="Accession / row id of the reference peptide. The reference "
        "must already be in the index (auto-indexed on ingest).",
    )
    k: int = Field(
        10,
        ge=1,
        le=100,
        description="Number of nearest neighbours to return (1-100).",
    )
    dataset_id: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("dataset_id", "datasetId"),
        max_length=128,
        description="Restrict the search to a single dataset by id. Omit to "
        "search across every dataset currently indexed.",
    )


class SimilarPeptideResult(BaseModel):
    """One row of the similarity-search response.

    ``peptide`` is intentionally typed as a free-form dict rather than the
    full ``PeptideRow`` because the vector store keeps a narrow subset of
    fields (the ones the UI's classification pills use); the route synthesizes
    a partial PeptideRow shape that the frontend's type system tolerates via
    ``extra="allow"``. Returning a strict ``PeptideRow`` would force the
    vector store to mirror the entire schema.
    """

    model_config = ConfigDict(extra="forbid")

    peptide: Dict[str, Any] = Field(
        ...,
        description="Peptide fields in canonical PVL camelCase. Always includes "
        "id + sequence; classification flags are present iff the peptide had "
        "them at index time.",
    )
    distance: float = Field(
        ...,
        description="Embedding distance — lower means more similar. Cosine on "
        "L2-normalized vectors so the value is in [0, 2].",
    )


class FindSimilarResponse(BaseModel):
    """Response for ``POST /api/peptides/similar``."""

    model_config = ConfigDict(extra="forbid")

    reference_id: str = Field(..., description="Echoed reference_id from the request.")
    results: List[SimilarPeptideResult] = Field(
        default_factory=list,
        description="Up to k results, sorted by distance ascending. Empty list "
        "when the reference is not in the index OR when the index is disabled.",
    )
    method: str = Field(
        ...,
        description="Identifier for the embedding pipeline that produced the "
        "result (e.g. 'lancedb+local-minilm'). Useful for citing reproducibility.",
    )
    elapsed_ms: int = Field(
        ...,
        ge=0,
        description="Wall-clock time the route spent on the similarity search, in milliseconds.",
    )


__all__ = [
    "FindSimilarRequest",
    "FindSimilarResponse",
    "SimilarPeptideResult",
]
