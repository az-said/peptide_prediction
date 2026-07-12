# Correctness Deltas — v1 → v2 (2026-07-12)

> Log of every quantitative / logical correction made when moving from the v1 draft (2026-07-11) to the v2 draft (2026-07-12). Every entry cites the file:line in the codebase that the v2 claim is verified against. Use this file when reviewing v2 to confirm we have not introduced new drift.

## Method A — Pipeline architecture

| v1 said | v2 says | Verified against |
|---|---|---|
| "three-runner" architecture (TANGO / S4PRED / FF-Helix) | Same, but names changed to *runner families* and biochemistry is called out as a fourth family emitted alongside | `backend/services/upload_service.py:900–914` |
| Deterministic across all surfaces via "identical random-seed freezing" | Deterministic via bit-identical N=1 batched-forward invariant + pinned models + pinned versions — no random seeds involved | `backend/tests/test_s4pred_batched_equivalence.py:65–103` |

## Method B — Sequence pre-processing

| v1 said | v2 says | Verified against |
|---|---|---|
| Validation function rejects any non-canonical residue | Non-canonical residues are **substituted** (X→A, Z→E, B→D, U→C, O→K, J→L) and the original sequence + substitutions are surfaced in the response | `backend/auxiliary.py:488–541` |
| Length window 10 ≤ *L* ≤ 40 enforced at the validation function | Length window is *scientific-advice-driven*; only S4PRED has a hard 40-aa skip, TANGO runs on all lengths; hard route-level rejection is queued | `backend/config.py:216`; `backend/s4pred.py:513–531`; ADR-022 open engineering item |
| SHA-256 sequence hash computed on entry as primary cache key | Same, but truncated to first 32 hex chars; hash is uppercase-normalised | `backend/services/provider_cache.py:170–172` |

## Method C — TANGO

