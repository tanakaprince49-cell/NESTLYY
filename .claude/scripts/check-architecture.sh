#!/usr/bin/env bash
# Check architectural conventions in the NESTLYY monorepo.
# Rules:
#   - All Zustand stores must live in packages/shared/src/stores/
#   - All shared types must live in packages/shared/src/types.ts
#   - Navigation types must match registered screens
#   - Package exports must go through index.ts
#   - No duplicate type definitions across packages
#   - API routes must have serverless functions in api/
# Exit 0 = clean, Exit 1 = violations found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== ARCHITECTURE CHECK ==="

# --- 1. Zustand stores only in shared ---
echo "--- Stores Location ---"
STRAY_STORES=$(grep -rl --include='*.ts' --include='*.tsx' \
  'create<.*>()\|create(.*=>.*set(' \
  packages/web/src/ packages/mobile/src/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v '__tests__')
if [ -n "$STRAY_STORES" ]; then
  echo "  FAIL: Zustand stores found outside packages/shared/src/stores/:"
  echo "$STRAY_STORES" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
else
  echo "  PASS: All stores in shared"
fi

# --- 2. Shared exports through index ---
echo "--- Shared Exports ---"
STORE_FILES=$(find packages/shared/src/stores -maxdepth 1 -name '*.ts' ! -name 'index.ts' 2>/dev/null | sed 's|.*/||' | sed 's|\.ts||')
STORE_INDEX=$(cat packages/shared/src/stores/index.ts 2>/dev/null)
MISSING_EXPORTS=""
for STORE in $STORE_FILES; do
  if ! echo "$STORE_INDEX" | grep -q "$STORE"; then
    MISSING_EXPORTS="$MISSING_EXPORTS $STORE"
  fi
done
if [ -n "$MISSING_EXPORTS" ]; then
  echo "  WARN: Store files not exported from index.ts:"
  for S in $MISSING_EXPORTS; do echo "    $S"; done
  FAIL=1
else
  echo "  PASS: All stores exported"
fi

# --- 3. Navigation route/screen consistency ---
echo "--- Navigation Consistency ---"
if [ -f packages/mobile/src/navigation/types.ts ] && [ -f packages/mobile/src/navigation/ToolsStack.tsx ]; then
  # Extract route names from types.ts
  ROUTES=$(grep -oP '^\s+\K\w+(?=:)' packages/mobile/src/navigation/types.ts 2>/dev/null | grep -v '^export' | sort)
  # Extract registered screen names from ToolsStack.tsx
  SCREENS=$(grep -oP 'name="\K[^"]+' packages/mobile/src/navigation/ToolsStack.tsx 2>/dev/null | sort)

  # Check ToolsStackParamList routes are registered (stop at first };)
  TOOLS_ROUTES=$(awk '/ToolsStackParamList/{found=1} found{print; if(/};/){exit}}' packages/mobile/src/navigation/types.ts 2>/dev/null | grep -oP '^\s+\K\w+(?=: )' | sort)
  MISSING_SCREENS=""
  for ROUTE in $TOOLS_ROUTES; do
    if ! echo "$SCREENS" | grep -qx "$ROUTE"; then
      MISSING_SCREENS="$MISSING_SCREENS $ROUTE"
    fi
  done
  if [ -n "$MISSING_SCREENS" ]; then
    echo "  FAIL: Routes defined in types.ts but not registered in ToolsStack.tsx:"
    for R in $MISSING_SCREENS; do echo "    $R"; done
    FAIL=1
  else
    echo "  PASS: All ToolsStack routes registered"
  fi
else
  echo "  SKIP: Navigation files not found"
fi

# --- 4. API route coverage ---
echo "--- API Route Coverage ---"
# Find fetch calls to /api/ in web code
API_CALLS=$(grep -roh --include='*.ts' --include='*.tsx' \
  -E '(fetch|post|get)\(["\x27]/api/[a-z/-]+' \
  packages/web/src/ 2>/dev/null \
  | grep -v node_modules \
  | sed "s/.*['\"]\/api\///" \
  | sed "s/['\"].*//" \
  | sort -u)

MISSING_ROUTES=""
for ROUTE in $API_CALLS; do
  # Check if serverless function exists
  if [ ! -f "api/$ROUTE.js" ] && [ ! -f "api/$ROUTE.ts" ] && [ ! -d "api/$ROUTE" ]; then
    MISSING_ROUTES="$MISSING_ROUTES $ROUTE"
  fi
done
if [ -n "$MISSING_ROUTES" ]; then
  echo "  WARN: API routes called in code but no serverless function found:"
  for R in $MISSING_ROUTES; do echo "    /api/$R"; done
  FAIL=1
else
  echo "  PASS: All API routes have serverless functions"
fi

# --- 5. Duplicate type definitions ---
echo "--- Duplicate Types ---"
# Find interface/type definitions across all packages
SHARED_TYPES=$(grep -ohP '(export )?(interface|type) \K\w+' packages/shared/src/types.ts 2>/dev/null | sort -u)
DUPS=""
for TYPE in $SHARED_TYPES; do
  # Check if same type name is defined in web or mobile
  OTHER=$(grep -rn --include='*.ts' --include='*.tsx' \
    -E "(interface|type) $TYPE[^A-Za-z]" \
    packages/web/src/ packages/mobile/src/ 2>/dev/null \
    | grep -v node_modules \
    | grep -v '__tests__' \
    | grep -v 'import ')
  if [ -n "$OTHER" ]; then
    DUPS="$DUPS\n  $TYPE redefined in:\n$(echo "$OTHER" | sed "s|$REPO_ROOT/||" | sed 's/^/    /')"
  fi
done
if [ -n "$DUPS" ]; then
  echo "  WARN: Types from shared/types.ts redefined elsewhere:"
  echo -e "$DUPS"
  FAIL=1
else
  echo "  PASS: No duplicate type definitions"
fi

# --- 6. Package boundary: shared must be dependency-free from platform ---
echo "--- Shared Package Purity ---"
SHARED_PKG_DEPS=$(node -e "const p=require('./packages/shared/package.json'); Object.keys(p.dependencies||{}).forEach(d=>console.log(d))" 2>/dev/null)
PLATFORM_DEPS=""
for DEP in $SHARED_PKG_DEPS; do
  case "$DEP" in
    react-native*|expo*|@react-navigation*|@expo*) PLATFORM_DEPS="$PLATFORM_DEPS $DEP" ;;
  esac
done
if [ -n "$PLATFORM_DEPS" ]; then
  echo "  FAIL: Shared package has platform-specific dependencies:"
  for D in $PLATFORM_DEPS; do echo "    $D"; done
  FAIL=1
else
  echo "  PASS: Shared package is platform-agnostic"
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo "  ALL CHECKS PASSED"
fi
echo ""
exit $FAIL
