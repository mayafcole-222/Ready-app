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

`lib/types.ts` defines product and provider contracts. `lib/providers.ts` contains replaceable mock providers. `lib/engine.ts` is the deterministic dependency engine. `lib/demo-data.ts` holds seeded context and closet items. `components/ready-app.tsx` contains the interactive prototype surfaces. Browser-local preferences and progress use `localStorage`.

All integrations are mocked. `NEXT_PUBLIC_DEMO_MODE=true` documents that state. Future credentials go in `.env.local` as server-only values; the commented keys in `.env.example` are names only and contain no secrets. Real OAuth, live APIs, uploads, and AI classification are intentionally deferred.

See `docs/PRODUCT.md` and `docs/ARCHITECTURE.md` for more detail.
