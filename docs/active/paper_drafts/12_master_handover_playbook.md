# Master Handover Playbook — Said → Alex + Said-as-Founder-Oversight

> **Purpose**: Big-co-quality handover playbook. Said stays **Owner** (full access forever, veto on scientific/architectural ADRs, monthly digest, **never** paged for routine alerts). Alex becomes **Primary Responder** (day-to-day operator, first responder on Sentry, GitHub review). Peleg stays Scientific Authority (owns algorithm axioms).
>
> **State of the union (2026-07-12 audit)**: PePFibPred is *already* at or above top-tier bar on 8 of 10 areas — ADR log, changelog + SemVer, CI security posture, contributor kit, reproducibility permalink, data-governance-by-default, dependency management, documentation depth. The playbook here **closes the 2 real gaps** (Owner/Primary split + founder-oversight loop) and adds ~10 concrete files. Nothing here touches `api_models.py` or scientific logic.
>
> **Recommended path**: adopt the full minimum-viable playbook now, before Alex takeover — the API-stability lock (§5) must land *before* the v1.0.0 tag or it's a SemVer violation to enforce it later.

---

## 1. Ownership + on-call model

### Big-co pattern
Stripe / Vercel / GitHub-style orgs split **Owner** (equity/admin, rarely paged, retains veto) from **Primary responder** (on the pager, first responder). PagerDuty escalation policies page the primary first; if unacknowledged within N minutes, escalate. Google SRE recommends the *previous* on-call person as the secondary escalation target because they still carry incident context.

