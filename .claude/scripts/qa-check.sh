#!/usr/bin/env bash
# Runs all deterministic QA checks.
# Usage: ./qa-check.sh
# Output: structured report of all findings.

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

ERRORS=0
WARNINGS=0

echo "=== QA CHECK REPORT ==="
echo "Date: $(date -I)"
echo ""

# --- 1. TypeScript type check ---
echo "--- 1. Type Check (tsc --noEmit) ---"
TSC_OUT=$(npx tsc --noEmit 2>&1) && echo "  PASS: No type errors" || { echo "  FAIL:"; echo "$TSC_OUT" | head -30 | sed 's/^/    /'; ERRORS=$((ERRORS+1)); }

echo ""

# --- 2. Build check ---
echo "--- 2. Build Check (vite build) ---"
BUILD_OUT=$(npm run build 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -eq 0 ]; then
  echo "  PASS: Build succeeded"
  echo "  Bundle sizes:"
  echo "$BUILD_OUT" | grep -E 'dist/' | sed 's/^/    /' || true
else
  echo "  FAIL:"
  echo "$BUILD_OUT" | tail -20 | sed 's/^/    /'
  ERRORS=$((ERRORS+1))
fi

echo ""

# --- 3. Console.log detection ---
echo "--- 3. Console Statements ---"
CONSOLE_HITS=$(grep -rn --include='*.ts' --include='*.tsx' 'console\.\(log\|debug\|info\)' "$REPO_ROOT" 2>/dev/null | grep -v node_modules | grep -v dist | grep -v 'server.ts' | grep -v '\.test\.' | grep -v scripts/)
if [ -n "$CONSOLE_HITS" ]; then
  COUNT=$(echo "$CONSOLE_HITS" | wc -l)
  echo "  WARNING: $COUNT console statements found:"
  echo "$CONSOLE_HITS" | head -15 | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  WARNINGS=$((WARNINGS+1))
else
  echo "  PASS: No console statements in production code"
fi

echo ""

# --- 4. Hardcoded secrets scan ---
echo "--- 4. Secrets Scan ---"
SECRET_PATTERNS='(api[_-]?key|secret|password|token|credential)\s*[:=]\s*["\x27][a-zA-Z0-9+/]{16,}'
SECRET_HITS=$(grep -rniE "$SECRET_PATTERNS" --include='*.ts' --include='*.tsx' --include='*.js' --exclude-dir=node_modules --exclude-dir=dist "$REPO_ROOT" 2>/dev/null | grep -v '.env' | grep -v '.example' | grep -v 'process\.env' | grep -v 'import\.meta\.env')
if [ -n "$SECRET_HITS" ]; then
  COUNT=$(echo "$SECRET_HITS" | wc -l)
  echo "  DANGER: $COUNT potential hardcoded secrets:"
  echo "$SECRET_HITS" | head -10 | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  ERRORS=$((ERRORS+1))
else
  echo "  PASS: No hardcoded secrets detected"
fi

echo ""

# --- 5. Missing env vars ---
echo "--- 5. Environment Variable Coverage ---"
ENV_USED=$(grep -roh --include='*.ts' --include='*.tsx' --include='*.js' --exclude-dir=node_modules --exclude-dir=dist 'import\.meta\.env\.\(VITE_[A-Z_]*\)\|process\.env\.\([A-Z_]*\)' "$REPO_ROOT" 2>/dev/null | sed 's/import.meta.env.//' | sed 's/process.env.//' | sort -u)
ENV_DEFINED=$(grep -E '^[A-Z_]+=' "$REPO_ROOT/.env.example" 2>/dev/null | cut -d= -f1 | sort -u)
MISSING=""
for VAR in $ENV_USED; do
  if ! echo "$ENV_DEFINED" | grep -qx "$VAR"; then
    # Skip NODE_ENV and other standard vars
    if [[ "$VAR" != "NODE_ENV" && "$VAR" != "PORT" ]]; then
      MISSING="$MISSING $VAR"
    fi
  fi
done
if [ -n "$MISSING" ]; then
  echo "  WARNING: Used in code but missing from .env.example:"
  for V in $MISSING; do echo "    $V"; done
  WARNINGS=$((WARNINGS+1))
else
  echo "  PASS: All env vars documented in .env.example"
fi

echo ""

# --- 6. Dependency audit ---
echo "--- 6. Dependency Audit ---"
AUDIT_OUT=$(npm audit --production 2>&1) && echo "  PASS: No known vulnerabilities" || {
  echo "  WARNING: Vulnerabilities found:"
  echo "$AUDIT_OUT" | grep -E '(high|critical|moderate|low)' | head -10 | sed 's/^/    /'
  WARNINGS=$((WARNINGS+1))
}

echo ""

# --- 7. Unused dependencies (quick heuristic) ---
echo "--- 7. Potentially Unused Dependencies ---"
DEPS=$(node -e "const p=require('./package.json'); Object.keys(p.dependencies||{}).forEach(d=>console.log(d))")
for DEP in $DEPS; do
  # Skip meta-packages and known indirect deps
  if [[ "$DEP" == "@types/"* ]] || [[ "$DEP" == "typescript" ]] || [[ "$DEP" == "vite" ]]; then
    continue
  fi
  IMPORT_NAME=$(echo "$DEP" | sed 's/@[^/]*//')
  FOUND=$(grep -rl --include='*.ts' --include='*.tsx' --include='*.js' "$DEP" "$REPO_ROOT" 2>/dev/null | grep -v node_modules | grep -v package | head -1)
  if [ -z "$FOUND" ]; then
    echo "  MAYBE UNUSED: $DEP"
  fi
done

echo ""

# --- 8. Large files check ---
echo "--- 8. Large Files (>100KB, excluding node_modules/dist) ---"
find "$REPO_ROOT" -type f -size +100k -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.git/*' -not -path '*/public/*' 2>/dev/null | sed "s|$REPO_ROOT/||" | while read -r F; do
  SIZE=$(du -h "$REPO_ROOT/$F" | cut -f1)
  echo "  $F ($SIZE)"
done

echo ""
echo "=== SUMMARY ==="
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo "=== QA CHECK COMPLETE ==="
[ $ERRORS -eq 0 ] && exit 0 || exit 1
