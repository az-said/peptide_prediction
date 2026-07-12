# Operator Cookbook — how to do X

**Audience**: Alex (Primary Responder). Anyone else can use it too.
**Reading rule**: this is a recipe book, not a novel. Jump to the recipe you need. Every recipe is stand-alone.

---

## Table of recipes

**Everyday operator tasks**
- [How to respond to a Sentry alert](#how-to-respond-to-a-sentry-alert)
- [How to look at the Sentry dashboard](#how-to-look-at-the-sentry-dashboard)
- [How to check if production is healthy right now](#how-to-check-if-production-is-healthy-right-now)
- [How to look at the Actions (CI) tab](#how-to-look-at-the-actions-ci-tab)
- [How to merge a Dependabot PR safely](#how-to-merge-a-dependabot-pr-safely)

**Weekly / monthly tasks**
- [How to draft the monthly report](#how-to-draft-the-monthly-report)
- [How to review an RFC filed as a Discussion](#how-to-review-an-rfc-filed-as-a-discussion)
- [How to skim the Sentry Weekly Report](#how-to-skim-the-sentry-weekly-report)

**Incident-response tasks**
- [How to file a postmortem](#how-to-file-a-postmortem)
- [How to redeploy the production backend](#how-to-redeploy-the-production-backend)
- [How to roll back to a previous image tag](#how-to-roll-back-to-a-previous-image-tag)
- [How to flip maintenance mode](#how-to-flip-maintenance-mode)

**Setup / one-time tasks**
- [First-run failures — what usually breaks](#first-run-failures--what-usually-breaks)
- [How to SSH to the Hetzner VPS](#how-to-ssh-to-the-hetzner-vps)
- [How to SSH to the DESY VM](#how-to-ssh-to-the-desy-vm)
- [How to authorize a new SSH key on production](#how-to-authorize-a-new-ssh-key-on-production)

**Release + publication tasks**
- [How to cut a release tag](#how-to-cut-a-release-tag)
- [How to verify a Zenodo DOI was minted](#how-to-verify-a-zenodo-doi-was-minted)
- [How to publish a new `pvl-cli` or `pvl-mcp` version to PyPI](#how-to-publish-a-new-pvl-cli-or-pvl-mcp-version-to-pypi)

---

## How to respond to a Sentry alert

**When you receive a Sentry alert email**:

1. **Open the Sentry issue in your browser.** Click the link in the email — lands you on the issue detail page.

2. **Find the `severity` tag** at the top of the issue detail page. Look for a tag like `severity:sev1`. This is set automatically by the backend SDK (see `INCIDENT_SEVERITY.md` for the predicate).

3. **Classify** using `INCIDENT_SEVERITY.md`:
   - **SEV1** — site down, wrong scientific results served. Take action immediately.
   - **SEV2** — degraded (one predictor down, UniProt broken). Fix within 1 business day.
   - **SEV3** — cosmetic. File a GitHub issue with label `sev3`, move on.

4. **For SEV1 and SEV2**: identify the applicable runbook.
   - Read the issue's Exception Type. Compare with:
     - `TangoOutputBindingError` → `RUNBOOKS/tango_subprocess_failure.md`
     - `FileNotFoundError` on `weights_*.pt` or `torch.*` error → `RUNBOOKS/s4pred_oom_or_missing_weights.md`
     - `OSError: [Errno 28] No space left` → `RUNBOOKS/vps_disk_full.md`
     - `429 Too Many Requests` from Sentry ingest → `RUNBOOKS/sentry_quota_exhausted.md`
     - Other → grep `RUNBOOKS/` for a matching Symptom, or ask Said

5. **Follow the runbook's Verify step first.** Confirm it really is the class you think it is.

6. **Follow the runbook's Rollback/Mitigate steps in order.** Do step 1 first (usually safe). If step 1 doesn't fix it, step 2. And so on.

7. **Comment on the Sentry issue** describing what you did. Use the "Comments" section on the issue detail page. Copy-paste your terminal output.

8. **Mark the Sentry issue Resolved** once the fix is verified (`/api/health` responds 200, or the specific broken endpoint responds correctly). Use the Resolve button on the issue detail page.

9. **If SEV1 or unclear-root-cause SEV2 → file a postmortem** using `postmortems/TEMPLATE.md` within 72 h. See the "How to file a postmortem" recipe below.

**If you can't figure out the runbook, or you're not sure whether it's SEV1 or SEV2** — email Said with the Sentry URL. Do not silently sit on the alert. Say *"I need help classifying this."* That's fine.

**Timer**: SEV1 has a 30-min escalation timer (business hours) / 2 h (off-hours). If you don't resolve within that window, Sentry auto-escalates to Said. If Said messages you first, that means you missed the timer — don't panic, just answer honestly (busy, unclear runbook, etc.).

---

## How to look at the Sentry dashboard

1. Log in at <https://sentry.io/> with your `aleksandr.golubev@cssb-hamburg.de` account.
2. Select the `desycssb` organisation from the dropdown (top left).
3. Click **Issues** in the left sidebar → filter by project (`pvl-backend` or `pvl-frontend`).
4. Look for anything with severity ≥ 2 or a recent event.

**"Normal" looks like**: a handful of unresolved SEV3 issues (mostly noise from user typos), no SEV1 or SEV2 in the last 24 h, error-count trend flat or declining. Look at this once a day so you know what normal is; anything abnormal will jump out.

Also on the dashboard: **Performance** tab (for the SLO 2 latency SLI) and **Alerts** tab (see the configured alert rules).

---

## How to check if production is healthy right now

Fastest check, from any terminal:

```bash
curl -sS https://<production hostname>/api/health
# Expected: {"status":"ok",...}
```

Add `-i` to see the response headers:

```bash
curl -sSI https://<production hostname>/api/health
# HTTP/2 200
# ...
```

If 5xx or timeout — go to `RUNBOOKS/` and follow the applicable runbook. If you can't tell which runbook, follow `RUNBOOKS/vps_disk_full.md` first (it's the most common root cause of a healthy-code-in-bad-environment failure).

For a fuller check:

```bash
curl -sS https://<hostname>/api/version    # Should return {"version":"0.3.0",...}
curl -sS https://<hostname>/api/precomputed/peleg_118 | head -c 100    # Should return JSON
```

---

## How to look at the Actions (CI) tab

<https://github.com/az-said/peptide_prediction/actions>

**Normal** = every recent workflow run shows a green checkmark ✓. If you see red ✗ on a `main` run, something merged that broke CI. This is SEV2 if it's blocking releases; SEV3 if it's just a flaky test.

To investigate a red run:
1. Click the run → click the job that failed
2. Expand the step that failed (usually the last one)
3. Read the last ~30 lines of output — that's where the actual error is

If the failure is in a Dependabot PR (not on `main`), that's fine — just don't merge that PR. Comment `@dependabot rebase` if you want Dependabot to try again after other PRs land.

If the failure is on `main`, you may need to revert the last commit:
```bash
git checkout main
git pull
git revert HEAD --no-edit
git push
```
Then investigate on a branch.

---

## How to merge a Dependabot PR safely

1. Go to the PR list: <https://github.com/az-said/peptide_prediction/pulls?q=is%3Apr+is%3Aopen+author%3Aapp%2Fdependabot>
2. For each PR, look at:
   - **Bump type** — patch (`2.31.0 → 2.31.1`) / minor (`2.31.0 → 2.32.0`) / major (`2.31.0 → 3.0.0`)
   - **CI status** — green ✓ or red ✗
   - **Changelog link** — Dependabot puts the upstream release notes in the PR body

3. Decision tree:
   - **Patch bump + green CI** → merge. Comment `@dependabot merge`.
   - **Minor bump + green CI** → check the release notes for breaking-change language. If none, merge. If there's anything scary, ping Said before merging.
   - **Major bump** → **never merge without Said's explicit approval**. Comment on the PR with `@az-said please review — major bump`.

4. Dependabot handles the actual merge — you don't have to click the green button. Just comment `@dependabot merge` and Dependabot merges + auto-rebases the rest.

If a Dependabot PR is blocking others (CI is red or it needs a code change), close it with a comment explaining why. Dependabot will re-open with a fresh version when the next update comes.

---

## How to draft the monthly report

**Cadence**: first Monday of every month, covering the previous month.

1. Copy the template:
   ```bash
   cd docs/active/reports
   cp ../MONTHLY_REPORT_TEMPLATE.md 2026-07.md   # for July 2026 report
   ```

2. Open `2026-07.md` in your editor. Fill in the sections:
   - **TL;DR** — one line. Green / Yellow / Red + a one-sentence summary.
   - **Health check-list** — walk through the 8 boxes with real numbers:
     - `/api/health` availability — from Sentry Cron Monitor stats
     - `/api/predict` p95 latency — from Sentry Performance tab
     - SEV1 count / SEV2 count — from your notes + Sentry
     - Dependabot queue size — from GitHub Pull Requests
     - Last CI-red date — from Actions tab
     - Sentry quota % — from Sentry Settings → Usage & Billing
     - Latest release date — from `CHANGELOG.md`
   - **Incidents** — one row per SEV1 or SEV2. Link the postmortem.
   - **Releases** — one row per release cut this month.
   - **Dependency updates** — Dependabot PRs merged, open, auto-merged.
   - **Scientific / Peleg touchpoints** — anything that required her input.
   - **Roadmap progress** — changes to `ROADMAP.md` since last month.
   - **Said-attention flags** — explicit named items. Empty = nothing needed from Said.
   - **Backlog / next-month plan** — your top 5 items for the coming month.

3. Commit:
   ```bash
   git checkout -b report/YYYY-MM
   git add docs/active/reports/YYYY-MM.md
   git commit -m "docs(reports): monthly report YYYY-MM"
   git push -u origin report/YYYY-MM
   # Open a PR on GitHub — no urgent review needed
   ```

4. Email Said the URL of the merged file.

**If Green**: Said reads the TL;DR and the "Said-attention flags" section and does nothing else.
**If Yellow**: Said reads the full report.
**If Red**: Said replies within 3 business days with a decision.

---

## How to review an RFC filed as a Discussion

1. Go to Discussions → RFC category — <https://github.com/az-said/peptide_prediction/discussions/categories/rfc>
2. Open the RFC. Read it end-to-end.
3. If you understand the change and agree: comment `Approved` and any concerns.
4. If it touches axiom logic: check that the RFC's "Peleg sign-off" field either has a link to her Drive comment or has a plan to get it before the comment window closes.
5. The comment window is 2 business days. After it closes:
   - Approved → the RFC author opens a PR. Reference the Discussion in the PR body. Add an ADR entry in `DECISIONS.md`.
   - Rejected → close the Discussion with a top-level comment explaining why.

You are the *default approver* alongside Said for RFCs. Silence during the window from either of you counts as approval unless the RFC touches an axiom (which requires explicit Peleg sign-off).

---

## How to skim the Sentry Weekly Report

The Sentry Weekly Report email lands in your inbox on Mondays. It shows:
- Number of issues resolved this week
- Number of new issues
- Top 5 error fingerprints by frequency
- Any regressions (previously-resolved issues that came back)

Spend 2 minutes reading it. If any regressions appear, file them as SEV2 or SEV3 depending on user-facing impact.

---

## How to file a postmortem

**When**: after any SEV1, or after any SEV2 whose root cause was unclear at time of fix.

1. Copy the template:
   ```bash
   cd docs/active/postmortems
   cp TEMPLATE.md 2026-07-15-tango-timeout.md    # date + short slug
   ```

2. Open the file. Fill in every section — do not skip:
   - **Summary** — 1-2 sentences a stranger can understand
   - **Impact** — user-visible impact + duration + who was affected
   - **Timeline (UTC)** — a row per key event
   - **Root cause** — the mechanism (not the person)
   - **Contributing factors** — 2-5 system-level factors that made this possible
   - **What went well** — at least 3 items (safety nets that worked)
   - **What went wrong** — specific, concrete
   - **Action items** — split into Mitigative + Preventative; each owned + dated

3. If the incident was on a Sunday and you're writing on Monday, note the delay explicitly — timing information is honest data.

4. Commit + open a PR. Said reviews within 1-2 business days. Merge after review.

5. Link the postmortem from:
   - The Sentry issue (comment on the resolved issue with the postmortem URL)
   - The runbook that was used (add a line in the "Post-incident" section)
   - The upcoming monthly report

**Blameless tone rule**: assume everyone acted with the information they had at the time. Do not name-and-shame. Investigate the *misleading information*, not the person.

---

## How to redeploy the production backend

**When**: after any change to `main` that Docker-build should incorporate. The CI workflow `deploy.yml` does this automatically on push to `main` — you rarely need to redeploy manually.

Manual redeploy:

```bash
# 1. SSH to production
ssh root@94.130.178.182

# 2. Pull latest images from GHCR
cd /opt/pvl
docker compose -f docker/docker-compose.prod.yml pull

# 3. Recreate containers
docker compose -f docker/docker-compose.prod.yml up -d --force-recreate

# 4. Wait ~15 seconds, then check
sleep 15
curl http://localhost:8000/api/health
# Expected: {"status":"ok",...}

# 5. Watch logs for a minute to catch startup errors
docker compose -f docker/docker-compose.prod.yml logs -f --tail=100 backend
# Ctrl-C when you're satisfied
```

**If the health check fails after redeploy**: roll back (see next recipe).

---

## How to roll back to a previous image tag

**When**: the latest deploy broke something and you need to un-break it fast.

1. Find the last-known-good tag:
   ```bash
   # Look at recent tags on GHCR:
   # https://github.com/az-said/peptide_prediction/pkgs/container/peptide_prediction%2Fbackend
   # Pick the tag before the current one.
   ```

2. Update the tag pin on production:
   ```bash
   ssh root@94.130.178.182
   cd /opt/pvl
   # Edit .env.deploy — change the IMAGE_TAG (or hard-code in docker-compose.prod.yml)
   nano .env.deploy    # change IMAGE_TAG=v1.0.0 to IMAGE_TAG=v0.3.4
   ```

3. Re-pull + recreate:
   ```bash
   docker compose -f docker/docker-compose.prod.yml pull
   docker compose -f docker/docker-compose.prod.yml up -d --force-recreate
   ```

4. Verify + file the incident:
   ```bash
   curl http://localhost:8000/api/version
   # Confirm the version rolled back
   ```

5. Email Said. Rolling back to a previous version is safe but Said should know.

---

## How to flip maintenance mode

**When**: something is broken badly enough that showing users a "we're back soon" message is better than serving them a broken tool.

```bash
ssh root@94.130.178.182
cd /opt/pvl
# Edit .env.deploy
echo 'MAINTENANCE_MODE=1' >> .env.deploy
echo 'MAINTENANCE_MODE_MESSAGE="PePFibPred is undergoing maintenance. Expected back online: <YYYY-MM-DD HH:MM UTC>."' >> .env.deploy
docker compose -f docker/docker-compose.prod.yml restart backend
```

To disable:

```bash
# Edit .env.deploy — remove or set MAINTENANCE_MODE=0
docker compose -f docker/docker-compose.prod.yml restart backend
```

Update the Upptime status page (see `RUNBOOKS/` when Upptime is live) with the maintenance window.

---

## First-run failures — what usually breaks

If Day 2 of `ALEX_ONBOARDING.md` (running `docker compose up`) failed, most likely:

- **Docker daemon not running** — start Docker Desktop
- **Port 8000 or 3000 in use** — `lsof -i :8000` to find the process; kill it
- **Pull failed with 403 / authentication** — you need to log in to GHCR:
  ```bash
  echo <your-github-token> | docker login ghcr.io -u axelgolubev --password-stdin
  # Personal access token from https://github.com/settings/tokens with read:packages scope
  ```
- **`/api/health` returns 502** — the backend container failed. Look at logs:
  ```bash
  docker compose -f docker-compose.prod.yml logs backend | tail -50
  ```
  Most common: TANGO binary missing (see `RUNBOOKS/tango_subprocess_failure.md`) or S4PRED weights missing (see `RUNBOOKS/s4pred_oom_or_missing_weights.md`).

If none of the above → email Said. Include the docker-compose logs output.

---

## How to SSH to the Hetzner VPS

**Prereq**: your SSH public key is authorised on the VPS (Said adds it once).

```bash
ssh root@94.130.178.182
# You should land in a shell prompt without a password prompt.
```

If you get "Permission denied (publickey)": Said hasn't added your key yet. Send him your public key again.

Once you're in:
- **Where the app lives**: `/opt/pvl`
- **Where the data lives**: `/data` (contains DuckDB caches + precompute artefacts + logs)
- **Where the compose file lives**: `/opt/pvl/docker/docker-compose.prod.yml`
- **Where the env file lives**: `/opt/pvl/.env.deploy`

Standard commands you'll use:

```bash
cd /opt/pvl
docker compose -f docker/docker-compose.prod.yml ps           # what's running
docker compose -f docker/docker-compose.prod.yml logs -f      # tail all logs
docker stats --no-stream                                       # memory + CPU snapshot
df -h                                                          # disk space
```

---

## How to SSH to the DESY VM

**Prereq**: DESY IT has completed the initial setup, your `azaizahs`-equivalent DESY login works, and your Kerberos ticket is valid.

Three-hop chain (from `memory/reference_ssh_access.md`):

```bash
# 1. Hop to the DESY jump host
ssh <your-desy-login>@max-display.desy.de

# 2. On max-display, get a Kerberos ticket
kinit
# Enter DESY password when prompted
klist   # verify the ticket

# 3. From max-display, SSH to the VM
ssh -l root landau-webapp-dev
```

If any of these fail, see `RUNBOOKS/desy_vm_ssh_lost.md`.

---

## How to authorize a new SSH key on production

**Use case**: another team member needs SSH access, or you need to add your laptop key from a new machine.

```bash
# From an already-authorized machine:
ssh root@94.130.178.182
cat ~/.ssh/authorized_keys
# Backup: cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.bak

# Add the new key:
echo "ssh-ed25519 AAAA... comment@host" >> ~/.ssh/authorized_keys

# Verify:
tail -5 ~/.ssh/authorized_keys
```

Never remove Said's key. If you need to rotate, add the new one first, verify it works, only then remove old.

---

## How to cut a release tag

**When**: Said and you agree PePFibPred is ready for a new versioned release (typical cadence: quarterly, or on demand for security fixes).

1. Bump the version everywhere:
   - `CITATION.cff` line 5: `version: "1.0.0"` → new value
   - `ui/package.json` line 4: `"version": "1.0.0"` → same value
   - `pvl-cli/pyproject.toml` version → same value
   - `pvl-mcp/pyproject.toml` version → same value
   - `CHANGELOG.md` — move items under `[Unreleased]` to a new section titled `[1.0.0] - YYYY-MM-DD`

2. Commit:
   ```bash
   git checkout -b release/v1.0.0
   git add CITATION.cff ui/package.json pvl-cli/pyproject.toml mcp_server/pyproject.toml CHANGELOG.md
   git commit -m "chore(release): v1.0.0"
   git push -u origin release/v1.0.0
   # Open a PR, get Said's sign-off, merge
   ```

3. Cut the tag from `main`:
   ```bash
   git checkout main
   git pull
   git tag -a v1.0.0 -m "PePFibPred v1.0.0"
   git push origin v1.0.0
   ```

4. This triggers:
   - `release.yml` → Sentry release + source-map upload + GitHub release
   - `docker-publish.yml` → GHCR image tagged `v1.0.0`
   - `publish-pypi.yml` → `pvl-cli` and `pvl-mcp` on PyPI (Trusted Publisher, OIDC)

5. Verify:
   - <https://github.com/az-said/peptide_prediction/releases> — GitHub release visible
   - <https://pypi.org/project/pvl-cli/> — new version listed
   - <https://pypi.org/project/pvl-mcp/> — new version listed
   - <https://ghcr.io/az-said/peptide_prediction> — new image tag visible
   - Sentry Releases tab — new release listed

6. Mint the Zenodo DOI (currently manual — see next recipe).

7. Update `CITATION.cff:52-55` — replace `zenodo.PENDING` with the real DOI.

8. Notify Peleg + Meytal by email that the release is out.

---

## How to verify a Zenodo DOI was minted

Zenodo currently mints DOIs when a **tagged GitHub release** exists and the webhook is enabled. This is currently manual — see `12_master_handover_playbook.md` §5.

After tagging:
1. Wait ~5 min for the webhook
2. Log in to <https://zenodo.org/> with the account that owns the repo linkage
3. My deposits → find the new record
4. Copy the DOI (looks like `10.5281/zenodo.XXXXXXX`)
5. Update `CITATION.cff` — replace `zenodo.PENDING`
6. Commit + push

If the DOI didn't mint automatically:
- Log in to Zenodo → GitHub tab → verify `az-said/peptide_prediction` shows a green webhook toggle
- Trigger a manual "sync" via the same page
- If still no DOI, email Said

---

## How to publish a new `pvl-cli` or `pvl-mcp` version to PyPI

You don't. This happens automatically via `publish-pypi.yml` when you push a version tag (see "How to cut a release tag").

If a publish fails:
1. Actions tab → find the failed `publish-pypi.yml` run → read the error
2. Common failure: version was already published (PyPI never lets you re-upload the same version). Fix by bumping the version and re-tagging.
3. Comment on the tag / release with the failure reason. Do not manually upload via `twine upload` — the Trusted Publisher flow is safer.

---

## Cross-references

- `ALEX_ONBOARDING.md` — the master onboarding guide (you should have read that first)
- `GITHUB_101_FOR_ALEX.md` — GitHub basics
- `DOCS_MAP_FOR_ALEX.md` — where every doc lives
- `INCIDENT_SEVERITY.md` — how to classify
- `ONCALL.md` — timers + coverage
- `RUNBOOKS/` — one file per failure class
- `postmortems/TEMPLATE.md` — the postmortem template
- `MONTHLY_REPORT_TEMPLATE.md` — the monthly digest template
- `RFC_TEMPLATE.md` — how to propose a change
- `SENTRY_RUNBOOK.md` — Sentry integration details
