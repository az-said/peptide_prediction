# Future Tech Suggestions — Keeping PVL Scalable

> Said asked: *"the code doesn't get us stuck with one type of technology since technology is emerging and there are better tools day after day."* This doc is my honest read on where PVL is well-positioned to evolve, where the risky lock-ins live, and specific bets the next developer should consider between 2026 and 2030.
>
> Every suggestion is a hypothesis, not a plan. Weigh each against BACKLOG Tier 0-4 priorities before executing.

---

## What PVL got right (things NOT to change)

Before recommending upgrades, credit the parts of the stack that will still be correct in 5 years:

### 1. The three-decoupled architecture
Backend (Python + FastAPI) ⇔ Contract (Pydantic + `api_models.py`) ⇔ Frontend (TypeScript + React). Nothing crosses this line without going through Pydantic. The next developer can swap **either side** independently without breaking the other. This is the single most important architectural bet PVL made.

### 2. The 5-surface ecosystem
Web / CLI / Python package / MCP / Docker each consume the same REST contract. When a *sixth* surface emerges (say, a Slack bot, a WhatsApp integration, a JupyterHub extension), it slots in as another API consumer with zero backend changes. See `ECOSYSTEM_GUIDE.md`.

### 3. The precompute + cache layer
Reference datasets ship as pre-computed JSON artifacts served by a dedicated endpoint. Live-pipeline paths fall back gracefully. This pattern generalises to *any* long-running scientific computation. Copy it for new predictors.

### 4. The ADR log
Every decision recorded. When a future dev asks "why is X the way it is?" they get an answer instead of guessing. Keep adding ADRs.

### 5. TypeScript everywhere on the frontend
The 4-class classification is enforced at the type layer (`Peptide` interface). Mis-typed access fails at compile time. Do not migrate to JavaScript to save build time.

**Don't change any of the above.** They're the stable foundation.

---

## Where PVL is at risk of tech lock-in

### Risk 1: Docker Compose vs Kubernetes
Docker Compose is fine for one-VM deploys. It falls off a cliff at 2+ VMs, autoscaling, or blue-green deploys. The K8s manifest skeleton is in `DEPLOYMENT.md` but never applied.

**Suggested bet:** when PVL starts handling > 1,000 requests/day on the DESY VM, migrate to K8s. The Kustomize migration is spec'd in `DEPLOYMENT.md §K8s plan`. Do it *before* you need it — migrating under load is painful.

### Risk 2: LanceDB + ESM-2 for vector search
The vector-search architecture (ADR-016, ADR-017) is one implementation choice among many. LanceDB is embedded — great for a single node, bad for horizontal scaling. ESM-2 is 8M params — small enough to run on CPU, but rapidly being displaced by newer protein language models (ESM-3, PLM-Blender, ProGen2).

**Suggested bet:** treat `services/vector_store.py` as a pluggable adapter. When a better embedding model ships (probably ESM-3 by 2027), add it as a new provider under the same `PredictorProvider` protocol. Same for the vector index — LanceDB → Qdrant when the fleet goes multi-node.

### Risk 3: TANGO Fortran binary
TANGO 2.3 (2004) still works but is a Fortran binary vendored under `tools/tango/bin/`. When TANGO 3 ships (or a modern replacement — AGGRESCAN-3D, PASTA 2.0, ArchCandy) the switch is straightforward *because* the interface is a subprocess call.

**Suggested bet:** the multi-predictor Tier-3 backlog item (see `BACKLOG.md`) adds Waltz + AGGRESCAN + PASTA as parallel providers. When they land, TANGO becomes one of many, and the researcher picks based on their peptide class. The `OverlayType` union in `ui/src/lib/molstarOverlays.ts` is already forward-compatible — the frontend cost is a new provider registry entry.

### Risk 4: Recharts vs a modern chart library
`Recharts` is the current frontend chart library. It's fine, but scaling to > 10K data points per chart is slow. When PVL needs to show 100K-peptide comparisons, Recharts will feel it.

**Suggested bet:** for high-density plots, migrate to `visx` or `deck.gl`. Keep Recharts for everything under 5K points. The pattern from `AggregationHeatmap.tsx` (SVG for small datasets, canvas fallback for large) is the right template.

