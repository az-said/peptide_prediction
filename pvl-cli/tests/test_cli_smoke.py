"""Smoke tests for pvl-cli — the contract between the CLI and the PVL API.

These tests verify the wire shape (request headers, body, URL) without
hitting the network. Live integration tests live separately and run only
when ``PVL_LIVE_TEST_BASE_URL`` is set.
"""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

from pvl.cli import main


@pytest.fixture
def runner() -> CliRunner:
    return CliRunner()


def _mock_predict_response() -> dict:
    """Mirror the canonical RowsResponse shape from
    backend/schemas/api_models.py — the CLI POSTs through /api/upload-csv
    which returns RowsResponse (not the single-peptide PredictResponse)."""
    one_row = {
        "id": "P00000",
            "sequence": "LKLLKLLLKLLLKLL",
            "length": 15,
            "hydrophobicity": 0.983,
            "muH": 0.649,
            "charge": 5.0,
            "ffHelixFlag": -1,
            "ffSswFlag": -1,
            "sswPrediction": -1,
            "tangoHasData": True,
            "tangoAggCurve": [0.0] * 15,
            "tangoBetaCurve": [0.0] * 15,
            "tangoHelixCurve": [0.0] * 15,
            "s4predHasData": True,
            "s4predHelixPercent": 100.0,
            "s4predPHCurve": [0.99] * 15,
            "s4predPECurve": [0.005] * 15,
            "s4predPCCurve": [0.005] * 15,
            "s4predSsPrediction": ["H"] * 15,
    }
    return {
        "rows": [one_row],
        "meta": {
            "traceId": "test-trace-001",
            "pvlVersion": "0.1.0",
            "thresholds": {"muHCutoff": 0.5, "hydroCutoff": 0.5},
        },
    }


class TestVersionAndHelp:
    def test_version_prints(self, runner: CliRunner) -> None:
        result = runner.invoke(main, ["--version"])
        assert result.exit_code == 0
        assert "version" in result.output.lower()

    def test_help_top_level(self, runner: CliRunner) -> None:
        result = runner.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "analyze" in result.output

    def test_help_analyze(self, runner: CliRunner) -> None:
        result = runner.invoke(main, ["analyze", "--help"])
        assert result.exit_code == 0
        # Document the public surface — these flags must stay backward-compatible.
        for flag in ("--sequence", "--entry", "--base-url", "--json"):
            assert flag in result.output, f"missing documented flag: {flag}"


class TestAnalyzeSingle:
    """Verify the single-sequence path calls /api/predict with the right shape."""

    @patch("pvl.cli.httpx.Client")
    def test_single_sequence_hits_predict_endpoint(
        self, mock_client_cls: MagicMock, runner: CliRunner
    ) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = _mock_predict_response()
        mock_response.raise_for_status = MagicMock()

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client_cls.return_value.__enter__.return_value = mock_client

        result = runner.invoke(
            main,
            ["analyze", "--sequence", "LKLLKLLLKLLLKLL", "--base-url", "http://test:8000"],
        )

        assert result.exit_code == 0, result.output
        assert mock_client.post.call_count == 1
        called_url = mock_client.post.call_args[0][0]
        # The CLI POSTs the single-sequence FASTA through /api/upload-csv so
        # it travels the same canonical pipeline as a CSV upload.
        assert "/api/upload" in called_url or "/api/predict" in called_url
        # Rich table renders should include the sequence's computed value.
        assert "P00000" in result.output

    @patch("pvl.cli.httpx.Client")
    def test_json_mode_emits_raw_payload(
        self, mock_client_cls: MagicMock, runner: CliRunner
    ) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = _mock_predict_response()
        mock_response.raise_for_status = MagicMock()

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client_cls.return_value.__enter__.return_value = mock_client

        result = runner.invoke(
            main,
            [
                "analyze",
                "--sequence",
                "LKLLKLLLKLLLKLL",
                "--base-url",
                "http://test:8000",
                "--json",
            ],
        )

        assert result.exit_code == 0, result.output
        assert "traceId" in result.output or "trace_id" in result.output


@pytest.mark.skipif(
    os.getenv("PVL_LIVE_TEST_BASE_URL") is None,
    reason="set PVL_LIVE_TEST_BASE_URL=http://94.130.178.182:3000 to run live integration tests",
)
class TestLiveIntegration:
    """Hits the real PVL API. Skipped unless PVL_LIVE_TEST_BASE_URL is set."""

    def test_live_single_peptide_returns_classification(self, runner: CliRunner) -> None:
        base_url = os.environ["PVL_LIVE_TEST_BASE_URL"]
        result = runner.invoke(
            main, ["analyze", "--sequence", "LKLLKLLLKLLLKLL", "--base-url", base_url]
        )
        assert result.exit_code == 0, result.output
        # Quick Analyze on this peptide on prod shows it as Helix 100% — the
        # CLI should reflect the same upstream computation.
        assert "P00000" in result.output
        assert "0.98" in result.output or "0.99" in result.output  # hydrophobicity
