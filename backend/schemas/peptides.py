"""Request / response schemas for the ``/api/peptides/...`` routes.

Wave 2 §D — peptide similarity search:
    POST /api/peptides/similar           → FindSimilarRequest / FindSimilarResponse

Wave 2 §I — MCP backend route gaps (wires MCP tools 3/4/5 to live endpoints):
    GET  /api/peptides/{accession}       → PeptideDetailResponse
    POST /api/peptides/rank              → RankRequest / RankResponse
    POST /api/peptides/compare           → CompareRequest / CompareResponse

Kept in this file (not in protected ``api_models.py``) so the work obeys
ADR-002 (only NEW NULLABLE additions to ``api_models``) and the project
rule that ``schemas/api_models.py`` is the single source of truth for the
canonical PeptideRow shape.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

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


# ---------------------------------------------------------------------------
# Wave 2 §I — peptide detail / rank / compare schemas
# ---------------------------------------------------------------------------


class PeptideDetailResponse(BaseModel):
    """Response for ``GET /api/peptides/{accession}`` — single-peptide lookup.

    ``peptide`` is the canonical PVL camelCase shape (a dict, not strict
    PeptideRow, for the same reason as ``SimilarPeptideResult.peptide`` —
    we only mirror the narrow subset of fields the vector index actually
    stores). ``source`` lets a client know how the row was looked up — useful
    when the same id might come from analysis or from a future cached store.
    """

    model_config = ConfigDict(extra="forbid")

    accession: str = Field(..., description="Echoed peptide id / accession.")
    peptide: Dict[str, Any] = Field(
        ...,
        description="Peptide fields in canonical PVL camelCase. Always includes "
        "id + sequence; classification flags are present iff the peptide had "
        "them at index time.",
    )
    source: Literal["index"] = Field(
        "index",
        description="How the peptide was looked up. Currently always 'index' "
        "(LanceDB vector store). Future cached/durable stores will surface "
        "their own source label.",
    )


# ----- Ranking ----------------------------------------------------------------

# The metric identifiers and presets MUST stay in lockstep with
# ``ui/src/lib/ranking.ts`` — the frontend uses the same names in its
# Zustand store, and the MCP tool surface advertises the same preset list.
# Changing one without the other silently splits the ranking behaviour.
RankingMetric = Literal[
    "tangoAggMax",
    "s4predHelixPercent",
    "ffHelixPercent",
    "muH",
    "sswScore",
    "hydrophobicity",
    "absCharge",
]

# UI label is "Fibril-formation Focus" but the code key is "amyloid" — kept
# for back-compat with persisted state, matching the frontend's convention.
RankingPreset = Literal["equal", "amyloid", "helix", "switch"]


class RankRequest(BaseModel):
    """Body for ``POST /api/peptides/rank``.

    Callers must supply exactly one of ``sequences`` or ``dataset_id`` —
    ``sequences`` is the canonical path (frontend already has the rows in
    memory; pvl-py users pass a DataFrame). ``dataset_id`` short-circuits
    the round-trip by reading from the LanceDB vector index when a previous
    analysis already populated it.
    """

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    sequences: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Pre-analyzed peptide rows to rank (canonical PVL "
        "camelCase shape). Pass either this OR dataset_id, not both.",
    )
    dataset_id: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("dataset_id", "datasetId"),
        max_length=128,
        description="Server-side dataset identifier (typically the inputs "
        "hash from a prior run). Looks up rows from the vector index.",
    )
    preset: RankingPreset = Field(
        "equal",
        description="Named weight preset. 'equal' = 3 default metrics weighted "
        "equally; 'amyloid' = Fibril-formation Focus (uH + hydrophobicity); "
        "'helix' = Helix Focus (S4PRED helix-dominated); 'switch' = SSW Focus.",
    )
    weights: Optional[Dict[str, float]] = Field(
        None,
        description="Custom proportional weights map (keys are RankingMetric "
        "names, values are non-negative numbers). Overrides ``preset`` when "
        "set. Weights are normalized server-side so they don't have to sum "
        "to 100.",
    )
    top_n: int = Field(
        10,
        validation_alias=AliasChoices("top_n", "topN"),
        ge=1,
        le=1000,
        description="Number of top-scoring peptides to return (1-1000).",
    )
    tango_available: Optional[bool] = Field(
        None,
        validation_alias=AliasChoices("tango_available", "tangoAvailable"),
        description="If False, TANGO-gated metrics (tangoAggMax, sswScore) "
        "are dropped before scoring. Default: True (frontend ranking-engine "
        "default).",
    )


class RankedPeptide(BaseModel):
    """One row of the rank response — peptide + score + percentile breakdown.

    Response shape follows the §I dispatch: ``peptide``, ``score`` (in [0, 1]
    so the UI doesn't have to divide by 100), and ``reasons`` (short
    domain-grounded one-liners). ``metric_percentiles`` is retained as an
    optional debugging aid for callers that want to introspect the ranking
    math without re-running it client-side.
    """

    model_config = ConfigDict(extra="forbid")

    peptide: Dict[str, Any] = Field(
        ...,
        description="Peptide fields in canonical PVL camelCase. Echoed back so "
        "the caller doesn't have to re-join the input list by id.",
    )
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Composite score in [0, 1]. Weighted average of per-metric "
        "percentile ranks, scaled to a 0-1 range (mirrors the §I dispatch "
        "response example, e.g. ``score: 0.875``).",
    )
    metric_percentiles: Dict[str, Optional[float]] = Field(
        default_factory=dict,
        description="Per-metric percentile (0-100) used to compute the "
        "composite. None when the metric isn't available for this peptide.",
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="Short, domain-grounded one-line explanations per peptide "
        "(e.g. 'High FF-Helix coverage (78%)', 'TANGO aggregation peak at "
        "residue 24'). Deterministic — generated from threshold comparisons, "
        "never from an LLM (ADR-014 guardrail).",
    )


class RankResponse(BaseModel):
    """Response for ``POST /api/rank``.

    The ``ranked`` field is the top-N peptides sorted by composite score
    descending. ``method`` is the algorithm identifier so a peer reviewer
    can cite which scoring logic produced the result (and so we can bump
    it to ``weighted-sum-v2`` if the formula changes in a future wave).
    """

    model_config = ConfigDict(extra="forbid")

    ranked: List[RankedPeptide] = Field(
        default_factory=list,
        description="Top-N peptides sorted by ``score`` descending.",
    )
    method: str = Field(
        ...,
        description="Algorithm identifier (e.g. 'weighted-sum-v1'). Bumped "
        "when the scoring formula changes; lets clients cite the exact "
        "ranking logic that produced a result.",
    )
    elapsed_ms: int = Field(
        ...,
        ge=0,
        description="Wall-clock time the route spent computing the ranking, "
        "in milliseconds.",
    )
    preset: RankingPreset = Field(
        ...,
        description="Echoed preset (so a custom-weights call still returns "
        "the preset that would otherwise have applied).",
    )
    effective_weights: Dict[str, float] = Field(
        ...,
        description="The weights actually used to score — normalized to sum "
        "to 100 and with TANGO-gated metrics dropped when unavailable.",
    )
    total_candidates: int = Field(
        ...,
        ge=0,
        description="How many peptides were considered before truncation to "
        "top_n. Useful for paging and for UI 'showing X of N' copy.",
    )


# ----- Compare ----------------------------------------------------------------


class CompareRequest(BaseModel):
    """Body for ``POST /api/peptides/compare``."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    cohort_a: List[Dict[str, Any]] = Field(
        ...,
        validation_alias=AliasChoices("cohort_a", "cohortA", "dataset_a", "datasetA"),
        min_length=1,
        description="First cohort: list of peptide rows (PVL camelCase). At "
        "least one row required so the stats have something to compute on.",
    )
    cohort_b: List[Dict[str, Any]] = Field(
        ...,
        validation_alias=AliasChoices("cohort_b", "cohortB", "dataset_b", "datasetB"),
        min_length=1,
        description="Second cohort. Same shape as cohort_a.",
    )
    label_a: str = Field(
        "Cohort A",
        validation_alias=AliasChoices("label_a", "labelA"),
        max_length=64,
        description="Display label for cohort A in the response.",
    )
    label_b: str = Field(
        "Cohort B",
        validation_alias=AliasChoices("label_b", "labelB"),
        max_length=64,
        description="Display label for cohort B in the response.",
    )


