"""
Smoke tests for the pvl-py SDK scaffold.

These tests do NOT hit a real PVL backend — they stub httpx so the package
can be exercised in isolation. The goal is to confirm the public surface is
wired up: the package imports, exposes ``analyze``, accepts a DataFrame and a
file path, and posts to the expected endpoint.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pandas as pd
import pytest

import pvl


class _StubResponse:
    def __init__(self, payload: dict, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"stub error {self.status_code}")

    def json(self) -> dict:
        return self._payload


class _StubClient:
    """Records the last request and returns a canned JSON payload."""

    last_request: dict | None = None

    def __init__(self, base_url: str = "", timeout: float = 0):
        self.base_url = base_url
        self.timeout = timeout

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return None

    def post(self, url, files=None, data=None):
        type(self).last_request = {
            "base_url": self.base_url,
            "url": url,
            "files": files,
            "data": data,
        }
        return _StubResponse(
            {"rows": [{"id": "P12345"}], "meta": {"traceId": "stub-trace"}}
        )


def test_module_exposes_analyze_and_version() -> None:
    assert callable(pvl.analyze)
    assert isinstance(pvl.__version__, str) and pvl.__version__


def test_analyze_with_dataframe_posts_csv_upload() -> None:
    df = pd.DataFrame([{"Entry": "P12345", "Sequence": "ACDEFGHIKLMNPQRSTVWY"}])

    _StubClient.last_request = None
    with patch("pvl.httpx.Client", _StubClient):
        result = pvl.analyze(df, base_url="http://example.test:9999")

    assert result["meta"]["traceId"] == "stub-trace"
    assert _StubClient.last_request is not None
    assert _StubClient.last_request["url"] == "/api/upload-csv"
    assert _StubClient.last_request["base_url"] == "http://example.test:9999"
    files = _StubClient.last_request["files"]
    assert files is not None and "file" in files
    filename, body, mimetype = files["file"]
    assert filename.endswith(".csv")
    assert b"Entry,Sequence" in body
    assert b"P12345" in body
    assert mimetype == "text/csv"


def test_analyze_with_dataframe_missing_columns_raises() -> None:
    df = pd.DataFrame([{"Entry": "P12345"}])  # no Sequence
    with pytest.raises(ValueError) as excinfo:
        pvl.analyze(df)
    assert "Sequence" in str(excinfo.value)


def test_analyze_with_file_path(tmp_path: Path) -> None:
    csv_path = tmp_path / "input.csv"
    csv_path.write_text("Entry,Sequence\nP00001,ACACAC\n", encoding="utf-8")

    _StubClient.last_request = None
    with patch("pvl.httpx.Client", _StubClient):
        result = pvl.analyze(csv_path)

    assert result["meta"]["traceId"] == "stub-trace"
    assert _StubClient.last_request["files"]["file"][0] == "input.csv"


def test_analyze_with_missing_path_raises(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        pvl.analyze(tmp_path / "does-not-exist.csv")


def test_analyze_passes_threshold_config_dict() -> None:
    df = pd.DataFrame([{"Entry": "P1", "Sequence": "AAAA"}])
    config = {"mode": "custom", "custom": {"hydroCutoff": 0.42}}

    _StubClient.last_request = None
    with patch("pvl.httpx.Client", _StubClient):
        pvl.analyze(df, threshold_config=config)

    sent = _StubClient.last_request["data"]
    assert sent is not None and "thresholdConfig" in sent
    assert json.loads(sent["thresholdConfig"]) == config
