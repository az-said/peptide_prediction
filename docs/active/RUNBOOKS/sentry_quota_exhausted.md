# Runbook — Sentry quota exhausted

**Severity**: SEV2 (we lose observability, not the tool itself)
**Typical detection**: Sentry email "Your organisation has exceeded its event quota"; sudden silence on issue alerts despite errors occurring
**Runtime impact**: PePFibPred keeps working, but errors are no longer captured — we're blind

---

## Symptom

- Sentry email to the billing owner (Said): quota-exceeded warning
- Sudden silence on the "new-issue" email alerts
- Sentry SDK backend logs (`docker logs pvl-backend | grep sentry`) contain: `"429 Too Many Requests"` from the Sentry ingest endpoint

---

## Verify

Log into Sentry → **Stats** → **Usage**. Confirm the quota is at 100 % for the current billing cycle. If not, this isn't the runbook — look at Sentry issue-alert rules instead.

---

## Escalate

- **Billing decision** — expanding the Sentry quota costs money. Said (billing owner) approves any tier upgrade.
- **Emergency** — if we cross into a critical release window with observability offline, Said may prefer to buy the upgrade rather than run blind.

---

## Rollback / Mitigate

1. **Immediate — reduce ingest rate**. In `backend/api/main.py`, temporarily raise the SDK sampling rate:
   ```python
   sentry_sdk.init(
       ...,
       traces_sample_rate=0.05,   # was 0.2; drop to 5 %
       profiles_sample_rate=0.0,  # disable profiling entirely
   )
   ```
   Redeploy. This buys ~4× more error capacity within the same quota.

2. **Filter noisy issues** — in Sentry → **Filters** → **Inbound Filters**, temporarily add:
   - Filter: `event.type == error && exception.type == HTTPException && status_code == 422`
   - This drops 422s (user-input errors) which are noisy and not actionable

3. **Bump the quota** — Said approves the upgrade in the Sentry billing UI. New quota takes effect immediately.

4. **Nuclear** — flip `SENTRY_ENABLED=false` in `.env.deploy` and redeploy. Complete blind mode; only use if the emergency is worse than losing observability. Update `RUNBOOKS/README.md` to remove Sentry-based detection paths until re-enabled.

---

## Post-incident

- Postmortem NOT required (SEV2, resolution is procedural)
- Update the monthly report with the quota-utilisation trend
- If quota-exhaustion is happening monthly: bump the plan permanently; do not paper over with sampling

---

## Related

- `docs/active/SENTRY_RUNBOOK.md` — the canonical Sentry integration doc
- `backend/api/main.py:47-55` — SDK configuration
- Sentry billing dashboard link (add here once known)
