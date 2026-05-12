"""Math-layer tests for ``services.peptide_compare`` — Wave 2 §I.

Pins the pure-Python chi-squared implementation against known reference
values. Skipping scipy on purpose (the §I dispatch's "scipy is transitive
via numpy" claim is wrong — scipy is a separate package), so these are
the only tests pinning the implementation correctness.
"""

from __future__ import annotations

import os

os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")

import pytest  # noqa: E402

from services import peptide_compare  # noqa: E402

# ---------------------------------------------------------------------------
# chi2_p_value — proportion comparison
# ---------------------------------------------------------------------------


def test_chi2_identical_cohorts_returns_p_one():
    """20/20 vs 20/20 → no contrast → p = 1.0."""
    p = peptide_compare.chi2_p_value(20, 20, 20, 20)
    assert p == 1.0


def test_chi2_perfect_split_returns_very_small_p():
    """20/20 positive in cohort A vs 0/20 in cohort B → maximum contrast.
    p-value should be vanishingly small (well under 0.001 → '***' marker).
    """
    p = peptide_compare.chi2_p_value(20, 20, 0, 20)
    assert p is not None
    assert p < 0.001


def test_chi2_known_2x2_table_matches_reference():
    """Reference table from a textbook 2x2 chi² example:

        positive  negative
      A   18         2
      B    8        12

    Expected χ² ≈ 11.43, p ≈ 0.00072 (well under 0.01 → '**' or '***'
    depending on the cutoff used).
    """
    p = peptide_compare.chi2_p_value(18, 20, 8, 20)
    assert p is not None
    assert 1e-5 < p < 0.01
    assert peptide_compare._significance_marker(p) in ("**", "***")


def test_chi2_handles_empty_cohort_with_none():
    assert peptide_compare.chi2_p_value(0, 0, 5, 10) is None
    assert peptide_compare.chi2_p_value(5, 10, 0, 0) is None


def test_chi2_returns_one_when_both_cohorts_all_positive():
    """No within-cohort contrast → no test power → no-difference report."""
    p = peptide_compare.chi2_p_value(10, 10, 7, 7)
    assert p == 1.0


# ---------------------------------------------------------------------------
# Significance marker mapping
# ---------------------------------------------------------------------------


def test_significance_marker_thresholds():
    """The §I dispatch fixes the marker thresholds at 0.001 / 0.01 / 0.05."""
    assert peptide_compare._significance_marker(0.0005) == "***"
    assert peptide_compare._significance_marker(0.005) == "**"
    assert peptide_compare._significance_marker(0.03) == "*"
    assert peptide_compare._significance_marker(0.1) == "ns"
    assert peptide_compare._significance_marker(None) == "ns"


# ---------------------------------------------------------------------------
# compare_cohorts end-to-end
# ---------------------------------------------------------------------------


def _row(id_: str, **kwargs):
    base = {"id": id_, "sequence": "AAAA"}
    base.update(kwargs)
    return base


def test_compare_emits_dispatch_shape_keys():
    out = peptide_compare.compare_cohorts(
        [_row("A1")], [_row("B1")], label_a="Mut", label_b="WT"
    )
    assert set(out.keys()) == {"stats", "differences", "method", "labels"}
    assert out["method"] == "two-sided-chi2"
    assert out["labels"] == {"dataset_a": "Mut", "dataset_b": "WT"}
    assert set(out["stats"]) == {"dataset_a", "dataset_b"}


def test_compare_continuous_metrics_get_ns_significance():
    """No inferential test for continuous columns at v0.x — all 'ns'."""
    a = [_row(f"A{i}", length=10 + i, charge=0.5) for i in range(10)]
    b = [_row(f"B{i}", length=50 + i, charge=2.5) for i in range(10)]
    out = peptide_compare.compare_cohorts(a, b)
    diff_by_metric = {d["metric"]: d for d in out["differences"]}
    assert diff_by_metric["mean_length"]["significance"] == "ns"
    assert diff_by_metric["mean_charge"]["significance"] == "ns"
    # But the delta itself is computed.
    assert diff_by_metric["mean_length"]["delta"] == pytest.approx(-40.0)
