"""Tests for the pvl-py public SDK surface.

Every test uses :class:`httpx.MockTransport` to stub the PVL backend so the
suite runs fast in-process — no real network, no real backend required.
The transport is threaded through via the optional ``transport=`` kwarg
the SDK exposes for testability (production code leaves it ``None``).
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import httpx
import pandas as pd
import pytest

import pvl
from pvl import _client

# ---------------------------------------------------------------------------
# Transport helpers
# ---------------------------------------------------------------------------


class _Recorder:
    """Records every request the SDK sends so tests can assert on them."""

    def __init__(self) -> None:
        self.calls: list[dict] = []

    def handler(self, response_factory):
        """Return an httpx handler that records the request and returns the
        factory's response (so each test can canned-respond per route)."""

        def _h(request: httpx.Request) -> httpx.Response:
            body_bytes = request.read()
            self.calls.append(
                {
                    "method": request.method,
                    "url": str(request.url),
                    "path": request.url.path,
                    "headers": dict(request.headers),
                    "body": body_bytes,
                }
            )
            return response_factory(request)

        return _h


def _mock_transport(response_factory):
    return httpx.MockTransport(response_factory)


def _async_mock_transport(response_factory):
    """``httpx.MockTransport`` works for both sync and async clients."""
    return httpx.MockTransport(response_factory)


def _json_response(payload: dict, *, status: int = 200):
    return httpx.Response(status, json=payload)


# ---------------------------------------------------------------------------
# Public-surface smoke
# ---------------------------------------------------------------------------


def test_module_exports_public_surface() -> None:
    """Pin the public surface so a stray rename of `analyze` → `analyse`
    can't ship silently."""
    expected = {
        "analyze",
        "rank",
        "search_uniprot",
        "find_similar",
        "set_default_server",
        "aanalyze",
        "arank",
        "asearch_uniprot",
        "afind_similar",
        "DEFAULT_SERVER_URL",
        "__version__",
    }
    assert expected <= set(pvl.__all__)
    for name in expected:
        assert hasattr(pvl, name), f"pvl.{name} missing"


def test_version_is_pep_440() -> None:
    assert isinstance(pvl.__version__, str)
    assert pvl.__version__.count(".") >= 1


# ---------------------------------------------------------------------------
# analyze — three input types
# ---------------------------------------------------------------------------


def _analyze_response_factory(rec: _Recorder):
    """Default analyze mock: returns 2 canonical rows for any POST."""

    def _factory(request: httpx.Request) -> httpx.Response:
        return _json_response(
            {
                "rows": [
                    {
                        "id": "P12345",
                        "sequence": "GIGAVLKVL",
                        "length": 9,
                        "muH": 0.42,
                        "ffHelixFlag": 1,
                    },
                    {
                        "id": "P67890",
                        "sequence": "MKVAVL",
                        "length": 6,
                        "muH": 0.11,
                        "ffHelixFlag": -1,
                    },
                ],
                "meta": {"traceId": "stub-trace"},
            }
        )

    return _factory


def test_analyze_with_dataframe_returns_canonical_dataframe() -> None:
    """DataFrame input → CSV multipart → DataFrame return with PVL columns."""
    rec = _Recorder()
    transport = _mock_transport(rec.handler(_analyze_response_factory(rec)))

    df = pd.DataFrame({"sequence": ["GIGAVLKVL", "MKVAVL"]})
    result = pvl.analyze(df, server_url="http://stub:1", transport=transport)

    assert isinstance(result, pd.DataFrame)
    assert len(result) == 2
    assert {"id", "sequence", "length", "muH", "ffHelixFlag"} <= set(result.columns)
    assert rec.calls[0]["method"] == "POST"
    assert rec.calls[0]["path"] == "/api/upload-csv"
    # The CSV body must contain the user's sequences.
    assert b"GIGAVLKVL" in rec.calls[0]["body"]
    assert b"MKVAVL" in rec.calls[0]["body"]


