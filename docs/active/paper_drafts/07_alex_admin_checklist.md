# Alex admin transfer — step-by-step

> **Companion doc for Alex**: after Said finishes this checklist, Alex reads [`../ALEX_ONBOARDING.md`](../ALEX_ONBOARDING.md) — the week-by-week onboarding guide. This checklist is what *Said* runs; the ALEX_ONBOARDING.md is what *Alex* runs.
>
> Objective: Alex (`aleksandr.golubev@cssb-hamburg.de`, GitHub `axelgolubev`) becomes owner/admin on every Said-only platform. Said stays admin alongside (co-owner where the platform supports it). Sentry bug emails **redirect to Alex** and stop going to Said.
> Peleg is intentionally excluded — she stays hands-off on ops.
> Do these in order. Each step tells you what to do, what to verify, and what to expect.

---

## 0. Prerequisites
Confirm you have:
- [ ] Alex's DESY email: `aleksandr.golubev@cssb-hamburg.de`
- [ ] Alex's GitHub handle: **`axelgolubev`** (verified from his public profile — Structural Biology Researcher at DESY, Hamburg)
- [ ] Your admin credentials still active on each platform

---

## 1. GitHub — organisation `az-said` + repo `peptide_prediction`

**a. Invite Alex to the organisation as Owner.**
1. Go to <https://github.com/orgs/az-said/people>
2. Click **Invite member**
3. Enter `axelgolubev`
4. Select role **Owner**
5. Send invite

**b. Repo-level admin (belt-and-suspenders — org owner already inherits, but this pins his access even if he leaves the org).**
1. Go to <https://github.com/az-said/peptide_prediction/settings/access>
2. Add `axelgolubev` with role **Admin**

**Verify:** Alex accepts → he appears at <https://github.com/orgs/az-said/people> with role **Owner**.

---

## 2. Sentry — redirect bug emails to Alex

**a. Add Alex as Owner.**
1. Log into Sentry at the org URL used in `docs/active/SENTRY_RUNBOOK.md`
2. Settings → Team Members → **Invite Member**
3. Email: `aleksandr.golubev@cssb-hamburg.de`
4. Role: **Owner**
5. Send

**b. Redirect bug emails away from Said.**
1. Once Alex accepts, go to Settings → Alerts → your existing Issue Alert rules
2. For each rule, change the "Send to" recipient from *Said Azaizah* to **Team: Owners** (so Alex + you receive; you can later drop yourself)
3. Alternatively, if you want to fully redirect *only to Alex*: keep yourself as Owner (so you retain admin) but remove your personal email from the notification list under Account → Notifications → Email

**Verify:** trigger a test error on the staging deployment; Alex receives the email; you do not.

---

## 3. Zenodo — sandbox + production

**a. Add Alex as maintainer to the GitHub → Zenodo linkage.**
Zenodo's DOI-mint webhook is triggered by tagged releases on the GitHub repo. Since Alex is now a GitHub org owner (step 1), he automatically gains push/tag rights on the linked repo. Zenodo itself doesn't have a per-project ACL — the DOI-minting is authorised by whoever is logged in when the repo was first linked.

**Action for you (Said):**
1. Log into <https://zenodo.org>
2. Settings → GitHub → confirm `az-said/peptide_prediction` shows the linked webhook
3. Verify Alex now has push access on GitHub (from step 1) — no separate Zenodo action needed

If in the future the tool moves to a Zenodo Community (recommended for multi-author projects), invite Alex as a Community curator at that time.

---

## 4. PyPI Trusted Publisher — `pvl-cli` and `pvl-mcp`

**a. Add Alex as Owner on both PyPI packages.**
1. Log into <https://pypi.org/manage/account/>
2. For each of `pvl-cli` and `pvl-mcp`:
   - Go to package → Collaborators → **Add**
   - Username: Alex's PyPI username (ask him — his DESY email may not be his PyPI username)
   - Role: **Owner**

**b. Trusted Publisher itself is GitHub-Actions bound.** Because it's tied to the GitHub repo + workflow (not to a human user), Alex's GitHub org ownership (step 1) already gives him the ability to trigger releases. No PyPI-side change needed for the Trusted Publisher flow itself.

**If Alex doesn't have a PyPI account yet:** ask him to sign up at <https://pypi.org/account/register/>, then send back his username.

---

## 5. GHCR — GitHub Container Registry

No separate action. GHCR permissions inherit from the GitHub org (step 1). Alex as org owner has pull + push + delete on `ghcr.io/az-said/peptide_prediction`.

