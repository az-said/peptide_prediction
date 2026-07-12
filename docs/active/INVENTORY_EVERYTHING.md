# Inventory — Every Asset PePFibPred Owns / Uses

**Last updated**: 2026-07-12
**Purpose**: single canonical list of every account, server, package, doc, repository, integration, DNS record, and external service PePFibPred touches. If it's not in this file, it doesn't exist. If you find something that exists but isn't listed, add it.

**Audience**: Said (you already know most of this — file exists so you can quickly audit for gaps). Alex (needs this on Day 1). Any future maintainer.

**Ownership rules** (see `OWNERSHIP_MATRIX.md` for the durable version):
- **Owner** = Said (all admin access forever)
- **Primary Responder** = Alex (day-to-day operator)
- **Scientific Authority** = Peleg (off-repo, axiom-level decisions)

---

## 1. GitHub

| Asset | URL | Owner | Notes |
|---|---|---|---|
| Organisation | <https://github.com/az-said> | Said (Owner) | Renamed from `saidaz24-meet` → `az-said` on 2026-06-24 (commit `150e8ba`). Alex added as Owner (Action 5 in `SAID_MANUAL_ACTIONS.md`). |
| Repository | <https://github.com/az-said/peptide_prediction> | Said + Alex | Public, MIT-licensed. |
| Container Registry (GHCR) | `ghcr.io/az-said/peptide_prediction/backend` + `.../frontend` | Inherits GitHub org | `:latest` = latest tag; `:edge` = every main push; `:v1.0.0` etc. per tag |
| GitHub Pages | <https://az-said.github.io/peptide_prediction/> | Inherits GitHub org | mkdocs-material rendered docs site |
| Discussions | <https://github.com/az-said/peptide_prediction/discussions> | Inherits GitHub org | Categories: General, RFC, Q&A, Show and tell |
| Actions | <https://github.com/az-said/peptide_prediction/actions> | 7 workflows (see below) | |

### 7 GitHub Actions workflows

| File | Purpose | Trigger |
|---|---|---|
| `ci.yml` | Backend pytest + frontend vitest + Docker build | Every push + PR to main |
| `codeql.yml` | Python + TypeScript security static analysis | Every PR + weekly cron |
| `deploy.yml` | Deploy to reference host (Hetzner) | Push to main |
| `docker-publish.yml` | Publish container images to GHCR with SLSA-2 attestations | Push to main + tags |
| `docs.yml` | mkdocs-strict build + deploy GitHub Pages | Push to main touching docs |
| `publish-pypi.yml` | Publish `pvl-cli` + `pvl-mcp` via Trusted Publisher (OIDC) | Version tags |
| `release.yml` | Sentry release + source-map upload + GitHub release | Tags |

## 2. PyPI

| Package | URL | Owner | Notes |
|---|---|---|---|
| `pvl-cli` | <https://pypi.org/project/pvl-cli/> | Said (Alex once he sends username) | Trusted Publisher via OIDC — no long-lived credentials |
| `pvl-mcp` | <https://pypi.org/project/pvl-mcp/> | Said (Alex once he sends username) | MCP server package |

## 3. Zenodo

| Asset | URL | Owner | Notes |
|---|---|---|---|
| Concept DOI (rolls forward on every version) | `PENDING` until v1.0.0 | Auto (webhook) | See `SAID_MANUAL_ACTIONS.md` Action 15 |
| v1.0.0 versioned DOI | `PENDING` | Auto (webhook) | Minted on tag push |
| Peleg-118 dataset DOI (future) | `PENDING` | Manual | Deposit as independent record |
| Staphylococcus 2023 dataset DOI (future) | `PENDING` | Manual | Deposit as independent record |

## 4. Sentry