### Risk 5: FastAPI is single-threaded per worker
FastAPI runs on uvicorn; each worker is one process. Scaling to 100 concurrent requests means running 100 workers, which OOMs the VM. Gunicorn + `--preload` (already in place) helps but has an upper bound.

**Suggested bet:** when concurrency demands exceed the VM, add an ASGI-native queue (`nats` or `redis-streams`) between the API and the predictors. The predictor becomes a worker fleet, the API stays lean. This is essentially the "async job queue at scale" backlog item (`BACKLOG.md` Tier 2) — do it before you need it.

---

## Specific 2026-2030 bets to consider

Each bet lists what it buys, what it costs, and when to trigger.

### Bet 1: Add a `pvl-cli` distribution to PyPI
**Cost:** ~1 hour when the trusted publisher is registered. Already scaffolded in `.github/workflows/publish-pypi.yml`.
**Buys:** researchers can `pip install pvl-cli` from any Jupyter notebook. Reproducible in supplementary materials.
**Trigger:** when the first external researcher asks how to install the CLI.

### Bet 2: Add a `pvl-mcp` distribution to PyPI
**Cost:** same as Bet 1. Trusted-publisher pending.
**Buys:** any MCP-aware LLM client (Claude Desktop, Cursor, Continue, Cline, Windsurf) can integrate PVL with one config line.
**Trigger:** when the first LLM-tooling dev asks how to expose PVL to their agent.

### Bet 3: Move the reference datasets to a Zenodo record
**Cost:** 20 minutes.
**Buys:** the Peleg-118 + Gold-Standard sets become citable independent of PVL. Zenodo DOI per dataset. Paper Methods section becomes cleaner (cite dataset DOI, not "downloaded from the PVL repo").
**Trigger:** before JOSS submission.

### Bet 4: Adopt Astral's `uv` for Python dep management
**Cost:** 2 hours + a CI workflow rewrite.
**Buys:** ~10× faster `pip install` on CI. Deterministic lockfile (`uv.lock`) that survives dep bumps. Future-proof against pip's slow evolution.
**Trigger:** when a CI run exceeds 5 minutes. Or when a Dependabot batch breaks reproducibility.

### Bet 5: Replace `httpx` in `pvl-cli` with an async httpx pool
**Cost:** 4 hours.
**Buys:** batch mode can hit the API concurrently rather than serially. 10× faster for 100-peptide batches from the CLI.
**Trigger:** when a batch script user complains about wall-clock.

