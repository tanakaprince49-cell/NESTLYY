// Renders docs/legal/*.md to packages/web/public/legal/*.html so Vercel can
// serve them as static pages at /legal/privacy and /legal/terms (#305 Phase B).
//
// Source of truth is the markdown in docs/legal/. The generated HTML is
// gitignored — Vercel runs this via the prebuild npm script before vite build.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const docsDir = resolve(repoRoot, 'docs/legal');
const outDir = resolve(__dirname, '../public/legal');

marked.setOptions({ gfm: true, breaks: false, pedantic: false });

const PAGES = [
  { src: 'privacy-policy.md', out: 'privacy.html', title: 'Privacy Policy', slug: 'privacy' },
  { src: 'terms-of-service.md', out: 'terms.html', title: 'Terms of Service', slug: 'terms' },
];

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const template = ({ title, slug, contentHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow">
<meta name="description" content="${escapeHtml(title)} for Nestly Pregnancy Companion. Zero-data: your tracking data never leaves your device.">
<title>${escapeHtml(title)} | Nestly</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 17px;
  line-height: 1.65;
  color: #1f1f1f;
  background: #fff8f8;
}
main {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 22px 72px;
  background: #ffffff;
  border-left: 1px solid #fbe7e7;
  border-right: 1px solid #fbe7e7;
  min-height: 100vh;
}
nav.legal-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding: 0 0 18px;
  margin: 0 0 12px;
  border-bottom: 1px solid #fbe7e7;
  font-size: 14px;
}
nav.legal-nav a { color: #6b7280; text-decoration: none; }
nav.legal-nav a:hover { color: #9d174d; text-decoration: underline; }
nav.legal-nav a.current { color: #9d174d; font-weight: 600; }
nav.legal-nav .spacer { flex: 1 1 auto; }
h1, h2, h3, h4 { color: #9d174d; line-height: 1.3; }
h1 { font-size: 28px; margin: 8px 0 18px; }
h2 { font-size: 22px; margin: 32px 0 12px; }
h3 { font-size: 18px; margin: 24px 0 8px; }
h4 { font-size: 16px; margin: 20px 0 6px; }
p, li { margin: 0 0 12px; }
ul, ol { padding-left: 22px; }
a { color: #be185d; text-decoration: underline; }
a:hover { color: #9d174d; }
hr { border: none; border-top: 1px solid #fbe7e7; margin: 28px 0; }
strong { color: #4a0e2c; }
code {
  background: #fef2f2;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.92em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
blockquote {
  margin: 14px 0;
  padding: 8px 14px;
  border-left: 3px solid #f9a8d4;
  background: #fef2f2;
  color: #4a0e2c;
}
footer.legal-footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid #fbe7e7;
  font-size: 13px;
  color: #6b7280;
}
@media (prefers-color-scheme: dark) {
  body { background: #1c1717; color: #e8d5d5; }
  main { background: #2a2222; border-color: #3a2a2a; }
  h1, h2, h3, h4 { color: #f9a8d4; }
  a { color: #fbcfe8; }
  a:hover { color: #f9a8d4; }
  strong { color: #ffd6e6; }
  blockquote { background: #3a2a2a; color: #f5d5d5; border-left-color: #f9a8d4; }
  code { background: #3a2a2a; color: #f5d5d5; }
  hr, nav.legal-nav, footer.legal-footer { border-color: #3a2a2a; }
  nav.legal-nav a { color: #c4b5b5; }
  nav.legal-nav a.current { color: #f9a8d4; }
  footer.legal-footer { color: #b8a4a4; }
}
</style>
</head>
<body>
<main>
<nav class="legal-nav" aria-label="Legal pages">
<a href="/legal/privacy"${slug === 'privacy' ? ' class="current" aria-current="page"' : ''}>Privacy Policy</a>
<a href="/legal/terms"${slug === 'terms' ? ' class="current" aria-current="page"' : ''}>Terms of Service</a>
<span class="spacer"></span>
<a href="/">&larr; Back to Nestly</a>
</nav>
${contentHtml}
<footer class="legal-footer">
Nestly is a personal, on-device pregnancy and baby care companion. We do not collect, store, or transmit your tracking data. Questions? <a href="mailto:supportnestly@gmail.com">supportnestly@gmail.com</a>
</footer>
</main>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });

for (const page of PAGES) {
  const md = readFileSync(resolve(docsDir, page.src), 'utf-8');
  const contentHtml = marked.parse(md);
  const html = template({ title: page.title, slug: page.slug, contentHtml });
  writeFileSync(resolve(outDir, page.out), html, 'utf-8');
  process.stdout.write(`build-legal: ${page.src} -> public/legal/${page.out}\n`);
}
