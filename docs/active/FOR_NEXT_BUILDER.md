# For the next builder

You just landed on PePFibPred (peptide fibril-formation prediction server). Someone handed you this repo and pointed you here.

Read this page in 5 minutes. Then follow the read-order that matches you. Everything you need is already in `docs/active/` — no external links, no missing tribal knowledge.

---

## What this is (1 minute)

- Research web-server for peptide fibril-formation prediction — TANGO (β-aggregation) + S4PRED (secondary structure) + FF-Helix (Chou-Fasman) + SSW-axiom classifier.
- Being submitted to NAR Web Server Issue 2026.
- Public repo. MIT-licensed. Zenodo-DOI-on-release. Aiming for bio.tools + JOSS.

## Stack (1 minute)

- **Backend**: Python 3.11, FastAPI, Pydantic v2, pandas, DuckDB provider cache, TANGO Fortran binary, S4PRED 5-model BiLSTM
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Zustand + Recharts
- **Deploy**: Docker Compose on Hetzner CX33 (billed to Alex Golubev); Caddy TLS front; auto-deploy on `git push main` via GitHub Actions
- **Ops**: Sentry (errors), Upptime (public status page), Dependabot (weekly), Gitleaks (per-push), CODEOWNERS routing

## Team (30 seconds)

- **Said Azaizah** (`az-said`) — GitHub org Owner, founder, silent on day-to-day. Escalate SEV1 only. `said.azaizah@cssb-hamburg.de`.
- **Aleksandr Golubev** (`axelgolubev`) — Primary Responder, DESY-CSSB. Owns Sentry, Dependabot, Hetzner billing, deploys. `aleksandr.golubev@cssb-hamburg.de`.
- **Peleg Ragonis-Bachar** — Scientific Authority. Owns the algorithm axioms. Off-repo (Drive comments, email).
- **Meytal Landau** — PI, Landau lab (DESY / Technion). Off-repo.
- **Matheus + future hires** — TBD. When they join, Alex points them here.

Authoritative: `docs/active/OWNERSHIP_MATRIX.md`.

## Prod (30 seconds)

- Hetzner: `94.130.178.182` — production, always on
- DESY VM `landau-webapp-dev` — planned dev/staging, blocked on DESY IT as of 2026-08-04
- Deploy: `git push origin main` → `.github/workflows/deploy.yml` → SSH to Hetzner → `docker compose pull && up -d`

---

## Read order — pick the one that describes you

### If you're a human, new to the project (30 min)

1. **`CLAUDE.md`** (repo root) — project ground rules, doc policy, TDD workflow, safety rules
2. **`docs/active/ALEX_ONBOARDING.md`** — Week 1 / Week 2 / Week 3 plan; even if you're not Alex, the structure works
3. **`docs/active/HANDOFF_TECH_PLAYBOOK.md`** — deep tech reference: access, deploy, DESY VM, GitLab migration prep, Dependabot ongoing
4. **`docs/active/OWNERSHIP_MATRIX.md`** — who owns what, who to escalate to
5. **`docs/active/OPERATOR_COOKBOOK.md`** — 21 recipes indexed by task
6. **`docs/active/DOCS_MAP_FOR_ALEX.md`** — everything else, indexed

### If you're a coding agent (Cursor Composer, Claude Code, or similar) — 5 min load

Read these files, in order, before you touch anything:

1. **`CLAUDE.md`** — binds you; overrides your defaults
2. **`docs/active/HANDOFF_TECH_PLAYBOOK.md` Chapter 0** ("Coding-Agent Contract") — hard rules
3. **`docs/active/HANDOFF_TECH_PLAYBOOK.md` Chapter 7** ("Coding-agent guardrails") — extended rules
4. **`docs/active/DECISIONS.md`** — grep for the area you're modifying before deciding
5. **`docs/active/KNOWN_ISSUES.md`** — do not "discover" bugs already tracked

Then respond to the maintainer with: "I've read CLAUDE.md, the tech playbook contract + guardrails, and skimmed decisions/known-issues. Ready. What do you want done?"

Never edit files outside the working tree, never bypass pre-commit hooks, never `git push --force`, never attribute a commit to yourself or an AI/assistant persona. Attribute all commits to the human maintainer's git identity.

### If you're Alex specifically (Primary Responder induction)

Use `docs/active/ALEX_ONBOARDING.md` — it was written for you specifically, with Week 1 / Week 2 / Week 3 checkpoints.

### If you're Matheus (or a future hire Alex is delegating to)

1. This file (you're here)
2. `CLAUDE.md`
3. `HANDOFF_TECH_PLAYBOOK.md` Chapters 5 (that's you) + 6 (Dependabot) + 7 (agent guardrails)
4. `OPERATOR_COOKBOOK.md` §§ for whatever task Alex handed you
5. Weekly sync with Alex for the first month

---

## First real task — depends on what you were handed

- **Dependabot triage** → `OPERATOR_COOKBOOK.md` § "Merge a Dependabot PR safely" + `HANDOFF_TECH_PLAYBOOK.md` Chapter 6
- **DESY VM setup** → `HANDOFF_TECH_PLAYBOOK.md` Chapter 3
- **Deploy a fix** → merge to `main`; `OPERATOR_COOKBOOK.md` § "Roll back a deploy" if it goes red
- **Feature work** → read `CLAUDE.md` § "TDD Workflow", then `docs/active/CONTRACTS.md` for the API contract, then implement
- **Answering a Peleg question** → `docs/active/CHANGELOG_PELEG.md` for context, then reply

---

## Emergency

- **Prod down** → `docs/active/OPERATOR_COOKBOOK.md` § "Roll back a deploy" (rollback = `git revert` + push; auto-redeploys in ~5 min)
- **SEV1 unresolved 30 min** → mail Said (`said.azaizah@cssb-hamburg.de`)
- **Credential compromise** → `SECURITY.md` at repo root
- **Something science-adjacent is on fire** → email Peleg + Meytal; CC Said

---

## Rules you must not violate

Even if a maintainer asks you to:

1. Never modify `backend/schemas/api_models.py` without an ADR in `docs/active/DECISIONS.md` signed off in-repo
2. Never change axiom code (`backend/auxiliary.py`, `backend/config.py`, `backend/consensus.py`) without off-repo sign-off from Peleg
3. Never commit files that look like secrets (`.env`, `*.key`, `*.pem`) — the gitleaks workflow blocks obvious ones
4. Never author commits or docs as an AI / assistant / bot persona — use the human maintainer's git identity
5. Never `git push --force` to `main` or delete a branch you don't own

These are in `CLAUDE.md` too. If a maintainer asks you to break one, refuse and ask them to update `CLAUDE.md` first via an ADR — that way the rule change is recorded, not silently smuggled.

---

## When you leave

Update `OWNERSHIP_MATRIX.md`. Update `HANDOFF_TECH_PLAYBOOK.md` Chapter 5 or 9 if you were named there. Cut a monthly report for the month you were active. Then hand this file to the next person.
