"""B15 + E4 — Export provenance header tests.

Asserts the contract documented in WAVE_2_8_DISPATCH §3:

    # Method = TANGO + S4PRED + FF-Helix
    # PVL version = <CITATION.cff version>
    # Thresholds = <json-encoded threshold config>
    # Exported at = <iso-8601 UTC>

for every supported format (CSV / TSV / XLSX), followed by the data
column header and rows.
"""

from __future__ import annotations

import io
import json

import pandas as pd
import pytest

from services.export import (
    METHOD_LINE,
    build_provenance_lines,
    export_dataframe,
    get_pvl_version,
)

FIXED_NOW = "2026-06-18T12:34:56Z"
FIXED_VERSION = "0.3.0-test"

# Real PVL exports carry both the FF cutoffs the user picked and the
# resolved μH / hydro cutoffs the pipeline applied. Test with a mix
# so the JSON encoding is exercised.
THRESHOLDS = {
    "muHCutoff": 0.388,
    "hydroCutoff": 0.417,
    "ffHelixMinScore": 0.5,
}


@pytest.fixture
def sample_df():
    return pd.DataFrame(
        [
            {"id": "u1", "sequence": "GVGDLIRKAVSVIKNIV", "muH": 0.42, "charge": 2.0},
            {"id": "k1", "sequence": "KLVFFAE", "muH": 0.18, "charge": 0.0},
        ]
    )


# ---------------------------------------------------------------------------
# Provenance line shape — independent of file format
# ---------------------------------------------------------------------------


def test_build_provenance_lines_exact_shape():
    """All four lines present, in order, with the documented prefixes."""
    lines = build_provenance_lines(THRESHOLDS, now_iso=FIXED_NOW, pvl_version=FIXED_VERSION)
    assert lines == [
        f"Method = {METHOD_LINE}",
        f"PVL version = {FIXED_VERSION}",
        f"Thresholds = {json.dumps(THRESHOLDS, sort_keys=True, separators=(',', ':'))}",
        f"Exported at = {FIXED_NOW}",
    ]


def test_build_provenance_lines_empty_thresholds_is_empty_object():
    """Missing thresholds → ``Thresholds = {}`` (not ``Thresholds =``)."""
    lines = build_provenance_lines(None, now_iso=FIXED_NOW, pvl_version=FIXED_VERSION)
    assert lines[2] == "Thresholds = {}"


def test_pvl_version_reads_citation_cff():
    """get_pvl_version() pulls a non-empty semver from CITATION.cff at repo root."""
    version = get_pvl_version()
    # Real CITATION.cff carries a real semver. We accept "unknown" only when
    # the file truly cannot be found — but that should not happen from the
    # checked-out repo, so assert a real string here.
    assert version != "unknown"
    assert version  # non-empty


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------


def test_csv_export_has_all_four_comment_lines(sample_df):
    """CSV body starts with the 4 ``# `` lines, then header, then rows."""
    blob = export_dataframe(
        sample_df,
        fmt="csv",
        thresholds=THRESHOLDS,
        now_iso=FIXED_NOW,
        pvl_version=FIXED_VERSION,
    )
    text = blob.decode("utf-8")

    # First four physical lines are the provenance block.
    lines = text.splitlines()
    assert lines[0] == f"# Method = {METHOD_LINE}"
    assert lines[1] == f"# PVL version = {FIXED_VERSION}"
    assert lines[2].startswith("# Thresholds = ")
    assert lines[3] == f"# Exported at = {FIXED_NOW}"

    # The Thresholds line decodes back to the original dict.
    thresholds_payload = lines[2][len("# Thresholds = ") :]
    assert json.loads(thresholds_payload) == THRESHOLDS

    # Then the data header and at least one row.
    assert lines[4].startswith("id,sequence,muH,charge")
    assert "GVGDLIRKAVSVIKNIV" in text
    assert "KLVFFAE" in text


def test_csv_round_trip_with_comment_skip(sample_df):
    """``pd.read_csv(comment='#')`` should restore the DataFrame exactly."""
    blob = export_dataframe(
        sample_df,
        fmt="csv",
        thresholds=THRESHOLDS,
        now_iso=FIXED_NOW,
        pvl_version=FIXED_VERSION,
    )
    restored = pd.read_csv(io.BytesIO(blob), comment="#")
    pd.testing.assert_frame_equal(restored, sample_df)


# ---------------------------------------------------------------------------
# TSV export
# ---------------------------------------------------------------------------


def test_tsv_export_has_all_four_comment_lines(sample_df):
    blob = export_dataframe(
        sample_df,
        fmt="tsv",
        thresholds=THRESHOLDS,
        now_iso=FIXED_NOW,
        pvl_version=FIXED_VERSION,
    )
    text = blob.decode("utf-8")
    lines = text.splitlines()
    assert lines[0] == f"# Method = {METHOD_LINE}"
    assert lines[1] == f"# PVL version = {FIXED_VERSION}"
    assert lines[2].startswith("# Thresholds = ")
    assert lines[3] == f"# Exported at = {FIXED_NOW}"

    # Data header uses tabs, not commas.
    assert lines[4].split("\t") == ["id", "sequence", "muH", "charge"]


# ---------------------------------------------------------------------------
# XLSX export
# ---------------------------------------------------------------------------


def test_xlsx_export_has_all_four_metadata_rows(sample_df):
    """XLSX has no comment syntax, so the 4 lines appear as the first 4 rows.

    Column A of each metadata row starts with ``# `` so a downstream
    reader can spot them visually and skip with ``skiprows=4``.
    """
    blob = export_dataframe(
        sample_df,
        fmt="xlsx",
        thresholds=THRESHOLDS,
        now_iso=FIXED_NOW,
        pvl_version=FIXED_VERSION,
    )

    # Read raw — no header inference — so we see the metadata rows.
    raw = pd.read_excel(io.BytesIO(blob), header=None)
    assert raw.iloc[0, 0] == f"# Method = {METHOD_LINE}"
    assert raw.iloc[1, 0] == f"# PVL version = {FIXED_VERSION}"
    assert str(raw.iloc[2, 0]).startswith("# Thresholds = ")
    assert raw.iloc[3, 0] == f"# Exported at = {FIXED_NOW}"

    # Data starts at row 4 (0-indexed): col header row, then 2 data rows.
    assert raw.iloc[4, 0] == "id"
    assert raw.iloc[5, 0] == "u1"
    assert raw.iloc[6, 0] == "k1"


def test_xlsx_round_trip_with_skiprows(sample_df):
    """``pd.read_excel(skiprows=4)`` restores the DataFrame exactly.

    Note: XLSX is a typeless storage from the dtype perspective — a column
    whose values happen to be whole numbers (2.0, 0.0) comes back as int64,
    while the original was float64. Compare values, not dtypes.
    """
    blob = export_dataframe(
        sample_df,
        fmt="xlsx",
        thresholds=THRESHOLDS,
        now_iso=FIXED_NOW,
        pvl_version=FIXED_VERSION,
    )
    restored = pd.read_excel(io.BytesIO(blob), skiprows=4)
    pd.testing.assert_frame_equal(restored, sample_df, check_dtype=False)


# ---------------------------------------------------------------------------
# Format validation
# ---------------------------------------------------------------------------


def test_unknown_format_raises(sample_df):
    with pytest.raises(ValueError, match=r"Unsupported export format"):
        export_dataframe(sample_df, fmt="parquet")  # type: ignore[arg-type]
