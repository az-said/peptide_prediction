# Navigation Guide — How to Read PVL's Documentation

> **For Said (and anyone taking over PVL).** By 2026-07-01 PVL had ~30 docs in `docs/active/`, ~25 pages in `docs/handbook/`, 27 ADRs in `DECISIONS.md`, 130+ GitHub Issues, 1 rendered docs site, and thousands of commits. That's a lot. This page is the *map of maps* — the tour that shows you where to look for what, and why each doc exists.
>
> Read this once. Bookmark it. Every future "wait, where's the thing about X" is a re-read of this page's index.

---

## The three surfaces someone lands on

| You are… | Land here |
|---|---|
| A **researcher** discovering PVL for the first time | The rendered docs site: **https://az-said.github.io/peptide_prediction/** |
| A **developer** browsing the GitHub repo | **`README.md`** (top of the repo) |
| A **paper reviewer** / grant panel | The Zenodo DOI, from the README badge row |

Each of those routes eventually funnels the reader into the appropriate doc tree. The tree is explained below.

---

## The three-tier documentation hierarchy

PVL has **three concentric layers** of documentation, each with a distinct audience and update rhythm:

### Tier 1 — The Handbook (docs/handbook/, rendered at az-said.github.io)

**Audience:** everyone external. Researchers, paper reviewers, future contributors, LLM agents integrating PVL.
**Update rhythm:** once per release. Structural changes rare; content updates continuous.
**Format:** rendered by mkdocs-material into a searchable, print-friendly, mobile-responsive site.

The handbook is organised into **three personas**:

```
docs/handbook/
├── humans/       — for researchers (11 pages)
├── agents/       — for developers + AI agents (8 pages)
└── research/     — for paper authors + grant writers (4 pages)
```

**When to use it:** any external question. "What algorithm does PVL use?" → `humans/02_the_science.md`. "How do I add a new predictor?" → `humans/07_extending.md`. "Where is the API contract enforced?" → `agents/02_contracts_and_invariants.md`.

### Tier 2 — Active operational docs (docs/active/, GitHub only)

**Audience:** Said, next dev, occasional Alex or Peleg.
**Update rhythm:** continuous — this is where the "what we're doing right now" lives.
**Format:** raw markdown, read on GitHub.

These are **not** part of the rendered docs site. They're the operational deep dives — the specs, the ADR log, the backlogs, the deploy runbooks.

**Read these when:**

- You need the paper Methods content → `PAPER_METHODS_REFERENCE.md`
- You need to know what's queued and where → `BACKLOG.md`
- You need the "why we chose this" for any architectural decision → `DECISIONS.md`
- You're deploying anywhere → `DEPLOYMENT.md`
- You're doing the ONE FINAL DEPLOY → `CONSOLIDATED_FINAL_DEPLOY.md`
- You're handing the project over → `HANDOVER_CHECKLIST.md`
- You want the state-of-the-project on 2026-06-29 → `FINAL_REPORT_2026_06_29.md`
- You want to know what's broken → `KNOWN_ISSUES.md`
- You want the security + hardening list → `PRODUCTION_LOCKDOWN.md`
- You want to know where PVL runs → `HOSTING_MAP.md`
- You're setting up a DESY GitLab mirror → `GITLAB_MIRROR.md`
- You're preparing for Zenodo / bio.tools / JOSS → `PUBLICATION_PATH.md`
- You want to redesign PVL's exports → `EXPORT_REDESIGN_BRIEF.md`
- You need every architectural decision recorded → `DECISIONS.md` (27 ADRs)
- You want the full deployment infra → `DEPLOYMENT.md`
- You want a specific technical deep-dive → `ARCHITECTURE.md`
- You want the Cowork parallel-agent brief → `cowork-dispatches/V11_FINAL_POLISH.md`
- You want the design system → `DESIGN_SYSTEM.md`
- You want testing conventions → `TESTING_GUIDE.md`
- You need Sentry runbook → `SENTRY_RUNBOOK.md`
- You want the ecosystem context (5 surfaces) → `ECOSYSTEM_GUIDE.md`
- You want to know how MCP surfaces work → `MCP_RUNBOOK.md` + `MCP_CLIENT_GUIDES.md`
- You need the Mol* overlay spec → `MOL3D_OVERLAY_SPEC.md`
- You need the UniProt enrichment spec → `UNIPROT_ENRICHMENT_SPEC.md`
- You need the vector search spec → `VECTOR_SEARCH_SPEC.md`
- You need the calculations reference → `SPECIALS.md`
- You need the contract details → `CONTRACTS.md`
- You need the "what should the next dev know" — this doc, `HANDOFF.md`, and `BACKLOG.md`.

**The one-line litmus test:** if you're reading it externally and would prefer a nice UI, it belongs in Tier 1. If you're reading it operationally, browse-and-fix, it belongs in Tier 2.

### Tier 3 — Internal / archive

