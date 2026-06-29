# Opus 4.8 Handbook Terminal — Wave 3 through Wave 11 prompts

> **Purpose.** Paste-ready prompts you send to the dedicated Opus 4.8 documentation terminal (the one originally briefed via `docs/internal/OPUS_DOCS_TERMINAL_PROMPT.md`). Wave 1 was done by Opus directly; Wave 2 was done by the main loop in this session. Waves 3–11 below return the work to the Opus terminal.
>
> **Rule.** One wave per prompt. After Opus reports back with the Wave-N status, paste Wave N+1. Each prompt is self-contained and assumes Opus has the standing instructions still in context — if Opus says it lost context, paste the entire mission brief from `OPUS_DOCS_TERMINAL_PROMPT.md` first, then the wave prompt.
>
> **Why each prompt is so loaded.** Opus does its best work with explicit source files to read, specific web research targets, a quality bar, and an exact deliverable list. Sparse prompts produce sparse docs. Heavy briefs produce JOSS-grade docs.

---

## Wave 3 — `humans/02_the_science.md` (THE big one)

This is the doc the JOSS reviewer reads first. Get it right and the paper sails through review. Get it wrong and the paper bounces.

```
Resume the PVL handbook build. Re-read docs/handbook/_status.md to refresh
context — Wave 1 and Wave 2 are both done; you are now picking up Wave 3.

WAVE 3 DELIVERABLE
docs/handbook/humans/02_the_science.md — the single canonical "what does
PVL actually compute, and why is each output scientifically valid"
reference. This is the doc that a JOSS reviewer, a paper supplementary,
a Master's student, and an agentic LLM all read to understand the
science. Target length 1,800–3,000 words. No fluff. Every claim must
either (a) cite a primary publication or (b) cite a specific PVL file:line.

SECTIONS (use these as H2 headings in this exact order)

1. The four-class system — what each class means, what it does not mean
2. TANGO — aggregation propensity
3. S4PRED — secondary structure prediction
4. Biochemistry — Fauchère-Pliska, Eisenberg, charge at pH 7.4
5. FF-Helix — the candidacy classifier
6. SSW — the structural switch zone
7. FF-SSW — the second candidacy classifier
8. The axioms (and why they matter)
9. AlphaFold + Mol* — the 3D overlay
10. UniProt + ChEMBL — peptide metadata
11. The deterministic-output guarantee — what "same input + same version →
    same bytes" actually means
12. Known scientific limitations (be honest — this is what reviewers
    forgive when stated up front and reject when hidden)

SOURCE FILES OPUS MUST READ BEFORE WRITING

Backend science:
- backend/tango.py — every function. Note the budget gate logic.
- backend/s4pred.py — note the 5-model ensemble, the BiLSTM architecture,
  the batched-forward path, the per-residue P(H)/P(E)/P(C) outputs.
- backend/biochem_calculation.py + backend/calculations/biochem.py — note
  the Fauchère-Pliska scale, the Eisenberg µH equation, the pKa table.
- backend/auxiliary.py — note the FF-Helix scoring rule, sequence
  sanitization, non-standard AA handling (ISSUE-024).
- backend/services/dataframe_utils.py — note ensure_ff_cols, the
  apply_ff_flags function, the FF-SSW ⊆ SSW axiom enforcement.
- backend/services/normalize.py — note the null-only invariant.
- backend/consensus.py — note the per-residue 4-class consensus.
- backend/schemas/api_models.py — note PeptideRow shape; every field name
  matters.

Reference docs (already canonical — quote and link, don't restate):
- docs/active/PAPER_METHODS_REFERENCE.md — this is the paper Methods
  section. The handbook page should be a more readable, more researcher-
  friendly version of the same content. Cross-link freely.
- docs/active/DECISIONS.md ADR-001 (4-category classification at data
  layer), ADR-003 (Helix % = segment-based S4PRED), ADR-008 (Mol* as 3D
  layer), ADR-014 (predictor disagreement + gold-standard accuracy),
  ADR-021 (Peleg's 2026-06-29 close-out answers).
- docs/active/SPECIALS.md — calculations reference.
- docs/active/CHANGELOG_PELEG.md — scientific changelog Peleg reviewed.
- docs/handbook/research/01_landscape.md — competitive tool landscape
  (already written by you in Wave 1; cite it where the science directly
  compares).

WEB RESEARCH (mandatory — cite each with the publisher URL)

You must WebFetch each of these and cite them inline. Do not paraphrase
from memory.

Primary algorithm papers:
1. TANGO — Fernandez-Escamilla, Rousseau, Schymkowitz, Serrano 2004
   "Prediction of sequence-dependent and mutational effects on the
   aggregation of peptides and proteins"
   Nature Biotechnology 22:1302–1306
   https://doi.org/10.1038/nbt1012
2. S4PRED — Moffat & Jones 2021
   "Increasing the Accuracy of Single Sequence Prediction Methods Using
   a Deep Semi-Supervised Learning Framework"
   Bioinformatics 37:3744–3751
   https://doi.org/10.1093/bioinformatics/btab491
   (cross-check the README acknowledgements — Said noted there is a
   citation discrepancy with a "Moffat et al. 2022" reference. Resolve
   it. The 2021 single-sequence paper is the canonical S4PRED citation.)
3. Hamodrakas 2007 — "A protein secondary structure prediction scheme
   for the IUBMB"
   IUBMB Life 59:519–522
   https://doi.org/10.1080/15216540701597681
   (FF-Helix definition source)
4. Fauchère & Pliska 1983 — "Hydrophobic parameters π of amino-acid side
   chains from the partitioning of N-acetyl-amino-acid amides"
   Eur. J. Med. Chem. 18:369–375
   (no DOI; cite by full citation)
5. Eisenberg, Weiss & Terwilliger 1982 — "The helical hydrophobic moment:
   a measure of the amphiphilicity of a helix"
   Nature 299:371–374
   https://doi.org/10.1038/299371a0
6. Ragonis-Bachar et al. 2022 — "The Effect of Aromaticity on the
   Folding and Function of Pleurocidin-like Antimicrobial Peptides"
   Biomacromolecules 23:2880–2893
   https://doi.org/10.1021/acs.biomac.2c00582
   (PVL's 4-class system is built on this — quote the relevant passages)
7. Jumper et al. 2021 — AlphaFold paper
   Nature 596:583–589
   https://doi.org/10.1038/s41586-021-03819-3
   (cite when introducing the AlphaFold integration)
8. Sehnal et al. 2021 — Mol* viewer
   Nucleic Acids Research 49:W431–W437
   https://doi.org/10.1093/nar/gkab314

Cross-references:
- UniProt 2024 release — https://www.uniprot.org/release-notes
- ChEMBL release — https://www.ebi.ac.uk/chembl/
- EDAM ontology — https://ifb-elixirfr.github.io/edam-browser/ (cite the
  EDAM IDs PVL uses, listed in PUBLICATION_PATH.md §4)
- ELIXIR bio.tools — https://bio.tools/ (cite the registry once PVL is
  listed)
- JOSS submission policy — https://joss.theoj.org/about

QUALITY BAR

1. Every algorithm section must have a "What it does" subsection (1
   paragraph, plain English) and a "Where in PVL" subsection (specific
   file:line for the implementation).
2. Every threshold value mentioned in the handbook must match what is
   actually in backend/config.py. Do not hallucinate defaults — read
   the file.
3. Every primary citation gets a footnote-style anchor like [^tango]
   that resolves at the end of the page to "Fernandez-Escamilla A. M.
   et al. 2004. Nature Biotechnology 22:1302–1306. doi:10.1038/nbt1012".
4. Use the residue colour codes consistently — helix = blue, FF-Helix
   = green, SSW = magenta #E040FB, FF-SSW = red — matching
   ui/src/lib/sswColor.ts and ui/src/lib/chartConfig.ts.
5. When you write the "Known scientific limitations" section, include:
   - SSW is computed from TANGO ∪ S4PRED, not from experimental data
   - FF-Helix candidacy requires both µH AND helix prediction — single-
     domain helical peptides without ambipathicity will not be flagged
   - Reference threshold "lenient" / "strict" presets are derived from
     the Peleg-118 cohort, not from a meta-analysis of the literature
   - TANGO is sequence-only — no PTM, no environment, no concentration
   - The bundled precomputed datasets (peleg_118 + gold_standard) use
     the literature-default thresholds; per-database overrides require
     a fresh upload
6. End the page with a "Validation" subsection that points at
   docs/handbook/research/02_validation_evidence.md (which you write in
   Wave 10) and explains that the current evidence base is the
   Staphylococcus 2023 benchmark + Peleg-118 recall.

DELIVERABLE PROCEDURE

1. Read every source file listed above end-to-end before writing.
2. WebFetch every citation listed above. Confirm the DOI resolves.
3. Write the page. Cross-link to existing handbook pages
   (../research/01_landscape.md for the competitive comparison,
   ../agents/01_repo_map.md for any file: references).
4. Add a `_status.md` update — mark `humans/02_the_science.md` as ✅
   in the page-status table and append a "Wave 3 — done" log entry.
5. Commit on the current branch (do NOT switch branches) with the
   message format docs/internal/OPUS_DOCS_TERMINAL_PROMPT.md specifies:
   "docs(handbook): wave 3 — humans/02_the_science.md (the algorithmic
   foundation)".
6. Reply with a Wave 3 summary: word count, citation count, the one
   thing you're least confident about (so I can flag for Peleg).
```

