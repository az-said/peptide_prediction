# MATERIAL AND METHODS — v2 draft (2026-07-12)

> **v2 supersedes v1** — every paragraph rewritten against verified code (`backend/` fact sheet 2026-07-12) and Peleg's writing style extracted from Ragonis-Bachar *et al.*, *Biomacromolecules* **2022**, *23*, 3713–3727. The v1 draft had 20+ factual mismatches with the code — see `09_correctness_deltas.md` for the delta log.
> Paste each **Method X** heading into the Doc as **Heading 2 (bold, non-italic)** per Peleg's saved template. Paste each *italic sub-head* as **Heading 3 (italic, non-bold)**.
> Every `[CITE: …]` is a Paperpile placeholder Peleg maps against library `0zqjXo`. Every `α`, `β`, `μH`, `Å`, `δ` is a real Unicode Greek/symbol — do not romanise.
> Terminology follows the canonical Landau-lab lexicon documented in `08_terminology_and_style_guide.md`. In particular: *fibril formation* (never "aggregation prediction"), *did not form fibrils in the tested conditions* (never "will not form fibrils"), *database* (never "cohort"), *membrane-active overlap class* (never "false-positive class").

---

## **Method A. Overall architecture and design principles**

PePFibPred is a deterministic, sequence-only computational pipeline that combines β-aggregation propensity, per-residue secondary-structure prediction, an α-helical fibril-forming propensity filter, and biochemical descriptors, and exposes the same pipeline through five interchangeable interfaces (web dashboard, REST API, Python package, command-line client, and a Model Context Protocol server). The pipeline is built around three architectural principles.

First, **traceability of every reported field**. Each per-residue and per-sequence quantity in the response payload is produced by a versioned routine whose predictor family, threshold configuration, and version string are recovered from the accompanying `RunMetadata` object (`backend/schemas/api_models.py:355–423`). A permanent identifier for the reproduction of any interactive result — the *reproducibility permalink* — is bundled with every response, allowing a peer to re-run the same submission and obtain bit-identical numeric fields on demand.

Second, **classification at the presentation layer**. Threshold selection (μH cut-off, hydrophobicity cut-off, TANGO hotspot percentage, S4PRED helix minimum) is exposed as a user-controllable set, and re-classification of an already-processed database is performed against the cached per-predictor outputs without invoking any predictor. Three modes are supported: *default* (literature-derived values), *recommended* (dataset-derived from the submitted database), and *custom* (user-set values), following the strategy detailed in `docs/active/DECISIONS.md` (ADR-023).

Third, **preservation of per-predictor verdicts**. Neither TANGO's nor S4PRED's raw per-residue outputs are merged before the classification layer. The TANGO-only structural-switch verdict is persisted as `tangoSswPrediction` and the S4PRED-only verdict as `s4predSswPrediction`; the unified verdict `sswPrediction` (Method F) is computed at the DataFrame boundary and is verified by regression-locked invariant tests to be consistent with its two components (`backend/tests/test_axiom_invariants.py:67–226`).

## **Method B. Sequence pre-processing**

Input sequences arrive through four routes — single-sequence text, CSV/XLSX batch, UniProt-guided query, and RESTful API — and converge on a common pre-processing routine that (i) upper-cases the sequence, (ii) substitutes non-canonical residues by canonical proxies (X→A, Z→E, B→D, U→C, O→K, J→L) and strips common terminal chemical modifications (Ac-, pGlu-, Pyr-, For-, Myr-, Palm- prefixes and -NH₂, -amide, -OH, -COOH, -CONH₂ suffixes; `backend/auxiliary.py:488–541`), and (iii) records the original sequence and the applied substitutions in the response as `originalSequence` and `sequenceNotes` (`backend/schemas/api_models.py:230–235`).

