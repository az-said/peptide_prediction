"""
pvl-py — thin Python SDK for the Peptide Visual Lab (PVL) prediction API.

The full feature surface (auth, async client, threshold config, streaming
progress) is planned for Wave H. This scaffold exposes a single entry point:

    analyze(input_, base_url=..., timeout=...) -> dict
"""

from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any, Dict, Union

import httpx
import pandas as pd

__version__ = "0.0.1"
__all__ = ["analyze", "__version__"]


DEFAULT_BASE_URL = os.environ.get("PVL_BASE_URL", "http://localhost:8000")
DEFAULT_TIMEOUT = float(os.environ.get("PVL_TIMEOUT", "120"))


def analyze(
    input_: Union[pd.DataFrame, str, Path],
    base_url: str = DEFAULT_BASE_URL,
    timeout: float = DEFAULT_TIMEOUT,
    threshold_config: Union[str, Dict[str, Any], None] = None,
) -> Dict[str, Any]:
    """
    Run a peptide prediction against a PVL backend and return the parsed JSON.

    The SDK posts to ``POST /api/upload-csv`` for both single-sequence and batch
    inputs — the API accepts a one-row CSV uniformly, so this keeps the SDK
    surface tiny.

    Args:
        input_: Either a ``pandas.DataFrame`` (must contain ``Entry`` and
            ``Sequence`` columns) or a path to a CSV/TSV/FASTA file.
        base_url: PVL backend root URL. Defaults to ``$PVL_BASE_URL`` or
            ``http://localhost:8000``.
        timeout: HTTP timeout in seconds (default 120).
        threshold_config: Optional threshold configuration. Accepts a dict
            (will be JSON-encoded) or a pre-encoded JSON string.

    Returns:
        Parsed JSON payload from the API (``rows`` + ``meta``).

    Raises:
        ValueError: If ``input_`` is a DataFrame without the required columns.
        FileNotFoundError: If ``input_`` is a path that does not exist.
        httpx.HTTPStatusError: On non-2xx responses.
    """
    csv_bytes, filename = _coerce_to_csv_bytes(input_)

    files = {"file": (filename, csv_bytes, "text/csv")}
    data: Dict[str, Any] = {}
    if threshold_config is not None:
        if isinstance(threshold_config, dict):
            import json as _json

            data["thresholdConfig"] = _json.dumps(threshold_config)
        else:
            data["thresholdConfig"] = threshold_config

    with httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout) as client:
        resp = client.post("/api/upload-csv", files=files, data=data or None)
        resp.raise_for_status()
        return resp.json()


def _coerce_to_csv_bytes(input_: Union[pd.DataFrame, str, Path]) -> tuple[bytes, str]:
    """Turn the user input into a (bytes, filename) tuple suitable for upload."""
    if isinstance(input_, pd.DataFrame):
        missing = {"Entry", "Sequence"} - set(input_.columns)
        if missing:
            raise ValueError(
                f"DataFrame is missing required column(s): {sorted(missing)}. "
                "Required: 'Entry' and 'Sequence'."
            )
        buf = io.StringIO()
        input_.to_csv(buf, index=False)
        return buf.getvalue().encode("utf-8"), "pvl_input.csv"

    path = Path(input_)
    if not path.exists():
        raise FileNotFoundError(f"Input path does not exist: {path}")
    return path.read_bytes(), path.name
