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

Calendar, tasks, sleep, and closet integrations remain mocked. Weather defaults to deterministic demo data; set `NEXT_PUBLIC_READY_WEATHER_MODE=live` in `.env.local` to use Open-Meteo, or set it to `mock` explicitly. Both modes use the centralized New York demo location in `lib/ready-config.ts`. Open-Meteo does not require a credential, and its raw response and WMO codes are normalized by the adapter before they reach ReadyContext, the dependency engine, or UI. Unknown or missing values fail through Ready's existing loading error state rather than silently substituting demo weather. `NEXT_PUBLIC_DEMO_MODE=true` continues to document the wider prototype state. Future credentials go in `.env.local` as server-only values; the commented keys in `.env.example` are names only and contain no secrets. Real OAuth, live calendar/task APIs, uploads, and AI classification are intentionally deferred.

See `docs/PRODUCT.md` and `docs/ARCHITECTURE.md` for more detail.
