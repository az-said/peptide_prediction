# Alex — Start Here

**Welcome.** This document is your single entry point for taking over as Primary Responder on PePFibPred.

**You are**: Aleksandr Golubev — DESY-CSSB structural biologist, GitHub `axelgolubev`, email `aleksandr.golubev@cssb-hamburg.de`.

**Your role**: Primary Responder — day-to-day operator of the PePFibPred web server. You receive all Sentry alerts, first responder on any incident, and draft the monthly digest that Said reads. Said stays Owner (all admin access, veto rights, silent by default). Peleg stays Scientific Authority (off-repo, consulted for axiom-level decisions).

**Time investment**: ≈ 8-10 hours across your first two weeks. You do not need to read anything else in this repo until you have finished this file.

**Reading rule**: do this document top-to-bottom. Do not jump around. Every next step assumes the previous is done.

---

## What you inherit and what you do NOT

**You inherit**:
- All Sentry issue alerts on the reference deployment
- All Dependabot pull requests (dependency updates)
- CI-red notifications on `main`
- Root SSH access to the Hetzner production VPS (`94.130.178.182`) and eventually the DESY VM
- Owner-level access on GitHub (`az-said/peptide_prediction`), Sentry, PyPI (`pvl-cli` + `pvl-mcp`), GHCR, Zenodo
- The monthly digest drafting responsibility (first Monday of every month)

**You do NOT inherit**:
- Peleg's role (she stays Scientific Authority — you never make axiom-level decisions alone)
- Said's veto (Said stays veto owner on `api_models.py`, all axiom logic, and `DECISIONS.md`)
- The paper writing (Said finishes the NAR submission; you review + support)
- Billing decisions on Sentry / PyPI / Hetzner (Said retains)

**In one sentence**: you keep the tool running well; Said keeps the tool doing the right thing.

---

## Week 1 — Understand what you're operating (≈ 6 hours across the week)

### Day 1 — Set yourself up (60 minutes)

If you have never used GitHub, read **[`GITHUB_101_FOR_ALEX.md`](GITHUB_101_FOR_ALEX.md)** first. It's ~15 minutes. Everything else assumes you've done that.

Accept the pending invitations Said sent you:
- [ ] **GitHub org `az-said`** — check your email for a GitHub invitation. Click the accept link. Verify by going to <https://github.com/orgs/az-said/people> and finding your handle listed as "Owner".
- [ ] **Sentry** — check your email for a Sentry invitation to org `desycssb`. Click the accept link. Verify by logging in and seeing PePFibPred / PVL projects (`pvl-frontend`, `pvl-backend`).
- [ ] **PyPI** — Said needs your PyPI username. If you don't have one, register at <https://pypi.org/account/register/> and send Said the username via email.
- [ ] **SSH keys** — Said will need your public SSH key (`~/.ssh/id_ed25519.pub`) to add you to the Hetzner VPS. If you don't have one:
  ```bash
  ssh-keygen -t ed25519 -C "aleksandr.golubev@cssb-hamburg.de"
  # Press Enter for default location, add a passphrase
  cat ~/.ssh/id_ed25519.pub
  # Copy the whole line starting with "ssh-ed25519" and email to Said
  ```
- [ ] **ORCID** — needed for the paper and Zenodo. If you don't have one, register at <https://orcid.org/register>. Send Said the URL like `https://orcid.org/0000-0000-0000-0000`.

Install locally:
- [ ] Git — `brew install git` (macOS) or `apt install git` (Ubuntu) or download from <https://git-scm.com/>
- [ ] Docker Desktop — <https://www.docker.com/products/docker-desktop/>
- [ ] Cursor or VS Code — <https://cursor.sh/> or <https://code.visualstudio.com/>
- [ ] Node.js 20+ — via `nvm`: <https://github.com/nvm-sh/nvm>
- [ ] Python 3.11+ — `brew install python@3.11`

You do not need to install the TANGO or S4PRED runtimes locally — those live in Docker.

