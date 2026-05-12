"""Tests for ``services.vector_store`` — Wave 2 §D LanceDB layer.

The embedder is always faked so these tests never download HuggingFace
weights. ``LANCE_DB_PATH`` is pointed at a per-test ``tmp_path`` so each
test starts with a fresh, empty Lance database.
"""

from __future__ import annotations

import math
import os
from typing import Any, Dict, List

import pytest

# Disable providers so importing the FastAPI app stays fast (parity with the
# rest of the suite — see test_api_contracts.py header).
os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")
os.environ.setdefault("VECTOR_INDEX_ENABLED", "1")

from config import settings  # noqa: E402
from services import vector_store  # noqa: E402

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_fake_embedder() -> Any:
    """Deterministic embedder: maps a sequence to a unique 4-dim vector.

    The vectors are L2-normalized so cosine distance behaves as expected
    (Lance's default vector index uses L2 over normalized vectors).
    """

    class FakeEmbedder:
        dim = 4

        def __call__(self, text: str) -> List[float]:
            # 4 simple amino-acid bucket counts as a placeholder embedding.
            buckets = [
                sum(1 for c in text if c in "AILMV"),  # hydrophobic small
                sum(1 for c in text if c in "FWY"),  # aromatic
                sum(1 for c in text if c in "DEKR"),  # charged
                sum(1 for c in text if c in "GSTNQH"),  # polar/turn
            ]
            norm = math.sqrt(sum(b * b for b in buckets)) or 1.0
            return [b / norm for b in buckets]

    return FakeEmbedder()


@pytest.fixture
def isolated_index(tmp_path, monkeypatch) -> Dict[str, Any]:
    """Per-test tmp Lance dir + fake embedder + matching VECTOR_DIM."""
    monkeypatch.setattr(settings, "LANCE_DB_PATH", str(tmp_path / "lance"))
    monkeypatch.setattr(settings, "VECTOR_INDEX_ENABLED", True)
    monkeypatch.setattr(settings, "VECTOR_DIM", 4)
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "test-fake")

    vector_store.reset_for_tests()
    fake = _make_fake_embedder()
    vector_store.set_embedder(fake)

    yield {"path": tmp_path / "lance", "embedder": fake}

    vector_store.reset_for_tests()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_index_and_search_returns_neighbors_sorted_by_distance(isolated_index):
    """The most similar peptide to a hydrophobic-helix-like sequence should
    be the OTHER hydrophobic-helix-like sequence, not the unrelated one."""
    rows = [
        {"id": "ALA-1", "sequence": "AILVMAILVM"},
        {"id": "ALA-2", "sequence": "AILMVAILMV"},
        {"id": "POLAR-1", "sequence": "GSTNQHGSTN"},
        {"id": "AROMA-1", "sequence": "FWYFWYFWY"},
    ]
    for row in rows:
        assert vector_store.index_peptide(row) is True

    result = vector_store.find_similar(reference_id="ALA-1", k=3)
    accs = [r["accession"] for r in result["results"]]
    # Reference itself is excluded.
    assert "ALA-1" not in accs
    # ALA-2 is the closest neighbour by construction.
    assert accs[0] == "ALA-2"
    # Distances are non-decreasing.
    distances = [r["distance"] for r in result["results"]]
    assert distances == sorted(distances)


def test_search_excludes_reference_and_honors_k(isolated_index):
    for i in range(5):
        vector_store.index_peptide(
            {"id": f"P{i}", "sequence": "AILMV" + "A" * i}
        )
    result = vector_store.find_similar(reference_id="P2", k=2)
    assert len(result["results"]) == 2
    assert "P2" not in [r["accession"] for r in result["results"]]


def test_search_unknown_reference_returns_empty_not_error(isolated_index):
    """Frontend contract: no peptide → empty results, NOT a 404."""
    vector_store.index_peptide({"id": "PRESENT", "sequence": "AAAA"})
    result = vector_store.find_similar(reference_id="MISSING", k=10)
    assert result["results"] == []
    assert result["disabled_reason"] is None
    assert result["method"].startswith("lancedb+")
    assert isinstance(result["elapsed_ms"], int)


