"""B15 + E4 — Tabular export with provenance header.

Every exported CSV / TSV / XLSX starts with a four-line provenance block
so a downstream reader can answer the three questions a reviewer asks
about any prediction artifact:

    # Method = TANGO + S4PRED + FF-Helix
    # PVL version = <semver from CITATION.cff>
    # Thresholds = <json-encoded threshold config>
    # Exported at = <ISO-8601 UTC, second precision>

For CSV / TSV the lines are literal comments (``#`` prefix); pandas,
R, and Excel all skip ``#``-prefixed lines when configured to. For
XLSX there is no comment syntax, so the same four lines are written
as the first four rows with the ``#`` prefix preserved in cell A —
visually unambiguous, and a downstream ``pd.read_excel(..., skiprows=4)``
restores the data view.

The block coexists with the existing ``# PVL run_metadata`` block
produced by ``services.run_metadata.format_csv_header``. This module
is the new public-facing E4 surface; ``run_metadata`` continues to
own the reproducibility dump for internal tooling.
"""

from __future__ import annotations

import io
import json
import re
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Literal, Optional

import pandas as pd

ExportFormat = Literal["csv", "tsv", "xlsx"]

# Method line is a constant — the predictor set is the same for every
# export today (Hamodrakas 2007 FF gates layered on TANGO + S4PRED).
# When a new predictor lands, bump this string and the run_metadata
# version constants together so the two headers stay consistent.
METHOD_LINE = "TANGO + S4PRED + FF-Helix"


# ---------------------------------------------------------------------------
# pvl_version resolution
# ---------------------------------------------------------------------------


def _find_citation_cff() -> Optional[Path]:
    """Walk up from this file until a ``CITATION.cff`` is found.

    Returns ``None`` if no CITATION.cff is reachable — e.g. when the
    backend is installed as a wheel without the source tree. In that
    case the export header falls back to ``"unknown"``.
    """
    here = Path(__file__).resolve()
    for parent in [here, *here.parents]:
        candidate = parent / "CITATION.cff"
        if candidate.is_file():
            return candidate
    return None


@lru_cache(maxsize=1)
def get_pvl_version() -> str:
    """Read the ``version:`` field from CITATION.cff.

    Cached for the process lifetime — the file does not change while
    the server runs, and re-reading on every export would burn IO for
    no reason. Returns ``"unknown"`` when CITATION.cff is missing or
    malformed; the export still succeeds with a degraded provenance
    line rather than blowing up the response.
    """
    cff = _find_citation_cff()
    if cff is None:
        return "unknown"
    try:
        text = cff.read_text(encoding="utf-8")
    except OSError:
        return "unknown"

    # The CFF schema mandates a ``version:`` key — match the first one
    # at column 0 so we never pick up ``cff-version:`` or a nested
    # ``version:`` inside an authors block.
    match = re.search(r'^version:\s*["\']?([^"\']+?)["\']?\s*$', text, re.MULTILINE)
    if not match:
        return "unknown"
    return match.group(1).strip()


# ---------------------------------------------------------------------------
# Provenance lines
# ---------------------------------------------------------------------------


def _utc_now_iso() -> str:
    """Current UTC time as ISO-8601 ``YYYY-MM-DDTHH:MM:SSZ``.

    Second precision is enough for an export header — microseconds make
    the line look like a debug log entry. ``Z`` suffix is preferred over
    ``+00:00`` for downstream Excel / R readability.
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_provenance_lines(
    thresholds: Optional[Dict[str, Any]] = None,
    *,
    now_iso: Optional[str] = None,
    pvl_version: Optional[str] = None,
) -> list[str]:
    """Return the 4 provenance lines (no ``#`` prefix, no trailing newline).

    Caller-injectable ``now_iso`` and ``pvl_version`` keep the function
    pure — tests pin both arguments instead of mocking clocks or filesystem.
    """
    thresholds_str = json.dumps(thresholds or {}, sort_keys=True, separators=(",", ":"))
    return [
        f"Method = {METHOD_LINE}",
        f"PVL version = {pvl_version or get_pvl_version()}",
        f"Thresholds = {thresholds_str}",
        f"Exported at = {now_iso or _utc_now_iso()}",
    ]


def _comment_block(lines: list[str]) -> str:
    """Prefix each line with ``# `` and join with newlines (with trailing nl)."""
    return "".join(f"# {line}\n" for line in lines)


# ---------------------------------------------------------------------------
# Writer
# ---------------------------------------------------------------------------


def export_dataframe(
    df: pd.DataFrame,
    fmt: ExportFormat,
    thresholds: Optional[Dict[str, Any]] = None,
    *,
    now_iso: Optional[str] = None,
    pvl_version: Optional[str] = None,
) -> bytes:
    """Serialize ``df`` to ``fmt`` with the four provenance lines prepended.

    Parameters
    ----------
    df
        DataFrame to export. Columns and order are preserved verbatim.
    fmt
        One of ``"csv"`` | ``"tsv"`` | ``"xlsx"``.
    thresholds
        Threshold config dict to encode into the ``# Thresholds = ...``
        line. Pass the resolved config (the one that actually ran),
        not the requested one.
    now_iso, pvl_version
        Test hooks — when omitted, ``_utc_now_iso()`` and
        ``get_pvl_version()`` are used.

    Returns
    -------
    bytes
        The encoded export. CSV / TSV are UTF-8 text; XLSX is the
        binary xlsx zip stream.
    """
    lines = build_provenance_lines(thresholds, now_iso=now_iso, pvl_version=pvl_version)

    if fmt == "csv":
        return (_comment_block(lines) + df.to_csv(index=False)).encode("utf-8")

    if fmt == "tsv":
        return (_comment_block(lines) + df.to_csv(index=False, sep="\t")).encode("utf-8")

    if fmt == "xlsx":
        # XLSX has no native comment syntax for header rows; the
        # standard practice is to emit the metadata as the first
        # rows with a ``#`` prefix in column A so a reader can spot
        # them by inspection and skip them with ``skiprows=N`` if
        # they want pure tabular data.
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            sheet_name = "data"
            workbook = writer.book
            sheet = workbook.create_sheet(sheet_name, 0)
            # Remove the default empty sheet openpyxl creates so the
            # provenance block lands at row 1 rather than on sheet 2.
            if "Sheet" in workbook.sheetnames and "Sheet" != sheet_name:
                del workbook["Sheet"]

            for idx, line in enumerate(lines, start=1):
                sheet.cell(row=idx, column=1, value=f"# {line}")

            df.to_excel(
                writer,
                sheet_name=sheet_name,
                index=False,
                startrow=len(lines),  # leave the provenance rows untouched
            )
        return buffer.getvalue()

    raise ValueError(f"Unsupported export format: {fmt!r}")


__all__ = [
    "METHOD_LINE",
    "build_provenance_lines",
    "export_dataframe",
    "get_pvl_version",
]
