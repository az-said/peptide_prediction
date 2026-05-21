"""pvl-py — Python SDK for the Peptide Visual Lab (PVL) REST API.

A thin, dependency-light wrapper that lets a Jupyter notebook author run the
PVL pipeline against their own backend (``http://localhost:8000`` by default)
without learning the HTTP details::

    import pvl
    df = pvl.analyze("seqs.fasta")
    top = pvl.rank(df, preset="helix", top_n=10)
    similar = pvl.find_similar(top.iloc[0]["id"], k=5)

Every function returns a ``pandas.DataFrame`` because that is what Jupyter
users expect; the meta envelope from the underlying REST response is dropped.
Use the REST API directly if you need ``meta.runMetadata`` / ``meta.runId``.

Per ADR-015 this package targets the public REST API — it does NOT bundle
the PVL scientific code. ``pip install pvl-py`` is frictionless because the
heavy ML dependencies (PyTorch, ESM-2, LanceDB) live in the backend service.

Server URL resolution (highest wins):
    1. ``server_url=`` kwarg on the call
    2. ``pvl.set_default_server(url)`` if called this session
    3. ``PVL_SERVER_URL`` environment variable
    4. ``http://localhost:8000``
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

from ._client import (
    DEFAULT_SERVER_URL,
    DEFAULT_TIMEOUT_SECONDS,
    arequest,
    request,
    set_default_server,
)
from ._io import AnalyzeInput, coerce_to_request

__version__ = "0.1.0"

__all__ = [
    "DEFAULT_SERVER_URL",
    "aanalyze",
    "afind_similar",
    "analyze",
    "arank",
    "asearch_uniprot",
    "find_similar",
    "rank",
    "search_uniprot",
    "set_default_server",
    "__version__",
]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _rows_to_df(payload: Any, *, row_key: str = "rows") -> pd.DataFrame:
    """Pull the canonical PVL row list out of an API response and return it as
    a DataFrame. Tolerates both the upload-csv shape (``{rows, meta}``) and
    the predict shape (``{row, meta}``) so callers don't have to branch.

    Returns an empty DataFrame when the response carries no rows — callers
    chaining ``.head()`` get sensible behaviour for empty datasets.
    """
    if payload is None:
        return pd.DataFrame()
    if isinstance(payload, dict):
        rows = payload.get(row_key)
        if rows is None and "row" in payload:
            rows = [payload["row"]]
        if rows is None:
            return pd.DataFrame()
        return pd.DataFrame(rows)
    if isinstance(payload, list):
        return pd.DataFrame(payload)
    raise TypeError(f"Unexpected API response type: {type(payload).__name__}")


def _df_to_sequences(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert an analysed DataFrame into a list of dicts the backend's
    /api/rank, /api/compare, etc. endpoints accept directly.

    ``rank_candidates`` (and the §I MCP tool) ranks ``sequences`` — they expect
    the canonical PVL camelCase shape with ``id`` and ``sequence`` plus
    whatever classification / biochem columns are present.
    """
    return df.to_dict(orient="records")


# ---------------------------------------------------------------------------
# Sync API
# ---------------------------------------------------------------------------