def test_analyze_with_sequence_list_wraps_into_csv() -> None:
    rec = _Recorder()
    transport = _mock_transport(rec.handler(_analyze_response_factory(rec)))

    result = pvl.analyze(["GIGAVLKVL", "MKVAVL"], transport=transport)
    assert isinstance(result, pd.DataFrame)
    assert len(result) == 2
    # The synthesized Entry ids are seq_1, seq_2.
    body = rec.calls[0]["body"].decode("utf-8")
    assert "seq_1,GIGAVLKVL" in body
    assert "seq_2,MKVAVL" in body


def test_analyze_with_fasta_path_uses_raw_body_route(tmp_path: Path) -> None:
    """A ``.fasta`` file path should hit the §H raw-body route, not multipart."""
    fasta_body = b">amyloid_beta\nDAEFRHDSGYEVHHQK\n>magainin\nGIGKFLHSAKK\n"
    fasta_file = tmp_path / "demo.fasta"
    fasta_file.write_bytes(fasta_body)

    rec = _Recorder()
    transport = _mock_transport(rec.handler(_analyze_response_factory(rec)))

    result = pvl.analyze(fasta_file, transport=transport)

    assert isinstance(result, pd.DataFrame)
    assert rec.calls[0]["path"] == "/api/predict/batch"
    assert rec.calls[0]["headers"].get("content-type", "").lower().startswith("text/x-fasta")
    # Raw FASTA bytes flow through unchanged.
    assert rec.calls[0]["body"] == fasta_body


def test_analyze_with_csv_path_uses_multipart_route(tmp_path: Path) -> None:
    csv_path = tmp_path / "seqs.csv"
    csv_path.write_text("Entry,Sequence\nP1,GIGAVLKVL\nP2,MKVAVL\n")

    rec = _Recorder()
    transport = _mock_transport(rec.handler(_analyze_response_factory(rec)))

    result = pvl.analyze(csv_path, transport=transport)

    assert isinstance(result, pd.DataFrame)
    assert rec.calls[0]["path"] == "/api/upload-csv"
    # The user's filename round-trips through the multipart envelope.
    assert b'filename="seqs.csv"' in rec.calls[0]["body"]


