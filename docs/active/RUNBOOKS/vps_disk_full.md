# Runbook — VPS disk full

**Severity**: SEV1 (predictions will start failing; new writes to caches / logs / precompute artefacts refused)
**Typical detection**: Sentry `OSError: [Errno 28] No space left on device`; Upptime `/api/health` returning 5xx after cache write failure
**Runtime impact**: everything writing to disk (Docker layers, DuckDB caches, TANGO run dirs, Sentry local queue) fails

---

## Symptom

- Sentry: `OSError: [Errno 28] No space left on device`
- Container health check failing
- `docker logs` showing "write failed" cascade
- `df -h` on the host shows the primary partition > 95 % full

---

## Verify

```bash
ssh root@94.130.178.182
df -h                                       # overall
docker system df                            # what Docker is using
du -sh /data/* 2>/dev/null | sort -h        # if /data is a mount
du -sh /var/lib/docker/* 2>/dev/null | sort -h
```

Common culprits:
- Docker image cache growing unbounded — most likely
- TANGO run dirs never cleaned
- Sentry SDK's local queue file
- LanceDB index files growing
- Old container logs

---

## Escalate

- If the cause is unclear after 15 min → escalate to Said even though this is SEV1 mitigation is straightforward
- If the DuckDB cache has grown to > 10 GB, that's an architectural issue worth an ADR discussion

---

## Rollback / Mitigate

1. **Immediate — reclaim Docker space** (safe, ~2-5 GB usually):
   ```bash
   docker system prune -af --volumes
   # Deletes: unused images, stopped containers, unused networks, dangling build cache
   # Preserves: running containers, named volumes (unless not-referenced)
   ```
   Verify `df -h` after.

2. **Truncate large logs**:
   ```bash
   # Docker container logs
   find /var/lib/docker/containers -name "*-json.log" -exec truncate -s 0 {} \;
   # System journals (careful — this deletes journal history)
   journalctl --vacuum-size=100M
   ```

3. **Clean old TANGO run dirs** (safe — the pipeline creates new ones on demand):
   ```bash
   docker exec pvl-backend bash -c "find /data/tango_runs -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +"
   ```

4. **Rebuild precomputed artefacts** — if step 1-3 didn't free enough, and the precomputed artefacts are the largest single files (see `du` output), delete them and rebuild:
   ```bash
   docker exec pvl-backend rm -f /data/precomputed/*.json
   docker exec pvl-backend make precompute-datasets
   ```

5. **Provider cache emergency shrink** — the DuckDB provider cache is append-only and grows over time. Truncate rows older than 90 days:
   ```bash
   docker exec pvl-backend python -c "
   import duckdb
   c = duckdb.connect('/data/cache/provider_cache.duckdb')
   c.execute('DELETE FROM provider_cache WHERE updated_at < NOW() - INTERVAL 90 DAY')
   c.execute('VACUUM')
   c.close()
   "
   ```

6. **Nuclear option** — resize the Hetzner volume via the Cloud console. This costs money but is one-click.

---

## Post-incident

- Postmortem required (SEV1)
- If the cause was Docker cache — schedule a monthly `docker system prune` via cron (add to `docs/active/PRODUCTION_LOCKDOWN.md`)
- If the cause was the DuckDB cache — file an issue for a compaction-cron job
- If the cause was the precompute artefact — this shouldn't happen (they're bounded by the reference database sizes); investigate

---

## Related

- `backend/services/provider_cache.py` — the DuckDB cache
- `backend/scripts/precompute_dataset.py` — the artefact builder
- `docker/docker-compose.prod.yml` — volume declarations
- ADR-024 (precompute artefact pattern)
