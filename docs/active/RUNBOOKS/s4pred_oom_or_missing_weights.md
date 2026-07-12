# Runbook — S4PRED PyTorch OOM or missing weights

**Severity**: SEV1 if every prediction fails; SEV2 if only some (batch-only, long sequences, etc.)
**Typical detection**: Sentry issue with `torch.cuda.OutOfMemoryError` (won't happen — we're CPU-only) or `RuntimeError: [enforce fail at ...]` or `FileNotFoundError` on `/opt/tools/s4pred/models/weights_*.pt`
**Runtime impact**: helix / SSW / FF-Helix / FF-SSW columns become null; ranking still works with degraded weights

---

## Symptom

- Sentry: `FileNotFoundError: /opt/tools/s4pred/models/weights_N.pt` (weights missing on volume)
- Sentry: `torch.cuda.OutOfMemoryError` (should be impossible — flag as anomaly, we're CPU-only per Dockerfile)
- Sentry: `RuntimeError: memory allocator ...` — CPU RAM exhaustion
- User-visible: response has `s4predAttempted: false`, all S4PRED columns null

---

## Verify

```bash
ssh root@94.130.178.182
docker exec pvl-backend ls -la /opt/tools/s4pred/models/
# Expected: weights_1.pt through weights_5.pt, each ~89.7 MB
docker exec pvl-backend python -c "from backend.s4pred import is_s4pred_available; print(is_s4pred_available())"
# Expected: (True, None) or (False, "<reason>")
```

Check memory pressure:

```bash
docker stats --no-stream pvl-backend
# Watch MEM USAGE / LIMIT — if usage is > 90 % of the container limit, it's OOM
```

---

## Escalate

- The recovery below is safe to run without scientific decision
- If the weights are producing numerically wrong outputs (rare — check against a known-good peptide), that's SEV1 and Peleg needs to be pulled in

---

## Rollback / Mitigate

1. **Missing weights** — re-run the bootstrap:
   ```bash
   docker exec pvl-backend bash /opt/pvl/scripts/desy_vm_bootstrap.sh
   # Skips existing steps; downloads any missing weights from the pinned mirrors
   ```
   Verify:
   ```bash
   docker exec pvl-backend ls -la /opt/tools/s4pred/models/
   docker exec pvl-backend python -c "from backend.s4pred import is_s4pred_available; print(is_s4pred_available())"
   ```

2. **Memory pressure** — the S4PRED forward is CPU-only and single-threaded per `backend/_perf_init.py:28–37`. If OOM is the cause, most likely the batch size is too large. Immediate mitigation: reduce max batch size:
   ```bash
   # Add to .env.deploy:
   PVL_S4PRED_BATCH_SIZE=8       # default is 32; halve until OOM stops
   docker compose -f docker/docker-compose.prod.yml restart backend
   ```

3. **Container-level memory limit** — check `docker-compose.prod.yml:31` for the backend service `mem_limit`. If it's < 4 GB, bump to 4 GB and restart. On Hetzner CX33 (8 GB total) leaving 3 GB headroom for OS + Redis + Celery workers, backend at 4 GB is safe.

4. **Nuclear option** — flip `USE_S4PRED=0` in `.env.deploy`. TANGO + FF-Helix + biochem still run; helix / SSW / FF-SSW columns will be null. Not a great user experience but not a scientific error.

---

## Post-incident

- Postmortem required for SEV1
- If OOM was the cause: consider whether the S4PRED batching heuristic in `backend/tools/s4pred/model.py:221–227` needs tuning, or whether the container memory limit should be permanently raised
- Update this runbook if a new memory-pressure signature was found

---

## Related

- `backend/s4pred.py:34–72` — availability check
- `backend/tools/s4pred/model.py:77–91` — weight loading
- `backend/tools/s4pred/model.py:221–227` — N=1 fast path
- `backend/_perf_init.py:28–37` — thread pinning
- `scripts/desy_vm_bootstrap.sh` — weights bootstrap
- ADR-025 (thread pinning + memory rationale)
