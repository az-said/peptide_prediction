# Wave 2.8/2.9 — Live verification checklist

Everything shipped this session, organized so you can walk page by page
in a browser and tick boxes. No shell commands required.

Run the dev server:
```bash
cd ui && npm run dev          # http://localhost:5173
# In another tab: uvicorn backend.api.main:app --reload --port 8000
```

Or just hit prod once the PR is merged + deployed.

Status legend: ☑ = matches Peleg / meeting note · ☒ = wrong, ping me.

---

## Homepage `/`

1. ☐ **Hero tagline** reads:
   *"Multi-algorithm prediction and visualization for peptide secondary structure switching and fibril formation. One paste, full profile."*
   No "aggregation" between "peptide" and "secondary".

2. ☐ **Hero sequence input** types out `GVGDLIRKAVSVIKNIV` (17 letters, Uperin 3.5).
   No 42-letter `DAEFRHDSG...` Amyloid-β.

3. ☐ **First feature card** title "Secondary Structure Prediction"; description reads:
   *"Utilizing S4PRED, TANGO and internal threshold to determine secondary structure."*

4. ☐ **"Analyze Peptide Datasets at Scale"** subtitle reads:
   *"Upload hundreds of peptides via CSV. Every sequence receives the full workflow: secondary structure prediction, biochemical calculations, and fibril formation potential, with thresholds determined according to the given database."*

5. ☐ **"How It Works"** section shows **5** cards: 1, 2, 3, 4, 5 — no 2a/2b.
   - Card 1: "Paste or Upload"
   - Card 2: "Run Predictors"
   - Card 3: "Classify Fibril-formation candidates" (no "FF" shortcut)
   - Card 4: "Interactive Dashboard" — description includes the phrase "Classification analysis"
   - Card 5: "Export & Cite"

6. ☐ **Pipeline diagram** (under "How It Works"):
   - Top: Sequence Input → Validation → branch into S4PRED + TANGO (only 2 nodes parallel)
   - Below them: **single "Fibril-formation" node** (depending on both)
   - Then: **"Rank"** (no "& Merge")
   - Then: Export

7. ☐ **"The Prediction Workflow" tabs** → click S4PRED tab. Body describes S4PRED + TANGO + fibril-formation potential. Bullet list shows exactly:
   - Helix
   - Secondary structure switch (SSW)
   - Fibril-forming helix (FF-Helix)
   - Fibril-forming secondary structure switch (FF-SSW)
   No "Three-state prediction: helix (H), sheet (E), coil (C)".

8. ☐ **"Built for Researchers" testimonial** quote starts:
   *"PVL is the first tool to predict secondary structure switching, the first to flag fibril-formation potential for non-beta structures..."*
   No "PVL replaced three separate tools" wording.

---

## Quick Analyze `/quick`

9. ☐ **Name placeholder** in the Name (optional) field reads `e.g. Uperin 3.5`, not `e.g. Amyloid-beta`.

10. ☐ **Example chips** at the bottom of the input panel: **Uperin 3.5** · LL-37 · KLVFF. The Amyloid-β(25-35) chip is gone.

11. ☐ Click **Advanced: Threshold Configuration** to expand.
    - ☐ **"TANGO aggregation threshold" row is gone** entirely from the "Fibril-formation thresholds" section.
    - ☐ Label reads **"Hydrophobic moment (µH)"** (parens around µH), not "uH (Hydrophobic moment)".
    - ☐ Hover the (i) info icon next to "Hydrophobic moment (µH)" — tooltip mentions "Fauchère, J. and Pliska, V. 1983."
    - ☐ Same Fauchère-Pliska citation appears on the Hydrophobicity tooltip.
    - ☐ Hover (i) on "Minimal S4PRED helix score" — tooltip ends with "To make secondary structure prediction more strict, this number should be closer to 1. Value range 0-1."
    - ☐ Hover (i) on "Minimal % helix content" — ends with "closer to 100. Value range 0-100."
    - ☐ Hover (i) on "S4PRED maximum helix and beta difference" — mentions "In batch mode, this value is determined automatically according to the input database."
    - ☐ Same batch-auto-tune line on "TANGO maximum helix and beta difference".

12. ☐ **Threshold input typing**: click into any numeric threshold field. Try typing `0.85`. The digits land cleanly — no character-eating, no arrow-only behavior.

