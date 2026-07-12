# Data Governance — PePFibPred

**Effective**: 2026-07-12
**Public surface**: the summary of this document is rendered as a paragraph on the About page footer under the heading *"Data & Privacy"*.
**Regulatory posture**: GDPR-compliant by design (no personal data collected). EU AI Act: exempt from most obligations because PePFibPred is a scientific prediction tool that does not make decisions about people.

---

## What we store (and don't)

**We do NOT store**:
- User accounts. There are no accounts; the tool is open access.
- User-submitted sequences beyond the request lifecycle. A submitted sequence is used to compute the response, cached transiently as described below, and never persisted with any user identifier.
- IP addresses beyond the rate-limiting window (30 requests per minute per IP; the counter clears after 60 seconds).
- Anything on our servers is anonymous — we cannot map a cached row back to a person even if we tried.
- Cookies. The web UI uses `localStorage` for UI preferences (theme, threshold presets); we do not set cookies.
- Analytics telemetry that identifies a user session.

**We DO store, transiently or persistently**:
- **Per-sequence prediction outputs** — cached in an embedded DuckDB database (`provider_cache.duckdb`) keyed by `SHA-256(sequence)`. The cache stores the sequence itself plus per-predictor outputs. This is unavoidable if we want a re-submission of the same sequence to return in < 100 ms. Retention: as long as the sequence remains in the cache (see below).
- **Server logs** — HTTP access logs (Caddy) and application logs (uvicorn / Sentry). Retention: 30 days rolling on the reference deployment; forever in Sentry for issue-linked events.
- **Sentry error reports** — the standard SDK captures errors with request context but no request body. Retention: 90 days on the free tier.
- **The reference datasets** we ship — `Staphylococcus aureus` 2023 curated set and Peleg-118 fibril-validated set. These are bundled in the source distribution and are not user data.

---

## Cache retention

The DuckDB provider cache (`backend/services/provider_cache.py`) grows monotonically until manually pruned. Current pruning policy (to be automated per `RUNBOOKS/vps_disk_full.md` §5):

- Rows older than **90 days** by `updated_at` may be truncated in a maintenance window
- Rows referenced by an active permalink (a returned `reproducibilityPermalink` for which a resolution was requested within the last 30 days) are protected from pruning

Because the cache key is `SHA-256(sequence)` — a one-way hash — we cannot associate cached rows with a specific user's submissions retroactively. All cache entries are functionally anonymous.

---

## Reproducibility permalinks

A response includes a `reproducibilityPermalink` that encodes the *analysis state* — the sequence, the threshold configuration, the predictor version — required to regenerate the same response. The permalink does NOT encode a user identifier. Anyone with the permalink can regenerate the analysis; only someone who submitted the original sequence knows which analyses map to their real-world research question.

This is deliberate. The permalink is a scientific-reproducibility artefact, not a session token. See ADR-004.

---

## User-uploaded batch files

CSV/XLSX/TSV batch uploads are:
1. Parsed at request time
2. Their sequences enter the per-sequence cache path above (SHA-256 keyed, anonymous)
3. The original file is **not** persisted on disk beyond the request lifecycle
4. Non-sequence columns (identifier, organism, annotations) are echoed back in the response but not persisted

If a user includes personally-identifying content in a batch file (e.g., putting their own name in an annotation column), that content survives in the response payload — but not in any server-side store beyond the transient request-handling memory.

---

## What the API does NOT do

- Does not send user-submitted data to any third party
- Does not log user-submitted sequences to Sentry (the SDK config filters out request bodies)
- Does not send user-submitted sequences to any LLM (the MCP server, when used, runs *client-side* — the LLM sees whatever the user chose to share with it, PePFibPred does not proxy)
- Does not track users across sessions

---

## Reference datasets — versioning + DOIs

The two reference databases shipped with PePFibPred each carry their own Zenodo DOI (once minted — currently `PENDING` per `CITATION.cff`), independently of the tool version's DOI:

- *Staphylococcus aureus* 2023 curated set — 2 916 peptides — curator Dr. Peleg Ragonis-Bachar (Technion) — Zenodo DOI `[PENDING]`
- Peleg-118 fibril-validated set — 118 peptides — curator Dr. Peleg Ragonis-Bachar (Technion) — Zenodo DOI `[PENDING]`

Any change to a reference database (adding rows, correcting a label, updating a citation) is versioned as a new Zenodo release with an independent version DOI so that a paper citing the dataset can point at an immutable version.

---

## Public statement (to be pasted into the About-page footer)

> **Data & Privacy.** PePFibPred requires no account and stores no personal data. Submitted sequences are analysed anonymously and, if cached, are cached without any user identifier under a one-way hash. We do not send your sequences to any third-party service. Reproducibility permalinks encode analysis state, not identity. Details: `docs/active/DATA_GOVERNANCE.md`.

---

## Escalation triggers — when this document must be revised

Any of the following requires an RFC (`RFC_TEMPLATE.md`) *before* the change ships, because they change the data-governance surface:

- Adding user authentication or accounts
- Adding persistent user-submitted data storage (beyond the anonymous cache)
- Adding third-party analytics (Google Analytics, Plausible, Mixpanel, etc.)
- Sending user-submitted data to any external service (an LLM proxy, a labelling service, etc.)
- Storing anything that could be personally identifying (IP addresses beyond rate-limit windows, email addresses, session identifiers)
- Enabling a cookie set from our origin
- Changing the retention window of any stored artefact

See `docs/handbook/agents/04_when_to_ask_humans.md` item #8 — this is the escalation item on the agent-facing side.

---

## Cross-references

- ADR-004 (reproducibility permalink)
- `docs/active/SLO.md` (SLI storage / retention)
- `SECURITY.md` (vulnerability disclosure)
- `docs/active/paper_drafts/04_data_availability.md` (the paper's take on this)
- `docs/active/paper_drafts/12_master_handover_playbook.md` §7 (the playbook rationale)
