# Email — Peleg, Wave 2.8 close-out

To: peleg.ragonis-bachar@... (Technion)
Cc: alex.golubev@cssb-hamburg.de
Subject: PVL Wave 2.8 + 2.9 close-out + paper methods ready

Hi Peleg,

Wave 2.8 + 2.9 — every actionable item from your two PDF reviews and the Drive comments — is shipped, tested, and merged to main. Some highlights:

- **All 672 frontend tests + 646 backend tests passing locally.** CI green, CodeRabbit clean.
- **Threshold preset chip renamed** "Peleg default" → "Default" everywhere user-facing (your name stays in the About page + footer credits, nowhere else).
- **Per-peptide HTML report** download — Quick Analyze + Peptide Detail. Self-contained file, opens cold in any browser.
- **Mol\* SSW residue overlay** — Phase 1 (stub + dispatcher) shipped, Phase 2 (programmatic plugin) on the backlog.
- **F-series terminology pass**: "cohort" → "database", "Cutoff" suffix on the µH / hydrophobicity threshold inputs, the magenta vs amber color collision fix, all of OQ3 + OQ6.
- **One-click "Compare current dataset vs fibril-forming peptides (118)" chip** on `/compare`.
- **Backend precompute pipeline** + new `/api/precomputed/{dataset_id}` endpoint so example clicks become instant after deploy.
- **Q12**: TANGO panel reordered, secondary structure shown first, aggregation second.
- **Q6**: 4-class KPI strip on Quick Analyze with reason text per class.
- **Section D wording polish** (D1–D6).
- **B-series**: KPI hover-help, Venn region counts + click-to-filter, threshold tuner preset chips, batch progress bar + ETA, failed-row separation, SSW band in the sliding-window peptide profile.

**For the paper**: `docs/active/PAPER_METHODS_REFERENCE.md` is the canonical Methods source. Every algorithm, every dataset, every threshold is in there with the primary literature citation. When you start drafting Methods, open that file — it's structured the same way a JOSS paper expects.

**Open scientific items I still need from you** before we cut the v1.0 tag:
1. **OQ1–OQ4** from your Drive comments — still pending.
2. **F10** — the β% calculation may be too aggressive on the Staphylococcus 2023 set. Wanted your call before adjusting the threshold.
3. **Q-FIX-022** — |charge| loses sign. OK to ship as-is, or revisit?

**Live demo**: http://94.130.178.182:3000 (Hetzner VPS; DESY VM in progress with Alex). Let me know what you want to walk through.

Said


---

## Notes (not part of email)

Reference docs Peleg may want:
- `docs/active/PAPER_METHODS_REFERENCE.md` — the Methods section source
- `docs/active/PELEG_NOTES_2026_06_18.md` — triaged feedback (what shipped, what skipped, why)
- `docs/active/PELEG_FOLLOWUP_DOC_V2.md` — current draft

Verification I'd want from her before tagging v1.0:
- Run a representative dataset through both Quick Analyze and Compare
- Confirm the FF-Helix / FF-SSW classification matches her expectations on Peleg-118
- Sign off on the paper Methods section
