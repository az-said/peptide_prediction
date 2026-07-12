# RFC Template — PePFibPred

**Effective**: 2026-07-12
**Companion**: `DECISIONS.md` (ADR log). An RFC is *pre-decision* (seeks feedback). An ADR is *post-decision* (records the outcome).

> **When to write an RFC first**: any change to a classification axiom (FF-Helix / FF-SSW / SSW definitions), any change to `api_models.py`, any item listed in `docs/handbook/agents/04_when_to_ask_humans.md`. Otherwise, skip the RFC and just record the ADR.
>
> **Medium**: file the RFC as a **GitHub Discussion** under category `RFC`. The Discussion post is the RFC. The comment thread is the review window.
>
> **Review window**: 2 business days by default. If any of Said / Alex / Peleg needs longer, they extend the window in a top-level comment.

---

## Template — copy this into the Discussion post

```markdown
# RFC-YYYY-MM-DD: <title in imperative mood, e.g., "Add second FF-SSW gate for kinked-β peptides">

## Problem

<One paragraph. What is broken or missing today? Why is the current behaviour unacceptable? Cite specific file:line or user-facing symptoms.>

## Proposed change

<One paragraph, and then a numbered list of concrete edits. Cite `file:line` for every claim.>

1. Change `backend/auxiliary.py:340-361` to …
2. Add a new config `DEFAULT_FF_SSW_KINK_CUTOFF = X` to `backend/config.py`
3. Update `api_models.py` to expose `ffSswKinked` as a new nullable boolean field
4. Regression-lock in `test_axiom_invariants.py::TestFFSswKinkedSubsetFFSsw`

## Alternatives considered

- **Alternative A: <name>** — <why not>
- **Alternative B: <name>** — <why not>
- **Do nothing** — <what breaks / what stays acceptable>

## Blast radius

- **Files modified**: <list>
- **Tests broken (expected)**: <list>
- **Docs to update**: <list>
- **Breaking API change?**: yes / no. If yes, requires a MAJOR SemVer bump (see `API_STABILITY.md`).
- **Peleg sign-off required?**: yes / no. If yes: link to her Drive comment / email once received.

## Who must approve

- [ ] `@az-said` — architectural veto
- [ ] `@axelgolubev` — operational review
- [ ] Peleg Ragonis-Bachar (off-repo) — scientific sign-off, if the change touches an axiom
- [ ] Meytal Landau (off-repo) — only for changes to funding / affiliation / public branding

## Comment window closes

**YYYY-MM-DD HH:MM (Europe/Berlin)** — 2 business days from filing. Extend if any approver comments requesting more time.

## What happens after the window

- Approved → open a PR implementing the change. Reference this RFC in the PR body. Add an ADR entry in `DECISIONS.md` linking back to this Discussion under "Evidence".
- Rejected → close the Discussion. Do not implement. Record the rejection reason as the top-level comment so future readers see why.
- No consensus → escalate to a synchronous decision meeting between Said + Alex (+ Peleg for scientific).
```

---

## Trigger rules (when to use this vs skip straight to ADR)

**Must file an RFC first (this template):**
- Any change to the FF-Helix, FF-SSW, or SSW composition rules
- Any change to the μH / hydrophobicity / TANGO hotspot threshold defaults
- Any change to `backend/schemas/api_models.py`
- Any change to `backend/services/dataframe_utils.py` that touches the axiom columns
- Any change to `backend/auxiliary.py` that touches `_HELIX_PROP`, `compute_ssw_combined_flag`, or `compute_4category_flags`
- Any change to the reference-dataset curation
- Any decision to change the tool's public brand (name, tagline, logo, URL)
- Any change to the license (currently MIT)
- Any breaking change to a STABLE `api_models.py` field (see `API_STABILITY.md`)

**Skip the RFC, go straight to an ADR entry in `DECISIONS.md`:**
- Bug fixes with no behaviour change
- Dependency upgrades (unless they are breaking or change public behaviour)
- Documentation updates
- Test additions
- Refactoring without functional change
- Any change to an UNSTABLE `api_models.py` field
- Any change to CI configuration
- Any change to Docker or deployment infrastructure

**When in doubt**: file the RFC. It costs one Discussion post + 2 days; it does not cost approval — silence during the window is treated as consent for non-scientific changes.

---

## Example (retro-fitted to a past decision — illustrative only)

Applied to what would have been the ISSUE-032 SSW-axiom fix if it had used the RFC process:

> **RFC-2026-05-19: Unify SSW column at the DataFrame boundary and enforce FF-Helix ⊆ Helix / FF-SSW ⊆ SSW axioms**
>
> **Problem**: `sswPrediction = -1` while `ffSswFlag = 1` is possible today because the two columns are derived from different sources. Peleg reported P85089 and P0C005 as observed cases.
>
> **Proposed change**:
> 1. In `backend/services/dataframe_utils.py`, compute a new column `SSW prediction (unified)` as `tango_ssw OR s4pred_ssw`
> 2. In `backend/services/normalize.py`, add `_enforce_ff_axioms()` as a defence-in-depth clamp at the API boundary
> 3. Add 9 invariant tests to `backend/tests/test_axiom_invariants.py`
>
> **Alternatives considered**: (A) change `sswPrediction` to require `tango AND s4pred` — rejected, contradicts Peleg canonical rule; (B) hide `ffSswFlag` in the UI when the row is inconsistent — rejected, does not fix underlying data
>
> **Peleg sign-off required?** Yes — the OR rule is her canonical statement. → Link to her 2026-05-18 email confirming.
>
> **Approved 2026-05-21**. → ADR to be filed as ADR-021 (ended up filed later; hindsight).

The RFC process would have surfaced this decision publicly + on record before the code shipped — the ISSUE-032 defect class becomes explicit in the RFC's "Problem" and "Alternatives considered" sections rather than discovered later in a Slack thread.