| Asset | Notes |
|---|---|
| Organisation | `desycssb` (from `release.yml:40-41`) |
| Backend project | `pvl-backend` |
| Frontend project | `pvl-frontend` |
| DSN | In `GitHub Secrets → SENTRY_DSN`. Also in `/opt/pvl/.env.deploy` on the Hetzner VPS. |
| Auth token | In `GitHub Secrets → SENTRY_AUTH_TOKEN` for CI |
| Owner | Said (Alex once Action 6 completes; Action 7 silences Said's notifications) |
| Weekly Report | Sent Mondays to both (low-noise founder-oversight signal) |
| Alert rules | Currently target Said; migration in Action 7 redirects to Alex |

## 5. Hetzner (VPS reference deployment)

| Asset | Value | Notes |
|---|---|---|
| Host | `94.130.178.182` | Cloud console: <https://console.hetzner.cloud> |
| Account owner | **Alex Golubev** | Billing + Cloud console admin. Confirmed 2026-07-12. |
| Instance type | CX33 | 4 vCPU, 8 GB RAM, Ubuntu 24.04 LTS |
| SSH user | `root` | Both Said and Alex have root SSH keys authorised |
| App dir | `/opt/pvl` | Full checkout of the repo |
| Data dir | `/data` | DuckDB cache + precompute artefacts + logs |
| Env file | `/opt/pvl/.env.deploy` | Contains DSN + secrets |
| Reverse proxy | Caddy 2 | Auto Let's Encrypt cert, HSTS preload, zstd + gzip |
| Backend port | 8000 | Behind Caddy |
| Frontend port | 3000 | Behind Caddy |
| Redis | Managed by Docker Compose | For Celery |
| Docker Compose | `docker/docker-compose.prod.yml` | 5-service stack: backend + redis + celery-batch + celery-quick + frontend-nginx |

## 6. DESY VM (in preparation)

| Asset | Value | Notes |
|---|---|---|
| Hostname | `landau-webapp-dev` | Reachable via 3-hop Kerberos chain |
| Jump host | `max-display.desy.de` | SSH `azaizahs@max-display.desy.de` |
| Auth | Kerberos (`kinit` on max-display) | See `memory/reference_ssh_access.md` |
| Owner | DESY-CSSB IT | You have transitional access; Alex becomes primary once unblocked |
| Bootstrap | `scripts/desy_vm_bootstrap.sh` | Idempotent Ubuntu 24.04 setup |
| Status | Blocked on DESY IT setup completion | Action 20 unblocks when they finish |

## 7. DNS + Cloudflare (potential future)

| Asset | Status | Notes |
|---|---|---|
| Production hostname | Not yet chosen | Currently direct-IP: `http://94.130.178.182:3000` |
| DNS registrar | TBD | Suggested: Cloudflare Registrar or Route53 |
| Cloudflare zone | Not created | Add when domain is chosen |
| SSL/TLS | Handled by Caddy Let's Encrypt | Once hostname is DNS'd, Caddy auto-provisions cert |

**Decision point**: pick a hostname. Options: `pepfibpred.desy.de` (needs DESY DNS approval), `pepfibpred.landau.technion.ac.il` (Technion DNS), or a lab-registered `.org` / `.io`. See `PUBLICATION_PATH.md` for the bio.tools discoverability implication.

## 8. External integrations

| Service | Purpose | Auth |
|---|---|---|
| UniProt REST API | Sequence discovery mode | Anonymous public API |
| PubMed API | Future RAG layer (ADR-020 proposed) | Anonymous public API |
| AlphaFold DB | 3D structure overlay | Anonymous public API |
| Zenodo | DOI minting for releases + datasets | GitHub OAuth |
| Paperpile | Peleg's citation manager (library `0zqjXo`) | Peleg's account |
| BioRender | Graphical abstract | Meytal's lab licence (probably) |
| CodeRabbit | AI PR review | Auto-integrated via GitHub app |

## 9. Documentation

### Public / rendered

| URL | Content |
|---|---|
| <https://az-said.github.io/peptide_prediction/> | mkdocs-material rendered handbook |
| GitHub repo README | Landing page |
| `docs/handbook/` | Source of the rendered handbook |

### Internal (in-repo)

| Path | Purpose | For whom |
|---|---|---|
| `docs/active/` | Canonical operational + design docs (73 markdown files) | Everyone |
| `docs/active/paper_drafts/` | NAR 2026 paper section drafts (14 files) | Us + Peleg + Meytal |
| `docs/active/RUNBOOKS/` | One file per failure class | Alex |
| `docs/active/postmortems/` | Blameless incident writeups | Alex writes, Said reads |
| `docs/active/reports/` | Alex's monthly digests | Alex writes, Said reads |
| `docs/internal/` | Process artefacts | Not for external readers |
| `docs/archive/` | Frozen historical (do not act on as current state) | Why-trail reading only |
| `docs/handbook/humans/` | For human readers (Diátaxis: tutorial + how-to) | Wet-lab researchers |
| `docs/handbook/agents/` | For AI coding agents | Cursor, Claude, Cowork |
| `docs/handbook/research/` | Research + paper writing | Peleg + Said |

## 10. Google Docs (paper writing)

| Doc | URL | Owner | Purpose |
|---|---|---|---|
| Working copy | <https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit> | `az.said2007@gmail.com` (Said's personal Drive) | Where we edit before pushing to original |
| Original (team) | <https://docs.google.com/document/d/1fDSC3k-9xrWiThHbnB8xMG0wS5yINZjRL-_oBg54ZFY/edit> | `landaulab1@gmail.com` (Landau lab shared) | The team's version — do not edit until approved |
| SI shell | <https://docs.google.com/document/d/13vbt7v-T1dI3zr1Olqp08yRIUU0scBSzjA9ejZF_q3g/edit> | `landaulab1@gmail.com` | Supporting Information stub |
| Paste-master index | <https://docs.google.com/document/d/1npwQzzTkPHCV5UDIqb9FhWeyf5D1_-4qOzMZJAQM4DA/edit> | Said (personal Drive) | 2026-07-12 created — Section index for the paste flow |

## 11. Local development identifiers

| What | Where | Notes |
|---|---|---|
| Working directory | `/Users/saidazaizah/Desktop/DESY/peptide_prediction` | Said's Mac |
| Git user (repo) | `Said Azaizah <said.azaizah@cssb-hamburg.de>` | DESY email; NEVER personal gmail (per `feedback_email_identity.md`) |
| SSH key (Said's Mac) | `~/.ssh/id_ed25519` | Public counterpart authorised on Hetzner |
| Kerberos principal | `azaizahs@DESY.DE` | For DESY 3-hop chain |
| Claude Code session dir | `~/.claude/projects/-Users-saidazaizah-Desktop-DESY-peptide-prediction/` | Memory + session state |

## 12. People + emails

| Person | Role | Email | GitHub | ORCID |
|---|---|---|---|---|
| Said Azaizah | Owner + veto + founder-oversight | `said.azaizah@cssb-hamburg.de` (primary) + Technion + MIT emails | `az-said` | `0009-0002-3596-5358` |
| Aleksandr Golubev | Primary Responder + operator | `aleksandr.golubev@cssb-hamburg.de` | `axelgolubev` | PENDING (Action 12) |
| Peleg Ragonis-Bachar | Scientific Authority (off-repo) | Technion email | (not a committer) | `0000-0002-0979-8165` |
| Meytal Landau | PI + corresponding author | `meytal.landau@desy.de` | (not a committer) | `0000-0002-1743-3430` |
| DESY-CSSB IT | External | `helpdesk@desy.de` (or CSSB-IT contact) | — | — |

**Email identity rule**: never use `az.said2007@gmail.com` in any team-facing or user-facing surface. Reserved for personal Google-account services (Drive, YouTube). Team-facing → DESY primary. See `memory/feedback_email_identity.md`.

## 13. Reference datasets

| Dataset | Location in repo | Size | Curator | Public? |
|---|---|---|---|---|
| Staphylococcus aureus 2023 | `backend/data/reference_datasets/staphylococcus_2023.xlsx` + `ui/public/Final_Staphylococcus_2023_new.xlsx` | 2 916 peptides × 36 columns | Peleg Ragonis-Bachar (Technion) | Yes, MIT-bundled (Peleg cleared 2026-05-08) |
| Peleg-118 fibril-validated | `backend/data/reference_datasets/peleg_118_fibril_validated.json` | 118 peptides | Peleg Ragonis-Bachar | Yes, MIT-bundled |
| Precomputed gold-standard artefact | `backend/data/precomputed/gold_standard.json` | ~18.7 MB (when built) | Auto (via `make precompute-datasets`) | Yes, on release |
| Precomputed Peleg-118 artefact | `backend/data/precomputed/peleg_118.json` | Small | Auto | Yes, on release |

## 14. External binary dependencies

| Binary | Location | Version | Notes |
|---|---|---|---|
| TANGO | `tools/tango/bin/tango_linux_x86_64` + darwin + win variants | 2.3 | Compiled binary; not open source but freely redistributable in academic contexts |
| S4PRED weights | `tools/s4pred/models/weights_1.pt` … `weights_5.pt` | v1.2.4 | 5 checkpoints, ~90 MB each, from PSIPRED group UCL |

## 15. Ownership matrix quick-scan

| Surface | Owner | Primary Responder | Peleg needed? |
|---|---|---|---|
| GitHub | Said | Alex | No |
| Sentry | Said (silent) | Alex | No |
| Zenodo | Auto | — | No |
| PyPI | Said | Alex | No |
| GHCR | Inherits | — | No |
| Hetzner | Said | Alex | No |
| DESY VM | Alex (once unblocked) | Alex | No |
| Cloudflare (if used) | Said | Alex | No |
| bio.tools | Said (submitter) | — | Endorses |
| Paper drafts | Both | Both | Reviews |
| Reference datasets | — | — | She curates |
| API contract (`api_models.py`) | Said (veto) | Alex (review) | Off-repo sign-off |
| Axiom logic (FF-Helix / FF-SSW / SSW) | Said (veto) | Alex (review) | **Off-repo sign-off REQUIRED** |
| Threshold defaults (`config.py DEFAULT_*`) | Said (veto) | Alex (review) | **Off-repo sign-off REQUIRED** |

## 16. What is NOT owned (external references only)

- **Landau lab shared Google account** (`landaulab1@gmail.com`) — owned by the lab
- **Ragonis-Bachar & Rayan paper DOI** — Peleg has this (see `SAID_MANUAL_ACTIONS.md` Action 9)
- **AlphaFold DB structures** — public EMBL-EBI
- **UniProt annotations** — public EMBL-EBI
- **Journal submission portal** (NAR proposal centre `https://nar.bihealth.de/`) — not our infrastructure

## 17. If everything fell over tomorrow — recovery order

Ordered by "what breaks first if this asset is lost":

1. **Hetzner VPS** → users see 5xx immediately. Rebuild from Docker Compose + repo + env file. `docker compose -f docker/docker-compose.prod.yml up -d --force-recreate`.
2. **GitHub repo** → source of truth. Everything else rebuilds from it. Zenodo has the DOI-linked archive; PyPI has the historical releases.
3. **Sentry** → observability gone but tool still works. Rebuild by re-enabling SDK + re-authenticating.
4. **PyPI packages** → users can't install fresh. Existing installs still work. Republish from GitHub Actions on tag.
5. **Zenodo** → citations broken but tool still works. Rebuild by re-tagging + Zenodo re-mints.
6. **Google Docs** → paper writing lost. `landaulab1@gmail.com` has restore-from-trash + version history.
7. **DESY VM** → not in production yet; loss is only a deployment delay.

## 18. Change log

- 2026-07-12 — File created. All entries verified against reality (Hetzner IP, GitHub URLs, PyPI package names, etc.).