---

## Wave 4 — `humans/04_the_ui_walkthrough.md`

```
Resume the PVL handbook build. Wave 3 done; picking up Wave 4.

WAVE 4 DELIVERABLE
docs/handbook/humans/04_the_ui_walkthrough.md — a researcher reads this
when they want to know "what does each page on PVL do, and what should
I notice." Target length 1,200–1,800 words.

PAGES TO COVER (read ui/src/pages/<file>.tsx for each)

1. Landing page (App.tsx routing root, FeatureShowcase, AlgorithmShowcase,
   HowItWorks, AboutCard, AppFooter)
2. Quick Analyze (ui/src/pages/QuickAnalyze.tsx) — single sequence flow
3. Upload (ui/src/pages/Upload.tsx) — three modes: CSV, UniProt accession
   list, gold-standard demo
4. Results (ui/src/pages/Results.tsx) — the big dashboard
5. PeptideDetail (ui/src/pages/PeptideDetail.tsx) — deep-dive per peptide
6. Compare (ui/src/pages/Compare.tsx) — A vs B database comparison +
   the split-button for reference datasets
7. MetricDetail (ui/src/pages/MetricDetail.tsx) — per-metric chart drill-down
8. About (ui/src/pages/About.tsx) — credits, ORCID, contact
9. Help (ui/src/pages/Help.tsx) — methods citations, glossary
10. PermalinkRedirect / NotFound — the small support routes

For each page, write a section with:
- One screenshot caption (use ASCII art if no real screenshot; we'll
  add real screenshots in Wave 11)
- What the user does here (1 paragraph)
- The two most important elements (the things a researcher's eye should
  go to first)
- What's NOT here (e.g. "you can't compare three datasets in one view —
  use Compare twice with different B")
- A "for power users" callout (2-3 keyboard shortcuts or hidden URLs
  if any)

SOURCE FILES OPUS MUST READ

- ui/src/App.tsx — routing
- ui/src/pages/*.tsx — every page component
- ui/src/components/PeptideViewer.tsx + SequenceTrack + HelicalWheel +
  AggregationHeatmap + S4PredChart + AlphaFoldViewer — the shared
  components used across pages
- ui/src/components/PeptideTable.tsx — the big table on Results
- ui/src/stores/datasetStore.ts + thresholdStore.ts — what state drives
  what UI
- docs/active/DESIGN_SYSTEM.md — for the design language vocabulary

QUALITY BAR

1. Every page section starts with the URL pattern (e.g. "/peptides/:id")
   so a researcher can copy-paste a URL into the page they're reading
   about.
2. The "two most important elements" call-out per page is the single
   sentence that decides whether a researcher engages with the page or
   bounces. Spend time on it.
3. Cross-link to humans/05_use_cases.md (you write that in Wave 5) for
   "I want to do X — here's the page sequence."
4. Do NOT promise features that aren't shipped — if Mol* is Phase 1
   stub, say so. The MOL3D_OVERLAY_SPEC.md tells you what's stubbed.

DELIVERABLE PROCEDURE — same as Wave 3.
Commit message: "docs(handbook): wave 4 — humans/04_the_ui_walkthrough.md"
```

