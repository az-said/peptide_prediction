# Handoff Tech Playbook — PePFibPred

**Audience**: human maintainers (Alex, Matheus, future hire) AND coding agents run by them (Cursor Composer, Claude Code, and similar).
**Purpose**: everything a competent operator (or their coding agent) needs to run and evolve this project without asking the original author.
**Read time**: 20 min human. Agents parse the whole thing in one context load.
**Companion files**: `FOR_NEXT_BUILDER.md` (cold-landing one-pager), `OPERATOR_COOKBOOK.md` (21 recipes), `OWNERSHIP_MATRIX.md` (who owns what), `DEPLOYMENT.md` + `CONSOLIDATED_FINAL_DEPLOY.md` (deploy detail).

---

## 0. CODING-AGENT CONTRACT — read first if you are an agent

If you are a coding agent invoked by any maintainer of this repo, treat this section as binding.

**Ground rules**:
- **Load `CLAUDE.md` at the project root before anything else.** It defines the strict documentation policy, TDD workflow, protected files, and safety rules that override any default behaviour.
- **Never modify `backend/schemas/api_models.py` without an ADR entry in `docs/active/DECISIONS.md` signed off in-repo by an Owner.** It's the API contract; changing it silently breaks the frontend + every downstream client.
- **Never change axiom logic without off-repo sign-off from Peleg Ragonis-Bachar** (Scientific Authority — see `OWNERSHIP_MATRIX.md`). Axiom code lives in: `backend/auxiliary.py` (FF-Helix `_HELIX_PROP` and SSW union), `backend/config.py` (thresholds), `backend/consensus.py` (pipeline).
- **Never author commits, comments, code, docs, UI copy, or metadata as an "AI", "assistant", "Claude", or similar.** Attribute commits to the human maintainer using their git identity.
- **Never commit files that likely contain secrets** (`.env`, `credentials.json`, `*.key`, `*.pem`, `.envrc`). The `gitleaks` workflow blocks obvious ones; do not disable it.
- **Prefer smallest diff.** Fix only what's broken, add only what was requested. No unrequested refactors, no speculative abstractions.
- **JSON `null` only.** Never use `-1`, `"N/A"`, or empty string as sentinel values.
- **Single sequence and batch MUST produce identical results.** If you change any predictor, verify parity with `make test`.

**Read-order for you**:
1. `CLAUDE.md`
2. This file (`HANDOFF_TECH_PLAYBOOK.md`)
3. `docs/active/OPERATOR_COOKBOOK.md` for any operational task
4. `docs/active/CONTRACTS.md` before touching any API endpoint
5. `docs/active/DECISIONS.md` — the ADR log; grep it for the area you're modifying before you decide anything
6. `docs/active/KNOWN_ISSUES.md` — read before you "discover" a bug

**When to escalate to a human**:
- Any change touching `api_models.py`, `auxiliary.py` (axiom code), `config.py` (thresholds), or a file in `RESEARCH_BRIEFS/`
- Any change that would drop test coverage or delete tests
- Any deploy-affecting change (workflows in `.github/workflows/`, `Dockerfile`, `docker-compose.yml`, `caddy/`)
- Any suggestion involving destructive git operations (`--force`, `reset --hard`, branch deletion) — leave the operation for the human

---

## 1. Access + credentials matrix

Authoritative in `OWNERSHIP_MATRIX.md`. Summary:

| Surface | Owner | Operator (paged) | Where creds live |
|---|---|---|---|
| GitHub org `az-said` | Said (permanent) | — | GitHub 2FA on Said's account |
| Repo `peptide_prediction` | Said (via org) | Alex (Admin) | Repo Settings → Access |
| Hetzner VPS `94.130.178.182` | Alex (billing) | Alex + Said (root SSH) | SSH keys in `~/.ssh/`, referenced in `docs/active/reference_ssh_access.md` |
| DESY VM `landau-webapp-dev` | Alex (institutional) | Alex | DESY IT-issued creds; bootstrap script `scripts/desy_vm_bootstrap.sh` |
| Sentry | Alex (new free org — 2026-08) | Alex | New DSN swapped into repo secrets `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
| PyPI `pvl-cli` + `pvl-mcp` | Said (Owner) | Alex (Maintainer) | PyPI 2FA on each account; publish via `pyproject.toml` + GH Actions |
| Zenodo | Auto | — | Webhook fires on GitHub release tag |
| Repo secrets | Said manages | Alex reads | Settings → Secrets and variables → Actions |

**Repo secrets currently configured** (see Settings → Secrets → Actions):
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- `HETZNER_SSH_KEY`, `HETZNER_HOST`, `HETZNER_USER`
- `PYPI_API_TOKEN` (org-scoped, used by `publish-pypi.yml`)
- `GHCR_TOKEN` (for Docker image publish)

**Rotation cadence**: annual for PyPI + Sentry auth tokens; Hetzner root SSH key on personnel change only.

---

## 2. Deploy pipeline — how a `git push` reaches production

```
developer machine
     │
     │ git push origin main
     ▼
