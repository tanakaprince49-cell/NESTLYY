#!/usr/bin/env bash
# Check for generic/unhelpful error messages in the codebase.
# Good: "Enter valid systolic and diastolic values"
# Bad:  "Error", "Something went wrong", "An error occurred"
# Exit 0 = clean, Exit 1 = issues found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== ERROR MESSAGE QUALITY ==="

# Patterns for generic error messages
GENERIC_PATTERNS=(
  '"Error"'
  '"Something went wrong"'
  '"An error occurred"'
  '"Unknown error"'
  '"Failed"'
  '"Invalid input"'
  '"Please try again"'
)

for PATTERN in "${GENERIC_PATTERNS[@]}"; do
  HITS=$(grep -rn --include='*.ts' --include='*.tsx' \
    "$PATTERN" \
    packages/ 2>/dev/null \
    | grep -v node_modules \
    | grep -v dist \
    | grep -v '__tests__')
  if [ -n "$HITS" ]; then
    echo "  WARN: Generic error message $PATTERN:"
    echo "$HITS" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
    FAIL=1
  fi
done

# Check for setError('') or setError("") with no message context
EMPTY_ERRORS=$(grep -rn --include='*.ts' --include='*.tsx' \
  "setError(['\"]['\"])" \
  packages/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v dist)
# Note: setError('') is valid for clearing errors, skip those

if [ $FAIL -eq 0 ]; then
  echo "  PASS: No generic error messages found"
fi
echo ""
exit $FAIL