---

## Wave 5 — `humans/05_use_cases.md` + `humans/06_deploying.md`

```
Resume the PVL handbook build. Wave 4 done; picking up Wave 5.

WAVE 5 DELIVERABLES

(A) docs/handbook/humans/05_use_cases.md
A researcher reads this when they have a real research workflow and
want to know "does PVL fit?" Five use cases, each a self-contained
narrative.

USE CASES (use these EXACT five, do not invent new ones)

1. "I have a UniProt accession — is it likely to form fibrils?"
2. "I have a CSV of 500 designed peptides — rank them by aggregation
    risk + helix candidacy."
3. "I have a single sequence and a target structure — does the predicted
    aggregation overlap with helical regions?"
4. "I want to compare two cohorts — my designs vs a published reference."
5. "I'm writing a paper and need a citable URL for the analysis."

For each:
- 1 paragraph: the research scenario
- The page sequence (Quick Analyze → Results → PeptideDetail, etc.)
- The buttons / fields the researcher touches
- The one screenshot worth taking (caption only for now)
- A "what to put in the paper" callout — e.g. "cite Zenodo DOI + paste
  the permalink"

SOURCES — humans/04 (the walkthrough you just wrote), HANDOFF.md §2,
docs/active/MEETING_2026_06_18.md (real research scenarios from Peleg).
Cross-link to PAPER_METHODS_REFERENCE.md where citation needs to land.

(B) docs/handbook/humans/06_deploying.md
A devops/ops person reads this when they want to host PVL themselves.
Three deployment scenarios.

SCENARIOS

1. Single VPS via Docker Compose (the Hetzner pattern — what we're on
   right now). Cover: VM spec, ports, .env.deploy, the prod_redeploy.sh
   script, precompute step (and why), Caddy + DNS once you have a
   hostname.
2. Institutional VM behind a firewall (the DESY pattern). Cover: the
   Kerberos access path, scripts/desy_vm_bootstrap.sh, S4PRED weight
   download, why the budget gate matters for the precompute.
3. Future K8s (gestural — point at the manifest skeleton in
   DEPLOYMENT.md §K8s plan; do not write the manifests).

SOURCES — docs/active/DEPLOYMENT.md (refreshed 2026-06-29 with the
verified Kerberos path), docs/active/PRODUCTION_LOCKDOWN.md (the
hardening checklist), docker/docker-compose.prod.yml, the
scripts/prod_redeploy.sh + scripts/desy_vm_bootstrap.sh annotations,
docs/active/SENTRY_RUNBOOK.md for observability, docs/active/GITLAB_MIRROR.md
for the mirror runbook.

QUALITY BAR for both
1. Every command shown in 06_deploying.md must be a verbatim quote from
   a real script in the repo, with the script's filename annotated.
2. 05_use_cases.md links to the live demo URL (currently
   http://94.130.178.182:3000; replace with the DESY URL once it
   resolves).
3. End 05_use_cases.md with "what we don't yet support" — e.g. PTM,
   non-ribosomal peptides, peptidomimetics. Same honesty as the science
   page's "known limitations" section.

Two commits, one per file:
"docs(handbook): wave 5a — humans/05_use_cases.md"
"docs(handbook): wave 5b — humans/06_deploying.md"
Status update at end with both files marked ✅.
```