The pipeline is optimised for the length window 10-40 residues; above 40 residues, S4PRED is skipped and the row's S4PRED-derived columns remain JSON `null`, with a warning key `s4pred_skipped_long_seq` surfaced in the response (`backend/s4pred.py:513–531`; `backend/config.py:216`). The 40-residue upper bound is a scientific constraint set by P. R.-B.: above this length the secondary-structure prediction becomes a surface problem rather than a per-residue propensity problem, and the downstream FF-Helix and structural-switch logic loses interpretive meaning (Peleg 2026-06-03, verbatim; codified in ADR-022). Sequences shorter than 5 residues are rejected because TANGO does not accept them as input. Empty and non-alphabetic input is rejected with an explicit warning.

## **Method C. β-aggregation propensity (TANGO)**

Per-residue β-aggregation propensity is computed with TANGO [CITE: Fernandez-Escamilla *et al.*, *Nat. Biotechnol.* 2004, 22, 1302–1306; Rousseau *et al.*, *Curr. Opin. Struct. Biol.* 2006, 16, 118–126], invoked as a compiled ELF (Linux x86_64) or Mach-O (Darwin) subprocess through a thread-safe wrapper (`backend/tango.py:41–75, 371`). The binary is invoked at fixed physicochemical conditions matching the reference protocol used in the Landau lab: pH 7, temperature 298 K, ionic strength 0.1 M, TFE concentration 0, no N-terminal cap, no C-terminal cap (`backend/tango.py:287`). These conditions are identical across single-sequence and batch calls.

TANGO emits per-residue scores for β-sheet, turn, helix, and aggregation propensities. Each per-residue track is parsed into the response payload as `Tango Beta curve`, `Tango Helix curve`, `Tango Turn curve`, and `Tango Aggregation curve`. Summary scalars — `Tango Beta max`, `Tango Helix max`, `Tango Aggregation max` — are computed by row-wise maximum. **The TANGO aggregation score is not a percentage** (Peleg, 2026-05-08); we report and label it as a raw score.

A residue-window aggregation *hotspot* is flagged when the mean aggregation score across a residue window exceeds a user-controllable threshold. The default hotspot threshold is 5.0 % aggregation propensity averaged across the stretch (`backend/config.py:375`; ADR-026). This default was empirically validated on the Peleg-118 fibril-validated set (Method M, below) and is exposed on every surface as `aggThreshold` so that a downstream user may re-classify without re-invoking TANGO.

Structural-switch fragments are extracted from the paired β/helix curves using the segment-finder routine described in Method D. The TANGO-derived structural-switch verdict `tangoSswPrediction` is derived from the difference-and-score summary of these fragments; the strategy for the diff-threshold is `mean` by default (`backend/config.py:166`; `backend/tango.py:1587–1743`) and is exposed as an environment variable.

**Concurrency and portability.** TANGO subprocesses are capped at min(cpu_count, 4) parallel workers (`backend/tango.py:255`); on Apple Silicon, the wrapper additionally strips the macOS quarantine extended attribute so the binary can execute without user interaction (`backend/tango.py:264, 474–478`). Timeouts are set to at least 120 s and scale linearly with the input row count (`backend/tango.py:489`).

## **Method D. Secondary-structure prediction (S4PRED)**

Per-residue secondary-structure prediction is performed with S4PRED [CITE: Moffat & Jones, *Bioinformatics* 2021, 37, 3744–3751], the 5-model bidirectional-GRU ensemble developed by the PSIPRED group. The five checkpoints (v1.2.4, `weights_1.pt`–`weights_5.pt`, ≈ 90 MB each) are pinned in the container image and loaded at process start (`backend/tools/s4pred/model.py:77–91`). For each residue, the ensemble mean over the five sub-model log-probabilities is exponentiated and per-position renormalised, and the resulting three-state (helix / strand / coil) probabilities are stored as `S4PRED P_H curve`, `S4PRED P_E curve`, and `S4PRED P_C curve`. The discrete `S4PRED SS prediction` label is the per-position `argmax` of the ensemble mean (`backend/tools/s4pred/model.py:258–273`).

