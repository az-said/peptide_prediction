# Tool Name + Graphical Abstract — Peleg-comment format (draft v2, 2026-07-12)

> **Instruction from Said 2026-07-12**: Peleg's default title `PePFibPred` **stays in the manuscript body**. Do not overwrite it in the H1. Instead, paste the block below as a **comment** on Peleg's "Find a name" thread so Peleg + Meytal can pick.
> Peleg's own naming criterion (Drive C25, 2026-05-22): *"I would like that anyone who will clic amyloid or fibril and peptides will get this web as a first result. We need the young scientists to be able to easly find this."* — discoverability / MSc-student findability is the primary criterion.

---

## COMMENT to paste on the "Find a name" thread

Adding candidate names + one-line rationale for each. Criterion (from Peleg Drive C25): discoverability for an MSc student searching for `amyloid + fibril + peptides`. Recommendation weight = discoverability × distinctiveness × pronounceability × domain-signal.

| # | Name | Rationale | Trade-off |
|---|---|---|---|
| 1 | **PePFibPred** *(current default — keep unless Peleg + Meytal pick otherwise)* | Self-describing peptide-fibril-predictor; short; owns the naming space Peleg + Meytal chose | Reads generic; hides the α/β chameleon novelty |
| 2 | **ChameLeoPred** | Directly evokes the α/β chameleon amyloid class Peleg introduced in Biomacromolecules 2022; distinctive; pronounceable | Slightly playful for a NAR title |
| 3 | **α/β-FibrilPred** | Explicit Greek signal for the α + β dual detection; carries scientific gravitas | Greek titles get mangled by some indexing pipelines |
| 4 | **AmylSwitch** | Foregrounds the SSW axiom (the scientific centrepiece); short; pronounceable; strong discoverability | Loses the α-helical-fibril lens |
| 5 | **FibrilPredictor** *(Peleg's second placeholder in the doc)* | Broadest discoverability on "fibril + predictor" search; most likely to hit the young MSc student | Least distinctive — some overlap risk with existing tools |
| 6 | **FibrilForecast** | Signals *prediction* nature; memorable weather-forecast metaphor | Weaker link to the α/β novelty |
| 7 | **AmylSwitchPep** | Combines amyloid + switch + peptide keywords for max search recall | Longer; harder to pronounce |
| 8 | **PepFibril** | Cleanest Peleg-style peptide-focus + fibril | Reads too generic |
| 9 | **PepMorph** | Suggests structural morph / polymorphism | Loses fibril specificity |
| 10 | **AmyFib** | Ultra-short compound; unique | Too cute for a NAR title |

**Recommendation, weighted for discoverability**: **FibrilPredictor** (#5) or **PePFibPred** (#1) — both hit the "amyloid + fibril + peptide" search axis directly. If discoverability weight = 0.5 and distinctiveness weight = 0.5, **AmylSwitch** (#4) becomes competitive.

*Open questions for Peleg + Meytal:* (a) Does the Landau group have an internal naming convention for its computational tools? (b) Is the α/β-chameleon language reserved for the wet-lab framework, or is it usable in the tool name?

---

## Graphical Abstract — three concepts to paste on Peleg's "Ideas for graphical abstract?" thread

**Concept A — "The switch"** *(recommended)*
Left panel: peptide sequence rendered as its α-helical cartoon (blue). Right panel: same sequence rendered as its β-sheet cross-fibril cartoon (orange). Between them, a bidirectional arrow labelled *"structural switch"* with the tool's logo. Below: a compact PePFibPred results row highlighting the three columns (`TANGO`, `S4PRED helix`, `SSW`) flagged positive. Reads left-to-right; satisfies NAR's landscape 5:2 aspect ratio; conveys the scientific centrepiece (Method F) in a single glance.

**Concept B — "The dashboard"**
Top strip: amyloid-fibril illustration (α-helical and β-sheet forms sharing the same fibril axis — echoes Peleg's α/β chameleon framing). Bottom strip: stylised PePFibPred dashboard showing (i) the batch density plot for μH, (ii) the peptide ranking sidebar, (iii) the per-residue colour tracks (blue = helix, orange = β-strand, purple = SSW overlap). Frames the tool as a research-grade dashboard, not a black-box classifier.

**Concept C — "The funnel"**
Left: UniProt icon feeding into the pipeline. Middle: three parallel streams (TANGO, S4PRED, FF-Helix) that converge on the unified SSW verdict. Right: a ranked candidate list. Conveys the pipeline nature of the tool + the multi-signal ranking, which differentiates PePFibPred from single-algorithm servers. Emphasises the "start from a hypothesis, not a peptide list" workflow (Method J).

**Note**: If BioRender is used for any element, NAR requires an article-specific licence + explicit acknowledgment in the caption or under Acknowledgements. Meytal probably has a lab BioRender licence.

---

## Notes for Said before pasting

- Post the block above as a **single comment** on Peleg's "Find a name" thread. Do not overwrite the manuscript title.
- Post the graphical-abstract block as a **single comment** on Peleg's "Ideas for graphical abstract?" thread.
- Final title decision belongs to Peleg + Meytal.
- If Peleg picks a new name, we do a batch rename across the M&M draft (`01_materials_and_methods.md`), server-usage draft (`02_server_usage.md`), data-availability (`04_data_availability.md`), and — critically — the CITATION.cff `title` field, the mkdocs `site_name`, the pvl-cli PyPI name, and the pvl-mcp PyPI name. That's a follow-up PR, keyed by the name decision.
