#!/usr/bin/env bash
# Gathers all context needed for reviewing a pull request.
# Usage: ./review-pr.sh <pr-number>
# Output: structured PR data for LLM review.

set -euo pipefail

PR_NUM="${1:?Usage: review-pr.sh <pr-number>}"
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "=== PR #$PR_NUM REVIEW CONTEXT ==="
echo ""

# --- PR metadata ---
echo "--- PR Details ---"
gh pr view "$PR_NUM" --json title,body,author,labels,state,baseRefName,headRefName,additions,deletions,changedFiles 2>/dev/null || echo "ERROR: Could not fetch PR #$PR_NUM"

echo ""

# --- PR diff ---
echo "--- Diff (first 300 lines) ---"
gh pr diff "$PR_NUM" 2>/dev/null | head -300 || echo "ERROR: Could not fetch diff"

echo ""

# --- Changed files ---
echo "--- Changed Files ---"
gh pr diff "$PR_NUM" --name-only 2>/dev/null || echo "ERROR: Could not list changed files"

echo ""

# --- PR checks ---
echo "--- CI Check Status ---"
gh pr checks "$PR_NUM" 2>/dev/null || echo "No checks found"

echo ""

# --- PR comments ---
echo "--- Review Comments ---"
gh api "repos/{owner}/{repo}/pulls/$PR_NUM/comments" --jq '.[] | "[\(.user.login)] \(.path):\(.line // .original_line) - \(.body | split("\n")[0])"' 2>/dev/null | head -20 || echo "No review comments"

echo ""

# --- Quick code quality scan on changed files ---
echo "--- Code Quality Scan (changed files) ---"
CHANGED=$(gh pr diff "$PR_NUM" --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
if [ -n "$CHANGED" ]; then
  for FILE in $CHANGED; do
    FULL="$REPO_ROOT/$FILE"
    [ -f "$FULL" ] || continue

    # Console statements
    CONSOLES=$(grep -n 'console\.\(log\|debug\|info\)' "$FULL" 2>/dev/null | head -3)
    [ -n "$CONSOLES" ] && echo "  $FILE - console statements:" && echo "$CONSOLES" | sed 's/^/    /'

    # TODO/FIXME/HACK
    TODOS=$(grep -n 'TODO\|FIXME\|HACK\|XXX' "$FULL" 2>/dev/null | head -3)
    [ -n "$TODOS" ] && echo "  $FILE - TODOs:" && echo "$TODOS" | sed 's/^/    /'

    # any type
    ANYS=$(grep -n ': any\b\|as any\b' "$FULL" 2>/dev/null | head -3)
    [ -n "$ANYS" ] && echo "  $FILE - 'any' types:" && echo "$ANYS" | sed 's/^/    /'
  done
else
  echo "  No TypeScript files changed"
fi

echo ""
echo "=== REVIEW CONTEXT COMPLETE ==="