**Verify:** Alex runs `gh auth login` then `docker pull ghcr.io/az-said/peptide_prediction:latest` — pull succeeds.

---

## 6. Hetzner VPS (`94.130.178.182`)

**a. Add Alex's SSH public key.**
1. Ask Alex to send his SSH public key (typically `~/.ssh/id_ed25519.pub`)
2. `ssh root@94.130.178.182`
3. Append his key to `/root/.ssh/authorized_keys`
4. Test from Alex's machine: `ssh root@94.130.178.182 uptime`

**b. Optional: add Alex to the Hetzner Cloud console.**
1. Log into <https://console.hetzner.cloud>
2. Project → Members → Invite `aleksandr.golubev@cssb-hamburg.de` with role **Admin**
3. This lets him reboot the server, resize it, snapshot it — not just SSH.

**Note:** you (Said) also share `az.said2007@gmail.com`-tied billing. If Alex wants billing transferred, that's a separate Hetzner process — do it when the invoice is next due.

---

## 7. DESY VM (`landau-webapp-dev`) — pending

Currently blocked on DESY IT finishing the initial setup. When they unblock:

1. Once you can SSH in, add Alex's SSH key to `/root/.ssh/authorized_keys` (same as Hetzner)
2. Kerberos-based access: if Alex needs to reach the VM through `max-display.desy.de`, DESY IT gives him the same 3-hop path (`ssh axelgolubev@max-display.desy.de` → `kinit` → `ssh -l root landau-webapp-dev`)
3. Update `docs/active/DEPLOYMENT.md` with Alex's Kerberos principal

For now, put a **TODO** in `docs/active/DEPLOYMENT.md`: "DESY VM admin transfer to Alex pending DESY IT completion of initial setup".

---

## 8. mkdocs — GitHub Pages

No separate action. GitHub Pages permission inherits from the org (step 1). Alex as org owner can trigger the `docs.yml` workflow at <https://github.com/az-said/peptide_prediction/actions/workflows/docs.yml>.

**Verify:** Alex opens the actions tab; the "Deploy docs" workflow shows a "Run workflow" button.

---

## 9. GitHub Discussions

Inherits from org ownership. Alex is automatically a Discussions moderator once he's an org Owner.

---

## 10. Cloudflare DNS

**If used:** log into Cloudflare → your zone → Members → Invite `aleksandr.golubev@cssb-hamburg.de` as Super Administrator.

**If not currently in use:** skip. (Your production is currently on a direct Hetzner IP + Caddy Let's Encrypt; DNS is only via the future custom domain, whose registrar you may still be choosing.)

---

## 11. Update the docs so the next reader knows

Once the above are done:

1. Update `docs/active/HANDOFF.md`:
   - Owners: **Alex Golubev + Said Azaizah** (both admin on every surface)
   - Primary Sentry recipient: **Alex Golubev**
2. Update `docs/active/DEPLOYMENT.md` (Hetzner section) to note Alex has root SSH
3. Update `docs/active/SENTRY_RUNBOOK.md` to note Alex is the primary alert recipient
4. Add a `docs/active/OWNERSHIP_MATRIX.md` (new file) with a table like:

| Surface | Primary owner | Secondary owner | Notes |
|---|---|---|---|
| GitHub org `az-said` | Alex | Said | Both **Owner** |
| Sentry | Alex | Said | Alex primary alert |
| Zenodo | Auto (linked repo) | — | DOI-minted by webhook |
| PyPI `pvl-cli` | Alex | Said | Both Owner |
| PyPI `pvl-mcp` | Alex | Said | Both Owner |
| GHCR | Inherits from GitHub org | — | |
| Hetzner VPS | Alex | Said | Both root SSH + Hetzner Cloud admin |
| DESY VM | Alex | (Said, transitional) | Once DESY IT unblocks |
| GitHub Pages | Inherits from GitHub org | — | |
| Discussions | Inherits from GitHub org | — | |
| Cloudflare DNS | Alex | Said | If/when DNS added |

Commit the ownership matrix under `Said Azaizah <said.azaizah@cssb-hamburg.de>` (DESY email — per your rule, never the personal gmail).

---

## 12. Sanity check — a week later

- [ ] Trigger a test error in production; confirm Alex receives the Sentry email
- [ ] Ask Alex to open a PR and merge it — confirms GitHub Owner rights
- [ ] Push a `v0.1.1` tag and confirm Zenodo mints a new DOI without requiring you
- [ ] Confirm Alex can SSH into Hetzner root without your intervention
- [ ] Sign yourself out of Sentry, verify Alex still gets alerts, sign back in
