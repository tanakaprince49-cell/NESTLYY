# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nestly is a mobile-first Progressive Web App (PWA) for pregnancy tracking, postpartum monitoring, and baby care. It supports multiple lifecycle stages: pre-pregnancy, pregnancy, birth, newborn, infant, and toddler.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Express + Vite on port 3000)
npm run build        # Production build via Vite
npm run preview      # Preview production build locally
npm run lint         # Type-check with tsc --noEmit (no eslint)
npm start            # Production server (node server.ts)
npm test             # Run vitest unit tests (tests/)
npm run test:watch   # Run vitest in watch mode
```

## Environment Variables

Copy `.env.example` to `.env.local`. Key variables:
- `GEMINI_API_KEY` - Google Gemini API key (exposed to client via Vite `define`)
- `OPENROUTER_API_KEY` - AI chat (DeepSeek via OpenRouter)
- `RESEND_API_KEY` - Email service
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin JSON credentials
- `VITE_FIREBASE_VAPID_KEY` - Firebase Cloud Messaging
- `ADMIN_UIDS` - Comma-separated Firebase UIDs for backend admin access
- `VITE_ADMIN_EMAILS` - Comma-separated emails for frontend admin check

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS v3 (build-time via PostCSS), Motion (animations), Recharts (charts), Lucide React (icons)
- **Backend**: Express 5 with `tsx` runtime, node-cron for scheduled tasks
- **Auth**: Firebase Auth (Google, Email/Password, Anonymous, Phone); `firebase-admin` used in serverless functions to verify ID tokens
- **AI**: OpenRouter SDK with DeepSeek model for Ava chatbot; Google Gemini API
- **PDF**: jsPDF + html2pdf.js for report generation
- **Storage**: Browser LocalStorage only (no backend database)
- **Testing**: Vitest for unit tests (`tests/`), Playwright for e2e specs (`tests/e2e/`)
- **Deployment**: Vercel (SPA rewrite in vercel.json)

## Architecture

**No router library** — navigation is tab-based via `activeTab` state in `App.tsx`. Tabs: `dashboard`, `baby`, `tools`, `education`, `ava`, `admin`, `settings`. Deep linking uses URL query params (`?tab=ava`).

**State management** is all in `App.tsx` using React hooks. State is passed down via props (no Redux/Zustand). All user data is persisted to LocalStorage via `services/storageService.ts`, scoped by the user's email address (or `anon-{uid}` for guests).

**Data flow**: Firebase Auth provides identity → `storageService` loads/saves data keyed by email → `App.tsx` holds all state → components receive data and callbacks as props.

**Key services** (`services/`):
- `storageService.ts` — LocalStorage abstraction, user-scoped data access
- `geminiService.ts` — AI chat via OpenRouter/DeepSeek (not actually Gemini despite the name)
- `pushService.ts` — Firebase Cloud Messaging setup and local notifications
- `reportService.ts` — PDF report generation
- `achievementService.ts` — Badge/achievement system
- `babyGrowth.ts` — Growth percentile calculations
- `syncService.ts` — Data sync utilities

**Serverless API** (`api/`): Vercel serverless functions for production endpoints:
- `api/ava.js` — Ava AI chat endpoint (requires Firebase ID token)
- `api/symptom-decode.js` — Symptom decoder AI endpoint (requires Firebase ID token)
- `api/custom-plan.js` — Personalized meal plan AI endpoint (requires Firebase ID token)
- `api/food-research.js` — Food nutrition research (public, no auth)
- `api/push/token.js` — Push notification token storage
- `api/admin/broadcast.js` — Admin push broadcasts

**Server** (`server.ts`): Express app that serves Vite in dev mode. Does NOT run on Vercel — all production API routes use serverless functions in `api/`.

**Types** (`types.ts`): All data models are defined here — `PregnancyProfile`, `LifecycleStage` enum, and numerous log types (FeedingLog, SleepLog, DiaperLog, etc.).

**Styling**: Tailwind v3 utilities (built via PostCSS, entry point `app.css`) + CSS custom properties for theming. 12 color themes with glassmorphism effects. Theme switches dynamically based on lifecycle stage.

**Path alias**: `@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`).

**CI/CD** (`.github/workflows/`):
- `ci.yml` — Type check + build on PRs
- `cd.yml` — Deploy pipeline

## Agent System

Deterministic shell scripts in `.claude/scripts/` handle data gathering and checks. Skills in `.claude/skills/` combine script output with LLM reasoning. Subagents in `.claude/agents/` handle focused tasks.

**Skills** (invoke via `/skill-name`):
- `/plan-issue <N>` — Analyze GitHub issue, produce implementation plan
- `/audit` — Compare CLAUDE.md vs actual codebase
- `/qa` — Full QA suite (types, build, security, deps)
- `/update-docs` — Update CLAUDE.md to match codebase

**Agents** (Claude delegates automatically):
- `implementer` — Executes a plan, writes code
- `reviewer` — Reviews PRs against project conventions
- `storage-auditor` — Audits localStorage patterns and scoping
- `deploy-checker` — Verifies Vercel deployment compatibility
