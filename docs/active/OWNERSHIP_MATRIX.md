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
| **GitHub org `az-said`** | Said | Alex (also Owner) | Both `Owner` role. Said retains veto via CODEOWNERS. |
| **GitHub repo `peptide_prediction`** | Said | Alex | Both `Admin` at repo level (belt-and-suspenders). |
| **Sentry** | Said | Alex | Said stays Owner but personal notification preferences are silenced (see `13_sentry_migration_runbook.md`). Alex receives all issue alerts. SEV1 auto-escalates to Said after 30 min unresolved (business hours) / 2 h off-hours. |
| **Zenodo** | Auto (linked repo) | — | DOI minted by webhook on tagged release. No per-user admin; whoever links the repo owns the mint. |
| **PyPI — `pvl-cli`** | Said | Alex | Both Owner role. |
| **PyPI — `pvl-mcp`** | Said | Alex | Both Owner role. |
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

## Sentry-specific: Said stays Owner + goes quiet

The most common source of confusion in a founder-oversight transition is Sentry. Explicit statement:

- Said **remains Sentry Owner** — full admin, billing, org settings
- Said's *per-user notification preferences* are configured to **silence issue-alert emails** to his personal inbox (Account → Notifications → Issue Alerts → "Only on issues I'm subscribed to")
- Said **still receives** the weekly Sentry digest email (low-noise founder-oversight signal)
- Said **is the escalation target** for any SEV1 issue unresolved after 30 min (business hours) or 2 h (off-hours)
- Alex receives all raw issue-alert emails as the primary responder

This is the "Owner without a pager" pattern documented in `12_master_handover_playbook.md` §1.

---

## Change log

- **2026-07-12** — Matrix created. Said (Owner + veto). Alex (Primary Responder + operator). Peleg (Scientific Authority, off-repo). Sourced from `07_alex_admin_checklist.md` §11.
