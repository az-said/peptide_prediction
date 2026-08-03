# Ownership Matrix — PePFibPred

**Last updated**: 2026-07-12
**Authoritative for**: who has admin access, who receives alerts, who signs off on what

> **Reading rule**: this matrix is the durable answer to *"who owns X"*. The evolving process wrapper (escalation timers, on-call rotation, monthly cadence) lives in `ONCALL.md`.
>
> **👋 Alex — if you're being onboarded, [`ALEX_ONBOARDING.md`](ALEX_ONBOARDING.md) is your master guide. This matrix is Day 4 reading; come back after finishing Day 3.**

---

## Roles

| Role | Person | What they do | What they receive |
|---|---|---|---|
| **Owner** | Said Azaizah (`az-said`) | Full admin on every platform. Veto on scientific + architectural ADRs. Never removed. | **Monthly digest** (see `MONTHLY_REPORT_TEMPLATE.md`) + SEV1 escalations only. Silent by default. |
| **Primary Responder** | Aleksandr Golubev (`axelgolubev`) | Day-to-day operator. First responder on Sentry. Primary GitHub reviewer for infra + ops. | All Sentry issue alerts. All Dependabot PRs. All CI failures on main. |
| **Scientific Authority** | Peleg Ragonis-Bachar | Owns algorithm axioms (FF-Helix / FF-SSW / SSW definitions, thresholds, ranking). | Not on GitHub review path. Consulted off-repo via Drive comments / RFC replies. |

---

## Platform-by-platform matrix

| Surface | Owner (admin) | Primary Responder (paged) | Notes |
|---|---|---|---|
| **GitHub org `az-said`** | Said (permanent) | — | Said sole `Owner` role. Kept on Said for portfolio + institutional-record continuity. Not transferred to Alex. Updated 2026-08-04. |
| **GitHub repo `peptide_prediction`** | Said (via org) | Alex (Admin) | Alex has `Admin` at repo level — full write, merge, secret management, Dependabot triage. Cannot delete the repo or remove Said. Updated 2026-08-04. |
| **Sentry** | Alex (new free org) | Alex | Said left the old `desycssb` org and does not run a Sentry account for this project anymore. Alex owns a new free-tier org, holds the DSN + auth token, and forwards any `[SEV1]` mail to `said.azaizah@cssb-hamburg.de` via a mailbox rule. Updated 2026-08-04. |
| **Zenodo** | Auto (linked repo) | — | DOI minted by webhook on tagged release. No per-user admin; whoever links the repo owns the mint. |
| **PyPI — `pvl-cli`** | Said (Owner) | Alex (Maintainer) | Both can publish. Ownership stays with Said for the portfolio record. Updated 2026-08-04. |
| **PyPI — `pvl-mcp`** | Said (Owner) | Alex (Maintainer) | Same as above. Updated 2026-08-04. |
| **GHCR** | Inherits from GitHub org | — | No separate admin. |
| **Hetzner VPS (`94.130.178.182`)** | Alex | Said | Alex is the account owner (billing + Cloud console); Said retains root SSH for founder-oversight. Updated 2026-07-12. |
| **DESY VM (`landau-webapp-dev`)** | Alex | Alex | Once DESY IT unblocks. Said retains transitional SSH access. |
| **GitHub Pages (mkdocs docs site)** | Inherits from GitHub org | — | |
| **GitHub Discussions** | Inherits from GitHub org | — | Alex moderates by default. |
| **Cloudflare DNS** (if used) | Said | Alex | Both Super Administrator. |
| **bio.tools** | Said (submitter) | — | Once submitted. |
| **JOSS submission** | Said (submitter) | — | Once submitted. |
| **`CITATION.cff`** | Said (edits) | Alex (review) | Author list + ORCIDs + version string. |
| **`api_models.py`** — API contract | Said (veto) | Alex (review) | Peleg approves off-repo for schema changes touching axiom fields. |
| **`DECISIONS.md` — ADR log** | Said (veto) | Alex (review) | Any ADR touching science requires Peleg off-repo sign-off. |
| **Paper drafts** | Both | Both | `docs/active/paper_drafts/`. |
| **Monthly digest report** | Alex (drafts) | Said (reads) | See `MONTHLY_REPORT_TEMPLATE.md`. |

