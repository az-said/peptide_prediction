"""Single + batch prediction endpoints."""

import asyncio
import json
from typing import Any, Dict, List, Optional

import anyio
from fastapi import APIRouter, Form, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from schemas.api_models import PredictResponse, RowsResponse
from services.dataframe_utils import parse_fasta, read_any_table, require_cols
from services.logger import log_info, log_warning
from services.normalize import create_single_sequence_df, normalize_cols
from services.predict_service import process_single_sequence
from services.thresholds import parse_threshold_config
from services.upload_service import UploadProcessingError, process_upload_dataframe

router = APIRouter()


# ---------------------------------------------------------------------------
# B7 — NDJSON streaming endpoint
# ---------------------------------------------------------------------------
# Per WAVE_2_8_DISPATCH_2026_06_18.md §6.1, large batches stream peptide
# results back as newline-delimited JSON so the UI can render progressively
# instead of waiting on a single multi-minute POST. The non-streaming
# /api/predict (single) and /api/predict/batch (small batch) routes stay
# unchanged — only this new route emits NDJSON.


class PredictStreamPeptide(BaseModel):
    """One peptide in a stream request."""

    id: str = Field(..., min_length=1, max_length=128)
    sequence: str = Field(..., min_length=1, max_length=4096)


class PredictStreamRequest(BaseModel):
    """Body for ``POST /api/predict/stream``.

    Shape is intentionally aligned with the Cowork frontend hook
    (``useStreamingPredict``) — peptide list + optional threshold config.
    """

    peptides: List[PredictStreamPeptide] = Field(..., min_length=1, max_length=5000)
    config: Optional[Dict[str, Any]] = None


def _predict_one_for_stream(
    peptide_id: str,
    sequence: str,
    threshold_config_requested: Optional[Dict[str, Any]],
    threshold_config_resolved: Dict[str, Any],
) -> Dict[str, Any]:
    """Run the single-sequence predict pipeline for one peptide.

    Runs in a worker thread (via ``anyio.to_thread.run_sync``) so the event
    loop stays free to flush bytes to the client between peptides. Returns
    the normalized peptide row dict — meta is discarded; the stream's
    footer event is the only per-stream metadata we emit.
    """
    df = create_single_sequence_df(sequence, peptide_id)
    result = process_single_sequence(
        df=df,
        threshold_config_requested=threshold_config_requested,
        threshold_config_resolved=threshold_config_resolved,
    )
    return result.get("row", {})


async def _stream_predict_events(req: PredictStreamRequest):
    """Async generator that yields one NDJSON event per line.

    Event types:
      - ``header`` — first event, carries ``total``.
      - ``row``    — per successful peptide, carries the normalized entry.
      - ``error``  — per failed peptide, carries the error message.
      - ``footer`` — last event, ``done: true``.

    Cancellation: the ``await anyio.sleep(0)`` between peptides gives the
    asyncio scheduler a chance to deliver a client disconnect as a
    ``CancelledError``; we swallow it and stop emitting.
    """
    # Parse threshold config once for the whole stream — the same config is
    # applied to every peptide so the response is deterministic vs the
    # single-shot /api/predict route.
    config_json = json.dumps(req.config) if req.config is not None else None
    threshold_config_requested, threshold_config_resolved = parse_threshold_config(config_json)

    total = len(req.peptides)
    log_info(
        "predict_stream_start",
        f"peptides={total}",
        stage="stream",
        peptide_count=total,
    )

    yield json.dumps({"type": "header", "total": total}) + "\n"

    try:
        for index, pep in enumerate(req.peptides):
            try:
                entry = await anyio.to_thread.run_sync(
                    _predict_one_for_stream,
                    pep.id,
                    pep.sequence,
                    threshold_config_requested,
                    threshold_config_resolved,
                )
                yield (
                    json.dumps({"type": "row", "index": index, "id": pep.id, "entry": entry}) + "\n"
                )
            except Exception as exc:  # noqa: BLE001 — per-peptide isolation by design
                log_warning(
                    "predict_stream_row_error",
                    f"Peptide {pep.id} failed: {exc}",
                    peptide_id=pep.id,
                    index=index,
                    error=str(exc),
                )
                yield (
                    json.dumps(
                        {
                            "type": "error",
                            "index": index,
                            "id": pep.id,
                            "message": str(exc),
                        }
                    )
                    + "\n"
                )
            # Cooperative cancellation hand-off — gives the loop a chance to
            # detect client disconnect between peptides without blocking.
            await anyio.sleep(0)

        yield json.dumps({"type": "footer", "done": True}) + "\n"
        log_info(
            "predict_stream_done",
            f"peptides={total}",
            stage="stream",
            peptide_count=total,
        )
    except anyio.get_cancelled_exc_class():
        # Client disconnected mid-stream. Don't yield a footer — the
        # connection is already torn down — but DO re-raise so anyio's
        # task tree sees the cancellation.
        log_info(
            "predict_stream_cancelled",
            "Client disconnected during stream",
            stage="stream",
        )
        raise


