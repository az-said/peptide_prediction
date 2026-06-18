"""B7 — NDJSON streaming endpoint tests.

Covers the contract documented in WAVE_2_8_DISPATCH_2026_06_18.md §6.1:

- response is ``application/x-ndjson``
- ``X-Accel-Buffering: no`` header is present (nginx prod requirement)
- every emitted line is parseable JSON
- exactly one ``row`` event per input peptide
- ``header`` opens with the right total, ``footer`` closes with ``done:true``
- failed peptides emit a per-peptide ``error`` event but don't kill the stream

Tests run with TANGO and S4PRED disabled — the streaming envelope is
provider-agnostic, so we don't need the heavy ensembles to validate it.
"""

from __future__ import annotations

import json
import os

os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")
os.environ.setdefault("VECTOR_INDEX_ENABLED", "0")

from fastapi.testclient import TestClient  # noqa: E402

from api.main import app  # noqa: E402

client = TestClient(app)


def _parse_ndjson(body: str) -> list[dict]:
    """Split an NDJSON body into a list of parsed JSON objects.

    A trailing newline is the documented frame for every event, so empty
    splits at the end are ignored. Asserts every non-empty line is valid
    JSON — a sloppy or partially flushed line should fail the test
    explicitly rather than silently dropping rows.
    """
    events = []
    for line in body.split("\n"):
        if not line.strip():
            continue
        events.append(json.loads(line))  # raises on malformed line
    return events


def test_predict_stream_basic_envelope():
    """Three short peptides → header(3) + 3 rows + footer(done)."""
    payload = {
        "peptides": [
            {"id": "u1", "sequence": "GVGDLIRKAVSVIKNIV"},  # Uperin 3.5
            {"id": "k1", "sequence": "KLVFFAE"},  # Aβ KLVFF core
            {"id": "ll", "sequence": "LLGDFFRKSKEKIGKEFKRIVQRIKDFLR"},  # LL-37 N-term
        ],
        "config": {},
    }

    with client.stream("POST", "/api/predict/stream", json=payload) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("application/x-ndjson")
        # Critical for nginx prod — without it the response buffers and the
        # whole stream arrives at once.
        assert response.headers.get("x-accel-buffering") == "no"
        body = response.read().decode("utf-8")

    events = _parse_ndjson(body)

    # First event is the header with the correct total.
    assert events[0] == {"type": "header", "total": 3}

    # Last event is the footer with done=True.
    assert events[-1] == {"type": "footer", "done": True}

    # Exactly one row event per peptide, in the order they were submitted.
    row_events = [e for e in events if e["type"] == "row"]
    assert len(row_events) == 3
    assert [e["index"] for e in row_events] == [0, 1, 2]
    assert [e["id"] for e in row_events] == ["u1", "k1", "ll"]

    # Each row event carries the normalized peptide entry. We don't pin the
    # full shape here (that's covered by the upload-route tests), just the
    # invariants the streaming envelope guarantees.
    for e in row_events:
        entry = e["entry"]
        assert isinstance(entry, dict)
        assert entry.get("id") or entry.get("Entry") or entry.get("entry")
        assert entry.get("sequence") or entry.get("Sequence")


def test_predict_stream_error_event_per_failed_peptide():
    """A bad peptide emits an error event but doesn't abort the stream.

    Empty sequence is the cheapest pre-pipeline failure — ``create_single_sequence_df``
    raises HTTPException before the predictors are touched.
    """
    payload = {
        "peptides": [
            {"id": "good", "sequence": "GVGDLIRKAVSVIKNIV"},
            {"id": "bad", "sequence": "   "},  # whitespace → corrected to empty
            {"id": "good2", "sequence": "KLVFFAE"},
        ],
        "config": None,
    }

    with client.stream("POST", "/api/predict/stream", json=payload) as response:
        # Pydantic accepts the whitespace ``sequence`` (passes min_length=1);
        # the predict pipeline rejects it during row processing. So this
        # request is well-formed: 200 OK with a mixed event stream.
        assert response.status_code == 200
        body = response.read().decode("utf-8")

    events = _parse_ndjson(body)

    # Header still says 3 (we count requested peptides, not successes).
    assert events[0]["type"] == "header" and events[0]["total"] == 3

    # Footer still closes the stream.
    assert events[-1] == {"type": "footer", "done": True}

    # Inside: 2 row events for the good peptides, 1 error event for the bad one.
    type_counts: dict[str, int] = {}
    for e in events:
        type_counts[e["type"]] = type_counts.get(e["type"], 0) + 1
    assert type_counts.get("row") == 2
    assert type_counts.get("error") == 1

    # The error event carries the failing peptide's id and a human-readable message.
    err = next(e for e in events if e["type"] == "error")
    assert err["id"] == "bad"
    assert err["index"] == 1
    assert isinstance(err["message"], str) and err["message"]


def test_predict_stream_validation_rejects_empty_peptides_list():
    """Empty peptides list → 422 from Pydantic min_length=1."""
    response = client.post("/api/predict/stream", json={"peptides": [], "config": {}})
    assert response.status_code == 422


def test_predict_stream_validation_requires_id_and_sequence():
    """Missing required fields → 422 before any predictor work."""
    response = client.post(
        "/api/predict/stream",
        json={"peptides": [{"id": "x"}], "config": {}},
    )
    assert response.status_code == 422
