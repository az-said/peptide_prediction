# Runbook — TANGO subprocess failure

**Severity**: SEV2 (single-sequence still returns partial output with `tangoAttempted=false`)
**Typical detection**: Sentry issue with `TangoOutputBindingError` in the fingerprint; or user report of "TANGO curves missing" on the results page
**Runtime impact**: β-aggregation propensity, hotspot flag, SSW (TANGO-side), and Smart Ranking scores that depend on TANGO become unavailable

---

## Symptom

Sentry fingerprint contains one of:
- `TangoOutputBindingError: expected N outputs, got 0`
- `subprocess.TimeoutExpired: Command '<path to Tango_run.sh>' timed out after Xs`
- `FileNotFoundError: <TANGO_BINARY_PATH>`
- Silent — the response contains `tangoAttempted: false` for all peptides but `s4predAttempted: true` (which is the "TANGO half of the pipeline is offline" signature)

---

## Verify

```bash
ssh root@94.130.178.182
docker exec pvl-backend bash
env | grep TANGO_BINARY_PATH
ls -la "$TANGO_BINARY_PATH" 2>&1
# Should exist and be executable
```

Try the smoke test end-to-end:

```bash
docker exec pvl-backend make smoke-tango
# Expected: "N outputs for N inputs" — pass
```

Look at recent logs:

```bash
docker exec pvl-backend python -c "from backend.tango import _latest_run_dir; print(_latest_run_dir())"
# Then inspect that dir for stderr
```

If the binary is missing or not executable, this is the runbook. If the binary is fine but the wrapper is timing out, it's likely a *runaway* — a peptide that TANGO cannot process; skip to §Rollback step 3.

---

## Escalate

- The full recovery below is safe to run without a scientific decision
- If TANGO is producing outputs but with numerically wrong values (rare — check by hashing against a known-good peptide's expected outputs), that's a SEV1 not a SEV2, and Peleg needs to be pulled in

---

## Rollback / Mitigate

1. **Restart the container**:
   ```bash
   docker compose -f docker/docker-compose.prod.yml restart backend
   sleep 10
   docker exec pvl-backend make smoke-tango
   ```
   If the smoke passes, watch Sentry for 15 min. If no new errors, the runbook is done — file a postmortem only if this is the second occurrence in the month.

2. **If step 1 didn't fix it** — the binary may have been quarantined (macOS-signature issue on a re-pulled image) or corrupted. Re-pull:
   ```bash
   docker compose -f docker/docker-compose.prod.yml pull backend
   docker compose -f docker/docker-compose.prod.yml up -d --force-recreate backend
   sleep 15
   docker exec pvl-backend make smoke-tango
   ```

3. **If step 2 didn't fix it — a specific peptide is killing TANGO** (rare, but possible for very short or oddly-composed sequences). Locate the recent run dir and inspect the input file:
   ```bash
   docker exec pvl-backend python -c "from backend.tango import _latest_run_dir; d=_latest_run_dir(); print(d)"
   docker exec pvl-backend cat /path/from/above/input.dat | head -20
   ```
   Identify the peptide, log a filter rule (temporarily) in `backend/config.py :: TANGO_INPUT_DENYLIST`, and re-deploy. File a postmortem *and* a scientific-question issue for Peleg (a TANGO-killer peptide is scientifically interesting).

4. **Nuclear option** — if all else fails and users are being blocked, flip `USE_TANGO=0` in `.env.deploy`, restart, and set `MAINTENANCE_MODE_MESSAGE="TANGO temporarily disabled — S4PRED-only results shown"`. S4PRED-only responses are still scientifically valid but incomplete. Restore TANGO as soon as root cause is fixed.

---

## Post-incident

- Postmortem required if this is SEV2 and root cause is unclear
- If the peptide-specific §Rollback step 3 was the fix: also file a scientific-question Discussion for Peleg — "why does TANGO fail on this composition?"
- If the fix was a re-pull (§Rollback step 2): consider whether the image build needs to be pinned to a specific SHA to prevent silent replacement

---

## Related

- `backend/tango.py:41–75` — binary resolution logic
- `backend/tango.py:287` — the TANGO command
- `backend/tango.py:1446–1581` — `smoke_test_tango`
- `backend/scripts/smoke_tango.py` — `make smoke-tango`
- ADR-026 (hotspot threshold), ADR-024 (precompute artefact pattern — affected by this)