@router.post("/api/predict/stream")
async def predict_stream(req: PredictStreamRequest):
    """Stream per-peptide predictions as NDJSON.

    Returns ``application/x-ndjson`` — one JSON object per line. See
    ``_stream_predict_events`` for the event grammar.

    The ``X-Accel-Buffering: no`` header is critical for nginx reverse
    proxies (Hetzner CX33 prod): without it nginx buffers the whole
    response and the stream arrives all at once, defeating progressive
    rendering on the UI side.
    """
    return StreamingResponse(
        _stream_predict_events(req),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/api/predict", response_model=PredictResponse)
async def predict(
    sequence: str = Form(...),
    entry: Optional[str] = Form(None),
    thresholdConfig: Optional[str] = Form(None, description="Threshold configuration JSON"),
):
    """Predict properties for a single peptide sequence."""
    # Parse threshold config (shared helper)
    threshold_config_requested, threshold_config_resolved = parse_threshold_config(thresholdConfig)

    # Use shared function to create and validate single-sequence DataFrame
    df = create_single_sequence_df(sequence, entry)
    seq = df.iloc[0]["Sequence"]

    # Validate sequence is not empty
    if not seq or len(seq) == 0:
        raise HTTPException(status_code=400, detail="Sequence is empty after validation")

    # Process the single sequence through the prediction pipeline
    return await asyncio.to_thread(
        process_single_sequence,
        df=df,
        threshold_config_requested=threshold_config_requested,
        threshold_config_resolved=threshold_config_resolved,
    )


# Content-Type aliases the route accepts for FASTA payloads. Standardized
# header is ``text/x-fasta``; ``application/x-fasta`` and ``chemical/x-fasta``
# are common in older bioinformatics tooling and biopython examples — accept
# them to stay friendly to existing scripts. We also accept anything containing
# the substring ``fasta`` so CLI users typing ``-H 'Content-Type: fasta'``
# (technically invalid but common) still hit the right parser.
_FASTA_CONTENT_TYPES = ("text/x-fasta", "application/x-fasta", "chemical/x-fasta")
_CSV_CONTENT_TYPES = ("text/csv", "application/csv", "text/tab-separated-values")


@router.post("/api/predict/batch", response_model=RowsResponse)
async def predict_batch(
    request: Request,
    thresholdConfig: Optional[str] = Query(
        None,
        description="JSON threshold configuration. Passed as a query param so the request body "
        "stays a clean raw FASTA / CSV payload — keeps the curl ergonomic.",
    ),
):
    """Run the PVL pipeline on a batch of peptides in one request.

    Accepts raw FASTA or CSV in the request body. The parser is selected by
    ``Content-Type``:

    - ``text/x-fasta`` (or ``application/x-fasta`` / ``chemical/x-fasta``) →
      multi-entry FASTA, parsed via :func:`services.dataframe_utils.parse_fasta`.
    - ``text/csv`` / ``application/csv`` / ``text/tab-separated-values`` →
      CSV / TSV with ``Entry,Sequence`` columns.

    Response is identical to ``POST /api/upload-csv`` (the canonical batch
    response) — same ``rows`` shape, same ``meta`` envelope, same
    ``run_metadata`` stamp. The only difference is the route is curl-friendly
    (raw body instead of multipart upload) and the metadata stamp records
    ``sequenceSource="fasta"`` when the input was FASTA.

    Example::

        curl -X POST http://localhost:8000/api/predict/batch \\
          -H "Content-Type: text/x-fasta" \\
          --data-binary @example.fasta
    """
    threshold_config_requested, threshold_config_resolved = parse_threshold_config(thresholdConfig)

    raw = await request.body()
    if not raw:
        raise HTTPException(
            status_code=400,
            detail=(
                "Empty request body. POST raw FASTA or CSV with --data-binary "
                "and a Content-Type header (text/x-fasta or text/csv)."
            ),
        )

    content_type = (request.headers.get("content-type") or "").split(";")[0].strip().lower()
    is_fasta = (
        content_type in _FASTA_CONTENT_TYPES
        or "fasta" in content_type
        or raw.lstrip(b"\xef\xbb\xbf").lstrip().startswith(b">")
    )
    is_csv = (not is_fasta) and (content_type in _CSV_CONTENT_TYPES or "csv" in content_type)

    if not (is_fasta or is_csv):
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported Content-Type: {content_type!r}. "
                "Supported: text/x-fasta (FASTA), text/csv / application/csv (CSV/TSV)."
            ),
        )

    pseudo_filename = "request.fasta" if is_fasta else "request.csv"
    sequence_source = "fasta" if is_fasta else "csv"

    log_info(
        "predict_batch_start",
        f"format={'fasta' if is_fasta else 'csv'} bytes={len(raw)}",
        stage="parse",
        content_type=content_type,
        body_bytes=len(raw),
        sequence_source=sequence_source,
    )

    try:
        if is_fasta:
            df = parse_fasta(raw, pseudo_filename)
        else:
            df = read_any_table(raw, pseudo_filename)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Failed to parse {'FASTA' if is_fasta else 'CSV'} body: {exc}. "
                "FASTA expects '>' header lines + sequence lines; "
                "CSV expects an 'Entry,Sequence' header row."
            ),
        ) from exc

    if len(df) == 0:
        raise HTTPException(
            status_code=422,
            detail="Parsed body contains no peptide rows.",
        )

    df = normalize_cols(df)
    require_cols(df, ["Entry", "Sequence"])
    if "Length" not in df.columns:
        df["Length"] = df["Sequence"].astype(str).str.len()

    from api.main import SENTRY_INITIALIZED

    try:
        return await asyncio.to_thread(
            process_upload_dataframe,
            df=df,
            threshold_config_requested=threshold_config_requested,
            threshold_config_resolved=threshold_config_resolved,
            trace_entry=None,
            sentry_initialized=SENTRY_INITIALIZED,
            cancel_event=None,
            sequence_source=sequence_source,
        )
    except UploadProcessingError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc
