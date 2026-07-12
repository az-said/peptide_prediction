# Runbooks — PePFibPred

**Owner (paged)**: Alex Golubev. **Escalation**: Said Azaizah (see `ONCALL.md`).
**Severity ladder**: `INCIDENT_SEVERITY.md`.
**Postmortem template**: `postmortems/TEMPLATE.md`.

> Every runbook here follows the same six-field shape: **Title → Symptom → Verify → Escalate → Rollback / Mitigate → Post-incident**. Add new runbooks by copying the `TEMPLATE.md` file.

## Existing runbooks

| File | Failure class | Typical severity |
|---|---|---|
| `tango_subprocess_failure.md` | TANGO binary crashes / hangs / returns empty output | SEV2 (single-sequence still returns partial) |
| `s4pred_oom_or_missing_weights.md` | S4PRED PyTorch OOM or weight file missing | SEV1 if all requests fail; SEV2 if only some |
| `vps_disk_full.md` | Reference deployment out of disk space | SEV1 |
| `sentry_quota_exhausted.md` | Sentry event ingestion halted (billing cap) | SEV2 (we lose observability, not the tool itself) |
| `desy_vm_ssh_lost.md` | Cannot SSH to the DESY VM (Kerberos / jump-host / firewall) | SEV3 (does not affect prod) |

## Adding a new runbook

1. Copy `TEMPLATE.md` to a new file with a `snake_case_short_name.md`
2. Fill the six fields
3. Add a row to the table above (with severity)
4. Link the new runbook from `SENTRY_RUNBOOK.md` if there's a Sentry alert that would surface this failure
5. Commit as `Said Azaizah <said.azaizah@cssb-hamburg.de>` (or whoever is authoring)
