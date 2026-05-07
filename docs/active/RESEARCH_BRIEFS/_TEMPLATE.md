# [Topic Name] — Research Brief

**Brief ID**: RB-NNN (next sequential number; check `_INDEX.md`)
**Date**: YYYY-MM-DD
**Author**: T-RES (research terminal)
**Mission**: [one-line summary of the research question]
**Reading time**: ~N minutes

---

## §1 — TL;DR (3-5 bullets)

The headline findings someone scanning this brief should walk away with. Concrete, opinionated, no hedging.

- Bullet 1
- Bullet 2
- Bullet 3

---

## §2 — Context (why we're researching this now)

What triggered this brief. Reference the relevant ADR / phase / wave / commit. 2-4 sentences.

---

## §3 — Options evaluated

For each candidate (tool / approach / strategy), one subsection:

### Option A — [name + 1-line summary]

- **What it is**: 1-2 sentences
- **License + cost**: free / OSS / paid
- **Maturity**: years in production, ecosystem size, key adopters
- **Fit for PVL**: scientific tool / Python+TS stack / solo-maintainer-friendly?
- **Pros**: specific, with citations
- **Cons**: specific, with citations
- **Migration cost**: hours to adopt, breaking changes risk

(Repeat per option — typically 3-6 candidates.)

---

## §4 — Comparison matrix

| Criterion | Option A | Option B | Option C | ... |
|---|---|---|---|---|
| Cost | $X/mo at PVL scale | $0 | ... | |
| Maturity (years) | N | N | ... | |
| Solo-maintainer ops burden | Low/Med/High | ... | ... | |
| Lock-in risk | Low/Med/High | ... | ... | |
| Performance @ PVL scale | data | data | data | |
| ... | | | | |

Score each criterion. Pick a recommendation.

---

## §5 — Recommendation

**Adopt**: Option X.
**Reason**: 2-3 sentences. The single decisive factor.
**Rejected alternatives + why**: bullet list.

---

## §6 — Implementation plan (if recommendation is adopted)

- Effort estimate (hours)
- Wave it slots into (per MASTER_PUSH_PLAN)
- Files affected
- New ADR needed? If yes, draft below in §7.
- Roadmap edits needed? List specifically.
- Tech-radar movement: from "plan next" → "adopt now" or similar.

---

## §7 — Proposed ADR draft (if adoption is recommended)

```markdown
## ADR-NNN — [Decision title]
**Date**: YYYY-MM-DD · **Status**: PROPOSED · **Author**: T-RES + Said
**Context**: ...
**Decision**: ...
**Reasoning**: ...
**Implication**: ...
**Evidence**: this brief (RB-NNN)
```

---

## §8 — Sources cited

Numbered list. Every claim in §3-5 should reference one of these.

1. URL — what it documents
2. URL — what it documents
3. ...

---

## §9 — Open questions / things to revisit

- Question 1 (recheck in 6 months because tech is moving fast)
- Question 2

---

## §10 — Cross-references

- Affects: ADR-XXX, ADR-YYY
- Affects: MASTER_PUSH_PLAN.md §N
- Affects: ROADMAP.md Phase X
- Supersedes: RB-MMM (older brief, if applicable)