---

## Wave 6 — `humans/07_extending.md` + `agents/05_existing_tooling.md`

```
Resume the PVL handbook build. Wave 5 done; picking up Wave 6.

WAVE 6 DELIVERABLES

(A) docs/handbook/humans/07_extending.md
A contributor reads this when they want to add something — a new
predictor, a new chart, a new comparison dataset, a new export format.
Three concrete walkthroughs.

WALKTHROUGHS (use these EXACT three)

1. Add a new aggregation predictor (Waltz / AGGRESCAN3D / PASTA 2.0).
   Source: docs/active/BACKLOG.md Tier 3 "Phase I multi-predictor",
   ui/src/lib/molstarOverlays.ts (the OverlayType union is forward-
   compatible), backend/services/predict_service.py extension points.
2. Add a new comparison dataset (a third reference cohort beyond
   peleg_118 + gold_standard).
   Source: backend/scripts/precompute_dataset.py DATASETS registry,
   backend/data/reference_datasets/README.md, ui/src/lib/referenceDistributions.ts,
   ui/src/pages/Compare.tsx split-button registry.
3. Add a new export format (e.g. mmCIF figure pack alongside SVG).
   Source: docs/active/EXPORT_REDESIGN_BRIEF.md tiers, ui/src/lib/report.ts,
   ui/src/lib/figurePack.ts, ui/src/lib/peptideReport.ts panel system.

(B) docs/handbook/agents/05_existing_tooling.md
An AI agent reads this to know which skills, MCPs, hooks, and scripts
exist so it doesn't reinvent. Reference page.

INVENTORY

- .claude/ directory — every skill and hook
- docs/active/MCP_RUNBOOK.md — MCP tool reference
- docs/active/MCP_CLIENT_GUIDES.md — per-client install
- scripts/ — every script with one-line purpose
- pvl-cli/ — the planned CLI's current state
- mcp_server/ — the MCP server's current state
- The Cowork dispatch system (docs/active/cowork-dispatches/V11_FINAL_POLISH.md
  is the standing template)

SOURCES — list every file. Read each enough to write a one-line
purpose. Flag stale ones.

QUALITY BAR for both
1. Each humans/07 walkthrough ends with "things you should NOT do" — the
   1-2 ways someone could break the invariants while adding the feature.
2. agents/05 has a "before you write a new script" decision tree —
   "does a skill already cover this? is there an MCP tool?
   can you use Cowork instead?"

Two commits, one per file. Status update.
"docs(handbook): wave 6a — humans/07_extending.md"
"docs(handbook): wave 6b — agents/05_existing_tooling.md"
```