def analyze(
    source: AnalyzeInput,
    *,
    server_url: Optional[str] = None,
    run_tango: bool = True,
    run_s4pred: bool = True,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Run the PVL pipeline on ``source`` and return a peptide DataFrame.

    Args:
        source: One of: ``pandas.DataFrame`` with a ``sequence`` (or
            ``Sequence``) column; path to a ``.csv`` / ``.tsv`` / ``.xlsx`` /
            ``.fasta`` / ``.fa`` file; or a list of raw sequence strings.
        server_url: PVL backend base URL. Honors ``PVL_SERVER_URL`` /
            ``pvl.set_default_server()`` when omitted.
        run_tango: Whether the backend should run TANGO. The current PVL
            REST API doesn't expose this per-request — the toggle is honored
            at the global ``USE_TANGO`` env-var level on the backend. The
            argument is kept on the SDK surface for forward-compat (when the
            backend gains per-request predictor toggles, this will plumb
            through automatically). Default ``True``.
        run_s4pred: Same forward-compat story as ``run_tango``.
        timeout: HTTP timeout in seconds. Default 600s (covers a full-length
            UniProt result with S4PRED on a CX33 VPS).
        transport: Test-only ``httpx.MockTransport`` seam. Production code
            should leave this ``None``.

    Returns:
        ``pandas.DataFrame`` with the canonical PVL columns: ``id``,
        ``sequence``, ``length``, ``hydrophobicity``, ``muH``, ``charge``,
        ``tangoAggMax``, ``ffHelixPercent``, ``ffHelixFlag``, ``ffSswFlag``,
        ``sswPrediction``, ``s4predHelixPercent`` and others that the
        backend's normalization step adds.
    """
    del run_tango, run_s4pred  # forward-compat stubs; no per-request route today
    path, kwargs = coerce_to_request(source)
    payload = request(
        "POST",
        path,
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        **kwargs,
    )
    return _rows_to_df(payload)


def rank(
    df: pd.DataFrame,
    *,
    weights: Optional[Dict[str, float]] = None,
    preset: Optional[str] = None,
    top_n: int = 10,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Rank peptides via ``POST /api/rank`` and return a DataFrame.

    The returned DataFrame has two columns added to the original peptide
    fields: ``score`` (in ``[0, 1]``) and ``reasons`` (list of short
    domain-grounded explanations, e.g. ``["High S4PRED helix coverage
    (78%)", "Low hydrophobicity (0.10)"]``). Sorted by ``score`` desc.

    Either ``weights`` or ``preset`` may be provided; if both, the backend
    uses ``weights`` and echoes the preset for reference. Valid presets:
    ``equal``, ``amyloid``, ``helix``, ``switch``.
    """
    body: Dict[str, Any] = {
        "sequences": _df_to_sequences(df),
        "top_n": int(top_n),
    }
    if preset is not None:
        body["preset"] = preset
    if weights is not None:
        body["weights"] = weights

    payload = request(
        "POST",
        "/api/rank",
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        json=body,
    )
    if not isinstance(payload, dict) or "ranked" not in payload:
        return pd.DataFrame()
    rows = []
    for entry in payload["ranked"]:
        peptide = dict(entry.get("peptide", {}))
        peptide["score"] = entry.get("score")
        peptide["reasons"] = entry.get("reasons", [])
        rows.append(peptide)
    return pd.DataFrame(rows)


def search_uniprot(
    query: str,
    *,
    organism: Optional[int] = None,
    length_min: Optional[int] = None,
    length_max: Optional[int] = None,
    reviewed: bool = True,
    page_size: int = 100,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Search UniProt via ``POST /api/uniprot/execute`` and return a DataFrame.

    Wraps the same UniProt-execute path the web UI uses. ``page_size`` maps
    to the backend's ``size`` parameter — the backend handles pagination
    internally up to 10,000 results.
    """
    body: Dict[str, Any] = {
        "query": query,
        "reviewed": reviewed,
        "size": int(page_size),
        "run_tango": False,
        "run_s4pred": False,
    }
    if organism is not None:
        body["organism_id"] = str(organism)
    if length_min is not None:
        body["length_min"] = int(length_min)
    if length_max is not None:
        body["length_max"] = int(length_max)

    payload = request(
        "POST",
        "/api/uniprot/execute",
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        json=body,
    )
    return _rows_to_df(payload)


def find_similar(
    reference_id: str,
    *,
    k: int = 10,
    dataset_id: Optional[str] = None,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Find the k peptides most similar to ``reference_id`` (LanceDB / ESM-2).

    Returns a DataFrame with the canonical PVL peptide columns plus a
    ``distance`` column (cosine on L2-normalized ESM-2 embeddings; lower
    = more similar). The reference must already be in the index — analyse
    it via ``pvl.analyze(...)`` first.

    Empty DataFrame when the reference isn't in the index (NOT an error —
    matches the §D frontend contract).
    """
    body: Dict[str, Any] = {"reference_id": reference_id, "k": int(k)}
    if dataset_id is not None:
        body["dataset_id"] = dataset_id
    payload = request(
        "POST",
        "/api/peptides/similar",
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        json=body,
    )
    if not isinstance(payload, dict) or "results" not in payload:
        return pd.DataFrame()
    rows = []
    for entry in payload["results"]:
        peptide = dict(entry.get("peptide", {}))
        peptide["distance"] = entry.get("distance")
        rows.append(peptide)
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Async API — Jupyter ``await`` patterns
# ---------------------------------------------------------------------------


async def aanalyze(
    source: AnalyzeInput,
    *,
    server_url: Optional[str] = None,
    run_tango: bool = True,
    run_s4pred: bool = True,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Async version of :func:`analyze`."""
    del run_tango, run_s4pred
    path, kwargs = coerce_to_request(source)
    payload = await arequest(
        "POST",
        path,
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        **kwargs,
    )
    return _rows_to_df(payload)


async def arank(
    df: pd.DataFrame,
    *,
    weights: Optional[Dict[str, float]] = None,
    preset: Optional[str] = None,
    top_n: int = 10,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Async version of :func:`rank`."""
    body: Dict[str, Any] = {
        "sequences": _df_to_sequences(df),
        "top_n": int(top_n),
    }
    if preset is not None:
        body["preset"] = preset
    if weights is not None:
        body["weights"] = weights
    payload = await arequest(
        "POST",
        "/api/rank",
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        json=body,
    )
    if not isinstance(payload, dict) or "ranked" not in payload:
        return pd.DataFrame()
    rows = []
    for entry in payload["ranked"]:
        peptide = dict(entry.get("peptide", {}))
        peptide["score"] = entry.get("score")
        peptide["reasons"] = entry.get("reasons", [])
        rows.append(peptide)
    return pd.DataFrame(rows)


async def asearch_uniprot(
    query: str,
    *,
    organism: Optional[int] = None,
    length_min: Optional[int] = None,
    length_max: Optional[int] = None,
    reviewed: bool = True,
    page_size: int = 100,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Async version of :func:`search_uniprot`."""
    body: Dict[str, Any] = {
        "query": query,
        "reviewed": reviewed,
        "size": int(page_size),
        "run_tango": False,
        "run_s4pred": False,
    }
    if organism is not None:
        body["organism_id"] = str(organism)
    if length_min is not None:
        body["length_min"] = int(length_min)
    if length_max is not None:
        body["length_max"] = int(length_max)
    payload = await arequest(
        "POST",
        "/api/uniprot/execute",
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        json=body,
    )
    return _rows_to_df(payload)


async def afind_similar(
    reference_id: str,
    *,
    k: int = 10,
    dataset_id: Optional[str] = None,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    transport: Any = None,
) -> pd.DataFrame:
    """Async version of :func:`find_similar`."""
    body: Dict[str, Any] = {"reference_id": reference_id, "k": int(k)}
    if dataset_id is not None:
        body["dataset_id"] = dataset_id
    payload = await arequest(
        "POST",
        "/api/peptides/similar",
        server_url=server_url,
        timeout=timeout,
        transport=transport,
        json=body,
    )
    if not isinstance(payload, dict) or "results" not in payload:
        return pd.DataFrame()
    rows = []
    for entry in payload["results"]:
        peptide = dict(entry.get("peptide", {}))
        peptide["distance"] = entry.get("distance")
        rows.append(peptide)
    return pd.DataFrame(rows)
