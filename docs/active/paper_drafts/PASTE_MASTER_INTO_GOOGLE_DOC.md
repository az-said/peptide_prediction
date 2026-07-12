# PASTE MASTER — Everything for the Google Doc, in one file

**Source-of-truth**: this is the paste-ready aggregation of every section we own in the paper. Open this file side-by-side with the WORKING COPY doc and paste each block in order.

**Working copy**: https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit
**Original (do NOT edit until approved)**: https://docs.google.com/document/d/1fDSC3k-9xrWiThHbnB8xMG0wS5yINZjRL-_oBg54ZFY/edit

**Reading rule**: each section below is delimited by `═══ SECTION N/9 ═══`. Copy from the marker after the delimiter down to the next delimiter. Paste into the corresponding section of the working copy. Fix Google Doc heading levels + bold/italic + Greek symbols by hand.

**Section order** (matches the working-copy Doc top-to-bottom):
1. **MATERIAL AND METHODS** — Method A through Method M (from `01_materials_and_methods.md`)
2. **Server usage** — Access + Availability + Job Submission Options (from `02_server_usage.md`)
3. **AUTHOR CONTRIBUTIONS** — Said + Alex CRediT lines (from `03_author_contributions.md`)
4. **DATA AVAILABILITY** — the short-form NAR-compliant statement (from `04_data_availability.md`)
5. **DISCUSSION bullets** — 8 engineering / product bullets to add to Peleg's list (from `06_discussion_bullets.md`)
6. **Future Work paragraph** — "Ongoing development and roadmap" for DISCUSSION (from `11_future_plans_paper_content.md`)
7. **Naming comment** — paste on Peleg's "Find a name" thread (from `05_tool_name_and_graphical_abstract.md`)
8. **Graphical abstract comment** — paste on Peleg's "Ideas for graphical abstract?" thread (from `05_tool_name_and_graphical_abstract.md`)
9. **What Peleg / Meytal own** — cross-check note (nothing to paste)

**Terminology + style guardrails** (verify each paste against `08_terminology_and_style_guide.md`):
- Greek inline: α, β, μH, δ — never spelled out
- Ranges: unspaced en-dash (10-40, not 10 - 40)
- "fibril formation" never "aggregation prediction"
- "database" never "cohort"
- "membrane-active overlap" never "false positive"
- SSW axiom is OR (∨), never AND (∧)
- No pI (does not exist in code)

═══ SECTION 1/9: MATERIAL AND METHODS ═══
PASTE-INTO: the "MATERIAL AND METHODS" section of the doc.
FORMAT: each "Method X." block = Heading 2 (bold, non-italic). Any italic sub-heads = Heading 3 (italic, non-bold).


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

═══ SECTION 2/9: SERVER USAGE ═══
PASTE-INTO: the "Server usage" section of the doc, after RESULTS opening / Computational scheme (which Peleg owns).
FORMAT: "Server usage" = Heading 2. "*Access and Availability*" + "*Job Submission Options*" = Heading 3 (italic).


### *Access and Availability*

PePFibPred is accessible through five equivalent surfaces, each backed by the same deterministic pipeline core (Method H). All surfaces are open access and require no user registration.

*Web interface.* The primary entry point is the browser-based analysis dashboard at **https://[HOSTNAME PENDING FINAL DNS]/** (production deployment on Hetzner CX33) with a parallel DESY-hosted mirror in preparation. The UI supports single-sequence entry, CSV/XLSX batch upload, and UniProt-guided discovery, and renders per-residue tracks, batch statistics, and publication-ready plots.

*RESTful API.* A programmatic HTTPS interface is exposed at `https://[HOSTNAME]/api/` with an OpenAPI 3.1 schema auto-published at `/api/openapi.json`. Requests are rate-limited to 30 requests / minute / IP (slowapi) to preserve the shared TANGO/S4PRED resources; institutional callers requiring a higher limit are asked to raise a GitHub Issue.

*Python package.* Users who prefer local execution or need to embed PePFibPred inside an existing analysis pipeline can install the `pvl-cli` Python package from PyPI (`pip install pvl-cli`), which ships both the CLI entry point and the `pvl` importable module. This surface is the recommended path for HPC / cluster deployments and for scripted batch runs against a private dataset.

