#!/usr/bin/env bash
# Detect console.log/debug/info in production source files.
# Ignores: node_modules, dist, tests, scripts, server.ts
# Exit 0 = clean, Exit 1 = found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "=== CONSOLE STATEMENTS ==="

HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
  'console\.\(log\|debug\|info\)' \
  packages/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v dist \
  | grep -v '\.test\.' \
  | grep -v '__tests__' \
  | grep -v 'server\.ts' \
  | grep -v scripts/)

if [ -n "$HITS" ]; then
  COUNT=$(echo "$HITS" | wc -l)
  echo "  WARN: $COUNT console statement(s) found:"
  echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  echo ""
  exit 1
else
  echo "  PASS: No console statements in production code"
  echo ""
  exit 0
fi
