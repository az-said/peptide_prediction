# Terminology + Style Guide — Landau Lab (Peleg's writing) for PePFibPred (NAR Web Server 2026)

> The paper's tone, section structure, and terminology must match Peleg's writing. This file consolidates every rule extracted from her Biomacromolecules 2022 flagship paper + the 8 Peleg follow-up packets in the repo + Landau lab publication conventions + the doc-embedded template Peleg saved for us. Every paragraph you paste in the Google Doc should be re-checked against the two tables below.

---

## Section 1 — TERMINOLOGY: endorsed / rejected / flagged

### A. ENDORSED — use these exact terms verbatim

| Term | Where | Notes |
|---|---|---|
| **Fibril formation** / **fibril-forming potential** | Everywhere as the tool's purpose | *Never* "aggregation prediction". TANGO is an input signal we re-interpret through a fibril-formation lens. |
| **Helix**, **FF-Helix**, **SSW**, **FF-SSW** | Class labels, 4 canonical | The "%" is a *feature*, never a class. |
| **Structural switch** / **secondary-structure switch** | Long form of SSW | Peleg's preferred verbose form. |
| **α/β chameleon** / **chameleon peptides** | Introduction only | Peleg's own coinage from Biomacromolecules 2022. Load-bearing metaphor in Intro; not a pipeline-output label. |
| **Fibril-forming α-helix** or **Amphipathic α-helix** | Verbose helix class name | Peleg's Help-page canonical labels. |
| **Amyloid formation** | Distinguished carefully from "aggregation" | *"There is a difference between aggregation and fibrillation."* (Peleg 2026-05-18) |
| **Membrane-active overlap class with shared fibril-forming features** | Replacement for "false-positive class" | *"the features that drive amyloid or fibril formation are the same features that allow membrane interactions."* (Peleg Drive C2). |
| **Did not form fibrils in the tested conditions** | Any non-finding | *"the fact that a specific sequence didnt formed fibril in a specific contion doesnt mean that it wont do it in slightly different conditions."* (Peleg Drive C7). Fibril formation is environmentally conditional. |
| **Database** (not "cohort") | Comparison text + Ranking + everywhere | Peleg PPT slide 15. Applies to prose and UI. FF flag names unchanged. |
| **Aggregation-secondary structure overlay** | The stacked-track panel | Not just "structure overlay". |
| **AlphaFold3 predicted 3D structure** | 3D-viewer title | Drive C17. But per 2026-06-18 in-person meeting: delete this title entirely (ADR-021 OQ8). |
| **S4PRED** (no suffix) | Predictor name | No "neural network", no "5-BiLSTM" in prose. Just S4PRED. |
| **Regression canaries** | The pinned test peptides | Replaces "negative controls" (Peleg Drive C7 rejected the latter). |
| **Coiled-coil motif** | Class label for the pipeline | Not "coil". S4PRED's per-residue `P(coil)` chart curve stays as-is (that's a 3-state secondary-structure track, a different quantity). |
| **Ragonis-Bachar and Rayan** | Threshold-values citation | *"We should just use the basic predetermined thresholds, not from Eisenberg, but from Ragonis-Bachar and Rayan."* (Peleg Drive C27). DOI still pending. |
| **Eisenberg 1982** | μH *formula* citation only | Not the threshold values. |
| **Fauchère, J., and Pliska, V. 1983** | Hydrophobicity scale citation | Peleg tooltip verbatim. |
| **Hamodrakas 2007** (or 2011) | FF-Helix lineage | Fibril-forming heuristic. |
| **Reproducibility permalink** | Our differentiator | *"This is SUPER COOL and indeed no other tool I know have this and we will emphasize this in the paper."* (Peleg Drive C18). Gets a dedicated paragraph in Method L. |

### B. REJECTED — never use, replace on sight

