# On-Call — PePFibPred

**Effective**: 2026-07-12
**Roles matrix**: see `OWNERSHIP_MATRIX.md` for the durable "who owns what" table.
**Escalation runbook for Sentry configuration**: see `paper_drafts/13_sentry_migration_runbook.md`.

---

## Model in one paragraph

PePFibPred uses an **Owner / Primary Responder** split. Said is the **Owner** — full access forever, veto on scientific + architectural ADRs, but **silent by default** on alerts. Alex is the **Primary Responder** — first responder on all Sentry issue alerts, receives all Dependabot PRs, receives all CI-on-main failures. Peleg is the **Scientific Authority** — consulted off-repo on axiom-level decisions and never on the pager.

---

## Escalation timers

| Severity | Alex response window | Auto-escalation to Said |
|---|---|---|
| **SEV1** (site down, wrong scientific results served) | Immediate acknowledgement | after 30 min unresolved (business hours) / 2 h (off-hours) |
| **SEV2** (predictor down, degraded, UniProt broken) | Within 1 business day | Only if Alex explicitly requests |
| **SEV3** (cosmetic, non-blocking) | Backlog | Never |

SEV levels are defined in `INCIDENT_SEVERITY.md`. Auto-escalation is implemented in Sentry alert rules — see `paper_drafts/13_sentry_migration_runbook.md` for the exact configuration.

---

## Business hours definition

**Alex** — Hamburg / CET, 08:00 - 20:00 local time, Monday to Friday.
**Said** — Israel / IST, 09:00 - 18:00 local time, Sunday to Thursday.

Off-hours = everything else, including weekends.

## Quiet hours

**Alex** — 20:00 - 08:00 CET, weekends. Only SEV1 pages during quiet hours.
**Said** — 23:00 - 07:00 IST, and during Jewish holidays. Only SEV1 escalations, never SEV2/SEV3.

---

## Vacation + coverage

When one of us is unreachable for > 3 consecutive days:

- **Alex is out** → all SEV1 + SEV2 → Said. Alex documents the coverage window in an issue titled `[on-call] Alex out YYYY-MM-DD to YYYY-MM-DD` with an assignee change of any open on-call rules.
- **Said is out** → SEV1 escalations delayed by 24 h; if SEV1 spans > 24 h, Alex requests Peleg's engagement on scientific correctness questions but continues technical response solo.
- **Both out** → the reference deployment ships with a `Maintenance mode` toggle (`backend/config.py :: MAINTENANCE_MODE`) that returns a friendly 503 with an expected-back-online timestamp. Document the window at the top of `RUNBOOKS/`.

---

## What "Owner but silent" means for Said

Said keeps:
- Every admin permission on every platform (see `OWNERSHIP_MATRIX.md`)
- Veto on any change to `api_models.py`, axiom-logic files, or `DECISIONS.md`
- Merge rights on any branch
- Full read + write on any Sentry / Zenodo / PyPI / Hetzner / GHCR surface

Said stops receiving:
- Per-issue Sentry emails (silenced via Account → Notifications → Issue Alerts → "Only on issues I'm subscribed to")
- Dependabot PR emails (unsubscribe from repo notifications; GitHub Insights weekly digest remains)
- CI-red emails (rely on the monthly digest instead)

Said still receives (as low-noise founder-oversight signal):
- Sentry Weekly Report (one email/week; summary of top errors)
- GitHub Insights weekly digest (one email/week)
- The monthly report Alex sends (`MONTHLY_REPORT_TEMPLATE.md`)
- SEV1 escalation emails when Alex misses
- Any ADR PR requesting Said as a CODEOWNER (via GitHub notifications)

---

## Peleg specifically

Peleg is **never** placed on any automated pager or notification path. She is:
- Not a GitHub committer
- Not a Sentry member
- Not a Hetzner / PyPI / DESY-VM admin

When axiom-level questions arise, Alex or Said reaches her directly via email or Drive comments. Sign-off is recorded as a link inside the merging PR description (see `RFC_TEMPLATE.md`).

---

## Handover if Alex leaves

1. Update `OWNERSHIP_MATRIX.md` with the new Primary Responder
2. Re-run the Sentry migration (`paper_drafts/13_sentry_migration_runbook.md`) inverted — the new person takes Alex's Sentry notification defaults
3. Re-run the Alex-admin checklist (`paper_drafts/07_alex_admin_checklist.md`) with the new person's identifiers
4. Update `.github/CODEOWNERS` — replace `@axelgolubev` with the new handle
5. Update Hetzner `/root/.ssh/authorized_keys` to remove Alex's key
6. Alex documents any in-flight incident in the postmortems folder before departure

---

## Handover if Said leaves (not planned but documented for completeness)

Said keeps `Owner` on every platform per the "founder-with-oversight" convention, but if Said explicitly relinquishes:
1. Alex is promoted to sole Owner on every platform in `OWNERSHIP_MATRIX.md`
2. A new founder-oversight recipient (Peleg? Meytal? DESY-CSSB IT?) is chosen and named in `OWNERSHIP_MATRIX.md`
3. The API-stability policy in `API_STABILITY.md` becomes Alex's veto
4. `.github/CODEOWNERS` is rewritten with `@axelgolubev` as the veto owner on architectural + scientific files

---

## Communication channels

| Channel | Purpose | Users |
|---|---|---|
| Sentry email → Alex | Real-time issue alerts | Alex |
| Sentry email → Said (SEV1 escalation only) | 30-min-late SEV1 backup | Said |
| Sentry Weekly Report → both | Low-noise digest | Both |
| GitHub Discussions | RFCs (`RFC_TEMPLATE.md`) | Everyone (public) |
| Monthly report email → Said | Founder-oversight digest | Alex → Said |
| Direct email `said.azaizah@cssb-hamburg.de` | Scientific escalation | Peleg / Alex |
| Direct email `aleksandr.golubev@cssb-hamburg.de` | Operational escalation | Said / DESY / anyone |