To eliminate the sub-linear speed-up losses that arise from library-level thread contention, PyTorch and the standard scientific-Python thread pools are pinned to one thread at process boot: `OMP_NUM_THREADS = MKL_NUM_THREADS = OPENBLAS_NUM_THREADS = VECLIB_MAXIMUM_THREADS = NUMEXPR_NUM_THREADS = 1`, together with `torch.set_num_threads(1)` and `torch.set_num_interop_threads(1)` (`backend/_perf_init.py:28–37`; `backend/tools/s4pred/model.py:30–35`; ADR-025). The N = 1 fast path in `predict_sequences_batched` short-circuits to the legacy per-peptide forward when a batch contains a single peptide (`backend/tools/s4pred/model.py:221–227`), and a regression-locked test asserts that this short-circuit is bit-identical to a full batched forward at 1 × 10⁻⁵ tolerance (`backend/tests/test_s4pred_batched_equivalence.py:65–103`). This test is the invariant that makes a Quick-Analyze submission numerically identical to a 1-row batch submission — a design requirement for the reproducibility permalink.

*Helix-segment derivation.* Contiguous helix propensity segments are extracted from the ensemble helix probability track by the routine `_get_secondary_structure_segments` (`backend/s4pred.py:131–198`). A segment begins where the per-residue helix probability rises above zero, extends across gaps of at most three residues, and is retained as a *good* segment when its length is at least 5 residues and either the mean or the median helix probability across the segment exceeds 0.5 (`backend/config.py:198, 201, 204`). Adjacent segments separated by gaps of ≤ 3 residues are merged into a single segment. Segments failing the length-plus-statistic gate but exceeding the length threshold are further inspected for a valid sub-window (`backend/s4pred.py:104–128, 188–194`). The resulting list of segments is returned to the caller as `Helix fragments (S4PRED)` and is the input to the FF-Helix classifier (Method E) and to the biochemistry helix-only descriptors (Method G).

## **Method E. Fibril-forming α-helical propensity (FF-Helix)**

The FF-Helix classifier identifies fibril-competent α-helical segments in the sequence by a compositional propensity criterion adapted from the fibril-forming residue analysis of Hamodrakas and colleagues [CITE: Hamodrakas, *FEBS J.* 2011, 278, 2428–2435] and the Landau-lab framework for α/β chameleon amyloids [CITE: Ragonis-Bachar *et al.*, *Biomacromolecules* 2022, 23, 3713–3727]. It runs on every accepted sequence, independently of the TANGO and S4PRED tracks, and is emitted as `FF-Helix %` and `FF Helix fragments`.

*Algorithm.* A propensity table `P_α` is defined over the twenty canonical residues with values α = 1.42, R = 0.98, N = 0.67, D = 1.01, C = 0.70, Q = 1.11, E = 1.51, G = 0.57, H = 1.00, I = 1.08, L = 1.21, K = 1.14, M = 1.45, F = 1.13, P = 0.57, S = 0.77, T = 0.83, W = 1.08, Y = 0.69, V = 1.06 (`backend/auxiliary.py:21–42`) — a Chou-Fasman-like helix propensity vector normalised so that 1.0 is the neutral value. For each window of `core_len = 6` consecutive residues (i, i+1, …, i+5), the mean propensity `⟨P_α⟩` across the window is computed. Windows whose mean propensity is at or above the threshold `thr = 1.0` (`backend/config.py:159, 162`) contribute their six residues to the *FF-Helix core mask*. Sequences of length below `core_len` are excluded. The `FF-Helix %` scalar is

```
FF-Helix % = 100 · |core_residues| / L    (1)
```

where L is the sequence length and `|core_residues|` is the number of residues covered by at least one qualifying window. Maximal contiguous core-residue runs are exposed as `FF Helix fragments` (one-indexed, closed intervals) and drive the residue-level highlight track in the web interface.

*Classification.* A sequence is classified as **FF-Helix positive** when it carries at least one S4PRED-identified helix segment (Method D) and the mean hydrophobic moment μH across all helix segments (Method G) is at or above the μH cut-off. The default μH cut-off is 0.5 (`backend/config.py:362`); dataset-derived and user-set thresholds are supported. This axiom `FF-Helix positive ⟹ Helix positive` is regression-locked by test `test_axiom_invariants.py::TestFFHelixSubsetHelix` (`backend/tests/test_axiom_invariants.py`).