---

## Wave 7 — `humans/08_troubleshooting.md` + `agents/06_failure_modes.md` + `agents/07_artifacts_index.md`

```
Resume the PVL handbook build. Wave 6 done; picking up Wave 7.

WAVE 7 DELIVERABLES — three failure-mode pages.

(A) docs/handbook/humans/08_troubleshooting.md
A researcher reads this when something is broken. Symptom-driven.

SYMPTOMS TO COVER (use these exact buckets)

1. "Quick Analyze sat on 'Analyzing…' for 30+ seconds"
2. "The aggregation heatmap is empty for the bundled example"
3. "I uploaded a CSV but the table shows 0 rows"
4. "Mol* shows 'No structure available' for my peptide"
5. "I see 'Something went wrong' / Minified React error #XXX"
6. "The DOI badge in the README is grey / says 'mints on release'"
7. "I get a 429 rate limit error"
8. "TANGO output is all zeros for all peptides"
9. "S4PRED probabilities sum to >1 or <1 by a lot"

For each symptom: 1 sentence cause, 1-2 line fix, link to the relevant
KNOWN_ISSUES.md or DECISIONS.md entry where applicable.

(B) docs/handbook/agents/06_failure_modes.md
What an AI agent does when CI / lint / CodeRabbit / CodeQL goes red.

SECTIONS

1. CI gate failed — which job, how to read the GH Actions log, the
   five most common causes
2. Pre-push hook failed (ruff) — the auto-fix command
3. CodeRabbit posted Major findings — triage flowchart (drop /
   address / discuss with user)
4. CodeQL flagged a security issue — escalation path (NEVER silently
   suppress)
5. A test that "shouldn't be related" fails — diagnostic walk
6. The Pydantic contract guard hook fired — when it's allowed to be
   overridden (only with user OK)

(C) docs/handbook/agents/07_artifacts_index.md
An agent reads this when it needs to find a binary, a JSON, a
checkpoint, a CSV. Single index.

ARTIFACTS

- TANGO binaries (per platform): backend/Tango/bin/tango (macOS),
  tools/tango/bin/tango_linux_x86_64 (Linux)
- S4PRED weights: tools/s4pred/models/weights_{1..5}.pt
- Precomputed reference datasets: backend/data/precomputed/peleg_118.json,
  gold_standard.json (gitignored — host-generated)
- Reference dataset inputs: backend/data/reference_datasets/peleg_118_fibril_validated.json,
  staphylococcus_2023.xlsx
- Example datasets: ui/public/example/*.csv
- Demo dataset: ui/public/Final_Staphylococcus_2023_new.xlsx
- DuckDB caches: /data/cache/provider_cache.duckdb (named volume)
- TANGO scratch: /data/runs/tango/ (named volume)
- LanceDB: /data/lance (named volume)
- Sentry events: vault-stored DSN, not in repo
- Paper draft: paper/paper.md + paper/paper.bib
- ADR log: docs/active/DECISIONS.md

For each artifact: where it lives, how it's generated, how it gets
regenerated if lost, who is allowed to overwrite it.

SOURCES — docs/active/KNOWN_ISSUES.md, scripts/, the
backend/data/reference_datasets/README.md, docs/active/TESTING_GUIDE.md.

QUALITY BAR
1. Every symptom in humans/08 has a "see also" link to the agents/06
   file the agent would use if the human couldn't fix it themselves.
2. agents/07 ends with a "when in doubt" rule — "if an artifact is
   missing, re-run the script that generates it. Don't substitute."

Three commits, one per file.
"docs(handbook): wave 7a — humans/08_troubleshooting.md"
"docs(handbook): wave 7b — agents/06_failure_modes.md"
"docs(handbook): wave 7c — agents/07_artifacts_index.md"
```

---

## Wave 8 — `humans/09_glossary.md` + `humans/10_credits_and_license.md` + cross-link sweep

