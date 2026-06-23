# Cowork follow-up prompt — paste this at top of next Cowork session

> 2026-06-23: this round's Q7/Q11/B16/B20/OQ6 files were merged from your scratch
> folder. Read this before starting the next batch so we stop accumulating dups.

---

```
WORKING DIRECTORY: /Users/saidazaizah/Desktop/DESY/peptide_prediction
(NOT /Users/saidazaizah/Documents/Claude/Projects/PVL — that's a scratch folder
that diverges from main. We pulled your Q7/Q11/B16/B20/OQ6 work out of it
on 2026-06-23, but you also built two files that already existed
(QuickKpiStrip.tsx and QuickPerToolStrip.tsx). Read the repo first next time.)

Before editing ANY file:
1. git fetch && git checkout wave-2.8/peleg-pdf-followups && git pull
2. git log --oneline -20 -- <file-you-plan-to-touch>     # what's been changed recently
3. Read THE WHOLE FILE you plan to edit + every helper it imports.
4. Search for existing components/utilities with similar names before creating new ones:
   - `grep -r "ComponentName" ui/src`
   - `ls ui/src/components/ | grep -i <keyword>`
5. Apply TARGETED EDITS, not full-file rewrites — and list every existing
   block you delete in your delivery summary, not just what you add.
6. Commit to a branch named `cowork/<task-tag>` (e.g. `cowork/q7-pipeline-colors`),
   push, open a PR. Do NOT hand back `cp PVL/foo.tsx ...` instructions.

────────────────────────────────────────────────────────────
SHARED MODULES — import these instead of re-implementing
────────────────────────────────────────────────────────────

UI helpers (already present, fully tested):
- ui/src/lib/molstarOverlays.ts        SSW overlay extraction + colour mapping
- ui/src/lib/molstarSswOverpaint.ts    Phase 1 stub for Mol* setStructureOverpaint
- ui/src/lib/fragmentClassification.ts isPositionInFragments, buildFragmentClassification
- ui/src/lib/referenceDistributions.ts CSV → DatasetStats + per-metric arrays
- ui/src/lib/profile.ts                helix range expansion
- ui/src/lib/peptideMapper.ts          API row → Peptide (the only mapper allowed)
- ui/src/components/QuickKpiStrip.tsx  4-class KPI strip (Q6) — DO NOT DUPLICATE
- ui/src/components/PerToolResultChips.tsx per-tool chip strip (Q9) — DO NOT DUPLICATE
- ui/src/components/SequenceTrack.tsx  pipeline 3-class residue colouring (Q7)
- ui/src/components/AggregationHeatmap.tsx per-plot toggles (OQ6) + magenta agg (OQ3)
- ui/src/components/BiochemComparison.tsx unified comparison + Q11 database tabs

Backend formula source-of-truth:
- backend/biochem_calculation.py — Fauchère-Pliska + Eisenberg µH formulas.
  If you need them client-side, IMPORT from referenceDistributions.ts (already
  ported) OR ask Said to expose an API endpoint. Do NOT re-implement.

Type contracts (NEVER mutate without explicit approval):
- backend/schemas/api_models.py        canonical API response shapes
- ui/src/types/peptide.ts              frontend Peptide / DatasetStats

────────────────────────────────────────────────────────────
WHAT WE MERGED FROM YOU THIS ROUND (2026-06-23)
────────────────────────────────────────────────────────────

✅ Applied (your code, lightly adjusted to preserve preceding commits):

- Q7  SequenceTrack.tsx — pipeline 3-class colouring (Helix / SSW / Coiled-coil).
                          Preserved hideTitle prop + Q8 hover TANGO row.
                          Test contract updated to match the new legend.
- OQ6 AggregationHeatmap.tsx — per-plot toggle rows under each title.
                              RESTORED the OQ3 magenta aggBarColor your version
                              had reverted to teal/amber/red.
- B16 Mol3DViewer.tsx + new lib/molstarSswOverpaint.ts — dedicated SSW Toggle
                       with Phase-1 stub overpaint hook. Wrapped the toggle
                       row in a hasData guard so the "no overlays" test passes.
- B20 Compare.tsx — Peleg-118 one-click chip + Quick Analyze hint in
                    dual-upload empty state. F4 Y-axis labels preserved.
- Q11 BiochemComparison.tsx + new lib/referenceDistributions.ts — clickable
                   database tabs in single-peptide mode. Loaded the
                   peleg_118 reference into QuickAnalyze via QUICK_ANALYZE_DATASETS.

⚠️ Surgical merge instead of full apply:

- Q11 PeptideViewer.tsx — your version imported QuickKpiStrip + QuickPerToolStrip
                          from PVL/, but the page (QuickAnalyze.tsx) already
                          mounts QuickKpiStrip and the in-repo equivalent of
                          QuickPerToolStrip is `PerToolResultChips`. We kept
                          the existing PerToolResultChips mount and only added
                          your comparisonDatasets / defaultDatasetId props.

❌ Did NOT apply (duplicates of work already shipped):

- PVL/QuickKpiStrip.tsx     — shipped in commit e5157b5 as
                              ui/src/components/QuickKpiStrip.tsx
- PVL/QuickPerToolStrip.tsx — shipped in commit e5157b5 as
                              ui/src/components/PerToolResultChips.tsx
                              (different name, same job)

Next time, please grep for the component name and read the existing file
before building a new one.

────────────────────────────────────────────────────────────
WHAT'S NEXT — Wave 3 candidates
────────────────────────────────────────────────────────────

(Said will pick from these; await assignment before starting.)

- Q15  Per-peptide HTML report export
- B19  Welch's t-test endpoint UI surface (backend exists at /api/cohorts/compare)
- M3   UniProt batch enrichment UI (use ui/src/lib/uniprot.ts, not raw fetch)
- A more careful SSW colour audit — the magenta token is used in 3 places now
       (SequenceTrack residues, AggregationHeatmap bars, Mol3D overpaint).
       If we ever change it, change all three from a shared constant.
```

---

## Quick Said reference (do not paste into Cowork)

- **Cowork scratch folder**: `/Users/saidazaizah/Documents/Claude/Projects/PVL` — 62 files, most are March/April snapshots. The June 23 deliveries have been pulled. Safe to leave alone; can be wiped any time.
- **Branch**: `wave-2.8/peleg-pdf-followups` — Cowork-merged commits land here.
- **Merge order followed**: Q7 → OQ6 → B16 → B20 → Q11 (chosen so the most at-risk recent work — Q12, OQ3, hideTitle, F4 — gets re-applied first).