13. ☐ **Analyze Uperin 3.5** (pick the chip → click Analyze).
    - ☐ After results show, click the **PVL logo** in the top-left to navigate away.
    - ☐ Dialog appears: *"Your prediction results will be lost. Are you sure?"* — no "hasn't been saved to a dataset" line.
    - ☐ Press **Leave anyway** → lands on `/` (homepage). NOT `/results` (no stale Phylloseptin-O2 trap).

14. ☐ Run Analyze on Uperin 3.5 again, then in the results view:
    - ☐ Scroll to **Biochemical feature comparison**. It shows 3 metrics: Hydrophobicity, Hydrophobic moment, Charge. **No "S4PRED helix %" row.**
    - ☐ Scroll to the TANGO panel — title reads **"Tango Secondary Structure and Aggregation Probabilities"** (not "TANGO Aggregation Profile").
    - ☐ Subtitle mentions "Per-residue helix (H), beta (E), coil (C), and aggregation probabilities".
    - ☐ Inside the panel: **secondary structure plot is on TOP** (Helix + Beta bars), aggregation plot below it.
    - ☐ Both plots have y-axis from **0 to 100** (not 0-1).

15. ☐ **Back-link** at the very top of `/quick`, when batch peptides exist in the store, reads **"Back to batch results"** (lowercase b).

---

## Upload `/upload`

16. ☐ Dropzone hint reads **"CSV · TSV · XLSX · FASTA"** with dot separators.

17. ☐ Below the dropzone, **"Or try an example dataset:"** chips. First chip: **"Fibril-forming peptides (118)"**. Click it → preview table shows 118 rows from Peleg-118.

18. ☐ Make a tiny test CSV with mixed lengths and drop it on the zone. For example, paste this into a file `mix.csv`:
    ```
    Entry,Sequence
    short,GG
    normal,GVGDLIRKAVSVIKNIV
    medium,LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTESLLGDFFRKSKEKIG
    huge,LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTESLLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTESLLGDFFRKSKEKIG
    ```
    After upload preview, three warning lines should appear:
    - ☐ "1/4 sequences too short (<4 aa) — outside the pipeline's default range of 4-40 aa."
    - ☐ "1/4 sequences exceed the 40-aa default range — results may be less reliable but the pipeline will still run."
    - ☐ "1/4 sequences exceed 80 aa — TANGO accuracy degrades and S4PRED was trained for full proteins. Those rows will be skipped."

19. ☐ Make another CSV with **lowercase** column name `peptide` instead of `Sequence` (B3 test):
    ```
    Entry,peptide
    u35,GVGDLIRKAVSVIKNIV
    ```
    Upload → preview shows the peptide column auto-recognized as the sequence column (no "which column is Sequence?" prompt).

20. ☐ Make a CSV with the header repeated as data (B4 test):
    ```
    Sequence,Length
    Sequence,0
    GVGDLIRKAVSVIKNIV,17
    ```
    Upload → preview shows ONE row (`GVGDLIRKAVSVIKNIV`), not two — the header repeat is silently dropped.

---

## Help `/help`

21. ☐ Scroll to **References & thresholds** at the bottom. The 6-item bullet list shows:
    - Fauchère & Pliska 1983 (hydrophobicity)
    - Eisenberg, Weiss & Terwilliger 1982 (µH)
    - Hamodrakas 2007 (FF-Helix framing)
    - Moffat & Jones 2021 (S4PRED)
    - Fernandez-Escamilla et al. 2004 (TANGO)
    - Ragonis-Bachar et al., in preparation 2026 (PVL defaults)

---

## PeptideDetail `/peptides/:id` (browse from results)

22. ☐ When backend ships the SSW residue mask + Mol* SSW overlay UI lands, the **SSW residue overlay color in the 3D viewer is vivid magenta** (`#E040FB`), NOT the previous amber/orange that clashed with beta. (This is plumbing-only this session — visual change once Cowork 5.1 ships the toggle.)

---

## Perf (after VM deploy)

23. ☐ Open prod URL, upload a 100-peptide batch (use the Peleg-118 example chip from step 17). End-to-end wall-clock should feel noticeably faster than the pre-deploy baseline — target 3–8× speedup.

24. ☐ Don't run shell commands to validate this; just feel it. If the timer feels like the old 22-min slog, ping me and we'll dig in (perf research has 5 more fixes lined up: uvicorn worker count, TANGO poll loop, orjson, gzip middleware, nginx tuning).

---

## Anything red?

Tell me which checkbox failed. I'll dig in.
