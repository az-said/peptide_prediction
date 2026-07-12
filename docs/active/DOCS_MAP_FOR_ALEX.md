# Docs Map — for Alex

**Audience**: Alex, and anyone else who wants to know where a specific piece of information lives.
**Reading rule**: this is a *map*, not a reading list. Bookmark it. Come back when you need to find a specific doc.
**Reading order** (as Primary Responder) is in `ALEX_ONBOARDING.md`, not here.

---

## The 5-second answer to "where do I find X?"

| I need to know… | Read this |
|---|---|
| What PePFibPred does | `docs/handbook/humans/02_the_science.md` |
| How to run the tool locally | `docs/active/HANDOFF.md` §2 or `README.md` |
| Who owns what platform | `docs/active/OWNERSHIP_MATRIX.md` |
| How to respond to a Sentry alert | `docs/active/OPERATOR_COOKBOOK.md` |
| What SEV1 vs SEV2 vs SEV3 means | `docs/active/INCIDENT_SEVERITY.md` |
| The SLOs I'm responsible for | `docs/active/SLO.md` |
| How to fix specific failure X | `docs/active/RUNBOOKS/` (one file per failure) |
| How to write a postmortem | `docs/active/postmortems/TEMPLATE.md` |
| Monthly digest for Said | `docs/active/MONTHLY_REPORT_TEMPLATE.md` |
| Every design decision we've made | `docs/active/DECISIONS.md` (27 ADRs) |
| Which API fields are stable | `docs/active/API_STABILITY.md` |
| The pipeline internals | `docs/active/DEVELOPER_REFERENCE.md` |
| The API contract | `docs/active/CONTRACTS.md` |
| Backlog of not-yet-done work | `docs/active/BACKLOG.md` |
| Publication path (Zenodo → JOSS → bio.tools) | `docs/active/PUBLICATION_PATH.md` |
| Deployment topology + K8s plan | `docs/active/DEPLOYMENT.md` |
| The paper we're writing | `docs/active/paper_drafts/README.md` |
| Terminology (what Peleg wants us to say) | `docs/active/paper_drafts/08_terminology_and_style_guide.md` |
| Sentry integration configuration | `docs/active/SENTRY_RUNBOOK.md` |
| Sentry migration to Alex-as-recipient | `docs/active/paper_drafts/13_sentry_migration_runbook.md` |
| How to file an RFC | `docs/active/RFC_TEMPLATE.md` |
| How to escalate to Peleg / Said | `docs/handbook/agents/04_when_to_ask_humans.md` |
| GitHub basics if unfamiliar | `docs/active/GITHUB_101_FOR_ALEX.md` |
| How to do specific ops tasks | `docs/active/OPERATOR_COOKBOOK.md` |

---

## The layered doc hierarchy (visual)

