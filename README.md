<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nestly

Mobile-first Progressive Web App for pregnancy tracking, postpartum monitoring, and baby care. Supports multiple lifecycle stages: pre-pregnancy, pregnancy, birth, newborn, infant, and toddler.

Live at [nestlyhealth.com](https://nestlyhealth.com).

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Purpose |
   |----------|----------|---------|
   | `OPENROUTER_API_KEY` | Yes | Food research AI (DeepSeek via OpenRouter) |
   | `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase Admin -- auth verification, push notifications |
   | `VITE_FIREBASE_VAPID_KEY` | Yes | Firebase Cloud Messaging (push notifications) |
   | `RESEND_API_KEY` | No | Email service |
   | `ADMIN_UIDS` | No | Comma-separated Firebase UIDs for backend admin access |
   | `VITE_ADMIN_EMAILS` | No | Comma-separated emails for frontend admin check |
   | `APP_URL` | No | Base URL for links in emails |

3. Start the dev server:
   ```bash
   npm run dev
   ```
   Runs Express + Vite on `http://localhost:3000`.

## Commands

```bash
npm run dev        # Dev server (Express + Vite, port 3000)
npm run build      # Production build via Vite
npm run preview    # Preview production build
npm run lint       # Type-check with tsc --noEmit
npm test           # Run tests with Vitest
```

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v3, Motion, Recharts, Lucide React
- **Backend:** Express 5 (dev only), Vercel serverless functions (production)
- **Auth:** Firebase Auth (Google, Email/Password, Anonymous, Phone)
- **AI:** OpenRouter SDK with DeepSeek model
- **Storage:** Browser localStorage (no backend database)
- **Deployment:** Vercel

## Deployment

The app deploys to Vercel. The Express server (`server.ts`) is for local development only -- production API routes are Vercel serverless functions in the `api/` directory.

Required Vercel environment variables: `OPENROUTER_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_VAPID_KEY`.

## Architecture

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.
