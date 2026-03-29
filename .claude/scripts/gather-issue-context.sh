#!/usr/bin/env bash
# Gathers all context needed for planning an issue resolution.
# Usage: ./gather-issue-context.sh <issue-number>
# Output: structured sections that a skill can feed to the LLM.

set -euo pipefail

ISSUE_NUM="${1:?Usage: gather-issue-context.sh <issue-number>}"
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "=== ISSUE DETAILS ==="
gh issue view "$ISSUE_NUM" --json title,body,labels,comments,assignees,state 2>/dev/null || echo "ERROR: Could not fetch issue #$ISSUE_NUM"

echo ""
echo "=== LINKED PULL REQUESTS ==="
gh pr list --search "issue:$ISSUE_NUM" --json number,title,state,url 2>/dev/null || echo "No linked PRs found"

echo ""
echo "=== ISSUE KEYWORDS -> RELEVANT FILES ==="
# Extract keywords from issue title (words > 3 chars, skip common words)
TITLE=$(gh issue view "$ISSUE_NUM" --json title -q '.title' 2>/dev/null || echo "")
if [ -n "$TITLE" ]; then
  KEYWORDS=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | grep -oE '[a-z]{4,}' | grep -vE '^(this|that|with|from|have|been|will|should|could|would|they|them|their|there|here|when|then|what|about|into|more|some|also|make|just|like|only|over|such|after|before|between|each|other|which|does|were|being|those|these|very|most|both|than|same)$' | sort -u | head -10)
  for KW in $KEYWORDS; do
    MATCHES=$(grep -rl --include='*.ts' --include='*.tsx' -i "$KW" "$REPO_ROOT" 2>/dev/null | grep -v node_modules | grep -v dist | head -5)
    if [ -n "$MATCHES" ]; then
      echo "  keyword '$KW' -> $MATCHES"
    fi
  done
else
  echo "  Could not extract keywords from issue title."
fi

echo ""
echo "=== RECENT GIT HISTORY (last 20 commits) ==="
git -C "$REPO_ROOT" log --oneline -20

echo ""
echo "=== OPEN ISSUES (for cross-reference) ==="
gh issue list --state open --json number,title,labels --limit 20 2>/dev/null || echo "Could not list issues"

echo ""
echo "=== PROJECT STRUCTURE ==="
echo "--- Components ---"
ls "$REPO_ROOT"/components/*.tsx 2>/dev/null | sed "s|$REPO_ROOT/||" | head -40
echo "--- Services ---"
ls "$REPO_ROOT"/services/*.ts 2>/dev/null | sed "s|$REPO_ROOT/||"
echo "--- API routes ---"
ls "$REPO_ROOT"/api/**/*.js 2>/dev/null | sed "s|$REPO_ROOT/||" 2>/dev/null || echo "  (none)"
echo "--- Types ---"
grep -c 'export ' "$REPO_ROOT/types.ts" 2>/dev/null && echo " exported symbols in types.ts" || echo "  types.ts not found"
