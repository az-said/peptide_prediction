# PVL — Production Lockdown Checklist

> **Purpose.** The single page Said works through to take PVL from "feature-complete on a branch" to "live, secure, and locked for the next developer". Linear — work top to bottom.

---

## 0. Where we are (verified 2026-06-29)

- Branch `wave-2.8/peleg-pdf-followups` — **53 commits ahead of main**.
- Frontend: **672 / 672 vitest cases passing**. `tsc --noEmit` clean. ESLint clean except 36 pre-existing shadcn/Results.tsx warnings.
- Backend: **646 / 646 pytest cases passing**. `ruff check backend` clean.
- VPS `94.130.178.182:3000` is alive, but running the OLD branch.
- DESY VM `landau-webapp-dev` is bootstrapped; nothing deployed there.
- `backend/data/precomputed/` does not exist on any host yet.
- Doc tree: 34 files in `docs/active/`, 28 in `docs/internal/` — overgrown.

---

## 1. Ship the branch — local → GitHub → VPS → DESY VM

### 1.1 Push to GitHub
```bash
cd /Users/saidazaizah/Desktop/DESY/peptide_prediction
git push origin wave-2.8/peleg-pdf-followups
gh pr create --base main --head wave-2.8/peleg-pdf-followups \
  --title "Wave 2.8 + 2.9 — Peleg PDF follow-ups (close-out)" \
  --body-file docs/internal/PR_BODY_WAVE_2_8.md
```
**Verify**: CI green on the PR. CodeRabbit auto-reviews. Address comments if any.

### 1.2 Merge to main
```bash
gh pr merge --merge   # preserves the 53-commit granular log
```

### 1.3 Deploy to VPS (Hetzner)
```bash
ssh root@94.130.178.182
cd /opt/pvl
git fetch origin
git checkout main
git pull
bash scripts/prod_redeploy.sh    # rebuilds backend + frontend + workers, ~3 min

# After redeploy, run the precompute job ONCE so example clicks become instant
USE_TANGO=1 USE_S4PRED=1 docker compose -f docker/docker-compose.prod.yml \
  exec backend python scripts/precompute_dataset.py peleg_118
```
**Verify**: open `http://94.130.178.182:3000`, click "Fibril-forming peptides (118)". Should land on `/results` in **under 1 second**. If still slow, precompute didn't write — see §"Troubleshooting" below.

### 1.4 Deploy to DESY VM (when DNS + TLS ready)
```bash
ssh root@131.169.4.163
# Either: rsync the repo + run the bootstrap script (no docker on DESY VM)
bash scripts/desy_vm_bootstrap.sh    # installs deps, sets up systemd unit
# Or: install docker first, then docker compose up
```
DESY VM is currently a Hetzner-equivalent fallback. Real production target is the DESY K8s cluster — see `docs/active/DEPLOYMENT.md` §"K8s plan" for the migration spec. Blocked on DESY IT giving us a namespace.

---

## 2. Secure for the next developer

These are the things that, if neglected, will bite the next person at 3am. Verify each.

### 2.1 Secrets
- [ ] `backend/.env` is in `.gitignore`. Confirm: `git check-ignore backend/.env`.
- [ ] No `SENTRY_DSN`, AlphaFold key, UniProt API token, S4PRED model URL, or Hetzner SSH key in any committed file. Run: `git log -p | grep -E "DSN|SECRET|TOKEN|API_KEY" | head`.
- [ ] CITATION.cff has no email leak in raw form (verified: only DESY/Technion).
- [ ] GitHub repo secrets are set: `gh secret list`. Required: `SENTRY_DSN` (CI), `HETZNER_SSH_KEY` (deploy), `DESY_VM_KEY` (eventually).

### 2.2 API hardening (do before public listing)
- [ ] **CORS**: `backend/api/main.py` allowlist is **explicit**, not `["*"]`. Today: `allow_origins=[FRONTEND_URL]`. Confirm with `grep allow_origins backend/api/main.py`.
- [ ] **Rate limit `/api/predict/batch` and `/api/uniprot/execute`** — the two expensive routes. Use `slowapi` (FastAPI rate limiter). 30 req/min/IP is plenty for research. Today: **no limiter**. This is the single biggest cost-leak risk.
- [ ] **Request size cap**: FastAPI default is unlimited. Cap at 10 MB on `/api/upload` so a malicious CSV can't OOM the worker.
- [ ] **Pydantic `extra="forbid"`** already on (B-CONTRACT). Confirm: `grep extra= backend/schemas/api_models.py`.

### 2.3 Server hardening (Hetzner VPS)
- [ ] **Firewall**: only 22 (SSH), 80, 443 open. `ufw status`. Right now port 3000 is exposed — close it, let Caddy handle 80/443.
- [ ] **SSH key-only**: `PasswordAuthentication no` in `/etc/ssh/sshd_config`.
- [ ] **Fail2ban** running. `systemctl status fail2ban`.
- [ ] **Automatic security updates**: `unattended-upgrades` enabled.
- [ ] **TLS** via Caddy (already configured for the DESY-domain handoff).