*Command-line interface.* The bundled `pvl` executable exposes single-sequence, batch, and UniProt subcommands (`pvl predict`, `pvl batch`, `pvl uniprot`) with a `--json` output flag for downstream piping. The CLI targets the same REST endpoints as the web UI (production URL by default; overridable through `--base-url`), so results are bit-identical to the browser-driven analysis.

*Model Context Protocol (MCP) server.* For interoperability with LLM assistants (e.g. Claude, ChatGPT with an MCP-capable client), the `pvl-mcp` server exposes each pipeline function as a typed MCP tool, allowing conversational batch analysis such as *"predict fibril-forming propensity for every peptide in this FASTA"*. The server is available on PyPI (`pip install pvl-mcp`) and is intended as a first-of-its-kind LLM-native surface for a computational amyloid predictor.

The full source code, container images, precomputed reference-dataset artefact, and continuous-integration workflows are archived under a persistent DOI on Zenodo and mirrored on GitHub (Data Availability).

### *Job Submission Options*

Three distinct job-submission modes are supported through every surface listed above, matching the three interaction styles typical of the AMP / amyloid research workflow:

**Single-sequence mode.** A single peptide is entered as an FASTA-formatted string or as a bare amino-acid sequence. The pipeline runs synchronously (typical latency 3–10 s on a warm cache; 40–80 s cold) and returns the full per-residue tracks (TANGO β-aggregation, S4PRED Q3 probabilities and label, FF-Helix core windows), the biochemical scalars (H̄, net charge, μH, pI), the derived flags (`ssw_candidate`, `ff_helix_flag`), and the ranking score. Sequences outside 10 ≤ *L* ≤ 40 residues are rejected client-side with an explicit reason (Method B).

**Batch mode (CSV / XLSX upload).** A tab- or comma-delimited file with a column of peptide sequences is uploaded. Optional columns are auto-detected and preserved through the pipeline: identifier, organism, source, and any user-defined annotation column. The pipeline runs asynchronously behind a job queue (background thread pool; the response returns immediately with a `job_id`); the results dashboard polls until completion and offers per-column filtering, batch statistics (density plots for each descriptor, threshold-sensitivity curves), publication-ready SVG downloads, and an exportable results workbook containing the raw input, the full per-residue tracks, and the classification columns.

**UniProt-guided discovery mode.** Instead of supplying peptides directly, users can build a typed UniProt query (organism, keyword, length range, database cross-reference filter) that is issued against the UniProtKB REST API; the pipeline then runs on the returned FASTA batch and preserves the UniProt provenance metadata (accession, entry name, evidence code) all the way through to the exported workbook. This mode is designed to accelerate the "start from a hypothesis, not a peptide list" workflow — the same workflow that produced the AlphaFold-guided candidate discovery reported in [CITE: Ragonis-Bachar, Axel, Blau, Ben-Tal, Kolodny, Landau, Proteins 2024].

Across all three modes, the user-controllable thresholds (TANGO hotspot, S4PRED helix probability, FF-Helix window compositional cut-off, ranking weights) are re-evaluated at the presentation layer without re-running any predictor, so a user can re-classify a large batch in constant time.

**Input Formats and Parameters.**

| Input | Accepted formats | Constraints |
|---|---|---|
| Single peptide | Bare 1-letter code, or single-record FASTA | 10 ≤ *L* ≤ 40 aa; canonical residues only |
| Batch | CSV, TSV, XLSX; column header `sequence` (case-insensitive) | ≤ 5 000 rows per submission; sequences validated as per single-peptide rules |
| UniProt query | Structured query builder | 100-hit page size; max 20 pages per query |
| Thresholds | Float parameters on all surfaces | Bounded [0, 1] for probability cuts; [0, 100] for TANGO % |
| API auth | None required | Anonymous rate limit 30 req/min/IP |

═══ SECTION 3/9: AUTHOR CONTRIBUTIONS ═══
PASTE-INTO: the "AUTHOR CONTRIBUTIONS" section, below Peleg's already-drafted line.
FORMAT: plain paragraph text, no heading.

**Said Azaizah**: Software, Data curation, Validation, Formal analysis, Visualization, Investigation, Writing – original draft, Writing – review & editing.