| Rejected term | Replacement | Reason |
|---|---|---|
| **"False positive"** (for AMPs) | "membrane-active overlap" / "shared fibril-forming features" | Peleg Drive C2 — *"This is incorrect!"* |
| **"Cross-α amyloid-like fibril"** | Use Peleg's published *α/β chameleon amyloid* framing | Her lineage. Cross-α is 3rd-party language only (Tayeb-Fligelman 2017 for PSM-α3). |
| **"CD spectroscopy"** | (delete) | Wave 0 direction — no CD wording anywhere. |
| **"Chou-Fasman propensity"** as a citation | *S4PRED + Ragonis-Bachar & Rayan* | *"There much more updated ways to determine this."* (Peleg 2026-05-18 Q4). Chou-Fasman remains the **implementation** underlying the FF-Helix `_HELIX_PROP` table in `backend/auxiliary.py:21–42` but is not cited as authority. |
| **"Eisenberg 1984"** as threshold citation | Ragonis-Bachar & Rayan | Only the μH *formula* is Eisenberg. |
| **"Cohort mean"** | "Database mean" | Slide 15. |
| **"Neural network"** modifier on S4PRED | plain "S4PRED" | L5 shipped. |
| **"Tier 1 / Tier 2 (80% certainty)"** | (delete) | No defensible derivation. D3 co-design. |
| **"Aggregation prediction"** as PVL's headline | "Fibril-formation prediction" | Peleg 2026-06-07 R1. |
| **"Beta %"** subcards | (delete) | Wave 2.5 F10. |
| **"Raw input only"** on paste-or-upload step | *(delete)* | H3, Peleg 2026-06-18: "Not clear. Maybe just delete." |
| **"Aggregation propensity"** framing on SSW-adjacent thresholds | "% of Length Cutoff" / "Min SSW Residues" as FF-classification cutoffs | Packet 3 A2, L2. |
| **PVL** as a public-facing name | *PePFibPred* (or whichever final name Peleg + Meytal pick) | The paper does not brand as PVL. |

### C. FLAGGED (still-open naming questions)

| Term | Status |
|---|---|
| **"Rank & Merge"** | OQ2 deferred — what does *Merge* mean to a user? |
| **"Coiled-coil"** vs Peleg's typo *"Colid-coil"* | Resolved 2026-06-29 to *coiled-coil motif* (ADR-021 OQ1). |
| **"AMP"** as annotation vs discriminator | Annotate on the row (Drive C8). Never auto-down-weight in the ranker. |
| **"Aggregation Per-Residue %"** slider row | Remove from user-facing threshold panel (Packet 3 A1). Not a user knob. |

---

## Section 2 — WRITING STYLE (Peleg / Landau lab house style)

### A. Structure of the paper

