"""
Peleg FIX-001 — 4-category classification tests.

Source: docs/active/PELEG_FEEDBACK_INSTRUCTIONS.md (Tier 0, slides 27-30).

The four canonical categories are:
    1. Helix    — S4PRED predicts helix segments meeting the configured thresholds.
    2. FF-Helix — Helix AND uH > uH-threshold (uses uH, NOT hydrophobicity).
    3. SSW      — TANGO OR S4PRED predicts a structural switch (Peleg: must be OR).
    4. FF-SSW   — SSW AND hydrophobicity > hydrophobicity-threshold
                  (uses hydrophobicity, NOT uH).

Tests verify:
    - Each flag is computable independently per peptide.
    - The vectorised DataFrame application (apply_ff_flags) and the per-row
      reference helper (compute_4category_flags) agree.
    - Single-sequence and batch inputs produce identical results.
    - The SSW logic is OR (TANGO OR S4PRED), never AND.
    - FF-Helix uses the uH threshold; FF-SSW uses the hydrophobicity threshold.
"""

from typing import Optional

import pandas as pd
import pytest

from auxiliary import compute_4category_flags, compute_ssw_combined_flag
from services.dataframe_utils import apply_ff_flags

# ---------------------------------------------------------------------------
# Fixture builders
# ---------------------------------------------------------------------------


def _row(
    *,
    sequence: str = "AAAAAAAAAA",
    hydrophobicity: Optional[float] = None,
    helix_uH: Optional[float] = None,
    helix_pred: Optional[int] = None,
    helix_score: Optional[float] = None,
    helix_fragments: Optional[list] = None,
    tango_ssw: Optional[int] = None,
    s4pred_ssw: Optional[int] = None,
    full_uH: Optional[float] = 0.1,
    beta_uH: Optional[float] = 0.1,
) -> dict:
    """Build a single DataFrame row with all columns apply_ff_flags reads."""
    return {
        "Sequence": sequence,
        "Hydrophobicity": hydrophobicity,
        "Full length uH": full_uH,
        "Beta full length uH": beta_uH,
        "Helix prediction (S4PRED)": helix_pred,
        "Helix (s4pred) uH": helix_uH,
        "Helix score (S4PRED)": helix_score,
        "Helix fragments (S4PRED)": helix_fragments if helix_fragments is not None else [],
        "SSW prediction": tango_ssw,
        "SSW prediction (S4PRED)": s4pred_ssw,
        "SSW diff": -0.1 if tango_ssw == 1 else None,
        "SSW score": None,
        "SSW helix percentage": None,
        "SSW beta percentage": None,
    }


def _df(rows: list) -> pd.DataFrame:
    return pd.DataFrame(rows)


# Custom thresholds used to make assertions deterministic without relying on
# data-average computation across rows.
CUSTOM_THRESHOLDS = {
    "muHCutoff": 0.4,  # FF-Helix uH threshold
    "hydroCutoff": 0.5,  # FF-SSW hydrophobicity threshold
    "ffHelixPercentThreshold": 50.0,
}


def _apply(df: pd.DataFrame) -> pd.DataFrame:
    apply_ff_flags(df, resolved_thresholds=CUSTOM_THRESHOLDS, threshold_mode="custom")
    return df


# ---------------------------------------------------------------------------
# 1) Helper: compute_ssw_combined_flag (TANGO OR S4PRED)
# ---------------------------------------------------------------------------


class TestSswCombinedFlag:
    """Peleg: SSW classification is TANGO OR S4PRED, never AND."""

    @pytest.mark.parametrize(
        "tango,s4pred,expected",
        [
            (1, 1, 1),  # both positive → SSW
            (1, -1, 1),  # TANGO only → SSW (OR)
            (-1, 1, 1),  # S4PRED only → SSW (OR — the headline fix)
            (1, None, 1),  # TANGO positive, S4PRED missing → SSW
            (None, 1, 1),  # TANGO missing, S4PRED positive → SSW
            (-1, -1, -1),  # both negative → not SSW
            (-1, None, -1),  # only TANGO has data and is negative → not SSW
            (None, -1, -1),  # only S4PRED has data and is negative → not SSW
            (None, None, None),  # neither provider produced data → unknown
        ],
    )
    def test_or_logic(self, tango, s4pred, expected):
        assert compute_ssw_combined_flag(tango, s4pred) == expected


