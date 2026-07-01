# PVL — Development Milestones (factual record)

Every claim on this page carries either a file path or a commit SHA / date as evidence. Nothing is invented; where a fact isn't verifiable from the repo, it's omitted.

## 1. Timeline

- **First commit**: 2025-09-18 (`git log --reverse --pretty=format:'%ad'`).
- **Latest commit** (as of this doc): 2026-07-01.
- **Total commits on main**: 455.
- **Month-by-month activity** (`git log --pretty=format:'%ad' --date=format:'%Y-%m' | sort | uniq -c`):

| Month | Commits |
|---|---:|
| 2025-09 | 10 |
| 2025-10 | 2 |
| 2025-12 | 1 |
| 2026-01 | 2 |
| 2026-02 | 54 |
| 2026-03 | 41 |
| 2026-04 | 37 |
| 2026-05 | 187 |
| 2026-06 | 197 |
| 2026-07 | 2 |

The 187 + 197 spike in May–June 2026 corresponds to the Wave 2.5 / 2.8 / 2.9 rounds of Peleg PDF follow-ups and the documentation-handbook build. DESY-internship start date is not explicitly captured in commit metadata; the `docs/active/HANDOFF.md` and `docs/handbook/humans/10_credits_and_license.md` reference Technion + DESY affiliation.

## 2. Secondary-structure tool lineage

The repo shows a two-step evolution: **PSIPRED → S4PRED**. JPred is not referenced in any file or git history (searched `git log --all -S "jpred"` and `grep -rn jpred` on the tree — no hits).

- **PSIPRED introduced**: 2025-09-26, commit `2a8b3c9` "README + Tango + PSIPRED setup ( Debug push awaiting )". Development continued through 2025-09-30 (`ade2e05` "Final animations ui ready, waiting for ff helix debug ... psipred implementation is approaching").
- **S4PRED preparation**: 2026-02-01, commit `7c20b97` "Preparing s4pred with tests & highest level envs".
- **S4PRED integration**: 2026-02-02, commit `244fb81` "feat: implement S4PRED integration aligned with reference implementation".
- **S4PRED shipped**: 2026-02-03, commit `0c3ad3d` "Heyy Team...READY TO GO: Docker infrastructure, S4PRED integration, and visualization charts (#3)".
- **PSIPRED file removed**: 2026-02-07, commit `6f7bb93` "feat: S4PRED + FF-Helix verification, doc cleanup, Caddy + Docker orchestration" — this is when `backend/psipred.py` disappeared from the tree.

Net: five days from PSIPRED-adjacent to S4PRED-adjacent code (Feb 2 → Feb 7 2026). The switch is documented as ADR-006 in `docs/active/DECISIONS.md`.

## 3. The six metrics (verified in code)

Each metric ships and lives in a specific file:

| Metric | File | Symbol |
|---|---|---|
| **Chameleon / SSW** | `backend/services/dataframe_utils.py` | `ssw_positive_percent` (line 505); the `chameleonPrediction` alias was removed 2026-02-01 per `backend/schemas/peptide.py:291` note |
| **Helix segments** | `backend/s4pred.py` | `helix_segments` at line 242 |
| **Charge** | `backend/biochem_calculation.py` | Charge contributions block starting line 84 |
| **Hydrophobicity** | `backend/biochem_calculation.py` | same file, Fauchère-Pliska scale |
| **Hydrophobic moment** | `backend/biochem_calculation.py` | `hydrophobic_moment(peptide_sequence, angle=100)` at line 52 |
| **FF-Helix** | `backend/auxiliary.py` | `ff_helix_percent` (line 60) and `ff_helix_cores` (line 112) |

## 4. Surfaces that exist

Each of the five surfaces has committed code, not just documentation.

- **Web app** — `ui/` (React 18 + Vite + TypeScript) and `backend/` (FastAPI + Python 3.11).
- **MCP server** — `mcp_server/pvl_mcp/{server.py, tools.py, prompts.py, _client.py, __init__.py, __main__.py}`. 593 lines of real implementation across the six files.
- **CLI** (`pvl-cli`) — `pvl-cli/pvl/cli.py`, 202 lines of Click-based commands. Verified working against `http://94.130.178.182:3000` in this project's smoke tests.
- **Python package** — the same `pvl` module ships as a Python-importable package; `pvl-cli/pyproject.toml` declares the `pvl.cli:main` entry point.
- **Docker dev + prod** — `docker/` contains `docker-compose.base.yml`, `docker-compose.prod.yml`, `docker-compose.caddy.yml`, `docker-compose.ghcr.yml`, `Dockerfile.backend`, `Dockerfile.frontend`, and `Caddyfile`.
- **CI pipeline** — 7 workflows in `.github/workflows/`: `ci.yml`, `codeql.yml`, `deploy.yml`, `docker-publish.yml`, `docs.yml`, `publish-pypi.yml`, `release.yml`.

