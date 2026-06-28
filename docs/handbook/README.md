# The PVL Handbook

> **You are here.** This is the durable, written-to-last documentation tree for **Peptide Visual Lab (PVL)** — a web platform that combines peptide aggregation propensity, secondary-structure prediction, and fibril-forming classification in one interactive dashboard.

This handbook is written for three different readers. Pick your door.

---

## Three doors

### 🧑‍🔬 [`humans/`](humans/) — for a person

If you are a researcher who wants to *use* PVL, a developer who wants to *run* it, or anyone who wants to understand what it does and why — start here. Plain English, worked examples, screenshots, no assumed jargon.

| # | Page | Read it when you want to… |
|---|------|---------------------------|
| 00 | [What is PVL](humans/00_what_is_pvl.md) | …understand the tool in 5 minutes |
| 01 | [First run](humans/01_first_run.md) | …go from `git clone` to seeing the UI |
| 02 | [The science](humans/02_the_science.md) | …know what TANGO, S4PRED, FF-Helix, SSW, and FF-SSW actually compute |
| 03 | [The pipeline](humans/03_the_pipeline.md) | …trace a sequence end-to-end through the system |
| 04 | [The UI walkthrough](humans/04_the_ui_walkthrough.md) | …learn every page and what it shows |
| 05 | [Use cases](humans/05_use_cases.md) | …see real research stories worked through |
| 06 | [Deploying](humans/06_deploying.md) | …host PVL on a VPS, the DESY VM, or K8s |
| 07 | [Extending](humans/07_extending.md) | …add a predictor, a chart, or a dataset |
| 08 | [Troubleshooting](humans/08_troubleshooting.md) | …fix a failure you just hit |
| 09 | [Glossary](humans/09_glossary.md) | …look up any term or acronym |
| 10 | [Credits and license](humans/10_credits_and_license.md) | …know who built it and how to cite it |

### 🤖 [`agents/`](agents/) — for an AI agent that will edit this codebase

If you are an LLM-based coding agent (Claude Code, Cursor, Windsurf, Continue, or any other) about to make a change to PVL, **read [`agents/00_read_me_first.md`](agents/00_read_me_first.md) before you touch anything.** It states the hard rules, the protected surfaces, and the scientific axioms you must not break.

| # | Page | Purpose |
|---|------|---------|
| 00 | [Read me first](agents/00_read_me_first.md) | Ground rules; the non-negotiables |
| 01 | [Repo map](agents/01_repo_map.md) | Every directory and key file, one line each |
| 02 | [Contracts and invariants](agents/02_contracts_and_invariants.md) | Protected surfaces + the FF-Helix ⊆ Helix axioms |
| 03 | [Doing a safe change](agents/03_doing_a_safe_change.md) | The plan → test → diff → verify playbook |
| 04 | [When to ask humans](agents/04_when_to_ask_humans.md) | Decisions that are not yours to make |
| 05 | [Existing tooling](agents/05_existing_tooling.md) | Skills, MCPs, hooks already wired up |
| 06 | [Failure modes](agents/06_failure_modes.md) | What to do when tests / lint / CI go red |
| 07 | [Artifacts index](agents/07_artifacts_index.md) | Where binaries, precomputed JSON, and example data live |

### 📄 [`research/`](research/) — for a paper or grant author

If you are writing the PVL paper, a grant, or a competitive analysis, this section gives you the scientific landscape, the validation evidence, the open questions, and the publication path — all citation-grade.

| # | Page | Purpose |
|---|------|---------|
| 01 | [Landscape](research/01_landscape.md) | Every competing tool, with citations and a feature matrix |
| 02 | [Validation evidence](research/02_validation_evidence.md) | Recall/precision on Peleg-118 and the Staphylococcus 2023 benchmark |
| 03 | [Open questions](research/03_open_questions.md) | The unresolved scientific items (OQ1–OQ8 and beyond) |
| 04 | [Publication path](research/04_publication_path.md) | Zenodo DOI → bio.tools → JOSS, step by step |

---

## How this handbook relates to the rest of the docs

PVL already has a mature doc tree. This handbook **does not replace it** — it sits alongside as the reader-first, durable layer.

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