# ---------------------------------------------------------------------------
# 2) Per-peptide reference helper
# ---------------------------------------------------------------------------


class TestCompute4CategoryFlags:
    """Per-row reference for the 4 categories."""

    def test_helix_only_below_uH_threshold_is_not_ff_helix(self):
        flags = compute_4category_flags(
            helix_pred=1,
            helix_uH=0.30,  # below uH threshold
            helix_uH_threshold=0.40,
            tango_ssw=-1,
            s4pred_ssw=-1,
            hydrophobicity=0.10,
            hydro_threshold=0.50,
        )
        assert flags == {"helix": 1, "ffHelix": -1, "ssw": -1, "ffSsw": -1}

    def test_helix_with_high_uH_is_ff_helix(self):
        flags = compute_4category_flags(
            helix_pred=1,
            helix_uH=0.60,
            helix_uH_threshold=0.40,
            tango_ssw=-1,
            s4pred_ssw=-1,
            hydrophobicity=0.10,
            hydro_threshold=0.50,
        )
        assert flags["helix"] == 1
        assert flags["ffHelix"] == 1
        assert flags["ssw"] == -1
        assert flags["ffSsw"] == -1

    def test_ssw_via_tango_only(self):
        flags = compute_4category_flags(
            helix_pred=-1,
            helix_uH=None,
            helix_uH_threshold=0.40,
            tango_ssw=1,
            s4pred_ssw=-1,
            hydrophobicity=0.20,  # below hydro threshold
            hydro_threshold=0.50,
        )
        assert flags["ssw"] == 1
        assert flags["ffSsw"] == -1  # SSW true, but hydro below threshold

    def test_ssw_via_s4pred_only_OR_logic(self):
        """The headline OR fix: S4PRED-only positive must yield SSW=1."""
        flags = compute_4category_flags(
            helix_pred=-1,
            helix_uH=None,
            helix_uH_threshold=0.40,
            tango_ssw=-1,
            s4pred_ssw=1,
            hydrophobicity=0.80,
            hydro_threshold=0.50,
        )
        assert flags["ssw"] == 1
        assert flags["ffSsw"] == 1

    def test_ff_ssw_uses_hydrophobicity_not_uH(self):
        """FF-SSW must check hydrophobicity, NOT uH."""
        # uH high but hydrophobicity low → FF-SSW must be -1
        flags_low_hydro = compute_4category_flags(
            helix_pred=-1,
            helix_uH=None,
            helix_uH_threshold=0.40,
            tango_ssw=1,
            s4pred_ssw=None,
            hydrophobicity=0.10,
            hydro_threshold=0.50,
        )
        assert flags_low_hydro["ffSsw"] == -1

        # uH low but hydrophobicity high → FF-SSW must be 1
        flags_high_hydro = compute_4category_flags(
            helix_pred=-1,
            helix_uH=None,
            helix_uH_threshold=0.40,
            tango_ssw=1,
            s4pred_ssw=None,
            hydrophobicity=0.90,
            hydro_threshold=0.50,
        )
        assert flags_high_hydro["ffSsw"] == 1

    def test_ff_helix_uses_uH_not_hydrophobicity(self):
        """FF-Helix must check uH, NOT hydrophobicity."""
        # hydrophobicity high but uH low → FF-Helix must be -1
        flags = compute_4category_flags(
            helix_pred=1,
            helix_uH=0.10,
            helix_uH_threshold=0.40,
            tango_ssw=None,
            s4pred_ssw=None,
            hydrophobicity=0.99,
            hydro_threshold=0.50,
        )
        assert flags["ffHelix"] == -1

    def test_no_provider_data_yields_none(self):
        flags = compute_4category_flags(
            helix_pred=None,
            helix_uH=None,
            helix_uH_threshold=0.40,
            tango_ssw=None,
            s4pred_ssw=None,
            hydrophobicity=None,
            hydro_threshold=0.50,
        )
        assert flags == {
            "helix": None,
            "ffHelix": None,
            "ssw": None,
            "ffSsw": None,
        }


