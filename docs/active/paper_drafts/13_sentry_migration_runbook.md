# Sentry Migration Runbook — redirect alerts to Alex; keep Said as Owner

> **Objective**: Alex Golubev becomes the **primary alert recipient** — he receives every issue-alert email and Slack notification. Said stays **Owner** — full admin access forever, veto rights, but **zero routine notifications** to his personal inbox. Escalation timer: if a SEV1 issue is unresolved after 30 min in business hours (Alex CET 08:00-20:00) / 2 h off-hours → Sentry auto-escalates to Said.
>
> **What "Owner" means in Sentry**: Owner is a role with all permissions — can change org settings, billing, delete projects, invite/remove members. Said retains this role. What changes is only the **notification-preferences** attached to Said's user account, so his inbox goes quiet.
>
> **Runbook estimate**: 30 min of your work + 5-min wait for Alex to accept the invite.

---

## Prerequisites (all covered — nothing pending)

- [x] Alex's DESY email: `aleksandr.golubev@cssb-hamburg.de` (verified 2026-07-12)
- [x] Said retains Owner
- [ ] Alex has a Sentry account (may need to create — free at <https://sentry.io/signup/>)

---

## Step 1 — Invite Alex as Owner (5 min)

1. Log in to Sentry at your org URL. If you don't remember it, check `docs/active/SENTRY_RUNBOOK.md` § 1 or `backend/config.py:102` for the DSN — the org slug is the subdomain of the DSN URL.
2. **Settings → Members → Invite Member**
3. Email: `aleksandr.golubev@cssb-hamburg.de`
4. Role: **Owner**
5. Send invite

Alex accepts the invite → he shows in **Members** with role **Owner**.

**Verify**: Alex can navigate to the org's **Settings → General** page. If he can, he has Owner-level access.

---

## Step 2 — Redirect issue alerts to Alex (10 min)

**Current state**: your existing Sentry alert rules send to *Said Azaizah* (your personal user).
**Target state**: alerts send to **Team: Owners** (both of you), with your *personal notification preferences* set to silent so only Alex actually receives email + Slack.

### 2.1 Update alert-rule recipients

1. **Alerts → Alert Rules**
2. For each rule in the list:
   1. Click the rule → **Edit**
   2. Under **Then perform these actions**, find every recipient set to *Said Azaizah* (user)
   3. Change to *Team: Owners* (team) — this routes to both of you but respects each recipient's per-user notification preferences (Step 2.2)
   4. Save

### 2.2 Silence Said's personal notification preferences

**Sentry Menu → Account → Notifications** (this affects only *your* email/Slack, not Alex's):

- **Issue Alerts** → **My Projects** → set to **"Only on issues I'm subscribed to"** (not "All")
- **Deploy** → **Off**
- **Weekly Reports** → **On** (keeps you in the loop without paging)
- **Quotas** → **On** (you're the billing owner)
- **Spike Protection** → **On** (billing-adjacent)

Everything else → **Off**.

**Verify**: Alex's notification settings (his default) are unchanged → he receives full alert stream.

---

## Step 3 — Add SEV1 auto-escalation to Said (10 min)

**Purpose**: if Alex misses / can't respond, Sentry auto-escalates a SEV1 to Said after N minutes.

### 3.1 Define what "SEV1" means in Sentry issue attributes

Sentry doesn't have a native SEV1/2/3 field, but issues can be tagged. Enrich the SDK context (`backend/api/main.py:47-55` already sets Sentry context; extend):

```python
# in the FastAPI request-context middleware
scope.set_tag("severity", "sev1" if <predicate> else "sev2" if <predicate> else "sev3")
```

Predicate for SEV1: response status ≥ 500 AND affected endpoint in `["/api/predict", "/api/predict/batch", "/api/upload-csv"]` (the three that produce scientific results).

Predicate for SEV2: response status ≥ 500 on any other endpoint, OR any TANGO/S4PRED subprocess failure.

Everything else → SEV3.

### 3.2 Add the SEV1 escalation alert rule

1. **Alerts → Create Alert → Issues**
2. **When any of these conditions are met**:
   - `severity: sev1`
   - `has NOT been resolved for 30m`
3. **Perform these actions**:
   - Send email to *Said Azaizah* (your user, bypassing your default silence — this is the one alert you *do* want)
   - Send email to *Alex Golubev* (redundant reminder)
4. **Owner**: Team Owners
5. Save

Off-hours variant: create a second rule with `30m` → `2h` for the CET off-hours window. (Sentry doesn't natively schedule by time-of-day — implement as an always-on rule with the longer timeout; if Alex responds within 30 min during business hours the issue resolves and this rule never fires.)

**Verify**: trigger a SEV1 on staging (raise a 500 from `/api/predict`). Confirm:
- Alex receives an alert email within seconds
- If Alex leaves it for > 30 min unresolved, Said receives an escalation email

---

## Step 4 — Silence Sentry Discord/Slack integrations for Said (5 min)

If you've set up Slack integration for Sentry (`docs/active/SENTRY_RUNBOOK.md` § S.5 planned), route the Slack DM channel to Alex's Slack, not yours.

If you don't have Slack integration yet, skip.

---

## Step 5 — Redirect Sentry Weekly Report to Alex (2 min)

**Sentry Menu → Account → Notifications → Weekly Reports** — this is the "how many issues, how many resolved, top errors" digest.

- Said: **On** (keeps you in the loop)
- Alex: **On** (his default)

Both of you receive this. It's low-noise — one email per week — and gives Said the founder-oversight signal without a live page.

---

## Step 6 — Update the Sentry runbook (5 min)

Edit `docs/active/SENTRY_RUNBOOK.md`:

1. Under **§ Roles**:
   - **Owner (billing + admin)**: Said Azaizah — no active alerting
   - **Owner (operational)**: Alex Golubev — primary alert recipient
2. Under **§ Alert Rules**: link to the SEV1 escalation rule
3. Add a **§ Silencing Owner Notifications** section that documents Step 2.2 so future readers (or the next dev after Alex) know how to re-configure

Commit as `Said Azaizah <said.azaizah@cssb-hamburg.de>`.

---

## Step 7 — Sanity check + rehearsal (10 min)

**Trigger a test error on staging**:
```bash
# On the reference Hetzner VPS or a staging URL:
curl -X POST http://<staging>/api/_dev/sentry-test
# Or trigger a 500 in any way you can
```

Confirm within 3 min:
- Alex received the email
- **You did not** (unless you subscribed to that specific issue)

Wait 30 min (or manually mark the issue as unresolved and back-date the age). Confirm:
- Said received the SEV1 escalation email

---

## Post-migration checklist for you

- [ ] Alex confirmed he received the SEV1 test email
- [ ] You did NOT receive the initial SEV1 email (silenced by Step 2.2)
- [ ] You DID receive the escalation email after 30 min (from Step 3)
- [ ] `SENTRY_RUNBOOK.md` updated to reflect the new roles
- [ ] `docs/active/OWNERSHIP_MATRIX.md` reflects: Sentry — Alex primary responder, Said Owner + escalation target

---

## Rollback (if something goes wrong)

**Symptom**: Alex reports he's not getting alerts.
**Fix**: check that his account is confirmed and has notification email address set. **Sentry → Settings → Members → Alex → Account → Notifications**.

**Symptom**: Said is still getting flooded.
**Fix**: re-verify Step 2.2. Sometimes Sentry cache takes 5 min to propagate; wait, then re-check.

**Symptom**: SEV1 escalation never fires.
**Fix**: verify the alert rule's condition `has NOT been resolved for 30m` exists and is enabled. Sentry sometimes disables rules that fire zero times for 30 days.

**Symptom**: Alex objects to being on 24/7.
**Fix**: split into two alert rules — one for business-hours CET (08:00-20:00) with 30-min escalation, one for off-hours with 2-h escalation. Or upgrade to PagerDuty free tier (5 users) for schedule-based routing.

---

## What this migration does NOT do

- Does **not** remove Said's admin access — Said remains full Owner
- Does **not** change billing — whoever owns the payment method still does
- Does **not** transfer the Sentry organisation itself — the org stays as-is; only members and notifications change
- Does **not** touch the frontend `@sentry/react` SDK configuration or the backend `sentry-sdk[fastapi]` DSN — those keep pointing at the same project

---

## Next-time-you-forget-your-Sentry-org-URL

Look up the DSN in one of these places:
- `docs/active/SENTRY_RUNBOOK.md` § 1 (canonical)
- GitHub Secrets → `SENTRY_DSN`
- `/opt/pvl/.env.deploy` on the Hetzner VPS (root SSH)
- `docker/docker-compose.prod.yml:25` (references `SENTRY_DSN` from env, so the value is in `.env.deploy`)

The subdomain of the DSN URL is the org slug. E.g. `https://<xxx>@o<orgid>.ingest.sentry.io/<projid>` → org slug is `desycssb` (per `.github/workflows/release.yml:40-41`).