```
peptide_prediction/
├── README.md                    → what PePFibPred is + 5-min quickstart
├── CLAUDE.md                    → project-wide rules for anyone (human or AI)
├── SECURITY.md                  → vulnerability disclosure policy
├── CONTRIBUTING.md              → how outside contributors submit changes
├── CHANGELOG.md                 → release history + upcoming
├── CITATION.cff                 → how to cite PePFibPred
├── LICENSE                      → MIT
├── .github/
│   ├── CODEOWNERS               → auto-review routing
│   ├── ISSUE_TEMPLATE/          → bug / feature / scientific question forms
│   ├── PULL_REQUEST_TEMPLATE.md → PR checklist
│   ├── dependabot.yml           → dependency update config
│   └── workflows/               → 7 CI workflows
│
├── docs/
│   ├── active/                  ← ★ START HERE (canonical operational + design docs)
│   │   ├── ALEX_ONBOARDING.md   ← ★ YOU LAND HERE FIRST
│   │   ├── GITHUB_101_FOR_ALEX.md
│   │   ├── OPERATOR_COOKBOOK.md
│   │   ├── DOCS_MAP_FOR_ALEX.md  ← this file
│   │   ├── HANDOFF.md            → general dev on-ramp
│   │   ├── OWNERSHIP_MATRIX.md   → who owns what
│   │   ├── ONCALL.md             → pager rotation + escalation timers
│   │   ├── INCIDENT_SEVERITY.md  → SEV1/2/3 definitions
│   │   ├── SLO.md                → 2 SLOs + error budget
│   │   ├── RUNBOOKS/             → one file per failure class
│   │   ├── postmortems/          → your incident writeups
│   │   ├── reports/              → your monthly digests
│   │   ├── DECISIONS.md          → 27 ADRs
│   │   ├── RFC_TEMPLATE.md       → how to propose a change
│   │   ├── API_STABILITY.md      → STABLE vs UNSTABLE fields
│   │   ├── SECURITY.md → (link → root SECURITY.md)
│   │   ├── DATA_GOVERNANCE.md    → what we store (and don't)
│   │   ├── MONTHLY_REPORT_TEMPLATE.md
│   │   ├── SENTRY_RUNBOOK.md     → Sentry integration
│   │   ├── DEPLOYMENT.md         → deployment topology
│   │   ├── DEVELOPER_REFERENCE.md → pipeline internals
│   │   ├── CONTRACTS.md          → API contract
│   │   ├── ACTIVE_CONTEXT.md     → architecture overview
│   │   ├── ROADMAP.md            → phase-by-phase plan
│   │   ├── BACKLOG.md            → canonical Tier 0-4 backlog
│   │   ├── KNOWN_ISSUES.md       → open bugs + workarounds
│   │   ├── TESTING_GUIDE.md      → test commands
│   │   ├── MASTER_DEV_DOC.md     → consolidated architecture reference
│   │   ├── SPECIALS.md           → special-handling rules
│   │   ├── MCP_RUNBOOK.md        → MCP server install + usage
│   │   ├── VECTOR_SEARCH_SPEC.md → LanceDB + ESM-2 architecture
│   │   ├── UNIPROT_ENRICHMENT_SPEC.md
│   │   ├── MOL3D_OVERLAY_SPEC.md
│   │   ├── PUBLICATION_PATH.md   → Zenodo → JOSS → bio.tools
│   │   ├── FUTURE_TECH_SUGGESTIONS.md
│   │   ├── YOUR_NAVIGATION_GUIDE.md → older navigation map
│   │   ├── PAPER_METHODS_REFERENCE.md
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── CHANGELOG_PELEG.md    → scientific changelog for Peleg
│   │   ├── PRODUCTION_LOCKDOWN.md
│   │   ├── RESEARCH_BRIEFS/      → RB-001 to RB-VALIDATION-V0-1
│   │   ├── RESPONSES/            → responses to Peleg's PDFs
│   │   ├── cowork-dispatches/    → paste-ready Cowork prompts
│   │   ├── paper_drafts/         → NAR 2026 paper section drafts
│   │   ├── A4_BIO_TOOLS_SUBMISSION.md
│   │   ├── A5_ZENODO_RELEASE.md
│   │   ├── ECOSYSTEM_GUIDE.md
│   │   └── PELEG_FOLLOWUP_DOC_V2.md
│   │
│   ├── internal/                → process artefacts. Ask before reading. Not for outside eyes.
│   │
│   ├── archive/                 → frozen historical artefacts. Read for why-trail only.
│   │
│   └── handbook/                → the mkdocs-material rendered handbook
│       ├── README.md            → index
│       ├── _status.md           → self-audit of coverage gaps
│       ├── humans/              → for human readers (Diátaxis-tutorial + how-to)
│       │   ├── 01_first_run.md
│       │   ├── 02_the_science.md
│       │   ├── 03_the_code.md
│       │   ├── 04_the_ui_walkthrough.md
│       │   ├── 05_the_backend.md
│       │   ├── 06_deploying.md
│       │   ├── 07_extending.md
│       │   ├── 08_the_paper.md
│       │   ├── 09_glossary.md
│       │   └── 10_credits_and_license.md
│       ├── agents/              → for AI agents (Cursor / Claude / Cowork)
│       │   ├── 01_repo_map.md
│       │   ├── 02_conventions.md
│       │   ├── 03_doing_a_safe_change.md
│       │   ├── 04_when_to_ask_humans.md
│       │   ├── 05_workflow.md
│       │   ├── 06_failure_modes.md
│       │   ├── 07_mcp_and_ai.md
│       │   └── 08_reproducibility_permalink.md
│       └── research/            → for research / paper writing
│           ├── 01_landscape.md
│           ├── 02_validation_evidence.md
│           ├── 03_open_questions.md
│           └── 04_publication_path.md
│
├── backend/
│   └── CLAUDE.md                → backend-specific conventions
├── ui/
│   └── CLAUDE.md                → frontend-specific conventions
└── memory/                      → Claude's persistent memory (not code, not docs)
```

---

## Reading order — by role

### If you are Alex (Primary Responder onboarding)
Follow `ALEX_ONBOARDING.md` week-by-week. That guide references what to read when.

### If you are Said (checking a specific fact quickly)
Use the "5-second answer" table at the top.

### If you are Peleg (scientific check)
- `docs/active/paper_drafts/` for paper content
- `docs/handbook/research/01_landscape.md` for competitive analysis
- `docs/handbook/research/03_open_questions.md` for scientific-open-items
- `docs/active/DECISIONS.md` for any decision touching axioms
- `docs/active/CHANGELOG_PELEG.md` for the scientific changelog

### If you are Meytal (PI-level view)
- `docs/active/paper_drafts/README.md` for paper status
- `docs/active/PUBLICATION_PATH.md` for publication strategy
- `docs/active/HANDOFF.md` §1a for ownership status

