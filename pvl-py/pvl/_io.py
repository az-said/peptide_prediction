"""Input coercion helpers for ``pvl.analyze`` — file paths, DataFrames, lists.

The PVL backend accepts two batch shapes today:

- ``POST /api/upload-csv`` (multipart): CSV/TSV/XLSX file via ``file`` field.
- ``POST /api/predict/batch`` (raw body): FASTA bytes with
  ``Content-Type: text/x-fasta``, or CSV bytes with ``Content-Type: text/csv``.

This module turns whatever the caller passed (DataFrame, file path, list of
sequences) into a (route, kwargs) tuple the HTTP layer can dispatch with
zero further branching. Keeps the public ``analyze`` function tiny.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple, Union

import pandas as pd

# Content-type constants — matches what the §H backend route accepts.
_FASTA_CONTENT_TYPE = "text/x-fasta"
_CSV_CONTENT_TYPE = "text/csv"

# File-extension routing: FASTA goes raw-body; everything else goes multipart.
_FASTA_EXTS = {".fasta", ".fa", ".faa", ".fna"}


AnalyzeInput = Union[
    pd.DataFrame,
    str,
    Path,
    List[str],
    Iterable[str],
]


def _df_from_sequences(seqs: Iterable[str]) -> pd.DataFrame:
    """Wrap a bare sequence iterable into a 2-column ``Entry,Sequence`` DataFrame."""
    rows = []
    for i, seq in enumerate(seqs, start=1):
        if not isinstance(seq, str):
            raise ValueError(
                f"sequence at index {i - 1} is not a string: {type(seq).__name__}"
            )
        rows.append({"Entry": f"seq_{i}", "Sequence": seq})
    if not rows:
        raise ValueError("sequence list is empty — pass at least one sequence.")
    return pd.DataFrame(rows, columns=["Entry", "Sequence"])


def _df_to_csv_bytes(df: pd.DataFrame) -> bytes:
    """DataFrame → utf-8 CSV bytes ready for an HTTP body."""
    missing = {"Entry", "Sequence"} - set(df.columns)
    # Tolerate frontend-style 'id' + 'sequence' too (matches the JS client) so
    # `pvl.analyze(pd.DataFrame({'sequence': [...]}))` Just Works.
    if "sequence" in df.columns and "Sequence" not in df.columns:
        df = df.rename(columns={"sequence": "Sequence", "id": "Entry"})
        missing = {"Entry", "Sequence"} - set(df.columns)
    if "Entry" not in df.columns and "Sequence" in df.columns:
        df = df.copy()
        df.insert(0, "Entry", [f"seq_{i + 1}" for i in range(len(df))])
        missing = set()
    if missing:
        raise ValueError(
            f"DataFrame missing required column(s): {sorted(missing)}. "
            "Required: 'Entry' (or 'id') and 'Sequence' (or 'sequence')."
        )
    buf = io.StringIO()
    df[["Entry", "Sequence"]].to_csv(buf, index=False)
    return buf.getvalue().encode("utf-8")


def coerce_to_request(source: AnalyzeInput) -> Tuple[str, Dict[str, Any]]:
    """Return ``(path, request_kwargs)`` to feed into ``_client.request``.

    The returned kwargs slot directly into ``request(method='POST', ...)`` —
    no further branching at the call site.

    Resolution:
        - DataFrame                       → multipart POST /api/upload-csv
        - list[str] / iterable of str    → multipart POST /api/upload-csv
        - .fasta / .fa / .faa / .fna     → raw POST /api/predict/batch
        - .csv / .tsv / .xlsx / other    → multipart POST /api/upload-csv
    """
    # DataFrame — most common notebook path.
    if isinstance(source, pd.DataFrame):
        csv_bytes = _df_to_csv_bytes(source)
        return (
            "/api/upload-csv",
            {"files": {"file": ("pvl_input.csv", csv_bytes, _CSV_CONTENT_TYPE)}},
        )

    # File path (str or Path) — decide by extension.
    if isinstance(source, (str, Path)):
        path = Path(source)
        if not path.exists():
            # If the string isn't a path, assume it's a raw sequence —
            # convert to a 1-element list so ``pvl.analyze('GIGAVL')`` works.
            if isinstance(source, str) and _looks_like_sequence(source):
                return coerce_to_request([source])
            raise FileNotFoundError(f"Input path does not exist: {path}")
        ext = path.suffix.lower()
        body = path.read_bytes()
        if ext in _FASTA_EXTS or body.lstrip(b"\xef\xbb\xbf").lstrip().startswith(b">"):
            return (
                "/api/predict/batch",
                {"content": body, "headers": {"Content-Type": _FASTA_CONTENT_TYPE}},
            )
        # CSV / TSV / XLSX / other → multipart with the original filename.
        return (
            "/api/upload-csv",
            {"files": {"file": (path.name, body, _CSV_CONTENT_TYPE)}},
        )

    # Iterable of strings — wrap in a DataFrame and reuse the multipart path.
    if hasattr(source, "__iter__"):
        df = _df_from_sequences(source)
        return coerce_to_request(df)

    raise TypeError(
        f"Unsupported input type for pvl.analyze: {type(source).__name__}. "
        "Accepted: pandas.DataFrame, path-like, list[str]."
    )


def _looks_like_sequence(s: str) -> bool:
    """Heuristic: a single token of ≥2 amino-acid letters with no separators."""
    if len(s) < 2 or len(s) > 5000:
        return False
    # Allow standard + ambiguous AAs (BJOUXZ) which the backend tolerates.
    allowed = set("ACDEFGHIKLMNPQRSTVWYBJOUXZ")
    return all(c.upper() in allowed for c in s if not c.isspace())


__all__ = ["AnalyzeInput", "coerce_to_request"]
