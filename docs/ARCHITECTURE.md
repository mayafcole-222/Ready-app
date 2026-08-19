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

## Social context

Social Context Prep is Ready-owned relationship memory. `Person` separately stores interests belonging to that person and bond topics the user says they share; `SocialContextItem` stores only the short notes, conversation summaries, message snippets, or email summaries the user elects to save. V1.5 persists these models locally through the same hydration-safe storage boundary as other prototype preferences.

Calendar matching and prep generation are vendor-neutral and deterministic. One `buildPeoplePrepForDay()` call combines the day's events, people, context, dismissals, and topic enrichment. Today and Journey consume those same `PeoplePrepResult[]` objects. Ready matches normalized whole names against event titles or explicit attendees, then creates at most four grounded `SocialPrepBullet` items. Every bullet retains typed sources and plain-language labels. Unknown people produce no prep, sparse context stays sparse, and event-scoped dismissals never alter the source memory.

`SocialContextProvider` defines the future relationship-memory boundary. A production repository could combine user-authored memory with separately authorized contact, messaging, or email adapters, but provider-specific fields and credentials must remain server-side. Any future AI summarizer must return source references, preserve user corrections, avoid unsupported inference, and keep the UI dependent only on Ready's normalized social models.

`InterestEnrichmentProvider` is a separate boundary for non-personal topic context. V1.5 uses only a tiny `CuratedFactProvider`-style fixture for maintained demo facts. It never labels those facts as current news. The V2 flow is `Person interest → InterestEnrichmentProvider → CuratedFactProvider | WebInterestEnrichmentProvider → sourced facts or updates → Social Prep Engine`. A future web provider must supply a source, URL, and publication date before an item can appear as a recent update; provider-specific responses must not enter UI or relationship memory.

## Journey changes

`ReadyDaySnapshot` is a small, derived comparison model rather than persisted application state. It records only event identity, visible recommendations, errand placement/status, explicitly modeled outfit transitions, and People Prep availability. `buildReadyChanges()` compares two snapshots into typed changes and ranks user-impacting differences before the UI turns them into plain-language copy.

The current calendar cancellation demo captures before and after snapshots with one clock value, then keeps only the latest summary in component memory. The trigger establishes only the known initiating fact; downstream bullets are shown strictly when the corresponding derived state changed. Outfit transitions remain empty until Ready has a real transition model, and weather polling is outside this version.
