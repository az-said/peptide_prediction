# Handbook build status

> Living status board for the `docs/handbook/` build. **Handbook v1 is complete** — all 21 content pages + README written, cross-linked, TOC'd, and link-checked. Future releases update individual pages; the structure stays.

**PVL version covered:** v0.3.0 (main HEAD as of the branch this work sits on, `wave-2.8/peleg-pdf-followups`).
**Last updated:** Handbook v1 complete (2026-06-29).

---

## Page status — all ✅

Legend: ✅ written

### `humans/`
| Page | Status | Notes |
|------|--------|-------|
| 00_what_is_pvl.md | ✅ | 5-minute orientation, no jargon. |
| 01_first_run.md | ✅ | 12-min clone → UI walkthrough + smoke test + troubleshooting. |
| 02_the_science.md | ✅ | 12 sections, 11 primary citations, every claim anchored to a publication or code file:line. JOSS-critical; main-loop reviewed. |
| 03_the_pipeline.md | ✅ | 11-stage HTTP→Pydantic walkthrough; deterministic guarantee + precompute + null semantics. |
| 04_the_ui_walkthrough.md | ✅ | All 10 pages; honest on the Phase-1 Mol* stub + real colour tokens. |
| 05_use_cases.md | ✅ | Five real-route research narratives + paper call-outs + what-we-don't-support. |
| 06_deploying.md | ✅ | VPS / DESY-VM / K8s; every command quoted verbatim from a real repo file. |
| 07_extending.md | ✅ | Three walkthroughs (predictor, cohort, export) each with invariants-you-must-not-break. |
| 08_troubleshooting.md | ✅ | Nine grounded symptom→cause→fix entries + see-also into agents/06. |
| 09_glossary.md | ✅ | 86 alphabetical entries, cross-linked, harvested from every page. |
| 10_credits_and_license.md | ✅ | Authors (CITATION.cff), MIT, dual-citation BibTeX, funding, acknowledgements. |

### `agents/`
| Page | Status | Notes |
|------|--------|-------|
| 00_read_me_first.md | ✅ | Ground rules + commit-identity rule + before-you-touch matrix. |
| 01_repo_map.md | ✅ | Every dir + ~140 key files with 🔥/🛡️/🧊 heat markers. |
| 02_contracts_and_invariants.md | ✅ | Seven invariants; every enforcing test/hook verified to exist. |
| 03_doing_a_safe_change.md | ✅ | Paste-able 12-step TDD-to-CI playbook with real Makefile targets. |
| 04_when_to_ask_humans.md | ✅ | Escalation tree: 10 triggers → Said/Peleg/Alex. |
| 05_existing_tooling.md | ✅ | 10 skills, 6 hooks, 20 scripts, MCP (4/7 live), pvl-cli stub; stale ones flagged. |
| 06_failure_modes.md | ✅ | CI/hook/CodeRabbit/CodeQL red-light runbook; never-suppress rule. |
| 07_artifacts_index.md | ✅ | Every binary/weight/JSON/cache/dataset with regen rule; paths verified. |

### `research/`
| Page | Status | Notes |
|------|--------|-------|
| 01_landscape.md | ✅ | 14+ tools, feature matrix, CORDAX as closest peer; rb2022 citation Crossref-corrected. |
| 02_validation_evidence.md | ✅ | Committed Staph-2023 sens/spec (caveated); Peleg-118 recall marked pending the exact run. |
| 03_open_questions.md | ✅ | OQ1–OQ8 ledger (5 resolved per ADR-021, 3 deferred), F10, Q-FIX-022, Tier-3 avenues. |
| 04_publication_path.md | ✅ | Researcher-framed Zenodo→bio.tools→JOSS with EDAM IDs. |

**README.md** ✅ — persona-aware index with three reading orders.

---

## Wave log

- **Wave 11 — done (2026-06-29):** README persona-rewrite (11a); TOC sweep — 22 pages (11b); cross-link sweep — 52 new internal links (8c); dead-link verification (11c); doc-coverage critique (11d, below); repo-root README already links the handbook in its header nav (11e). Plus: Crossref-verified + corrected the Ragonis-Bachar 2022 citation and fixed one relative-link depth.
- **Waves 3–10 — done (2026-06-29):** 16 pages drafted by focused subagents (one file each), each committed individually with verified identity. The science page (humans/02) was main-loop reviewed before commit.
- **Wave 2 — done:** humans/01, humans/03, agents/01.
- **Wave 1 — done:** README, _status, humans/00, agents/00, research/01; competitive citations verified.

---

