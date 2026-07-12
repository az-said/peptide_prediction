# Monthly Report — 2026-07 (EXAMPLE — delete before Alex writes the real one)

**Drafter**: (example — Alex would draft the real one)
**Reader**: Said Azaizah
**Reporting period**: 2026-07-01 to 2026-07-31

> **This is a worked example so Alex has something concrete to model against.**
> Delete this file when the real 2026-07 report is drafted (due 2026-08-04). Template is at `../MONTHLY_REPORT_TEMPLATE.md`.

---

## TL;DR — one line

**Green.** Zero SEV1/SEV2 incidents this month, both SLOs met with room to spare, three Dependabot patch PRs merged, on track for v1.0.0 in early August.

---

## Health check-list

- [x] `/api/health` availability ≥ 99 % this month (SLO 1) — measured: **99.7 %** (2.2 h downtime during 2026-07-14 Hetzner-scheduled maintenance)
- [x] `/api/predict` p95 latency < 2 s warm-cache (SLO 2) — measured: **1.34 s p95**
- [x] Zero SEV1 incidents — count: **0**
- [x] Zero SEV2 incidents lasting > 1 business day — count: **0** (one SEV2 opened + resolved within 4 h — see below)
- [x] Dependabot queue < 5 open PRs — count: **2** open, both non-security
- [x] CI on `main` green — last-red-date: **2026-07-08** (fixed same day)
- [x] Sentry quota < 75 % consumed — current: **34 %**
- [x] Latest release ≤ 30 days ago — current version: **v0.3.0** released 2026-06-29

**Verdict**: Green. No boxes unchecked. Said takes no action.

---

## Incidents this month

| Date | SEV | Description | Duration | Postmortem link |
|---|---|---|---|---|
| 2026-07-11 14:03 UTC | SEV2 | UniProt REST returning 502 cascade; PePFibPred UniProt-guided mode broken (single-sequence + batch unaffected) | 4 h 12 min | `postmortems/2026-07-11-uniprot-502-cascade.md` |

**Postmortems written this month**: 1 — see above.

---

## Releases this month

_No new releases in July 2026._

Zenodo DOIs minted: none.

---

## Dependency updates

- Dependabot PRs merged: **3** (all patch-level, auto-merged on green CI: `httpx 0.28.1 → 0.28.2`, `pandas 2.3.0 → 2.3.1`, `slowapi 0.1.9 → 0.1.10`)
- Dependabot PRs open: **2** (one minor bump `numpy 2.4.5 → 2.5.0` awaiting Said's approval; one major bump `duckdb 1.5.2 → 2.0.0` awaiting Said's approval and RFC filing per `RFC_TEMPLATE.md`)
- Auto-merged on green CI: **3** (see above)
- CVE / Security Advisories requiring attention: **none**

---

## Scientific / Peleg touchpoints

- Peleg emailed asking about OQ7 (β-% calculation threshold) — response deferred to Q3 by mutual agreement (still non-blocking for the paper)
- No new axiom-touching PRs this month
- No new RFCs filed

---

## Roadmap progress

| Item | Last month | This month |
|---|---|---|
| A.3 Server-Sent Events for progressive batch | NOT STARTED | PARTIAL (backend endpoint scaffolded on `feature/sse` branch) |
| B.1 MCP tool 4-7 completion | PARTIAL 4/7 | PARTIAL 5/7 (`rank_candidates` shipped 2026-07-22) |
| E.9 Test coverage to 80 % | PARTIAL | PARTIAL (services/normalize.py 62 % → 74 %) |

---

## Said-attention flags

- **[FLAG]** Dependabot has a MAJOR bump for DuckDB (1.5.2 → 2.0.0) — needs your RFC decision before merge. See PR #147.
- **[FLAG]** Peleg's OQ7 (β-% threshold) still open — do we cut v1.0.0 with it deferred, or do you want to try to close it first?

If both flags are addressed → next month goes fully green with no attention items.

---

## Financial / billing notes

- Hetzner: €5.83 (CX33 monthly) — no change
- Sentry: free tier, well below quota
- PyPI / Zenodo / GitHub: free tier
- Any changes needed: none

---

## Traffic / adoption

- Approximate unique IPs to `/api/predict` (Caddy log grep): ~470 unique IPs this month
- bio.tools mentions we noticed: registration submitted 2026-07-15, pending curator approval
- External citations discovered: none (pre-release)

---

## Backlog / next-month plan

Top 5 items I plan to touch next month:

1. Land v1.0.0 tag (assuming Said gives go-ahead on DuckDB decision + OQ7)
2. Finish SSE progressive batch (A.3)
3. Complete MCP tools 6 + 7 (B.1)
4. Draft first canary-suite growth batch (E.2)
5. Merge or reject the DuckDB major bump PR based on Said's decision

---

## Cross-references

- SLO source: `docs/active/SLO.md`
- Incident source: `docs/active/postmortems/` + Sentry
- Roadmap source: `docs/active/ROADMAP.md`
- Ownership: `docs/active/OWNERSHIP_MATRIX.md`

---

*This example was pre-drafted by Said on 2026-07-12 so Alex has a concrete template. Delete when the real 2026-07 report lands.*