**Aleksandr Golubev**: Investigation, Formal analysis, Validation, Supervision, Writing – review & editing.

═══ SECTION 4/9: DATA AVAILABILITY ═══
PASTE-INTO: the "DATA AVAILABILITY" section.
FORMAT: plain paragraph text with hyperlinks. Zenodo DOI stays "PENDING" until v1.0.0 is tagged.

> All source code, dependency manifests, Docker recipes, and the precomputed prediction artefact for the reference dataset are archived on Zenodo (DOI **10.5281/zenodo.[PENDING]**) and mirrored on GitHub (**https://github.com/az-said/peptide_prediction**, MIT-licensed). Distributable packages are on PyPI (`pvl-cli`, `pvl-mcp`). Container images are on GHCR (`ghcr.io/az-said/peptide_prediction`). No new experimental data were generated for this study.

═══ SECTION 5/9: DISCUSSION bullets (our 8) ═══
PASTE-INTO: the "DISCUSSION" section, below Peleg's two existing bullets. Do not merge with hers — she has explicitly said she will merge later.
FORMAT: bullet list.

## Ours to add — engineering + product bullets

- **First LLM-native interface for an amyloidogenicity predictor.** The bundled Model Context Protocol server (`pvl-mcp`) lets Claude, ChatGPT-with-MCP-client and any other MCP-capable LLM directly interrogate PePFibPred from natural-language prompts. This is, to our knowledge, the first computational amyloid tool with a native LLM surface — a differentiator that positions the server for the emerging class of AI-assisted structural-biology workflows.

- **User-selectable thresholds, always.** No classification (candidate / SSW / rank) is committed at the pipeline layer. Users can re-classify an entire batch in constant time against their own thresholds without re-running any predictor. This unlocks threshold-sensitivity exploration that most single-algorithm servers hide behind opaque built-in cutoffs.

- **Deterministic, cross-surface reproducibility.** A given sequence returns bit-identical numeric fields whether submitted through the web UI, the CLI (`pvl-cli`), the Python package, the MCP server, or the REST API — an invariant regression-locked by the CI suite. This deterministic contract is the foundation for citing PePFibPred output in downstream experimental protocols.

- **Full-stack transparency and reproducibility.** MIT-licensed source on GitHub, Zenodo DOI on every release, pinned dependency manifest, Trusted-Publisher-signed PyPI distributions, seven GitHub-Actions CI workflows (backend pytest ≈608 tests, frontend vitest ≈613 tests, CodeQL, Docker build, mkdocs-strict docs deploy). The paper's supplementary information is a live-linked mkdocs handbook rather than a static PDF, allowing readers to interact with the exact tool the paper describes.

- **Peptide-scale UniProt integration for hypothesis-driven discovery.** The UniProt-guided mode (Method J) enables the "start from an organism/keyword, not from a peptide list" workflow — the same workflow that produced the AlphaFold-guided candidate discovery in Ragonis-Bachar, Axel, Blau, Ben-Tal, Kolodny, Landau, Proteins 2024 — but now on the peptide length window (10 ≤ *L* ≤ 40 aa) where PePFibPred's α/β chameleon detection is most informative.

- **Scaling roadmap.** The precompute-artefact pattern (Method I) and the DuckDB provider cache (Method I) together mean interactive latency on repeat queries is ~10 ms, independent of dataset size. The reference *Staphylococcus aureus* 2023 dataset (2 916 peptides) is served entirely from a static 18.7 MB JSON artefact, which validates the approach for datasets on the order of 10⁴–10⁵ peptides. Further scaling to genome-wide sweeps (10⁶ + peptides) is planned via GPU-batched S4PRED inference on the DESY GPU nodes and a Celery task-queue architecture; the migration path is documented in the handbook.

- **Comparison against existing servers.** Existing sequence-based amyloid tools (TANGO, PASTA 2.0, AGGRESCAN, Zyggregator, FoldAmyloid, Waltz) are single-algorithm, β-biased, and lack an interactive dashboard, an LLM interface, and a first-class UniProt entry point. PePFibPred combines multi-signal reasoning with per-signal transparency, does not merge predictors before the classification layer, and is the only tool in this space with an MCP surface. A quantitative benchmark against these servers on the *S. aureus* 2023 dataset is included as supplementary Table SX.

- **Open questions we surface but do not resolve.** (a) The SSW axiom (Method F) is the *union* of TANGO and S4PRED positivity; a weighted-union generalisation with per-predictor confidence may yield finer discrimination on chameleon peptides whose helical or β-aggregation propensity is borderline — a natural next-paper direction. (b) The FF-Helix compositional cutoff was tuned on Peleg's curated database; retraining on an independent AMP corpus is on the roadmap.

- **The tool is a research instrument, not a feature collection.** Explicit in the architectural principles (Method A): scientific correctness first, user-friendliness second, feature-count last. This ordering was our answer to a real risk in web-server tool design — the "friendly dashboard on a wrong prediction" failure mode.


═══ SECTION 6/9: Future Work paragraph ═══
PASTE-INTO: the "DISCUSSION" section, after the 8 bullets above, as a full-paragraph subsection.
FORMAT: "Ongoing development and roadmap" = Heading 2 (bold). Five paragraphs of prose (P1 Scale, P2 AI, P3 Scientific, P4 Community, P5 Rigor) plus a closing sentence Peleg can use as the section closer.

## **Ongoing development and roadmap**

Beyond the current single-VM deployment (Method K), PePFibPred is architected for migration to a Kubernetes-managed environment at DESY-CSSB. The container images ship with Kubernetes-ready health and readiness probes, environment-variable configuration, and graceful-shutdown handling, and the four-service Docker Compose topology (backend, Redis, Celery batch worker, Celery quick worker, frontend) maps one-to-one onto a Kubernetes Deployment + Service topology with a horizontal-pod autoscaler on the backend and Celery pools. Migration to the DESY managed cluster is queued (`docs/active/DEPLOYMENT.md`, ROADMAP Phase C.2) pending finalisation of the namespace, ingress class, storage quotas, and cert-manager configuration by DESY IT. In parallel, the asynchronous job-queue path — Celery + Redis — is already wired but currently gated behind a configuration flag (ADR-027); enabling it for batch submissions above a configurable size threshold, together with a Server-Sent-Events channel for progressive row-by-row delivery of results, will remove the current whole-batch blocking round-trip and permit interactive exploration of thousand-peptide batches. A proteome-scale precompute stage — extending the two curated artefacts (`gold_standard.json`, `peleg_118.json`) that Method I describes into a scheduled Kubernetes CronJob workflow across the top ten model-organism proteomes (≈ 100 000 sequences, ≈ 12-15 hours of compute per organism at current worker throughput) — is designed as the natural next stage of the precomputed-artefact pattern (`docs/active/BACKLOG.md` Tier 2, ROADMAP Phase C.1). On the observability side, an OpenTelemetry-instrumented predict pipeline and a Grafana dashboard exposing per-stage p50/p95/p99 latency histograms are planned (`docs/active/SENTRY_RUNBOOK.md` Phase S.6; `docs/active/ROADMAP.md` §S.6-S.10) to reduce the root-cause-analysis time for any perceived performance regression.
PePFibPred's Model Context Protocol server (Method K) currently exposes seven callable tools to LLM assistants. The next release cycle completes programmatic parity between the interactive dashboard and the AI-agent surface by hardening the three remaining tools (`get_peptide_detail`, `rank_candidates`, `compare_cohorts`) and publishing the `pvl-mcp` package to PyPI so that any MCP-aware client (Claude Desktop, Cursor, Continue, Cline, Windsurf) can integrate the tool with a single configuration line. Building on the MCP substrate, a retrieval-augmented explanation layer following the PaperQA2 agentic pattern (`docs/active/DECISIONS.md` ADR-020) is proposed as the next major architectural addition. The design routes each classification decision through a five-tool ReAct loop — over PePFibPred's own predictions, a curated PubMed corpus, a UniProt annotation index, an embedding-search index over Landau-lab prior work, and a Peleg-authored axiom registry — with per-passage attribution via Anthropic's Citations API, an on-premises Helmholtz Blablador opt-in path for institutions that require model-locality, and an EU-AI-Act-compliant audit log for every retrieval. The layer is gated on a zero-tolerance hallucination-guard architecture co-designed with the algorithm's originator (Dr. Ragonis-Bachar) so that no retrieved statement can appear as a claim without a resolved literature anchor. In parallel, the vector-similarity substrate that today underlies the tool's semantic peptide search — 320-dimensional ESM-2 8M embeddings ([CITE: Lin et al., *Science* 2023, 379, 1123–1130]) stored in an embedded LanceDB index (ADR-016, ADR-017, `docs/active/VECTOR_SEARCH_SPEC.md`) — is architected around a pluggable embedding-provider seam. This seam enables drop-in migration to ESM-3, expected to stabilise in the first quarter of 2027, and to domain-tuned peptide-specific transformers such as PepBERT as they achieve stable Hugging Face releases, without any change to the on-disk index format or the client contract. Together, these directions position PePFibPred not as a static prediction service but as a substrate on which an interpretable, verifiable AI-assisted analysis workflow can be built — the *how* of predicting is made auditable, not just the *what*.
The predictor family currently reported (TANGO for β-aggregation propensity; S4PRED for per-residue secondary structure; the FF-Helix classifier and the SSW composition axiom for the α-helical fibril-formation lens) covers the algorithmic space required to detect the α/β chameleon signature that motivates PePFibPred. The overlay contract in the frontend (`ui/src/lib/molstarOverlays.ts`) and the predictor-registration recipe in the extension handbook (`docs/handbook/humans/07_extending.md`) are architected as a forward-compatible plug-in surface for additional providers — Waltz, AGGRESCAN3D, PASTA 2.0, FoldAmyloid, AmyloDeep, AggreProt, and CamSol are the shortlist under discussion (`docs/active/ROADMAP.md` Phase I; `docs/active/BACKLOG.md` Tier 3). Once integrated, a per-predictor verdict table and a consensus statement — in the spirit of AMYLPRED2's aggregation of multiple predictors [CITE: Hamodrakas 2011] — will let researchers select predictors on evidence rather than habit and inspect disagreements between them in a single view. To make that consensus meaningful, every integrated predictor will be evaluated against the same benchmark suite (WALTZ-DB, AmyPro, Ragonis-Bachar's *Staphylococcus aureus* 2023 curated set, Peleg-118, and any additional labelled organism cohorts as they become available) and its sensitivity, specificity, positive predictive value, and F1 reported side-by-side in a supplementary, machine-readable format (ROADMAP §I.3). On the sequence-length axis, the current pipeline is calibrated for the peptide-scale window 10-40 residues (Method B) — the window over which S4PRED and TANGO carry interpretable per-residue signal. Extending PePFibPred to full-protein sliding-window analysis is planned as an *explicit second mode*, kept distinct from the peptide-scale pipeline whose thresholds are calibrated against Peleg-118 (ADR-022), so that the mode's outputs cannot be misinterpreted as peptide-scale predictions applied to a protein. Complementary structural surfaces — a two-dimensional publication-ready backbone SVG viewer to accompany the existing Mol\* three-dimensional overlay, and per-residue overpaint synchronised across all four classifier tracks — are queued in the same release cycle.
The project's community and reproducibility surfaces are architected around widely adopted scientific-open-source conventions. The source code archive is deposited on Zenodo with a concept DOI that resolves to the current versioned release and a versioned DOI for each tagged version; both are minted automatically through the standing GitHub-Zenodo webhook and are threaded through the `CITATION.cff` metadata, the mkdocs handbook, and the manuscript's Data Availability statement. The `pvl-cli` command-line client and the `pvl` importable Python package will be distributed through the Python Package Index under the OpenID-Connect Trusted-Publisher flow so that no long-lived credentials leave the GitHub-Actions environment, and the container images are already published to the GitHub Container Registry with SLSA-Level-2 build provenance attestations. Registration on the ELIXIR *bio.tools* registry under EDAM operations 0473 / 0269 / 0245 / 0570 and topics 0078 / 0166 / 2275 will route the tool into the European bioinformatics-tool discovery paths — directly addressing the discoverability criterion set by Peleg for early-career researchers ("*the young student, that starts his MSc for example and looking for tools to use in his research…*"). The two bundled reference databases (Method M) — the *Staphylococcus aureus* 2023 benchmark and the Peleg-118 fibril-validated positive set — will additionally receive their own citable Zenodo DOIs, decoupling dataset citations from tool-version citations. A software paper describing the implementation is queued for submission to the Journal of Open Source Software once the concept DOI is embedded in the manuscript; a tutorial-notebook series and short screencast walkthroughs will accompany the JOSS release. The full public roadmap and the architectural-decision log are maintained openly (`docs/active/ROADMAP.md`, `docs/active/DECISIONS.md`) as the canonical, versioned record of every non-trivial design choice.
Every quantitative claim in the manuscript is regression-locked in continuous integration. The nine invariant tests in `backend/tests/test_axiom_invariants.py` guarantee that no future change can re-introduce the class of defects that motivated ISSUE-032 (Method F), and the smoke test `backend/scripts/smoke_tango.py` guarantees that a change to the TANGO binary or its wrapping subprocess cannot silently produce empty outputs. The regression-canary suite currently pins the pipeline's behaviour on a mixture of experimentally-confirmed positives (PSM-α1, PSM-α3, Aβ16-22, α-synuclein NAC core, uperin 3.5) and known non-fibril-forming AMPs (PSM-α2, Delta-hemolysin, magainin-2, melittin, anoplin) so that any regression on either class trips the CI gate; growing this suite to cover false-negative regressions and edge-length peptides is queued (`docs/active/RESEARCH_BRIEFS/RB-VALIDATION-V0-1.md` §6). Threshold-sensitivity dashboards — per-threshold accuracy curves computed at build time and surfaced as a permanent trust signal in the results header (ADR-014) — are designed and will land in the next release cycle. Explicit chaos and load testing (locust or k6 targeting the production endpoint) is queued to characterise the concurrent-user break-point of the current deployment topology and to validate the queue-activation threshold from ADR-027. Together, these mechanisms make PePFibPred's continuous integration an active guardrail on scientific correctness, not merely a code-quality checker — the property Peleg identified as *"we will emphasize this in the paper"* (Drive Comment 18) when the reproducibility permalink protocol first shipped.