## 5. Scale

Measured 2026-07-01:

- **Total LOC** (`.py` + `.ts` + `.tsx`, excluding `node_modules`, `.venv`, `__pycache__`): **85,365** across **403 files**.
- **Python**: 30,803 LOC across `backend/`.
- **TypeScript / TSX**: 53,151 LOC across `ui/src/`.
- **Documentation**: **127 Markdown files** in `docs/` (across `docs/active/`, `docs/handbook/`, `docs/internal/`, `docs/archive/`).
- **ADR log**: **27 architectural decision records** in `docs/active/DECISIONS.md`.
- **GitHub Issues (open)**: 11 as of `gh issue list --state open --limit 300`.

## 6. Rigor markers

- **Backend tests**: **197 pytest functions** (`find backend/tests -name 'test_*.py' | xargs grep -h '^def test_' | wc -l`).
- **Frontend tests**: **628 vitest `it`/`test` calls** (`grep -rhE '^\s*it\(|^\s*test\(' ui/src`).
- **Pre-push hook**: `.git/hooks/pre-push` runs `ruff check backend/` before every push (auto-installed by `scripts/install_pre_push_hook.sh`).
- **CI**: `.github/workflows/ci.yml` runs backend pytest + frontend vitest + Docker build + change detection; `codeql.yml` runs Python + TypeScript static analysis on every PR + weekly cron.
- **P0 fix — ISSUE-032 (FF-SSW axiom desync)**: documented in `docs/active/KNOWN_ISSUES.md:48` — "peptides display `FF-SSW=true` while `SSW=false` (P85089, P0C005). Root cause: dual-source desync — `sswPrediction` shipped TANGO-only column; `ffSswFlag` used TANGO ∪ S4PRED mask." Fix landed 2026-05-19 (marked ✅ FIXED in the issue table); regression-locked by `backend/tests/test_axiom_invariants.py`. Commit `614d05e` (2026-05-21) — "fix(scientific-integrity): preserve TANGO per-predictor verdict verbatim".
- **Smoke test**: `backend/scripts/smoke_tango.py` + `make smoke-tango` — end-to-end verification the TANGO binary is reachable and produces output for a known input.
- **Sequence-hash caching**: `backend/services/provider_cache.py:170` — `seq_hash(sequence)` uses SHA-256 as the primary key of a DuckDB cache; `bulk_get_provider_cache` (line 217) returns cached `tango_json`, `s4pred_json`, `biochem_json`, `ff_helix_json` for repeat sequences. Added 2026-04-03, commit `cb2472b` "feat: B6 provider result cache — skip TANGO/S4PRED for cached sequences".

## 7. Staphylococcus 2023 validation dataset

- **Dataset file**: `backend/data/reference_datasets/staphylococcus_2023.xlsx` — **2917 rows × 36 columns** (1 header + 2916 peptides), verified with `openpyxl` load. A copy also ships as `ui/public/Final_Staphylococcus_2023_new.xlsx` for the first-visit demo path.
- **Precompute pipeline**: `backend/scripts/precompute_dataset.py` `DATASETS["gold_standard"]` points at the XLSX and produces `backend/data/precomputed/gold_standard.json` — an ~18.7 MB JSON with all 2,916 rows' full pipeline outputs.
- **Validation script**: `backend/scripts/rerun_validation_2026_06_07.py` — runs the same code path the UI batch upload takes, writes per-peptide confusion output to `data/validation/<cohort>_2026_06_07.json`.
- **Committed benchmark**: `docs/handbook/research/02_validation_evidence.md` §4 (with source `docs/active/RESEARCH_BRIEFS/RB-VALIDATION-V0-1.md` §3) — on the labeled subset (n=66, `TEM Fibrils` column: 47 positive `V` / 19 negative `X`): FF-Helix sensitivity = **1.000 (47/47)**, specificity = **0.000 (0/19)**, PPV = 0.712, F1 = 0.832.

## 8. What isn't captured here (deliberately)

- DESY internship start date (not visible in commit metadata).
- JPred (no references in the repo — the lineage documented is PSIPRED → S4PRED only).
- Any performance claims — perf commits exist (`_perf_init.py`, ADR-025, PR #105, #117, #119) but this page reports facts, not marketing.
