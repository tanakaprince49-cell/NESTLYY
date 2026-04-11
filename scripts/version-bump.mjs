#!/usr/bin/env node
// Version bump script for NESTLYY.
// Usage: node scripts/version-bump.mjs patch|minor|major
//
// What it does:
// 1. Reads current expo.version from packages/mobile/app.json
// 2. Bumps it by the requested semver component
// 3. Increments expo.android.versionCode by 1
// 4. Moves CHANGELOG.md `## [Unreleased]` entries under a new
//    `## [X.Y.Z] - YYYY-MM-DD` section
// 5. Writes everything back
// 6. Exits non-zero if there is nothing in Unreleased to release
//
// It does NOT commit, tag, or push. The committer does that manually so the
// release commit stays reviewable.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const APP_JSON = resolve(repoRoot, 'packages/mobile/app.json');
const CHANGELOG = resolve(repoRoot, 'CHANGELOG.md');

const kind = process.argv[2];
if (!['patch', 'minor', 'major'].includes(kind)) {
  console.error('Usage: node scripts/version-bump.mjs patch|minor|major');
  process.exit(2);
}

// ---------- 1. Read current version from app.json ----------
const appJson = JSON.parse(readFileSync(APP_JSON, 'utf8'));
const current = appJson.expo.version;
if (!/^\d+\.\d+\.\d+$/.test(current)) {
  console.error(`app.json expo.version "${current}" is not a valid MAJOR.MINOR.PATCH`);
  process.exit(3);
}

const [maj, min, pat] = current.split('.').map(Number);
let next;
if (kind === 'major') next = `${maj + 1}.0.0`;
else if (kind === 'minor') next = `${maj}.${min + 1}.0`;
else next = `${maj}.${min}.${pat + 1}`;

// ---------- 2. Verify CHANGELOG has something in Unreleased ----------
const changelog = readFileSync(CHANGELOG, 'utf8');
const unreleasedRe = /## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|\n\[Unreleased\]: )/;
const match = changelog.match(unreleasedRe);
if (!match) {
  console.error('CHANGELOG.md has no "## [Unreleased]" section');
  process.exit(4);
}
const unreleasedBody = match[1].trim();
if (unreleasedBody.length === 0) {
  console.error(
    'CHANGELOG.md "## [Unreleased]" section is empty. Nothing to release.\n' +
    'Add entries under ### Added / ### Fixed / ### Changed / ### Removed before bumping.',
  );
  process.exit(5);
}

// ---------- 3. Bump app.json ----------
appJson.expo.version = next;
const prevCode = appJson.expo.android?.versionCode;
if (typeof prevCode !== 'number') {
  console.error('app.json expo.android.versionCode is missing or not a number');
  process.exit(6);
}
appJson.expo.android.versionCode = prevCode + 1;

writeFileSync(APP_JSON, JSON.stringify(appJson, null, 2) + '\n');

// ---------- 4. Rewrite CHANGELOG ----------
const today = new Date().toISOString().slice(0, 10);

// Insert the new version section right after the old [Unreleased] block, and
// leave an empty [Unreleased] in place for the next cycle.
const newSection = `## [Unreleased]\n\n## [${next}] - ${today}\n\n${unreleasedBody}\n`;
const rewrittenBody = changelog.replace(unreleasedRe, newSection);

// Also add the compare/release link footnotes so the section links resolve.
// Strategy: drop any existing [Unreleased]: line, rebuild it pointing at the
// new version, and prepend a new [X.Y.Z]: line. Leave older links alone.
const unreleasedLinkRe = /^\[Unreleased\]: .*$/m;
const repoBase = 'https://github.com/tanakaprince49-cell/NESTLYY';
const newUnreleasedLink = `[Unreleased]: ${repoBase}/compare/v${next}...HEAD`;
const newVersionLink = `[${next}]: ${repoBase}/releases/tag/v${next}`;

let rewritten;
if (unreleasedLinkRe.test(rewrittenBody)) {
  rewritten = rewrittenBody.replace(unreleasedLinkRe, `${newUnreleasedLink}\n${newVersionLink}`);
} else {
  rewritten = rewrittenBody.trimEnd() + `\n\n${newUnreleasedLink}\n${newVersionLink}\n`;
}

writeFileSync(CHANGELOG, rewritten);

// ---------- 5. Report ----------
console.log(`Bumped version: ${current} -> ${next}`);
console.log(`Bumped versionCode: ${prevCode} -> ${prevCode + 1}`);
console.log(`Updated CHANGELOG.md with [${next}] - ${today}`);
console.log('');
console.log('Next steps:');
console.log('  1. Review the diff: git diff');
console.log(`  2. Commit: git commit -am "chore: release v${next}"`);
console.log('  3. Open a release PR and merge after CI passes');
console.log(`  4. After merge, tag main with v${next}`);
