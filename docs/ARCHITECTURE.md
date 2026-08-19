# Architecture

Ready uses React 19, TypeScript, Tailwind CSS, the App Router programming model, and vinext’s Cloudflare-compatible Next.js runtime.

Provider interfaces return typed source context. Mock implementations feed the deterministic engine. The engine emits typed recommendations with priority, confidence, provenance, reasoning, and completion state. UI surfaces consume those models and never read integration-specific response formats.

Calendar providers return normalized `CalendarEvent` facts. Ready's vendor-neutral classifier enriches them into `ReadyEvent` semantics with explicit confidence and reasons. The dependency engine consumes `ReadyEvent[]` directly, while `buildJourneyStops()` creates a separate presentation projection for Today and Journey surfaces.

Live Google Calendar access crosses a same-origin server boundary: the client-facing calendar provider calls `/api/calendar/events`, which invokes the credentialed `GoogleCalendarProvider` server-side. OAuth callbacks, refresh tokens, and Google API responses never reach client components. The local prototype uses an encrypted HttpOnly cookie for its token session; production requires durable encrypted server-side token storage associated with an authenticated Ready user.

Onboarding choices and recommendation progress persist locally. No sensitive values exist in client code. Future OAuth callbacks and credential-backed provider calls must run server-side, with secrets in `.env.local` locally and hosted runtime secrets in deployment settings.

Individual mocks can be replaced without changing screens. A future inference provider can supplement deterministic rules while explanations and user overrides remain authoritative. Local state can move behind a repository interface when production persistence is introduced.

## Errands

Errands are Ready-owned flexible obligations, not calendar events and not Todoist-style recommendation inputs. A task such as “finish presentation slides” can inform the dependency engine; an errand such as “mail a package” reserves a flexible real-world block that Ready attempts to fit around fixed `ReadyEvent[]` commitments.

The deterministic Errand Scheduler builds open daytime windows, protects a ten-minute transition cushion around fixed timed events, applies optional earliest/deadline constraints, and places errands without overlap. Suggested slots are presentation data for Today and Journey and are never written to Google Calendar. Locations are display-only in V1.

Future travel-aware scheduling should narrow or score the scheduler's candidate windows through a vendor-neutral routing boundary using calendar locations, errand locations, business hours, and user travel settings. That extension must not expose provider-specific fields to the scheduler or UI.