GitHub main branch
     │
     ├─▶ .github/workflows/ci.yml         (lint + typecheck + tests, gates deploy)
     ├─▶ .github/workflows/deploy.yml     (on push to main, if CI green)
     │        │
     │        │ SSH into Hetzner using HETZNER_SSH_KEY
     │        │
     │        ▼
     │   Hetzner CX33 (94.130.178.182)
     │        │
     │        │ cd /srv/peptide_prediction
     │        │ git pull
     │        │ docker compose pull && docker compose up -d
     │        │
     │        ▼
     │   Caddy (reverse proxy, TLS) ──▶ uvicorn (2 workers × 4 threads) + static UI
     │
     ├─▶ .github/workflows/publish-pypi.yml  (on git tag v*, publishes pvl-cli + pvl-mcp)
     ├─▶ .github/workflows/gitleaks.yml      (secret scan on every push + weekly cron)
     └─▶ .github/workflows/uptime.yml        (Upptime status page — .upptimerc.yml config)
```

**To deploy a change**: merge to `main` (or push directly if admin). Watch the run at <https://github.com/az-said/peptide_prediction/actions/workflows/deploy.yml>. If red, `OPERATOR_COOKBOOK.md` § "Roll back a deploy".

**To publish a release**: `git tag -a v1.0.0 -m "..."` → `git push origin v1.0.0` → GH Actions builds + publishes to PyPI + creates GitHub Release + Zenodo webhook mints DOI.

---

## 3. DESY VM — `landau-webapp-dev`

**Status**: blocked on DESY IT unblocking network access as of 2026-08-04. Once unblocked, Alex owns setup.

**Access** (once unblocked):
```
ssh alex@landau-webapp-dev.desy.de   # DESY-issued credentials
```

**Bootstrap** (fresh Ubuntu 24.04 VM):
```
curl -fsSL https://raw.githubusercontent.com/az-said/peptide_prediction/main/scripts/desy_vm_bootstrap.sh | bash
```

Script (see `scripts/desy_vm_bootstrap.sh` for source-of-truth):
1. installs Docker + Compose
2. clones repo to `/srv/peptide_prediction`
3. writes `.env` from a Vault-style prompt
4. runs `docker compose up -d`
5. installs the Caddy reverse-proxy config
6. registers a systemd unit for auto-restart on reboot

**Verify**: `curl -sS https://landau-webapp-dev.desy.de/api/health` → `{"ok":true,"version":"..."}`.

