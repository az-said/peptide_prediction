# Incident Severity — PePFibPred

**Effective**: 2026-07-12
**Companion runbooks**: `RUNBOOKS/` — one file per known failure class.
**Postmortem template**: `postmortems/TEMPLATE.md`.

> The SEV1/SEV2/SEV3 axis defined here is **distinct** from `KNOWN_ISSUES.md`'s P0/P1/P2 code-bug taxonomy. SEV levels are a *live-incident* scale (something is happening right now); P levels are a *code-bug* scale (something is broken in the code). A P2 bug can cause a SEV1 incident if it ships broken.

---

## Definitions

### **SEV1 — Site down or wrong scientific results served publicly**

Examples:
- The production API is returning 5xx for ≥ 10 % of `/api/predict` calls
- The reference deployment hostname is unreachable (`/api/health` failing)
- A published response contains numerically wrong FF-Helix / FF-SSW / SSW / rankScore values (i.e., a violation of the axiom-invariant tests slipped past CI)
- The Sentry integration is offline (we have no observability)
- The Zenodo DOI on the current release resolves to the wrong version
- A public deploy of the frontend serves a stale API contract (backend upgrade + frontend still cached)

**Response**:
- Page Alex immediately (Sentry alert)
- Alex acknowledges + investigates within 30 min business hours / 2 h off-hours
- If unresolved past window → auto-escalation email to Said
- Mandatory blameless postmortem (`postmortems/TEMPLATE.md`) within 72 h of resolution
- Publish resolution note to public status page (Upptime)
- Freeze non-essential merges until root cause lands in postmortem

### **SEV2 — Significant degradation with workaround**

Examples:
- One of TANGO / S4PRED / FF-Helix is down but the other two continue (partial pipeline)
- UniProt REST integration returns 5xx cascade (search-mode broken; single-sequence + batch still work)
- Cold-cache latency > 60 s (users complain; but functionally the pipeline still returns correct results)
- `pvl-cli` PyPI publish failed on a tagged release (users can `pip install` the previous version)
- MCP server returns 5xx for one of the seven tools
- CI on `main` failed but the reference deployment is still on the last-green build
- Sentry quota near-exhausted (still receiving alerts but at risk of losing observability)

**Response**:
- Alex is notified via Sentry (non-page)
- Alex fixes within 1 business day
- No auto-escalation to Said — Alex escalates manually if he needs a scientific decision from Peleg
- Postmortem required only when root cause is unclear at time of fix
- Tracked in the monthly report as "SEV2 count: N"

### **SEV3 — Cosmetic or non-blocking**

Examples:
- CSS drift on the results page (buttons overlap on small viewports)
- A tooltip refers to an outdated threshold value
- Documentation link 404s
- A single Dependabot PR is red on a non-security dependency
- The `edge` container image build failed (production `:latest` still passing)

**Response**:
- Filed as a GitHub issue with label `sev3`
- No page, no email
- Batch-fixed with the next planned release
- No postmortem
- Tracked in the monthly report as "SEV3 count: N" — informational only

---

## Sentry tag convention

Backend errors are tagged with `severity` in the Sentry SDK context. See `SENTRY_RUNBOOK.md` for the enrichment code. Predicate (from `paper_drafts/13_sentry_migration_runbook.md`):

- `severity = sev1` when: response status ≥ 500 AND affected endpoint in `{/api/predict, /api/predict/batch, /api/upload-csv}` (the three that produce scientific results)
- `severity = sev2` when: response status ≥ 500 on any other endpoint, OR any TANGO / S4PRED subprocess failure
- `severity = sev3` when: everything else

The Sentry alert rules use these tags to route email + escalation.

---

## Manually declaring a SEV1

If Alex or Said observes a SEV1 that Sentry did not detect (e.g., the Zenodo DOI wrong, a public deploy contract mismatch, a Peleg-flagged scientific defect):

1. Post a GitHub Discussion under category `Incidents` with title `[SEV1] YYYY-MM-DD short description`
2. Mention `@az-said` in the body
3. Write the resolution + postmortem link in the Discussion once resolved
4. Convert to a `postmortems/YYYY-MM-DD-<slug>.md` file

---

## Cross-references

- `SLO.md` — SLO breach triggers this ladder (a breach becomes a SEV1 or SEV2 depending on scope)
- `SENTRY_RUNBOOK.md` — how alerts are wired
- `ONCALL.md` — the response windows in one place
- `postmortems/TEMPLATE.md` — the postmortem shape
- `paper_drafts/13_sentry_migration_runbook.md` — the Sentry configuration steps

---

## SEV-vs-P conversion table (quick reference)

| Code-bug P (in `KNOWN_ISSUES.md`) | Runtime SEV (if it happens in production) |
|---|---|
| **P0 — Ship-blocking bug** | Usually SEV1 if it ships. |
| **P1 — Serious but shippable** | SEV2 if user-visible; SEV3 if silent. |
| **P2 — Nice-to-fix** | SEV3 at most. |

A P0 code bug caught before merge is *not* a SEV1 — it never became a live incident. A P2 code bug shipped inadvertently and *causing wrong scientific results in production* is a SEV1.
