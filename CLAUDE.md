# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

NESTLYY is a pregnancy tracking, postpartum monitoring, and baby care app. Turborepo monorepo with web (PWA), mobile (Expo/React Native), and shared packages. Supports lifecycle stages: pre-pregnancy, pregnancy, birth, newborn, infant, toddler.

## Monorepo Structure

```
packages/
  shared/   # Types, Zustand stores, Firebase init, design tokens
  web/      # React 19 PWA (Vite + Tailwind + Lucide)
  mobile/   # Expo SDK 54 + React Native 0.81 (NativeWind + Ionicons)
api/        # Vercel serverless functions (production API)
```

## Commands

```bash
# Root (Turborepo)
npm install                        # Install all packages
npm run lint -w @nestly/shared     # Type-check shared
npm run lint -w @nestly/web        # Type-check web
npm run lint -w @nestly/mobile     # Type-check mobile
npm test -w @nestly/mobile         # Run mobile tests (Jest)

# Web only
npm run dev -w @nestly/web         # Dev server (Express + Vite, port 3000)
npm run build -w @nestly/web       # Production build
npm test -w @nestly/web            # Vitest unit tests

# Mobile only
cd packages/mobile && npx expo start  # Start Expo dev server

# QA
.claude/scripts/qa-check.sh           # Full QA suite (all checks)
.claude/scripts/qa-check.sh --quick   # Fast mode (skip build + deps)

# Versioning (semver)
npm run version:patch                 # 0.1.0 -> 0.1.1 (bug fixes only)
npm run version:minor                 # 0.1.0 -> 0.2.0 (new features)
npm run version:major                 # 0.1.0 -> 1.0.0 (breaking changes)
```

## Versioning policy

