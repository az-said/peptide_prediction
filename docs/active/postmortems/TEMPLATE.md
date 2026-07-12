# Postmortem — YYYY-MM-DD — <one-line title>

**Severity**: SEV1 / SEV2
**Author**: <who wrote this postmortem>
**Reviewed by**: <Said / Peleg / Alex as applicable>
**Related incident**: GitHub Discussion #<n> (if applicable), Sentry issue link, related runbook link
**Filed within**: <e.g., 48 h of resolution>

> **This is a blameless postmortem.** Assume everyone acted with the information they had at the time. Investigate the *misleading information* and *system-level factors*, not the person.

---

## Summary (1–2 sentences)

<What happened, in one paragraph a stranger can understand. Include the user-visible impact and the total duration.>

---

## Impact

- **User-visible impact**: <e.g., "27 batch submissions between 14:03 and 15:12 UTC returned FF-Helix values that were 8 % too low">
- **Duration**: <start → end, in UTC>
- **Number of users affected**: <if known; otherwise "unknown — no user analytics">
- **Data integrity**: <was any data corrupted / lost / silently wrong?>
- **Public status page update**: <link, or "not published">

---

## Timeline (UTC)

| Time | Event |
|---|---|
| HH:MM | <event> |
| HH:MM | <event> |
| HH:MM | Mitigation started |
| HH:MM | Mitigation confirmed effective |
| HH:MM | Postmortem started |

---

## Root cause

<One paragraph. Focus on the mechanism, not the person. If multiple causes contributed, list them as "contributing factors" below.>

### Contributing factors

1. <Factor 1 — the systemic thing that made the primary cause possible>
2. <Factor 2 — the monitoring gap that delayed detection>
3. <Factor 3 — the process gap that delayed mitigation>

(Aim for 2-5 contributing factors. Google SRE's rule of thumb: if you only have one, you haven't looked hard enough.)

---

## Detection

- **How was this detected?** <Sentry alert / user report / internal check / CI gate>
- **How could this have been detected earlier?** <specific instrumentation or test that would have caught it before user impact>

---

## Response

- **Was the runbook followed?** <yes / no / no runbook existed>
- **Was the escalation timer correct?** <yes / no — with reasoning>
- **Was communication to users adequate?** <status page updated? / no user comm needed>

---

## What went well

<At least 3 items. Postmortems focus disproportionately on failures; explicitly capture the safety nets that worked. If nothing went well, that's itself a finding.>

1. <e.g., "Sentry alert fired within 90 s of the first user impact">
2. <e.g., "The rollback runbook worked on first attempt">
3. <e.g., "Alex responded within 4 min of the page">

---

## What went wrong

<Specific and concrete. Not "we should have been faster" but "the runbook did not mention the DuckDB lock file, so 8 min were spent searching for it manually".>

1. <>
2. <>
3. <>

---

## Action items

Each item must be: specific, owned, dated. Split into mitigative (prevents recurrence of *this* incident) and preventative (prevents this *class* of incident).

### Mitigative

| # | Action | Owner | Due |
|---|---|---|---|
| M1 | <> | <> | YYYY-MM-DD |
| M2 | <> | <> | YYYY-MM-DD |

### Preventative

| # | Action | Owner | Due |
|---|---|---|---|
| P1 | <> | <> | YYYY-MM-DD |
| P2 | <> | <> | YYYY-MM-DD |

---

## Lessons for the runbook / ADR log

- <Runbook that must be created or amended>
- <ADR entry that would prevent this class of decision from recurring>
- <Contract test that would catch this in CI>

---

## References

- Sentry issue: <link>
- Related runbook: `RUNBOOKS/<name>.md`
- Related ADR: `DECISIONS.md` ADR-<n>
- Related code paths: `<file:line>`
- Related public status page update: <link>
- Related GitHub Discussion: <link>

---

## Cross-linking hygiene

After this postmortem is committed:

1. Link from the monthly report (`MONTHLY_REPORT_TEMPLATE.md` § Postmortems this month)
2. Link from the runbook it corrects
3. Link from any ADR the action items generate
4. Link from `KNOWN_ISSUES.md` if the incident revealed a still-open code bug