**Audience:** Said + agents mid-task. Not for external readers.
**Update rhythm:** append-only.

```
docs/internal/       — process docs, email drafts, agent-to-agent prompts
docs/archive/<date>/ — frozen historical artifacts (never deleted, never edited)
```

Two categories of thing land here:

- **Process docs** (`docs/internal/`): email drafts to Peleg + Alex, the Opus doc terminal prompts, the Cowork V11 dispatch, session logs. These are how-we-worked, not what-we-shipped.
- **Archive** (`docs/archive/<date>/`): superseded plans, old release notes, dated meeting notes. Frozen — read for the why-trail, don't act on.

**When to read:** only when you specifically need context on how a decision was made or want to send a stale email. Otherwise, ignore.

---

## The seven docs that answer 90% of "where is X" questions

If you only remember seven files, remember these:

1. **`README.md`** — the public face. Badge row, install, feature grid, five-surface ecosystem overview.
2. **`docs/active/HANDOFF.md`** — the single-page onboarding for a new contributor.
3. **`docs/active/BACKLOG.md`** — Tier 0 (ship-blocking) → Tier 4 (housekeeping) prioritised backlog. **This is the canonical "what's left."**
4. **`docs/active/DECISIONS.md`** — 27 ADRs. Every architectural choice explained.
5. **`docs/active/DEPLOYMENT.md`** — how PVL runs on Hetzner, DESY VM, K8s.
6. **`docs/active/HANDOVER_CHECKLIST.md`** — your tick-list to project hand-off.
7. **`docs/handbook/humans/00_what_is_pvl.md`** — 5-minute researcher orientation. The link you paste into a talk introduction.

If you can find those seven, you can find everything else through their cross-references.

---

## What each folder contains, one line each

### `docs/active/` (30 files, this is the "living" doc tree)

| File | Purpose |
|---|---|
| `ARCHITECTURE.md` | The technical deep dive on how PVL is structured (was `DEVELOPER_REFERENCE.md`) |
| `BACKLOG.md` | The canonical Tier 0 → 4 prioritised backlog |
| `CONSOLIDATED_FINAL_DEPLOY.md` | The one-shot runbook for the final deploy when Alex hands over DNS |
| `CONTRACTS.md` | API contract details + response shapes |
| `DECISIONS.md` | ADR log (27 records) |
| `DEPLOYMENT.md` | How PVL runs on Hetzner + DESY VM + future K8s |
| `DESIGN_SYSTEM.md` | Tailwind + shadcn conventions |
| `ECOSYSTEM_GUIDE.md` | 5-surface ecosystem overview (web/CLI/pkg/MCP/Docker) |
| `EXPORT_REDESIGN_BRIEF.md` | 4-tier upgrade plan for the export surfaces |
| `FINAL_REPORT_2026_06_29.md` | State-of-the-project on the day we tagged v1.0 close-out |
| `GITLAB_MIRROR.md` | Runbook for when DESY policy requires the mirror |
| `HANDOFF.md` | Single-page on-ramp for a new dev |
| `HANDOVER_CHECKLIST.md` | Said's tick-list to project hand-off |
| `HOSTING_MAP.md` | Where each box (Hetzner, DESY VM, laptop) runs |
| `KNOWN_ISSUES.md` | Open bugs + limitations |
| `MCP_CLIENT_GUIDES.md` | Per-client MCP install (Claude Desktop, Cursor, etc.) |
| `MCP_RUNBOOK.md` | MCP server tool reference + admin |
| `MOL3D_OVERLAY_SPEC.md` | The Mol* B16 overlay implementation spec (Phase 1 + 2) |
| `PAPER_METHODS_REFERENCE.md` | Source-of-truth Methods for the JOSS paper |
| `PRODUCTION_LOCKDOWN.md` | Security + hardening checklist |
| `PUBLICATION_PATH.md` | Zenodo → bio.tools → JOSS workflow |
| `RESEARCH_BRIEFS/` | Research-brief artifacts (validation runs, benchmarks) |
| `RESPONSES/` | Log of responses to Peleg / Alex |
| `ROADMAP.md` | Strategic position + phase plan (older; use BACKLOG for current truth) |
| `SENTRY_RUNBOOK.md` | Observability runbook |
| `SESSION_LOG.md` | Auto-generated session-end summary (working file) |
| `SPECIALS.md` | PVL calculations reference |
| `TESTING_GUIDE.md` | Test gates + commands |
| `UNIPROT_ENRICHMENT_SPEC.md` | UniProt integration spec |
| `VECTOR_SEARCH_SPEC.md` | LanceDB + ESM-2 vector search architecture |
| `YOUR_NAVIGATION_GUIDE.md` | This file — the map of maps |
| `cowork-dispatches/V11_FINAL_POLISH.md` | Cowork parallel-agent dispatch (only live one) |

### `docs/handbook/` (25 pages, rendered at az-said.github.io)

Three subtrees, each with a `README.md` (the tab entry point):