### Day 2 — Clone the repo and run the smoke test (60 minutes)

```bash
# 1. Clone
cd ~/Documents   # or wherever you keep code
git clone https://github.com/az-said/peptide_prediction.git
cd peptide_prediction

# 2. Read the top-level layout
ls
# You will see: backend/ ui/ docs/ docker/ mcp_server/ pvl-cli/ CLAUDE.md README.md ...

# 3. Start the backend + frontend via Docker (fastest first-run)
cd docker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 4. Verify it's alive
curl http://localhost:8000/api/health
# Expected: {"status":"ok",...}

# 5. Open the frontend
open http://localhost:3000
```

You should see the PePFibPred landing page. Enter a peptide sequence (`GVAGIVLTAA`) and click Analyze. You should see results within 30 seconds.

**If any step above failed** — read [`OPERATOR_COOKBOOK.md`](OPERATOR_COOKBOOK.md) § "First-run failures — what usually breaks". Do not proceed to Day 3 until this works.

### Day 3 — Read the science layer (90 minutes)

Only two documents. Read them in order.

1. **[`docs/handbook/humans/02_the_science.md`](../handbook/humans/02_the_science.md)** — the wet-lab-friendly explanation of what PePFibPred predicts, why it matters, and what makes it different from TANGO / PASTA 2.0 / AGGRESCAN. You already know structural biology, so this will be quick.

2. **[`docs/handbook/research/01_landscape.md`](../handbook/research/01_landscape.md)** — the competitive landscape (13 tools). Skim the "Where PVL's own predictors come from" section carefully. This is the section that tells you what algorithmic choices we made and why.

After you finish these, ask yourself: *"Could I explain to another structural biologist in 5 minutes why PePFibPred exists and what it does differently?"* If yes, proceed. If no, re-read.

### Day 4 — Read the operator layer (90 minutes)

This is the *how the tool runs* layer. Read in order:

1. **[`docs/active/HANDOFF.md`](HANDOFF.md)** — the on-ramp for any new developer. §1 to §5. Skim §6 onward.
2. **[`docs/active/OWNERSHIP_MATRIX.md`](OWNERSHIP_MATRIX.md)** — the who-owns-what table. Notice your name against every platform.
3. **[`docs/active/ONCALL.md`](ONCALL.md)** — the exact escalation timers, quiet hours, vacation coverage. This is your operating manual.
4. **[`docs/active/INCIDENT_SEVERITY.md`](INCIDENT_SEVERITY.md)** — SEV1 / SEV2 / SEV3 definitions. When you receive a Sentry alert, you use this to classify.
5. **[`docs/active/SLO.md`](SLO.md)** — the two SLOs you're accountable for.

### Day 5 — Read the runbooks (60 minutes)

The runbooks are your "what to do when X breaks" manuals. Read the index and one full runbook.

1. **[`docs/active/RUNBOOKS/README.md`](RUNBOOKS/README.md)** — the index. 5 minutes.
2. **[`docs/active/RUNBOOKS/vps_disk_full.md`](RUNBOOKS/vps_disk_full.md)** — read one full runbook end-to-end so you know the shape. 10 minutes.
3. **[`docs/active/RUNBOOKS/tango_subprocess_failure.md`](RUNBOOKS/tango_subprocess_failure.md)** — read a second one. 10 minutes.
4. Skim the remaining three: `s4pred_oom_or_missing_weights.md`, `sentry_quota_exhausted.md`, `desy_vm_ssh_lost.md`. Just the Symptom + first Mitigate step. 15 minutes.
5. **[`docs/active/postmortems/TEMPLATE.md`](postmortems/TEMPLATE.md)** — the postmortem template. You'll fill this out after any SEV1 or unclear-root-cause SEV2. 15 minutes.

### End of Week 1 — checkpoint

Send Said a short email with the answers to these three questions:

1. What does PePFibPred predict, and what makes it different from TANGO / PASTA 2.0?
2. What's the difference between SEV1, SEV2, SEV3?
3. What are the two SLOs and what happens if one is breached?

