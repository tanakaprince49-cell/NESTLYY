#!/usr/bin/env bash
# Audits CLAUDE.md and documentation against actual codebase state.
# Usage: ./audit-docs.sh
# Output: discrepancies between docs and reality.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
CLAUDE_MD="$REPO_ROOT/CLAUDE.md"
EXIT_CODE=0

echo "=== DOCUMENTATION AUDIT ==="
echo "Date: $(date -I)"
echo ""

# --- 1. package.json scripts vs CLAUDE.md ---
echo "--- 1. NPM Scripts ---"
echo "Actual (package.json):"
node -e "const p=require('$REPO_ROOT/package.json'); Object.entries(p.scripts||{}).forEach(([k,v])=>console.log('  '+k+': '+v))"
echo "Documented (CLAUDE.md):"
if [ -f "$CLAUDE_MD" ]; then
  sed -n '/^```bash/,/^```/p' "$CLAUDE_MD" | grep -E '^\s*npm ' | sed 's/^/  /' || echo "  (no npm commands found in CLAUDE.md)"
else
  echo "  CLAUDE.md NOT FOUND"; EXIT_CODE=1
fi

echo ""

# --- 2. Environment variables ---
echo "--- 2. Environment Variables ---"
echo "In .env.example:"
if [ -f "$REPO_ROOT/.env.example" ]; then
  grep -E '^[A-Z_]+=' "$REPO_ROOT/.env.example" | cut -d= -f1 | sort | sed 's/^/  /'
else
  echo "  .env.example NOT FOUND"; EXIT_CODE=1
fi
echo "Referenced in code (VITE_ prefix):"
grep -roh --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=dist 'import\.meta\.env\.\(VITE_[A-Z_]*\)' "$REPO_ROOT" 2>/dev/null | sed 's/import.meta.env.//' | sort -u | sed 's/^/  /' || echo "  (none)"
echo "Referenced in code (process.env):"
grep -roh --include='*.ts' --include='*.js' --exclude-dir=node_modules --exclude-dir=dist 'process\.env\.\([A-Z_]*\)' "$REPO_ROOT" 2>/dev/null | sed 's/process.env.//' | sort -u | sed 's/^/  /' || echo "  (none)"
echo "Documented in CLAUDE.md:"
if [ -f "$CLAUDE_MD" ]; then
  grep -oE '`[A-Z_]{3,}`' "$CLAUDE_MD" | tr -d '`' | sort -u | sed 's/^/  /' || echo "  (none)"
fi

echo ""

# --- 3. Dependencies ---
echo "--- 3. Key Dependencies ---"
echo "Actual (package.json):"
node -e "
const p=require('$REPO_ROOT/package.json');
const deps={...p.dependencies,...p.devDependencies};
const key=['react','typescript','vite','tailwindcss','express','firebase','recharts','motion','jspdf','lucide-react'];
key.forEach(k=>{if(deps[k])console.log('  '+k+': '+deps[k])});
const unlisted=Object.keys(deps).filter(d=>!key.includes(d));
if(unlisted.length)console.log('  + '+unlisted.length+' more: '+unlisted.join(', '));
"

echo ""

# --- 4. Services ---
echo "--- 4. Services ---"
echo "Actual files:"
ls "$REPO_ROOT"/services/*.ts 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /'
echo "Documented in CLAUDE.md:"
if [ -f "$CLAUDE_MD" ]; then
  grep -oE '`[a-zA-Z]+Service\.ts`' "$CLAUDE_MD" | tr -d '`' | sort -u | sed 's/^/  /' || echo "  (none)"
fi

echo ""

# --- 5. Components count ---
echo "--- 5. Components ---"
COMP_COUNT=$(ls "$REPO_ROOT"/components/*.tsx 2>/dev/null | wc -l)
echo "  Actual component files: $COMP_COUNT"

echo ""

# --- 6. API routes ---
echo "--- 6. Serverless API Routes ---"
echo "Actual files:"
find "$REPO_ROOT/api" -name '*.js' -o -name '*.ts' 2>/dev/null | grep -v node_modules | sed "s|$REPO_ROOT/||" | sort | sed 's/^/  /' || echo "  (none)"

echo ""

# --- 7. CI/CD workflows ---
echo "--- 7. CI/CD Workflows ---"
echo "Actual files:"
ls "$REPO_ROOT"/.github/workflows/*.yml 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /' || echo "  (none)"

echo ""

# --- 8. Build configuration ---
echo "--- 8. Build Config ---"
echo "Tailwind:"
if [ -f "$REPO_ROOT/tailwind.config.js" ]; then
  echo "  tailwind.config.js exists"
  node -e "try{const v=require('$REPO_ROOT/node_modules/tailwindcss/package.json').version;console.log('  installed version: '+v)}catch{console.log('  not installed')}"
else
  echo "  tailwind.config.js NOT FOUND"
fi
echo "PostCSS:"
[ -f "$REPO_ROOT/postcss.config.js" ] && echo "  postcss.config.js exists" || echo "  postcss.config.js NOT FOUND"
echo "Vite:"
[ -f "$REPO_ROOT/vite.config.ts" ] && echo "  vite.config.ts exists" || echo "  vite.config.ts NOT FOUND"

echo ""

# --- 9. Dead imports check (quick scan) ---
echo "--- 9. Potentially Unused Imports (top 10) ---"
grep -rh --include='*.tsx' --include='*.ts' "^import " "$REPO_ROOT" 2>/dev/null \
  | grep -v node_modules \
  | grep -oE "from '[./][^']+'" \
  | sort | uniq -c | sort -rn | head -10 | sed 's/^/  /'

echo ""
echo "=== AUDIT COMPLETE ==="
exit $EXIT_CODE
