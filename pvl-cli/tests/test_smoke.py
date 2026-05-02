"""
Smoke tests for the pvl-cli scaffold.

Verifies wiring without hitting a real backend:
  - The console script imports.
  - ``pvl --help`` and ``pvl analyze --help`` exit 0 and mention the analyze command.
  - Calling ``pvl analyze --sequence ...`` POSTs to /api/upload-csv with a one-row CSV
    and pretty-prints the response.
  - Mutually-exclusive args (INPUT_FILE + --sequence) error cleanly.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from click.testing import CliRunner

import pvl
from pvl import cli as cli_mod


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
        }
        return _StubResponse(
            {
                "rows": [
                    {
                        "id": "P00001",
                        "length": 6,
                        "hydrophobicity": 0.42,
                        "muH": 0.31,
                        "ffHelixFlag": 1,
                        "ffSswFlag": -1,
                    }
                ],
                "meta": {"traceId": "stub-trace-cli"},
            }
        )


@pytest.fixture
def runner() -> CliRunner:
    return CliRunner()


def test_module_exposes_main_and_version() -> None:
    assert hasattr(cli_mod, "main")
    assert callable(cli_mod.main)
    assert isinstance(pvl.__version__, str) and pvl.__version__


def test_top_level_help(runner: CliRunner) -> None:
    result = runner.invoke(cli_mod.main, ["--help"])
    assert result.exit_code == 0, result.output
    assert "analyze" in result.output


def test_analyze_help(runner: CliRunner) -> None:
    result = runner.invoke(cli_mod.main, ["analyze", "--help"])
    assert result.exit_code == 0, result.output
    assert "--sequence" in result.output
    assert "--base-url" in result.output


def test_analyze_with_sequence_pretty_prints(runner: CliRunner) -> None:
    _StubClient.last_request = None
    with patch.object(cli_mod, "httpx", new=_FakeHttpx):
        result = runner.invoke(
            cli_mod.main,
            [
                "analyze",
                "--sequence",
                "ACDEFG",
                "--entry",
                "P00001",
                "--base-url",
                "http://example.test:9999",
            ],
        )
    assert result.exit_code == 0, result.output
    assert "P00001" in result.output
    assert "stub-trace-cli" in result.output

    assert _StubClient.last_request is not None
    assert _StubClient.last_request["url"] == "/api/upload-csv"
    assert _StubClient.last_request["base_url"] == "http://example.test:9999"
    filename, body, mimetype = _StubClient.last_request["files"]["file"]
    assert filename.endswith(".csv")
    assert b"Entry,Sequence" in body
    assert b"P00001,ACDEFG" in body
    assert mimetype == "text/csv"


def test_analyze_with_file_path(runner: CliRunner, tmp_path: Path) -> None:
    csv_path = tmp_path / "input.csv"
    csv_path.write_text("Entry,Sequence\nQ1,ACAC\n", encoding="utf-8")

    _StubClient.last_request = None
    with patch.object(cli_mod, "httpx", new=_FakeHttpx):
        result = runner.invoke(cli_mod.main, ["analyze", str(csv_path)])
    assert result.exit_code == 0, result.output
    assert _StubClient.last_request["files"]["file"][0] == "input.csv"


def test_analyze_json_output(runner: CliRunner) -> None:
    with patch.object(cli_mod, "httpx", new=_FakeHttpx):
        result = runner.invoke(
            cli_mod.main,
            ["analyze", "--sequence", "ACAC", "--json"],
        )
    assert result.exit_code == 0, result.output
    assert '"traceId": "stub-trace-cli"' in result.output


def test_analyze_requires_input_or_sequence(runner: CliRunner) -> None:
    result = runner.invoke(cli_mod.main, ["analyze"])
    assert result.exit_code != 0
    assert "INPUT_FILE" in result.output or "--sequence" in result.output


def test_analyze_rejects_both_input_and_sequence(
    runner: CliRunner, tmp_path: Path
) -> None:
    csv_path = tmp_path / "input.csv"
    csv_path.write_text("Entry,Sequence\nQ1,ACAC\n", encoding="utf-8")
    result = runner.invoke(
        cli_mod.main,
        ["analyze", str(csv_path), "--sequence", "ACAC"],
    )
    assert result.exit_code != 0
    assert "mutually exclusive" in result.output


# ---------------------------------------------------------------------------
# Stub helpers
# ---------------------------------------------------------------------------


class _FakeHttpx:
    """Stand-in for the ``httpx`` module — only ``Client`` and ``HTTPError`` are used."""

    Client = _StubClient

    class HTTPError(Exception):
        pass