## **Method F. Structural-switch verdict (SSW) and FF-SSW**

The structural-switch verdict is the pipeline's operationalisation of the α/β chameleon behaviour experimentally characterised for uperin 3.5, aurein 3.3, and *Staphylococcus aureus* PSMα3 [CITE: Ragonis-Bachar *et al.*, *Biomacromolecules* 2022; Tayeb-Fligelman *et al.*, *Science* 2017, 355, 831–833]. A peptide is a **structural-switch (SSW) candidate** when *either* TANGO *or* S4PRED emits a positive structural-switch verdict:

```
SSW_candidate(peptide) = TANGO_SSW(peptide) ∨ S4PRED_SSW(peptide)    (2)
```

with `∨` denoting inclusive logical OR (`backend/auxiliary.py:338–361`). The union — not the conjunction — is the correct base-layer rule because the two predictors are searching for compatible-but-distinguishable signatures of the switch: TANGO detects the β-aggregation-competent stretch, S4PRED detects the helix-competent stretch, and either evidence, alone, is a candidate signal for the switch class. Merging the two into a conjunction would suppress the very sequences the class is intended to discover.

*ISSUE-032 regression lock.* A defect in an earlier release (2026-05-19) admitted a class of rows in which the TANGO-only column reported `sswPrediction = -1` while the composed `ffSswFlag` was 1 (peptides P85089 and P0C005 were the observed cases). The defect was closed by three-layer fixes: a unified `SSW prediction (unified)` column in `backend/services/dataframe_utils.py:322`; a defence-in-depth `_enforce_ff_axioms` clamp at the API serialisation boundary (`backend/services/normalize.py:489`); and nine invariant tests in `backend/tests/test_axiom_invariants.py:67–226` that exercise every combination of TANGO/S4PRED verdict against the composed flags. These tests are part of the CI gate.

*FF-SSW.* A sequence is classified as **FF-SSW positive** when its unified SSW verdict is positive *and* its full-length hydrophobicity (Method G) is at or above the hydrophobicity cut-off. The default cut-off is 0.5 (`backend/config.py:365`). The axiom `FF-SSW positive ⟹ SSW positive` is regression-locked by `test_axiom_invariants.py::TestFFSswSubsetSsw`. FF-SSW uses hydrophobicity, not μH — this distinction was validated with P. R.-B. on 2026-06-03 and codified in `backend/auxiliary.py:375–382`.

*Symmetry-of-treatment axiom.* Every analysis, panel, and export that treats SSW or FF-SSW must apply the same treatment to Helix and FF-Helix (Peleg, Drive Comment 15, 2026-05-22). This is not a subset axiom: SSW and Helix are independently derivable from the same predictor outputs, and the pipeline exposes both symmetrically.

## **Method G. Biochemical descriptors**

For every accepted sequence, four length-normalised descriptors are computed on the fly. All four are based on the Fauchère-Pliska hydrophobicity scale [CITE: Fauchère & Pliska, *Eur. J. Med. Chem.* 1983, 18, 369–375], which is a physicochemical scale and *not* a secondary-structure propensity — a distinction P. R.-B. has consistently enforced for the Landau-lab framework.

*Hydrophobicity (H̄).* Arithmetic mean of the Fauchère-Pliska hydrophobicity values across the sequence (`backend/biochem_calculation.py:103–110`).

*Net charge (z) at pH 7.4.* Signed sum of per-residue charge contributions: K = +1, R = +1, D = -1, E = -1, H = +0.1 (partial protonation with pKa ≈ 6.0); all others 0 (`backend/biochem_calculation.py:35–37, 80–100`). The *signed* value is retained; the sign of the charge is biologically informative for membrane-targeting AMPs and downstream consumers are documented to consume the signed quantity rather than its absolute value.

