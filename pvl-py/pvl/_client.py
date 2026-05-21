"""HTTP plumbing for pvl-py — sync + async httpx clients with sensible defaults.

This module is intentionally small. The public surface in ``pvl/__init__.py``
calls ``request(method, path, ...)`` for sync work and ``arequest(...)`` for
async work; both build a fresh httpx client per call so the SDK stays
thread-safe and so users don't have to remember to close anything.

Server URL resolution order (highest wins):
    1. Explicit ``server_url=`` kwarg on the call.
    2. Value set via ``pvl.set_default_server(url)``.
    3. ``PVL_SERVER_URL`` environment variable.
    4. ``http://localhost:8000`` (assumes user is running ``make backend``).

Retries: 503 / 504 (server warming up) get one retry with a short back-off.
4xx (client errors — validation, unknown route, etc.) NEVER retry — those
are real and should surface immediately so the user fixes their input.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import httpx

DEFAULT_SERVER_URL = "http://localhost:8000"
DEFAULT_TIMEOUT_SECONDS = 600.0

# Retry policy — kept minimal so a slow PVL backend coming out of cold-start
# doesn't surface as a one-shot 503 to the notebook user.
_RETRY_STATUS_CODES = frozenset({503, 504})
_MAX_RETRIES = 1
_RETRY_BACKOFF_S = 0.5


# Process-level override set via ``pvl.set_default_server(url)``. Only honored
# when no ``server_url=`` is passed to the individual function call. Stored in
# a small dict-of-one so the public API ``set_default_server`` and the
# resolver here share the same mutable cell without globals dancing.
_session_state: Dict[str, Optional[str]] = {"server_url": None}


def set_default_server(url: Optional[str]) -> None:
    """Set the server URL used by every subsequent pvl call in this session.

    Pass ``None`` to clear and fall back to ``PVL_SERVER_URL`` or the built-in
    default. Mutates a module-level state on purpose — Jupyter notebooks
    typically call this once at the top of the session.
    """
    _session_state["server_url"] = url.rstrip("/") if url else None


def resolve_server_url(explicit: Optional[str] = None) -> str:
    """Return the server URL to use, following the documented precedence."""
    if explicit:
        return explicit.rstrip("/")
    if _session_state.get("server_url"):
        return str(_session_state["server_url"])
    env = os.environ.get("PVL_SERVER_URL")
    if env:
        return env.rstrip("/")
    return DEFAULT_SERVER_URL


def _should_retry(status: int, attempt: int) -> bool:
    return attempt < _MAX_RETRIES and status in _RETRY_STATUS_CODES


def _raise_for_status(response: httpx.Response, *, method: str, path: str) -> None:
    """Surface a useful error message when the backend returns ≥400.

    The body of a PVL 4xx response is the canonical FastAPI ``{"detail": ...}``
    shape; we copy it into the exception so users see the real complaint
    (e.g. "Pass exactly one of 'sequences' or 'dataset_id'") rather than a
    bare HTTP status code.
    """
    if response.status_code < 400:
        return
    try:
        detail = response.json().get("detail", response.text)
    except ValueError:
        detail = response.text
    raise httpx.HTTPStatusError(
        f"PVL backend returned {response.status_code} for {method} {path}: {detail}",
        request=response.request,
        response=response,
    )


def request(
    method: str,
    path: str,
    *,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    json: Optional[Any] = None,
    data: Optional[Dict[str, Any]] = None,
    files: Optional[Dict[str, Any]] = None,
    content: Optional[bytes] = None,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
    transport: Optional[httpx.BaseTransport] = None,
) -> Any:
    """Send a sync HTTP request to the PVL backend and return parsed JSON.

    ``transport`` is a test-only seam — ``httpx.MockTransport`` lets the
    unit-test suite avoid hitting a real backend.
    """
    base = resolve_server_url(server_url)
    last_response: Optional[httpx.Response] = None
    for attempt in range(_MAX_RETRIES + 1):
        with httpx.Client(base_url=base, timeout=timeout, transport=transport) as client:
            response = client.request(
                method=method,
                url=path,
                json=json,
                data=data,
                files=files,
                content=content,
                headers=headers,
                params=params,
            )
        if _should_retry(response.status_code, attempt):
            time.sleep(_RETRY_BACKOFF_S * (attempt + 1))
            last_response = response
            continue
        _raise_for_status(response, method=method, path=path)
        return response.json() if response.content else None
    assert last_response is not None
    _raise_for_status(last_response, method=method, path=path)
    return last_response.json() if last_response.content else None


async def arequest(
    method: str,
    path: str,
    *,
    server_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    json: Optional[Any] = None,
    data: Optional[Dict[str, Any]] = None,
    files: Optional[Dict[str, Any]] = None,
    content: Optional[bytes] = None,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
    transport: Optional[httpx.AsyncBaseTransport] = None,
) -> Any:
    """Async version of :func:`request` — same contract, ``await`` it."""
    import asyncio

    base = resolve_server_url(server_url)
    last_response: Optional[httpx.Response] = None
    for attempt in range(_MAX_RETRIES + 1):
        async with httpx.AsyncClient(
            base_url=base, timeout=timeout, transport=transport
        ) as client:
            response = await client.request(
                method=method,
                url=path,
                json=json,
                data=data,
                files=files,
                content=content,
                headers=headers,
                params=params,
            )
        if _should_retry(response.status_code, attempt):
            await asyncio.sleep(_RETRY_BACKOFF_S * (attempt + 1))
            last_response = response
            continue
        _raise_for_status(response, method=method, path=path)
        return response.json() if response.content else None
    assert last_response is not None
    _raise_for_status(last_response, method=method, path=path)
    return last_response.json() if last_response.content else None


__all__ = [
    "DEFAULT_SERVER_URL",
    "DEFAULT_TIMEOUT_SECONDS",
    "arequest",
    "request",
    "resolve_server_url",
    "set_default_server",
]
