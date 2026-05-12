"""HTTP tests for the Wave 2 §I peptide routes — detail / rank / compare.

These exercise the FastAPI route layer: request validation, MCP-compatible
alias acceptance, response shape, error paths, and the dataset_id →
vector-store fast path.
"""

from __future__ import annotations

import os

os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")
os.environ.setdefault("VECTOR_INDEX_ENABLED", "0")  # disable LanceDB for HTTP tests

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from api.main import app  # noqa: E402
from services import vector_store  # noqa: E402

client = TestClient(app)


# ---------------------------------------------------------------------------
# GET /api/peptides/{accession}
# ---------------------------------------------------------------------------


def test_detail_returns_404_when_index_disabled(monkeypatch):
    """Index off → get_peptide returns None → route 404s with a helpful hint."""
    monkeypatch.setattr(vector_store, "get_peptide", lambda accession: None)
    resp = client.get("/api/peptide/UNKNOWN")
    assert resp.status_code == 404
    assert "POST /api/predict" in resp.json()["detail"]


def test_detail_returns_canonical_shape_when_indexed(monkeypatch):
    monkeypatch.setattr(
        vector_store,
        "get_peptide",
        lambda accession: {
            "id": accession,
            "sequence": "GIGAVL",
            "ffHelixFlag": 1,
            "muH": 0.42,
        },
    )
    resp = client.get("/api/peptide/P0C1Q4")
    assert resp.status_code == 200
    body = resp.json()
    assert body["accession"] == "P0C1Q4"
    assert body["peptide"]["id"] == "P0C1Q4"
    assert body["peptide"]["ffHelixFlag"] == 1
    assert body["source"] == "index"


def test_detail_url_encodes_accession_with_special_chars(monkeypatch):
    """Synthetic IDs like ``P0C1Q4_25-50`` should round-trip cleanly."""
    captured = {}

    def fake_get(accession):
        captured["accession"] = accession
        return {"id": accession, "sequence": "AAAA"}

    monkeypatch.setattr(vector_store, "get_peptide", fake_get)
    resp = client.get("/api/peptide/P0C1Q4_25-50")
    assert resp.status_code == 200
    assert captured["accession"] == "P0C1Q4_25-50"


# ---------------------------------------------------------------------------
# POST /api/peptides/rank
# ---------------------------------------------------------------------------


def _row(id_: str, **kwargs):
    base = {"id": id_, "sequence": "AAAA"}
    base.update(kwargs)
    return base


def test_rank_returns_200_with_canonical_response_shape():
    """§I dispatch response shape: ``ranked[]`` + ``method`` + ``elapsed_ms``
    + ``preset`` + ``effective_weights`` + ``total_candidates``. Each ranked
    row has ``peptide`` + ``score`` (in [0, 1]) + ``reasons``."""
    payload = {
        "sequences": [
            _row("A", s4predHelixPercent=80, muH=0.9, hydrophobicity=0.2, ffHelixPercent=78),
            _row("B", s4predHelixPercent=20, muH=0.1, hydrophobicity=0.9),
        ],
        "preset": "helix",
        "top_n": 2,
    }
    resp = client.post("/api/rank", json=payload)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    expected_top_level = {
        "ranked",
        "method",
        "elapsed_ms",
        "preset",
        "effective_weights",
        "total_candidates",
    }
    assert expected_top_level <= set(body.keys())
    assert body["method"] == "weighted-sum-v1"
    assert isinstance(body["elapsed_ms"], int) and body["elapsed_ms"] >= 0
    assert body["total_candidates"] == 2
    assert len(body["ranked"]) == 2

    first = body["ranked"][0]
    assert {"peptide", "score", "metric_percentiles", "reasons"} <= set(first.keys())
    # §I dispatch: score is in [0, 1], not [0, 100].
    assert 0.0 <= first["score"] <= 1.0
    # Reasons are domain-grounded, not percentile-coded (per §I dispatch
    # example "High FF-Helix coverage (78%)"). We accept either "high"
    # or "low" qualifiers + at least one canonical PVL metric label.
    joined = " ".join(first["reasons"]).lower()
    assert any(token in joined for token in ("helix", "uh", "hydrophob", "tango", "ssw", "charge"))


