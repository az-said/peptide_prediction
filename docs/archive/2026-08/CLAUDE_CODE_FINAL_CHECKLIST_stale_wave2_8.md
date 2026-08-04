# Claude Code — Final pre-merge checklist for Wave 2.8/2.9

> Paste this entire file as your prompt. It contains everything you need.

## Context

Branch `wave-2.8/peleg-pdf-followups` is 50+ commits ahead of `main`.
All features are implemented and merged. Cowork session completed the
V11 polish sweep (T1-T7). The PR body is written at
`docs/internal/PR_BODY_WAVE_2_8.md`. Paper materials for Peleg have been
compiled and pasted into the Google Doc.

**Your job: run the final CI checks, fix any failures, commit the V11
files that Cowork created, and open the PR to main.**

---

## Step 1: Commit Cowork's V11 changes

Cowork created/modified these files during the V11 polish sweep. They
are already on disk but NOT committed yet:

```
NEW:     ui/src/components/__tests__/UniProtBatchPreview.test.tsx
MODIFIED: ui/src/lib/api.ts                (deleted dead fetchExampleDataset — 4 lines)
MODIFIED: README.md                        (added 1-line HANDOFF link after "Optional prediction tools")
NEW:     docs/internal/PR_BODY_WAVE_2_8.md
NEW:     PePFibPred_Materials_For_Peleg.docx  (paper materials — do NOT commit this, it's a local artifact)
```

Commit the first four files (NOT the .docx) with:
```
git add ui/src/components/__tests__/UniProtBatchPreview.test.tsx
git add ui/src/lib/api.ts
git add README.md
git add docs/internal/PR_BODY_WAVE_2_8.md
```

Use THREE separate commits per the V11 dispatch rules:
1. `test(ui): T1 UniProtBatchPreview vitest coverage` — the test file
2. `chore: T4-T5 lint sweep + dead-code removal` — api.ts change
3. `docs: T6-T7 README HANDOFF link + PR body` — README.md + PR_BODY_WAVE_2_8.md

Author: `Said Azaizah <said.azaizah@cssb-hamburg.de>`
No Claude/AI/assistant traces in commits.

## Step 2: Run the full test suite

```bash
cd ui && npx vitest run 2>&1 | tail -40
```

If any test fails:
- Read the failure output
- If the test is wrong (testing old behavior that changed), fix the test
- If the code is wrong, fix the code
- If the test was already red on main, note it in the PR description

Then:
```bash
cd .. && make test 2>&1 | tail -30
```

Same rules: fix reds, note pre-existing ones.

## Step 3: Lint + typecheck

```bash
cd ui && npx tsc --noEmit
npm run lint 2>&1 | tail -20
cd .. && make lint 2>&1 | tail -20
```

Fix errors. Warnings are OK if pre-existing (shadcn boilerplate,
conditional hooks in Results.tsx — known and documented in PR body).

## Step 4: Build check

```bash
cd ui && npx vite build 2>&1 | tail -10
```

Must succeed with no errors.

## Step 5: Open the PR

```bash
gh pr create \
  --base main \
  --head wave-2.8/peleg-pdf-followups \
  --title "Wave 2.8/2.9 — Peleg PDF follow-ups, UniProt batch, HTML report, final polish" \
  --body-file docs/internal/PR_BODY_WAVE_2_8.md
```

The PR body is already written with the full feature list, test counts,
browser checklist, and pre-existing issues.

## Step 6: Tag for release (AFTER PR merges)

Once the PR is merged to main:
```bash
git checkout main && git pull
git tag -a v0.3.0 -m "v0.3.0 — Wave 2.8/2.9 complete"
git push origin v0.3.0
```

This triggers:
- Zenodo DOI mint (automatic via GitHub release workflow)
- Sentry release + source maps
- Docker image publish to GHCR
- PyPI publish for pvl-cli + pvl-mcp

---

## What NOT to do

- Do NOT modify any files beyond what's needed to fix test/lint failures
- Do NOT touch `backend/schemas/api_models.py`
- Do NOT rename or move files
- Do NOT add new features
- Do NOT commit `PePFibPred_Materials_For_Peleg.docx` (local artifact)
- Do NOT commit any file in `~/Documents/Claude/Projects/PVL/` (stale scratch folder)

## Files Cowork touched this session (for reference)

All in `peptide_prediction/` (the actual repo):

| File | What happened |
|---|---|
| `ui/src/components/__tests__/UniProtBatchPreview.test.tsx` | NEW — T1 test file (6 cases) |
| `ui/src/lib/api.ts` | EDIT — deleted `fetchExampleDataset` (dead code, T5) |
| `README.md` | EDIT — added HANDOFF link (T6, 1 line) |
| `docs/internal/PR_BODY_WAVE_2_8.md` | NEW — PR description (T7) |
| `PePFibPred_Materials_For_Peleg.docx` | NEW — paper materials (do NOT commit) |
