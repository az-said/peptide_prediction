"""Tests for ``services.peptide_rank`` — Python port of ranking.ts (Wave 2 §I).

Pins the math layer (percentile rank, weight redistribution, composite
score, reasons synthesis) independently of the HTTP route. If you change
``ui/src/lib/ranking.ts`` you should change ``peptide_rank.py`` in the
same PR — these tests anchor a few golden values so silent drift is
caught at CI time.
"""

from __future__ import annotations

import os

os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")

import pytest  # noqa: E402

from services import peptide_rank  # noqa: E402

# ---------------------------------------------------------------------------
# Percentile rank
# ---------------------------------------------------------------------------


def test_percentile_rank_singleton_is_50():
    """Single-element / empty lists have no relative ordering — 50 is the
    documented neutral value (matches the TS implementation)."""
    assert peptide_rank.compute_percentile_rank(7.0, [7.0]) == 50.0
    assert peptide_rank.compute_percentile_rank(7.0, []) == 50.0


def test_percentile_rank_all_identical_returns_100():
    """When every value is the same, the ≤-based count returns 100 for all —
    matches the TypeScript reference (``ui/src/lib/ranking.ts`` filters
    ``v <= value``, so a tie counts toward ``countBelow``). The docstring
    in the TS source claims 50 here but the code is the source of truth.
    """
    assert peptide_rank.compute_percentile_rank(3.0, [3.0, 3.0, 3.0]) == 100.0


def test_percentile_rank_max_is_100_min_is_inclusive():
    """The TS implementation is ≤-based: the smallest value gets
    1/n * 100, the largest gets 100."""
    values = [1.0, 2.0, 3.0, 4.0]
    assert peptide_rank.compute_percentile_rank(4.0, values) == 100.0
    assert peptide_rank.compute_percentile_rank(1.0, values) == 25.0


# ---------------------------------------------------------------------------
# Weight redistribution
# ---------------------------------------------------------------------------


def test_redistribute_scales_to_100():
    out = peptide_rank.redistribute_weights(
        {"a": 50, "b": 50}, ["a", "b"]
    )
    assert sum(out.values()) == pytest.approx(100.0)


def test_redistribute_falls_back_to_equal_when_all_zero():
    """Zero/missing input weights → equal distribution (matches TS)."""
    out = peptide_rank.redistribute_weights({}, ["a", "b", "c"])
    assert out == pytest.approx({"a": 100 / 3, "b": 100 / 3, "c": 100 / 3})


def test_redistribute_drops_inactive_metrics():
    out = peptide_rank.redistribute_weights(
        {"a": 60, "b": 40, "c": 100}, ["a", "b"]
    )
    assert set(out.keys()) == {"a", "b"}
    # c was excluded so a/b weights scale to fill the gap (60+40=100 already).
    assert out["a"] == pytest.approx(60.0)
    assert out["b"] == pytest.approx(40.0)


# ---------------------------------------------------------------------------
# rank_peptides — end-to-end golden cases
# ---------------------------------------------------------------------------


def _row(id_: str, **kwargs):
    base = {"id": id_, "sequence": "AAAA"}
    base.update(kwargs)
    return base


def test_rank_empty_input_returns_empty_results():
    out = peptide_rank.rank_peptides([], preset="equal", top_n=10)
    assert out["results"] == []
    assert out["total_candidates"] == 0
    assert out["preset"] == "equal"


def test_rank_helix_preset_emphasises_s4pred_helix():
    """Two peptides differing only in s4predHelixPercent must rank with the
    high-helix one on top under the helix preset (S4PRED weight = 50)."""
    rows = [
        _row("LOW", s4predHelixPercent=10, muH=0.5, hydrophobicity=0.5),
        _row("HIGH", s4predHelixPercent=90, muH=0.5, hydrophobicity=0.5),
    ]
    out = peptide_rank.rank_peptides(rows, preset="helix", top_n=2)
    ids = [r["peptide"]["id"] for r in out["results"]]
    assert ids[0] == "HIGH"
    assert out["effective_weights"]["s4predHelixPercent"] == pytest.approx(50.0)


