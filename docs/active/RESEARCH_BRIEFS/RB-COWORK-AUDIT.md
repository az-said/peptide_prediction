---
name: Cowork PRE-FLIGHT compliance audit
description: Audit of every Cowork-delivered file in V5-V9 rounds for duplication-vs-refactor discipline. Validates whether the PRE-FLIGHT checklist baked into PROMPT 0 worked.
type: audit
---

# Cowork V5-V9 — PRE-FLIGHT Compliance Audit

**Date**: 2026-05-08
**Author**: T1
**Trigger**: Said flagged 2026-05-08 — *"I tend to not trust Cowork because he proactively creates new files without checking if a simpler version already exists."* PRE-FLIGHT checklist was baked into `COWORK_PROMPTS_PELEG.md` PROMPT 0 the same day. This brief audits whether the discipline held across V5→V9.

---

## TL;DR

- **5 of 6 Cowork rounds clean.** PRE-FLIGHT discipline held in V5-1, V6-1, V7-1, V8-1, V9-1.
- **V5-2 was the canonical failure mode** (pre-PRE-FLIGHT bake-in): created `Footer.tsx` from scratch despite an existing `Footer.tsx`. Estimated ~30% wasted tokens.
- **V8-1 is the canonical success mode**: explicitly read existing `FirstVisitModal`, `DemoCoachmark`, `DemoLoadingSkeleton`, and refactored each in place. Said in transcript: *"It already exists! Let me read it"* and *"It exists too. Let me upgrade it."*
- **PRE-FLIGHT works.** Continue baking it into every Cowork prompt.

---

## §1 — Round-by-round verdict

| Round | Files created | Files modified | Existing equivalents? | Verdict |
|---|---|---|---|---|
| **V5-1 Demo Mode** | `useDemoMode.ts`, `DemoModeChip.tsx`, `FirstVisitModal.tsx` + 3 test files | `types/peptide.ts` (add `isDemo`) | None — no prior demo system | ✅ **Clean** |
| **V5-2 Hero/Footer** | `Footer.tsx` 🚨, `HowItWorks.tsx`, `CitingSection.tsx` + 3 tests | — | **Footer.tsx already existed.** Cowork read it then wrote a new one. | 🚨 **Duplication** — pre-PRE-FLIGHT |
| **V6-1 Sentry** | `sentryContext.ts`, `SENTRY_RUNBOOK.md` + 1 test | — | Existing Sentry was a thin `init()` only — no rich-context wrapper | ✅ **Clean** |
| **V7-1 PDF Report** | `peptideReport.ts`, 6 panel files, 1 test (~1900 LOC) | — | None — jsPDF dep present, no prior renderer | ✅ **Clean** (large new system, justified) |
| **V8-1 Modal Redesign** | (none — all refactor) | `FirstVisitModal.tsx`, `DemoCoachmark.tsx`, `DemoLoadingSkeleton.tsx`, `DemoModeChip.tsx` + 4 test patches | All four targets pre-existed | ✅ **Clean — exemplary** |
| **V9-1 Similar Peptides** | `SimilarPeptidesInspector.tsx` + test | `DrillDownProvider.tsx`, `DrillDown.tsx`, `index.ts` | DrillDown system existed, no Similar mode | ✅ **Clean — extended existing** |

---

## §2 — V5-2 root-cause analysis

Transcript fragment from Cowork's V5-2 session (excerpted):

> "Let me check the existing TrustSection and Footer:"
> [reads `Footer.tsx`]
> "The landing page already has a sophisticated hero, feature showcase, ... Let me create the HowItWorks component and a new Footer..."
> [creates new `Footer.tsx`]

Cowork **read** the existing file and **acknowledged** it but **did not run the explicit decision step** (extend / refactor / replace / leave alone). He proceeded to "create a new Footer" without justifying why both should coexist or why the existing one was inadequate.

This is exactly the failure mode PRE-FLIGHT was designed to catch. Step 3 of the checklist (*"Decide explicitly per match: extend / refactor / replace / leave alone. State the one-sentence justification."*) would have forced him to write a sentence like *"existing Footer.tsx is just a copyright line — replacing in place"* or to refactor the existing file rather than create a parallel one.

---

## §3 — V8-1 success mode (what to reinforce)

Transcript fragment:

> "Now create the DemoCoachmark with react-joyride theming:"
> [searches for existing]
> "It already exists! Let me read it"
> [reads `DemoCoachmark.tsx`]
> "Let me redesign it with the V8-1 theming, preserving the v3 API"
> [edits in place, no parallel file]
>
> "Now create the DemoLoadingSkeleton:"
> [searches]
> "It exists too. Let me read it"
> [reads, refactors framer-motion shimmer, no parallel file]

This is **exactly** the discipline PRE-FLIGHT enforces:
1. Search for the concept name
2. Find existing
3. Read it
4. Decide: refactor in place
5. Edit existing, do not create parallel

V8-1 was delivered AFTER the PRE-FLIGHT bake-in (2026-05-08), and the discipline held. **Hypothesis confirmed**: PRE-FLIGHT works.

---

## §4 — V7-1 environmental token-burn (NOT a discipline failure)

V7-1 (PDF report) burned ~15 commands debugging rollup/esbuild/SWC native modules in the sandbox (macOS arm64 binaries vs Linux sandbox). This is **environmental friction**, not a Cowork discipline failure. He did create a `vitest.sandbox.config.ts` workaround — T1 has since deleted it (commit `4bca7e9` cleanup, line removed pre-commit).

Recommendation: when sandbox issues hit, Cowork should ask after the **first** bus error, not after the third reinstall. Add to PRE-FLIGHT v2: *"If npm/pip native module errors hit twice in a row, stop and report — don't keep reinstalling."*

---

## §5 — Recommendations

1. **Keep PRE-FLIGHT in PROMPT 0.** It's working — V8/V9 rounds proved it.
2. **Add to PRE-FLIGHT v2** (next iteration):
   - *"If a sandbox/environment error repeats after one fix attempt, STOP and report. Don't keep reinstalling — ask T1 to provision the right environment."*
3. **Soft warning for renames/refactors**: if Cowork's diff would create a file with a name very close to an existing one (e.g., `FooterV2.tsx` next to `Footer.tsx`), flag it explicitly in the reply.
4. **Token-cost framing in prompts**: tell Cowork upfront *"this work is billed by token; duplicate work is wasted budget."* This shifts the framing from "do good work" to "do efficient work."
5. **Pre-merge audit by T1**: before T1 commits Cowork output, run `git diff --stat` and check for parallel-file patterns. Pattern: a new file created with `< 5 lines diff in any sibling file` is a red flag — Cowork built net-new instead of extending.

---

## §6 — Cross-references

- Affects: `COWORK_PROMPTS_PELEG.md` PROMPT 0 (PRE-FLIGHT checklist)
- Affects: future Cowork rounds V10+
- Cited by: M-006 mission (AI workflow infrastructure) — empirical data point
