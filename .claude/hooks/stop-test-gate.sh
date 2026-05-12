#!/bin/bash
# Stop hook — verifies fast unit tests pass before session can close cleanly.
#
# If any test fails, exit 2 → Claude sees stderr and continues working.
# If tests pass, exit 0 → session closes normally.
#
# Skipped when no changes are staged or unstaged (e.g., docs-only / research
# sessions don't trigger code tests). Skipped when neither backend nor ui
# virtualenvs are present (fresh-clone friendly).
#
# Per ADR-019 (RB-004) and feedback_simplicity_and_testability.md.

INPUT=$(cat)
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')

# If we can't find the project root, do nothing (don't block on edge cases).
[[ -z "$PROJECT_DIR" ]] && exit 0
cd "$PROJECT_DIR" || exit 0

# Skip if no code changes since last commit (docs-only sessions).
if git diff --quiet HEAD -- 'backend/**/*.py' 'ui/**/*.ts' 'ui/**/*.tsx' 2>/dev/null \
   && git diff --cached --quiet -- 'backend/**/*.py' 'ui/**/*.ts' 'ui/**/*.tsx' 2>/dev/null; then
  exit 0
fi

FAILURES=""

# Backend fast unit tests (only if .venv exists).
if [[ -x "backend/.venv/bin/python" ]]; then
  if ! (cd backend && .venv/bin/python -m pytest -q --no-header -x --tb=line tests/ 2>&1 | tail -20); then
    FAILURES+="backend "
  fi
fi

# Frontend tests (only if node_modules exists).
if [[ -d "ui/node_modules" ]]; then
  if ! (cd ui && npx --no-install vitest run --reporter=dot 2>&1 | tail -10); then
    FAILURES+="frontend "
  fi
fi

if [[ -n "$FAILURES" ]]; then
  echo "❌ Stop blocked — tests failing: $FAILURES" >&2
  echo "Fix failing tests before closing the session, or explain why this session intentionally leaves tests red." >&2
  exit 2
fi

exit 0