| v1 said | v2 says | Verified against |
|---|---|---|
| TANGO invoked in "stretch" mode with `avg_limit = 0` disabled | TANGO invoked at fixed physicochemical conditions: pH 7, T 298 K, ionic strength 0.1 M, TFE 0, no N-terminal cap, no C-terminal cap. No `stretch` / `avg_limit` flags exist in code. | `backend/tango.py:287` |
| Hotspot threshold constant is `TANGO_AGG_HOTSPOT_DEFAULT` | Actual name is `DEFAULT_AGG_THRESHOLD = 5.0`; value 5.0 % is correct | `backend/config.py:375` |
| TANGO "score is a percentage" (v1 didn't say this, but v1 didn't explicitly say it isn't) | Explicitly: "the TANGO aggregation score is not a percentage" | Peleg 2026-05-08 |
| Thread-safe subprocess wrapper | Same, with additional notes on max parallel workers (min(cpu, 4)), Apple Silicon quarantine strip, and timeout scaling | `backend/tango.py:255, 264, 474–478, 489` |

## Method D — S4PRED

| v1 said | v2 says | Verified against |
|---|---|---|
| S4PRED = five-model BiLSTM | S4PRED = five-model bidirectional-GRU ensemble | `backend/tools/s4pred/network.py` |
| Ensemble weights 0.2 each (implicit "mean") | Explicit: exponentiate the mean log-probability, per-position renormalise, argmax for label | `backend/tools/s4pred/model.py:258–273` |
| Thread pinning: `OMP=MKL=OPENBLAS=1` | Also set: `VECLIB_MAXIMUM_THREADS`, `NUMEXPR_NUM_THREADS`, `torch.set_num_threads(1)`, `torch.set_num_interop_threads(1)` — all five variables + PyTorch API calls | `backend/_perf_init.py:28–37`; `backend/tools/s4pred/model.py:30–35` |
| Length gate at `S4PRED_MAX_LENGTH = 40` | Same value, but the enforcement is **skip S4PRED, keep the row**, not reject the request | `backend/s4pred.py:513–531`; `backend/config.py:216` |
| Helix-segment derivation not explained | Explicit algorithm: segment starts where P_H > 0; extends across gaps ≤ 3; retained when length ≥ 5 AND (mean OR median ≥ 0.5); sub-window search on partial pass | `backend/s4pred.py:131–198`; `backend/config.py:198, 201, 204` |
| N = 1 fast path bit-identical to batched | Explicit test-locked invariant at 1×10⁻⁵ tolerance | `backend/tests/test_s4pred_batched_equivalence.py:65–103` |

## Method E — FF-Helix

| v1 said | v2 says | Verified against |
|---|---|---|
| Runs within each contiguous S4PRED helix segment | Runs across the **entire sequence**, independently of TANGO/S4PRED | `backend/services/dataframe_utils.py:30–33` (called before predictors) |
| Two-criterion window: (i) fibril-favoring alphabet + (ii) amphipathicity check on 7-residue wheel | **Single-criterion** window: mean Chou-Fasman-like helix propensity ≥ 1.0 across a 6-residue window | `backend/auxiliary.py:60–109` |
| Propensity table not named | Named `_HELIX_PROP` with full 20-residue table quoted from `backend/auxiliary.py:21–42` | `backend/auxiliary.py:21–42` |
| Threshold `thr` not given | `thr = 1.0` (`FF_HELIX_THRESHOLD`), window size `core_len = 6` (`FF_HELIX_CORE_LEN`) | `backend/config.py:159, 162` |
| Only reports `ff_helix_percent` and cores | Cores are returned as 1-indexed closed intervals | `backend/auxiliary.py:163` |
| FF-Helix classification not stated | **FF-Helix positive** = at least one S4PRED helix segment AND mean helix-segment μH ≥ μH cut-off (default 0.5) | `backend/auxiliary.py:364–431`; `backend/config.py:362` |

## Method F — SSW axiom (⚠ largest v1 error)

| v1 said | v2 says | Verified against |
|---|---|---|
| **SSW = TANGO ∧ S4PRED (AND)** | **SSW = TANGO ∨ S4PRED (OR)** — Peleg canonical, backed by ISSUE-032 fix | `backend/auxiliary.py:338–361`; docstring lines 342–345 |
| `SSW_percent` = per-sequence fraction of residues covered by FF-Helix ∩ TANGO | `SSW_percent` = cohort-level percent of rows in the dataset that are SSW-positive under the unified TANGO∪S4PRED mask. Per-sequence residue overlap is a separate column `s4predSswPercent` derived from S4PRED SSW segments (helix ∩ β) | `backend/services/dataframe_utils.py:505–519`; `backend/schemas/api_models.py:206` |
| FF-SSW gate is μH | **FF-SSW gate is hydrophobicity** (H̄), not μH — validated with Peleg 2026-06-03 | `backend/auxiliary.py:375–382` |
| ISSUE-032 test file is `test_axiom_invariants.py` | Same, plus specific location: 4 scenarios + enforce-boundary + per-predictor-verdict preservation | `backend/tests/test_axiom_invariants.py:67–226` |

## Method F′ / Method H — Smart Ranking

| v1 said | v2 says | Verified against |
|---|---|---|
| Formula `R = w₁·μH̃ + w₂·FF̃ + w₃·T̃ + w₄·S̃`, min-max normalised, 4-term | Not that formula. **Percentile-rank weighted average** across 3 default metrics: `s4predHelixPercent`, `μH`, `hydrophobicity` | `backend/services/peptide_rank.py:44, 123–134, 307–316` |
| Default weights (0.35, 0.25, 0.20, 0.20) | Preset weights: Equal (34/33/33), Fibril-formation Focus (20/40/40), Helix Focus (50/30/20), Switch Focus (40/30/30). Frontend default "Fibril" preset: 5-metric flag-based (30/30/20/10/10) | `backend/services/peptide_rank.py:58–79`; `ui/src/lib/ranking.ts:197–241`; `ui/src/stores/datasetStore.ts:41–51` |
| Tie-break by ascending absolute net charge | **Tie-break by ascending peptide id** | `backend/services/peptide_rank.py:331` |
| Reason strings not mentioned | Explicit: up to three domain-grounded reason strings per row, weighted by `weight · |percentile - 50|` | `backend/services/peptide_rank.py:159–226` |

## Method G — Biochemistry

| v1 said | v2 says | Verified against |
|---|---|---|
| pI computed via iterative bisection | **No pI implementation exists.** Deleted entirely | `grep -rn "isoelectric\|pI\|bisection" backend/` — no matches |
| μH formula defined | Same, with explicit β-strand μH via δ = 160° (`Beta full length uH`) | `backend/services/dataframe_utils.py:436–452` |
| Charge treatment | Explicit: signed, K/R = +1, D/E = −1, H = +0.1; downstream *documented not to `abs()`*, per PELEG-Q-FIX-022 warning in `biochem_calculation.py:94–97` | `backend/biochem_calculation.py:35–37, 80–100` |
| Threshold citation implicit | Explicit split: μH *formula* = Eisenberg 1982; μH *threshold* = Ragonis-Bachar and Rayan (Drive C27) | `backend/config.py:362, 365, 368`; Peleg 2026-05-22 |

## Method I — Provider cache + precompute

| v1 said | v2 says | Verified against |
|---|---|---|
| Schema hinted | Full DDL quoted verbatim | `backend/services/provider_cache.py:107–119` |
| `seq_hash` uses SHA-256 | Same, truncated to first 32 hex chars, uppercase-normalised | `backend/services/provider_cache.py:170–172` |
| Precomputed artefact ~18.7 MB | Size claim removed — `gold_standard.json` and `peleg_118.json` are not on disk in this tree; built by `make precompute-datasets` at deploy time | `Makefile:145–151`; `backend/scripts/precompute_dataset.py:47–67` |
| `bypass_tango_budget` skips the 500-peptide gate | Confirmed, explicitly named | `backend/services/upload_service.py:863, 922–930` |

## Method J — UniProt

| v1 said | v2 says | Verified against |
|---|---|---|
| UniProt calls cached (LRU, 24 h TTL) | **No LRU cache exists** — claim removed | `grep -rn "LRU\|TTL\|lru_cache" backend/services/uniprot*.py` — no matches |
| Rate limited at "fair-use policy" (vague) | Explicit: 200 ms between pages; `Retry-After` honoured on HTTP 429; per-page 60 s timeout; stream 300 s | `backend/services/uniprot_execute_service.py:243–303` |
| Query fields listed | Same, plus explicit reviewed filter, sort allow-list, TSV columns | `backend/services/uniprot_parser.py:297, 302–344`; `backend/services/uniprot_execute_service.py:99–106` |
| Endpoint URL | `https://rest.uniprot.org/uniprotkb/{search,stream}` — explicit | `backend/services/uniprot_parser.py:297`; `backend/services/uniprot_execute_service.py:159–184` |

## Method K — Execution surfaces

| v1 said | v2 says | Verified against |
|---|---|---|
| React 18.3.1 (etc.) | Same, verified | `ui/package.json:60, 62, 68, 75, 95, 96, 98` |
| Backend deps (FastAPI 0.136+, etc.) | Same, verified | `backend/requirements.txt:2–52` |
| MCP: seven live tools | Same, tools listed | `mcp_server/pvl_mcp/tools.py:9–19` |
| Docker: 4-service compose | **Five-service** (backend + redis + celery-batch + celery-quick + frontend) | `docker/docker-compose.prod.yml:30–137` |
| Rate limit 30 req/min/IP | Confirmed on `POST /api/predict/batch` | `backend/api/routes/predict.py:65` |

## Method L — CI + reproducibility

| v1 said | v2 says | Verified against |
|---|---|---|
| 197 backend pytest + 628 frontend vitest | ≈ 608 backend pytest across 44 files + ≈ 613 frontend vitest across 55 files | `grep -c "def test_" backend/tests/*.py`; `grep -rcE "^\s*it\(\|^\s*test\(" ui/src` |
| Pre-**push** hook runs ruff | **Pre-commit** hook (not pre-push) runs ruff | `.pre-commit-config.yaml:8–16` |
| Zenodo DOI minted on tag push in CI | **No Zenodo workflow exists.** Automated by CI = false. Manual step keyed by CITATION.cff. | `ls .github/workflows/` (7 files, no Zenodo) |
| Contract-check step verifies backend↔UI schema alignment | Same, but *make target*, not currently a CI job | `Makefile:133–139`; `backend/scripts/check_contract_sync.py` |
| Test-locked axiom invariants | Same, name `test_axiom_invariants.py`, 9 tests, ISSUE-032 lineage explicit | `backend/tests/test_axiom_invariants.py` |

## Method M — Reference databases (new in v2)

New section added. Verified numbers:

- *Staphylococcus aureus* 2023: `openpyxl.load_workbook` returns `ws.max_row = 2917`, `ws.max_column = 36` → 2 916 peptides + header (matches previous confirmation)
- Labelled subset: `TEM Fibrils` = V (47) / X (19) / blank (2 850) → 66 labelled peptides
- Negative-class composition: 15 × PSM-α2 + 2 × Delta-hemolysin + 1 × PSM-mec + 1 × PSM (documented at `docs/handbook/research/02_validation_evidence.md:147–156`)
- Validation numbers: FF-Helix sens 1.000 / spec 0.000 / PPV 0.712 / F1 0.832 (RB-VALIDATION-V0-1 §3.1)
- Peleg-118: 118 rows, 40-limit, sensitivity 0.339 (40/118), wall-clock 44.7 s on HEAD `f74ca75` (2026-06-29)

---

## Global — additional corrections

- **PVL version**: v2 does not brand as "PVL v0.1.0" anywhere. Current release version is v0.3.0 per `CITATION.cff:5` and `ui/package.json:4`. CLI (`pvl-cli`) is versioned separately at 0.1.0.
- **DESY VM**: v1 read as if the DESY deployment is live. v2 says "in preparation" — matches reality (blocked on DESY IT).
- **Framing lexicon**: v1 used "aggregation prediction", "false-positive", "cohort" freely. v2 replaces per `08_terminology_and_style_guide.md`.
- **Author-list format**: v1 didn't stipulate. v2 defers ordering to Peleg + Meytal; Said = 2nd or 3rd (Said's answer 2026-07-12).

## What's still stale (deliberately)

- `[CITE: dataset publication — Peleg to supply DOI]` in Method M. Requires Peleg to hand-deliver the Ragonis-Bachar & Rayan DOI + the *S. aureus* 2023 dataset publication reference (still-open OQ6).
- Tool name in body text is `PePFibPred` per Peleg's default. Final name is Peleg + Meytal's call (see `05_tool_name_and_graphical_abstract.md`).
- Zenodo DOI in Data Availability is `PENDING` — mint after first tag.
- Alex's ORCID in `CITATION.cff` is `PENDING`.
