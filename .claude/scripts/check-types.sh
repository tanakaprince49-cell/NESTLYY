#!/usr/bin/env bash
# Check TypeScript types across all monorepo packages.
# Exit 0 = all clean, Exit 1 = errors found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== TYPE CHECK ==="

for PKG in shared web mobile; do
  DIR="packages/$PKG"
  if [ ! -f "$DIR/tsconfig.json" ]; then
    echo "  SKIP: $PKG (no tsconfig.json)"
    continue
  fi
  OUT=$(npm run lint -w "@nestly/$PKG" 2>&1)
  EXIT=$?
  if [ $EXIT -eq 0 ]; then
    echo "  PASS: @nestly/$PKG"
  else
    echo "  FAIL: @nestly/$PKG"
    echo "$OUT" | grep -E "error TS" | head -20 | sed 's/^/    /'
    FAIL=1
  fi
done

echo ""
exit $FAIL
