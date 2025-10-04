# Product Roadmap (Prototype → Beta)

This roadmap captures the plan to evolve the offline MVP into a map‑first, auth‑enabled prototype using free‑tier friendly services, and then prepare it for online use and deployment.

## Goals
- Map‑first UX: land on a full‑screen map centered on user location.
- Two search modes: by drug or by store name.
- Clear results:
  - Drug mode: nearby stores that have the drug available (IN_STOCK/LOW).
  - Store mode: nearby stores showing only OUT‑of‑stock drugs.
- Reporting gated by sign‑in (Google): users must authenticate to submit availability/shortage.
- Free‑tier friendly for the prototype; production‑ready options for later.

## Phase 1 — Map + UI Foundation (Prototype)
- Tailwind CSS + shadcn/ui for consistent, accessible UI.
- Map integration: MapTiler or Mapbox with a free API key.
- Geolocation button + radius control (km) to drive search queries.
- Search mode toggle: "Search by" Drug | Store.

Acceptance criteria:
- Home shows a full‑screen map, centers on user, and allows manual lat/lng.
- UI components styled via shadcn/ui; forms are keyboard and mobile friendly.

## Phase 2 — Search Modes & API
- Extend `GET /api/search` with `mode` param:
  - `mode=drug&drug=NAME&lat&lng&radiusKm`: return nearby pharmacies with `StatusAggregate.status IN (IN_STOCK, LOW)` for the drug.
  - `mode=store&q=NAME&lat&lng&radiusKm`: return nearby pharmacies matching store name; include only drugs with `status = OUT` for that pharmacy.
- Ensure existing indexes are used; keep Haversine/bbox distance calc on server.
- Map pins + side list synchronized; optional clustering later.

Acceptance criteria:
- Drug search yields pins/list filtered by availability.
- Store search yields pins/list filtered to OUT drugs only.

## Phase 3 — Auth + Gated Reporting
- Auth provider: Auth0 (Google) or Auth.js (NextAuth) + Google.
- Require session on `POST /api/reports`; remove token‑only flow for public reports.
- UI: "Sign in with Google" button; show session state; gate `/report` form.

Acceptance criteria:
- Unauthenticated users cannot submit reports.
- Authenticated users can submit; server validates session.

## Phase 4 — UX Polish & Data Hygiene
- Forms: react‑hook‑form + zod; inline validation and toasts.
- Dedupe heuristics for crowd‑created pharmacies (name/address similarity).
- Improve admin flags view (filters, pagination, quick actions).

## Phase 5 — Online Readiness
- Hosted Postgres: Neon or Supabase; `prisma migrate deploy` against hosted DB.
- Redis (Upstash) for persistent rate limits; optional short‑TTL search cache (30–120s).
- Deploy to Vercel; environment management via project envs.

## Phase 6 — Observability & Analytics
- Sentry for error tracking and performance (server + client).
- PostHog for product analytics and feature flags.

## Tooling Choices (Free‑Friendly)
- Maps/Geocoding: MapTiler or Mapbox (free tiers). Keys stored in env.
- Auth: Auth0 (free dev tier) or Auth.js + Google (fully free, self‑managed).
- DB: Neon or Supabase (free tiers) when going online; local Postgres for dev.
- Rate limits/cache: Upstash Redis (free) with in‑memory fallback for dev.
- Jobs (later): Inngest or Trigger.dev for cron/background tasks.

## Env Vars To Introduce (as needed)
- Map provider: `MAPTILER_API_KEY` or `MAPBOX_ACCESS_TOKEN`.
- Auth0 (if chosen): `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.
- Auth.js (if chosen): `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Redis (later): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Notes
- Current `ADMIN_TOKEN`/`STAFF_TOKEN` are placeholders for local/dev. Replace with real auth/roles once Auth is integrated.
- Prefer short‑TTL cache over complex invalidation; optionally version cache keys by a coarse "last update" bucket.
- Keep the MVP offline and free until maps/auth are proven; then flip envs for online.

