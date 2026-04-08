#!/usr/bin/env bash
# Verify production build succeeds for web package.
# Exit 0 = build OK, Exit 1 = build failed.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "=== BUILD CHECK ==="

OUT=$(npm run build -w @nestly/web 2>&1)
EXIT=$?
if [ $EXIT -eq 0 ]; then
  echo "  PASS: Web build succeeded"
  echo "$OUT" | grep -E '(dist/|kB|gzipped)' | head -10 | sed 's/^/    /'
else
  echo "  FAIL: Web build failed"
  echo "$OUT" | tail -20 | sed 's/^/    /'
fi

echo ""
exit $EXIT
