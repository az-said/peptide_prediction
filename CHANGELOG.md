# Changelog

All notable changes to Peptide Visual Lab (PVL) are documented here.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The "Unreleased" section captures work merged to `main` but not yet shipped under a tag; on each `v*.*.*` tag, those entries become the new version block.

## [Unreleased]

### Added
- `pvl-cli` v0.1.0 first publishable version: 9 PyPI classifiers, 9 search keywords, full PyPI URL set, pytest-mock dev dep, 14 smoke tests (12 mocked + 2 live integration against the live Hetzner endpoint).
- `.github/workflows/publish-pypi.yml` — Trusted Publishing on every `v*.*.*` tag for both `pvl-cli` and `pvl-mcp`; `workflow_dispatch` lets you publish one without the other.
- `.github/workflows/docker-publish.yml` — multi-arch QEMU + Buildx GHCR publish on `main` and `v*.*.*`. Versioned + `latest` tags on releases, `edge` + `main-<sha>` tags on every main push. OCI labels with documentation URL + license + vendor.
- `mkdocs.yml` + `.github/workflows/docs.yml` — documentation site at <https://az-said.github.io/peptide_prediction/> using mkdocs-material with auto/light/dark palette, full-text search, code-copy buttons, persona-aware nav.
- `backend/scripts/precompute_dataset.py` learned `force_recompute=True` + `bypass_tango_budget=True` flags so the precompute can write authoritative artifacts even when the provider cache or 500-peptide budget gate would otherwise drop TANGO rows. Fixed ISSUE-034 [#112].
- `backend/scripts/diagnose_tango.py` — pinpoints which gate (binary resolve / budget / cache split / build_records / run_tango_simple) drops rows. Used to root-cause ISSUE-034.
- `backend/scripts/rerun_validation_2026_06_07.py` learned the `peleg-118` cohort. Run `python scripts/rerun_validation_2026_06_07.py --cohort peleg-118` to produce the recall number for `research/02_validation_evidence.md`.
- Six new ADRs in `docs/active/DECISIONS.md`: ADR-022 (40-aa length cap), ADR-023 (threshold strategy), ADR-024 (precompute-JSON artifact), ADR-025 (4-thread cap + thread pinning), ADR-026 (TANGO 5% hotspot default), ADR-027 (Celery wired but sync in prod).
- ADR-021 in `docs/active/DECISIONS.md` — Peleg's 2026-06-29 verbatim guidance on the six open scientific questions filed as GitHub Issues #106–#111.
- Documentation handbook v1: 21 content pages across `docs/handbook/{humans,agents,research}/` totalling ~41,700 words, 30+ DOI-verified primary citations.
- `docs/active/BACKLOG.md` — single canonical Tier 0 → Tier 4 backlog consolidating 8 prior backlog systems.
- `docs/active/HANDOVER_CHECKLIST.md` — Said's tick-list to project hand-off.
- `docs/active/FINAL_REPORT_2026_06_29.md`, `docs/active/EXPORT_REDESIGN_BRIEF.md`, `docs/active/GITLAB_MIRROR.md`, `docs/active/PUBLICATION_PATH.md`, `docs/active/PRODUCTION_LOCKDOWN.md` — operational documentation.
- `.github/ISSUE_TEMPLATE/{bug_report,feature_request,scientific_question}.md` + `config.yml` + `.github/pull_request_template.md` with the invariants checklist.
- `.github/workflows/codeql.yml` — Python + TypeScript static analysis with `security-extended` query pack on every PR + weekly cron.
- slowapi rate limiter (`30 req/min/IP`) on `/api/predict/batch` and `/api/uniprot/execute`.
- Precompute-serve endpoint `GET /api/precomputed/{dataset_id}` + bundled `gold_standard` (Staphylococcus 2023, 2,916 peptides) and `peleg_118` (118 peptides) datasets. Frontend tries precomputed first, falls back to live pipeline on 404.
- Compare page split-button: "vs Fibril-forming peptides (118)" / "vs Gold standard — Staphylococcus 2023 (2,916)".
- M3 UniProt accession-list upload mode in `Upload.tsx`.
- Per-peptide HTML report download (Q15) — self-contained, opens cold in any browser.
- 4-class KPI strip (Q6), per-tool result chips (Q9), pipeline-aware residue coloring (Q7), hover tooltip (Q8), TANGO panel reorder (Q12).
- Mol* SSW residue overpaint Phase-1 stub (B16) with magenta `#E040FB` token consolidated in `ui/src/lib/sswColor.ts`.
- Provenance header on every CSV / TSV / XLSX export (B15 + E4).

### Changed
- License normalized to MIT (`LICENSE-DESY-RESEARCH.md` archived; single-line copyright header for GitHub's SPDX detector → repo now shows as MIT in the badge row).
- README citations corrected: S4PRED → Moffat & Jones 2021 *Bioinformatics* 37:3744–3751 (`btab491`); Ragonis-Bachar 2022 → "α/β Chameleon Amyloids" *Biomacromolecules* 23(9):3713–3727 (Crossref-verified, June 2026).
- README top-nav now points at <https://az-said.github.io/peptide_prediction/> as the canonical documentation surface.
- `docs/active/DEPLOYMENT.md` refreshed with the verified DESY VM Kerberos access path + hosts-at-a-glance + daily ops snippets + Caddy DNS handover.
- `docs/active/HANDOFF.md` §10 rewritten to reflect Wave 2.8/2.9 close-out state + improvement backlog with four tiers.
- `docs/active/` cleanup: 11 dated artifacts archived to `docs/archive/2026-06-29/`; `A4_BIO_TOOLS_SUBMISSION.md` + `A5_ZENODO_RELEASE.md` merged → `PUBLICATION_PATH.md`; `DEVELOPER_REFERENCE.md` renamed → `ARCHITECTURE.md`; `MASTER_DEV_DOC.md` + `ACTIVE_CONTEXT.md` + `SENTRY_OBSERVABILITY_STRATEGY.md` archived as superseded.
- Stripped user-facing "Peleg" references — credits-only on About page + footer (`docs/handbook/humans/10_credits_and_license.md` carries the authoritative author list).
- Bundled `gold_standard` dataset XLSX moved to `backend/data/reference_datasets/staphylococcus_2023.xlsx` so the precompute script is self-contained inside the backend container.
- Repo GitHub face polished: description + homepage URL + 15 topics (`peptide`, `bioinformatics`, `aggregation`, `secondary-structure-prediction`, `tango`, `s4pred`, `amyloid`, `fastapi`, `react`, `typescript`, `fibril-formation`, `alphafold`, `molstar`, `open-science`, `desy`).
- GitHub branch protection on `main`: 1 review required, 4 CI checks required (Backend Tests, Frontend Build, Docker Build, Detect Changes), no force pushes, no deletions, conversation resolution required, stale reviews dismissed.
- GitHub repo: secret scanning + push protection + Dependabot vulnerability alerts + Dependabot automated security fixes all enabled.

### Fixed
- React minified error #310 ("Rendered more hooks than during the previous render") on `/results` and `/metrics/:id` — `useMemo` calls hoisted above empty-data early returns in `ui/src/pages/Results.tsx` and `ui/src/pages/MetricDetail.tsx`. Two CodeRabbit warnings that had been pre-existing for weeks finally triggered when the demo auto-load became the default first-visit flow.
- ISSUE-034 (precompute path silently skipped TANGO subprocess) — diagnosis pointed at the provider cache split + the TANGO budget gate; fix routes the precompute pipeline around both. Both bundled artifacts now ship with real per-residue `tangoAggCurve`, `tangoBetaCurve`, `tangoHelixCurve` arrays; aggregation heatmap renders for every row.
- DESY VM bootstrap script branch default: `wave-2.8/peleg-pdf-followups` (deleted post-merge) → `main`.
- Compare page wrong "Peleg-118" labels in user-visible strings (credits-only convention restored). CSV renamed `fibril_forming_peptides_118.csv`.

### Removed
- `LICENSE-DESY-RESEARCH.md` archived to `docs/archive/2026-06-29/`. MIT is the canonical license; dual-license confused both bio.tools and GitHub's SPDX detector.

## [0.3.0] — earlier 2026 (pre-handbook)

PVL features prior to the 2026-06-29 handbook + lockdown sprint. See `git log v0.3.0` for the granular history. Notable highlights:

- All Wave 2.8 + Wave 2.9 Peleg-PDF follow-ups (47 items)
- S4PRED batched forward (#117), TANGO restored on prod image (#118), gunicorn `--preload` lifespan (#119), OMP/MKL thread pin (#105), stage timer instrumentation (#115)
- B-CONTRACT Pydantic `extra="forbid"` on every request schema
- B17 SSW band in sliding-window peptide profile, B18 correlation matrix scope, B19 Welch's t-test backend, B20 reference-cohort chip
- Q11 BiochemComparison database tabs, F-series UI terminology pass (F1–F11)
- Vector store (LanceDB + ESM-2 8M) ADR-016 + ADR-017

## [0.1.0] — earliest tag (pre-paper baseline)

First public release. See [docs/archive/2026-06-29/RELEASE_NOTES_v0.3.0.md](docs/archive/2026-06-29/RELEASE_NOTES_v0.3.0.md) for the historical v0.1.0 → v0.3.0 narrative.

---

[Unreleased]: https://github.com/az-said/peptide_prediction/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/az-said/peptide_prediction/releases/tag/v0.3.0
[0.1.0]: https://github.com/az-said/peptide_prediction/releases/tag/v0.1.0