If you can answer all three from memory, you're ready for Week 2. If not, re-read the relevant section.

---

## Week 2 — Shadow mode (≈ 2 hours across the week)

You are now receiving Sentry alerts. **Do not resolve issues alone this week.** Read them as they come in, form a hypothesis about what runbook applies, then check with Said before acting.

### What to do when a Sentry alert lands in your inbox

Follow **[`OPERATOR_COOKBOOK.md`](OPERATOR_COOKBOOK.md) § "How to respond to a Sentry alert"** step-by-step. Print or bookmark that section.

Quick preview:

1. Open the Sentry issue in the browser
2. Note the `severity` tag (`sev1`, `sev2`, `sev3`)
3. If `sev1`: page Said via email + phone. Follow the applicable runbook while Said catches up.
4. If `sev2`: identify the runbook, run the "Verify" step, then reply to the Sentry issue with your finding. Fix within 1 business day.
5. If `sev3`: file a GitHub issue with label `sev3`. Move on.

### Week-2 tasks (do these actively)

- [ ] Log in to Sentry once per day. Even if there are no alerts, look at the dashboard so you know what "normal" looks like.
- [ ] Log in to GitHub once per day. Check the Actions tab (top of the repo) — verify all workflows on `main` are green.
- [ ] Look at the Dependabot PR queue (<https://github.com/az-said/peptide_prediction/pulls>). If there are patch-level PRs that CI is green on, comment `@dependabot merge` on them. If they're minor / major bumps, ask Said before merging.
- [ ] Read [`docs/active/OPERATOR_COOKBOOK.md`](OPERATOR_COOKBOOK.md) end-to-end at least once.

### End of Week 2 — Sentry migration lands

Said runs [`docs/active/paper_drafts/13_sentry_migration_runbook.md`](paper_drafts/13_sentry_migration_runbook.md). After that runbook completes:
- **You are now primary alert recipient.** Sentry emails you, not Said.
- Said receives only weekly digests + SEV1 escalations (auto-triggered if you don't resolve a SEV1 within 30 min business hours / 2 h off-hours).
- You are officially in Primary Responder mode from this moment on.

---

## Week 3+ — Primary Responder

You are now fully in the seat. Weekly cadence:

### Every day (2-5 minutes)
- Open Sentry. Any new issues? If yes, classify + respond per **INCIDENT_SEVERITY.md**.
- Open GitHub. Any red CI on `main`? Any Dependabot PRs waiting? Any new issues filed?

### Every week
- Merge safe Dependabot PRs (patch-level with green CI). Ask Said before merging minor / major bumps.
- Review any GitHub Discussions filed under `RFC` — see **[RFC_TEMPLATE.md](RFC_TEMPLATE.md)** for the process.
- Skim the Sentry Weekly Report.

### Every month
- **First Monday** — draft the monthly report using **[MONTHLY_REPORT_TEMPLATE.md](MONTHLY_REPORT_TEMPLATE.md)**. Fill in the 8 health check-boxes from real numbers. Commit to `docs/active/reports/YYYY-MM.md`. Email Said the URL.

### Every quarter
- Sync with Said (30-60 min) to review `docs/active/ROADMAP.md` — anything to add, drop, promote from BACKLOG?

### After any SEV1 or unclear SEV2
- Write a postmortem using **[postmortems/TEMPLATE.md](postmortems/TEMPLATE.md)**. Commit to `docs/active/postmortems/YYYY-MM-DD-<slug>.md`. Reference it in the monthly report.

---

## The map of everything else in this repo

You do not need to read everything. The reading order for *when you need to* is:

**[DOCS_MAP_FOR_ALEX.md](DOCS_MAP_FOR_ALEX.md)** — a visual + tabular map of every documentation file, grouped by "read this in Week 1 / Week 2 / Month 1 / Only if you need to change scientific logic". Bookmark this. It answers the question *"where do I find the doc that tells me about X?"* for every X.

---

## Communication channels

| Channel | Purpose | When to use |
|---|---|---|
| **Sentry email** (yours) | Real-time issue alerts | Automatic — you get them. Respond per `ONCALL.md`. |
| **Sentry email** (Said's — SEV1 escalation only) | 30-min-late SEV1 backup | Automatic — no action from you unless he acknowledges |
| **Said's direct email** — `said.azaizah@cssb-hamburg.de` | Scientific escalation, veto request, "I need help with X" | Whenever you're unsure. Said would rather you ask than you guess. |
| **Peleg's direct email** | Scientific / axiom decision | Only for questions Said can't answer alone (typically axiom-level science) |
| **GitHub Discussions** — <https://github.com/az-said/peptide_prediction/discussions> | RFCs, public questions, community | For any change that touches an axiom or `api_models.py`, see `RFC_TEMPLATE.md` |
| **GitHub Issues** — <https://github.com/az-said/peptide_prediction/issues> | Bugs, feature requests | Anyone can file. You triage. |
| **Your monthly report** to Said | Founder-oversight signal | Once a month. Nothing else routine. |

---

## The "I don't understand what to do" escape hatch

If you receive a Sentry alert and you cannot identify the correct runbook, or you're unsure whether it's SEV1 vs SEV2, or you just don't know what to do:

1. **Do not delete or resolve the Sentry issue.** Leave it open.
2. Email Said with the Sentry issue URL and one sentence: *"Not sure how to classify this. Can you take a look?"*
3. Do not wait for Said's reply if it's clearly user-facing broken — take the *safest* mitigation from any runbook that looks close (usually "restart the container"). Better to attempt a safe mitigation than to freeze.
4. When Said replies, follow his lead.
5. Write a postmortem afterwards — this is a learning opportunity, not a failure.

This is expected during your first 2-3 months. It's why the Owner-and-Primary-Responder split exists.

---

## Cross-references — the docs mentioned in this guide

- [`GITHUB_101_FOR_ALEX.md`](GITHUB_101_FOR_ALEX.md) — GitHub primer (only if you've never used it)
- [`OPERATOR_COOKBOOK.md`](OPERATOR_COOKBOOK.md) — how to do X (Sentry response, redeploy, monthly report, etc.)
- [`DOCS_MAP_FOR_ALEX.md`](DOCS_MAP_FOR_ALEX.md) — the map of every doc in the repo
- [`HANDOFF.md`](HANDOFF.md) — the general developer on-ramp
- [`OWNERSHIP_MATRIX.md`](OWNERSHIP_MATRIX.md) — who owns what
- [`ONCALL.md`](ONCALL.md) — escalation timers + quiet hours
- [`INCIDENT_SEVERITY.md`](INCIDENT_SEVERITY.md) — SEV1/2/3 definitions
- [`SLO.md`](SLO.md) — the two SLOs
- [`RUNBOOKS/README.md`](RUNBOOKS/README.md) — index of runbooks
- [`postmortems/TEMPLATE.md`](postmortems/TEMPLATE.md) — postmortem template
- [`MONTHLY_REPORT_TEMPLATE.md`](MONTHLY_REPORT_TEMPLATE.md) — monthly digest template
- [`RFC_TEMPLATE.md`](RFC_TEMPLATE.md) — how to propose a scientific / api change
- [`API_STABILITY.md`](API_STABILITY.md) — STABLE vs UNSTABLE fields
- [`SENTRY_RUNBOOK.md`](SENTRY_RUNBOOK.md) — Sentry integration details

---

## One last thing

**You will not know everything. That is expected.** The doc set is designed so you don't have to hold it all in your head. When something breaks, the runbook tells you what to do. When a decision is needed, the RFC template tells you how to propose it. When Peleg asks about the pipeline, the terminology guide tells you what words to use. Trust the docs.

If a doc contradicts itself, or you find something that seems wrong, or you can't understand a section — that is a doc bug. File it as a GitHub issue with label `docs`. We'll fix it.

Welcome aboard. Ping Said when you're done with Week 1.