def test_index_upsert_overwrites_same_accession(isolated_index):
    """Re-indexing an accession must not duplicate it — the search should
    only return one neighbour for that id."""
    vector_store.index_peptide({"id": "X", "sequence": "AAAA"})
    vector_store.index_peptide({"id": "X", "sequence": "GSTNQH"})
    vector_store.index_peptide({"id": "Y", "sequence": "AILMV"})

    result = vector_store.find_similar(reference_id="Y", k=10)
    accs = [r["accession"] for r in result["results"]]
    assert accs.count("X") == 1


def test_index_skips_row_missing_required_fields(isolated_index):
    assert vector_store.index_peptide({"sequence": "AAAA"}) is False  # no id
    assert vector_store.index_peptide({"id": "X"}) is False  # no sequence


def test_index_dim_mismatch_is_swallowed(isolated_index):
    """Embedder returning the wrong dimension is logged + index_peptide
    returns False. We never want a runtime crash on the analysis path."""
    vector_store.set_embedder(lambda _seq: [0.0, 0.0])  # 2-dim, expected 4

    result = vector_store.index_peptide({"id": "BAD", "sequence": "AAAA"})
    assert result is False


def test_disabled_master_switch_short_circuits_index_and_search(
    isolated_index, monkeypatch
):
    monkeypatch.setattr(settings, "VECTOR_INDEX_ENABLED", False)
    vector_store.reset_for_tests()

    assert vector_store.is_enabled() is False
    assert vector_store.index_peptide({"id": "X", "sequence": "AAAA"}) is False

    result = vector_store.find_similar(reference_id="X", k=5)
    assert result["results"] == []
    assert result["method"] == "disabled"
    assert result["disabled_reason"] == "VECTOR_INDEX_ENABLED=0"


def test_metadata_round_trips_camelcase_to_snake_case(isolated_index):
    """Camelcase PVL fields on the input row land in the metadata dict
    under snake_case keys (the Lance schema's column names)."""
    vector_store.index_peptide(
        {
            "id": "META-1",
            "sequence": "AAAAAAAA",
            "ffHelixFlag": 1,
            "sswPrediction": 1,
            "muH": 0.42,
            "tangoAggMax": 7.3,
            "species": "Homo sapiens",
        }
    )
    vector_store.index_peptide({"id": "OTHER", "sequence": "GSTNQH"})
    result = vector_store.find_similar(reference_id="OTHER", k=5)
    target = next(r for r in result["results"] if r["accession"] == "META-1")
    md = target["metadata"]
    assert md["ff_helix_flag"] == 1
    assert md["ssw_prediction"] == 1
    assert math.isclose(md["mu_h"], 0.42)
    assert math.isclose(md["tango_agg_max"], 7.3)
    assert md["organism"] == "Homo sapiens"


def test_dataset_id_filter_restricts_search(isolated_index):
    vector_store.index_peptide({"id": "A1", "sequence": "AILMV"}, dataset_id="ds-A")
    vector_store.index_peptide({"id": "A2", "sequence": "AILVM"}, dataset_id="ds-A")
    vector_store.index_peptide({"id": "B1", "sequence": "AILVA"}, dataset_id="ds-B")

    result = vector_store.find_similar(reference_id="A1", k=10, dataset_id="ds-A")
    accs = [r["accession"] for r in result["results"]]
    assert "B1" not in accs
    assert "A2" in accs


def test_index_rows_returns_count_of_successful_upserts(isolated_index):
    indexed = vector_store.index_rows(
        [
            {"id": "R1", "sequence": "AAAA"},
            {"id": "R2", "sequence": "GSTN"},
            {"sequence": "noid"},  # rejected
            {"id": "R3"},  # rejected
        ]
    )
    assert indexed == 2


def test_stats_reports_row_count_when_enabled(isolated_index):
    vector_store.index_peptide({"id": "S1", "sequence": "AAAA"})
    vector_store.index_peptide({"id": "S2", "sequence": "GSTN"})
    s = vector_store.stats()
    assert s["enabled"] is True
    assert s["disabled_reason"] is None
    assert s["row_count"] == 2
    assert s["method"] == "lancedb+test-fake"
