# Ready submission demo

Ready's public submission build runs in a deterministic, credential-free demo mode. It uses the active New York calendar date while pinning Ready's internal morning clock to 8:15 AM, so the same upcoming events, recommendations, errand window, and social context appear whenever the demo is opened.

## Reset to the recording baseline

Use either reset path:

- Open Settings from the Today page and select **Reset demo**.
- Open `/?demo=1&reset=1`. Ready consumes the reset parameter, restores the baseline, removes `reset=1` from the address, and lands on Today.

The reset removes only Ready-owned browser keys. It does not clear unrelated browser storage, Google Calendar data, or provider credentials. The baseline starts onboarded with untouched recommendations, one open **Mail package** errand, Jessica's relationship context, and no simulated cancellation.

## Three-minute walkthrough

1. Reset, then show the morning rationale, first stop, and Ready Brief on Today.
2. Show the busy journey: Design Studio, Lunch with Jessica, Portfolio Review, Pilates, Walk the Dog, and Wind Down.
3. Open People Prep for Jessica and show the job, TV finale, and portfolio-review context.
4. Show where Ready placed **Mail package** around fixed commitments.
5. Use the development-only Pilates cancellation control locally if demonstrating dynamic recomputation. Reset before recording another take.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000/?demo=1&reset=1` for a clean run. No OAuth consent, Google credentials, Mapbox token, or weather key is required in demo mode.

## Live integration development

To exercise real provider paths locally, set:

```bash
NEXT_PUBLIC_READY_RUNTIME_MODE=live
NEXT_PUBLIC_READY_CALENDAR_MODE=live
NEXT_PUBLIC_READY_WEATHER_MODE=live
```

Then supply the existing server-only Google OAuth and optional Mapbox variables described in `README.md`. Restart the development process after changing environment variables.

## Validate before deployment

```bash
npm run lint
npm run test:engine
npm run build
git diff --check
```

## Recovery

- If the demo shows stale progress, use Settings → **Reset demo** or reopen `/?demo=1&reset=1`.
- If a public deployment is unavailable, record locally from `http://localhost:3000/?demo=1&reset=1` with demo mode enabled.
- If live integrations fail, switch back to `NEXT_PUBLIC_READY_RUNTIME_MODE=demo`; demo mode does not depend on them.
