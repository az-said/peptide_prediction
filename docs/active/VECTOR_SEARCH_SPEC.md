# Vector Similarity Search — PVL Spec

> **Status**: Wave 2 §D landed (2026-05-08). Backend route + LanceDB store + auto-indexing are live behind `VECTOR_INDEX_ENABLED` (default ON). Frontend (`SimilarPeptidesInspector.tsx`, V9-1) is wired and consumes this contract directly.

This is the operator-and-scientist guide for the "Find similar peptides" feature. For the high-level rationale, see [ADR-016](DECISIONS.md) and the comparison brief [`RESEARCH_BRIEFS/RB-002_vector-store-evaluation.md`](RESEARCH_BRIEFS/RB-002_vector-store-evaluation.md).

---

## 1. Architecture

```
                                          ┌──────────────────────────┐
upload-csv / predict ──────► PVL pipeline ┤                          │
                                          │  index_rows / index_peptide
                                          │      (best-effort)        │
                                          ▼                          │
                          ┌─────────────────────────────────────┐    │
                          │     services/vector_store.py        │    │
                          │  ┌──────────────┐  ┌─────────────┐  │    │
                          │  │  embedder    │  │  LanceDB    │  │    │
                          │  │ (MiniLM 384) │─▶│  ./data/    │  │    │
                          │  └──────────────┘  │   lance/    │  │    │
                          │                    └─────────────┘  │    │
                          └────────────▲────────────────────────┘    │
                                       │ find_similar                │
                          ┌────────────┴───────────────────────────┐ │
                          │  POST /api/peptides/similar (route)    │◀┘
                          └────────────▲───────────────────────────┘
                                       │
            SimilarPeptidesInspector  ─┴── pvl_mcp.find_similar_peptides
            (UI V9-1)                       (MCP tool 6)
```

**Key design choices** (from ADR-016):

- **LanceDB embedded.** No daemon, no port, no Docker sidecar. The FastAPI process imports `lancedb` like any other library. Lance files live alongside the existing DuckDB cache (D2 alignment).
- **Best-effort indexing.** If the embedder fails to load (no internet on first model download, disk full, broken weights) we log and continue — the analysis API contract is "analysis succeeded"; the index is observability infrastructure, not a critical path.
- **Single seam.** `services/vector_store.py` exposes only `index_peptide`, `index_rows`, `find_similar`, `is_enabled`, `stats`. Tests inject a fake embedder via `set_embedder(...)` and a tmpdir Lance path; nothing else needs to know about LanceDB.
- **Narrow stored shape.** We don't mirror the entire `PeptideRow` into Lance — only the small subset of fields the UI's classification pills + reference card render. The route synthesizes a partial `PeptideRow` shape on read so the frontend's `Peptide` type can render directly.

---

## 2. API contract

### `POST /api/peptides/similar`

Request body — strict (`extra="forbid"`), accepts both snake_case and camelCase aliases:

```json
{
  "reference_id": "P0C1Q4",     // OR "referenceId" — required, 1..128 chars
  "k": 10,                       // optional, 1..100, default 10
  "dataset_id": "ds-abc"         // OR "datasetId" — optional, restricts to one dataset
}
```

Response:

```json
{
  "reference_id": "P0C1Q4",
  "results": [
    {
      "peptide": {
        "id": "P0C1Q5",
        "sequence": "GIGAVLKVLTTGLPALISWIKRKRQQ",
        "ffHelixFlag": 1,
        "sswPrediction": 1,
        "ffSswFlag": -1,
        "muH": 0.42,
        "tangoAggMax": 7.3
      },
      "distance": 0.13
    }
  ],
  "method": "lancedb+local-minilm",
  "elapsed_ms": 12
}
```

**Behaviour:**

- The reference peptide itself is never included in `results`.
- If the reference is not in the index → `results: []` (NOT a 404). The UI shows the empty state.
- If the index is disabled (`VECTOR_INDEX_ENABLED=0` or model load failed) → `results: []` and `method: "disabled"`.
- Errors during search are caught and surfaced as empty results with `method` still set; an error log line is emitted.

### `GET /api/peptides/similar/stats`

Diagnostic shape — used by the runbook + readiness scripts:

```json
{
  "enabled": true,
  "disabled_reason": null,
  "method": "lancedb+local-minilm",
  "lance_path": "/data/lance",
  "vector_dim": 384,
  "row_count": 1248
}
```

---

## 3. Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `VECTOR_INDEX_ENABLED` | `1` | Master switch. Set to `0` to disable both auto-indexing and search (route returns empty + `method="disabled"`). |
| `LANCE_DB_PATH` | `<repo_root>/data/lance` | Filesystem path for Lance files. In Docker, the named volume `pvl-lance` is mounted here at `/data/lance`. |
| `EMBEDDING_PROVIDER` | `local-minilm` | Currently only `local-minilm` is wired. Future: `anthropic` (1024-dim API embeddings) — pending M-004 brief. |
| `EMBEDDING_MODEL_NAME` | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model id. Override only if a domain-specific model is already cached on disk. |
| `VECTOR_DIM` | `384` | Embedding dimension. Lance schema is dimension-locked; changing this requires reindexing. |

---

## 4. Storage layout

- **Filesystem**: `<LANCE_DB_PATH>/peptides.lance/` — Apache Arrow / Lance columnar files.
- **Schema** (inferred from the seed record on first write):
  - `accession: str` (primary key by convention)
  - `sequence: str`
  - `embedding: list[float]` (length = `VECTOR_DIM`)
  - `dataset_id: str | None`
  - `indexed_at: float` (epoch seconds)
  - `organism, length, helix_flag, ff_helix_flag, ssw_prediction, ssw_score, ff_ssw_flag, s4pred_helix_prediction, s4pred_ssw_prediction, tango_agg_max, mu_h, hydrophobicity, charge` — all nullable.