def test_analyze_missing_path_raises_filenotfounderror(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        pvl.analyze(tmp_path / "does-not-exist.fasta")


# ---------------------------------------------------------------------------
# rank — DataFrame in, DataFrame out (sorted by score desc)
# ---------------------------------------------------------------------------


def test_rank_returns_dataframe_sorted_by_score() -> None:
    rec = _Recorder()

    def _factory(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.read())
        assert body["preset"] == "helix"
        assert body["top_n"] == 5
        return _json_response(
            {
                "ranked": [
                    {
                        "peptide": {"id": "A", "sequence": "X"},
                        "score": 0.95,
                        "reasons": ["High S4PRED helix coverage (90%)"],
                    },
                    {
                        "peptide": {"id": "B", "sequence": "Y"},
                        "score": 0.30,
                        "reasons": ["Low hydrophobic moment uH (0.10)"],
                    },
                ],
                "method": "weighted-sum-v1",
                "elapsed_ms": 5,
                "preset": "helix",
                "effective_weights": {"s4predHelixPercent": 50.0},
                "total_candidates": 2,
            }
        )

    transport = _mock_transport(rec.handler(_factory))
    df_in = pd.DataFrame([{"id": "A", "sequence": "X"}, {"id": "B", "sequence": "Y"}])

    result = pvl.rank(df_in, preset="helix", top_n=5, transport=transport)

    assert isinstance(result, pd.DataFrame)
    assert list(result["id"]) == ["A", "B"]
    # ``score`` and ``reasons`` are appended as new columns.
    assert "score" in result.columns
    assert "reasons" in result.columns
    assert result.iloc[0]["score"] >= result.iloc[1]["score"]
    assert rec.calls[0]["path"] == "/api/rank"


# ---------------------------------------------------------------------------
# search_uniprot — query params propagate
# ---------------------------------------------------------------------------


def test_search_uniprot_sends_filters_and_returns_dataframe() -> None:
    rec = _Recorder()

    def _factory(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.read())
        assert body["query"] == "amyloid"
        assert body["organism_id"] == "1280"
        assert body["length_min"] == 10
        assert body["length_max"] == 50
        assert body["reviewed"] is True
        assert body["size"] == 25
        return _json_response({"rows": [{"id": "P0C1Q4"}], "meta": {}})

    transport = _mock_transport(rec.handler(_factory))
    df = pvl.search_uniprot(
        "amyloid",
        organism=1280,
        length_min=10,
        length_max=50,
        reviewed=True,
        page_size=25,
        transport=transport,
    )
    assert isinstance(df, pd.DataFrame)
    assert df.iloc[0]["id"] == "P0C1Q4"
    assert rec.calls[0]["path"] == "/api/uniprot/execute"


# ---------------------------------------------------------------------------
# find_similar — reference_id + k → DataFrame with distance
# ---------------------------------------------------------------------------


def test_find_similar_passes_reference_id_and_returns_distance() -> None:
    rec = _Recorder()

    def _factory(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.read())
        assert body["reference_id"] == "P0C1Q4"
        assert body["k"] == 5
        return _json_response(
            {
                "reference_id": "P0C1Q4",
                "results": [
                    {"peptide": {"id": "Q1", "sequence": "AAAA"}, "distance": 0.12},
                    {"peptide": {"id": "Q2", "sequence": "BBBB"}, "distance": 0.34},
                ],
                "method": "lancedb+local-esm2-8m",
                "elapsed_ms": 9,
            }
        )

    transport = _mock_transport(rec.handler(_factory))
    df = pvl.find_similar("P0C1Q4", k=5, transport=transport)
    assert isinstance(df, pd.DataFrame)
    assert list(df["id"]) == ["Q1", "Q2"]
    assert list(df["distance"]) == [0.12, 0.34]
    assert rec.calls[0]["path"] == "/api/peptides/similar"


def test_find_similar_returns_empty_dataframe_when_not_in_index() -> None:
    """Frontend contract: missing reference → empty list, not 404."""

    def _factory(request: httpx.Request) -> httpx.Response:
        return _json_response(
            {
                "reference_id": "MISSING",
                "results": [],
                "method": "lancedb+local-esm2-8m",
                "elapsed_ms": 1,
            }
        )

    transport = _mock_transport(_factory)
    df = pvl.find_similar("MISSING", transport=transport)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 0


# ---------------------------------------------------------------------------
# Server URL resolution — env var, set_default_server, kwarg precedence
# ---------------------------------------------------------------------------


def test_PVL_SERVER_URL_env_var_honored(monkeypatch) -> None:
    monkeypatch.setenv("PVL_SERVER_URL", "https://env.example/")
    _client.set_default_server(None)  # clear any session override
    assert _client.resolve_server_url() == "https://env.example"


def test_set_default_server_overrides_env_var(monkeypatch) -> None:
    monkeypatch.setenv("PVL_SERVER_URL", "https://env.example/")
    try:
        pvl.set_default_server("https://session.example")
        assert _client.resolve_server_url() == "https://session.example"
        # And explicit kwarg trumps the session default.
        assert _client.resolve_server_url("https://explicit.example/") == "https://explicit.example"
    finally:
        pvl.set_default_server(None)


def test_default_server_url_is_localhost(monkeypatch) -> None:
    monkeypatch.delenv("PVL_SERVER_URL", raising=False)
    _client.set_default_server(None)
    assert _client.resolve_server_url() == "http://localhost:8000"


# ---------------------------------------------------------------------------
# Backend error surfacing
# ---------------------------------------------------------------------------


def test_4xx_response_raises_httpx_status_error() -> None:
    def _factory(request: httpx.Request) -> httpx.Response:
        return _json_response({"detail": "bad sequence"}, status=422)

    transport = _mock_transport(_factory)
    with pytest.raises(httpx.HTTPStatusError) as exc:
        pvl.analyze(["GIGAVL"], transport=transport)
    assert "bad sequence" in str(exc.value)


def test_5xx_retries_once_then_surfaces_error() -> None:
    state = {"attempts": 0}

    def _factory(request: httpx.Request) -> httpx.Response:
        state["attempts"] += 1
        return _json_response({"detail": "warming up"}, status=503)

    transport = _mock_transport(_factory)
    with pytest.raises(httpx.HTTPStatusError):
        pvl.analyze(["GIGAVL"], transport=transport)
    # One initial attempt + one retry = 2 calls total.
    assert state["attempts"] == 2


# ---------------------------------------------------------------------------
# Async — sanity check that the awaitable variants work end-to-end
# ---------------------------------------------------------------------------


def test_aanalyze_returns_awaitable_dataframe() -> None:
    def _factory(request: httpx.Request) -> httpx.Response:
        return _json_response({"rows": [{"id": "Z", "sequence": "ZZZ"}], "meta": {}})

    transport = _async_mock_transport(_factory)
    coro = pvl.aanalyze(["ZZZ"], transport=transport)
    assert asyncio.iscoroutine(coro)
    df = asyncio.run(coro)
    assert isinstance(df, pd.DataFrame)
    assert df.iloc[0]["id"] == "Z"


def test_arank_arank_afind_similar_asearch_uniprot_all_exist() -> None:
    """Surface check — every sync function has an async sibling."""
    for name in ("aanalyze", "arank", "asearch_uniprot", "afind_similar"):
        fn = getattr(pvl, name)
        assert callable(fn), f"pvl.{name} is not callable"


# ---------------------------------------------------------------------------
# DataFrame coercion edge cases
# ---------------------------------------------------------------------------


def test_dataframe_missing_required_columns_raises() -> None:
    df = pd.DataFrame({"some_column": ["nope"]})
    with pytest.raises(ValueError, match="missing required column"):
        pvl.analyze(df, transport=_mock_transport(lambda r: _json_response({})))


def test_dataframe_with_id_and_sequence_lower_case_works() -> None:
    """Frontend-style lower-case column names round-trip through the
    coercer (matches the JS client's habit of using 'id'/'sequence')."""
    rec = _Recorder()

    def _factory(request: httpx.Request) -> httpx.Response:
        return _json_response({"rows": [{"id": "X", "sequence": "Y"}], "meta": {}})

    transport = _mock_transport(rec.handler(_factory))
    df = pd.DataFrame({"id": ["A"], "sequence": ["GIGAVL"]})
    pvl.analyze(df, transport=transport)
    body = rec.calls[0]["body"]
    # The multipart CSV inside still uses canonical Entry/Sequence headers.
    assert b"Entry,Sequence" in body
    assert b"A,GIGAVL" in body


# ---------------------------------------------------------------------------
# End-to-end with the shipped backend fixture
# ---------------------------------------------------------------------------


_FIXTURE = Path(__file__).resolve().parents[2] / "backend" / "tests" / "fixtures" / "example.fasta"


@pytest.mark.skipif(not _FIXTURE.exists(), reason="backend FASTA fixture not present")
def test_analyze_example_fasta_fixture_round_trips() -> None:
    """The same fixture the §H backend tests use must parse through pvl-py.

    Pins the end-to-end shape: 5 peptide rows in, 5 peptide rows out, with
    PVL camelCase columns on the result.
    """
    rec = _Recorder()

    def _factory(request: httpx.Request) -> httpx.Response:
        rows = [
            {"id": f"row_{i}", "sequence": s, "length": len(s), "ffHelixFlag": 1}
            for i, s in enumerate(
                ["DAEFRHDSGYEVHHQK", "KCNTATCATQRL", "EGVVHGVATVAE", "VQIVYK", "GIGKFLHSAKK"]
            )
        ]
        return _json_response({"rows": rows, "meta": {}})

    transport = _mock_transport(rec.handler(_factory))
    df = pvl.analyze(_FIXTURE, transport=transport)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 5
    assert {"id", "sequence", "length", "ffHelixFlag"} <= set(df.columns)
    assert rec.calls[0]["path"] == "/api/predict/batch"
