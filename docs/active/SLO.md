# Service-Level Objectives — PePFibPred

**Effective**: 2026-07-12
**Owner**: Alex Golubev (measurement + reporting)
**Escalation**: Said Azaizah (any breach → monthly report flag)

> Two SLOs — no more. PePFibPred is a research web-server, not transactional SaaS. Small teams intentionally run "SLO-lite" — 1-2 targets, not a dozen dashboards.

---

## SLO 1 — Availability

**Objective**: `/api/health` returns a 200 on ≥ 99 % of pings across a calendar month.

**SLI**: percentage of successful `/api/health` responses over 5-minute pings from Sentry Cron Monitor (see `SENTRY_RUNBOOK.md` Phase S.8).

**Error budget**: 1 % per month ≈ **7 h 18 min** of unavailability per month.

**Rationale**: single-VM Hetzner deployment with no HA; DESY VM migration will lift this once the K8s cluster provides multi-node redundancy. 99 % is honest for the current infrastructure.

---

## SLO 2 — Single-sequence prediction latency

**Objective**: p95 warm-cache latency of `/api/predict` (single-sequence path) < 2 s across a calendar month.

**SLI**: 95th percentile of `predict` transaction duration reported by Sentry Performance Monitoring (see `SENTRY_RUNBOOK.md` Phase S.6).

**Warm cache** is defined as: same-sequence request served within the last 24 h. Cold-cache latency (first-time sequence) is not covered by this SLO — cold TANGO + S4PRED can legitimately take 40-80 s.

**Rationale**: p95 < 2 s warm is the interactive-feel threshold for the web dashboard. Above 2 s, the user-experience degrades noticeably; below 2 s, the tool "feels fast".

---

## Error-budget policy

**Halt rule**: if either SLO breaches in a given calendar month:

1. Non-critical feature merges to `main` are frozen until the root cause lands in a written postmortem (`postmortems/TEMPLATE.md`)
2. Scientific bug fixes continue to ship
3. Security fixes continue to ship
4. The root-cause postmortem must contain at least one action item classified as "preventative" (not just "mitigative")
5. The postmortem must be linked from the monthly report (`MONTHLY_REPORT_TEMPLATE.md`)

**Non-halt tracking**: if the budget is not breached but the trailing 30 d shows ≥ 50 % of budget consumed, the monthly report flags it under "Said-attention" — no halt, but Said reads about it.

---

## What's out of scope

- Batch predict `/api/predict/batch` latency — bounded by input row count and the (currently sync, will become Celery) queue; no SLO
- UniProt-execute `/api/uniprot/execute` latency — bounded by UniProt's own REST latency; not a PePFibPred SLI
- Frontend page-load — measured by Web Vitals in Sentry Replay when enabled; not committed as SLO
- Cold-cache single-sequence latency — see §"warm cache" above
- Batch job success rate — tracked as an incident-severity item under `INCIDENT_SEVERITY.md`, not as an SLO

---

## Measurement + reporting

- **Sentry Cron Monitor** (Phase S.8) pings `/api/health` every 5 min. Failed ping = the SLI datapoint. Aggregated per month by Sentry.
- **Sentry Performance** (Phase S.6) reports p95 transaction duration for `predict` — filter by `sequenceSource:demo|user` and by `mode:single` to isolate the warm-cache single-sequence path.
- **Monthly report** (`MONTHLY_REPORT_TEMPLATE.md`) copies the two SLI values verbatim.
- **Public status page** (Upptime, one workflow away from being live per `12_master_handover_playbook.md` §3) will render the `/api/health` SLI publicly.

---

## SLO review cadence

- **Quarterly**: Said + Alex review the SLOs against the monthly reports. If either has been breached ≥ 2 months in a rolling quarter, the SLO gets tightened *or* the underlying infrastructure gets a resourced fix (not a target-relaxation).
- **On promotion to DESY K8s cluster**: SLO 1 tightens to 99.5 % monthly (≈ 3 h 40 min budget).
- **On adoption of the Celery async queue (ADR-027)**: an SLO 3 for job-completion latency will be added.

---

## Bootstrap: what to do this week to make these SLOs real

1. **Enable Sentry Cron Monitor** (Phase S.8) — 20 min. `curl` from a GitHub Actions workflow every 5 min against `/api/health`, POST to Sentry Cron endpoint.
2. **Confirm Sentry Performance is on** for the backend project — verify by opening the Performance tab in Sentry.
3. **Bookmark the Sentry SLO dashboard** for Alex + Said.
4. **Update `SENTRY_RUNBOOK.md`** to point at this document under §"SLO".
