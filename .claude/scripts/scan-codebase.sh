#!/usr/bin/env bash
# Extracts current codebase state for documentation generation.
# Usage: ./scan-codebase.sh
# Output: structured snapshot of project state.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "=== CODEBASE SNAPSHOT ==="
echo "Date: $(date -I)"
echo ""

# --- Package info ---
echo "--- Package ---"
node -e "const p=require('$REPO_ROOT/package.json'); console.log('  name: '+(p.name||'(unnamed)')); console.log('  version: '+(p.version||'(none)'))"

echo ""

# --- NPM Scripts ---
echo "--- NPM Scripts ---"
node -e "const p=require('$REPO_ROOT/package.json'); Object.entries(p.scripts||{}).forEach(([k,v])=>console.log('  '+k+': '+v))"

echo ""

# --- Dependencies ---
echo "--- Dependencies ---"
node -e "
const p=require('$REPO_ROOT/package.json');
console.log('Production:');
Object.entries(p.dependencies||{}).sort().forEach(([k,v])=>console.log('  '+k+': '+v));
console.log('Dev:');
Object.entries(p.devDependencies||{}).sort().forEach(([k,v])=>console.log('  '+k+': '+v));
"

echo ""

# --- Environment variables ---
echo "--- Environment Variables ---"
echo "Defined in .env.example:"
if [ -f "$REPO_ROOT/.env.example" ]; then
  cat "$REPO_ROOT/.env.example" | sed 's/^/  /'
else
  echo "  (no .env.example)"
fi
echo ""
echo "Used in code:"
echo "  Frontend (VITE_):"
grep -roh --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=dist 'import\.meta\.env\.\(VITE_[A-Z_]*\)' "$REPO_ROOT" 2>/dev/null | sed 's/import.meta.env.//' | sort -u | sed 's/^/    /' || echo "    (none)"
echo "  Backend (process.env):"
grep -roh --include='*.ts' --include='*.js' --exclude-dir=node_modules --exclude-dir=dist 'process\.env\.\([A-Z_]*\)' "$REPO_ROOT" 2>/dev/null | sed 's/process.env.//' | sort -u | sed 's/^/    /' || echo "    (none)"

echo ""

# --- File structure ---
echo "--- File Structure ---"
echo "Components ($(ls "$REPO_ROOT"/components/*.tsx 2>/dev/null | wc -l) files):"
ls "$REPO_ROOT"/components/*.tsx 2>/dev/null | xargs -I{} basename {} .tsx | sort | sed 's/^/  /'
echo ""
echo "Services ($(ls "$REPO_ROOT"/services/*.ts 2>/dev/null | wc -l) files):"
ls "$REPO_ROOT"/services/*.ts 2>/dev/null | xargs -I{} basename {} .ts | sort | sed 's/^/  /'
echo ""
echo "API routes:"
find "$REPO_ROOT/api" -name '*.js' -o -name '*.ts' 2>/dev/null | grep -v node_modules | sed "s|$REPO_ROOT/||" | sort | sed 's/^/  /' || echo "  (none)"
echo ""
echo "CI/CD workflows:"
ls "$REPO_ROOT"/.github/workflows/*.yml 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /' || echo "  (none)"

echo ""

# --- Types ---
echo "--- Exported Types (types.ts) ---"
if [ -f "$REPO_ROOT/types.ts" ]; then
  grep -E '^export (interface|type|enum|const)' "$REPO_ROOT/types.ts" | sed 's/^/  /' | head -40
else
  echo "  types.ts not found"
fi

echo ""

# --- Config files ---
echo "--- Config Files ---"
for F in tsconfig.json vite.config.ts tailwind.config.js postcss.config.js vercel.json .eslintrc.json .prettierrc; do
  [ -f "$REPO_ROOT/$F" ] && echo "  $F EXISTS" || echo "  $F MISSING"
done

echo ""
echo "=== SNAPSHOT COMPLETE ==="