def test_rank_amyloid_preset_emphasises_muH_and_hydrophobicity():
    rows = [
        _row("AMY", s4predHelixPercent=10, muH=0.9, hydrophobicity=2.0),
        _row("HEL", s4predHelixPercent=90, muH=0.1, hydrophobicity=0.1),
    ]
    out = peptide_rank.rank_peptides(rows, preset="amyloid", top_n=2)
    ids = [r["peptide"]["id"] for r in out["results"]]
    assert ids[0] == "AMY"
    # Amyloid preset puts 80% of the weight on uH + hydrophobicity.
    assert out["effective_weights"]["muH"] == pytest.approx(40.0)
    assert out["effective_weights"]["hydrophobicity"] == pytest.approx(40.0)


def test_rank_top_n_truncates_after_sorting():
    rows = [
        _row(str(i), s4predHelixPercent=float(i * 10)) for i in range(1, 11)
    ]
    out = peptide_rank.rank_peptides(rows, preset="helix", top_n=3)
    assert len(out["results"]) == 3
    # Highest-percentile peptides come first.
    assert out["results"][0]["peptide"]["id"] == "10"
    assert out["results"][1]["peptide"]["id"] == "9"
    assert out["results"][2]["peptide"]["id"] == "8"
    assert out["total_candidates"] == 10


def test_rank_handles_missing_metric_per_peptide():
    """A peptide missing one metric is still scored on the metrics it has —
    its composite is normalised to the active-weight sum, not over 100."""
    rows = [
        _row("FULL", s4predHelixPercent=50, muH=0.5, hydrophobicity=0.5),
        _row("PARTIAL", s4predHelixPercent=80),  # missing muH, hydrophobicity
    ]
    out = peptide_rank.rank_peptides(rows, preset="helix", top_n=2)
    ids = {r["peptide"]["id"] for r in out["results"]}
    assert ids == {"FULL", "PARTIAL"}
    # PARTIAL has only s4predHelixPercent (highest in this set → percentile 100).
    # §I dispatch scales score to [0, 1].
    partial = next(r for r in out["results"] if r["peptide"]["id"] == "PARTIAL")
    assert partial["score"] == pytest.approx(1.0)


def test_rank_custom_weights_override_preset():
    """Caller-supplied weights take precedence; preset is still echoed back."""
    rows = [
        _row("CHARGEPLUS", charge=5),
        _row("CHARGEMINUS", charge=-5),
        _row("CHARGENONE"),
    ]
    out = peptide_rank.rank_peptides(
        rows,
        preset="equal",
        weights={"absCharge": 100.0},
        top_n=3,
    )
    # Charged peptides (|±5|=5) outrank neutral one — |0| < |5|.
    top = out["results"][0]["peptide"]["id"]
    assert top in {"CHARGEPLUS", "CHARGEMINUS"}
    bottom = out["results"][-1]["peptide"]["id"]
    assert bottom == "CHARGENONE"


def test_rank_tango_gated_metrics_dropped_when_unavailable():
    rows = [
        _row("A", tangoAggMax=10, s4predHelixPercent=50, muH=0.5, hydrophobicity=0.5),
        _row("B", tangoAggMax=1, s4predHelixPercent=50, muH=0.5, hydrophobicity=0.5),
    ]
    out = peptide_rank.rank_peptides(
        rows,
        preset="equal",
        weights={"tangoAggMax": 100.0, "s4predHelixPercent": 50.0},
        tango_available=False,
        top_n=2,
    )
    # tangoAggMax was dropped; only s4predHelixPercent remains → equal score.
    assert "tangoAggMax" not in out["effective_weights"]
    assert out["effective_weights"]["s4predHelixPercent"] == pytest.approx(100.0)


def test_rank_unknown_preset_raises_value_error():
    with pytest.raises(ValueError, match="Unknown ranking preset"):
        peptide_rank.rank_peptides([], preset="bogus", top_n=1)


def test_rank_reasons_describe_top_contributors():
    rows = [
        _row("A", s4predHelixPercent=90, muH=0.9, hydrophobicity=0.1),
        _row("B", s4predHelixPercent=10, muH=0.1, hydrophobicity=0.9),
    ]
    out = peptide_rank.rank_peptides(rows, preset="equal", top_n=2)
    a = next(r for r in out["results"] if r["peptide"]["id"] == "A")
    # A's standout: high S4PRED Helix % and high uH (both p100 in this set).
    reasons = " ".join(a["reasons"]).lower()
    assert "helix" in reasons or "uh" in reasons
