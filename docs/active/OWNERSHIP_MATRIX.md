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
| **GitHub org `az-said`** | Said (permanent Owner) | — | Said keeps sole `Owner` role at org level (portfolio + institutional record). Alex operates via repo-Admin below. |
| **GitHub repo `peptide_prediction`** | Said (via org) | Alex (Admin) | Alex has `Admin` at repo level — full write, merge, secret management, Dependabot triage. Cannot delete the repo or remove Said. |
| **Sentry** | Alex (new free org) | Alex | Alex creates a fresh Sentry account under his DESY email and a new org (e.g. `pepfibpred`). He holds the DSN + auth token. Said leaves the old `desycssb` org and receives only `[SEV1]` mail via a forwarding rule on Alex's side. Reverted to this plan 2026-08-05 (b) — declined Team-plan spend. |
| **Zenodo** | Auto (linked repo) | — | DOI minted by webhook on tagged release. No per-user admin; whoever links the repo owns the mint. |
| **PyPI — `pvl-cli`** | Said + Alex (co-Owners) | Alex (publish) | Both hold `Owner` role. Either can publish releases. Updated 2026-08-05. |
| **PyPI — `pvl-mcp`** | Said + Alex (co-Owners) | Alex (publish) | Both hold `Owner` role. Either can publish releases. Updated 2026-08-05. |
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

## Sentry-specific (2026-08-05 b — final): Alex creates his own free org

Said declined the Team-plan spend. Final plan:

- Alex creates a fresh Sentry account under `aleksandr.golubev@cssb-hamburg.de` and a new org (e.g. `pepfibpred`).
- Alex spins up a Python project, sends Said the DSN + a Sentry auth token (scopes: `project:releases`, `org:read`).
- Said updates `SENTRY_DSN` + `SENTRY_AUTH_TOKEN` secrets on `az-said/peptide_prediction`.
- Said leaves the `desycssb` org.
- Alex receives all Sentry alerts by default. A single mailbox rule on his side forwards any subject containing `[SEV1]` to `said.azaizah@cssb-hamburg.de`. That is Said's only Sentry signal going forward.

Sentry is the one surface where the co-admin-everywhere pattern doesn't apply — free-tier cap makes it uneconomical. Said stays "in the loop" via [SEV1] forwarding only. All other surfaces (GitHub, PyPI, Drive, Upptime, bio.tools, JOSS) apply the co-admin-everywhere pattern.

---

## Change log

- **2026-08-05** — Co-admin-everywhere pivot. Said wants to remain a listed Owner/Admin on every operational surface for portfolio continuity + relationship preservation. Changes from the 2026-08-04 plan: Sentry stays Said + Alex co-Owners on an upgraded Team plan (~$26/mo) instead of transferring away; PyPI Alex becomes co-Owner (not just Maintainer). GitHub org level unchanged (Said keeps sole `Owner`, Alex operates as repo-Admin). Full step-by-step transfer instructions live in the private personal archive (`~/Desktop/DESY/pvl_personal_archive/give_alex_admin_everywhere_stepwise.md`).
- **2026-08-04** — First ownership pivot. Said keeps sole `Owner` on GitHub org `az-said`; Alex gets `Admin` at repo level only. Sentry: transfer entirely to Alex on free tier. PyPI: Said Owner, Alex Maintainer. *(Superseded 2026-08-05 for Sentry + PyPI; GitHub-org portion retained.)* Related updates in `HANDOFF_TECH_PLAYBOOK.md`, `FOR_NEXT_BUILDER.md`, `CLOSE_OUT_ONE_FILE.md`.
- **2026-07-12** — Matrix created. Said (Owner + veto). Alex (Primary Responder + operator). Peleg (Scientific Authority, off-repo). Sourced from `07_alex_admin_checklist.md` §11.
