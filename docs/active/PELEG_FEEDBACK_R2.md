# Peleg Feedback — Round 2

**Source**: Verbal/written feedback from Peleg, conveyed by Said on 2026-04-26.
**Status**: All items OPEN. Dedicated terminal **T-PEL** owns this stream.
**Rule**: T-PEL works ONLY from this file. Never mix with other waves. Items are coherent (terminology + threshold semantics + parallel SSW/Helix structure) and must be done as one batch by one mind.
**A second batch (PDF document with screenshots) is coming from Said.** Reserve space below.

---

## PEL-I: Praise (positive, keep doing)

> "The AlphaFold part is amazing!"
> "I love that there is an option to open things and that not everything is exposed from the beginning."

**Action**: keep AlphaFold integration as-is. Keep progressive-disclosure pattern. Don't regress.

---

## PEL-A: Terminology — "Cohort" → "Database"

Rename "cohort" everywhere in user-facing UI to "database".

**How to apply**:
1. Run `/terminology-scan` skill to surface all "cohort" occurrences in UI strings
2. Replace in user-facing labels, headings, tooltips, button text — NOT in code identifiers (variable names like `cohortA` stay; rename only requires careful refactor with tests)
3. Files likely affected: `ui/src/pages/Compare.tsx`, `ui/src/components/CohortDelta.tsx`, peptide detail "cohort position" sections, README/landing copy
4. Watch for compound terms: "Cohort A" → "Database A", "cohort comparison" → "database comparison"

**Caution**: Code identifiers (`cohortA`, `cohortB` variables, `useCohort` hooks) are internal — DON'T rename in this pass to avoid massive churn. Only user-facing strings.

**Test**: visual sweep + search for residual "Cohort" / "cohort" in `ui/src/pages/` and `ui/src/components/`.

---

## PEL-B: FF-Helix % needs better explanation

> "Needs better understanding of the meaning of the ff-helix %."

**How to apply**:
1. Find every place FF-Helix % is shown: `grep -rn "ff[-_]?helix\|ffHelix\|FF-Helix" ui/src` (case-insensitive)
2. Add an info tooltip (`<HoverCard>` or `<Tooltip>`) explaining:
   - What FF-Helix is (Fibril-Forming Helix detection)
   - How it's calculated (consecutive helical residues passing biochem thresholds: μH, hydrophobicity, helix score)
   - Why it matters (predicts which helical regions can seed amyloid fibrils)
   - The numeric meaning (% = fraction of sequence flagged as FF-Helix-eligible)
3. Add a "Learn more" link to a docs section if the tooltip gets too long
4. Confirm wording with Peleg before shipping

**File locations**: KPI tiles, table column header, PeptideDetail "Classification" pills, threshold control descriptions.

---

## PEL-C: "Everything that is of SSW needs to be also of Helix"

Parallel structure. Wherever SSW has a feature/chart/threshold/badge, Helix should have an equivalent.

**Audit checklist** (T-PEL fills in):
- [ ] SSW has track on PeptideDetail → does Helix have one? (P1 done)
- [ ] SSW has aggregation graph → does Helix? (P4 — verify done)
- [ ] SSW has up/down diagram → does Helix? (P8 — TODO)
- [ ] SSW has threshold section → does Helix?
- [ ] SSW has classification pill → does Helix? (verify present)
- [ ] SSW has KPI tile → does Helix?
- [ ] SSW has table column → does Helix? (C1 done — verify column name parity)
- [ ] SSW has cohort/database comparison metric → does Helix?
- [ ] SSW has CSV export column → does Helix?
- [ ] SSW has filter chip → does Helix?

Use `/audit-ff` skill (existing) as starting point — extend its checks for Helix parity.

**Output**: a parity report listing every SSW feature and the Helix equivalent (or gap).

---

## PEL-D: Different partition of titles & thresholds