---

## Roles that Peleg holds even though she is not a GitHub committer

Peleg Ragonis-Bachar (Technion, Landau lab) owns the following scientific artefacts. Any change to code implementing these requires her off-repo sign-off before merge:

- **FF-Helix classifier definition** — `_HELIX_PROP` values in `backend/auxiliary.py:21–42`; window size + threshold in `backend/config.py:159, 162`
- **FF-SSW gate** — hydrophobicity threshold `DEFAULT_HYDRO_CUTOFF` in `backend/config.py:365`
- **SSW axiom composition** — the `OR` rule in `backend/auxiliary.py:340–361` (Peleg canonical rule, backed by ISSUE-032 fix)
- **μH threshold** — `DEFAULT_MU_H_CUTOFF` in `backend/config.py:362`
- **TANGO hotspot threshold** — `DEFAULT_AGG_THRESHOLD` in `backend/config.py:375`
- **40-residue length cap** — `S4PRED_MAX_LENGTH` in `backend/config.py:216`; ADR-022
- **Reference-database curation** — `staphylococcus_2023.xlsx` + `peleg_118_fibril_validated.json`

Sign-off is recorded in the merging PR either as a linked Drive comment permalink, a linked GitHub Discussion RFC entry, or a linked email (paste into the PR description). See `RFC_TEMPLATE.md` for the RFC flow.

---

## Sentry-specific (2026-08-04 update): Alex owns the whole Sentry surface

The original plan had Said stay as Sentry Owner. On 2026-08-04 that plan changed because the `desycssb` org is on the free Developer plan (1-member cap), and paying $26/mo for Team plan just to keep Said listed as Owner wasn't worth it for a research tool. The revised plan:

- Alex creates a fresh Sentry account under `aleksandr.golubev@cssb-hamburg.de` and a new org (e.g. `pepfibpred`).
- Alex spins up a Python project inside his org and sends Said the DSN + a Sentry auth token (scopes: `project:releases`, `org:read`).
- Said updates the `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` secrets on `az-said/peptide_prediction`.
- Said leaves the old `desycssb` org (Settings → Members → Leave; or Settings → General → Close Account).
- Alex receives all Sentry alerts by default (free-tier notification prefs).
- Alex configures a single email-forwarding rule: any subject containing `[SEV1]` → forwarded to `said.azaizah@cssb-hamburg.de`. That is Said's only Sentry signal going forward.

Sentry ownership sits entirely with Alex from that point. Said is fully off the Sentry pager and does not run a Sentry account for this project. GitHub org + repo + PyPI ownership are unchanged (Said keeps them for portfolio continuity).

The runbook detail for Alex's alert-routing setup on his side (Team: Owners routing, SEV1 escalation rules, weekly report toggles) is at `docs/active/paper_drafts/13_sentry_migration_runbook.md`.

---

## Change log

- **2026-08-04** — Ownership pivot. Said keeps sole `Owner` on GitHub org `az-said` (permanent, for portfolio + institutional record); Alex gets `Admin` at repo level only, not org level. Sentry: Said leaves the free-tier `desycssb` org entirely; Alex creates a new free-tier org and owns Sentry end-to-end, forwarding only `[SEV1]` to Said. PyPI: Said stays Owner, Alex becomes Maintainer (both can publish). Related updates in `HANDOFF_TECH_PLAYBOOK.md`, `FOR_NEXT_BUILDER.md`, `CLOSE_OUT_ONE_FILE.md`.
- **2026-07-12** — Matrix created. Said (Owner + veto). Alex (Primary Responder + operator). Peleg (Scientific Authority, off-repo). Sourced from `07_alex_admin_checklist.md` §11.
