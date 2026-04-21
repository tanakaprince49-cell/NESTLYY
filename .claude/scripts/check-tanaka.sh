#!/usr/bin/env bash
# Checks for common destructive patterns from AI Studio pushes.
# Compares current branch against main and flags known problem patterns.
# Usage: ./check-tanaka.sh [base-branch]
# Default base: main

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
BASE="${1:-main}"

echo "=== DESTRUCTIVE CHANGE DETECTION ==="
echo "Comparing HEAD against $BASE"
echo ""

ISSUES=0

# --- 1. Deleted critical files ---
echo "--- 1. Critical File Deletions ---"
CRITICAL_FILES=(
  ".github/workflows/ci.yml"
  ".github/workflows/cd.yml"
  ".github/workflows/auto-pr.yml"
  "vercel.json"
  "tailwind.config.js"
  "postcss.config.js"
  "app.css"
  "types.ts"
  "services/storageService.ts"
  "services/reportService.ts"
)

DELETED=$(git diff --name-status "$BASE"...HEAD 2>/dev/null | grep '^D' | awk '{print $2}' || true)
for FILE in "${CRITICAL_FILES[@]}"; do
  if echo "$DELETED" | grep -qx "$FILE"; then
    echo "  DANGER: $FILE DELETED"
    ISSUES=$((ISSUES+1))
  fi
done
[ $ISSUES -eq 0 ] && echo "  OK: No critical files deleted"

echo ""

# --- 2. Hardcoded admin emails ---
echo "--- 2. Hardcoded Admin Emails ---"
HARDCODED=$(grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=dist \
  -E "(tanakaprince|admin.*@.*\.com|isAdmin.*===.*')" "$REPO_ROOT" 2>/dev/null \
  | grep -v '.env' | grep -v CLAUDE.md | grep -v node_modules || true)
if [ -n "$HARDCODED" ]; then
  echo "  WARNING: Possible hardcoded admin emails:"
  echo "$HARDCODED" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  ISSUES=$((ISSUES+1))
else
  echo "  OK: No hardcoded admin emails found"
fi

echo ""

# --- 3. Removed auth middleware ---
echo "--- 3. Auth Middleware ---"
if [ -f "$REPO_ROOT/server.ts" ]; then
  if ! grep -q 'requireAuth' "$REPO_ROOT/server.ts"; then
    echo "  DANGER: requireAuth middleware missing from server.ts"
    ISSUES=$((ISSUES+1))
  else
    echo "  OK: requireAuth present in server.ts"
  fi
else
  echo "  SKIP: server.ts not found"
fi

echo ""

# --- 4. TypeScript 'any' explosion ---
echo "--- 4. TypeScript 'any' Usage ---"
ANY_COUNT=$(grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=dist \
  ': any\b\|as any\b' "$REPO_ROOT" 2>/dev/null | wc -l)
echo "  Total 'any' types: $ANY_COUNT"
if [ "$ANY_COUNT" -gt 20 ]; then
  echo "  WARNING: Excessive 'any' usage ($ANY_COUNT instances)"
  ISSUES=$((ISSUES+1))
fi

echo ""

# --- 5. Removed imports/functionality ---
echo "--- 5. Key Function Presence ---"
CHECKS=(
  "services/reportService.ts:generateFullPregnancyReport"
  "services/storageService.ts:getUserKey\|getAuthEmail"
  "services/storageService.ts:getItem\|setItem"
)
for CHECK in "${CHECKS[@]}"; do
  FILE="${CHECK%%:*}"
  PATTERN="${CHECK##*:}"
  if [ -f "$REPO_ROOT/$FILE" ]; then
    if grep -qE "$PATTERN" "$REPO_ROOT/$FILE"; then
      echo "  OK: $FILE contains $PATTERN"
    else
      echo "  DANGER: $FILE missing $PATTERN"
      ISSUES=$((ISSUES+1))
    fi
  else
    echo "  DANGER: $FILE does not exist"
    ISSUES=$((ISSUES+1))
  fi
done

echo ""

# --- 6. vercel.json validity ---
echo "--- 6. vercel.json ---"
if [ -f "$REPO_ROOT/vercel.json" ]; then
  if node -e "JSON.parse(require('fs').readFileSync('$REPO_ROOT/vercel.json','utf8'))" 2>/dev/null; then
    echo "  OK: vercel.json is valid JSON"
  else
    echo "  DANGER: vercel.json is invalid JSON"
    ISSUES=$((ISSUES+1))
  fi
  # Check for known bad patterns
  if grep -q '\.\*\\.' "$REPO_ROOT/vercel.json" 2>/dev/null; then
    echo "  WARNING: vercel.json contains regex-style patterns (Vercel uses glob patterns)"
    ISSUES=$((ISSUES+1))
  fi
else
  echo "  DANGER: vercel.json missing"
  ISSUES=$((ISSUES+1))
fi

echo ""
echo "=== SUMMARY ==="
echo "Issues found: $ISSUES"
[ $ISSUES -eq 0 ] && echo "Status: CLEAN" || echo "Status: NEEDS REVIEW"
exit $ISSUES