NESTLYY follows [Semantic Versioning](https://semver.org). The canonical product version lives in `packages/mobile/app.json` under `expo.version` and is mirrored to `expo.android.versionCode` (monotonically increasing integer for Play Store).

- **MAJOR**: breaking data model / storage schema / API changes requiring user action
- **MINOR**: new features, new screens, new trackers; backwards-compatible
- **PATCH**: bug fixes, copy tweaks, refactors with no user-visible change

Every PR that modifies production code under `packages/*/src/**` (excluding tests) **must** add an entry to `CHANGELOG.md` under `## [Unreleased]`. `.github/workflows/version-check.yml` enforces this on CI. Docs, test, and config-only PRs are exempt.

**Release workflow**:
1. `npm run version:patch|minor|major` — moves `## [Unreleased]` entries under a new versioned section, bumps `app.json`, increments `versionCode`
2. Commit as `chore: release vX.Y.Z`
3. Open release PR; after merge, tag `vX.Y.Z` on the merge commit
4. Trigger the next EAS build

## Environment Variables

Root `.env.example` documents all variables:
- `OPENROUTER_API_KEY` -- Food research AI (DeepSeek via OpenRouter)
- `RESEND_API_KEY` -- Email service
- `FIREBASE_SERVICE_ACCOUNT` -- Firebase Admin JSON
- `VITE_FIREBASE_VAPID_KEY` -- FCM push notifications
- `EXPO_PUBLIC_API_URL` -- Mobile API base URL (defaults to production)

## Tech Stack

**Shared**: TypeScript, Zustand v5 (state), Firebase Auth
**Web**: React 19, Vite, Tailwind v3, Motion, Recharts, Lucide React
**Mobile**: Expo SDK 54, React Native 0.81, NativeWind v4, React Navigation v7, Ionicons, expo-speech
**Backend**: Vercel serverless functions (api/). Express server.ts is dev-only, does NOT run on Vercel.
**Auth**: Firebase Auth (Google, Email/Password, Anonymous)
**Storage**: Web = localStorage via storageService (user-scoped). Mobile = AsyncStorage.
**Testing**: Vitest (web), Jest (mobile), Playwright (e2e)
**CI/CD**: GitHub Actions (ci.yml type check + build, cd.yml deploy), Vercel

## Architecture

### Package boundaries
- `shared` is platform-agnostic: no react-native/expo/web-specific deps
- `web` and `mobile` never import from each other
- All cross-package imports use `@nestly/shared` alias (never relative `../../`)

### State management
- All Zustand stores in `packages/shared/src/stores/` (profileStore, trackingStore, navigationStore, localIdentityStore)
- Local React state only for ephemeral UI values (input text, toggles)
- Web also uses storageService.ts for localStorage persistence (user-scoped by email)

### Navigation
- **Web**: Tab-based via `activeTab` state in App.tsx. No router library.
- **Mobile**: React Navigation v7 with bottom tabs (MainTabs.tsx) + nested native stack (ToolsStack.tsx). Types in navigation/types.ts.

### Types
All data models in `packages/shared/src/types.ts`. Component prop types stay inline.

### Serverless API (api/)
- `api/food-research.js` -- Nutrition research (public)

### Styling
- Web: Tailwind v3 + CSS custom properties. 12 themes with glassmorphism.
- Mobile: NativeWind v4 (Tailwind classes on React Native). Rose-50/rose-400 palette.

## Development Workflow

Every non-trivial task follows this process:

1. **Issue**: Describe what is needed. `issue-creator` agent files the GitHub issue with correct labels and template.
2. **Plan**: `architecture-reviewer`, `implementer`, and `product-qa` (if UX-relevant) agents produce an implementation plan, posted as a comment on the issue.
3. **Approve**: User reviews the plan.
4. **Implement**: Code is written per the approved plan.
5. **PR**: `pr-creator` agent runs `check-pr-ready.sh` (types, tests, secrets, conventions) then creates the PR.
6. **QA**: While CI runs, `qa-agent`, `architecture-reviewer`, `product-qa`, and `reviewer` agents produce a QA report posted on the PR. Quick fixes applied immediately; out-of-scope findings become follow-up issues.
7. **Merge**: After QA passes and user approves.

## Agent System

### Scripts (`.claude/scripts/`) -- deterministic checks
| Script | Purpose |
|--------|---------|
| qa-check.sh | Orchestrator: runs all check scripts (--quick skips build+deps) |
| check-types.sh | tsc --noEmit across shared/web/mobile |
| check-build.sh | Web production build |
| check-secrets.sh | Hardcoded secrets scan |
| check-imports.sh | Cross-package import violations |
| check-architecture.sh | Store location, nav consistency, API coverage, shared purity |
| check-storage.sh | Direct localStorage bypassing storageService |
| check-env.sh | Env var documentation coverage |
| check-console.sh | console.log/debug/info in production code |
| check-deps.sh | npm audit + unused dependency detection |
| check-pr-ready.sh | 9-point PR readiness check |
| check-issue-duplicates.sh | Duplicate issue detection via GitHub search |
| check-empty-states.sh | Screens with data lists but no empty state |
| check-error-messages.sh | Generic/unhelpful error messages |
| check-placeholders.sh | Inputs without descriptive placeholders |
| check-navigation-depth.sh | Features buried >2 taps deep |

### Agents (`.claude/agents/`) -- LLM reasoning over script output
| Agent | Purpose |
|-------|---------|
| qa-agent | Full QA: runs all check scripts, produces findings table |
| architecture-reviewer | Structural review: boundaries, state patterns, tech debt |
| product-qa | UX review from user personas (first-time pregnant user, experienced parent) |
| reviewer | PR code review: correctness, security, conventions |
| implementer | Executes approved plans, writes code |
| issue-creator | Creates issues with templates, labels, duplicate checking |
| pr-creator | Creates PRs with readiness checks and structured body |
| deploy-checker | Verifies Vercel deployment compatibility |
| storage-auditor | Audits localStorage patterns and user-scoping |

### Skills (invoke via `/skill-name`)
- `/plan-issue <N>` -- Analyze GitHub issue, produce implementation plan
- `/audit` -- Compare CLAUDE.md vs actual codebase
- `/qa` -- Full QA suite
- `/update-docs` -- Update CLAUDE.md to match codebase
