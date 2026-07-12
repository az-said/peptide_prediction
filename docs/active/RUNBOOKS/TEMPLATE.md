# Runbook — <failure class one-liner>

**Severity**: SEV1 / SEV2 / SEV3
**Typical detection**: <Sentry alert / Cron monitor / user report / internal check>
**Runtime impact**: <what breaks for the user>

---

## Symptom

<How this presents in the wild. Include the Sentry issue fingerprint, log grep, or user-facing error string a responder will paste into Slack when reporting.>

Example line an alert or user would say:
> "<paste characteristic message here>"

---

## Verify

<How to confirm this is the failure class the responder thinks it is, versus a look-alike. 2-4 concrete commands.>

```bash
# On the reference deployment:
ssh root@94.130.178.182
docker logs pvl-backend | tail -50
```

Look for: <specific string>.

If you see: <alternative>, it's actually `<other_runbook.md>` — switch there.

---

## Escalate

<When to reach Said. Default: SEV1 with the escalation timer from ONCALL.md.>

- If the fix isn't obvious in the first 15 min → check Said's SEV1 auto-escalation (30 min business hours / 2 h off-hours) is armed
- If a scientific correctness question surfaces (e.g., "should we serve a stale cached result to unbreak the demo?") → email Peleg *and* wait for Said

---

## Rollback / Mitigate

<Ordered steps. The first step must be safe to run without further diagnosis. Prefer reversible mitigations first, then irreversible ones.>

1. **Quick mitigation** — <e.g., restart the container>
2. **If step 1 didn't help** — <e.g., roll back to the previous image tag>
3. **If step 2 didn't help** — <e.g., flip the maintenance flag>

```bash
# Concrete commands for each step
```

---

## Post-incident

- Post a resolution note to the public status page (Upptime)
- File a postmortem (`postmortems/YYYY-MM-DD-<slug>.md`) using `postmortems/TEMPLATE.md`
- Link the postmortem from this runbook if the incident revealed a gap
- Update this runbook if the mitigation step order needs revision
- Update `KNOWN_ISSUES.md` if a root-cause code bug is still open

---

## Related

- `INCIDENT_SEVERITY.md` — for how to classify
- `SENTRY_RUNBOOK.md` — for how alerts route
- `ONCALL.md` — for escalation timers
- `<related runbooks in this folder>`