### If you are a new external contributor
- Root `README.md` — 5-minute quickstart
- Root `CONTRIBUTING.md` — how to submit changes
- `docs/handbook/humans/01_first_run.md` — first-time-user tutorial
- `docs/active/DECISIONS.md` — read the ADRs relevant to your change

### If you are an AI coding agent (Cursor, Claude, Cowork)
- Root `CLAUDE.md` — global rules
- `backend/CLAUDE.md` or `ui/CLAUDE.md` — layer-specific conventions
- `docs/handbook/agents/*.md` — full agent handbook
- `docs/active/DECISIONS.md` — decisions to respect
- `docs/active/API_STABILITY.md` — what's protected

### If you are running a Sentry incident right now
1. `docs/active/OPERATOR_COOKBOOK.md` § "How to respond to a Sentry alert"
2. `docs/active/RUNBOOKS/` (find the matching failure class)
3. `docs/active/postmortems/TEMPLATE.md` (after resolution)

---

## The docs you never need to touch

Some docs are archived / historical / process artefacts. As Primary Responder, you generally don't touch:

- `docs/internal/*` — process artefacts (how-we-work). Ask before reading.
- `docs/archive/*` — frozen historical artefacts. Read only if you need the why-trail.
- `_external/` — Peleg's repo + paper copy. Do not redistribute.
- Any file marked `[HISTORICAL]` or `[SUPERSEDED]` in `memory/MEMORY.md`.

---

## What is where — a semantic index (searchable)

**Alex-specific onboarding**: `ALEX_ONBOARDING.md`, `GITHUB_101_FOR_ALEX.md`, `OPERATOR_COOKBOOK.md`, `DOCS_MAP_FOR_ALEX.md` (this file).

**Ownership + on-call**: `OWNERSHIP_MATRIX.md`, `ONCALL.md`, `.github/CODEOWNERS`, `HANDOFF.md` §1a.

**Incidents + response**: `INCIDENT_SEVERITY.md`, `SLO.md`, `RUNBOOKS/`, `postmortems/`, `SENTRY_RUNBOOK.md`, `paper_drafts/13_sentry_migration_runbook.md`.

**Decisions**: `DECISIONS.md`, `RFC_TEMPLATE.md`, `API_STABILITY.md`.

**Governance**: `SECURITY.md`, `DATA_GOVERNANCE.md`, `CONTRIBUTING.md`, `LICENSE`.

**Reports + reviews**: `MONTHLY_REPORT_TEMPLATE.md`, `docs/active/reports/`.

**Roadmap + backlog**: `ROADMAP.md`, `BACKLOG.md`, `KNOWN_ISSUES.md`, `FUTURE_TECH_SUGGESTIONS.md`.

**Deployment + infra**: `DEPLOYMENT.md`, `PRODUCTION_LOCKDOWN.md`, `docker/`.

**Scientific + paper**: `paper_drafts/`, `PAPER_METHODS_REFERENCE.md`, `CHANGELOG_PELEG.md`, `handbook/research/`.

**Testing**: `TESTING_GUIDE.md`, `RESEARCH_BRIEFS/RB-VALIDATION-V0-1.md`, `handbook/research/02_validation_evidence.md`.

**Handbook (rendered as a public docs site)**: `handbook/`, `mkdocs.yml`.

**MCP + AI**: `MCP_RUNBOOK.md`, `handbook/agents/07_mcp_and_ai.md`, `mcp_server/`.

**Vector search**: `VECTOR_SEARCH_SPEC.md`, ADR-016 + ADR-017 in `DECISIONS.md`.

---

## The 8 docs you'll open every week

Bookmark these in your browser or IDE:

1. `docs/active/ALEX_ONBOARDING.md`
2. `docs/active/OPERATOR_COOKBOOK.md`
3. `docs/active/INCIDENT_SEVERITY.md`
4. `docs/active/RUNBOOKS/README.md`
5. `docs/active/OWNERSHIP_MATRIX.md`
6. `docs/active/ONCALL.md`
7. `docs/active/MONTHLY_REPORT_TEMPLATE.md`
8. This file — `DOCS_MAP_FOR_ALEX.md`

Everything else is one search away.

---

## A single search query trick

From the repo root, if you're looking for a doc mentioning some concept:

```bash
grep -rli "<concept>" docs/active/ | head -20
```

Example — looking for the term "escalation timer":
```bash
grep -rli "escalation timer" docs/active/
# Returns: ONCALL.md, OWNERSHIP_MATRIX.md, INCIDENT_SEVERITY.md, HANDOFF.md ...
```

Or use your editor's global search (Cmd+Shift+F in Cursor / VS Code).

---

## Feedback loop

If you can't find something using this map, that's a doc-navigation bug. File it as a GitHub issue with label `docs`. We fix it.

If a section of a doc is unclear or contradicts another doc, that's also a doc bug. Same fix.

The doc set should serve you, not the other way around.
