#!/usr/bin/env bash
# Orchestrator: runs all deterministic QA check scripts.
# Usage: ./qa-check.sh [--quick]
#   --quick  skips build check (faster, for pre-commit)
# Exit 0 = all clean, Exit 1 = issues found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS="$REPO_ROOT/.claude/scripts"
cd "$REPO_ROOT"

QUICK=false
[ "${1:-}" = "--quick" ] && QUICK=true

ERRORS=0
WARNINGS=0

echo "========================================="
echo "  NESTLYY QA CHECK"
echo "  Date: $(date -I)"
echo "  Mode: $( $QUICK && echo 'quick' || echo 'full' )"
echo "========================================="
echo ""

run_check() {
  local script="$1"
  local name="$2"
  local severity="$3"  # error or warning

  if [ ! -x "$script" ]; then
    echo "  SKIP: $name (script not found)"
    return
  fi

  OUTPUT=$("$script" 2>&1)
  EXIT=$?
  echo "$OUTPUT"

  if [ $EXIT -ne 0 ]; then
    if [ "$severity" = "error" ]; then
      ERRORS=$((ERRORS+1))
    else
      WARNINGS=$((WARNINGS+1))
    fi
  fi
}

# --- Core checks (always run) ---
run_check "$SCRIPTS/check-types.sh"    "Type Check"      error
run_check "$SCRIPTS/check-secrets.sh"  "Secrets Scan"    error
run_check "$SCRIPTS/check-imports.sh"  "Import Check"    error
run_check "$SCRIPTS/check-storage.sh"  "Storage Check"   warning
run_check "$SCRIPTS/check-env.sh"      "Env Vars"        warning
run_check "$SCRIPTS/check-console.sh"  "Console Stmts"   warning

# --- Slow checks (skipped in quick mode) ---
if ! $QUICK; then
  run_check "$SCRIPTS/check-build.sh"  "Build Check"     error
  run_check "$SCRIPTS/check-deps.sh"   "Dependencies"    warning
fi

# --- Summary ---
echo "========================================="
echo "  SUMMARY"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo "  Status:   $( [ $ERRORS -eq 0 ] && echo 'PASS' || echo 'FAIL' )"
echo "========================================="

[ $ERRORS -eq 0 ] && exit 0 || exit 1
