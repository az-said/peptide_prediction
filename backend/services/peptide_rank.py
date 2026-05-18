"""Server-side peptide ranking engine — Python port of ``ui/src/lib/ranking.ts``.

Wave 2 §I: the MCP ``rank_candidates`` tool and the future pvl-py
``pvl.rank(df)`` call both need a single source of truth for "rank N
peptides by composite signal". The frontend already has the canonical
implementation; this module mirrors it line-for-line so the same input
produces the same scores in either place.

If you change anything here, change ``ui/src/lib/ranking.ts`` in the same
PR — the contract is "frontend and backend agree byte-for-byte on the
rounded score for the same input". Tests in ``test_peptide_rank_service.py``
pin a handful of golden cases against the TS reference.

Peleg FIX-024 (2026-04):
- ``tangoAggMax`` moved out of default metrics ("should NOT be in the
  default ranking").
- ``hydrophobicity`` promoted into defaults ("MUST be a default metric").
- ``helix`` preset added.

PELEG-Q1-RESOLVED + PELEG-SSW-SCORE-RESOLVED (2026-05-06):
- ``ffHelixPercent`` (Chou-Fasman) and ``sswScore`` demoted from default →
  optional. They stay on the metric union for back-compat with persisted
  state but no preset weights them.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

# Metric union — MUST match ``RankingMetric`` in
# ``backend/schemas/peptides.py`` and ``ui/src/lib/ranking.ts``.
ALL_METRICS: Tuple[str, ...] = (
    "tangoAggMax",
    "s4predHelixPercent",
    "ffHelixPercent",
    "muH",
    "sswScore",
    "hydrophobicity",
    "absCharge",
)

# Default 3-metric set (Peleg FIX-024). Optional metrics live in the union
# but no preset weights them — surfaced for explicit custom-weights callers.
DEFAULT_METRICS: Tuple[str, ...] = ("s4predHelixPercent", "muH", "hydrophobicity")
OPTIONAL_METRICS: Tuple[str, ...] = ("tangoAggMax", "absCharge", "ffHelixPercent", "sswScore")

# Metrics that REQUIRE the TANGO predictor to have run. When
# ``tango_available=False``, these are dropped from the active set BEFORE
# weight redistribution — same gating as the frontend.
TANGO_GATED: Tuple[str, ...] = ("sswScore", "tangoAggMax")

# Direction = "high" means "higher raw value → higher score"; "low" inverts.
# Default for every metric is "high"; presets can override per metric.
DEFAULT_DIRECTION = "high"

# Preset weights — copies of the TS PRESETS object. Each preset's weights
# sum to 100 over the 3 default metrics + S4PRED.
PRESETS: Dict[str, Dict[str, float]] = {
    "equal": {
        "s4predHelixPercent": 34.0,
        "muH": 33.0,
        "hydrophobicity": 33.0,
    },
    "amyloid": {  # UI label: "Fibril-formation Focus"
        "muH": 40.0,
        "hydrophobicity": 40.0,
        "s4predHelixPercent": 20.0,
    },
    "helix": {
        "s4predHelixPercent": 50.0,
        "muH": 30.0,
        "hydrophobicity": 20.0,
    },
    "switch": {
        "s4predHelixPercent": 40.0,
        "muH": 30.0,
        "hydrophobicity": 30.0,
    },
}

# Human-readable labels — used to render the ``reasons`` list on each
# ranked-peptide response. Kept here so the backend-emitted reason strings
# match the UI's labels exactly (the LLM-facing MCP response sees these).
METRIC_LABELS: Dict[str, str] = {
    "tangoAggMax": "TANGO Aggregation Max",
    "s4predHelixPercent": "S4PRED Helix %",
    "ffHelixPercent": "FF-Helix %",
    "muH": "uH",
    "sswScore": "SSW Score",
    "hydrophobicity": "Hydrophobicity",
    "absCharge": "|Charge|",
}


def _extract_metric(peptide: Dict[str, Any], metric: str) -> Optional[float]:
    """Pull a numeric metric out of a peptide dict, returning None if missing.

    Mirrors the TypeScript ``extractMetric`` switch including the
    ``absCharge = abs(charge)`` derivation.
    """
    if metric == "absCharge":
        charge = peptide.get("charge")
        if charge is None:
            return None
        try:
            return abs(float(charge))
        except (TypeError, ValueError):
            return None

    value = peptide.get(metric)
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    # NaN / inf are not usable for percentile math; treat as missing.
    if f != f or f in (float("inf"), float("-inf")):
        return None
    return f


def compute_percentile_rank(value: float, all_values: List[float]) -> float:
    """Percentile rank: (count of values ≤ value) / total * 100.

    Edge cases mirrored from the TS implementation:
    - Single-element list (or empty) → 50 (no relative ordering possible).
    - All identical values → 50 for everyone.
    """
    n = len(all_values)
    if n <= 1:
        return 50.0
    count_below = sum(1 for v in all_values if v <= value)
    return (count_below / n) * 100.0


def redistribute_weights(weights: Dict[str, float], active_metrics: List[str]) -> Dict[str, float]:
    """Scale active-metric weights so they sum to 100.

    Mirrors the TS ``redistributeWeights`` — including the equal-fallback
    when every active weight is zero (or the input is silently malformed).
    """
    if not active_metrics:
        return {}
    raw = {m: float(weights.get(m, 0) or 0) for m in active_metrics}
    total = sum(raw.values())
    if total <= 0:
        even = 100.0 / len(active_metrics)
        return dict.fromkeys(active_metrics, even)
    scale = 100.0 / total
    return {m: raw[m] * scale for m in active_metrics}


def _peptide_id(peptide: Dict[str, Any]) -> str:
    """Return a usable id for sort/echo even if some intake skipped 'id'."""
    return str(peptide.get("id") or peptide.get("Entry") or peptide.get("accession") or "")


def _format_domain_reason(
    peptide: Dict[str, Any], metric: str, percentile: float
) -> Optional[str]:
    """Render one domain-grounded reason string for a metric on a peptide.

    Per the §I dispatch, reason strings cite the actual data value (e.g.
    "High FF-Helix coverage (78%)") rather than the percentile rank. The
    ``percentile`` argument is still useful — it tells us whether to call
    the value "High"/"Low" and whether to include the row at all (we drop
    middle-percentile metrics because they're not contributors).
    """
    raw = _extract_metric(peptide, metric)
    if raw is None:
        return None

    high = percentile >= 60.0
    low = percentile <= 40.0
    if not (high or low):
        # Middle-of-the-pack — not a meaningful contributor.
        return None
    qualifier = "High" if high else "Low"

    # Per-metric domain-grounded copy. Numbers are formatted in the unit
    # the researcher recognises (% for the helix-fraction metrics, raw
    # value for the rest).
    if metric == "ffHelixPercent":
        return f"{qualifier} FF-Helix coverage ({raw:.0f}%)"
    if metric == "s4predHelixPercent":
        return f"{qualifier} S4PRED helix coverage ({raw:.0f}%)"
    if metric == "muH":
        return f"{qualifier} hydrophobic moment uH ({raw:.2f})"
    if metric == "hydrophobicity":
        return f"{qualifier} hydrophobicity ({raw:.2f})"
    if metric == "tangoAggMax":
        return f"{qualifier} TANGO aggregation peak ({raw:.1f})"
    if metric == "sswScore":
        return f"{qualifier} SSW score ({raw:.2f})"
    if metric == "absCharge":
        return f"{qualifier} absolute charge (|q|={raw:.1f})"
    label = METRIC_LABELS.get(metric, metric)
    return f"{qualifier} {label} ({raw})"


def _build_reasons(
    peptide: Dict[str, Any],
    metric_percentiles: Dict[str, Optional[float]],
    effective_weights: Dict[str, float],
    top_k: int = 3,
) -> List[str]:
    """Domain-grounded contributors to the composite score (top-K only).

    Ranked by ``weight * |percentile - 50|`` so a strong outlier (very
    high OR very low) in a heavily-weighted metric beats a moderate
    high-percentile rank. The §I dispatch wants short, scientifically
    grounded one-liners — the LLM surfacing these to a researcher should
    see "High FF-Helix coverage (78%)", not "p87".
    """
    scored: List[Tuple[str, float, float]] = []
    for metric, pct in metric_percentiles.items():
        if pct is None:
            continue
        weight = effective_weights.get(metric, 0.0)
        if weight <= 0:
            continue
        # Strength = distance from "average" (50th percentile) scaled by weight.
        # A 100th-percentile metric and a 0th-percentile metric are equally
        # informative; both should appear in the reasons.
        strength = weight * abs(pct - 50.0)
        scored.append((metric, strength, pct))
    scored.sort(key=lambda x: x[1], reverse=True)

    reasons: List[str] = []
    for metric, _, pct in scored:
        if len(reasons) >= top_k:
            break
        reason = _format_domain_reason(peptide, metric, pct)
        if reason is not None:
            reasons.append(reason)
    return reasons


def rank_peptides(
    peptides: List[Dict[str, Any]],
    *,
    preset: str = "equal",
    weights: Optional[Dict[str, float]] = None,
    tango_available: bool = True,
    directions: Optional[Dict[str, str]] = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """Rank ``peptides`` by composite signal; return the top-N + breakdown.

    Returns a dict matching ``RankResponse``: ``results`` (top_n list of
    ``{peptide, score, metric_percentiles, reasons}``), ``preset``,
    ``effective_weights``, ``total_candidates``.

    The implementation mirrors ``ui/src/lib/ranking.ts`` step-for-step:
    1. Resolve weights from preset (when ``weights`` is None).
    2. Drop TANGO-gated metrics if ``tango_available=False``.
    3. Drop metrics with zero/missing weight.
    4. Compute percentile rank per metric over the FULL candidate pool.
    5. Invert percentiles when direction is "low".
    6. Composite = weighted average of adjusted percentiles, normalised
       per peptide (a peptide that's missing one metric is scored on the
       metrics it does have, with its weight-sum reduced accordingly).
    7. Sort descending by composite, truncate to top_n.
    """
    if preset not in PRESETS:
        raise ValueError(f"Unknown ranking preset: {preset!r}. Valid: {sorted(PRESETS.keys())}.")

    raw_weights: Dict[str, float] = dict(weights) if weights is not None else dict(PRESETS[preset])

    requested = [m for m in ALL_METRICS if raw_weights.get(m, 0) > 0]
    active = [m for m in requested if tango_available or m not in TANGO_GATED]
    effective_weights = redistribute_weights(raw_weights, active)

    if not active:
        # All metrics gated out. Return empty rankings rather than crash —
        # caller can switch tango_available / pick a different preset.
        return {
            "results": [],
            "preset": preset,
            "effective_weights": effective_weights,
            "total_candidates": len(peptides),
        }

    metric_values: Dict[str, List[float]] = {}
    for m in active:
        metric_values[m] = [v for v in (_extract_metric(p, m) for p in peptides) if v is not None]

    dirs: Dict[str, str] = directions or {}

    rows: List[Dict[str, Any]] = []
    for peptide in peptides:
        percentiles: Dict[str, Optional[float]] = {}
        for m in ALL_METRICS:
            if m not in active:
                percentiles[m] = None
                continue
            value = _extract_metric(peptide, m)
            if value is None:
                percentiles[m] = None
                continue
            pct = compute_percentile_rank(value, metric_values[m])
            if dirs.get(m, DEFAULT_DIRECTION) == "low":
                pct = 100.0 - pct
            percentiles[m] = pct

        weighted_sum = 0.0
        weight_sum = 0.0
        for m in active:
            pct = percentiles.get(m)
            w = effective_weights.get(m, 0.0)
            if pct is None or w <= 0:
                continue
            weighted_sum += w * pct
            weight_sum += w
        composite = weighted_sum / weight_sum if weight_sum > 0 else 50.0
        # §I dispatch reports score in [0, 1] (example: ``score: 0.875``).
        # Round at API boundary to avoid floating-point noise dominating
        # JSON diffs in golden tests.
        score = round(composite / 100.0, 4)

        rows.append(
            {
                "peptide": peptide,
                "score": score,
                "metric_percentiles": percentiles,
                "reasons": _build_reasons(peptide, percentiles, effective_weights),
            }
        )

    rows.sort(key=lambda r: (-r["score"], _peptide_id(r["peptide"])))
    truncated = rows[: max(0, int(top_n))]

    return {
        "results": truncated,
        "preset": preset,
        "effective_weights": effective_weights,
        "total_candidates": len(peptides),
    }


__all__ = [
    "ALL_METRICS",
    "DEFAULT_METRICS",
    "METRIC_LABELS",
    "OPTIONAL_METRICS",
    "PRESETS",
    "TANGO_GATED",
    "compute_percentile_rank",
    "rank_peptides",
    "redistribute_weights",
]
