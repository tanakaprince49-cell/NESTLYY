#!/usr/bin/env bash
# Check that no feature is buried more than 2 taps deep from a main tab.
# Counts navigation stack depth per screen.
# Exit 0 = clean, Exit 1 = deep features found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== NAVIGATION DEPTH CHECK ==="

# Depth 0: Main tabs (Dashboard, Baby, Ava, Education, Tools, Settings)
# Depth 1: ToolsHub (one tap from Tools tab)
# Depth 2: Individual trackers (one tap from ToolsHub)
# Anything deeper = too buried

# Check for nested stack navigators beyond ToolsStack
NESTED_STACKS=$(grep -rl --include='*.tsx' \
  'createNativeStackNavigator\|createStackNavigator' \
  packages/mobile/src/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v ToolsStack \
  | grep -v __tests__)

# MainTabs is fine (it's the root), but any other stacks indicate depth > 2
for STACK in $NESTED_STACKS; do
  SHORT="${STACK#$REPO_ROOT/}"
  # Skip if it's the main tab navigator
  if echo "$SHORT" | grep -q 'MainTabs'; then
    continue
  fi
  echo "  WARN: Additional navigation stack found: $SHORT"
  echo "    Features inside may be >2 taps deep"
  FAIL=1
done

# Check for navigation.navigate calls that go through intermediate screens
DEEP_NAV=$(grep -rn --include='*.tsx' \
  'navigation\.push\|navigation\.navigate.*{.*screen.*{.*screen' \
  packages/mobile/src/ 2>/dev/null \
  | grep -v node_modules \
  | grep -v __tests__)

if [ -n "$DEEP_NAV" ]; then
  echo "  WARN: Deep navigation patterns found (nested screen params):"
  echo "$DEEP_NAV" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  echo "  PASS: All features within 2 taps"
fi
echo ""
exit $FAIL
