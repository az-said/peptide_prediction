# API Stability Contract — PePFibPred

**Effective**: 2026-07-12 (must be linked from README **before** the v1.0.0 tag ships)
**Companion**: `CONTRACTS.md` (endpoint shapes) + `DECISIONS.md` ADR-002 (Pydantic `extra="forbid"`)
**Deprecation window**: 12 months (matches ADR-015 precedent for notebook exports)

> **Reading rule**: this file states which fields in the API response are STABLE (protected by SemVer + deprecation window) and which are UNSTABLE (may change without a major bump). Post-v1.0.0, SemVer is enforced against this list. If a field you rely on is not listed, treat it as UNSTABLE.

---

## SemVer discipline post-v1.0.0

- **MAJOR bump (e.g., v1.x → v2.0)** is required for any **breaking change to a STABLE field** (renamed, removed, semantically changed).
- **MINOR bump** is used for any additive change (new endpoint, new field, new metric).
- **PATCH bump** is used for bug fixes that leave the API contract unchanged.

Breaking-change definition: any change that would make a compliant v1.x client produce different (numerically or structurally) output when talking to the new backend.

---

## STABLE fields (protected by SemVer + 12-month deprecation window)

### Per-peptide response fields (`PeptideRow` in `backend/schemas/api_models.py`)

| Field | Type | Semantic contract |
|---|---|---|
| `entry` | `str` | The submitted-or-derived accession identifier |
| `entryId` | `str \| null` | Stable per-request row identifier |
| `sequence` | `str` | The sequence used to compute all downstream fields (post-substitution — see Method B) |
| `originalSequence` | `str \| null` | The sequence as submitted, if it differs from `sequence` |
| `sequenceLength` | `int` | Length of `sequence`, always in \[10, 40\] for accepted rows |
| `sequenceNotes` | `str \| null` | Human-readable notes on any pre-processing applied |
| `helixFlag` | `int \| null` | 4-class flag: 1 = Helix positive; -1 = Helix negative; null = no data |
| `ffHelixFlag` | `int \| null` | 4-class flag: 1 = FF-Helix positive; -1 = negative; null = no data |
| `sswPrediction` | `int \| null` | Unified SSW verdict (TANGO ∨ S4PRED): 1 / -1 / null |
| `ffSswFlag` | `int \| null` | FF-SSW: 1 / -1 / null |
| `tangoSswPrediction` | `int \| null` | TANGO-only SSW verdict (preserved verbatim) |
| `s4predSswPrediction` | `int \| null` | S4PRED-only SSW verdict (preserved verbatim) |
| `rankScore` | `float \| null` | Composite ranking score on [0, 1] |

### Meta / provenance fields (`RunMetadata`)

| Field | Type | Semantic contract |
|---|---|---|
| `pvlVersion` | `str` | Semver-formatted PePFibPred version that produced this response |
| `runTimestamp` | `str` (ISO 8601) | Wall-clock time the pipeline ran |
| `sequenceSource` | `str` | One of: `user`, `demo`, `uniprot` |
| `predictorsUsed` | `list[str]` | Subset of `["tango", "s4pred", "ff_helix", "biochem"]` |
| `predictorVersions` | `dict[str, str]` | Version string for each predictor (TANGO binary version, S4PRED weights version, etc.) |
| `thresholds` | `dict[str, float]` | Complete threshold set applied to this run |

### Endpoint contracts (from `backend/api/routes/`)

- `POST /api/predict` — single-sequence, synchronous
- `POST /api/predict/batch` — batch, synchronous today, may become async in a future MINOR (job-id path added, sync path preserved)
- `POST /api/upload-csv` — multipart batch upload; alias for `/api/predict/batch`
- `POST /api/uniprot/execute` — UniProt-guided discovery
- `GET /api/health` — liveness/readiness
- `GET /api/version` — returns `pvlVersion` verbatim
- `GET /api/precomputed/{id}` — precomputed reference artefact

All STABLE endpoint paths preserve their HTTP method + shape across MINOR + PATCH releases.

---

## UNSTABLE fields (may change without a major bump — call out in `CHANGELOG.md` "Changed (experimental)")

### Per-peptide response fields

Everything under:
- `extras` (the catch-all dict for schema-forwards-compatibility)
- `runMetadata.perfMetrics.*`
- All fields whose names start with an underscore (internal-use)
- All fields introduced under Phase G (RAG / vector-search / MCP-specific)
- All fields under active co-design with Peleg (currently: `ff_ssw_kinked` — if added — and any Q-FIX-* markers in code)

### Endpoint contracts

- `POST /api/peptides/similar` — vector similarity endpoint (Phase G, LanceDB-backed)
- `POST /api/mcp/*` — any MCP-only endpoints
- Any endpoint under `/api/_dev/` (development-only)

### Meta / provenance fields

- All fields under `runMetadata.embeddings`
- All fields under `runMetadata.vectorSearch`
- All fields under `runMetadata.rag` (Phase G.2 pending)

---

## Deprecation policy (for STABLE fields)

When a STABLE field must be removed or semantically changed:

1. **Announce in the release notes** for release `v(N).M.0` — explicit "Deprecated" section
2. Add HTTP `Deprecation: true` header on any response that would use the field (per RFC 9745)
3. Add HTTP `Sunset: <date>` header pointing to the removal date (per RFC 8594)
4. Add a migration paragraph to the release-notes body linking to `MIGRATION_GUIDE.md`
5. Keep the field emitting the deprecated value for **12 months** minimum
6. Only after 12 months, remove the field in release `v(N+1).0.0` (MAJOR bump)
7. On removal, requests that specifically reference the removed field return `410 Gone` (not `404 Not Found`) so clients can distinguish "removed" from "misspelled"

Deprecation notices additionally appear:
- In the affected field's response schema (a `x-deprecated-since` extension key)
- In `docs/handbook/humans/09_glossary.md`
- In `docs/handbook/agents/03_doing_a_safe_change.md` § "Handling deprecated fields"

---

## What is NOT covered by this contract

- **Numerical values** — a threshold change in `backend/config.py` DEFAULT_* constants can happen in a MINOR and is expected to change output numbers. Users who pin thresholds against a specific version get bit-for-bit stability across PATCH releases.
- **UI presentation** — colours, sorting order, tooltip text, etc. are *never* API-stable and change freely.
- **Internal SDK / Python-package internals** — `pvl-cli` public methods follow a separate SemVer track. Internal helpers may change.
- **Third-party surfaces** — Sentry, PyPI, Zenodo, GHCR provisioning is not covered (each has its own SLA).

---

## How to check whether a field is STABLE

1. Search this file for the field name
2. If listed under STABLE — you have SemVer + 12-month deprecation guarantees
3. If listed under UNSTABLE — do not build critical downstream code around it without a version-pinned client
4. If not listed anywhere — it is treated as UNSTABLE by default. File an RFC (`RFC_TEMPLATE.md`) if you need it promoted to STABLE

---

## Change log for this file

- **2026-07-12** — Initial version. STABLE list based on the fields present in `api_models.py` at v0.3.0. Locks v1.0.0's contract.

---

## Cross-references

- `docs/active/DECISIONS.md` ADR-002 — Pydantic `extra="forbid"` on requests
- `docs/active/DECISIONS.md` ADR-015 — 12-month backward-compat precedent for notebook exports
- `docs/active/CONTRACTS.md` — endpoint shapes (structural contract)
- `docs/active/paper_drafts/12_master_handover_playbook.md` §5 — the rationale for this file
- `CHANGELOG.md` — where deprecations get announced
- `backend/schemas/api_models.py` — the canonical schema definitions