*Full-length hydrophobic moment (μH).* Eisenberg's hydrophobic dipole moment [CITE: Eisenberg, Weiss & Terwilliger, *Nature* 1982, 299, 371–374] at the α-helical periodicity δ = 100°:

```
μH = √{ [Σᵢ Hᵢ cos(i · δ)]² + [Σᵢ Hᵢ sin(i · δ)]² } / L    (3)
```

where Hᵢ is the Fauchère-Pliska hydrophobicity of residue *i* and L is the sequence length. The length-normalisation (Eq. 3, dividing by L) is essential for comparability across peptides of unequal length. The same formula is evaluated at the β-strand periodicity δ = 160° to produce `Beta full length uH` (`backend/services/dataframe_utils.py:436–452`). NaN and non-finite results are guarded to 0.0 (`backend/biochem_calculation.py:75–77`).

*Helix-segment μH.* The length-weighted mean of μH evaluated on each S4PRED helix segment (Method D), exposed as `Helix (Jpred) uH` — the column name preserves the historical Jpred lineage in Peleg's earlier framework and is not a claim that Jpred is currently in use (`backend/auxiliary.py:434–462`; `backend/calculations/biochem.py:85`).

Threshold citation. The default μH cut-off (0.5) and default hydrophobicity cut-off (0.5) are the Ragonis-Bachar and Rayan calibration values from prior work on the *Staphylococcus aureus* 2023 benchmark; the μH *formula* citation is Eisenberg 1982, but the *threshold* citation is Ragonis-Bachar & Rayan (Peleg, Drive Comment 27, 2026-05-22) — a distinction made in the tooltip and Help pages of the interactive interface.

## **Method H. Ranking and prioritisation**

For batch submissions, sequences are prioritised by a percentile-based composite score. Three metrics are active by default — `s4predHelixPercent`, `μH`, and `hydrophobicity` (`backend/services/peptide_rank.py:44`) — and four additional metrics are optional (TANGO aggregation maximum, absolute charge, FF-Helix percentage, SSW score; `peptide_rank.py:45`). For each active metric, the per-peptide percentile rank is computed across the submitted database (`peptide_rank.py:123–134`) so that the composite is comparable across peptides of unequal length and independent of the raw units of any single metric. Missing values reduce the effective per-peptide weight sum (`peptide_rank.py:307–316`) so that a peptide without a TANGO track is ranked against the two remaining metrics rather than being penalised.

Weights are set by one of four preset choices at the presentation layer, each summing to 100 (`peptide_rank.py:58–79`):

| Preset | s4predHelixPercent | μH | hydrophobicity |
|---|---:|---:|---:|
| Equal | 34 | 33 | 33 |
| Fibril-formation Focus (`amyloid`) | 20 | 40 | 40 |
| Helix Focus | 50 | 30 | 20 |
| Switch Focus | 40 | 30 | 30 |

A frontend-only *Fibril* preset uses five flag-based metrics — FF-Helix flag, FF-SSW flag, SSW prediction, μH, S4PRED helix score — with weights (30, 30, 20, 10, 10) and is the default interactive preset (`ui/src/stores/datasetStore.ts:41–51`). Composite scores are returned as `rankScore` on the [0, 1] interval; ties are broken by ascending peptide identifier (`peptide_rank.py:331`). No preset ever produces a TANGO-only ordering — this is the "never TANGO-only" design constraint set by P. R.-B. (Peleg 2026-05-22, feedback memo).

Each ranked peptide additionally carries a short list of natural-language *reason strings* (up to three per row) — for example, `"High FF-Helix coverage (78%)"` — computed by weighting each metric's per-peptide contribution by `weight · |percentile - 50|` (`peptide_rank.py:159–226`). The reason strings are intended to make the ranking auditable at a glance.

## **Method I. Sequence-hash provider cache and precomputed artefacts**

