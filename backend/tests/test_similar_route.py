"""Tests for ``POST /api/peptides/similar`` (Wave 2 §D).

The vector store is faked at the function seam — we don't exercise the
LanceDB write path here, only the route's request validation, response
shape, and metadata→camelCase translation. ``test_vector_store.py`` covers
the storage layer end-to-end.
"""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Disable providers before importing the FastAPI app.
os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")
os.environ.setdefault("VECTOR_INDEX_ENABLED", "1")

from api.main import app  # noqa: E402
from services import vector_store  # noqa: E402

client = TestClient(app)


@pytest.fixture
def fake_search(monkeypatch):
    """Replace ``vector_store.find_similar`` with a recording fake."""

    calls = []

    def _fake(reference_id, k=10, dataset_id=None):
        calls.append({"reference_id": reference_id, "k": k, "dataset_id": dataset_id})
        return {
            "results": [
                {
                    "accession": "P1",
                    "sequence": "AAAA",
                    "distance": 0.1,
                    "metadata": {
                        "ff_helix_flag": 1,
                        "ssw_prediction": 1,
                        "ff_ssw_flag": -1,
                        "s4pred_helix_prediction": 1,
                        "mu_h": 0.42,
                        "tango_agg_max": 5.5,
                        "organism": "Homo sapiens",
                        "length": 4,
                    },
                },
                {
                    "accession": "P2",
                    "sequence": "GSTN",
                    "distance": 0.7,
                    "metadata": {},
                },
            ],
            "method": "lancedb+local-minilm",
            "elapsed_ms": 12,
            "disabled_reason": None,
        }

    monkeypatch.setattr(vector_store, "find_similar", _fake)
    return calls


def test_returns_200_with_canonical_response_shape(fake_search):
    resp = client.post(
        "/api/peptides/similar",
        json={"reference_id": "REF-1", "k": 5},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["reference_id"] == "REF-1"
    assert body["method"] == "lancedb+local-minilm"
    assert body["elapsed_ms"] == 12
    assert isinstance(body["results"], list)
    assert len(body["results"]) == 2
    first = body["results"][0]
    # Frontend contract: peptide is always present, plus distance.
    assert set(first.keys()) == {"peptide", "distance"}
    assert first["distance"] == 0.1


def test_camelcase_metadata_translation(fake_search):
    """Vector-store snake_case metadata must surface as camelCase peptide
    fields the frontend's ``Peptide`` type already understands."""
    resp = client.post(
        "/api/peptides/similar", json={"reference_id": "REF-1", "k": 5}
    )
    assert resp.status_code == 200
    p1 = resp.json()["results"][0]["peptide"]
    assert p1["id"] == "P1"
    assert p1["sequence"] == "AAAA"
    assert p1["ffHelixFlag"] == 1
    assert p1["sswPrediction"] == 1
    assert p1["ffSswFlag"] == -1
    assert p1["s4predHelixPrediction"] == 1
    assert p1["muH"] == 0.42
    assert p1["tangoAggMax"] == 5.5
    assert p1["species"] == "Homo sapiens"  # organism → species
    assert p1["length"] == 4


def test_default_k_is_ten(fake_search):
    resp = client.post(
        "/api/peptides/similar", json={"reference_id": "REF"}
    )
    assert resp.status_code == 200
    assert fake_search[0]["k"] == 10


def test_accepts_camelcase_referenceid_alias(fake_search):
    """ADR-002 / Wave B: the request schema accepts both snake_case and
    camelCase aliases. The frontend posts camelCase."""
    resp = client.post(
        "/api/peptides/similar", json={"referenceId": "REF-CC", "k": 3}
    )
    assert resp.status_code == 200
    assert fake_search[0]["reference_id"] == "REF-CC"


def test_rejects_unknown_field_with_422(fake_search):
    resp = client.post(
        "/api/peptides/similar",
        json={"reference_id": "REF", "k": 3, "rogue_field": "nope"},
    )
    assert resp.status_code == 422


def test_rejects_missing_reference_id(fake_search):
    resp = client.post("/api/peptides/similar", json={"k": 3})
    assert resp.status_code == 422


def test_rejects_k_out_of_range(fake_search):
    resp = client.post(
        "/api/peptides/similar", json={"reference_id": "REF", "k": 0}
    )
    assert resp.status_code == 422
    resp2 = client.post(
        "/api/peptides/similar", json={"reference_id": "REF", "k": 101}
    )
    assert resp2.status_code == 422


def test_passes_dataset_id_through(fake_search):
    resp = client.post(
        "/api/peptides/similar",
        json={"reference_id": "REF", "k": 3, "dataset_id": "ds-1"},
    )
    assert resp.status_code == 200
    assert fake_search[0]["dataset_id"] == "ds-1"


def test_disabled_index_returns_empty_results_not_error(monkeypatch):
    """When the index is disabled, the route still returns 200 with an
    empty list and ``method="disabled"`` so the UI shows the empty state."""

    def _fake_disabled(reference_id, k=10, dataset_id=None):
        return {
            "results": [],
            "method": "disabled",
            "elapsed_ms": 0,
            "disabled_reason": "VECTOR_INDEX_ENABLED=0",
        }

    monkeypatch.setattr(vector_store, "find_similar", _fake_disabled)
    resp = client.post(
        "/api/peptides/similar", json={"reference_id": "REF", "k": 5}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["results"] == []
    assert body["method"] == "disabled"


def test_stats_endpoint_reports_health(monkeypatch):
    monkeypatch.setattr(
        vector_store,
        "stats",
        lambda: {
            "enabled": True,
            "disabled_reason": None,
            "method": "lancedb+local-minilm",
            "lance_path": "/tmp/lance",
            "vector_dim": 384,
            "row_count": 42,
        },
    )
    resp = client.get("/api/peptides/similar/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert body["enabled"] is True
    assert body["row_count"] == 42
    assert body["method"] == "lancedb+local-minilm"