## Code-vs-paper discrepancies surfaced during the build (FLAG FOR PELEG)

Found while writing humans/02 against the **code as authoritative**; `PAPER_METHODS_REFERENCE.md` needs reconciling before submission:

1. **FF-Helix gate.** Paper §1.3 says "mean hydrophobicity ≥ 0.7"; code (`backend/auxiliary.py:398-409`) gates on **hydrophobic moment (μH)**, default 0.388 single (`config.py:185`) / dataset-mean batch / 0.5 custom (`config.py:360`). Quantity AND value differ.
2. **TANGO pH.** Paper §1.1 says 7.4; binary call (`tango.py:287`) uses `ph="7"`. (Charge calc does use 7.4.)
3. **β μH angle.** Docstring says 180°; code passes **160°** (`dataframe_utils.py:448`).
4. **μH sliding window.** Paper §1.6 implies an 11-residue window; code uses none.
5. **Ragonis-Bachar 2022 citation — RESOLVED via Crossref (June 2026).** Authoritative record: "Natural Antimicrobial Peptides Self-assemble as α/β **Chameleon** Amyloids," *Biomacromolecules* **23**(9):3713–3727 (2022), doi:10.1021/acs.biomac.2c00582. The handbook now uses this everywhere. **The repo README, CITATION.cff acknowledgement, and `PAPER_METHODS_REFERENCE.md` still carry the wrong "α-Sheet Conformations / 24:413–425" title/volume — fix those outside the handbook.**

Also resolved: **S4PRED citation** = Moffat & Jones 2021, *Bioinformatics* 37(21):3744–3751 (`btab491`); the repo README's "Moffat et al. 2022" string should be corrected. **Four-class residue colours** (verified vs `ui/src/index.css` + `sswColor.ts`): Helix=blue, FF-Helix=green, **FF-SSW=dark green (NOT red)**, SSW badge=blue, **SSW per-residue highlight=magenta #E040FB**.

---

## Open coverage gaps (Wave 11d critique — for the maintainer, not auto-fixed)

**Code areas no handbook page covers** (candidates for future pages, not v1 blockers):
- `services/vector_store.py` (LanceDB/ESM-2 `POST /api/peptides/similar`); `services/peptide_rank.py` + `peptide_compare.py` (the ranking/compare backends behind humans/05); `services/feedback_service.py` + `routes/feedback.py`; `services/sequence_windowing.py` (touches the μH-window discrepancy); `services/result_cache.py`, `provider_status_builder.py`, `provider_tracking.py`, `perf_logger.py` (an "internals/observability" page would cover these together).
- Frontend: `stores/hoverStore.ts`, `stores/reproducibilityStore.ts`, `lib/jobApi.ts`, `lib/aggregationFlags.ts`, `lib/spearman.ts` — named nowhere.
- **Celery worker internals** (`tasks.py` + `celery_app.py` task graph) and **`consensus.py` / `lib/consensus.ts`** (ADR-014 disagreement, a headline differentiator) have no dedicated explainer.

**Decisions that should have an ADR but don't** (max is ADR-021):
1. The 40-aa S4PRED/route length cap. 2. The dataset-mean threshold strategy + Peleg single-sequence fallbacks. 3. The precompute-JSON / `precompute-serve` artifact approach (`routes/precomputed.py`). 4. The 4-thread cap + PyTorch thread pinning. 5. The TANGO 5.0% aggregation-hotspot default (PELEG-Q-FIX-012). 6. Celery-wired-but-sync-in-prod / disabled-on-VM.

**Length:** humans/02 (3,556 w) and research/01 (3,283 w) exceed 3,000 — coherent as-is but split candidates if they grow. humans/01 (609 w) and agents/04 (574 w) are thin-but-appropriate (the former deserves more once real screenshots land).

**Intra-handbook contradictions:** only one was found (the rb2022 title in research/01) — **now fixed**. All other tracked discrepancies are handbook-vs-external-doc (paper/README/CITATION.cff), listed above.

---

## Remaining (post-v1, for Said/Peleg — none block the handbook)

1. Reconcile the 5 code-vs-paper discrepancies in `PAPER_METHODS_REFERENCE.md` + fix the rb2022 and S4PRED citations in the repo README + CITATION.cff.
2. Fill Peleg-118 recall in research/02 by adding the cohort loader to `backend/scripts/rerun_validation_2026_06_07.py` and running it.
3. Add real screenshots (humans/04, humans/01) once retaken in a clean profile (PELEG_NOTES H9).
4. Consider the future pages + ADRs listed under coverage gaps.
