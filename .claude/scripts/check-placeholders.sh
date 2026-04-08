#!/usr/bin/env bash
# Check that all TextInput/input elements have descriptive placeholders.
# Exit 0 = clean, Exit 1 = issues found.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
echo "=== PLACEHOLDER CHECK ==="

# Mobile: find TextInput without placeholder prop (check within 5-line window)
MOBILE_NO_PH=""
while IFS=: read -r FILE LINE _; do
  # Check if 'placeholder' appears within 5 lines after <TextInput
  WINDOW=$(sed -n "${LINE},$((LINE+5))p" "$FILE" 2>/dev/null)
  if ! echo "$WINDOW" | grep -q 'placeholder'; then
    MOBILE_NO_PH="${MOBILE_NO_PH}${FILE}:${LINE}\n"
  fi
done < <(grep -rn --include='*.tsx' '<TextInput' packages/mobile/src/ 2>/dev/null | grep -v node_modules)

if [ -n "$MOBILE_NO_PH" ]; then
  COUNT=$(echo -e "$MOBILE_NO_PH" | grep -c '.')
  echo "  WARN: $COUNT TextInput(s) without placeholder in mobile:"
  echo -e "$MOBILE_NO_PH" | grep '.' | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# Web: find input without placeholder (check within 5-line window)
WEB_NO_PH=""
while IFS=: read -r FILE LINE _; do
  WINDOW=$(sed -n "${LINE},$((LINE+5))p" "$FILE" 2>/dev/null)
  if ! echo "$WINDOW" | grep -q 'placeholder'; then
    # Skip non-text inputs
    if echo "$WINDOW" | grep -qE 'type="(hidden|file|checkbox|radio|date|number)"'; then
      continue
    fi
    WEB_NO_PH="${WEB_NO_PH}${FILE}:${LINE}\n"
  fi
done < <(grep -rn --include='*.tsx' '<input' packages/web/src/ 2>/dev/null | grep -v node_modules)

if [ -n "$WEB_NO_PH" ]; then
  COUNT=$(echo -e "$WEB_NO_PH" | grep -c '.')
  echo "  WARN: $COUNT input(s) without placeholder in web:"
  echo -e "$WEB_NO_PH" | grep '.' | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

# Check for non-descriptive placeholders (just "..." or "Type here")
BAD_PH=$(grep -rn --include='*.tsx' \
  -E 'placeholder="(\.\.\.|Type here|Enter|Input)' \
  packages/ 2>/dev/null \
  | grep -v node_modules)

if [ -n "$BAD_PH" ]; then
  COUNT=$(echo "$BAD_PH" | wc -l)
  echo "  WARN: $COUNT non-descriptive placeholder(s):"
  echo "$BAD_PH" | sed "s|$REPO_ROOT/||" | sed 's/^/    /'
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  echo "  PASS: All inputs have descriptive placeholders"
fi
echo ""
exit $FAIL