SignificanceMarker = Literal["ns", "*", "**", "***"]


class CohortFlatStats(BaseModel):
    """Flat per-cohort stat block — matches the §I dispatch shape.

    Class fractions are exposed as floats in [0, 1] (not percent) so the
    UI multiplies by 100 once at render time. ``n`` is the cohort size.
    Biochem values are mean over rows that had the column non-null; ``None``
    when nothing was observed (cleaner than reporting 0 for missing data).
    """

    model_config = ConfigDict(extra="forbid")

    n: int = Field(..., ge=0, description="Cohort size (row count).")
    helix_pct: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Fraction of observed peptides classified as Helix.",
    )
    ff_helix_pct: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Fraction classified as FF-Helix."
    )
    ssw_pct: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Fraction classified as Secondary Structure Switch.",
    )
    ff_ssw_pct: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Fraction classified as FF-SSW."
    )
    mean_length: Optional[float] = None
    mean_charge: Optional[float] = None
    mean_hydrophobicity: Optional[float] = None
    mean_mu_h: Optional[float] = None


class CompareDifference(BaseModel):
    """One row of the ``differences`` array — per-metric delta + significance.

    ``direction`` is ``"a>b"`` / ``"b>a"`` / ``"="`` so the UI can render
    "↑ Mut +12%" copy without comparing the delta to zero itself.
    ``significance`` is computed via chi-squared (proportion metrics) or
    paired-means difference (continuous metrics) — see
    ``services/peptide_compare.py``.
    """

    model_config = ConfigDict(extra="forbid")

    metric: str = Field(
        ...,
        description="Metric name (e.g. 'ff_helix_pct', 'mean_length').",
    )
    delta: Optional[float] = Field(
        None,
        description="Signed difference a - b. None when either side missing.",
    )
    direction: Literal["a>b", "b>a", "="] = Field(
        "=",
        description="Sign of the delta as a short label.",
    )
    significance: SignificanceMarker = Field(
        "ns",
        description="Statistical significance marker. 'ns' = not significant "
        "(p ≥ 0.05); '*' = p < 0.05; '**' = p < 0.01; '***' = p < 0.001. "
        "Computed via two-sided chi² for proportions; for continuous "
        "metrics we report 'ns' (no inferential test at v0.x).",
    )