### 2.4 Repo hardening
- [ ] **Branch protection on `main`**: 1 review required, CI green required, no force-push. Set via `gh api -X PUT repos/saidaz24-meet/peptide_prediction/branches/main/protection ...` or the GitHub UI.
- [ ] **CodeQL** scan enabled. GitHub → Settings → Code security → Enable default.
- [ ] **Dependabot** alerts on. GitHub → Settings → Code security.
- [ ] **Pre-push hook** already runs ruff (#129). Confirm: `cat .git/hooks/pre-push | head`.

---

## 3. Doc cleanup — 34 files in `docs/active/` → ~10

The Opus 4.8 documentation terminal (`docs/internal/OPUS_DOCS_TERMINAL_PROMPT.md`) will produce the canonical `docs/handbook/` tree. **Until that lands**, here's the manual cleanup pass that removes the worst clutter without losing institutional memory.

### Files to **archive immediately** (move to `docs/archive/2026-06-29/`)
These are dated artifacts that have served their purpose:
- `MEETING_2026_06_18.md` — Zoom capture, decisions absorbed into ROADMAP + DECISIONS.
- `PELEG_NOTES_2026_06_18.md` — triaged feedback, items shipped or in GitHub Issues.
- `SENTRY_VERIFICATION_2026_06_08.md` — one-time verification, frozen.
- `CHANGELOG_PELEG.md` — Peleg-facing log; the paper supersedes this.
- `RELEASE_NOTES_v0.3.0.md` — historical release notes.
- `cowork-dispatches/` — all V1–V11 dispatches except V11 (the current one).

### Files to **merge** (one canonical, others archive)
- `ACTIVE_CONTEXT.md` + `DEVELOPER_REFERENCE.md` + `MASTER_DEV_DOC.md` → **one** `ARCHITECTURE.md`. Three docs say the same thing today.
- `ECOSYSTEM_GUIDE.md` + `HOSTING_MAP.md` + `MCP_CLIENT_GUIDES.md` → **one** `INTEGRATIONS.md`.
- `A4_BIO_TOOLS_SUBMISSION.md` + `A5_ZENODO_RELEASE.md` → **one** `PUBLICATION_PATH.md`.

### Files to **keep canonical** in `docs/active/`
- `HANDOFF.md` — single-page on-ramp (just refreshed)
- `CONTRACTS.md` — API contract spec
- `DECISIONS.md` — ADR log
- `KNOWN_ISSUES.md` — open bugs
- `TESTING_GUIDE.md` — test gates
- `DEPLOYMENT.md` — deploy paths
- `ROADMAP.md` — phase plan (needs refresh — last updated 2026-04-26)
- `PAPER_METHODS_REFERENCE.md` — Methods section source
- `SENTRY_RUNBOOK.md` — observability runbook
- `MOL3D_OVERLAY_SPEC.md` + `UNIPROT_ENRICHMENT_SPEC.md` + `VECTOR_SEARCH_SPEC.md` — feature specs (the still-to-build pieces)
- `PRODUCTION_LOCKDOWN.md` — this file

**Net effect**: 34 → ~12 files in `docs/active/`. The Opus handbook will eventually replace half of these — but until then, every new dev gets a 12-file map instead of a 34-file maze.

### Files in `docs/internal/` — leave alone
Process docs are by definition messy. They get cleaned when the project finishes that phase. The Opus terminal will produce a clean `docs/handbook/agents/` tree that replaces this.

---

## 4. Why the web feels slow (Said's 11s vs 1min question)

**Terminal benchmark**: raw `S4PRED.predict()` on 1k peptides takes ~60s. No HTTP, no JSON, no validation, no normalization.

**Web flow on the SAME 1k peptides**: HTTP → file parse → DataFrame → Pydantic validate input → TANGO subprocess → S4PRED predict → Pydantic validate output → JSON serialize → 1 MB response → browser parse → Zustand store → 1k React rows render.

The dominant cost on web is **not** S4PRED — it's the rendering layer:
- React rendering 1k peptide rows (5–10s on Safari/Mac)
- Zustand subscription propagating updates
- Recharts redraw on every state change

**Today's actual prod number for 1 peptide via Quick Analyze**: ~400–800 ms warm, ~5–8 s cold (S4PRED model load).

The PERF wins already in this branch eliminate the cold-start (gunicorn `--preload`, #119) and batch the S4PRED forward (#117). After deploying this branch and warming the workers (one request after restart), 1 peptide should take **< 500ms** and 1k should take **< 90s**. **If it doesn't, that's task #156 — diagnose with the stage timers (#115) already wired into the predict route.**

For the example datasets specifically: the precompute endpoint shipped this turn (`7fc8e24`) makes them **instant (~200ms)** once `make precompute-datasets` runs on the deploy host. Step 1.3 above does this.

---

## 5. Messages to Peleg + Alex

### To Peleg
Subject: "PVL Wave 2.8 close-out + paper methods ready"

> Hi Peleg,
>
> Wave 2.8 + 2.9 (everything from your two PDF reviews) is shipped and tested:
> - All 672 frontend tests + 646 backend tests green
> - Threshold preset chip renamed (was "Peleg default" — now just "Default" so users don't bounce off the name)
> - Per-peptide HTML report download from Quick Analyze + Peptide Detail
> - Mol* SSW residue overlay (Phase 1 stub; full molstar wiring is a Tier 1 backlog item)
> - All F-series terminology fixes ("cohort" → "database", "Cutoff" suffix on threshold inputs)
> - One-click "Compare current dataset vs fibril-forming peptides (118)" chip on /compare
> - Backend precompute pipeline so example clicks are instant after deploy
> - Q12: TANGO panel renamed and reordered (secondary structure first, aggregation second)
> - Q15: 4-class KPI strip on Quick Analyze with reason text per class
>
> **For the paper**: `docs/active/PAPER_METHODS_REFERENCE.md` is the canonical source for the Methods section. Every algorithm, every threshold, every dataset is in there with the primary literature citation. Open the file, copy the relevant blocks. If anything is missing or wrong, ping me before the submission.
>
> **Open scientific items I still need from you**: OQ1–OQ4 from your Drive comments (still pending), F10 (β% calculation might be too aggressive — wanted your call), Q-FIX-022 (|charge| loses sign — okay to ship or revisit?).
>
> Live demo: http://94.130.178.182:3000 — let me know what you want to walk through.

### To Alex
Subject: "PVL ready for DESY deploy"

> Hi Alex,
>
> PVL Wave 2.8 / 2.9 is feature-complete, tested, and the wrap-up branch is ready to merge. Three things from you would close out the prod story:
>
> 1. **DESY DNS + TLS cert** for the VM (`landau-webapp-dev`, 131.169.4.163). The bootstrap script is at `scripts/desy_vm_bootstrap.sh`. Once a hostname + cert exist I can finish the deploy in one session.
> 2. **DESY K8s namespace + Ingress** when DESY IT is ready. We can run on the VM in the meantime but K8s is the right long-term home — `docs/active/DEPLOYMENT.md` has the manifest skeleton.
> 3. **GitLab mirror** for the DESY-side fork. Same content, automated mirror from GitHub.
>
> Everything else (Sentry, CI, backups, perf instrumentation) is already wired and running on the Hetzner VPS. Once the DESY infra is ready it's a straight migration.
>
> The handbook for the next developer is being produced in parallel by a dedicated documentation pass (Wave 1 just landed at `docs/handbook/`). When it's done, the on-ramp is one file: `docs/handbook/humans/00_what_is_pvl.md`.

---

## 6. What "locked for the next developer" looks like when done

A developer who joins next quarter and types `git clone` should be able to:

1. Run `cat docs/handbook/humans/00_what_is_pvl.md` and understand PVL in 5 minutes.
2. Run `make ci` and see all green.
3. Run `docker compose up` and see the UI at `http://localhost:3000`.
4. Find every protected file marked in `docs/handbook/agents/02_contracts_and_invariants.md`.
5. Open a PR and have CI tell them clearly if they broke something.
6. Ship a feature without ever needing to ping Said.

Today they could do 2, 3, and 5. After this lockdown checklist + the Opus handbook waves, they can do all six.

---

## 7. Troubleshooting common deploy issues

**`make precompute-datasets` fails on the VPS**
- Likely missing TANGO binary or S4PRED weights in the container. Confirm `docker compose exec backend ls /app/backend/Tango/bin` and `/app/backend/tools/s4pred/weights/`.

**Example button still slow after precompute**
- The precompute wrote `backend/data/precomputed/peleg_118.json` inside the container, not the host volume. Mount the volume in `docker-compose.prod.yml` or run the script with `-v /opt/pvl/backend/data:/app/backend/data` so the artifact survives container rebuilds.

**Sentry getting noisy**
- The `_sentry_before_send` filter already drops 404 + 422. If a new noisy class appears, add to `_NOISY_HTTP_STATUSES` in `backend/api/main.py`.

**CodeRabbit blocks the PR**
- Most CodeRabbit comments are style-only. The hard rule: address them, but don't add abstractions just because a bot suggested it. If a suggestion would violate `CLAUDE.md` §"Architectural Principles", reply on the PR and ignore.

---

That's the entire lockdown plan. Work the sections in order, tick the checkboxes, and PVL is shipped.