- **Upsert** is implemented as `delete-where-accession-matches` then `add` — LanceDB <0.6 didn't ship `merge_insert` and the explicit two-step is portable across the version range PVL pins.
- **Filesystem versioning**: Lance keeps versioned manifests (zero-copy). Disk usage grows linearly with peptide count; pruning old manifests is a future concern (see §8).

---

## 5. Growth bounds

At default config (384-dim float32 embeddings + ~14 metadata columns):

| Peptide count | Embedding storage | Metadata storage | Total |
| --- | --- | --- | --- |
| 1k | ~1.5 MB | ~0.3 MB | ~2 MB |
| 10k | ~15 MB | ~3 MB | ~18 MB |
| 100k | ~150 MB | ~30 MB | ~180 MB |
| 1M | ~1.5 GB | ~300 MB | ~1.8 GB |

PVL's expected ceiling for the v0.x–v1.x era is <500k peptides per VPS. At 100k the index is well under 200 MB; the named Docker volume can stay on the existing CX33 disk without provisioning changes.

---

## 6. Privacy

When `EMBEDDING_PROVIDER=local-minilm` (default) **embeddings never leave the VPS** — the model runs in-process, the vectors are stored on local disk, and no third-party endpoint is contacted at search time.

When the future `anthropic` provider lands, the embedding API call will surface in the route response's `method` field (`lancedb+anthropic`) so the user can decide whether to opt in. The provider switch will be opt-in, not default.

---

## 7. K8s migration path

Lance files are plain on-disk artifacts. Migration to Kubernetes is mechanical:

- Map `pvl-lance` → a `PersistentVolumeClaim` with `ReadWriteOnce` access mode.
- A single backend pod owns the writer; replicas would need either (a) one writer + many readers via a shared PVC with read-only mounts, or (b) routing similarity calls to the writer pod by a service selector.
- The DESY K8s storage class supports `ReadWriteOnce`; verified during Wave 5 planning.

When PVL transitions to Postgres (per `MASTER_DEV_DOC` D2 — multi-user auth phase), migrate to `pgvector`:

- Re-embed every peptide and `INSERT ... ON CONFLICT` into a `peptide_embeddings` table.
- RB-002 estimates the migration at 2–4h; the embedding generation code is shared.
- Decommission `LANCE_DB_PATH` once both stores agree on row counts.

---

## 8. Operational runbook

### 8.1 — Inspect index health

```bash
curl http://localhost:8000/api/peptides/similar/stats | jq
```

Look for `enabled: true`, `disabled_reason: null`, and a non-zero `row_count` after at least one analysis has run.

### 8.2 — Disable the index without rebuilding

```bash
VECTOR_INDEX_ENABLED=0 uvicorn api.main:app
```

The route returns `method="disabled"` and the UI shows the empty state.

### 8.3 — Wipe and rebuild the index

```bash
rm -rf $LANCE_DB_PATH/peptides.lance
# Then re-run a representative dataset through /api/upload-csv.
```

The first peptide auto-indexed after wipe re-creates the table with the current schema.

### 8.4 — Tail Sentry / structured logs for indexing failures

Search for these event keys:

- `vector_embedder_disabled` — model load failure (no internet, missing weights).
- `vector_index_failed` — per-row write failure.
- `vector_search_failed` — search-side failure (route still returns 200, surfaced via `disabled_reason`).
- `vector_index_dim_mismatch` — embedder returned the wrong dimension; reindex required.

---

## 9. Test coverage

Backend tests added in this wave:

- `backend/tests/test_vector_store.py` — 11 tests pinning the LanceDB seam: index/upsert/search/exclude-self/k-limit/unknown-id/disabled/dim-mismatch/metadata-translation/dataset-filter/stats.
- `backend/tests/test_similar_route.py` — 10 tests pinning the HTTP shape: 200 path, alias acceptance, 422 on unknown fields / missing id / out-of-range k, dataset_id passthrough, disabled-index passthrough, stats GET.

The `test_vector_store.py` suite injects a deterministic 4-dim embedder via `vector_store.set_embedder(...)` so CI never downloads HuggingFace weights. Real-model verification is manual (see §8.1).

---

## 10. Roadmap (M-004, future waves)

- **M-004 (pending)**: domain-specific peptide embedding choice. Candidates include ESM-2 (650M, 1024-dim) and an `anthropic` API option. Whichever wins, dimension-locked schema → reindex required.
- **Late Wave 2 / Wave 3**: surface `find_similar_peptides` MCP tool 6 once the route is stable in production.
- **Wave 5**: pgvector migration alongside Postgres rollout (RB-002 §3 Option B).

---

## 11. Reference

- [`backend/services/vector_store.py`](../../backend/services/vector_store.py) — implementation
- [`backend/api/routes/peptides.py`](../../backend/api/routes/peptides.py) — route
- [`backend/schemas/peptides.py`](../../backend/schemas/peptides.py) — Pydantic schemas
- [`ui/src/components/drilldown/SimilarPeptidesInspector.tsx`](../../ui/src/components/drilldown/SimilarPeptidesInspector.tsx) — frontend consumer
- [`docs/active/RESEARCH_BRIEFS/RB-002_vector-store-evaluation.md`](RESEARCH_BRIEFS/RB-002_vector-store-evaluation.md) — full brief
- [ADR-016 in `DECISIONS.md`](DECISIONS.md) — load-bearing decision
