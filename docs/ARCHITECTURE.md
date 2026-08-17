# Architecture

Ready uses React 19, TypeScript, Tailwind CSS, the App Router programming model, and vinext’s Cloudflare-compatible Next.js runtime.

Provider interfaces return typed source context. Mock implementations feed the deterministic engine. The engine emits typed recommendations with priority, confidence, provenance, reasoning, and completion state. UI surfaces consume those models and never read integration-specific response formats.

Onboarding choices and recommendation progress persist locally. No sensitive values exist in client code. Future OAuth callbacks and credential-backed provider calls must run server-side, with secrets in `.env.local` locally and hosted runtime secrets in deployment settings.

Individual mocks can be replaced without changing screens. A future inference provider can supplement deterministic rules while explanations and user overrides remain authoritative. Local state can move behind a repository interface when production persistence is introduced.
