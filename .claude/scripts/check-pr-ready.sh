#!/usr/bin/env bash
# Pre-flight checks before creating a PR.
# Verifies types, tests, commit conventions, no secrets staged, branch is clean.
# Usage: ./check-pr-ready.sh [base-branch]
# Exit 0 = ready, Exit 1 = not ready.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BASE="${1:-main}"
BRANCH=$(git branch --show-current)
FAIL=0

echo "========================================="
echo "  PR READINESS CHECK"
echo "  Branch: $BRANCH -> $BASE"
echo "========================================="
echo ""

# --- 1. Not on main ---
echo "--- Branch ---"
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "  FAIL: Cannot PR from $BRANCH"
  FAIL=1
else
  echo "  PASS: On branch $BRANCH"
fi

# --- 2. Has commits ahead of base ---
echo "--- Commits ---"
AHEAD=$(git rev-list --count "$BASE..$BRANCH" 2>/dev/null || echo 0)
if [ "$AHEAD" -eq 0 ]; then
  echo "  FAIL: No commits ahead of $BASE"
  FAIL=1
else
  echo "  PASS: $AHEAD commit(s) ahead of $BASE"
fi

# --- 3. Commit message convention ---
echo "--- Commit Messages ---"
BAD_MSGS=""
while IFS= read -r MSG; do
  if ! echo "$MSG" | grep -qE '^(feat|fix|refactor|chore|docs|ci|test|style|perf|revert)(\(.+\))?(!)?:'; then
    BAD_MSGS="$BAD_MSGS\n    $MSG"
  fi
done < <(git log "$BASE..$BRANCH" --format='%s' 2>/dev/null)

if [ -n "$BAD_MSGS" ]; then
  echo "  WARN: Commit(s) not following conventional format:"
  echo -e "$BAD_MSGS"
  # Warning only, not a blocker
else
  echo "  PASS: All commits follow convention"
fi

# --- 4. Types clean ---
echo "--- Types ---"
TYPES_OK=true
for PKG in shared web mobile; do
  if [ -f "packages/$PKG/tsconfig.json" ]; then
    if ! npm run lint -w "@nestly/$PKG" 2>&1 | tail -1 | grep -q "^$"; then
      # tsc outputs nothing on success, something on failure
      :
    fi
    TSC_OUT=$(npm run lint -w "@nestly/$PKG" 2>&1)
    if echo "$TSC_OUT" | grep -q "error TS"; then
      echo "  FAIL: Type errors in @nestly/$PKG"
      echo "$TSC_OUT" | grep "error TS" | head -5 | sed 's/^/    /'
      TYPES_OK=false
      FAIL=1
    fi
  fi
done
$TYPES_OK && echo "  PASS: All types clean"

# --- 5. Tests pass ---
echo "--- Tests ---"
TEST_FAIL=false
for PKG in shared web mobile; do
  PKG_JSON="packages/$PKG/package.json"
  if [ -f "$PKG_JSON" ] && grep -q '"test"' "$PKG_JSON" 2>/dev/null; then
    TEST_OUT=$(npm test -w "@nestly/$PKG" 2>&1)
    if [ $? -ne 0 ]; then
      echo "  FAIL: Tests failed in @nestly/$PKG"
      echo "$TEST_OUT" | tail -5 | sed 's/^/    /'
      TEST_FAIL=true
      FAIL=1
    fi
  fi
done
$TEST_FAIL || echo "  PASS: All tests pass"

# --- 6. No secrets in staged/changed files ---
echo "--- Secrets in Changes ---"
DIFF_SECRETS=$(git diff "$BASE..$BRANCH" 2>/dev/null \
  | grep -E '^\+' \
  | grep -viE '^\+\+\+' \
  | grep -iE '(api[_-]?key|secret|password|token)\s*[:=]\s*["\x27][a-zA-Z0-9+/]{16,}' \
  | grep -v 'process\.env' \
  | grep -v 'import\.meta\.env' \
  | grep -v 'firebase.*config' \
  | head -5)
if [ -n "$DIFF_SECRETS" ]; then
  echo "  FAIL: Possible secrets in diff:"
  echo "$DIFF_SECRETS" | sed 's/^/    /'
  FAIL=1
else
  echo "  PASS: No secrets in changes"
fi

# --- 7. No console.log in changed files ---
echo "--- Console in Changes ---"
CONSOLE_DIFF=$(git diff "$BASE..$BRANCH" -- '*.ts' '*.tsx' 2>/dev/null \
  | grep -E '^\+.*console\.(log|debug|info)' \
  | grep -v '^[+][+][+]' \
  | head -5)
if [ -n "$CONSOLE_DIFF" ]; then
  echo "  WARN: console statements added:"
  echo "$CONSOLE_DIFF" | sed 's/^/    /'
else
  echo "  PASS: No console statements added"
fi

# --- 8. No .env files staged ---
echo "--- Sensitive Files ---"
ENV_FILES=$(git diff --name-only "$BASE..$BRANCH" 2>/dev/null | grep -E '\.env$|\.env\.local|credentials|\.pem$|\.key$')
if [ -n "$ENV_FILES" ]; then
  echo "  FAIL: Sensitive files in changes:"
  echo "$ENV_FILES" | sed 's/^/    /'
  FAIL=1
else
  echo "  PASS: No sensitive files"
fi

# --- 9. Branch up to date ---
echo "--- Branch Freshness ---"
git fetch origin "$BASE" --quiet 2>/dev/null
BEHIND=$(git rev-list --count "$BRANCH..origin/$BASE" 2>/dev/null || echo 0)
if [ "$BEHIND" -gt 0 ]; then
  echo "  WARN: $BEHIND commit(s) behind origin/$BASE (consider rebasing)"
else
  echo "  PASS: Up to date with origin/$BASE"
fi

echo ""
echo "========================================="
echo "  STATUS: $( [ $FAIL -eq 0 ] && echo 'READY' || echo 'NOT READY' )"
echo "========================================="
exit $FAIL
