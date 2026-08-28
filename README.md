# Empire Marine AI

Your intelligent marine assistant — weather, routes, fuel, maintenance and AI guidance for boaters.

© Aetos Systems

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v3 (do NOT upgrade to v4)
- React 18 (do NOT upgrade to 19)
- Supabase (Auth, PostgreSQL, Storage)
- Zustand + TanStack React Query
- Leaflet (maps) — no API key required
- Open-Meteo (weather + marine) — no API key required
- AI abstraction layer: Gemini + OpenAI
- PWA: manifest + service worker (installable, ready for WKWebView wrapping)

## Setup (GitHub web UI + Vercel flow)

1. **Create GitHub repo** and upload/paste all project files.
2. **Supabase**: create a new project → SQL Editor → run `supabase/schema.sql` once.
3. **Supabase Auth**: Authentication → URL Configuration → set Site URL to your Vercel URL. Email confirmations on/off as preferred.
4. **Vercel**: import the repo. Framework preset: Next.js. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (server-side only)
   - `OPENAI_API_KEY` (optional)
   - `AI_PROVIDER` = `gemini`
5. Deploy. The app is installable as a PWA from the browser (Add to Home Screen).

## Important constraints

- **Never commit API keys.** AI keys live only in Vercel env vars and are used in `/api` routes (server-side).
- Tailwind stays on v3.x. v4 breaks the layout system.
- React stays on 18.x to avoid dependency conflicts.

## Structure

```
src/
  app/            Screens (App Router)
  components/     UI components
  lib/            Supabase clients, i18n, services
  locales/        sv + en translations (all text uses keys)
  stores/         Zustand stores
  types/          Domain types
supabase/
  schema.sql      Full database schema + RLS + seed marinas
public/
  manifest.json   PWA manifest
  sw.js           Service worker
```

## Languages

Swedish (default) + English. Automatic browser detection, manual switcher, persisted in localStorage. All UI text uses translation keys — no hardcoded strings.