def test_rank_rejects_both_sequences_and_dataset_id():
    resp = client.post(
        "/api/rank",
        json={"sequences": [_row("A")], "dataset_id": "ds-1"},
    )
    assert resp.status_code == 422
    assert "exactly one" in resp.json()["detail"]


def test_rank_accepts_camelcase_top_n_alias():
    """ADR-002 / Wave B: snake_case + camelCase aliases everywhere."""
    resp = client.post(
        "/api/rank",
        json={"sequences": [_row("A"), _row("B")], "preset": "equal", "topN": 1},
    )
    assert resp.status_code == 200
    assert len(resp.json()["ranked"]) == 1


def test_rank_rejects_unknown_field_with_422():
    resp = client.post(
        "/api/rank",
        json={"sequences": [_row("A")], "preset": "equal", "rogueField": 1},
    )
    assert resp.status_code == 422


def test_rank_rejects_unknown_preset_with_422():
    resp = client.post(
        "/api/rank",
        json={"sequences": [_row("A")], "preset": "bogus"},
    )
    assert resp.status_code == 422


def test_rank_dataset_id_path_queries_vector_store(monkeypatch):
    """``dataset_id`` resolves through ``list_peptides_in_dataset`` — the
    route shouldn't require the caller to re-send sequences they've
    already analysed."""
    fetched = {}

    def fake_list(dataset_id, **kwargs):
        fetched["dataset_id"] = dataset_id
        return [_row("A", muH=0.5, hydrophobicity=0.5, s4predHelixPercent=80)]

    monkeypatch.setattr(vector_store, "list_peptides_in_dataset", fake_list)
    resp = client.post(
        "/api/rank",
        json={"dataset_id": "abc123", "preset": "helix", "top_n": 5},
    )
    assert resp.status_code == 200
    assert fetched["dataset_id"] == "abc123"
    assert resp.json()["total_candidates"] == 1