### Adoption for PePFibPred
- **Owner (Said)** — full access forever on every platform. Signs off on any change to `api_models.py`, any FF-Helix / FF-SSW / SSW axiom change, any ADR marked "scientific" or "architectural". Receives a **monthly digest** (§10) and nothing else. Silent-by-default on alerts.
- **Primary Responder (Alex)** — receives all Sentry issue alerts, all Dependabot PRs, first responder on any SEV1 / SEV2 incident (§3).
- **Scientific Authority (Peleg)** — owns axiom decisions; not on GitHub review path.
- **Escalation timer**: SEV1 unacknowledged 30 min business hours (Alex's Hamburg/CET 08:00-20:00) or 2 h off-hours → auto-escalate to Said. Configured in Sentry alert rules (no new tools; see `13_sentry_migration_runbook.md`).
- **Quiet hours**: Alex 20:00-08:00 CET, Said 23:00-07:00 Israel time. Only SEV1 pages during quiet hours.
- **Don't buy PagerDuty / Opsgenie yet.** Sentry's own alert-rule engine handles escalation-by-time. Revisit if Alex reports missed pages after a trial month.

### Files to add
- `docs/active/ONCALL.md` — the roles + escalation timers + quiet hours (this section's canonical text)
- `docs/active/OWNERSHIP_MATRIX.md` — promote the table from `07_alex_admin_checklist.md` §11 to its own file. Referenced by both §1 and §10.

---

## 2. Observability + SLO

### Big-co pattern
SRE teams commit to a small number of explicit SLOs (availability + latency percentile) backed by SLIs, with an **error budget** that gates release cadence. Google SRE: budget exhausted in a rolling window → non-critical releases halt until root-caused. Small teams pick 1-2 SLOs, not a dozen dashboards.

### Adoption for PePFibPred
Two SLOs — no more:
1. **`/api/health` availability ≥ 99% per calendar month** (~7 h downtime budget/month; appropriate for single-VM hosting with no HA).
2. **`/api/predict` p95 latency < 2 s warm** for a single sequence.

Error-budget rule: if either SLO breaches in a given month, **freeze non-essential feature merges** (scientific bug fixes still ship) until the root cause lands in a postmortem (§3).

Wire with what's already spec'd but unshipped in the repo:
- `SENTRY_RUNBOOK.md` Phase S.6 (Sentry performance dashboards) — enable
- `SENTRY_RUNBOOK.md` Phase S.8 (Sentry Cron Monitor pinging `/api/health` every 5 min, alert if missed 15 min) — enable

No Prometheus / Grafana yet. Revisit when traffic crosses the "100 DAU" milestone from `FUTURE_TECH_SUGGESTIONS.md` scale-checklist.

### Files to add
- `docs/active/SLO.md` — the 2 SLOs + error-budget halt policy + link into §10's monthly report.

---

## 3. Runbooks + Incident Response

### Big-co pattern
A runbook is: **Title → Symptom → Verify → Escalate → Rollback/Mitigate → Post-incident link**. Google SRE + incident.io converge on: postmortems are **blameless** (assume good intent; investigate the misleading information, not the person), written 24-72 h after resolution, mandatory for SEV1/SEV2, containing timeline, root cause, 2-5 systemic contributing factors, and action items that are specific / owned / due-dated and split into mitigative vs. preventative. SEV1/SEV2/SEV3 ladder (full outage / significant degradation / minor-with-workaround) is near-universal.

### Adoption for PePFibPred
- **SEV1** = site down or wrong scientific results served publicly → page Alex immediately, notify Said same day, mandatory postmortem
- **SEV2** = degraded (one predictor down, UniProt integration broken, slow predict) → Alex fixes within 1 business day, no page to Said, postmortem when root cause unclear
- **SEV3** = cosmetic → backlog, no page

Keep the SEV1/2/3 axis **distinct** from `KNOWN_ISSUES.md`'s P0/P1/P2 code-bug taxonomy — that's a code-bug severity scale; SEV is a live-incident scale. A P2 bug can cause a SEV1 incident if it ships broken.

**Reformat existing content, don't rewrite**: the raw material for runbooks already lives at `docs/handbook/agents/06_failure_modes.md`, `PRODUCTION_LOCKDOWN.md` §7, `SENTRY_RUNBOOK.md` "Common Error Fingerprints". Split into one file per known failure class:
- TANGO subprocess failure
- S4PRED OOM / weight file missing
- VPS disk full
- Sentry quota exhausted
- DESY VM SSH lost
- UniProt REST 5xx cascade

**Public status page** — **Upptime** (GitHub Actions + GitHub Pages, free, pings `/api/health` every 5 min). Fits the project's GitHub-native philosophy (Dependabot, CodeQL, mkdocs Pages already live). Zero new vendor accounts.

### Files to add
- `docs/active/RUNBOOKS/` — one file per failure class, each in the 6-field shape
- `docs/active/INCIDENT_SEVERITY.md` — the SEV1/2/3 definitions + example incidents
- `docs/active/postmortems/TEMPLATE.md` — Summary / Timeline / Root cause / Impact / What went well / Action items (owner + due date)
- `.github/workflows/uptime.yml` + `upptime.yml` — the Upptime configuration

---

## 4. RFC + ADR process

### Big-co pattern
An **RFC** is pre-decision (seeks feedback); an **ADR** is post-decision (terse record). Rule of thumb: RFC first if revert cost exceeds ~1 engineer-week or the decision crosses domain boundaries (science ↔ architecture ↔ infra); otherwise just record the ADR after deciding.

### Adoption for PePFibPred
`DECISIONS.md`'s format is validated as correct — **do not change it**. The gap is the missing RFC layer for decisions that currently happen ad hoc via Peleg's PDF-review decks, Drive comments, Slack.

**Trigger rule**:
- Any change to a classification axiom (FF-Helix / FF-SSW / SSW definitions)
- Any `api_models.py` schema change
- Any item flagged in `docs/handbook/agents/04_when_to_ask_humans.md`

→ **RFC first**, then ADR.

**Medium**: **GitHub Discussions** (already enabled). Discussion post = RFC. Comment thread = 2-day async window (matches 3-person team reality; not 1-2 weeks like large orgs). Resolved outcome → ADR entry linking back to the thread.

Everything else: straight to ADR-only, per `DECISIONS.md`'s existing footer.

### Files to add
- `docs/active/RFC_TEMPLATE.md` — Problem / Proposed change / Alternatives considered / Blast radius / Who must approve / Comment-window end date
- One line at the bottom of `DECISIONS.md`: *"If this decision required an RFC, link the Discussion thread under Evidence."*

---

## 5. Release + versioning + deprecation

### Big-co pattern
SemVer discipline + Keep a Changelog is the default. Public API deprecation uses explicit `Deprecation` / `Sunset` HTTP headers (RFC 9745 / 8594) with 6-12 months notice, migration docs kept live, and a `410 Gone` (not `404`) after sunset.

### Current state
`CHANGELOG.md` — Keep-a-Changelog + SemVer, rolling `[Unreleased]` section. Good.
`release.yml` — verifies `CITATION.cff` version matches the tag, pushes Sentry release records. Good.

### The gap
**Nothing states which `api_models.py` fields are STABLE vs experimental.** No deprecation-window policy. **This matters *now*** because v1.0.0 is imminent — post-1.0, SemVer means any break to a "stable" field requires a major bump, so the contract must be locked *before* the freeze, not after.

### Adoption for PePFibPred
Two-tier split:
- **STABLE** — present since early releases; changes require a MAJOR bump plus a 12-month deprecation window:
  `helixFlag`, `ffHelixFlag`, `sswPrediction`, `ffSswFlag`, `sequence`, `entry`, `sequenceLength`, `entryId`, `runMetadata.pvlVersion`, `runMetadata.thresholds`
- **UNSTABLE** — under active Phase G / vector-search work; may change without a major bump but MUST be called out under "Changed (experimental)" in the changelog:
  everything under `runMetadata.perfMetrics`, all vector-search fields, all MCP-tool-return-only fields, all Sentry-context fields

**Deprecation window**: 12 months (reuses ADR-015's precedent for notebook exports). During the window: `Deprecation` HTTP header + `Sunset` header + note in the changelog + migration doc.

### Files to add
- `docs/active/API_STABILITY.md` — the STABLE / UNSTABLE field list + deprecation-window policy. Cross-referenced from `CONTRACTS.md`.

**⚠ Time-sensitive**: this file must exist and be linked from README **before** the v1.0.0 tag.

---

## 6. Dependency + security posture

### Big-co pattern
Beyond GitHub-native secret scanning, mature orgs also run **gitleaks / trufflehog** in CI (custom regexes + historical commits pattern lists miss). **SLSA + Sigstore** give free, keyless, OIDC-based provenance. GitHub Artifact Attestations deliver SLSA Build Level 2 out of the box.

### Current state — already at bar
- `codeql.yml` with `security-extended` — ✅
- `dependabot.yml` — weekly, grouped, documented ignore-rules — ✅ (unusually good)
- GitHub-native secret scanning + push protection + vulnerability alerts — ✅
- PyPI Trusted Publishing (OIDC) for `pvl-cli` + `pvl-mcp` — ✅
- `actions/attest-build-provenance@v4` on both Docker images — ✅ (SLSA Build Level 2 already)

### The one real gap
**No `SECURITY.md` exists.** GitHub's Security tab expects one. NAR / JOSS / bio.tools reviewers increasingly check for a disclosure policy.

### Adoption for PePFibPred
- **Add `SECURITY.md`** at the repo root:
  - Vulnerability disclosure contact: `said.azaizah@cssb-hamburg.de` (DESY email — not personal gmail, per project's email-identity rule)
  - Supported-versions table (v0.3.x, current v1.0.x when it lands)
  - CVE SLA: critical patched in 48 h business days
- **Add `gitleaks` CI job** — cheap belt-and-suspenders scan on push + PR
- **Enable Dependabot auto-merge** for green-CI patch bumps to shrink Alex's review queue

### Files to add
- `SECURITY.md` (root)
- `.github/workflows/gitleaks.yml`
- Optional: `.github/workflows/dependabot-auto-merge.yml`

---

## 7. Data + reproducibility governance

### Big-co / scientific-tool pattern
- **DOI-per-dataset** (separate from software DOI) so reference data is citable independent of tool version
- Explicit public data-retention statement even for research tools (post-GDPR / EU AI Act)
- Reproducibility via a permalink / state-hash so a reviewer can regenerate the exact figure from a paper

### Current state
- PePFibPred stores **no persistent user-submitted data** — confirmed via `FUTURE_TECH_SUGGESTIONS.md` and `agents/04_when_to_ask_humans.md` item #8 (the moment any of that changes → escalate).
- **Reproducibility-as-permalink (ADR-004)** is already ahead of every named competitor (PASTA 2.0 / Waltz / AGGRESCAN have no equivalent per the project's own competitive table).

### The gap
Nowhere on the About page or footer does it *say* "we don't store your sequence." This is a trust signal missing from the surface reader-facing surface.

**DOI-per-dataset** is proposed (`FUTURE_TECH_SUGGESTIONS.md` Bet 3; referenced in `04_data_availability.md`) but not scheduled. It should land before NAR submission, not stay a "someday" bet.

### Adoption for PePFibPred
- Add a "Data & Privacy" paragraph to the About page footer stating: no accounts, no persistent sequence storage beyond request lifecycle, reference-dataset versioning, permalinks encode analysis *state* not raw sequence data
- Mint Zenodo DOIs for Peleg-118 and *Staphylococcus aureus* 2023 as independent records; update Method M citations from `[CITE: dataset publication — Peleg to supply DOI]` to real DOIs

### Files to add
- `docs/active/DATA_GOVERNANCE.md` — the public statement + reference-dataset versioning policy
- Zenodo records: 2 new (one per dataset) — cite Peleg as curator, Meytal + Landau lab as PI/affiliation

---

## 8. Documentation tiers

### Big-co pattern
**Diátaxis framework**: Tutorials (learning-oriented) / How-to guides (task-oriented) / Reference (information-oriented) / Explanation (understanding-oriented). Mixing modes hurts readers.

### Current state — validate, don't force-migrate
`docs/handbook/` is **persona-based** (`humans/`, `agents/`, `research/`), not mode-based. Mapping onto Diátaxis:
- `humans/01_first_run` = Tutorial
- `humans/06_deploying`, `humans/07_extending`, `agents/03_doing_a_safe_change` = How-to
- `humans/09_glossary`, `CONTRACTS.md`, `agents/01_repo_map` = Reference
- `humans/02_the_science`, `research/*` = Explanation

Persona-first is a *deliberate, reasonable* alternative — the two actual readers (wet-lab researcher, AI coding agent) genuinely need different documents, not different sections of the same one. It already passed self-audit (`_status.md` Wave 11d critique). **Don't restructure.**

### The gap
`_status.md` flags five undocumented services and six missing ADRs. Closing these is more urgent than any framework relabeling, especially with a NAR submission window open.

### Adoption for PePFibPred
- Add one line to `docs/handbook/README.md` tagging each page with its Diátaxis quadrant so future authors know the mode they're writing in
- Close the six missing ADRs (ADR-028 → ADR-033) as a documentation-debt cleanup task before v1.0.0

---

## 9. Contributor experience

### Big-co pattern
`CODEOWNERS` auto-routes review and removes solo-maintainer bottleneck. GitHub Docs + Aviator: team-based (`@org/team`) ownership is 30 %+ faster than individual ownership so review doesn't stall on one person's absence.

### Current state — one clear gap
`CONTRIBUTING.md` is unusually good. Issue templates + PR template with invariants checklist exist. `docker-publish.yml` already tags `edge` on every `main` push — that's the nightly / early-adopter channel; just needs one sentence in `CONTRIBUTING.md` / README.

**The gap**: no `CODEOWNERS` file exists. `FUTURE_TECH_SUGGESTIONS.md` scale-checklist already names "First external contributor → Add CODEOWNERS" as the trigger. Since Alex is about to become primary responder and Peleg owns science, a CODEOWNERS file formalises the routing already informally documented in `docs/handbook/agents/04_when_to_ask_humans.md`.

**Caveat**: Peleg isn't a GitHub committer, so CODEOWNERS can't page her directly. Pair it with a comment pointing back at `agents/04_when_to_ask_humans.md` for the human-in-the-loop cases.

### Adoption for PePFibPred
`.github/CODEOWNERS`:
```
# Scientific / architectural (Said + Alex review; Peleg approves off-repo)
backend/schemas/api_models.py           @az-said
backend/services/dataframe_utils.py     @az-said @axelgolubev
backend/auxiliary.py                    @az-said @axelgolubev
backend/tango.py                        @az-said @axelgolubev
backend/s4pred.py                       @az-said @axelgolubev
backend/biochem_calculation.py          @az-said @axelgolubev

# ADR log — Said only (veto)
docs/active/DECISIONS.md                @az-said

# Paper drafts — both
docs/active/paper_drafts/               @az-said @axelgolubev

# Infra — Alex
docker/                                 @axelgolubev
.github/workflows/                      @axelgolubev @az-said
```

Plus one line in `CONTRIBUTING.md`:
> *Early adopters: pull `ghcr.io/az-said/peptide_prediction:edge` for the current `main` build; `:latest` tracks the latest tagged release.*

### Files to add
- `.github/CODEOWNERS`
- Edit `CONTRIBUTING.md` with the `:edge` line
- Edit README with the same `:edge` line

---

## 10. Founder-oversight loop for Said

### Big-co pattern
Post-transition founders get an **async weekly/monthly digest**, not a live pager. "Green means nothing needed" dashboards (error rate, uptime, backlog size) as a single artifact. Quarterly OKR / roadmap reviews calendar-blocked separately from day-to-day ops.

### Current state — the biggest gap in the whole playbook
`ROADMAP.md` Phase O.6 already sketches a monthly maintenance protocol (Sentry review, Dependabot review, VPS uptime check, bio.tools listing check, one smoke test). **It has no owner and has never run.**

### Adoption for PePFibPred
- **Assign O.6 to Alex now.** Said receives the completed checklist as his monthly digest.
- **"Green" definition**: zero unresolved SEV1/SEV2 (§3) in the month, error budget (§2) not breached, Dependabot queue < 5 open PRs, both SLOs met.
- If all green → Said reads a 3-line summary and does nothing.
- Non-green → named "Said-attention flag" line (e.g., *"Peleg requested an axiom change — needs your ADR sign-off"*).
- **Quarterly roadmap review** — 30-60 min sync or async — walks `ROADMAP.md`'s existing phase table. No new document; recurring calendar cadence wrapped around an artifact that exists.

### Glance-only dashboards (zero new infra, three bookmarks for Said)
- Sentry org dashboard (release health + error trends)
- GitHub Insights → Pulse (weekly / monthly PR + issue activity)
- Upptime status page (from §3)

### Files to add
- `docs/active/MONTHLY_REPORT_TEMPLATE.md` — turns the O.6 checklist into a literal fill-in-the-blanks report Alex sends Said each month
- Calendar invite: "PePFibPred monthly report — Alex → Said", recurring first Monday of every month
- Calendar invite: "PePFibPred quarterly roadmap review — Said + Alex + Peleg optional", recurring first week of every quarter

---

## Adoption sequence (recommended order)

Do the following in this order — the ordering minimises Said's total effort while unblocking Alex the fastest:

| # | Action | Effort | Blocks |
|---|--------|--------|--------|
| 1 | `SECURITY.md` (§6) | 15 min | bio.tools submission, Google Security-tab check |
| 2 | `OWNERSHIP_MATRIX.md` promotion (§1) + `ONCALL.md` (§1) | 30 min | Everything else |
| 3 | Sentry alert-rule redirect (`13_sentry_migration_runbook.md`) | 30 min + Alex accept | Silences Said's inbox |
| 4 | `.github/CODEOWNERS` (§9) | 15 min | Auto-review routing |
| 5 | `API_STABILITY.md` (§5) — **before v1.0.0 tag** | 1 h + Peleg review | v1.0.0 SemVer discipline |
| 6 | `INCIDENT_SEVERITY.md` + `RUNBOOKS/` reformat (§3) | 3-4 h | Alex first-day readiness |
| 7 | `postmortems/TEMPLATE.md` (§3) | 20 min | First SEV1 |
| 8 | `SLO.md` (§2) + enable Sentry S.6 + S.8 | 1 h | Error-budget policy |
| 9 | `MONTHLY_REPORT_TEMPLATE.md` (§10) + first calendar invite | 30 min | Said's founder-oversight loop |
| 10 | `RFC_TEMPLATE.md` (§4) + `DECISIONS.md` footer line | 15 min | Next axiom change |
| 11 | Upptime workflow + status page (§3) | 1 h | Public trust signal |
| 12 | `DATA_GOVERNANCE.md` + About-page footer paragraph (§7) | 1 h | Public trust signal |
| 13 | `gitleaks.yml` (§6) | 15 min | Belt-and-suspenders on secrets |
| 14 | Diátaxis-tag column in `docs/handbook/README.md` (§8) | 20 min | Future doc-writing clarity |
| 15 | Six missing ADRs (§8) — ADR-028 → ADR-033 | 1-2 h | Doc debt |

**Total effort**: ≈ 12-14 hours of Said's time to lock in the playbook. All items are documentation / config; nothing touches `api_models.py` or scientific logic.

**⚠ Steps 5 and 1-4 are on the critical path for the v1.0.0 tag.** Everything after step 5 can slip past the tag safely.

---

## What "big-co bar" actually means here

The state of the union table below is calibrated against how a Stripe / Vercel / GitHub team would rate the same repo. **8 of 10 areas are already at bar.** The playbook closes the last 2 and adds a small number of missing artefacts in the other 8.

| Area | Current state | With playbook adopted |
|---|---|---|
| ADR log | ✅ At bar (27 ADRs, consistent format) | ✅ Plus RFC-first for axiom changes |
| Changelog + SemVer | ✅ Keep-a-Changelog + rolling `[Unreleased]` | ✅ Plus explicit STABLE/UNSTABLE tiers |
| CI security | ✅ CodeQL security-extended + Dependabot + provenance | ✅ Plus SECURITY.md + gitleaks |
| Contributor kit | ✅ CONTRIBUTING + templates + response-time expectations | ✅ Plus CODEOWNERS |
| Reproducibility | ✅ Permalink protocol (ADR-004) | ✅ Same, publicly documented |
| Data governance | ✅ No persistent user data by design | ✅ Publicly stated |
| Dependency management | ✅ Dependabot weekly grouped | ✅ Plus auto-merge for patch |
| Documentation depth | ✅ Persona-based handbook, self-audited | ✅ Plus Diátaxis tags |
| **On-call + escalation** | ⚠ **Ad hoc — Said gets everything** | ✅ **Owner/Primary split** |
| **Founder-oversight** | ⚠ **No monthly digest exists** | ✅ **`MONTHLY_REPORT_TEMPLATE.md` + calendar** |

The two "⚠" cells are the reason Said still feels every notification. Closing them is what makes him a founder-with-oversight instead of a founder-still-on-the-pager.
