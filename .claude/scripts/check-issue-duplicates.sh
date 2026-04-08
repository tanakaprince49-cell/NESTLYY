#!/usr/bin/env bash
# Check for potential duplicate issues before creating a new one.
# Usage: ./check-issue-duplicates.sh "issue title or keywords"
# Exit 0 = no duplicates, Exit 1 = potential duplicates found.
set -uo pipefail

QUERY="${1:?Usage: check-issue-duplicates.sh \"issue title or keywords\"}"

echo "=== DUPLICATE CHECK ==="
echo "  Query: $QUERY"
echo ""

# Search open issues
echo "--- Open Issues (matching) ---"
OPEN=$(gh issue list --state open --search "$QUERY" --limit 10 --json number,title,labels,state 2>/dev/null)
OPEN_COUNT=$(echo "$OPEN" | jq 'length' 2>/dev/null || echo "0")
OPEN_COUNT="${OPEN_COUNT:-0}"

if [ "$OPEN_COUNT" -gt 0 ] 2>/dev/null; then
  echo "  Found $OPEN_COUNT potentially related open issue(s):"
  echo "$OPEN" | jq -r '.[] | "    #\(.number) \(.title)"' 2>/dev/null
  echo ""
  echo "  Review these before creating a new issue."
  exit 1
else
  echo "  No matching open issues found."
fi

# Search recently closed issues (last 30 days)
echo ""
echo "--- Recently Closed Issues (matching) ---"
CLOSED=$(gh issue list --state closed --search "$QUERY" --limit 5 --json number,title,state 2>/dev/null)
CLOSED_COUNT=$(echo "$CLOSED" | jq 'length' 2>/dev/null || echo "0")
CLOSED_COUNT="${CLOSED_COUNT:-0}"

if [ "$CLOSED_COUNT" -gt 0 ] 2>/dev/null; then
  echo "  Found $CLOSED_COUNT recently closed issue(s):"
  echo "$CLOSED" | jq -r '.[] | "    #\(.number) [CLOSED] \(.title)"' 2>/dev/null
  echo "  Consider if re-opening is more appropriate than creating new."
fi

echo ""
exit 0
