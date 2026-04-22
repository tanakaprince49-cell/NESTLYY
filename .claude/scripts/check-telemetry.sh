#!/usr/bin/env bash
# Rejects any telemetry / analytics SDK creeping back into the repo.
# Part of the Zero-Data MVP guardrails (#303, #292).
#
# Fails if any packages/*/package.json declares a banned dependency, or
# if any TS/TSX source file in packages/*/src imports a banned module.
# Runs both locally (via qa-check.sh) and in CI (telemetry-guard.yml).

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

ISSUES=0

echo "=== TELEMETRY GUARD ==="
echo ""

# --- 1. Banned dependencies in any package.json ---
echo "--- 1. Banned packages in package.json ---"
BANNED_PACKAGES=(
  "@sentry/"
  "@bugsnag/"
  "mixpanel"
  "amplitude"
  "posthog"
  "@vercel/analytics"
  "@datadog/browser"
  "logrocket"
  "fullstory"
  "heap-"
  "segment"
  "plausible"
  "plausible-tracker"
)

PKG_FILES=(
  "package.json"
  "packages/shared/package.json"
  "packages/web/package.json"
  "packages/mobile/package.json"
)

for pkg in "${PKG_FILES[@]}"; do
  [ -f "$pkg" ] || continue
  for banned in "${BANNED_PACKAGES[@]}"; do
    if grep -qE "\"$banned" "$pkg"; then
      HITS=$(grep -nE "\"$banned" "$pkg")
      echo "  FAIL: $pkg declares banned package pattern '$banned':"
      echo "$HITS" | sed 's/^/    /'
      ISSUES=$((ISSUES+1))
    fi
  done
done

if [ $ISSUES -eq 0 ]; then
  echo "  OK: no banned packages in any package.json"
fi

echo ""

# --- 2. Banned imports in source code ---
echo "--- 2. Banned imports in packages/*/src ---"
BANNED_IMPORTS=(
  "from ['\"]@sentry/"
  "from ['\"]@bugsnag/"
  "from ['\"]mixpanel"
  "from ['\"]amplitude"
  "from ['\"]posthog"
  "from ['\"]@vercel/analytics"
  "from ['\"]@datadog/browser"
  "from ['\"]logrocket"
  "from ['\"]fullstory"
  "from ['\"]firebase/analytics"
  "from ['\"]plausible"
  "getAnalytics"
)

BEFORE_IMPORT_ISSUES=$ISSUES
for pattern in "${BANNED_IMPORTS[@]}"; do
  HITS=$(grep -rnE "$pattern" \
    --include='*.ts' --include='*.tsx' \
    --exclude-dir=node_modules --exclude-dir=dist \
    packages/ 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "  FAIL: banned import pattern '$pattern':"
    echo "$HITS" | sed 's/^/    /'
    ISSUES=$((ISSUES+1))
  fi
done

if [ $ISSUES -eq $BEFORE_IMPORT_ISSUES ]; then
  echo "  OK: no banned imports in packages/*/src"
fi

echo ""

# --- 3. Banned hostnames in HTML / API proxies ---
# The #2 list only catches npm imports. Telemetry can also slip in via a raw
# <script src="..."> tag in index.html or a serverless proxy that forwards to
# an analytics origin. Plausible was shipped for months this way (#358).
echo "--- 3. Banned telemetry hostnames in HTML / api/ ---"
BANNED_HOSTS=(
  "plausible\\.io"
  "googletagmanager\\.com"
  "google-analytics\\.com"
  "sentry\\.io"
  "mixpanel\\.com"
  "amplitude\\.com"
  "posthog\\.com"
  "datadoghq\\.com"
  "logrocket\\.com"
  "fullstory\\.com"
  "heap\\.io"
  "segment\\.io"
)

BEFORE_HOST_ISSUES=$ISSUES
for host in "${BANNED_HOSTS[@]}"; do
  HITS=$(grep -rnE "$host" \
    --include='*.html' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
    packages/ api/ 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "  FAIL: banned telemetry hostname '$host':"
    echo "$HITS" | sed 's/^/    /'
    ISSUES=$((ISSUES+1))
  fi
done

if [ $ISSUES -eq $BEFORE_HOST_ISSUES ]; then
  echo "  OK: no banned telemetry hostnames in packages/ or api/"
fi

echo ""
echo "=== SUMMARY ==="
echo "Issues found: $ISSUES"
[ $ISSUES -eq 0 ] && echo "Status: CLEAN" || echo "Status: FAIL"
exit $ISSUES
