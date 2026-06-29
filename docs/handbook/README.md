# The PVL Handbook

> **You are here.** This is the durable, written-to-last documentation tree for **Peptide Visual Lab (PVL)** — a web platform that combines peptide aggregation propensity, secondary-structure prediction, and fibril-forming classification in one interactive dashboard.

This handbook is written for three different readers. Pick your door — or jump straight to a **reading order** below.

---

## Reading orders

Three persona paths, each **< ~90 min** of reading. Follow the arrows; the "why" tells you what each step buys you.

**🧑‍🔬 I'm a researcher who wants to use PVL**
- [`humans/00`](humans/00_what_is_pvl.md) — what the tool is, in 5 minutes (decide if it's for you)
- → [`humans/04`](humans/04_the_ui_walkthrough.md) — every page and control, so the UI isn't a mystery
- → [`humans/05`](humans/05_use_cases.md) — five real research routes worked end-to-end
- → [`humans/02`](humans/02_the_science.md) — what each number actually means before you trust it
- → [`humans/08`](humans/08_troubleshooting.md) *(if stuck)* — fix the failure you just hit

**🤖 I'm a contributor / agent who wants to ship a change**
- [`agents/00`](agents/00_read_me_first.md) — the non-negotiables, read before touching anything
- → [`agents/03`](agents/03_doing_a_safe_change.md) — the plan → test → diff → verify playbook
- → [`agents/01`](agents/01_repo_map.md) — find the file you need to edit, fast
- → [`agents/02`](agents/02_contracts_and_invariants.md) — the protected surfaces + axioms you must not break
- → [`agents/06`](agents/06_failure_modes.md) *(when CI goes red)* — the red-light runbook

**📄 I'm a paper / grant writer**
- [`research/01`](research/01_landscape.md) — where PVL sits among 14+ competing tools
- → [`research/02`](research/02_validation_evidence.md) — the numbers you can cite, with caveats
- → [`research/04`](research/04_publication_path.md) — Zenodo → bio.tools → JOSS, step by step
- → [`humans/02`](humans/02_the_science.md) — the methods detail, with primary citations, for your Methods section

---

## Three doors

### 🧑‍🔬 [`humans/`](humans/) — for a person

If you are a researcher who wants to *use* PVL, a developer who wants to *run* it, or anyone who wants to understand what it does and why — start here. Plain English, worked examples, no assumed jargon.

| # | Page | What's in it |
|---|------|--------------|
| 00 | [What is PVL](humans/00_what_is_pvl.md) | 5-minute orientation, no jargon |
| 01 | [First run](humans/01_first_run.md) | `git clone` → backend venv → frontend dev server → smoke test |
| 02 | [The science](humans/02_the_science.md) | TANGO, S4PRED, FF-Helix, SSW, FF-SSW with primary citations + code anchors |
| 03 | [The pipeline](humans/03_the_pipeline.md) | 11 ordered stages, HTTP parse → Pydantic response; determinism + null semantics |
| 04 | [The UI walkthrough](humans/04_the_ui_walkthrough.md) | All 10 pages; route, sketch, key elements, power-user notes |
| 05 | [Use cases](humans/05_use_cases.md) | Five real research routes worked end-to-end |
| 06 | [Deploying](humans/06_deploying.md) | VPS / DESY VM / K8s, every command quoted from a real repo file |
| 07 | [Extending](humans/07_extending.md) | Add a predictor, a reference cohort, or an export — with the invariants you must not break |
| 08 | [Troubleshooting](humans/08_troubleshooting.md) | Nine symptoms, each tied to a real cause + fix |
| 09 | [Glossary](humans/09_glossary.md) | ~80 terms and acronyms harvested from every page |
| 10 | [Credits and license](humans/10_credits_and_license.md) | Authors, MIT, dual-citation BibTeX, funding, tools we build on |

### 🤖 [`agents/`](agents/) — for an AI agent that will edit this codebase

If you are an LLM-based coding agent (Claude Code, Cursor, Windsurf, Continue, or any other) about to make a change to PVL, **read [`agents/00_read_me_first.md`](agents/00_read_me_first.md) before you touch anything.** It states the hard rules, the protected surfaces, and the scientific axioms you must not break.

| # | Page | What's in it |
|---|------|--------------|
| 00 | [Read me first](agents/00_read_me_first.md) | Ground rules, commit identity, before-you-touch matrix |
| 01 | [Repo map](agents/01_repo_map.md) | Every directory + ~140 key files, with 🔥/🛡️/🧊 heat markers |
| 02 | [Contracts and invariants](agents/02_contracts_and_invariants.md) | Seven invariants; each enforcing test/hook verified to exist |
| 03 | [Doing a safe change](agents/03_doing_a_safe_change.md) | Paste-able 12-step TDD-to-CI playbook, real Makefile targets |
| 04 | [When to ask humans](agents/04_when_to_ask_humans.md) | Escalation tree: 10 triggers → Said / Peleg / Alex |
| 05 | [Existing tooling](agents/05_existing_tooling.md) | Skills, hooks, scripts, MCPs, pvl-cli — what's already wired up |
| 06 | [Failure modes](agents/06_failure_modes.md) | CI / hook / CodeRabbit / CodeQL red-light runbook, never-suppress rule |
| 07 | [Artifacts index](agents/07_artifacts_index.md) | Every binary, weight, JSON, cache, dataset — with its regen rule |

### 📄 [`research/`](research/) — for a paper or grant author

If you are writing the PVL paper, a grant, or a competitive analysis, this section gives you the scientific landscape, the validation evidence, the open questions, and the publication path — all citation-grade.

| # | Page | What's in it |
|---|------|--------------|
| 01 | [Landscape](research/01_landscape.md) | 14+ competing tools, feature matrix, CORDAX flagged as closest peer |
| 02 | [Validation evidence](research/02_validation_evidence.md) | Staphylococcus-2023 sens/spec (committed); Peleg-118 recall pending the validation run |
| 03 | [Open questions](research/03_open_questions.md) | OQ1–OQ8 ledger (5 resolved, 3 deferred), plus Tier-3 avenues |
| 04 | [Publication path](research/04_publication_path.md) | Zenodo DOI → bio.tools → JOSS, with EDAM IDs |

---

## How this handbook relates to the rest of the docs

PVL already has a mature doc tree. This handbook is the **durable layer that gradually supersedes `docs/active/`** over time — page content updates per release, while the structure stays stable.

| Tree | Audience | Status |
|------|----------|--------|
| **`docs/handbook/`** (this) | Humans · agents · paper authors | Narrative, durable, cross-linked |
| [`docs/active/`](../active/) | Developers needing the authoritative spec | Living architecture + scientific reference |
| `docs/internal/` | The team's own process | How-we-work; ask before reading |
| `docs/archive/` | The why-trail | Frozen historical artifacts |

When the handbook and `docs/active/` disagree, **`docs/active/` (and the code) win** — this handbook points back to them for the load-bearing detail. Every factual claim here is anchored to a file path or a primary citation so you can check it yourself.

---

## Conventions used throughout

- **Code anchors** look like `(backend/services/normalize.py:120-148)` and are clickable in most editors.
- **Citation anchors** look like `[^tango]` and resolve to a URL list at the bottom of each page.
- **Cross-links** are relative, e.g. [the FF-Helix definition](humans/02_the_science.md#ff-helix).
- The single most important fact to carry into every page: **the bar is correctness > usability > features, in that order.**

---

Maintained by Said Azaizah. See [`_status.md`](_status.md) for what's written, what's next, and what still needs research.