Because TANGO and S4PRED account for the great majority of the pipeline wall-clock time, per-predictor outputs are cached in a shared DuckDB database (`provider_cache.duckdb`) with schema `(seq_hash VARCHAR PRIMARY KEY, sequence VARCHAR, tango_json VARCHAR, s4pred_json VARCHAR, biochem_json VARCHAR, ff_helix_json VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)` (`backend/services/provider_cache.py:107–119`). The primary key is the first 32 hexadecimal characters of `SHA-256(sequence.strip().upper())` (`backend/services/provider_cache.py:170–172`). Thresholds are *not* cached — they are cohort-dependent and always recomputed at the classification layer. Writes are serialised via a file-lock to permit multiple worker processes to share a single database file (`backend/services/provider_cache.py:156–164`).

For the two canonical reference databases used by the interactive demo — the *Staphylococcus aureus* 2023 benchmark (Method M) and the Peleg-118 fibril-validated set (Method M) — the full pipeline is executed once as a build-time step (`backend/scripts/precompute_dataset.py`) and the resulting rows are serialised to a static JSON artefact (`backend/data/precomputed/gold_standard.json`, `backend/data/precomputed/peleg_118.json`) that the API serves through `GET /api/precomputed/{id}`. The precompute stage bypasses the provider cache (`force_recompute = True`, `upload_service.py:922–930`) and the batch-mode TANGO auto-disable gate (`bypass_tango_budget = True`, `upload_service.py:863`) so that the artefacts are always a fresh reflection of the current pipeline. Each artefact is stamped with the PVL version string read from `CITATION.cff` (`precompute_dataset.py:207–224`). The frontend transparently falls back from the artefact to the live pipeline if the artefact is unavailable.

## **Method J. UniProt-guided discovery**

A dedicated UniProt-search surface (`POST /api/uniprot/execute`) allows sequence discovery to begin from an organism / keyword / length-range / annotation-score query rather than from a peptide list. Queries are compiled to the UniProt REST query language and dispatched against `https://rest.uniprot.org/uniprotkb/{search,stream}` (`backend/services/uniprot_parser.py:297`); the search endpoint is used for cursor-paginated results (up to 500 rows per page, `Link: rel="next"` header parsed at `uniprot_execute_service.py:243–254`) and the stream endpoint for single-response bulk retrieval up to the UniProt REST cap. Between pages, the client pauses 200 ms (`uniprot_execute_service.py:288–289`) to respect UniProt's fair-use ceiling; on HTTP 429 the client honours the `Retry-After` header and retries once (`uniprot_execute_service.py:294–303`). The returned TSV columns (`accession, id, protein_name, organism_name, organism_id, sequence, length, gene_names, cc_function, annotation_score`) are normalised through `normalize_cols` and the resulting frame is fed into the same pipeline as a CSV upload.

## **Method K. Execution surfaces**

The pipeline is exposed through five interchangeable surfaces, all backed by the same Python core so that a peptide submitted through any surface returns bit-identical numeric fields.

*Web dashboard.* A React 18.3.1 / TypeScript 5.8.3 / Vite 7.1.6 / Tailwind CSS 3.4.17 single-page application (`ui/package.json`), built with Zustand 5.0.14 for state, Recharts 3.2.1 and framer-motion 12.40.0 for visualisation, shadcn/ui + Radix primitives for accessible components, and @sentry/react 10.55.0 for runtime observability. The dashboard supports single-sequence entry, batch upload (CSV, TSV, XLSX; `papaparse 5.5.3`, `xlsx 0.18.5`), UniProt-guided discovery, threshold re-classification without pipeline re-run, and publication-ready SVG/PDF export (`jspdf 3.0.3`).

*REST API.* A FastAPI ≥ 0.136.1 service (`backend/requirements.txt`) served by Gunicorn ≥ 26.0.0 with two Uvicorn workers on the reference deployment; response schemas are Pydantic v2 with `extra="forbid"` on requests (ADR-002). The batch-predict endpoint is rate-limited to 30 requests per minute per IP (slowapi ≥ 0.1.9, `backend/api/routes/predict.py:65`); the request body cap is 100 MB (Caddy). CORS defaults permit the local development frontend and are overridden per-environment.