Threshold UI needs reorganization. New grouping (from Peleg's verbatim text):

### General Secondary Structure thresholds (applies to both SSW + Helix)
- **Minimal continuous residues** (default = 5)
- **Maximum gap** (default = 3)

### Secondary Structure Switch thresholds (SSW-only)
- **S4pred maximum helix and beta difference** (default = 0.03 — needs testing)
- **Tango maximum helix and beta difference** (default = 3 — needs testing)
- **Minimal % secondary structure content** (default = 0)

### Helical thresholds (Helix-only — NEW per PEL-C parallel)
- **Minimal s4pred helix score** (default = 0.5)
- **Minimal % helix content** (default = 0)

### Fibril-formation thresholds
- **uH (Hydrophobic moment)** (default = 0.5; range 0 to 3.26)
- **Hydrophobicity** (default = 0.5; range -1.01 to 2.25)

**How to apply**:
1. Audit current threshold panel (`ui/src/components/ThresholdControls.tsx` or similar)
2. Compare current grouping vs Peleg's
3. Reorganize sections to match
4. Keep store keys stable (don't rename `muHCutoff` to `uHCutoff`) — only rename the user-facing labels
5. Section order: General → SSW → Helix (NEW) → FF

**Note**: PEL-G ("% of length cutoff" unclear) — that threshold is currently in the panel; it may need removal or a much better explanation. Confirm with Peleg before deleting.

---

## PEL-E: No acronyms in titles, no abbreviations

> "no acronyms in titles, or short wordings like min instead of minimum\al"
> "maybe make some explain on hover functionality"

**Rule**:
- "Min" → "Minimal" or "Minimum"
- "Max" → "Maximum"
- "AA" → "Amino acid" (in titles; OK in compact charts/tables with hover)
- "SSW" → "Secondary Structure Switch" (in titles; SSW OK as a chip/badge label)
- "FF" → "Fibril-Forming" (in titles; FF OK as chip/badge)
- "μH" → "Hydrophobic moment" in titles (μH OK in axis labels with hover)
- Hover tooltips can use the abbreviation safely

**How to apply**:
1. Run `/terminology-scan` to surface all titles/labels
2. For each: rewrite as full word in the title/heading, keep short form in dense charts with `<Tooltip>` explanations
3. Don't change CSV column headers (those are scientific shorthand and researchers expect them)

---

## PEL-F: Threshold tooltip text (verbatim, ship as-is)

Peleg provided exact tooltip text. Use these strings character-for-character.

### Minimal continuous residues
> the minimal length of consecutive residues predicted to have the same secondary structure. To make secondary structure prediction longer, this value should be increased. Only integer numbers allowed.

### Maximum gap
> Maximum number of residues with mismatched secondary-structure prediction score allowed within a predicted segment stretch. To make secondary structure prediction more strict, this number should be closer to 0. only integer numbers allowed.

### S4pred maximum helix and beta difference
> The maximal difference between α-helix and β prediction scores by s4pred. To increase the potential for secondary structure, this value should be lower.

### Tango maximum helix and beta difference
> The maximal difference between α-helix and β prediction scores by tango. To increase the potential for secondary structure, this value should be lower.

### Minimal % secondary structure content
> Minimum percentage of residues predicted to be secondary structure switch so that the sequence will be defined as such. To make secondary structure prediction more strict, this number should be closer to 100. Value range 0-100.

### Minimal s4pred helix score
> The minimal average reliability score of α-helical prediction by s4pred.

### Minimal % helix content
> Minimum percentage of residues predicted to be helical so that the sequence will be defined as helical.

### uH (Hydrophobic moment)
> Minimum hydrophobic moment to predict fibril formation potential of α-helical fibrils. To perform a more strict prediction, this value should be higher. Value range 0 to 3.26

### Hydrophobicity
> Minimum hydrophobicity to predict fibril formation potential of secondary structure switch fibrils. To perform a more strict prediction, this value should be higher. Value range -1.01 to 2.25

**How to apply**: store these strings in `ui/src/lib/thresholdDescriptions.ts` (or extend existing) and reference from threshold info icons.

---

## PEL-G: "% of length cutoff" unclear

> "I don't understand where this threshold comes from or what it means."

**Action**:
1. Find the "% of length cutoff" control in current UI (`grep -rn "length.*cutoff\|cutoff.*length\|% of length" ui/src`)
2. Read the code to understand what it actually does
3. Two options:
   - **Remove it** if the function is redundant or wasn't requested
   - **Document it** with clear wording matching Peleg's tooltip style
4. Confirm with Peleg before final decision (DON'T silently delete a threshold the algorithm depends on)

---

## PEL-H: Terminology — "Aggregation" → "Fibril Formation" only

> "We are not talking in aggregation terms. Only Fibril-formation."

**Rule**: in user-facing language, replace "aggregation" with "fibril formation" (or "fibril-forming" as adjective).

**Caution**:
- TANGO is literally an "aggregation propensity" predictor — that's the algorithm's name. Don't rewrite "TANGO aggregation propensity" because that's the academic name.
- But headline cards, tooltips, classifications, dashboards — use "fibril formation" as the framing.
- "Aggregation %" KPI → "Fibril formation %" or "Fibril-formation propensity"
- Internal column names: keep `aggPercent` as-is; only labels change.

**How to apply**: similar pass to PEL-A — surface all "aggregation" mentions, decide per-instance whether it's algorithm name (keep) or framing (replace).

---

## (RESERVED) Peleg PDF — to be pasted by Said

When Said provides her PDF document with screenshots and detailed comments, T1 (CEO) will:
1. Extract every item from the PDF
2. Add as PEL-J, PEL-K, PEL-L... below
3. T-PEL processes them in the same dedicated stream

```
[Placeholder — Said will paste content here]
```

---

## Definition of Done (T-PEL stream)

- [ ] PEL-A through PEL-H closed (PEL-I is praise, no action)
- [ ] All threshold tooltip strings are PEL-F verbatim
- [ ] No "cohort" or "Cohort" in user-facing UI text (code identifiers untouched)
- [ ] No bare acronyms in section titles (chips/badges OK)
- [ ] SSW/Helix parity audit passes (PEL-C checklist filled)
- [ ] Peleg PDF items processed (after Said pastes)
- [ ] Manual test by Said
- [ ] No regression in existing tests (`make test` green, `tsc` clean)
