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

2. Start the dev server:
   ```bash
   npm run dev
   ```
   Runs Express + Vite on `http://localhost:3000`. No env vars are required; the app is Zero-Data and all state lives on device.

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
- **Backend:** Express 5 (dev only), Vercel serverless functions (production, currently only static health/unsubscribe)
- **Auth:** None. Local UUIDv4 identity generated on first launch and stored on the device.
- **Storage:** Browser localStorage on web, AsyncStorage on Android. No backend database. All user data is scoped by the local UUID.
- **Deployment:** Vercel

## Deployment

The app deploys to Vercel. The Express server (`server.ts`) is for local development only -- production API routes are Vercel serverless functions in the `api/` directory.

No Vercel environment variables are required (Zero-Data MVP).

## Architecture

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.