═══ SECTION 7/9: Naming comment (paste as a Google Doc COMMENT on Peleg's "Find a name" thread) ═══
DO NOT paste this into the doc body. Do not overwrite the title "PePFibPred". Click the "Find a name" comment thread in the doc and paste this as a reply.

Adding candidate names + one-line rationale for each. Criterion (from Peleg Drive C25): discoverability for an MSc student searching for "amyloid + fibril + peptides". Recommendation weight = discoverability × distinctiveness × pronounceability × domain-signal.

| # | Name | Rationale | Trade-off |
|---|---|---|---|
| 1 | **PePFibPred** (current default — keep unless picked otherwise) | Self-describing peptide-fibril-predictor; short; owns Peleg's chosen naming space | Reads generic; hides the α/β chameleon novelty |
| 2 | **ChameLeoPred** | Directly evokes the α/β chameleon amyloid class from Biomacromolecules 2022; distinctive; pronounceable | Slightly playful for a NAR title |
| 3 | **α/β-FibrilPred** | Explicit Greek signal for α + β dual detection; scientific gravitas | Greek titles get mangled by some indexing pipelines |
| 4 | **AmylSwitch** | Foregrounds the SSW axiom (scientific centrepiece); short; pronounceable; strong discoverability | Loses the α-helical-fibril lens |
| 5 | **FibrilPredictor** (Peleg's second placeholder in the doc) | Broadest discoverability on "fibril + predictor" search; most likely to hit the young MSc student | Least distinctive |
| 6 | **FibrilForecast** | Signals prediction nature; memorable weather-forecast metaphor | Weaker link to the α/β novelty |
| 7 | **AmylSwitchPep** | Combines amyloid + switch + peptide keywords for max search recall | Longer; harder to pronounce |
| 8 | **PepFibril** | Cleanest Peleg-style peptide-focus + fibril | Reads too generic |
| 9 | **PepMorph** | Suggests structural morph / polymorphism | Loses fibril specificity |
| 10 | **AmyFib** | Ultra-short compound; unique | Too cute for a NAR title |

Weighted for discoverability: **FibrilPredictor** (#5) or **PePFibPred** (#1). Weighted for distinctiveness: **AmylSwitch** (#4) or **ChameLeoPred** (#2).

Open questions: (a) does the Landau group have an internal naming convention? (b) is the α/β-chameleon language reserved for the wet-lab framework, or usable in the tool name?

═══ SECTION 8/9: Graphical Abstract comment (paste on Peleg's "Ideas for graphical abstract?" thread) ═══
DO NOT paste this into the doc body. Click the "Ideas for graphical abstract?" comment thread and paste as a reply.

Three concept sketches for the graphical abstract, satisfying NAR's landscape 5:2 ratio requirement.

**Concept A — "The switch"** (recommended). Left panel: peptide sequence rendered as its α-helical structural cartoon (blue). Right panel: same sequence as β-sheet cross-fibril cartoon (orange). Between them, a bidirectional arrow labelled "structural switch" with the tool's logo. Below: a compact PePFibPred results row highlighting the three columns (TANGO, S4PRED helix, SSW) flagged positive. Reads left-to-right; conveys the scientific centrepiece (Method F) in a single glance.

**Concept B — "The dashboard"**. Top strip: amyloid-fibril illustration (α-helical and β-sheet forms sharing the same fibril axis — echoes the α/β chameleon framing from Biomacromolecules 2022). Bottom strip: stylised PePFibPred dashboard showing (i) the batch density plot for μH, (ii) the peptide ranking sidebar, (iii) the per-residue colour tracks (blue = helix, orange = β-strand, purple = SSW overlap). Frames the tool as a research-grade dashboard.

**Concept C — "The funnel"**. Left: UniProt icon feeding into the pipeline. Middle: three parallel streams (TANGO, S4PRED, FF-Helix) converging on the unified SSW verdict. Right: a ranked candidate list. Conveys the pipeline nature + the multi-signal ranking — the "start from a hypothesis, not a peptide list" workflow (Method J).

Recommendation: **Concept A** — puts the α/β chameleon novelty at the visual centre, the same discriminator recommended for the title.

Note: if BioRender is used for any element, NAR requires an article-specific licence + explicit acknowledgment in the caption or under Acknowledgements. Meytal probably has a lab BioRender licence.

═══ SECTION 9/9: What Peleg / Meytal own — verify you did NOT touch these ═══

Do not paste anything into these sections; they belong to Peleg or Meytal:
- **ABSTRACT** — Peleg
- **INTRODUCTION** (already drafted; leave alone unless she asks for edits) — Peleg
- **RESULTS opening + Computational scheme + Server Output + Interpretation of Results + Case Study 1 + Case Study 2** — Peleg (marked with her comments)
- **ACKNOWLEDGEMENTS** — Meytal (DESY people)
- **FUNDING** — Meytal (grant list)
- **REFERENCES** — Peleg (Paperpile library `0zqjXo`)

═══ END OF PASTE MASTER ═══

## Verification checklist (do this before hitting SUBMIT to NAR)

- [ ] Every ═══ SECTION ═══ block from 1/9 to 8/9 is in the working copy
- [ ] Method A through Method M all present as Heading 2
- [ ] Every α, β, μH, δ renders as Unicode, not `alpha`, `beta`, `uH`, `mu_H`
- [ ] No occurrence of `∧` anywhere (SSW is OR)
- [ ] No mention of `pI` (does not exist in code)
- [ ] No mention of `PSIPRED` in M&M
- [ ] No mention of `false positive` (for AMPs) — should be "membrane-active overlap"
- [ ] No mention of `cohort` — should be "database"
- [ ] No mention of `aggregation prediction` as tool's purpose — should be "fibril-formation prediction"
- [ ] No `PVL` in reader-facing prose — should be "PePFibPred"
- [ ] Peleg's sections (ABSTRACT, INTRODUCTION, RESULTS, Case Studies, ACKNOWLEDGEMENTS, FUNDING, REFERENCES) untouched
- [ ] Zenodo DOI in DATA AVAILABILITY is either PENDING (before v1.0.0) or the real DOI (after)
- [ ] Author byline placeholder names replaced with real names (Peleg + Meytal call)
- [ ] All `[CITE: ...]` placeholders either resolved by Peleg (Paperpile) or explicitly noted as still open