```
Resume the PVL handbook build. Wave 7 done; picking up Wave 8.

WAVE 8 DELIVERABLES

(A) docs/handbook/humans/09_glossary.md
Every term and acronym used in the handbook so far, alphabetical,
plain-English defined. Build this by scanning every previously-written
handbook page for terms that aren't in everyday English. Target ~80
entries.

Entries to definitely include (non-exhaustive):
4-class system, ADR, AlphaFold, ATP, biochem, Caddy, CodeQL, Concept
DOI (Zenodo), Cowork, DESY, DuckDB cache, EDAM ontology, Eisenberg µH,
ESM-2, FF-Helix, FF-SSW, Fauchère-Pliska, FASTA, Fibril, Gold-standard
benchmark (Staph 2023), Helix candidacy, HMM, Kerberos, LanceDB,
loadPrecomputedDataset, MCP, Mol*, ORCID, OQ (Open Question), PVL,
Peleg-118, Precompute path, Provider cache, Pydantic, Quick Analyze,
RAG, S4PRED, Sentry, Smart Ranking, SSW, TANGO, ThresholdConfig,
UniProt, Welch's t-test, Zenodo

For each: 1-2 sentences, plain English. Cross-link to the handbook
page that uses the term most heavily.

(B) docs/handbook/humans/10_credits_and_license.md
Authors, MIT license, citation guidance, funding, acknowledgements.

Authors (paste from CITATION.cff):
- Dr. Peleg Ragonis-Bachar — Technion — ORCID
- Said Azaizah — Technion + DESY + MIT — ORCID
- Dr. Aleksandr Golubev — DESY + Technion — ORCID
- Prof. Meytal Landau (PI) — Technion + EMBL + CSSB — ORCID

License — MIT, quote the LICENSE file.

Citation guidance — point at PUBLICATION_PATH.md for the Zenodo DOI
once cut. Provide the BibTeX template from the release notes.

Funding — DESY CSSB, Technion (algorithm collab).

Acknowledgements — Peleg for the algorithm, Alex for DESY infra,
the open-source tools PVL stands on (FastAPI, React, Vite, Tailwind,
shadcn, Recharts, Mol*, jsPDF, etc.).

(C) Cross-link sweep — go through every page in docs/handbook/{humans,agents,research}/
and add cross-links wherever a page mentions a term defined elsewhere in
the handbook. Track which pages get new links in the commit message.

QUALITY BAR
1. The glossary is the page a researcher uses to decode acronyms in a
   meeting. Optimize for "I just heard 'FF-SSW' — what is that?" not
   for "I want to read about FF-SSW."
2. Credits page lists every primary citation from humans/02_the_science.md
   in a "tools we build on" section.
3. The cross-link sweep should result in >= 50 new internal links.

Commits:
"docs(handbook): wave 8a — humans/09_glossary.md"
"docs(handbook): wave 8b — humans/10_credits_and_license.md"
"docs(handbook): wave 8c — cross-link sweep across handbook/"
```

---

## Wave 9 — `agents/02_contracts_and_invariants.md` + `agents/03_doing_a_safe_change.md` + `agents/04_when_to_ask_humans.md`

```
Resume the PVL handbook build. Wave 8 done; picking up Wave 9.

WAVE 9 DELIVERABLES — the three agent-only pages.

(A) docs/handbook/agents/02_contracts_and_invariants.md
The protected surfaces and axioms that must NEVER change without user
approval.

SECTIONS

1. Protected files — backend/schemas/api_models.py is THE contract;
   .claude/hooks/protect-api-contract.sh blocks edits. Then list every
   file with 🛡️ in agents/01_repo_map.md.
2. The 4-class axioms — FF-Helix ⊆ Helix AND FF-SSW ⊆ SSW. ISSUE-032
   broke this once; the test that locks it.
3. The deterministic-output guarantee — same input + same version +
   same threshold config → byte-identical output. Tests that lock it.
4. The single-vs-batch invariant — single sequence via /api/predict
   and the same sequence via /api/predict/batch must return identical
   numbers. Test: backend/tests/test_single_vs_batch_consistency.py.
5. The null-only invariant — JSON null only, never -1, "N/A", "".
   Exception: flag columns use -1 for "not assigned."
6. The frontend `?? not ||` rule — for numeric fallbacks. Test: lint
   rule + types/peptide.ts comments.
7. The commit identity rule — Said Azaizah only, never
   Claude/AI/assistant/Anthropic.

(B) docs/handbook/agents/03_doing_a_safe_change.md
The exact playbook an agent follows to ship a change.

STEPS

1. Read the spec / Issue / user request twice.
2. Find the file using agents/01_repo_map.md. Note its heat.
3. If 🛡️ → ask user. If 🔥 → read it end-to-end. If 🧊 → check it's
   wired by grep.
4. Plan mode for multi-file changes (the CLAUDE.md rule).
5. Write the failing test first (TDD).
6. Implement.
7. Run the relevant test subset (not the full suite unless
   architectural).
8. Run lint + tsc.
9. Run the full test suite if non-trivial.
10. Commit with the conventional message format.
11. Push and verify CI green.
12. Update the Issue / spec with what shipped.

For each step: what specific commands to run. The page should be paste-
able by an agent without a human in the loop.

(C) docs/handbook/agents/04_when_to_ask_humans.md
The escalation list.

ESCALATE WHEN
1. Changing api_models.py
2. Changing the FF-Helix or FF-SSW definition or threshold defaults
3. Changing the SSW canonical OR (TANGO ∪ S4PRED)
4. Adding or modifying an ADR
5. Production deploy (prod_redeploy.sh, desy_vm_bootstrap.sh)
6. Dropping or restructuring a database schema
7. Deleting any docs/active/ file (without an archive move)
8. Anything that touches authentication or user data (we don't have
   any yet — but when we do)
9. Anything that crosses the GitHub branch protection rules
10. Anything that changes the LICENSE or CITATION.cff identifiers

For each: which user does the asking go to (Said for code, Peleg for
science, Alex for infra).

QUALITY BAR
1. agents/03 is paste-pixel-perfect — an agent reads it, follows it,
   ships. No "you might need to figure out X."
2. agents/04 is short. Five sentences per item max. The escalation
   tree should fit on one page.

Commits:
"docs(handbook): wave 9a — agents/02_contracts_and_invariants.md"
"docs(handbook): wave 9b — agents/03_doing_a_safe_change.md"
"docs(handbook): wave 9c — agents/04_when_to_ask_humans.md"
```