**If you want to migrate Docker Compose → K8s** (Alex's Phase B, not urgent):
- Chart draft lives at `deploy/helm/pepfibpred/` (skeleton — needs values.yaml completion)
- Target: `k8s.desy.de` if DESY has it, or Alex's choice
- Prereqs: image already in GHCR (`ghcr.io/az-said/peptide_prediction:latest`), so `helm install` just needs pull secret + ingress + persistent volume for DuckDB cache
- Sanity gate: run both Compose and K8s side by side for one week, diff `/api/health` + `/api/predict` outputs; only cut Compose when parity holds
- Reference: <https://kubernetes.io/docs/concepts/workloads/controllers/deployment/>

**If DESY IT never unblocks**: prod stays on Hetzner. That's fine for a research tool; you don't need DESY infra for the paper to accept it. Prioritise Hetzner reliability, defer DESY VM to a "nice to have".

---

## 4. GitLab migration prep (planned, no ETA)

DESY-CSSB uses `gitlab.desy.de` for internal repos. It's likely PePFibPred will mirror or migrate at some point.

**Two migration modes**:

**Mode A — mirror** (recommended interim): GitHub stays canonical, `gitlab.desy.de` becomes a read-only mirror.
```
# On the machine with GitLab access:
git remote add gitlab https://gitlab.desy.de/cssb/pepfibpred.git
git push gitlab main --mirror
# Add a cron/GH Actions job that mirrors on every main push. Sample:
#   name: Mirror to DESY GitLab
#   on: {push: {branches: [main]}}
#   jobs:
#     mirror:
#       runs-on: ubuntu-latest
#       steps:
#         - uses: pixta-dev/repository-mirroring-action@v1
#           with:
#             target_repo_url: git@gitlab.desy.de:cssb/pepfibpred.git
#             ssh_private_key: ${{ secrets.GITLAB_MIRROR_KEY }}
```

**Mode B — full migration** (when GitHub org is no longer strategic for portfolio): GitLab becomes canonical, GitHub retired or archived.
1. Import repo: GitLab → New Project → Import project → GitHub → select `az-said/peptide_prediction`.
2. Migrate secrets: enumerate `gh secret list` → recreate in GitLab CI/CD variables.
3. Port workflows: `.github/workflows/*.yml` → `.gitlab-ci.yml` (deploy step and PyPI publish need rewriting; syntax differs).
4. Update deploy target URL in Hetzner (`/srv/peptide_prediction/.env` → `GIT_REMOTE_URL`).
5. Redirect Sentry integration to new source.
6. Archive GitHub repo: Settings → Danger Zone → Archive (read-only, permanent record).

**Do not migrate before** the paper is submitted and the Zenodo DOI is minted. DOIs must resolve; archive-mode GitHub keeps them stable.

---

## 5. Matheus collaboration (placeholder — fill in on scope confirmation)

**Context**: Alex may bring in Matheus (or another collaborator/hire) for the debugging + dependency-maintenance load. This section is the induction pack when that happens.

**Read order for Matheus**:
1. `docs/active/FOR_NEXT_BUILDER.md` (5 min cold landing)
2. `docs/active/CLAUDE.md` (project rules)
3. This file's Chapter 0 (agent contract) + Chapter 6 (Dependabot ongoing) + Chapter 7 (agent guardrails)
4. `docs/active/OPERATOR_COOKBOOK.md` (21 recipes, index by task)

**Access Matheus needs** (grant only what's required):
- GitHub: **Write** on the repo (not Admin) — merge PRs, push to branches, cannot manage secrets
- Sentry: **Member** on Alex's org (once created) — view issues, silence noisy ones
- Hetzner: **No direct SSH** initially — go through Alex for any prod change
- Zenodo / PyPI: none — Alex handles releases

**Alex's onboarding steps for Matheus**:
1. Send him a link to `docs/active/FOR_NEXT_BUILDER.md` before anything else
2. `gh api /orgs/az-said/repos/peptide_prediction/collaborators/<matheus-handle> -X PUT -f permission=push`
3. Add him to CODEOWNERS if he'll review specific paths (see `.github/CODEOWNERS`)
4. Weekly 15-min sync for the first month

**Escalation ladder**:
Matheus → Alex → Said (SEV1 only)

Once Matheus is confirmed and his role scope is stable, update this section with (a) his email + GitHub handle, (b) his declared responsibilities, (c) any credit line for `CITATION.cff` or the paper.

---

## 6. Dependabot ongoing ops

Dependabot files bots-generated PRs for outdated packages. Ignoring them causes the security-advisory count to climb and eventually a critical CVE lands.

**Cadence**: triage weekly (Monday 15 min block works well).

**SLA** (from `SECURITY.md`):
- Critical → merge or mitigate within **48 h**
- High → **7 days**
- Moderate → **30 days**
- Low → **90 days**

**Triage workflow** (see `OPERATOR_COOKBOOK.md` § "Merge a Dependabot PR safely" for the detailed version):

```
For each open Dependabot PR:
  1. Read the release notes in the PR body — bot inlines them from GitHub Releases
  2. Categorise:
     - GHA bump (actions/*) — always safe, merge if CI green
     - Patch bump (x.y.Z) — merge if CI green
     - Minor bump (x.Y.z) — read release notes, merge if no breaking changes flagged
     - Major bump (X.y.z) — needs code audit; do not auto-merge
  3. If CI green + safe category: gh pr review <n> --approve && gh pr merge <n> --squash --admin --delete-branch
  4. If major: comment "Deferred, needs audit" and label `needs-triage`. Read the changelog. Grep the repo for uses of the changed API. Only merge after the audit passes locally.
  5. If CI red on a safe category: pull the branch, reproduce locally, decide fix-vs-ignore. Never merge a red PR.
```

**Alex's default routing**: he receives all Dependabot notifications on `main` (repo Watch = Watching). Said does not (repo Watch = Ignore, plus Dependabot alerts unsubscribed at repo level).

**When to escalate to Said**:
- A CVE in `api_models.py`'s Pydantic version chain (Pydantic v3 major, for example)
- A CVE in `transformers` or S4PRED loader stack that requires an axiom-adjacent workaround
- A situation where a security patch requires changing an API response shape

**Never**:
- Do not `@dependabot ignore this major version` on a package with an open CVE without at least documenting it in `docs/active/KNOWN_ISSUES.md`
- Do not disable the Dependabot config (`.github/dependabot.yml`) — it's tuned; edit if adjusting frequency, do not remove

---

## 7. Coding-agent guardrails (extended)

Any maintainer here may run a coding agent (Cursor, Claude Code, or similar) inside the repo. This section is the induction pack for that agent.

**Guardrails your agent should treat as hard rules** (in addition to Chapter 0):

- **Only edit inside the repo.** Never touch `~/.ssh`, `~/.aws`, `/etc/`, or any file outside the repo working tree unless the maintainer explicitly requests it in this session.
- **Ask before running any destructive git operation** — `reset --hard`, `push --force`, `branch -D`, `clean -fd`, `rm -rf`. In-repo file edits and `git add`/`git commit` are fine; anything that can lose work needs a human OK.
- **Ask before running `docker compose down -v`** — the `-v` removes named volumes including the DuckDB provider cache.
- **Never bypass `pre-commit` or `--no-verify` on a commit** unless the maintainer explicitly authorises it. The pre-commit hook runs `ruff`; failures indicate a real style violation, fix them.
- **Never `pip install` or `npm install` a package the maintainer didn't ask for.** No speculative dependency additions.
- **Every commit must be attributed to the human maintainer's git identity.** Do not add "Co-Authored-By" for an AI/assistant/bot.
- **Use `TaskCreate` (or equivalent) to break work into visible steps** for anything > 3 file edits, so the maintainer can follow along.

**Sequences that should always start with a plan** (present the plan, wait for approval):
- Any change spanning >3 files
- Any change to `.github/workflows/*.yml`, `Dockerfile`, `docker-compose.yml`, or `caddy/`
- Any change to `backend/schemas/api_models.py`, `backend/auxiliary.py`, `backend/config.py`, or `backend/consensus.py`
- Any new dependency, environment variable, or external service integration
- Any test deletion or coverage reduction

**Commands the agent can freely run without asking**:
- `make test`, `make lint`, `make typecheck`, `make ci`, `make fmt`
- `git status`, `git diff`, `git log`, `git show`
- `gh pr list`, `gh pr view`, `gh pr checks` (read-only GitHub)
- `ls`, `cat` (via Read tool), `grep` (via Grep tool), `find`

**Commands the agent MUST confirm before running**:
- Any `git push`, `git rebase`, `git reset`, `git checkout <file>`
- `gh pr merge`, `gh pr close`, `gh release create`
- `docker compose down`, any `docker volume` mutation
- Any command with `sudo`, `chmod`, `chown` on repo files
- `npm run build`, `npm run start` in production mode
- Any tool call that would send email, post to Slack, or invoke an external API with side effects

---

## 8. Where to find things (canonical index)

| I need to… | Read |
|---|---|
| Understand the whole architecture | `docs/active/ACTIVE_CONTEXT.md` |
| Understand the API contract | `docs/active/CONTRACTS.md` |
| Understand the prediction pipeline | `docs/active/DEVELOPER_REFERENCE.md` |
| See who owns what | `docs/active/OWNERSHIP_MATRIX.md` |
| Onboard as a new maintainer | `docs/active/ALEX_ONBOARDING.md` + `docs/active/FOR_NEXT_BUILDER.md` |
| Do a specific operational task | `docs/active/OPERATOR_COOKBOOK.md` (21 recipes) |
| Deploy | `docs/active/DEPLOYMENT.md` + `docs/active/CONSOLIDATED_FINAL_DEPLOY.md` |
| Understand a past decision | `docs/active/DECISIONS.md` (ADR log) |
| Know current bugs | `docs/active/KNOWN_ISSUES.md` |
| Write monthly report | `docs/active/MONTHLY_REPORT_TEMPLATE.md` + example in `docs/active/reports/` |
| Handle a security disclosure | `SECURITY.md` at repo root |
| Handle Sentry | `docs/active/paper_drafts/13_sentry_migration_runbook.md` |
| Submit to bio.tools | `docs/active/A4_BIO_TOOLS_SUBMISSION.md` |
| Mint a Zenodo release | `docs/active/A5_ZENODO_RELEASE.md` |

---

## 9. What Alex owes forward

Small list, not urgent, but nice-to-have to keep the chain going:

- Draft the first monthly report by 2026-09-04 (template + worked example in `docs/active/reports/2026-07-EXAMPLE.md`)
- Complete the K8s Helm chart at `deploy/helm/pepfibpred/values.yaml` when DESY VM unblocks
- Fill in Chapter 5 (Matheus) of this file when the collaboration crystallises
- Update `OWNERSHIP_MATRIX.md` on any personnel change (add himself when he confirms handles + ORCID)
- Rotate PyPI + Sentry auth tokens annually — set a calendar reminder

---

## 10. What Said stays responsible for (short list)

- Reading the monthly report (5 min/mo)
- Responding to Peleg + Meytal on scientific questions
- Approving RFCs touching `api_models.py` / axiom logic
- Cutting `v1.0.0` (blocked on Alex ORCID)
- SEV1 escalation catcher (30-min-unresolved auto-forward from Alex)

That's it.
