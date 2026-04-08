#!/usr/bin/env bash
# Check that screens have meaningful empty states.
# Looks for screens that render lists/data but have no empty/fallback content.
# Exit 0 = clean, Exit 1 = issues found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== EMPTY STATE CHECK ==="

# Find all screen files
SCREENS=$(find packages/mobile/src/screens -name '*.tsx' 2>/dev/null | grep -v __tests__)
WEB_SCREENS=$(find packages/web/src/components -name '*.tsx' 2>/dev/null | grep -v __tests__ | grep -v node_modules)

check_empty_state() {
  local file="$1"
  local short="${file#$REPO_ROOT/}"

  # Only check files that render primary data lists (FlatList, TrackerHistory, or history/logs mapping)
  if ! grep -qE '(FlatList|TrackerHistory|historyItems|\.map\(\(.*log|\.map\(\(.*item)' "$file" 2>/dev/null; then
    return
  fi

  # Check for empty state patterns
  if ! grep -qE '(ListEmptyComponent|\.length\s*===?\s*0|\.length\s*<\s*1|No .* yet|no .* found|empty|EmptyState|nothing|coming soon)' "$file" 2>/dev/null; then
    echo "  WARN: $short renders data but has no empty state"
    FAIL=1
  fi
}

for F in $SCREENS $WEB_SCREENS; do
  check_empty_state "$F"
done

if [ $FAIL -eq 0 ]; then
  echo "  PASS: All data-rendering screens have empty states"
fi
echo ""
exit $FAIL