### Bet 6: Add a Rust hot-path for the biochem calculations
**Cost:** ~2 weeks including PyO3 bindings + tests.
**Buys:** 100× faster biochem calc for very large batches. The Rust code becomes shareable across `pvl-cli` and the backend.
**Trigger:** when biochem calc is a measurable perf bottleneck (currently it's not — TANGO + S4PRED dominate).

### Bet 7: Wire the ESM-3 embedding provider
**Cost:** ~1 week including tests + the provider adapter pattern.
**Buys:** ~10× better retrieval quality for the vector-search side panel. State-of-the-art embeddings.
**Trigger:** when Meta releases ESM-3 (Q1 2027 expected) — or earlier if a third-party opens the weights.

### Bet 8: WebGL-accelerated aggregation heatmap
**Cost:** ~1 week.
**Buys:** the heatmap for 40-residue peptides is fine on SVG; for 500-residue full proteins it's slow. WebGL renders 10K residues at 60fps.
**Trigger:** when PVL adds full-protein support (long-term, currently capped at 40 aa per ADR-022).

### Bet 9: Adopt bun + biome for the frontend build chain
**Cost:** 4 hours.
**Buys:** ~3× faster CI. Simpler lint config (biome replaces ESLint + Prettier). Faster `npm install`.
**Trigger:** when frontend CI wall-clock crosses 4 minutes.

### Bet 10: Add a WebAssembly TANGO frontend
**Cost:** ~1 month — port TANGO to WASM.
**Buys:** researchers can run TANGO in the browser without a backend. Full offline mode. Deploys anywhere with static hosting.
**Trigger:** when someone asks to run PVL without a server. Probably a long-term (2028+) bet.

### Bet 11: Add server-sent events for progressive results
**Cost:** ~1 week (spec'd in `BACKLOG.md` Tier 1).
**Buys:** the frontend can render rows as they finish rather than waiting for the whole batch. Perceived speed improves dramatically for large batches.
**Trigger:** when a researcher complains about the wait for 1K+ peptide batches.

### Bet 12: Migrate `PeptideTable` from client-side sort/filter to virtualization
**Cost:** ~3 days.
**Buys:** 100K-row tables render smoothly. Currently the tables get sluggish at ~5K.
**Trigger:** when PVL adds a "load whole UniProt subset" workflow.

### Bet 13: Add a Grafana dashboard for the perf timers
**Cost:** ~2 days.
**Buys:** the stage timers wired via `services/perf_logger.py` become visible in real time. The next perf regression is spotted in one glance.
**Trigger:** now-ish. This is a huge quality-of-life win for the on-call dev.

### Bet 14: Adopt PolyPy or Modal for the burst-scale prediction
**Cost:** ~1 month.
**Buys:** researchers can submit a 100K-peptide job and it fans out across serverless GPUs. Result comes back in minutes. The current architecture caps at ~5K per batch (per `MAX_PEPTIDES_PER_RUN_WITHOUT_TANGO`).
**Trigger:** when the first pharma / biotech collaborator wants to screen a full library.

---

## The three biggest scaling risks (in order of likelihood)

### 1. The frontend bundle grows past 5 MB
Add a bundle-size check to CI (already there for TypeScript compilation, extend to size). Every new dependency PR that pushes the bundle up gets a review comment automatically. Target: keep the initial JS payload below 500 KB gzipped.

### 2. TANGO fails silently on a new peptide class
Peptides with unusual residues (D-amino acids, N-methylation, PEG linkers) trip TANGO in ways we haven't seen. The current `auxiliary.py:get_corrected_sequence` handles common substitutions; anything else silently produces bad TANGO output.

**Suggestion:** add a synthesis-notes review pass on every incoming custom peptide. A one-question prompt: "Is this a standard L-amino acid peptide with no PTMs? Y/N." If N, warn the user that PVL predictions apply to the standard-residue backbone only.

### 3. The docs handbook falls out of sync with the code
Docs drift is real. The handbook is 41K words; the code is 30K+ LOC. Someone will edit code without updating docs.

**Suggestion:** add a "doc coverage" check to CI. On every PR that touches `backend/services/`, ensure the corresponding `docs/handbook/humans/03_the_pipeline.md` or `agents/01_repo_map.md` section is also modified (or the PR is labeled `docs-not-needed` with a reason). Not draconian — just a nudge.

---

## The scale checklist

Before PVL crosses each milestone, do these tasks:

| Milestone | Required tasks |
|---|---|
| 100 daily active users | Add Sentry APM traces, add the Grafana dashboard, tighten Caddy rate limits |
| 1,000 daily active users | Move to K8s, activate the Celery queue for batches > 100 |
| 10,000 requests/day | Auth layer (API keys), CDN for static assets, per-region deployment |
| First external contributor | Add CODEOWNERS, expand the CONTRIBUTING doc, dedicated Slack/Discord for questions |
| First paper cites PVL | Freeze the concept DOI, add a "How to cite" prompt in the exports |
| First academic dependency (e.g. someone builds on `pvl-cli`) | Semantic versioning discipline, deprecation window on breaking API changes |

---

## What NOT to do

**Do not** rewrite the API contract to please a new frontend framework. Every 6-year frontend rewrite in software history has failed to justify itself. If someone wants Svelte, they can consume the same REST API.

**Do not** rewrite the backend in Rust or Go. Python + FastAPI is fast enough. The bottleneck is TANGO + S4PRED subprocess costs. A backend rewrite buys nothing until those are addressed.

**Do not** switch database. There's currently no database — just DuckDB caches and file artifacts. When PVL needs one (for auth, user history, etc.), pick PostgreSQL. Boring, correct.

**Do not** abandon the ADR log. Even if you don't add new ADRs, don't delete old ones. Future devs need the why-trail.

**Do not** deprecate the CLI in favor of "everyone uses the web UI." Different research workflows want different surfaces. Kill nothing that has users.

---

## Signing off

PVL is a 30K-LOC open-source scientific tool with 42K words of documentation, five distribution surfaces, a JOSS paper draft, a Zenodo-ready release, and a next-dev handoff of ~500 person-hours of code + docs.

The next 5 years' worth of technical bets are above. Pick the ones that match your users, not the ones that match the tech Twitter zeitgeist.

Congratulations on shipping this.
