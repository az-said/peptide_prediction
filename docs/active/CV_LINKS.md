# PePFibPred -- CV / LinkedIn / Portfolio Link Registry

**Purpose**: every public URL worth linking on a CV, LinkedIn profile, or portfolio for the PePFibPred project. Copy-paste ready.

**Last updated**: 2026-08-04

---

## 1. PROJECT LINKS

| Label | URL | Why it matters |
|---|---|---|
| GitHub repository | https://github.com/az-said/peptide_prediction | Primary source of truth; MIT-licensed, public, 455+ commits, 85k+ LOC |
| Live demo (Hetzner) | http://94.130.178.182:3000 | Current paper-citable production URL; the app running end-to-end |
| Documentation site (GitHub Pages) | https://az-said.github.io/peptide_prediction/ | MkDocs Material handbook; auto-deployed from `docs.yml` workflow on every push to main |
| Zenodo archive | TODO -- mints automatically on first GitHub release tag (v0.3.0+); see `A5_ZENODO_RELEASE.md` | Permanent DOI; indexed by Google Scholar; makes PePFibPred citable in papers |
| bio.tools registration | TODO -- submit at https://bio.tools/register once live URL is stable; packet ready at `A4_BIO_TOOLS_SUBMISSION.md` | ELIXIR registry listing; discoverable by bioinformaticians searching for peptide tools |
| PyPI -- `pvl-cli` | https://pypi.org/project/pvl-cli/ | Command-line interface; `pip install pvl-cli && pvl analyze peptides.csv` |
| PyPI -- `pvl-mcp` | https://pypi.org/project/pvl-mcp/ | MCP server for Claude Desktop / Cursor / Continue; `pip install pvl-mcp` |
| Container images (GHCR) | https://github.com/az-said/peptide_prediction/pkgs/container/pvl-backend | OCI images with SLSA Build Level 2 provenance attestations |
| Status page (Upptime) | TODO -- publishes to GitHub Pages `status` branch once uptime workflow runs; `.upptimerc.yml` is configured | Public availability monitor; shows uptime history for backend health + frontend |
| CI badge | https://github.com/az-said/peptide_prediction/actions/workflows/ci.yml | Green badge = all ~1,220 tests pass (≈608 backend pytest across 44 files + ≈613 frontend vitest across 55 files, per `docs/active/paper_drafts/09_correctness_deltas.md`), lint clean, types clean |
| CodeQL badge | https://github.com/az-said/peptide_prediction/actions/workflows/codeql.yml | Security-extended static analysis on every PR + weekly cron |
| OpenAPI docs (live) | http://94.130.178.182:8000/api/docs | FastAPI auto-generated interactive API documentation |
| GitHub Security Advisories | https://github.com/az-said/peptide_prediction/security/advisories | Responsible disclosure channel; SECURITY.md references this |

---

## 2. DOCUMENT LINKS

All documents live in the public repo and are linkable via GitHub blob URLs.

| Label | URL | Why it matters |
|---|---|---|
| README | https://github.com/az-said/peptide_prediction/blob/main/README.md | Project overview, architecture diagram, screenshots, citation info, full author table |
| HANDOFF (developer on-ramp) | https://github.com/az-said/peptide_prediction/blob/main/docs/active/HANDOFF.md | Single-page new-developer guide; demonstrates handoff-first engineering culture |
| HANDOFF_TECH_PLAYBOOK | https://github.com/az-said/peptide_prediction/blob/main/docs/active/HANDOFF_TECH_PLAYBOOK.md | 20-min deep tech reference for human maintainers and coding agents |
| FOR_NEXT_BUILDER | https://github.com/az-said/peptide_prediction/blob/main/docs/active/FOR_NEXT_BUILDER.md | Cold-landing 5-min page for any future builder inheriting the project |
| OPERATOR_COOKBOOK | https://github.com/az-said/peptide_prediction/blob/main/docs/active/OPERATOR_COOKBOOK.md | 21 task-indexed recipes (Sentry, deploy, rollback, release, Zenodo verify) |
| DEPLOYMENT | https://github.com/az-said/peptide_prediction/blob/main/docs/active/DEPLOYMENT.md | VM specs, step-by-step Docker + Caddy deploy, K8s plan, troubleshooting |
| OWNERSHIP_MATRIX | https://github.com/az-said/peptide_prediction/blob/main/docs/active/OWNERSHIP_MATRIX.md | Platform-by-platform ownership table (GitHub, Sentry, PyPI, Hetzner, DESY VM, bio.tools) |
| PAPER_METHODS_REFERENCE | https://github.com/az-said/peptide_prediction/blob/main/docs/active/PAPER_METHODS_REFERENCE.md | Citation-ready methods reference for the NAR paper; every algorithm, dataset, version |
| pvl_milestones | https://github.com/az-said/peptide_prediction/blob/main/pvl_milestones.md | Factual dev history: 455 commits, month-by-month activity, tool lineage, scale metrics |
| SECURITY.md | https://github.com/az-said/peptide_prediction/blob/main/SECURITY.md | Security policy, disclosure process, SLA commitments, supply-chain posture |
| CITATION.cff | https://github.com/az-said/peptide_prediction/blob/main/CITATION.cff | Machine-readable citation metadata; auto-parsed by GitHub "Cite this repository" button |
| CONTRIBUTING.md | https://github.com/az-said/peptide_prediction/blob/main/CONTRIBUTING.md | Contribution guide; sets expectations for a part-time-maintained research tool |
| DECISIONS.md (ADR log) | https://github.com/az-said/peptide_prediction/blob/main/docs/active/DECISIONS.md | 27 architectural decision records; shows engineering rigour |

