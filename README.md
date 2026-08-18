# Ready

Ready is a context-aware daily preparation assistant. It connects calendar, tasks, weather, closet, sleep context, routines, and reflections to explain what is different today across **Do, Wear, Eat, and Bring**.

## Run locally

Requires Node.js 22.13 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Build and validate with `npm run lint`, `npm run test:engine`, and `npm run build`.

## Current features

- Seven-step responsive onboarding with local persistence
- Maya’s realistic Today journey and capacity-aware Ready Brief
- Completion, dismissal, provenance, and “Why?” reasoning
- Deterministic Outfit Journey using a 12-item demo closet
- Full Journey Map and essential-only Ready Check
- Dependency recalculation when Pilates is cancelled
- Evening reflection, pattern insight, tomorrow preparation and delta
- Desktop sidebar and purpose-built mobile bottom navigation

## Architecture

`lib/types.ts` defines product and provider contracts. `lib/providers.ts` selects a provider bundle, while `lib/weather/open-meteo.ts` adapts Open-Meteo into Ready's internal weather model. `lib/engine.ts` is the deterministic dependency engine. `lib/demo-data.ts` holds seeded context and closet items. `components/ready-app.tsx` contains the interactive prototype surfaces. Browser-local preferences and progress use `localStorage`.

Tasks, sleep, and closet integrations remain mocked. Weather defaults to deterministic demo data; set `NEXT_PUBLIC_READY_WEATHER_MODE=live` in `.env.local` to use Open-Meteo, or set it to `mock` explicitly. Calendar also defaults to mock mode. To use the optional read-only Google Calendar provider, enable the Google Calendar API, create an OAuth web application, authorize `http://localhost:3000/api/auth/google/callback`, and configure:

```bash
NEXT_PUBLIC_READY_CALENDAR_MODE=live
GOOGLE_CLIENT_ID=your-server-side-client-id
GOOGLE_CLIENT_SECRET=your-server-side-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

The Google integration requests only `https://www.googleapis.com/auth/calendar.events.readonly` and reads the primary calendar. OAuth exchange, token refresh, and Google API requests run in server routes. Raw Google events are normalized into `CalendarEvent` facts before Ready's vendor-neutral enrichment layer classifies them. Live authorization or API failures never silently fall back to demo events.

The local prototype stores its Google token session in an encrypted, authenticated, HttpOnly cookie. Tokens are unavailable to client JavaScript, but production should instead use encrypted server-side storage tied to an authenticated user, with key rotation and revocation controls. Both calendar and weather use the centralized New York demo timezone in `lib/ready-config.ts`.

See `docs/PRODUCT.md` and `docs/ARCHITECTURE.md` for more detail.