- `humans/` — 11 pages for researchers (`00_what_is_pvl` → `10_credits_and_license`)
- `agents/` — 8 pages for developers + AI agents (`00_read_me_first` → `07_artifacts_index`)
- `research/` — 4 pages for paper writers (`01_landscape`, `02_validation_evidence`, `03_open_questions`, `04_publication_path`)

**Each page passes the `mkdocs build --strict` gate.** Broken links fail CI. The `_status.md` at the top tracks which pages are v1-complete (all of them, as of 2026-06-29).

### `docs/internal/` (process docs)

- `EMAIL_PELEG_FINAL.md` / `EMAIL_ALEX_FINAL.md` — the paste-ready hand-off emails
- `OPUS_DOCS_TERMINAL_PROMPT.md` + `OPUS_HANDBOOK_WAVE_PROMPTS.md` — the briefs used to generate the handbook
- `PR_BODY_WAVE_2_8.md`, `COWORK_FOLLOWUP_PROMPT.md` — historical dispatches
- Others: memory drafts, session summaries, one-shot planning docs

### `docs/archive/<date>/` (frozen historical artifacts)

Everything in `docs/archive/2026-06-29/` is *superseded but preserved*: the old `LICENSE-DESY-RESEARCH.md`, old `MASTER_DEV_DOC.md`, old release-note drafts, historic Cowork V10 dispatches. Only ever added-to.

---

## The three questions Said actually asked

### 1. "How do we make it clear + navigable + comprehensive for all audiences?"

Already done. Every audience has a curated entry point:

- **Researcher discovering PVL** → https://az-said.github.io/peptide_prediction/ → *For Researchers* tab → `humans/00_what_is_pvl.md`.
- **Developer forking the repo** → `README.md` → `docs/active/HANDOFF.md` → `docs/handbook/agents/`.
- **Paper reviewer** → README's DOI badge → Zenodo → `paper/paper.md` → `docs/handbook/research/02_validation_evidence.md`.
- **PI or grant writer** → https://az-said.github.io/peptide_prediction/ → *For Researchers (advanced)* tab → `research/`.
- **AI agent editing PVL** → `CLAUDE.md` → `docs/handbook/agents/00_read_me_first.md` → `agents/03_doing_a_safe_change.md`.
- **Ops person deploying PVL** → `docs/active/DEPLOYMENT.md` → `docs/active/CONSOLIDATED_FINAL_DEPLOY.md`.

### 2. "What's still missing?"

The full audit lives in `_status.md` of the handbook. The known gaps:

- **Alex ORCID** — pending, was in his email; Said fills in during Phase 1 of `CONSOLIDATED_FINAL_DEPLOY.md`.
- **Zenodo DOI** — mints when v1.0.0 is tagged. Empty for now.
- **DESY hostname** — same, waiting on Alex.
- **4 paper-vs-code discrepancies** for Peleg (Issues #116–119) — Peleg to answer.
- **Real screenshots** in `docs/handbook/humans/04_the_ui_walkthrough.md` (ASCII sketches for now).
- **`research/02_validation_evidence.md` gold-standard section §4** — the Staph-2023 numbers are committed via RB-VALIDATION-V0-1; if Said re-runs with the ISSUE-034-fixed pipeline he can update, but the current numbers stand.

Everything else is shipped, tracked, or explicitly Peleg-deferred (per ADR-021).

### 3. "Where do I look for X?"

Use this doc's "The seven docs that answer 90% of 'where is X' questions" section. Then this doc's `docs/active/` file-per-line table. Then the handbook's persona-based nav.

If you can't find something after those three lookups, it either doesn't exist yet (open an Issue with the [feature template](https://github.com/az-said/peptide_prediction/blob/main/.github/ISSUE_TEMPLATE/feature_request.md)) or the doc's title is misleading (open a PR fixing the title). Both are contributions.

---

## The one doc to never delete

**`docs/active/DECISIONS.md`** (the ADR log) is the highest-value document in the whole tree. Every architectural choice PVL has ever made is there. If PVL burns down and a new dev has to rebuild from scratch, they can do it with `DECISIONS.md` alone — every other doc is derivable.

Treat it like a paper's Methods section. Add ADRs any time a load-bearing decision is made. Never delete an ADR; if superseded, mark it SUPERSEDED-BY-ADR-N inline. The record matters more than the current answer.

---

## When you hand this off

The next developer's day 1:

1. Read `docs/active/HANDOFF.md`
2. Read this file (`docs/active/YOUR_NAVIGATION_GUIDE.md`)
3. Read `docs/active/BACKLOG.md`
4. Read `docs/active/DECISIONS.md`
5. Skim the handbook's `humans/00_what_is_pvl.md` + `agents/00_read_me_first.md`
6. Pick any Tier-1 backlog item, follow `docs/handbook/agents/03_doing_a_safe_change.md`, ship it.

That's a complete day 1. The docs are complete enough that no verbal knowledge transfer is required.