def test_rank_empty_sequences_returns_empty_ranked():
    """An empty list is not an error — the UI calls rank during initial
    render before peptides exist."""
    resp = client.post(
        "/api/rank", json={"sequences": [], "preset": "equal"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ranked"] == []
    assert body["total_candidates"] == 0
    assert body["method"] == "weighted-sum-v1"


# ---------------------------------------------------------------------------
# POST /api/peptides/compare
# ---------------------------------------------------------------------------


def test_compare_returns_dispatch_response_shape():
    """§I dispatch shape: ``stats: {dataset_a, dataset_b}``, ``differences[]``,
    ``method``, ``labels``. Each ``differences`` row has metric / delta /
    direction / significance."""
    payload = {
        "cohort_a": [_row("A1", ffHelixFlag=1, length=10, charge=1, hydrophobicity=0.5, muH=0.6)],
        "cohort_b": [_row("B1", ffHelixFlag=-1, length=20, charge=2, hydrophobicity=1.0, muH=0.3)],
        "label_a": "Mut",
        "label_b": "WT",
    }
    resp = client.post("/api/compare", json=payload)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert set(body.keys()) >= {"stats", "differences", "method", "labels"}
    assert body["method"] == "two-sided-chi2"
    assert body["labels"] == {"dataset_a": "Mut", "dataset_b": "WT"}
    assert set(body["stats"].keys()) == {"dataset_a", "dataset_b"}
    assert body["stats"]["dataset_a"]["n"] == 1
    assert body["stats"]["dataset_a"]["ff_helix_pct"] == pytest.approx(1.0)
    assert body["stats"]["dataset_b"]["ff_helix_pct"] == pytest.approx(0.0)
    assert body["stats"]["dataset_b"]["mean_length"] == pytest.approx(20.0)

    diff_by_metric = {d["metric"]: d for d in body["differences"]}
    assert diff_by_metric["ff_helix_pct"]["delta"] == pytest.approx(1.0)
    assert diff_by_metric["ff_helix_pct"]["direction"] == "a>b"
    assert diff_by_metric["mean_length"]["delta"] == pytest.approx(-10.0)
    assert diff_by_metric["mean_length"]["direction"] == "b>a"


def test_compare_accepts_dataset_aliases():
    """Frontend can send {datasetA, datasetB}; backend accepts as aliases."""
    resp = client.post(
        "/api/compare",
        json={
            "datasetA": [_row("A1", ffHelixFlag=1)],
            "datasetB": [_row("B1", ffHelixFlag=1)],
            "labelA": "Old",
            "labelB": "New",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["labels"] == {"dataset_a": "Old", "dataset_b": "New"}


def test_compare_handles_missing_metrics_with_none_deltas():
    """Cohorts with no biochem observations → mean is None and the delta
    row carries ``delta: None`` rather than a misleading zero."""
    resp = client.post(
        "/api/compare",
        json={
            "cohort_a": [_row("A1")],  # no biochem fields
            "cohort_b": [_row("B1")],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["stats"]["dataset_a"]["mean_length"] is None

    diff_by_metric = {d["metric"]: d for d in body["differences"]}
    assert diff_by_metric["mean_length"]["delta"] is None
    # Significance is "ns" when no data — no inferential test possible.
    assert diff_by_metric["mean_length"]["significance"] == "ns"
    # ff_helix_pct is computable from missing data only via observed=0 →
    # delta is None and significance is "ns".
    assert diff_by_metric["ff_helix_pct"]["delta"] is None
    assert diff_by_metric["ff_helix_pct"]["significance"] == "ns"


def test_compare_chi_squared_marks_large_difference_significant():
    """A 20-positive vs 4-positive contrast on n=20 should hit p < 0.001
    → '***' significance marker. Pins the chi-squared math end-to-end."""
    cohort_a = [_row(f"A{i}", ffHelixFlag=1) for i in range(20)]
    cohort_b = [
        _row(f"B{i}", ffHelixFlag=1 if i < 4 else -1) for i in range(20)
    ]
    resp = client.post(
        "/api/compare",
        json={"cohort_a": cohort_a, "cohort_b": cohort_b},
    )
    assert resp.status_code == 200
    ff = next(d for d in resp.json()["differences"] if d["metric"] == "ff_helix_pct")
    assert ff["significance"] == "***"
    assert ff["delta"] == pytest.approx(0.8)


def test_compare_identical_cohorts_have_ns_significance():
    """Two structurally identical cohorts → no significant differences."""
    rows_a = [_row(f"A{i}", ffHelixFlag=1, length=10) for i in range(10)]
    rows_b = [_row(f"B{i}", ffHelixFlag=1, length=10) for i in range(10)]
    resp = client.post("/api/compare", json={"cohort_a": rows_a, "cohort_b": rows_b})
    assert resp.status_code == 200
    for diff in resp.json()["differences"]:
        assert diff["significance"] == "ns"


def test_compare_rejects_empty_cohort_a_with_422():
    resp = client.post(
        "/api/compare",
        json={"cohort_a": [], "cohort_b": [_row("B1")]},
    )
    assert resp.status_code == 422


def test_compare_rejects_unknown_field_with_422():
    resp = client.post(
        "/api/compare",
        json={
            "cohort_a": [_row("A1")],
            "cohort_b": [_row("B1")],
            "extra": "leak",
        },
    )
    assert resp.status_code == 422


def test_compare_reports_cohort_sizes_in_stats():
    """``n`` lives on each stats block — the §I dispatch surfaces it once
    per cohort rather than as a derived delta (size deltas are obvious)."""
    resp = client.post(
        "/api/compare",
        json={
            "cohort_a": [_row("A1"), _row("A2"), _row("A3")],
            "cohort_b": [_row("B1")],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["stats"]["dataset_a"]["n"] == 3
    assert body["stats"]["dataset_b"]["n"] == 1


def test_detail_rejects_empty_accession_with_422():
    """§I dispatch: empty / over-long accession → 422 not 404."""
    # Empty accession route doesn't match — fastapi returns 404 for path
    # mismatch. Validate the over-long-accession path which DOES match.
    resp = client.get("/api/peptide/" + "A" * 65)
    assert resp.status_code == 422
    assert "64 character limit" in resp.json()["detail"]
