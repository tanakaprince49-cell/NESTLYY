#!/usr/bin/env bash
# Check cross-package import violations in the monorepo.
# Rules:
#   - web must NOT import from mobile
#   - mobile must NOT import from web
#   - shared must NOT import from web or mobile
#   - All cross-package imports must go through @nestly/ aliases
# Exit 0 = clean, Exit 1 = violations found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== IMPORT CHECK ==="

# shared must not import from web or mobile
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  -E "from ['\"](@nestly/(web|mobile)|\.\.\/\.\.\/(web|mobile))" \
  packages/shared/src/ 2>/dev/null | grep -v node_modules)
if [ -n "$HITS" ]; then
  echo "  FAIL: shared imports from web/mobile:"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# web must not import from mobile
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  -E "from ['\"](@nestly/mobile|\.\.\/\.\.\/(mobile))" \
  packages/web/src/ 2>/dev/null | grep -v node_modules)
if [ -n "$HITS" ]; then
  echo "  FAIL: web imports from mobile:"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# mobile must not import from web
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  -E "from ['\"](@nestly/web|\.\.\/\.\.\/(web))" \
  packages/mobile/src/ 2>/dev/null | grep -v node_modules)
if [ -n "$HITS" ]; then
  echo "  FAIL: mobile imports from web:"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# Relative cross-package imports (should use @nestly/ alias)
HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  -E "from ['\"]\.\.\/\.\.\/\.\.\/" \
  packages/*/src/ 2>/dev/null | grep -v node_modules)
if [ -n "$HITS" ]; then
  echo "  WARN: Relative cross-package imports (should use @nestly/ alias):"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  echo "  PASS: No import violations"
fi

echo ""
exit $FAIL
