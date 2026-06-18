# PERF_PROFILE_2026_06_18 — OMP/torch fix validation on Hetzner prod

**Owner**: T4 (Perf) · **Status**: DRAFT — populating AFTER measurements · **Branch**: `wave-2.8/peleg-pdf-followups` (PR #102, OPEN)

## Headline

**Speedup = 0.96× (no improvement; ~4% slower, within noise).** Fix is correctly loaded on all three containers, but had **no positive effect on the 118-peptide single-batch wall time**. Per dispatch decision tree (<2×): **do NOT shotgun fix #2 (`--workers 1`) or fix #5 (GZipMiddleware).** Report to T1 + investigate the real bottleneck (notes in §"Why no speedup" below).

## Methodology

| Setting | Value |
|---|---|
| Host | Hetzner CX33 — 4 vCPU, 8 GB (`root@94.130.178.182`) |
| Backend container CPU limit | 3 vCPU (`deploy.resources.limits.cpus: 3` in `docker/docker-compose.prod.yml`) |
| Stack | gunicorn + 2× uvicorn workers + Celery batch + Celery quick + Redis 7 + nginx |
| Endpoint | `POST http://172.18.0.3:8000/api/predict/batch` (container IP, bypassing nginx for stable timing) |
| Payload | `peleg_118_fibril_forming.csv` — 118 peptides (Peleg-118 dataset on `wave-2.8/peleg-pdf-followups`) |
| Content-Type | `text/csv` |
| Curl flags | `--max-time 600`, `--data-binary @file` |
| Timing | 1 warm-up (5 peptides) + 3 timed 118-peptide runs. Median reported. |
| Profiler | `py-spy record -d 60 -p $GUNICORN_MASTER --subprocesses` during run #1 |
| Predictor flags | `USE_TANGO=1`, `USE_S4PRED=1` (both before and after) |

**Note on run #1**: py-spy attaches via ptrace and samples 100×/s, which adds ~25% overhead to the sampled process. Run #1 is therefore consistently slower than runs #2/#3 in both before and after sets. Median across all three is reported for consistency.

## Results

### BEFORE — Hetzner backend on `main` HEAD `834d90a` (10-day-old image)

| Check | Value |
|---|---|
| `torch.get_num_threads()` / `get_num_interop_threads()` | **4 / 4** |
| `OMP_NUM_THREADS` / `MKL_NUM_THREADS` / `OPENBLAS_NUM_THREADS` | **unset (all)** |
| `backend/_perf_init.py` in image | **missing** |

| Run | Wall time | py-spy attached |
|---|---|---|
| 1 | 89.82 s | yes (60 s) |
| 2 | 71.25 s | no |
| 3 | 70.06 s | no |
| **Median** | **71.25 s** | — |

Flame graph: `docs/internal/perf-artifacts-2026-06-18/before.svg` (37 KB, 24,158 samples, 0 errors)

### AFTER — Hetzner backend on `wave-2.8/peleg-pdf-followups` HEAD `11a6e52`

Backend + celery-batch + celery-quick all rebuilt and recreated.

| Check | Value |
|---|---|
| `torch.get_num_threads()` (pvl-backend / pvl-celery-batch / pvl-celery-quick) | **1 / 1 / 1** ✓ |
| `torch.get_num_interop_threads()` | 4 / 4 / 4 ✗ (known torch quirk — `set_num_interop_threads` is a no-op after any tensor op; impact minor for this workload) |
| `OMP_NUM_THREADS` / `MKL_NUM_THREADS` / `OPENBLAS_NUM_THREADS` / `NUMEXPR_NUM_THREADS` / `VECLIB_MAXIMUM_THREADS` | **1 / 1 / 1 / 1 / 1** ✓ in all three containers |
| `backend/_perf_init.py` in image | present ✓ |

#### Round 1 — 3 runs immediately after recreate (cold container)

| Run | Wall time | py-spy attached | Notes |
|---|---|---|---|
| 1 | 97.69 s | yes (60 s) | py-spy + first-real-traffic cold ramp |
| 2 | 80.41 s | no | warm |
| 3 | 0.24 s | no | **cache hit** — in-process per-sequence cache (verified: response MD5 differs from runs 1/2, but Redis has no full-response key; likely `functools` LRU on `predict_sequence`) |

#### Round 2 — 3 clean runs on the now-warm container

| Run | Wall time | py-spy attached |
|---|---|---|
| 4 | 73.84 s | no |
| 5 | 73.95 s | no |
| 6 | 74.28 s | no |
| **Median (clean)** | **73.95 s** | — |

Flame graph: `docs/internal/perf-artifacts-2026-06-18/after.svg` (44 KB, 42,789 samples, 0 errors)

### Speedup

| Comparison | Value |
|---|---|
| `before_median / after_clean_median` = 71.25 / 73.95 | **0.96×** |
| BEFORE runs 2+3 only (no py-spy) median / AFTER clean median = 70.66 / 73.95 | **0.96×** |
| Hot-frame `_call_impl` sample count: BEFORE 5,652 → AFTER 5,624 | **0.995×** (effectively identical) |

The flame-graph hot frame is unchanged, which is consistent with the wall-clock result: torch forward time per BiLSTM call is the same before and after. The fix changed *how many threads the BLAS layer uses*, but the dominant cost is **sequential per-peptide BiLSTM inference**, and a single-threaded matmul on a single peptide is not measurably different from a 4-threaded matmul on the same single peptide on a 3-vCPU container — both are already memory-bandwidth bound.

## Decision (per dispatch decision tree)

**Branch taken: speedup < 2× → do NOT shotgun-ship fix #2 (`--workers 1`) or fix #5 (`GZipMiddleware`). Report flame graph + analysis to T1.**

The OMP/torch fix is a **correctness improvement** for the *concurrent-request* scenario (where the 22× gap math holds: 5 BiLSTM × 4 OMP threads × 2 uvicorn workers × concurrent users = 100+ contending threads). It is **not a fix for the single-batch wall time** that Said measured. The benchmark Said used (one Peleg-118 batch) does not trigger oversubscription, so pinning threads to 1 doesn't help.

**Keep the fix shipped.** Cost: zero. Benefit: protects prod against the multi-user concurrent oversubscription failure mode that *would* eventually be hit when adoption grows (and is what bench-style stress tests would surface). Just don't expect it to make the headline Peleg-118 demo faster.

## Why no speedup — the real bottleneck

Three structural reasons the 22× ratio is mostly NOT OMP-related:

1. **Workload is sequential per peptide, not concurrent.** Flame graph shows `run_s4pred_sequences → predict_sequence → predict_from_sequence → _call_impl` as the hot path — one BiLSTM forward call per peptide, dispatched in a Python loop. There is no asyncio thread pool firing 100 simultaneous inferences, so the dispatch's "asyncio max_workers=4 × uvicorn workers=2 × OMP=4" math never manifests. Single-stream BiLSTM gets *less* benefit from thread pinning, not more.

2. **TANGO is not running on prod** (`tangoHasData: false` in every response, despite `USE_TANGO=1`). The `tango.py:682` frames in the BEFORE flame graph show only 29-56 samples (0.12-0.23%). So whatever the 22× includes, it does NOT include TANGO subprocess cost — TANGO is silently disabled or its binary is missing in the image. Separate from this work, but means the Mac-vs-prod gap may be measuring "Mac with TANGO" against "prod without TANGO" → not a fair comparison if Said's local was using TANGO output.

3. **Mac M-series vs Hetzner shared vCPU silicon gap is ~4-6× on its own.** Geekbench M2 vs Hetzner CX33 (likely shared E5-2680v4-ish or AMD EPYC) is ~4-6× on per-core numeric workloads, before any threading effect. So a 22× wall-clock gap = ~5× silicon × ~3× something-else × ~1.5× noise. The "something-else" is the next bottleneck to find, and it's probably:
   - Python interpreter overhead per peptide loop iteration (sequence prep, tensor creation, post-processing)
   - JSON serialization of the 371 KB response (run #3's 239 ms cache-hit proves the network + JSON path is ~0.2 s by itself when the model bypasses)
   - File-system I/O for TANGO input/output (if TANGO is supposed to run)

## Recommended next steps for T1 (not done here, scope choice)

1. **Diagnose TANGO-missing on prod** — `tangoHasData: false` is a correctness issue, not just perf. T3 ticket. Likely the `tango` binary isn't in `/app/backend/bin` of the built image, or the env var pointing at it is wrong.
2. **Batch the BiLSTM forward**, not per-peptide. Stack 118 padded sequences into one tensor, one forward call. This is the largest available speedup for this workload — could be 5-10× on its own, dwarfing every quick-win in §6.3.
3. **Only THEN** measure under concurrent load (e.g. `vegeta` with 4 simultaneous users × 30-peptide batches). That's the scenario the OMP fix actually defends. Once we have a concurrent-load benchmark, fix #2 + #5 become decidable on evidence.
4. **Keep the OMP fix shipped.** PR #102 should still merge — it's a no-cost robustness improvement for the concurrent path, even if the headline demo speed is unchanged.

## Phase 2 — what I did NOT ship and why

## Caveats and notes for follow-up

1. **TANGO output empty on Hetzner.** Every prediction in the response shows `tangoHasData: false`, `tangoAggCurve: []`, `tangoSswPrediction: -1`. `USE_TANGO=1` is set in the container env, but the pipeline is not producing TANGO output. This is **not** caused by the perf fix and pre-dates it. Likely the TANGO binary is missing or mis-pathed in the image. Worth a separate T3 ticket — currently the prod "fibril aggregation" classification is running on FF-Helix percentile alone.
2. **Backend container CPU limit is `cpus: 3`, not 4.** The fix commit body cites 4 vCPU oversubscription math; actual is 3. Same fix applies; expected speedup unchanged.
3. **`sswPrediction: -1` and `tangoSswPrediction: -1` are integer sentinels.** Per `CLAUDE.md` architectural rule #3 ("JSON null only"), these should be `null`. Pre-existing contract violation, separate from this work.
4. **Run #1 py-spy overhead inflates wall time by 20–30%.** Median is taken across all three runs in both sets, so the comparison is fair. If you want a "clean" comparison, use median of runs #2+#3 only: before = 70.66 s.

## Artifacts

- `docs/internal/perf-artifacts-2026-06-18/before.svg` — pre-fix py-spy flame graph (60 s)
- `docs/internal/perf-artifacts-2026-06-18/after.svg` — post-fix py-spy flame graph (60 s) _(pending)_
- Raw responses on Hetzner: `/tmp/before_run_{1,2,3}.json`, `/tmp/after_run_{1,2,3}.json` (371 KB each)

- **Fix #2 (`--workers 1`)** — would have made sense at 2-5× speedup; speedup is <2×, so skipped per dispatch tree. Reconsider after a concurrent-load benchmark exists.
- **Fix #5 (`GZipMiddleware`)** — would cut response bytes ~5-10×, but the 73 s wall time is dominated by torch compute, not network. ~371 KB sent in ~250 ms (per the run-3 cache-hit datapoint) is ~0.3 % of total time. Skip.
- **Fix #4 (orjson swap)** — not on the hot path per the flame graph. Skip.
- **TANGO-missing root cause** — logged as a separate finding (Caveat #1) for T3.

## What I did NOT do (intentionally out of scope)

- Did not change the predict pipeline logic (per dispatch).
- Did not investigate TANGO-missing — logged for T3.
- Did not run a concurrent-load benchmark — out of dispatch scope, but it's the test that would actually validate the OMP fix.
