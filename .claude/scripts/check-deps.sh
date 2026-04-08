#!/usr/bin/env bash
# Check for dependency vulnerabilities and potentially unused packages.
# Exit 0 = clean, Exit 1 = issues found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0

echo "=== DEPENDENCY AUDIT ==="

# Security audit
AUDIT_OUT=$(npm audit --production 2>&1)
AUDIT_EXIT=$?
if [ $AUDIT_EXIT -eq 0 ]; then
  echo "  PASS: No known vulnerabilities"
else
  echo "  WARN: Vulnerabilities found:"
  echo "$AUDIT_OUT" | grep -E '(high|critical|moderate|low|found)' | head -10 | sed 's/^/    /'
  FAIL=1
fi

echo ""

# Unused deps per package
echo "--- Potentially Unused Dependencies ---"
for PKG in shared web mobile; do
  PKG_JSON="packages/$PKG/package.json"
  PKG_DIR="packages/$PKG"
  if [ ! -f "$PKG_JSON" ]; then continue; fi

  DEPS=$(node -e "const p=require('./$PKG_JSON'); Object.keys(p.dependencies||{}).forEach(d=>console.log(d))" 2>/dev/null)
  for DEP in $DEPS; do
    # Skip meta-packages
    case "$DEP" in
      @types/*|typescript|vite|tailwindcss|postcss|autoprefixer) continue ;;
      nativewind|react-native-css-interop) continue ;;
    esac
    FOUND=$(grep -rl --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' \
      "$DEP" "$PKG_DIR/src" "$PKG_DIR/index.ts" 2>/dev/null \
      | grep -v node_modules | head -1)
    if [ -z "$FOUND" ]; then
      echo "  MAYBE UNUSED in @nestly/$PKG: $DEP"
    fi
  done
done

echo ""
exit $FAIL