*Python package + command-line client.* The `pvl-cli` package (v0.1.0, MIT, `pvl-cli/pyproject.toml`) exposes an importable `pvl` module and a `pvl analyze` command-line entry point (Click ≥ 8.1, httpx ≥ 0.25). It targets the production REST endpoints by default and is the recommended surface for reproducible headless batch runs.

*Model Context Protocol server.* The `pvl-mcp` package (`mcp_server/pvl_mcp/`) is a standards-compliant MCP server exposing seven pipeline functions as callable tools to LLM assistants: `search_uniprot`, `analyze_sequences`, `get_peptide_detail`, `rank_candidates`, `compare_cohorts`, `find_similar_peptides`, and `get_pvl_version` (`mcp_server/pvl_mcp/tools.py:9–19`). To our knowledge PePFibPred is the first computational tool for α-helical fibril-forming peptide prediction with a native LLM-callable surface. The server supports both stdio (Claude Desktop) and SSE transports (`server.py:56–74`).

*Containerised deployment.* The reference deployment runs on a four-service Docker Compose stack — backend, Redis, Celery batch worker, Celery quick worker, and an nginx-served static frontend — orchestrated behind Caddy 2 with automatic Let's Encrypt certificate rotation, `HSTS` with `preload`, and `zstd + gzip` encoding (`docker/Caddyfile:113–142`). The stack fits on a Hetzner CX33 virtual server (4 vCPU, 8 GB RAM, Ubuntu 24.04 LTS). A parallel DESY-hosted deployment on the CSSB `landau-webapp-dev` host is in preparation.

## **Method L. Reproducibility and continuous integration**

Every commit on the `main` branch is exercised by a seven-workflow GitHub Actions suite: (i) `ci.yml` runs backend pytest and frontend vitest, then builds the container image; (ii) `codeql.yml` executes Python + TypeScript static analysis on every pull request and on a weekly schedule; (iii) `deploy.yml` deploys to the reference host on push to main; (iv) `docker-publish.yml` publishes container images to the GitHub Container Registry on tag and on push to main; (v) `docs.yml` builds and deploys the user handbook with `mkdocs --strict`; (vi) `publish-pypi.yml` publishes `pvl-cli` and `pvl-mcp` to PyPI on tagged release through the OpenID-Connect Trusted-Publisher flow — no long-lived credentials leave the GitHub Actions environment; (vii) `release.yml` verifies the tag against `CITATION.cff`, uploads Sentry release + source maps, and cuts a GitHub release. Runtime observability is provided by `sentry-sdk[fastapi] ≥ 2.60.0` server-side and `@sentry/react 10.55.0` client-side; 404 and 422 responses are filtered at the SDK boundary (`backend/api/main.py:47–55`). A pre-commit hook (`ruff-format`, `ruff-check --fix`, `prettier`, `eslint`, and a four-file fast-unit-test hook, `.pre-commit-config.yaml`) catches formatting and lint regressions before they enter version control. Test counts at the current release (v0.3.0) are ≈ 608 backend pytest functions across 44 files and ≈ 613 frontend vitest cases across 55 files.

A dedicated smoke test (`make smoke-tango` → `backend/scripts/smoke_tango.py`) validates end-to-end that the TANGO binary is reachable and that, for *N* inputs, the wrapper parses *N* outputs (invariant enforced by `smoke_test_tango`; `backend/tango.py:1446–1581`). The `make contract-check` target invokes `backend/scripts/check_contract_sync.py`, which verifies backend↔UI schema alignment. Zenodo release-DOI minting is currently a manual step keyed by `CITATION.cff` (concept DOI recorded as `10.5281/zenodo.PENDING` until first tagged release); automation is queued in the publication path.

## **Method M. Reference databases**

Two datasets are shipped with PePFibPred for validation and demonstration; both are curated by P. R.-B. and Landau lab.

