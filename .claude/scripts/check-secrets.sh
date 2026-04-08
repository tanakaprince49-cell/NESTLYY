#!/usr/bin/env bash
# Scan for hardcoded secrets in source files.
# Exit 0 = clean, Exit 1 = found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "=== SECRETS SCAN ==="

PATTERN='(api[_-]?key|secret|password|token|credential)\s*[:=]\s*["\x27][a-zA-Z0-9+/]{16,}'

HITS=$(grep -rniE "$PATTERN" \
  --include='*.ts' --include='*.tsx' --include='*.js' \
  packages/ api/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v dist \
  | grep -v '.env' \
  | grep -v '.example' \
  | grep -v 'process\.env' \
  | grep -v 'import\.meta\.env' \
  | grep -v 'firebase-messaging-sw' \
  | grep -v 'firebase.*config')

if [ -n "$HITS" ]; then
  COUNT=$(echo "$HITS" | wc -l)
  echo "  DANGER: $COUNT potential hardcoded secret(s):"
  echo "$HITS" | head -10 | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  echo ""
  exit 1
else
  echo "  PASS: No hardcoded secrets detected"
  echo ""
  exit 0
fi
