#!/usr/bin/env bash
# Detect direct localStorage access that bypasses storageService.
# Web code should use storageService, mobile code should use AsyncStorage.
# Exit 0 = clean, Exit 1 = violations found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== STORAGE PATTERN CHECK ==="

# Web: direct localStorage access outside storageService
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  'localStorage\.\(getItem\|setItem\|removeItem\|clear\)' \
  packages/web/src/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v storageService \
  | grep -v '__tests__')
if [ -n "$HITS" ]; then
  COUNT=$(echo "$HITS" | wc -l)
  echo "  WARN: $COUNT direct localStorage access(es) in web (should use storageService):"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# Shared: should never use localStorage directly
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  'localStorage' \
  packages/shared/src/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v storageInterface)
if [ -n "$HITS" ]; then
  COUNT=$(echo "$HITS" | wc -l)
  echo "  FAIL: $COUNT localStorage reference(s) in shared package (platform-agnostic violation):"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# Mobile: should never use localStorage (use AsyncStorage)
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  'localStorage' \
  packages/mobile/src/ 2>/dev/null \
  | grep -v node_modules)
if [ -n "$HITS" ]; then
  COUNT=$(echo "$HITS" | wc -l)
  echo "  FAIL: $COUNT localStorage reference(s) in mobile (use AsyncStorage):"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  echo "  PASS: All storage access follows platform patterns"
fi

echo ""
exit $FAIL
