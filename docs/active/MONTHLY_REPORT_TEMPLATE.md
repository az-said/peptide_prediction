# Monthly Report Template — PePFibPred

**Cadence**: first Monday of every month
**Drafter**: Alex Golubev (Primary Responder)
**Reader**: Said Azaizah (Owner — receives this as his founder-oversight signal)
**Copy of past reports**: `docs/active/reports/YYYY-MM.md`

> Alex fills this template out at the start of every month covering the *previous* month. Said reads it. If everything is "green" (definition below), Said takes no action. Non-green triggers a specific `Said-attention` flag line.

---

## Template — copy this into `docs/active/reports/YYYY-MM.md`

```markdown
# Monthly Report — YYYY-MM

**Drafter**: Aleksandr Golubev
**Reader**: Said Azaizah
**Reporting period**: YYYY-MM-01 to YYYY-MM-<last>

---

## TL;DR — one line

<Green / Yellow / Red>. <1-sentence summary. E.g., "Green. Zero SEV1/SEV2 incidents, both SLOs met, three Dependabot PRs merged, on track for v1.1.0 in October.">

---

## Health check-list (auto-computed where possible)

- [ ] `/api/health` availability ≥ 99 % this month (SLO 1) — measured: <X.XX %>
- [ ] `/api/predict` p95 latency < 2 s warm-cache (SLO 2) — measured: <XXX ms>
- [ ] Zero SEV1 incidents — count: <N>
- [ ] Zero SEV2 incidents lasting > 1 business day — count: <N>
- [ ] Dependabot queue < 5 open PRs — count: <N>
- [ ] CI on `main` green — last-red-date: <YYYY-MM-DD>
- [ ] Sentry quota < 75 % consumed — current: <XX %>
- [ ] Latest release ≤ 30 days ago — current version: <v1.X.Y> released <YYYY-MM-DD>

**Verdict**: Green / Yellow / Red. Green means no boxes unchecked. Yellow means one or two unchecked but no user-facing impact. Red means at least one SLO breach or one open SEV1.

---

## Incidents this month

| Date | SEV | Description | Duration | Postmortem link |
|---|---|---|---|---|
| YYYY-MM-DD | SEV<N> | <one-line> | <duration> | `postmortems/YYYY-MM-DD-<slug>.md` |

**Postmortems written this month**: <N> (link to each)

---

## Releases this month

| Date | Version | Kind | Notes |
|---|---|---|---|
| YYYY-MM-DD | v1.X.Y | patch / minor / major | <one-line> |

Zenodo DOIs minted: <list, or "none">

---

## Dependency updates

- Dependabot PRs merged: <N>
- Dependabot PRs open: <N>
- Any patch-level auto-merges the auto-merge workflow closed on green CI: <N>
- Any Security Advisory / CVE that required attention: <link or "none">

---

## Scientific / Peleg touchpoints

- Any decisions taken this month that required Peleg's off-repo sign-off: <link RFC + Discussion or "none">
- Any OQ items closed: <list>
- Any new OQ items opened: <list>

---

## Roadmap progress

Copy the *changed* rows from `ROADMAP.md` since last month. Highlight anything moved from `NOT STARTED` → `PARTIAL` → `DONE`.

| Item | Last month | This month |
|---|---|---|
| <> | NOT STARTED | PARTIAL |

---

## Said-attention flags

<Explicit named lines only. If a flag is here, Said reads this section and either replies with a decision or delegates back to Alex.>

- **[FLAG]** <e.g., "Peleg requested an axiom change on FF-SSW's hydrophobicity gate — RFC filed at #<n>, needs your veto sign-off before Alex merges">
- **[FLAG]** <e.g., "Sentry quota hit 90 % this month — approve tier bump or accept sampling reduction">

If this section is empty: Said takes no action.

---

## Financial / billing notes

- Hetzner: <invoice or "no change">
- Sentry: <invoice or "no change">
- PyPI / Zenodo / GitHub: free-tier
- Any changes needed: <describe>

---

## Traffic / adoption (only if known — no analytics stored per `DATA_GOVERNANCE.md`)

- Approximate unique IPs to `/api/predict` (Caddy log grep): <N>
- Any bio.tools / JOSS mentions we noticed: <link>
- Any external citations discovered: <link>

---

## Backlog / next-month plan

Top 5 items Alex plans to touch next month:

1.
2.
3.
4.
5.

---

## Cross-references

- SLO source: `docs/active/SLO.md`
- Incident source: `docs/active/postmortems/` + Sentry
- Roadmap source: `docs/active/ROADMAP.md`
- Ownership: `docs/active/OWNERSHIP_MATRIX.md`
```

---

## What "Green" means precisely

**Green** = all 8 health boxes ✓. Said reads TL;DR + Said-attention flags (usually empty in green months) and does nothing.

**Yellow** = 1-2 boxes unchecked, no user-facing impact, no SLO breach. Said reads the full report but takes no action unless something in "Said-attention flags" says otherwise.

**Red** = SLO breach OR open SEV1 OR Sentry quota > 90 % OR CI red for > 3 days on `main`. Said reads the full report AND replies within 3 business days with a decision.

---

## What Said explicitly does NOT do in this loop

- Does not review individual Dependabot PRs
- Does not read Sentry issues
- Does not receive Sentry alerts (SEV1 escalations excepted)
- Does not track CI failures live
- Does not review individual code PRs unless CODEOWNERS requires it (`api_models.py`, axiom logic, `DECISIONS.md`)

---

## What Alex explicitly DOES in this loop

- Drafts the report by the first Monday of each month
- Runs the health check-list live (Sentry SLO panel, Dependabot queue count, monthly `/api/health` percentage from Cron Monitor)
- Writes postmortems for SEV1/SEV2 as they close (during the month)
- Commits `docs/active/reports/YYYY-MM.md` on the first Monday
- Emails Said the file's GitHub URL

---

## What Peleg is NOT part of

Peleg is not on the monthly-report distribution. Scientific escalation happens directly via email or Drive comments as needed. When something needs her input, an RFC (`RFC_TEMPLATE.md`) is filed and Alex or Said pings her.

---

## First month to run this: 2026-08-04

The first monthly report is due 2026-08-04 (first Monday of August 2026), covering July 2026. Alex to draft.