*Staphylococcus aureus 2023 benchmark.* A 2 916-peptide database (`backend/data/reference_datasets/staphylococcus_2023.xlsx`; 36 columns including experimental TEM, fiber diffraction, and ThT labels) drawn from *S. aureus* proteomes and curated for computational amyloid analysis by P. R.-B.'s laboratory [CITE: dataset publication — Peleg to supply DOI]. Sixty-six peptides carry a `TEM Fibrils` label — 47 confirmed fibril-forming (V) and 19 confirmed *did not form fibrils in the tested conditions* (X). The 19 X-labelled peptides are dominated by phenol-soluble modulin α2 (PSM-α2, `MGIIAGIIKFIKGLIEKFTGK`) replicated across 15 UniProt accessions, together with two Delta-hemolysin, one PSM-mec, and one additional PSM sequence; the negative-class composition is documented explicitly so that specificity numbers are read as *"can PePFibPred distinguish PSM-α1 from PSM-α2?"* — a hard biochemical problem where the two sequences differ by four substitutions in twenty-one residues — rather than as general non-amyloid recall.

*Peleg-118 fibril-validated positive set.* A 118-peptide, positive-only database (`backend/data/reference_datasets/peleg_118_fibril_validated.json`) covering fibril-forming AMPs (57), UniProt AMPs (37), functional amyloids (14), pathogenic amyloids (7), and general UniProt entries (3). All sequences are 10-40 residues; each row carries UniProt accession, source database, and either a PubMed identifier, an AmyPro identifier, or a Landau-lab reference. Notable members include human defensin HD6 (Q01524), melittin (P01501 44-69), uperin 3.5 (P82042), phosphoribulokinase (P25934), and PlnA-22 (P80214).

On the 66-peptide labelled subset of *Staphylococcus aureus* 2023, FF-Helix achieves sensitivity 1.000 (47/47), specificity 0.000 (0/19), positive predictive value 0.712, and F1 0.832; FF-SSW achieves sensitivity 0.319, specificity 0.053, positive predictive value 0.455, and F1 0.375 (`docs/handbook/research/02_validation_evidence.md:139–156`; RB-VALIDATION-V0-1 §3.1). On Peleg-118, the union `FF-Helix ∨ FF-SSW` recovers 40 of 118 peptides (sensitivity 0.339, wall-clock 44.7 s on the reference deployment; `02_validation_evidence.md:70–83`). Threshold-sensitivity sweeps (RB-VALIDATION-V0-1 §3.3) show that FF-Helix F1 is stable across μH cut-offs in the range [0.0, 0.6] and collapses above 0.7, and that no hydrophobicity cut-off rescues FF-SSW on the *Staphylococcus aureus* 2023 negative-class composition — a scientific limitation of the pipeline that is not resolvable by threshold tuning alone and that is discussed openly in the Results and Discussion.

A rerun of the *Staphylococcus aureus* 2023 predictions against the current HEAD (rather than the cached `COMPUTED COLUMNS` in the source spreadsheet) is queued as follow-up RB-VALIDATION-V0-1 §10.1; the numbers reported above use the cached predictions. A head-to-head accuracy comparison against β-only tools (AGGRESCAN, PASTA 2.0, Waltz, FoldAmyloid, AmylPred2) is not reported here because those tools predict β-sheet propensity — the *inverse* of the α/β chameleon signature PePFibPred is trained to detect — and any such comparison would confound category difference with accuracy.

---

## Terminology re-check before pasting

Every occurrence of the following terms below must be checked against `08_terminology_and_style_guide.md`:

- "fibril formation" (never "aggregation prediction")
- "structural switch" or "SSW candidate" (never "chameleon" as a class label; "chameleon" is a metaphor used in Introduction only)
- "did not form fibrils in the tested conditions" (never "did not form fibrils")
- "database" (never "cohort")
- "membrane-active overlap class with shared fibril-forming features" (never "false-positive class")
- "helix segment" / "structural-switch fragment" (never "cross-α fibril" at pipeline-output level)
- "Ragonis-Bachar and Rayan" as the threshold citation (Eisenberg only for the μH formula)
- α, β, μH written as Unicode, not `alpha`, `beta`, `uH`, `mu_H`
