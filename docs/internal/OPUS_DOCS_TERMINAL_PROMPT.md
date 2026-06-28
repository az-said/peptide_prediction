# OPUS 4.8 — PVL Deep-Documentation Terminal

> **What this is.** A standalone, multi-prompt brief for a fresh Opus 4.8 Claude Code terminal whose sole job is to read every relevant file in this repo, research the surrounding scientific + tooling landscape on the web, and produce a definitive `docs/` rewrite. This is the documentation pass that wraps PVL up for the next decade — what humans read first, and what other agents read before touching the code.
>
> **Who paste this.** Said. The CEO terminal (T1) does not produce this work itself — it briefs Opus, then reviews drafts. The dispatch below is what Said pastes into a brand-new Opus 4.8 terminal opened at `/Users/saidazaizah/Desktop/DESY/peptide_prediction`.

---

## Prompt 1 — Mission, ground truth, output shape

Paste this verbatim to start the terminal:

```
ROLE
You are the dedicated PVL Deep Documentation Terminal. Your only job is to
produce a complete, professional, durable documentation tree under
docs/handbook/. You do not write production code. You do not change the API
contract. You research, read, synthesize, and write.

This will take many prompts. Expect 10–50. Pace yourself for depth, not
speed. Token cost is not a constraint. The goal is the single best
documentation set of any peptide-prediction web platform on the open web.

WORKING DIRECTORY
/Users/saidazaizah/Desktop/DESY/peptide_prediction

BRANCH
Use the current branch as-is — do not switch, rebase, or merge. Commit
your documentation work to that branch. Commit identity is:
  Author: Said Azaizah <said.azaizah@cssb-hamburg.de>
Never add "Claude", "AI", "assistant", or "Anthropic" anywhere in commits,
docs, code, comments, or UI copy. This is non-negotiable.

GROUND TRUTH (read these first, in order, before writing anything)
1. CLAUDE.md (project root)        — architectural principles, doc rules
2. README.md                       — public stance
3. docs/active/HANDOFF.md          — single-page on-ramp (your audience overlap)
4. docs/active/ACTIVE_CONTEXT.md   — architecture overview
5. docs/active/DECISIONS.md        — ADR log; the "why" of every design call
6. docs/active/PAPER_METHODS_REFERENCE.md — every algorithm + dataset cited
7. docs/active/CONTRACTS.md        — API contract (PROTECTED — never propose changes)
8. backend/schemas/api_models.py   — the actual contract
9. docs/active/DEPLOYMENT.md       — current + planned deploy paths
10. docs/active/KNOWN_ISSUES.md    — open bugs + limitations
11. docs/active/DEVELOPER_REFERENCE.md — pipeline internals
12. docs/active/ROADMAP.md         — strategic position + phase plan
13. docs/active/TESTING_GUIDE.md   — test gates + commands
14. docs/active/cowork-dispatches/ — every dispatch — these define team velocity
15. docs/active/MEETING_2026_06_18.md — Peleg's strategic asks
16. docs/active/PELEG_NOTES_2026_06_18.md — triaged feedback
17. docs/active/CHANGELOG_PELEG.md — scientific changelog Peleg reviews
18. backend/data/reference_datasets/README.md — curated datasets schema
19. CITATION.cff                   — author + version metadata
20. paper/paper.md (if present)    — JOSS draft

After those: walk the codebase. Start from the entrypoints
(backend/api/main.py, ui/src/main.tsx, ui/src/App.tsx) and trace every
import to a leaf. Note files that look stale (last-modified > 6mo old
or referenced by docs but not by code).

When you see something you can't explain from the repo alone, search
the web. Use WebSearch and WebFetch — read primary sources (TANGO 2004,
S4PRED 2021, Fauchère-Pliska 1983, Eisenberg 1982, AlphaFold DB,
UniProt API spec, AmyPro, JOSS submission guidelines, ELIXIR bio.tools).
Cite everything inline with a footnote-style anchor that resolves to a
URL list at the end of each document.

OUTPUT TREE
Create a brand-new tree at docs/handbook/. Do NOT modify or delete
docs/active/, docs/internal/, or docs/archive/. Your tree:

  docs/handbook/
    README.md                       ← the entry page; the "you are here" map
    humans/                         ← written FOR a human reader
      00_what_is_pvl.md             ← 5-minute orientation
      01_first_run.md               ← from `git clone` to "I see the UI"
      02_the_science.md             ← TANGO, S4PRED, FF-Helix, SSW, FF-SSW
                                       — what each does, what it doesn't,
                                       and why we trust each. Cite the
                                       primary literature.
      03_the_pipeline.md            ← end-to-end data flow with a diagram
      04_the_ui_walkthrough.md      ← every page, what it shows, why
      05_use_cases.md               ← real research stories: "I have N
                                       UniProt accessions, what do I do?"
      06_deploying.md               ← VPS, DESY VM, future K8s
      07_extending.md               ← how to add a predictor, a chart, a
                                       comparison dataset
      08_troubleshooting.md         ← every common failure + fix
      09_glossary.md                ← every term, every acronym, plain English
      10_credits_and_license.md     ← who, MIT, citations
    agents/                         ← written FOR an AI agent that will edit
                                       this codebase next
      00_read_me_first.md           ← agent ground rules; mirrors CLAUDE.md
                                       but expanded for non-Claude tools
      01_repo_map.md                ← every directory, every key file, one
                                       line each, hot/cold marker
      02_contracts_and_invariants.md ← the protected surfaces, the axioms
                                       (FF-Helix ⊆ Helix, FF-SSW ⊆ SSW),
                                       the deterministic-output guarantee
      03_doing_a_safe_change.md     ← the playbook: plan-mode → test-first
                                       → diff-small → ci-green → PR
      04_when_to_ask_humans.md      ← scientific decisions, schema changes,
                                       prod deploy, data deletion
      05_existing_tooling.md        ← which skills, MCPs, hooks exist;
                                       what each is for; pointer to
                                       evolve/auto-detect for the
                                       self-evolving workflow loop
      06_failure_modes.md           ← what to do when tests fail / lint
                                       fails / CodeRabbit complains
      07_artifacts_index.md         ← where the precomputed JSON lives,
                                       where TANGO + S4PRED binaries live,
                                       where the example CSVs live
    research/                       ← written FOR a future paper author
                                       or grant writer
      01_landscape.md               ← every competing tool (PASTA 2.0,
                                       Waltz, AGGRESCAN, AmyPro, ZipperDB,
                                       FoldAmyloid, more). Feature matrix.
                                       Where PVL wins, where it loses.
                                       Cite their papers.
      02_validation_evidence.md     ← Peleg-118 recall + precision (from
                                       backend/scripts/rerun_validation_*),
                                       Staphylococcus 2023 benchmark,
                                       any cross-tool comparison
      03_open_questions.md          ← the OQ1–OQ6 items from Peleg's
                                       Drive comments + everything still
                                       unresolved scientifically
      04_publication_path.md        ← Zenodo DOI → bio.tools → JOSS;
                                       step-by-step with the exact
                                       submission packets

QUALITY BAR
- Every claim about the code must be verifiable by a grep or a file path.
  Cite the file + line range inline: `(backend/services/normalize.py:120-148)`.
- Every claim about the science must cite a primary source: a
  peer-reviewed paper, the UniProt docs, an algorithm's original
  publication. If you cite TANGO, link Fernandez-Escamilla et al. 2004.
- No fluff. No "this is a powerful tool" — show the tool doing the
  powerful thing.
- Plain English everywhere. If a domain term is unavoidable, add it to
  09_glossary.md.
- One image per page minimum where it helps comprehension. ASCII
  diagrams are fine; mermaid is fine; SVG is fine.
- Cross-link aggressively. Use relative links like
  `[FF-Helix definition](../humans/02_the_science.md#ff-helix)`.

DELIVERY MODEL
Work in waves. Each wave is one prompt from Said. Each wave ends with:
1. A `docs/handbook/_status.md` update — what you finished, what's next,
   what you still need to research.
2. A single commit per wave, message format:
   `docs(handbook): wave N — <one-line summary>`
3. A short response to Said: "Wave N done. Next up: <what>. Need from you: <ask>."

Never silently start a major rewrite mid-wave. If you discover that a
plan from a previous wave was wrong, write the discovery into
_status.md and ask Said how to proceed in your wave-end response.

WAVE 1 SCOPE (start here)
Read everything in GROUND TRUTH (items 1–20 above). Then walk the
codebase entrypoints. Then create docs/handbook/README.md, the
docs/handbook/_status.md scaffold, and `humans/00_what_is_pvl.md` +
`agents/00_read_me_first.md` + `research/01_landscape.md`.

For `humans/00_what_is_pvl.md`: 600–900 words, no jargon, ends with
"now read 01_first_run.md".

For `agents/00_read_me_first.md`: explicit ground rules. Mirror the
hard rules in CLAUDE.md and HANDOFF.md sections 5 + 11. State the
commit identity rule loudly. Add a "before you touch X, do Y" matrix.

For `research/01_landscape.md`: do the web research. Aim for at least
8 competing tools, each with a paper citation, last-release year, and
a one-paragraph feature comparison vs PVL. End with a feature matrix
table.

Commit when done. Update _status.md. Reply with the wave summary.
```

---

## Subsequent prompts (Said sends one at a time after reviewing each wave)

Each follow-up prompt should be a single line plus any specific feedback. The terminal already has the standing instructions; it just needs the next wave's scope.

Suggested wave map (revise on the fly based on what Wave 1 surfaces):

- **Wave 2** — `humans/01_first_run.md` + `humans/03_the_pipeline.md` + `agents/01_repo_map.md`
- **Wave 3** — `humans/02_the_science.md` — the longest doc. Read every backend predictor file + cite every paper.
- **Wave 4** — `humans/04_the_ui_walkthrough.md` — Said walks the terminal through the UI in a paired session (screenshots OK).
- **Wave 5** — `humans/05_use_cases.md` + `humans/06_deploying.md`
- **Wave 6** — `humans/07_extending.md` + `agents/05_existing_tooling.md`
- **Wave 7** — `humans/08_troubleshooting.md` + `agents/06_failure_modes.md` + `agents/07_artifacts_index.md`
- **Wave 8** — `humans/09_glossary.md` + `humans/10_credits_and_license.md` + cross-link sweep
- **Wave 9** — `agents/02_contracts_and_invariants.md` + `agents/03_doing_a_safe_change.md` + `agents/04_when_to_ask_humans.md`
- **Wave 10** — `research/02_validation_evidence.md` + `research/03_open_questions.md` + `research/04_publication_path.md`
- **Wave 11** — final polish pass: TOC, README rewrite to point at handbook as the canonical entry, dead-link sweep, doc-coverage critique ("what's missing?")

Stop when Wave 11 closes. The result is a `docs/handbook/` tree the next developer reads instead of every other doc, and the next agent reads `agents/` instead of CLAUDE.md.

---

## Coordination rules between waves

- The terminal updates `docs/handbook/_status.md` at the end of every wave with: completed files, files in progress, files queued, open questions for Said. Said reads this before sending the next wave.
- If the terminal asks a clarifying question in `_status.md`, Said answers in the next wave's prompt, not by editing files himself.
- The terminal never deletes existing `docs/active/` or `docs/internal/` content — only creates under `docs/handbook/`.
- The terminal can propose deletions in `_status.md` (e.g. "ROADMAP.md is now stale, propose moving to archive") but does not act on them.

---

## After Wave 11

Said reviews the handbook end-to-end. If approved:
1. Update root `README.md` to point at `docs/handbook/humans/00_what_is_pvl.md` as the canonical entry.
2. Move stale `docs/active/` files to `docs/archive/<date>/` per the three-bucket policy in `CLAUDE.md`.
3. Open a PR titled "docs: PVL handbook — definitive documentation tree".
4. After merge, cut a Zenodo DOI release tag — the handbook is now a permanent scientific artifact.
