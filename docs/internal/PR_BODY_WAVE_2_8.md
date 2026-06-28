# PR: Wave 2.8/2.9 — Peleg PDF follow-ups + polish

Completes all Peleg feedback items from the 2026-06-18 PDF review and the 2026-06-23 follow-up meeting, plus performance work, deployment tooling, and the UniProt batch enrichment UI.

## Features & fixes

- **Q6** — 4-class KPI strip (Helix / FF-Helix / SSW / FF-SSW) on Quick Analyze
- **Q7** — Pipeline-derived 3-class residue coloring in SequenceTrack (Helix / SSW / Coiled-coil) replacing raw S4PRED H/E/C
- **Q8** — Hover tooltip shows TANGO row alongside S4PRED probabilities
- **Q9** — Per-tool result chips strip (S4PRED / TANGO / FF-Helix / SSW / FF-SSW)
- **Q11** — Clickable database comparison tabs on BiochemComparison (Fibril-forming vs UniProt short)
- **Q12** — TANGO card title + subtitle rewording per Peleg spec
- **Q15** — Self-contained per-peptide HTML report export (Report (.html) button on PeptideViewer + PeptideDetail)
- **OQ3** — Magenta aggregation bar coloring in TANGO panel
- **OQ6** — Per-plot toggle rows under each TANGO chart title
- **B3/B4** — Classification badge symmetry + back-arrow fix
- **B8** — X/N progress counter in batch analysis
- **B9** — Failed-vs-skipped peptide separation
- **B10** — Default sort PeptideTable by FF-Helix candidacy then µH
- **B11** — KPI abbreviation explanations
- **B12** — Inline "How to export from UniProt" guidance on Upload
- **B13** — Venn region click → table filter
- **B14** — Peleg-default preset label
- **B15/E4** — Provenance header on tabular exports
- **B16** — SSW residue overlay toggle on Mol3D viewer (Phase 1 stub + overpaint utility)
- **B17** — SSW band track on WindowProfileChart
- **B18** — Correlation matrix label clarity
- **B19** — Welch's t-test endpoint `POST /api/cohorts/compare`
- **B20** — One-click "Compare vs Peleg-118" chip on Compare page
- **D1-D6** — Section D wording polish
- **E1-E3** — CSV/TSV/XLSX export provenance prelude
- **F1** — cohort→database terminology scan
- **F2** — Cutoff suffix wording
- **F4** — Y-axis labels on Compare distribution charts
- **F9** — Scannable length-warning bullets on Upload
- **F11** — Percentile bar labels
- **M3** — UniProt accession-list upload mode (paste or .txt drop → preview → batch analysis)
- **SSW color audit** — consolidated SSW magenta to `ui/src/lib/sswColor.ts` (single source)
- **Perf** — OMP/MKL thread pinning, S4PRED batched forward, preload at import, per-stage timing, boot-time TANGO sanity check (Quick Analyze cold: 420ms, warm: 6ms)
- **Ops** — DESY VM bootstrap script, prod_redeploy.sh, pre-push hook, CI status helper

## Test counts

- **UI (vitest):** must be run locally — sandbox lacks rollup arm64 native binary. TypeScript compilation: 0 errors.
- **ESLint:** 0 errors, 36 warnings (all pre-existing: shadcn boilerplate `react-refresh/only-export-components`, conditional hooks in Results.tsx, empty catch blocks in datasetStore).
- **Backend (pytest):** must be run locally — sandbox lacks Python venv with fastapi.
- **New test files this branch:**
  - `ui/src/components/__tests__/UniProtBatchPreview.test.tsx` (T1 — 6 cases)
  - `ui/src/lib/__tests__/peptideHtmlReport.test.ts` (Q15 — 21 cases)
  - `ui/src/components/__tests__/PerToolResultChips.test.tsx` (Q9)
  - `ui/src/components/__tests__/SequenceTrack.test.tsx` (Q7 — updated for 3-class)

## Dead code removed (T5)

- `fetchExampleDataset` in `ui/src/lib/api.ts` — zero callers (example datasets use inline `fetch()` in Upload.tsx)

## Manual verification checklist

Quick Analyze:
- [ ] LKLLKLLLKLLLKLL → legend "Helix 100% · SSW 0% · Coiled-coil 0%", residues blue
- [ ] Hover any residue → tooltip shows S4PRED row + TANGO row
- [ ] Card title "Predicted Secondary Structure" (not "AlphaFold-predicted structure")
- [ ] Back arrow returns to /upload (not /results)
- [ ] Per-tool chip strip under the sequence
- [ ] TANGO panel titled "Tango Secondary Structure and Aggregation Probabilities"; toggles under title; agg bars magenta
- [ ] Biochem block has "Compare with database:" tabs; "Fibril-forming short peptides" tab loads percentile bars
- [ ] Mol3D card shows "Show SSW residues" Toggle with magenta dot
- [ ] Action row: Copy · FASTA · Report (.html); Report downloads a working HTML file

Upload:
- [ ] "Upload file" / "Paste accessions" tabs above the dropzone
- [ ] Paste mode: textarea + preview table + per-row X + "Run analysis (N accessions)" button
- [ ] Submit with 2-3 valid accessions → progress bar → /results table

Compare:
- [ ] "Compare current dataset vs Peleg-118 fibril-forming peptides →" chip above the upload zone; click → Database B loads
- [ ] Both distribution histograms have "Number of peptides" Y-axis title

Peptide Detail:
- [ ] "Report (.html)" button alongside the PDF Report button

Export:
- [ ] CSV/TSV/XLSX downloads have a 4-line `# Method = ... # PVL version = ... # Thresholds = ... # Exported at = ...` prelude

## Pre-existing issues (not introduced by this branch)

- **ESLint `react-hooks/rules-of-hooks` in Results.tsx / MetricDetail.tsx:** `useMemo` called conditionally after an early return. Fixing requires restructuring the component — out of scope for this sweep.
- **`Results 2.tsx` / `datasetStore 2.ts` duplicate files:** macOS Finder duplicates. Should be removed but are not on this branch's diff.
