# Building PePFibPred: an 11-month sprint on a peptide fibril-prediction web server

> Blog post outline — 1,500 words when expanded. Written by Said Azaizah, first person.

---

## 1. Hook (150 words)

**Key point:** No tool combines aggregation + structure + fibril classification in one interactive dashboard. Researchers juggle 5 tools and merge CSVs.

Sub-bullets:
- Peptide aggregation kills drug candidates and causes neurodegenerative diseases — but the tools to predict it are fragmented
- TANGO does aggregation. AGGRESCAN does hotspots. S4PRED does structure. PyMOL does visualization. Nobody does all four + fibril classification in one URL
- The Landau lab at Technion/DESY had the science framework (Ragonis-Bachar et al. 2022) but no software platform
- I was a CS student at Technion with full-stack experience and no biology background. 11 months later we had a production web server heading to Nucleic Acids Research

**Pull quote:** "The tools exist. The integration doesn't. That's the gap we filled."

---

## 2. The stack decision (200 words)

**Key point:** React + FastAPI + Docker on Hetzner. Not K8s. Not serverless. Why.

Sub-bullets:
- The users are 3 biologists, not 3 million consumers. The deployment story has to be "one box, one command"
- FastAPI because Python was non-negotiable (TANGO is Fortran called from Python, S4PRED is PyTorch)
- React + TypeScript because the visualization layer needs component composition (Recharts, Mol*, SVG charts)
- Docker Compose because the stack has 4 moving parts (backend, Redis, 2 Celery workers) and K8s would add ops burden nobody would maintain after me
- Hetzner CX33 (4 vCPU, 8 GB) — costs €12/month and handles the entire lab's workload

**Pull quote:** "If no one on the team will operate Kubernetes after you leave, you shouldn't deploy Kubernetes."

---

## 3. The four scientific engines (300 words)

**Key point:** TANGO, S4PRED, FF-Helix, SSW — and why the axiom is OR-union, not AND-intersection.

Sub-bullets:
- TANGO: Fortran binary, calls it as a subprocess. pH 7.4, 298K, 0.1M ionic strength. Not a prediction of fibrils — a prediction of aggregation propensity
- S4PRED: 5-model BiLSTM ensemble. Primary helix predictor. PSIPRED was used in prototypes, removed (ADR-001)
- FF-Helix: custom Chou-Fasman-like propensity classifier + hydrophobic moment gating. "Is this peptide both helical AND amphipathic?"
- SSW: the structural switch — residues where TANGO β and S4PRED helix both fire. The axiom: SSW = TANGO_SSW ∨ S4PRED_SSW (inclusive OR). Union, not conjunction. Why: the two predictors search for compatible-but-distinguishable signatures. Requiring both would suppress the very sequences the class is meant to discover
- The 4-class system: Helix, FF-Helix ⊆ Helix, SSW, FF-SSW ⊆ SSW. Regression-locked by 9 invariant tests

**Pull quote:** "The OR-union axiom was the single most non-obvious design decision. We debated it for weeks."

---

## 4. Wave-by-wave shipping (350 words)

**Key point:** 11 months, 7 waves, 50+ commits on the final branch alone.

Sub-bullets (from pvl_milestones.md):
- Sep-Nov 2025: first prototype, TANGO integration, basic React shell
- Dec 2025-Jan 2026: S4PRED integration, FF-Helix classifier, first batch mode
- Feb-Mar 2026: Peleg's first review round, 118 corrections, threshold tuner
- Apr 2026: Mol* 3D viewer, AlphaFold overlay, figure pack export
- May 2026: Wave 2 — Peleg's second review, SSW axiom fix (ISSUE-032), performance work (420ms cold)
- Jun 2026: Wave 2.8/2.9 — Peleg PDF follow-ups, 35+ features, UniProt batch, HTML report
- Jul-Aug 2026: Paper drafts, handoff, v0.3.0 tag

**Hero image concept:** Timeline graphic showing the 7 waves with key milestones

---

## 5. Three hardest calls (250 words)

**Architecture:** "Should the threshold logic run server-side or client-side?" Client-side won — researchers change thresholds constantly, and re-running TANGO for each change would make the tool unusable. The provider cache stores raw predictor outputs; the classification layer is presentation-only.

**Science:** "Is SSW an AND or an OR?" Peleg's answer: OR-union. The implication: every peptide that fires on TANGO β-aggregation OR S4PRED structural switch gets flagged. Higher recall, lower precision, but that's the point — the class is exploratory, not diagnostic.

**Team:** "How do you build a tool you won't operate?" From Day 1 I wrote as if I'd be hit by a bus in August. 90-page operator handbook, ownership matrix, monthly-report cadence, Dependabot triage SLA. The handoff playbook took 3 weeks to write and was worth every hour.

**Pull quote:** "I wrote the operator handbook before I wrote the last feature. That's the order that matters."

---

## 6. The handoff (200 words)

**Key point:** Founder-to-maintainer transition was designed, not improvised.

Sub-bullets:
- FOR_NEXT_BUILDER.md: the cold-landing one-pager ("you just cloned this repo, now what?")
- HANDOFF_TECH_PLAYBOOK.md: 90 pages, 12 chapters, includes a Claude Code agent contract
- OWNERSHIP_MATRIX.md: who owns what, who pages whom, monthly review cadence
- OPERATOR_COOKBOOK.md: 21 runbooks for day-to-day operations
- The Owner-without-a-pager pattern: Said keeps GitHub org ownership, Alex gets repo Admin + Sentry Owner + production SSH. Said stops receiving alerts. Alex runs day-to-day. Said reviews monthly.

---

## 7. What's next + credits (50 words)

Zenodo DOI mints on v1.0.0. Paper submitted to NAR Web Server Issue. bio.tools registration queued. Thanks to Peleg Ragonis-Bachar, Meytal Landau, Aleksandr Golubev, and the DESY-CSSB team.

---

## Hero Image Concepts

1. **Split-screen:** Left = the 5-tool chaos (TANGO CLI output, S4PRED terminal, PyMOL window, Excel spreadsheet, UniProt browser tab). Right = PePFibPred dashboard showing all of it in one view.

2. **Architecture diagram:** The mermaid diagram from HANDOFF_TECH_PLAYBOOK.md Ch. 2, rendered as a clean PNG with the three prediction engines feeding into the 4-class Venn.