---

## Wave 10 — `research/02_validation_evidence.md` + `research/03_open_questions.md` + `research/04_publication_path.md`

```
Resume the PVL handbook build. Wave 9 done; picking up Wave 10.

WAVE 10 DELIVERABLES — the three research-track pages.

(A) docs/handbook/research/02_validation_evidence.md
What evidence backs PVL's predictions. This is what the JOSS reviewer
asks "but does it work?"

SECTIONS

1. The Peleg-118 set — 118 experimentally-validated fibril-forming
   peptides ≤40aa. Source: backend/data/reference_datasets/peleg_118_fibril_validated.json
2. FF-Helix recall on Peleg-118 — run backend/scripts/rerun_validation_*
   or read its prior output if committed. Report the percentage.
3. FF-SSW recall on Peleg-118 — same.
4. Staphylococcus 2023 gold-standard benchmark — what it is
   (2,916 peptides), how PVL classifies vs the experimental annotation.
   Source: backend/data/reference_datasets/staphylococcus_2023.xlsx
5. Cross-tool comparison — point at research/01_landscape.md (your
   Wave 1 page) for the feature comparison; if validation numbers exist
   for the competing tools (Waltz, AGGRESCAN, PASTA), include them
   side-by-side.
6. What we can't yet validate — same honesty as the science page.

Note: Said flagged in _status.md that "validation numbers" is the #1
research question that blocks this page. Resolve it. If the recall
numbers aren't already in the repo, use the WebFetch tool to read the
linked papers and quote any reported validation values; otherwise
write the page with "to be filled by running backend/scripts/rerun_validation_*
on the current PVL HEAD."

(B) docs/handbook/research/03_open_questions.md
What's unresolved scientifically. Audit:
- All Peleg OQs (we have closure on OQ1, OQ3, OQ5, OQ6, OQ8; OQ2, OQ4,
  OQ7 are deferred per ADR-021)
- F10 (Beta % too aggressive)
- Q-FIX-022 (|charge| loses sign)
- Anything in PELEG_NOTES_2026_06_18.md archive that's still open
- Future scientific avenues (per docs/active/BACKLOG.md Tier 3:
  multi-predictor, RAG, agentic interpreter)

For each open question: state it, link to the GitHub Issue (or note
"no Issue filed yet"), specify who would resolve it (Peleg / Alex /
literature review).

(C) docs/handbook/research/04_publication_path.md
The Zenodo → bio.tools → JOSS path. Wave-aware version of
docs/active/PUBLICATION_PATH.md — but tailored to the handbook reader
(grant writer, lab PI, paper author) rather than to Said the operator.

SECTIONS

1. The five steps (mirror PUBLICATION_PATH but with researcher-facing
   framing)
2. What each step gets you (DOI = citable, bio.tools = discoverable,
   JOSS = peer-reviewed)
3. What it costs in time (~3 weeks elapsed for JOSS review)
4. What you cite once they all land (the badge row from PUBLICATION_PATH)
5. Long-term — keeping the DOI fresh on subsequent releases

QUALITY BAR
1. research/02 numbers must be verifiable — every percentage cited
   has a "run X to verify" or "see Y in the repo" trace.
2. research/03 is honest. List the things we don't yet know.
3. research/04 is short (~600 words) — it's a pointer, not a
   re-write of PUBLICATION_PATH.

Commits:
"docs(handbook): wave 10a — research/02_validation_evidence.md"
"docs(handbook): wave 10b — research/03_open_questions.md"
"docs(handbook): wave 10c — research/04_publication_path.md"
```

