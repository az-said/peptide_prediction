"""
Canonical Helix % regression tests.

Locks the contract from docs/active/HELIX_PERCENTAGE_AUDIT.md:
- "Helix %" everywhere user-facing == segment-based S4PRED helix percentage
- API field `s4predHelixPercent` (alias 'Helix percentage (S4PRED)') == output
  of `s4pred._get_segment_percentage(helix_segments, sequence_length)`
- Missing S4PRED data surfaces as None, never silently 0.

If any of these tests fail, the canonical Helix % is no longer the segment-based
S4PRED metric — re-read PELEG_FEEDBACK_INSTRUCTIONS.md PELEG-CRITICAL-001 before
"fixing" the assertion.
"""

import os
from typing import Any, Dict

# Backend tests must boot the app with predictors disabled (per backend/CLAUDE.md).
os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")

import s4pred
from services.normalize import normalize_rows_for_ui


def _make_prediction(p_h, p_e=None, p_c=None) -> Dict[str, Any]:
    """Build a minimal S4PRED prediction dict for analyse_s4pred_result."""
    n = len(p_h)
    return {
        "P_H": list(p_h),
        "P_E": list(p_e) if p_e is not None else [0.0] * n,
        "P_C": list(p_c) if p_c is not None else [max(0.0, 1.0 - h) for h in p_h],
    }


# ---------------------------------------------------------------------
# 1. Segment-based arithmetic — the canonical formula
# ---------------------------------------------------------------------
def test_segment_percentage_arithmetic_known_input():
    """`_get_segment_percentage` is exactly sum(seg_lengths)/length * 100, rounded to 2 dp."""
    # Length 20, segments [(0, 4), (10, 16)] → 5 + 7 = 12 residues in segments → 60%
    segments = [(0, 4), (10, 16)]
    pct = s4pred._get_segment_percentage(segments, 20)
    assert pct == 60.0, f"expected 60.0, got {pct}"

    # Length 23, segments [(2, 8)] → 7/23 * 100 = 30.4347... → rounded to 30.43
    pct = s4pred._get_segment_percentage([(2, 8)], 23)
    assert pct == 30.43, f"expected 30.43, got {pct}"

    # No segments → 0 (not None — Peleg's reference returns 0 when no helix found)
    assert s4pred._get_segment_percentage([], 20) == 0
    # Zero-length sequence → 0 (degenerate but must not divide by zero)
    assert s4pred._get_segment_percentage([(0, 4)], 0) == 0


# ---------------------------------------------------------------------
# 2. End-to-end: HELIX_PERCENTAGE_S4PRED column == _get_segment_percentage
# ---------------------------------------------------------------------
def test_api_field_matches_compute_site_for_helix_segment():
    """`analyse_s4pred_result()['Helix percentage (S4PRED)']` == _get_segment_percentage(helix_segments, n)."""
    # 20 residues; helix segment from positions 1..7 (mean P_H ≥ 0.5, length ≥ 5)
    p_h = [0.0] + [0.8, 0.9, 0.85, 0.8, 0.75, 0.7, 0.7] + [0.0] * 12
    result = s4pred.analyse_s4pred_result(_make_prediction(p_h))

    helix_segments = result[s4pred.HELIX_FRAGMENTS_S4PRED]
    expected = s4pred._get_segment_percentage(helix_segments, len(p_h))

    assert result[s4pred.HELIX_PERCENTAGE_S4PRED] == expected
    assert result[s4pred.HELIX_PERCENTAGE_S4PRED] > 0


# ---------------------------------------------------------------------
# 3. Null surfaces as null in the API — never silently 0
# ---------------------------------------------------------------------
def test_s4pred_helix_percent_is_null_when_provider_unavailable():
    """When the row has no S4PRED data, the API field `s4predHelixPercent` must be None.

    `services.normalize.normalize_response` is the boundary that converts the
    backend DataFrame rows into the API JSON. If it ever silently substitutes 0
    for missing S4PRED data the audit's #3 fix regresses.
    """
    import pandas as pd

    df = pd.DataFrame(
        [
            {
                "Entry": "P00001",
                "Sequence": "GIGAVLKVLTTGLPALISWIKRKRQQ",
                "Hydrophobicity": 0.42,
                "Full length uH": 0.51,
                "Charge": 5.0,
                "Helix percentage (S4PRED)": None,  # provider unavailable
                "FF-Helix %": 0.0,
            }
        ]
    )

    rows = normalize_rows_for_ui(df, is_single_row=False)
    assert isinstance(rows, list) and len(rows) == 1
    row = rows[0]

    # Must be None — not 0, not -1, not "N/A".
    assert row.get("s4predHelixPercent") is None, (
        f"expected None for missing S4PRED, got {row.get('s4predHelixPercent')!r}"
    )


# ---------------------------------------------------------------------
# 4. Probability mean ≠ canonical helix %
# ---------------------------------------------------------------------
def test_probability_mean_is_not_the_canonical_helix_percent():
    """The mean of P(H) is a different metric. The canonical value is segment-based.

    A sequence can have mean P(H) ≈ 0.45 (high probability mean) but
    segment-based helix % = 0 if no run of ≥5 residues clears the 0.5 threshold.
    The two values must be allowed to diverge — if they ever match by accident
    that's fine, but the canonical metric is segment-based.
    """
    # All residues at 0.45 — never clears the 0.5 threshold for a valid segment
    p_h = [0.45] * 20
    result = s4pred.analyse_s4pred_result(_make_prediction(p_h))

    canonical = result[s4pred.HELIX_PERCENTAGE_S4PRED]
    probability_mean_pct = (sum(p_h) / len(p_h)) * 100  # 45.0

    assert canonical == 0, (
        f"segment-based helix should be 0 (no segment clears threshold), got {canonical}"
    )
    assert probability_mean_pct == 45.0
    assert canonical != probability_mean_pct, (
        "probability mean and canonical helix % accidentally collided — "
        "test fixture no longer exercises the audit's invariant"
    )
