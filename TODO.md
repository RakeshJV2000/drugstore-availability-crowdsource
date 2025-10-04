# Project TODO

This file tracks what’s already done and what you still need to do, both for the offline MVP and for future online features.

## Completed (MVP Scaffold)
- Next.js app with App Router and minimal UI (`/`, `/report`).
- Prisma schema for Drug, Pharmacy, AvailabilityReport, StatusAggregate, User, Flag, AuditLog, Watchlist.
- APIs: `POST /api/reports`, `GET /api/search`, `GET /api/drugs/autocomplete`, stub `POST /api/pharmacies/claim`, `PATCH /api/pharmacies/:id/availability` (staff, hidden in UI).
- Aggregation logic: recency + source-weighted scoring, writes to `StatusAggregate`.
- Geolocation buttons on search and report pages (no external SDKs).
- Rate limiting (in-memory) and simple token guards for admin/staff.
- Flags + admin moderation endpoints and basic admin page (`/admin`).
- Docs and env templates: `README.md`, `.env.example`.
- Windows bootstrap script: `scripts/bootstrap.ps1` (DB create + Prisma generate/migrate + optional seed).

## Progress (Today)
- Tailwind CSS added with global styles; layout/page refactored to Tailwind classes.
- Map integrated on home using MapLibre + MapTiler (env: `NEXT_PUBLIC_MAPTILER_API_KEY`).
- Home UI: added clear toggle “Search by: Drug | Store”, geolocation button, and improved inputs/buttons.
- API: extended `GET /api/search` to support `mode=store` with `q=<store>` returning OUT drugs per store.
- Kept existing drug search flow intact; map markers now render for results.

## Next Steps (Run Locally, Offline)
1. Install requirements: Node 18+ and local PostgreSQL 14+.
2. Create database and configure env:
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` (e.g. `postgresql://postgres:PASS@localhost:5432/drugshortage?schema=public`).
   - Optionally set `ADMIN_TOKEN` and `STAFF_TOKEN` (any random strings for now).
3. Bootstrap (PowerShell): `./scripts/bootstrap.ps1 -Install -Seed`
   - Or manual: `npm install` → `npm run prisma:generate` → `npm run prisma:migrate` → `npm run db:seed` (optional).
4. Start the app: `npm run dev` then open `http://localhost:3000`.
5. Smoke test:
   - Submit a report on `/report` (use geolocation to fill lat/lng).
   - Search on `/` with the same drug + your location and radius.
6. Optional data entry:
   - Add more drugs/pharmacies via the UI (by submitting reports) or Prisma Studio: `npx prisma studio`.

## Near-Term Enhancements (Still Offline)
- Improve UI/UX styling and form validation.
- Add dedupe heuristics for pharmacies created by crowd (name/address similarity).
- Enrich drug data (synonyms, forms) via a local import script.
- Add a lightweight moderation queue view for reports (not just flags).
- Basic analytics page (counts by drug/location, recent updates).

## UI Upgrade (shadcn/ui) — Planned
- Initialize shadcn/ui and add base components (Button, Input, Label, Select, Toggle, Toast).
- Replace local primitives with shadcn/ui components for consistency and accessibility.
- Add toasts (errors/success) and form validation (react-hook-form + zod).

## When Going Online (Later)
- Maps/geocoding: pick provider (Google Maps or Leaflet + MapTiler/Mapbox) and add map to search/report.
- Real auth: email OTP or provider-based; staff verification flow and portal.
- Rate limit persistence (Redis) and abuse mitigation (captcha after threshold).
- Alerts/watchlists and background jobs for aggregation + notifications.
- Deployment (Vercel/Render) and hosted Postgres (Neon/Supabase).
- Backups, monitoring, privacy policy, and ToS.

## Roadmap (Prototype → Beta)
See ROADMAP.md for the full plan. High-level phases:

- Phase 1 — Map + UI Foundation
  - Tailwind + shadcn/ui
  - MapTiler/Mapbox map on home, geolocation + radius
  - Toggle: search by Drug | Store

- Phase 2 — Search Modes & API
  - `GET /api/search` supports `mode=drug|store`
  - Drug mode: nearby stores with IN_STOCK/LOW for drug
  - Store mode: nearby stores with OUT-only drugs listed

- Phase 3 — Auth + Gated Reporting
  - Auth0 or Auth.js (Google)
  - Require session on `POST /api/reports`

- Phase 4 — UX Polish & Data Hygiene
  - react-hook-form + zod, toasts
  - Dedupe heuristics for crowd-created pharmacies
  - Improved admin flags UI

- Phase 5 — Online Readiness
  - Hosted Postgres (Neon/Supabase), `prisma migrate deploy`
  - Redis (Upstash) for rate limits; optional short-TTL search cache
  - Deploy to Vercel

- Phase 6 — Observability & Analytics
  - Sentry, PostHog
