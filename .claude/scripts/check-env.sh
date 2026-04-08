#!/usr/bin/env bash
# Verify all referenced env vars are documented in .env.example.
# Exit 0 = all documented, Exit 1 = missing.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "=== ENVIRONMENT VARIABLE COVERAGE ==="

# Collect env vars used in code (only project-specific patterns)
# Match: VITE_*, EXPO_PUBLIC_*, and specific project vars from process.env
USED=$(grep -roh --include='*.ts' --include='*.tsx' --include='*.js' \
  -E 'import\.meta\.env\.VITE_[A-Z_]+|process\.env\.(OPENROUTER_API_KEY|GEMINI_API_KEY|RESEND_API_KEY|FIREBASE_SERVICE_ACCOUNT|ADMIN_UIDS|APP_URL|EXPO_PUBLIC_[A-Z_]+|VITE_[A-Z_]+)' \
  packages/ api/ 2>/dev/null \
  | grep -v node_modules \
  | sed 's/import\.meta\.env\.//' \
  | sed 's/process\.env\.//' \
  | sort -u)

# Collect env vars defined in .env.example
DEFINED=$(grep -E '^[A-Z_]+=' "$REPO_ROOT/.env.example" 2>/dev/null | cut -d= -f1 | sort -u)

# Standard vars to skip
SKIP="NODE_ENV PORT"

MISSING=""
for VAR in $USED; do
  # Skip standard vars
  if echo "$SKIP" | grep -qw "$VAR"; then
    continue
  fi
  if ! echo "$DEFINED" | grep -qx "$VAR"; then
    MISSING="$MISSING $VAR"
  fi
done

if [ -n "$MISSING" ]; then
  echo "  WARN: Used in code but missing from .env.example:"
  for V in $MISSING; do echo "    $V"; done
  echo ""
  exit 1
else
  echo "  PASS: All env vars documented in .env.example"
  echo ""
  exit 0
fi