---

## 3. PEOPLE LINKS

| Label | URL | Why it matters |
|---|---|---|
| Peleg Ragonis-Bachar -- ORCID | https://orcid.org/0000-0002-0979-8165 | Scientific lead; 4-category classification algorithm author |
| Peleg Ragonis-Bachar -- Google Scholar | TODO -- search https://scholar.google.com/citations?user= for Peleg Ragonis-Bachar | Links to the Biomacromolecules 2022 paper and other publications |
| Peleg Ragonis-Bachar -- Technion profile | TODO -- check Technion Department of Biology faculty/researcher pages | Institutional affiliation verification |
| Meytal Landau -- ORCID | https://orcid.org/0000-0002-1743-3430 | Corresponding author / PI; Technion + EMBL Hamburg + CSSB |
| Meytal Landau -- Landau Lab page | TODO -- check https://landaulab.net.technion.ac.il/ or equivalent Technion faculty page | Lab homepage; institutional context for PePFibPred |
| Alex Golubev -- DESY profile | TODO -- check DESY CSSB staff pages (https://www.cssb-hamburg.de/about_cssb/people) | Primary Responder; scientific advisor; DESY-CSSB affiliation |
| Said Azaizah -- ORCID | https://orcid.org/0009-0002-3596-5358 | Lead developer; MIT + DESY affiliation |
| Ragonis-Bachar et al. 2022 (Biomacromolecules) | https://doi.org/10.1021/acs.biomac.2c00582 | The foundational paper; 4-category classification (Helix / FF-Helix / SSW / FF-SSW) |

---

## 4. ORGANISATION LINKS

| Label | URL | Why it matters |
|---|---|---|
| Landau Lab (Technion) | TODO -- https://landaulab.net.technion.ac.il/ or Technion faculty page | PI lab; structural biology of amyloids; institutional home of the algorithm |
| DESY -- Centre for Structural Systems Biology (CSSB) | https://www.cssb-hamburg.de/ | Hamburg research centre; hosts the DESY VM and Alex Golubev |
| Technion -- Israel Institute of Technology | https://www.technion.ac.il/ | Academic home of Peleg Ragonis-Bachar and Meytal Landau |
| NAR Web Server Issue (Oxford Academic) | https://academic.oup.com/nar/pages/web_server_issue | Target publication venue; submission window 2026-11-10 to 2026-12-10 |
| ELIXIR bio.tools registry | https://bio.tools/ | European life-science infrastructure registry; PePFibPred submission planned |
| S4PRED (PSIPRED group, UCL) | https://github.com/psipred/s4pred | Secondary structure predictor used in PePFibPred; Moffat & Jones 2021 |
| TANGO (SwitchLab) | https://tango.switchlab.org/ | Aggregation propensity predictor; Fernandez-Escamilla et al. 2004 |
| Mol* (RCSB + EBI + ETH consortium) | https://molstar.org/ | 3D structure viewer used for AlphaFold overlay in PePFibPred |
| AlphaFold Protein Structure Database (EBI) | https://alphafold.ebi.ac.uk/ | Source of predicted 3D structures displayed in PePFibPred |

---

## 5. FUTURE-ANCHORS

Rows to fill once the corresponding milestone ships. Replace TODO with the actual URL/DOI.

| Label | URL | Why it matters |
|---|---|---|
| Zenodo DOI (concept -- always-latest) | TODO -- mints on first GitHub release; update from `10.5281/zenodo.PENDING` | Permanent software citability; Google Scholar indexed |
| Zenodo DOI (v0.3.0 versioned) | TODO -- mints alongside concept DOI on the same release | Version-pinned citation for reproducibility |
| NAR paper DOI | TODO -- assigned on acceptance; submission window 2026-11-10 to 2026-12-10 | Peer-reviewed publication; strongest CV signal |
| JOSS paper DOI | TODO -- submit after NAR; JOSS-format draft exists at `paper/paper.md` | Software-focused journal; complements the NAR methods paper |
| bioRxiv preprint DOI | TODO -- optional; post if desired before NAR submission | Early visibility; establishes priority |
| Production hostname (DESY DNS) | TODO -- pending DESY IT; target `pvl.desy.de` or `pepfibpred.cssb-hamburg.de` | Stable institutional URL to replace the Hetzner IP |
| bio.tools listing (live) | TODO -- submit at https://bio.tools/register; EDAM topic_0121 + operation_2479 | ELIXIR discoverability; packet ready at `A4_BIO_TOOLS_SUBMISSION.md` |
| DESY GitLab mirror | TODO -- `gitlab.desy.de/azaizahs/peptide_prediction`; see `GITLAB_MIRROR.md` | Institutional mirror for DESY compliance |

---

*Generated from repo search on 2026-08-04. Verify all TODO URLs before publishing to CV/LinkedIn.*