# ---------------------------------------------------------------------------
# 3) DataFrame application (apply_ff_flags) — must match per-row reference
# ---------------------------------------------------------------------------


class TestApplyFFFlagsCategories:
    """Vectorised flag application across realistic rows."""

    def test_helix_only_below_uH_is_not_ff_helix(self):
        df = _df(
            [
                _row(
                    helix_pred=1,
                    helix_uH=0.30,
                    helix_score=0.7,
                    helix_fragments=[[1, 6]],
                    tango_ssw=-1,
                    s4pred_ssw=-1,
                    hydrophobicity=0.10,
                ),
            ]
        )
        _apply(df)
        # helix flag itself is consumed via Helix prediction (S4PRED) (= 1)
        assert df.iloc[0]["FF-Helix (Jpred)"] == -1
        assert df.iloc[0]["FF-Secondary structure switch"] == -1

    def test_ssw_only_via_s4pred_or_logic(self):
        df = _df(
            [
                _row(
                    helix_pred=-1,
                    helix_uH=None,
                    tango_ssw=-1,
                    s4pred_ssw=1,
                    hydrophobicity=0.80,
                ),
            ]
        )
        _apply(df)
        # SSW is 1 (S4PRED-only positive — the OR fix). FF-SSW = 1 since hydro >= 0.5.
        assert df.iloc[0]["FF-Secondary structure switch"] == 1

    def test_ssw_only_via_tango(self):
        df = _df(
            [
                _row(
                    helix_pred=-1,
                    helix_uH=None,
                    tango_ssw=1,
                    s4pred_ssw=-1,
                    hydrophobicity=0.80,
                ),
            ]
        )
        _apply(df)
        assert df.iloc[0]["FF-Secondary structure switch"] == 1

    def test_full_4category_positive_peptide(self):
        df = _df(
            [
                _row(
                    helix_pred=1,
                    helix_uH=0.60,
                    helix_score=0.9,
                    helix_fragments=[[1, 8]],
                    tango_ssw=1,
                    s4pred_ssw=1,
                    hydrophobicity=0.80,
                ),
            ]
        )
        _apply(df)
        assert df.iloc[0]["FF-Helix (Jpred)"] == 1
        assert df.iloc[0]["FF-Secondary structure switch"] == 1

    def test_full_4category_negative_peptide(self):
        df = _df(
            [
                _row(
                    helix_pred=-1,
                    helix_uH=None,
                    tango_ssw=-1,
                    s4pred_ssw=-1,
                    hydrophobicity=0.10,
                ),
            ]
        )
        _apply(df)
        assert df.iloc[0]["FF-Helix (Jpred)"] == -1
        assert df.iloc[0]["FF-Secondary structure switch"] == -1

    def test_no_provider_data_yields_none_flags(self):
        df = _df(
            [
                _row(
                    helix_pred=None,
                    helix_uH=None,
                    tango_ssw=None,
                    s4pred_ssw=None,
                    hydrophobicity=None,
                ),
            ]
        )
        # No SSW provider columns at all is the strict None case;
        # here both columns exist with None values, which still has no data.
        _apply(df)
        assert df.iloc[0]["FF-Helix (Jpred)"] is None
        assert df.iloc[0]["FF-Secondary structure switch"] is None


# ---------------------------------------------------------------------------
# 4) Single-vs-batch consistency
# ---------------------------------------------------------------------------


class TestSingleBatchConsistency:
    """A peptide must produce identical flags whether evaluated alone or in a batch."""

    def test_s4pred_only_ssw_consistent(self):
        row = _row(
            helix_pred=-1,
            tango_ssw=-1,
            s4pred_ssw=1,
            hydrophobicity=0.80,
        )
        single = _df([row])
        _apply(single)

        batch = _df([row, _row(tango_ssw=-1, s4pred_ssw=-1, hydrophobicity=0.10)])
        _apply(batch)

        assert (
            single.iloc[0]["FF-Secondary structure switch"]
            == batch.iloc[0]["FF-Secondary structure switch"]
        )
