# Paper drafts — PePFibPred / FibrilPredictor (NAR Web Server 2026)

**Target**: Nucleic Acids Research, Web Server Issue
**Submission window**: 2026-11-10 → 2026-12-10 (≈ 17 weeks from today, 2026-07-12)
**Proposal center**: <https://nar.bihealth.de/>
**Working copy** (Said edits here): <https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit>
**Original** (do NOT edit until approved): <https://docs.google.com/document/d/1fDSC3k-9xrWiThHbnB8xMG0wS5yINZjRL-_oBg54ZFY/edit>
**Supporting Information shell**: <https://docs.google.com/document/d/13vbt7v-T1dI3zr1Olqp08yRIUU0scBSzjA9ejZF_q3g/edit>

## Workflow
1. Claude drafts each section here in Markdown (paste-ready)
2. Said pastes each block into the WORKING COPY
3. Said fixes heading levels + Greek + bold/italic in the Doc
4. Said reviews with Peleg / Alex; adjusts
5. Approved → Said pastes into the ORIGINAL doc

## Files (v2 draft, 2026-07-12)

| File | What it is | Owner |
|---|---|---|
| `README.md` | This index | — |
| **`01_materials_and_methods.md`** | **v2 M&M** — Methods A–M, ~2 800 words, verified against code + Peleg's style | Us |
| `02_server_usage.md` | Server-usage subsections (Access + Availability + Job Submission Options) | Us |
| `03_author_contributions.md` | Said + Alex CRediT lines + long-form detail (Said = 2nd or 3rd author, 2026-07-12) | Us |
| `04_data_availability.md` | NAR-compliant Zenodo/GitHub/PyPI/GHCR paragraph | Us |
| `05_tool_name_and_graphical_abstract.md` | Comment format — 10 name candidates + 3 graphical-abstract concepts. **Keep `PePFibPred` in body**; paste as comments on Peleg's threads | Us + Peleg + Meytal |
| `06_discussion_bullets.md` | 8 engineering / product bullets to add to Peleg's discussion list (do not merge with hers) | Us |
| `07_alex_admin_checklist.md` | 12-step ordered runbook for Alex admin transfer + ownership-matrix template | Said |
| **`08_terminology_and_style_guide.md`** | Landau-lab canonical lexicon + Peleg writing-style rules | — |
| **`09_correctness_deltas.md`** | Every fact corrected v1 → v2, with file:line evidence | — |
| **`10_final_step_by_step.md`** | Said's ordered checklist Phases 0 → 12 (updated 2026-07-12 evening) | Said |
| **`11_future_plans_paper_content.md`** | **NEW** — 5-paragraph "Ongoing development and roadmap" content for DISCUSSION, ~1 800 words | Us → Peleg |
| **`12_master_handover_playbook.md`** | **NEW** — big-co 10-area handover playbook: Owner/Primary split, SLOs, runbooks, RFC/ADR, API stability, CODEOWNERS, monthly report. Said stays Owner forever | Said |
| **`13_sentry_migration_runbook.md`** | **NEW** — 7-step explicit runbook to redirect alerts to Alex while keeping Said as Owner (silence Said's personal email; SEV1 auto-escalation) | Said |

## What we own (from Peleg's doc comments)

| Section | Peleg's tag | Our file |
|---|---|---|
| MATERIAL AND METHODS | "Saaid/Alex" | `01_materials_and_methods.md` |
| Server usage | "Saaid" | `02_server_usage.md` |
| AUTHOR CONTRIBUTIONS | "Saaid, Alex" | `03_author_contributions.md` |
| DATA AVAILABILITY | "Saaid/Alex" | `04_data_availability.md` |
| Title / naming | "Find a name" | `05_tool_name_and_graphical_abstract.md` (paste as comment) |
| Graphical abstract | "Ideas for graphical abstract?" | `05_tool_name_and_graphical_abstract.md` |
| DISCUSSION | "To all: please add in bullet points" | `06_discussion_bullets.md` + `11_future_plans_paper_content.md` |

## What Peleg owns — do NOT touch

- ABSTRACT
- INTRODUCTION (already drafted; leave alone unless she asks)
- RESULTS opening + Computational scheme + Server Output + Interpretation of Results + Case Study 1 + Case Study 2
- References (Paperpile library `0zqjXo` — she manages)

## What Meytal owns

- ACKNOWLEDGEMENTS (DESY people)
- FUNDING (grant list)

## Style conventions (from `08_terminology_and_style_guide.md`)

- **Citations**: sequential numeric `[1]` in text; listed numerically in References. Peleg uses Paperpile. Placeholders here read `[CITE: description]`.
- **Greek inline**: always α, β, μH, δ, φ — never `alpha`, `beta`, `uH`, `mu_H`.
- **Heading conventions** (Peleg's saved template):
  - `Heading 2` = bold, non-italic (`**Method A**`)
  - `Heading 3` = italic, non-bold (`*Sub-method*`)
- **Equations**: inline text-encoded, numbered `(1)`, `(2)`. No images.
- **Tone**: dense scientific prose. "*To this end, this work developed…*" is the pivot phrase.

## Handover model (from `12_master_handover_playbook.md`)

- **Owner (Said)** — full access forever, veto on scientific + architectural ADRs, monthly digest, never paged
- **Primary Responder (Alex)** — day-to-day operator, first responder, receives all Sentry alerts
- **Scientific Authority (Peleg)** — owns axiom decisions; not on GitHub review path
- **Escalation timer**: SEV1 unresolved 30 min (business hours) or 2 h (off-hours) → auto-escalate to Said
- **State-of-union**: 8 of 10 big-co dimensions already at bar; the 2 gaps are the Owner/Primary split (§1) and the founder-oversight loop (§10). Playbook closes both in ~14 h.

## Alex-specific onboarding suite (2026-07-12)

For Alex, who has never used GitHub or a research-web-tool operator role before, a four-file suite lives at:

| File | Purpose |
|---|---|
| [`docs/active/ALEX_ONBOARDING.md`](../ALEX_ONBOARDING.md) | **The master week-by-week guide.** Alex's single entry point. |
| [`docs/active/GITHUB_101_FOR_ALEX.md`](../GITHUB_101_FOR_ALEX.md) | GitHub primer for a first-time user (15 min read) |
| [`docs/active/OPERATOR_COOKBOOK.md`](../OPERATOR_COOKBOOK.md) | "How to do X" recipe book (Sentry response, redeploy, monthly report, release cutting, etc.) |
| [`docs/active/DOCS_MAP_FOR_ALEX.md`](../DOCS_MAP_FOR_ALEX.md) | Where every doc lives + guided reading by role |

Also: `docs/active/HANDOFF.md`, `docs/active/OWNERSHIP_MATRIX.md`, and the root `README.md` each now carry a callout pointing Alex to `ALEX_ONBOARDING.md` as his starting point.

## Playbook artefacts materialized (2026-07-12)

The 15 files prescribed by `12_master_handover_playbook.md` are now on disk. Live locations:

| Playbook § | File on disk |
|---|---|
| §1 (Ownership + on-call) | `docs/active/OWNERSHIP_MATRIX.md`, `docs/active/ONCALL.md` |
| §2 (SLO + error budget) | `docs/active/SLO.md` |
| §3 (Incident response + postmortems + runbooks) | `docs/active/INCIDENT_SEVERITY.md`, `docs/active/postmortems/TEMPLATE.md`, `docs/active/RUNBOOKS/` (5 example runbooks) |
| §4 (RFC + ADR) | `docs/active/RFC_TEMPLATE.md` + footer added to `docs/active/DECISIONS.md` |
| §5 (Release + versioning + deprecation) | `docs/active/API_STABILITY.md` |
| §6 (Dependency + security posture) | `SECURITY.md` (repo root) |
| §7 (Data + reproducibility governance) | `docs/active/DATA_GOVERNANCE.md` |
| §9 (Contributor experience) | `.github/CODEOWNERS`, updated `CONTRIBUTING.md` |
| §10 (Founder-oversight loop) | `docs/active/MONTHLY_REPORT_TEMPLATE.md`, `docs/active/reports/` |
| — Updated | `docs/active/HANDOFF.md` (adds §1a Ownership model), `docs/active/SENTRY_RUNBOOK.md` (adds Roles) |

The 15 files together commit to what Said described as "everything that has to do with the team or Peleg — written in the docs".

## Ready-to-paste order (from `10_final_step_by_step.md`)

Phases 0 → 12. Concise summary:
1. **Phase 0** — Read `09` + `08` + skim `01` (~90 min)
2. **Phase 1** — Paste M&M → Server Usage → Author Contributions → Data Availability → Naming comment → GA comment → Discussion bullets → **Future Work paragraph (`11_...`)** (~2.5 h)
3. **Phase 2** — Alex admin (email him for GitHub handle + PyPI username + SSH key + ORCID) + Sentry migration via `13_sentry_migration_runbook.md` (~60 min actions + 1 day wait)
4. **Phase 3** — Ask Peleg 4 blockers: RB & Rayan DOI, S. aureus 2023 dataset DOI, TANGO-stretch function name, SSW+FF-SSW Help text
5. **Phase 4** — Ship v1.0.0 tag → Zenodo → update Data Availability
6. **Phases 5-10** — Meytal Acknowledgements + Funding, case-study data prep, Discussion merge, SI writeup, nightly hygiene, submission night
7. **Phase 11** — Paper's Future Work section (from `11_future_plans_paper_content.md`)
8. **Phase 12** — Adopt handover playbook (from `12_master_handover_playbook.md`) — 15 steps, ~14 h total. **Step 5 (API stability) must land before v1.0.0 tag.**