---

## Wave 11 — final polish, TOC, README rewrite, dead-link sweep, doc-coverage critique

```
Resume the PVL handbook build. Wave 10 done; picking up Wave 11 (the
final polish).

WAVE 11 DELIVERABLES — five tasks. One commit each.

TASK 1 — docs/handbook/README.md rewrite (you wrote v1 in Wave 1).
Now that all 21 pages exist, rewrite the entry-map so it reflects
what's actually written. Add reading-order suggestions for three
personas:
- "I'm a researcher who wants to use PVL" → humans 00 → 04 → 05 → 02
- "I'm a contributor who wants to ship a change" → agents 00 → 03
  → 01 → 02
- "I'm a paper / grant writer" → research 01 → 02 → 04, then humans 02
The three-doors page from Wave 1 evolves into a personalized index.

TASK 2 — TOC sweep. Add a stable Table of Contents block to every
multi-section page. Use the canonical Markdown ToC pattern (auto-gen
via markdown-toc CLI or write it by hand for consistency).

TASK 3 — dead-link sweep. WebFetch every external URL in the handbook
and confirm it still resolves. Replace any broken ones (it happens —
journals re-DOI their PDFs). Report which URLs you changed.

TASK 4 — doc-coverage critique. Read every page and find:
- Code areas not covered (services that no page mentions)
- Decisions that should have an ADR but don't (likely flag a few)
- Pages that are too long (>3000 words — split or trim)
- Pages that contradict each other (likely none if you've been
  careful, but spot-check)
Write findings to docs/handbook/_status.md "Open coverage gaps"
section. Do NOT auto-fix; flag for Said.

TASK 5 — repo README.md update. The repo root README currently
points at the live demo and self-host. Add a top-of-README link to
docs/handbook/README.md as "Read the developer handbook" so anyone
browsing the GitHub face finds the handbook in one click. Also
consider whether the handbook should be exposed at a doc-site URL
(GitHub Pages, mkdocs, Docusaurus) — write a brief recommendation
but DO NOT set up a docs site without Said's OK.

QUALITY BAR
1. Every persona's reading order is < 90 minutes of reading.
2. Every external URL works.
3. The doc-coverage findings are honest. If you wrote a thin section
   in Wave 4, say so.

Commits:
"docs(handbook): wave 11a — README.md persona-aware rewrite"
"docs(handbook): wave 11b — TOC sweep"
"docs(handbook): wave 11c — dead-link sweep"
"docs(handbook): wave 11d — doc-coverage critique in _status.md"
"docs(handbook): wave 11e — repo README handbook pointer"

After Wave 11 closes:
1. _status.md final state — all 21 page rows ticked ✅
2. _status.md final wave log entry — "Handbook v1 complete"
3. Reply with a final report: total word count, total page count,
   total citations, the three things Said should personally read
   first.

The handbook is then PVL's permanent documentation surface. Future
releases update individual pages; the structure stays.
```

---

## Notes for Said

- **Send these in order.** Each wave assumes the previous wave's pages exist on disk.
- **Don't paste Wave N before Wave N-1 finishes.** Opus will reply with "Wave N-1 done. Next up: …" when ready.
- **If Opus says it lost context** (memory / restart / new session), paste the full mission brief from `docs/internal/OPUS_DOCS_TERMINAL_PROMPT.md` first, then the wave prompt.
- **Don't paste two waves in one message.** Opus will try to do both at once and the quality drops.
- **Review what Opus produces before the next wave.** A page that's wrong on Wave 3 will cascade through every later wave that links to it.
- **Each wave commits to the current branch directly.** Confirm the commits land + tests pass before sending the next wave.
- **Total elapsed time across all 9 waves**: probably 4–6 hours of Opus's wall-clock + your ~30 min per wave review. Plan for a day of grinding spread over a week.

When Wave 11 closes, the handbook is shipped. Combined with the existing `docs/active/` tree (which the handbook gradually replaces over the next year), PVL has the documentation surface of a top-tier open-source scientific tool.