class CompareResponse(BaseModel):
    """Response for ``POST /api/compare``.

    Top-level shape follows the §I dispatch:
        { stats: { dataset_a, dataset_b }, differences: [...], method }

    Labels (cohort A / cohort B / custom strings) are echoed inside each
    stats sub-block so the UI doesn't have to thread them through state.
    """

    model_config = ConfigDict(extra="forbid")

    stats: Dict[str, CohortFlatStats] = Field(
        ...,
        description="Per-cohort stats keyed by 'dataset_a' / 'dataset_b' "
        "(matches the §I dispatch example). Each value is a flat numeric "
        "block — no nested classes/biochem objects (the dispatch shape is "
        "intentionally flat for easy CSV export).",
    )
    differences: List[CompareDifference] = Field(
        default_factory=list,
        description="Per-metric deltas with significance markers. One entry "
        "per comparable metric; the UI renders these as a sortable table.",
    )
    method: str = Field(
        ...,
        description="Algorithm identifier (e.g. 'two-sided-chi2'). Bumped "
        "when the significance test changes.",
    )
    labels: Dict[str, str] = Field(
        ...,
        description="Display labels for the two cohorts ({'dataset_a': "
        "'Mut', 'dataset_b': 'WT'}). The UI threads these into chart titles.",
    )


__all__ = [
    "CohortFlatStats",
    "CompareDifference",
    "CompareRequest",
    "CompareResponse",
    "FindSimilarRequest",
    "FindSimilarResponse",
    "PeptideDetailResponse",
    "RankRequest",
    "RankResponse",
    "RankedPeptide",
    "RankingMetric",
    "RankingPreset",
    "SignificanceMarker",
    "SimilarPeptideResult",
]