- **Introduction: 4 paragraphs.** Para 1 = broad problem statement (no citation in sentence 1). Para 2 = bridge concept (AMPs → amyloid biology). Para 3 = anchor case (uperin 3.5, PSMα3). Para 4 = hypothesis + "*To this end, this work developed…*" pivot + one-line preview of the finding.
- **Pivot phrase**: *"To this end, this work developed…"* — never *"In this study, we…"* or *"Here, we present…"*.
- **Result/Discussion subsection titles**: full descriptive phrases that state a claim, not "3.1 Structure-Activity Relationship". Example: *"α-helical fibril structure correlates with cytotoxicity"*.
- **Methods subsection titles**: technique-first noun phrases with abbreviation in parens on first use. Example: *"Thioflavin T fluorescence fibrillation kinetics assay"*.
- **For THIS paper (Peleg's saved doc template)**: Methods sub-heads use `Method A`, `Method B`, `Method C`… as Heading 2 (bold non-italic), with any Heading 3 sub-heads in *italic non-bold*. Peleg embedded this convention as saved styles in the doc — honour it even though her Biomacromolecules 2022 paper used descriptive-phrase headings.
- **Methods order**: computational method first, then wet-lab in experimental sequence (sample prep → bulk assay → biophysical → structural). For PePFibPred the whole methodology *is* computational, so the ordering rule maps to: pipeline architecture → pre-processing → per-predictor methods → classification axioms → surfaces → CI → datasets.
- **Conclusions section**: short (4-6 sentences), restates method → key finding → broader implication, ends on a forward-looking hypothesis (not a hedge).
- **Figure captions**: long, self-contained, argument-carrying (60-100+ words). Spell out full lipid/reagent/dependency names; state conditions and colour-coding so the caption stands alone.
- **Supporting Information**: referenced by name in the main text but its structure is not spelled out inline.
- **No numbered subsection headings** (no "3.1", "3.2") in her ACS-style writing. MDPI numbering (seen in her *J. Fungi* paper) is publisher-imposed, not preference.

### B. Voice / Tense

- **"We"** — reserved for interpretive / hypothesis moves ("we hypothesised", "we conjecture", "we propose"). Passive voice dominates procedural Methods sentences.
- **Past tense** for specific findings; **present tense** for general / interpretive claims. Do not force one tense throughout.
- **Abstracts** open impersonal / passive, then pivot to first-person mid-abstract when describing "we" did something.
- **Hedge mechanism, not observation**: *"may explain"*, *"putatively via"*, *"we conjecture"* for causal claims; declarative for measured data.

### C. Sentence structure & transitions

- **Default sentence length runs long** (30-45 words), built as subordinate-clause-then-main-clause: state established context, then pivot to interpretation.
- **Small transition vocabulary**, reused: **Notably, Interestingly, Of note, Overall, Taken together, Correspondingly, Furthermore, In contrast, For instance**. Always used to reinterpret a preceding data point, not as pure filler.
- **"Taken together, [interpretive claim]"** is the stock closing move for a subsection.
- **Avoid "Firstly / Secondly / Thirdly"** enumerations — prefer narrative flow with the transition vocabulary above.
- **Do not overuse "significant"** in the statistical sense — Landau lab reports replicate counts, not p-values, in wet-lab-heavy papers. For our computational paper, use "significant" only for tested statistical claims.
- **Coined metaphors are load-bearing** — *"chameleon"* is used consistently, not as one-off flourish. If PePFibPred introduces a similarly memorable term, use it consistently.

### D. Notation

- **Greek letters typed directly inline**: α-helical, β-sheet, μH, δ — never *"alpha-helical"*, *"μ_H"*, *"mu-H"*.
- **Gloss Greek/abbreviated terms at first use only**: *"a large hydrophobic moment (μH)"* → then bare "μH" thereafter.
- **Ranges use unspaced en-dash**: *"4.6-4.8 Å"*, not *"4.6 to 4.8 Å"* or *"4.6 – 4.8 Å"* with spaces.
- **Units**: space before unit for concentration/volume/time (*"10 mM"*, *"2 h"*), but temperature has no space (*"37°C"*). Follow this split exactly.
- **Equations**: for ACS-style papers she gives formulas inline as prose with variables defined in the same sentence. For THIS paper, the doc's saved template accepts numbered display equations *(1)*, *(2)*… — use them, but keep them plain-text (Word Insert Equation, never images).
- **p-values essentially absent** from her wet-lab papers; rigor is *"in triplicate"*, *"repeated N times on different days"*. Don't manufacture p-values for computational text unless doing real stats.
- **Amino-acid symbols**: single-letter code in tables and equations; three-letter code (with parenthesised single-letter on first use) in prose when discussing a specific residue.
- **Sequence in monospace** when quoted inline (e.g., `MGIIAGIIKFIKGLIEKFTGK`).

### E. Citation density

- **Introduction**: dense, front-loaded — multiple citations per sentence to establish prior art before the hypothesis paragraph.
- **Methods**: essentially uncited except for named prior protocols/instruments and the algorithmic ancestors (Fauchère-Pliska, Eisenberg, Hamodrakas, Fernandez-Escamilla, Moffat & Jones, Ragonis-Bachar).
- **Discussion**: return to citations at lower density than Intro — our Results are interpreted first, literature cited to frame novelty / implications.

### F. Author / affiliation / funding conventions

- **Co-first authors**: mark both names with an asterisk `*` and add explicit footnote *"* Authors contributed equally"*. Not superscript letters; not spelled out in the byline.
- **Corresponding / PI author (Landau)** placed last in the byline.
- **Funding**: grantor name(s) with grant number in parentheses, semicolon-separated, single sentence. Standard *"the authors declare no competing financial interest"* disclaimer follows.
- **Author Contributions statement**: initials-based, one clause per author, ends with boilerplate *"All authors have read and agreed to the published version of the manuscript"* (MDPI convention; adopt if NAR requires similar CRediT statement).
- **Acknowledgments**: credit graphics tools (e.g., BioRender) explicitly by name when used. For PePFibPred, credit Sentry, PyPI, GitHub Container Registry only if their branding is used in the paper's figures/screenshots. AI assistance disclosure follows NAR's 2024 policy — a dedicated statement in the Acknowledgments.

### G. Preserving Peleg's non-native syntax

Peleg's writing carries a light non-native-English register. **Do not sanitise it out** in her sections. Constructions to preserve when the paragraph is her voice:

- *"AND with that being said…"* (mid-paragraph pivot)
- *"the whole reason and motivation for this project begins with…"*
- *"we should just use…"*
- *"is fine if other biological functionalities might also happen"*

These read as *authentic Peleg-checked prose*. Reviewers see the paper in her voice; do not over-sanitise.

---

## Section 3 — SIGNATURE PARAGRAPHS Peleg has already written (usable verbatim)

These are direct quotes from Drive comments / follow-up packets that read as paper prose. Do not put words in her mouth — paste her actual voice.

**On the AMP / amyloid shared biophysics (Drive C2-4) — Introduction framing**
> *"This is incorrect! The reason is because the features that drive amyloid or fibril formation are the same features that allow membrane interactions. […] it is perfectly fine that we report or call name for fibril dormation potential only, it is fine if other biological functionalities might also happen. […] initially when we were looking for new fibril-forming sequences we were testing AMPs and toxic peptides, that because of their membran-active function will have greater potential to fibril formation."*

**On the competing-tools omission (Drive C14) — Introduction thesis**
> *"totally fine. And I am almost sure they will miss these sequences since they are basing their prediction on the propensity to form b-sheets, which is the opposite of what we are doing. And basically, the whole reason and motivation for this project begins with."*

**On the 40-aa cap rationale (2026-06-03) — Methods B justification**
> *"It should definitely be a hard cutoff (NOT only a warning), and the cutoff should be 40. In my code there was supposed to be a length cutoff at the first stages. The reason lies in the calculation itself. More than this, the secondary structure prediction becomes more complicated; we then need to look for surface and not only secondary structure, and it just misses the point."*

**On dataset-derived thresholds (Drive C5) — Methods A principle**
> *"In addition, to try and be more flexible and allow the prediction for other functional groups of proteins, the thresholds are set automatically in relation to the specific database that is being sent as input."*

**On negative controls (Drive C7) — Limitations paragraph**
> *"which negative controls? In the field of fibril or amyloid formation it is very hard to define a negative control, since fibril or amyloid formation is very depended on environmental conditions. […] This is why when we wrote the papers describing the methods we said that the peptides did not form fibrils in the tested conditions."*

**On no second validation dataset (Drive C11) — Limitations paragraph**
> *"validation of this tool is not super trivial. (1) Most research doesn't try to see multiple secondary structure switch behaviour. (2) Fibril formation can happen in different conditions. So — there is no other dataset."*

**On the reproducibility permalink (Drive C18) — Method L endorsement**
> *"This is SUPER COOL and indeed no other tool I know have this and we will emphasize this in the paper."*

**On symmetry of treatment (Drive C15) — Method F axiom**
> *"any analysis made, or the way you address SSW and FF-SSW, should also apply to Helix and FF-Helix. because in some cases, you are only related to the FF-Helix and not the Helix or vice versa."*

**On residue colouring (2026-06-03) — Method D colouring rule**
> *"It should be derived from the calculations. Otherwise, we are not showing the results of the pipeline. It should be taken from the column named: Helix fragments (S4PRED) / SSW fragments (Tango) / SSW fragments (S4PRED). My algorithm takes into account and smooths these small gaps (under 3, hence this threshold)."*

**On tool discoverability — Naming criterion (Drive C25)**
> *"I think we need to think on a better name, that is less generic and will represent the tool more accurately. I am thinking on the young student, that starts his Msc for example and looking for tools to use in his research I would like that anyone who will clic amyloid or fibril and peptides will get this web as a first result. We need the young scientists to be able to easly find this."*
