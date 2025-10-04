# Drug Shortage Crowd Platform (MVP)

Monolithic Next.js + Prisma starter to crowdsource drug availability at pharmacies.

## Stack

- Next.js App Router (API routes + minimal UI)
- Prisma ORM with PostgreSQL

## Getting Started

1. Create a Postgres database and set `DATABASE_URL` in `.env` (copy `.env.example`).
2. Install deps: `npm install`.
3. Generate Prisma client: `npm run prisma:generate`.
4. Apply schema: `npm run prisma:migrate` (name the migration).
5. (Optional) Seed example data: `npm run db:seed`.
6. Run dev server: `npm run dev`.

Open http://localhost:3000.

### Windows: One-time Bootstrap (optional)

- PowerShell: `./scripts/bootstrap.ps1 -Install -Seed`
  - Copies `.env.example` to `.env` if missing, reads `DATABASE_URL`, creates the DB if needed, runs Prisma generate + migrate, and seeds (optional).
  - Use `-Install` to run `npm install` first (requires internet).
  - Omit `-Seed` if you don’t want example data.

## Environment

- `DATABASE_URL`: Postgres connection string.
- `ADMIN_TOKEN`: random string for admin API/UI access.
- `STAFF_TOKEN`: temporary token to protect staff endpoints.
- Auth0 (for sign-in to report):
  - `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

## Core Models

- Drug, Pharmacy, AvailabilityReport, StatusAggregate, User, Flag, AuditLog, Watchlist.

## API Overview

- `POST /api/reports`
  - Body: `{ drug, status, pharmacy: { id? | name, address, lat, lng }, note? }`
  - Requires sign-in (Auth0). Creates a report and updates the aggregate.
- `GET /api/search?drug=...&lat=..&lng=..&radiusKm=10`
  - Returns pharmacies with aggregated status and distance.
- `GET /api/drugs/autocomplete?q=...`
  - Simple drug search by name/ndc/synonym.
- `POST /api/pharmacies/claim`
  - Stub: logs claim intent (email + pharmacyId).
- `PATCH /api/pharmacies/:id/availability`
  - Staff update: sets status via a staff-sourced report.
  - Requires header `X-Staff-Token: ${STAFF_TOKEN}`.
- `POST /api/flags`
  - Body: `{ entityType: 'REPORT'|'PHARMACY'|'USER', entityId, reason }`.
  - Creates a flag (rate limited).
- `GET /api/admin/flags` (admin)
  - Lists flags. Requires `Authorization: Bearer ${ADMIN_TOKEN}`.
- `PATCH /api/admin/flags/:id` (admin)
  - Body: `{ state: 'OPEN'|'RESOLVED'|'DISMISSED' }`.

## UI (Customer-first)

- Home: search by drug + lat/lng (includes "Use my location").
- Report: simple crowd report form (includes "Use my location").
- Pharmacy Portal: hidden for now; focusing on customer crowdsourcing first.
- Admin: `/admin` for flag triage (enter `ADMIN_TOKEN`).

## Notes

- Geocoding and maps are not included; provide lat/lng directly for now.
- Aggregation is simplistic: weighted by source and recency (decay over 72h).
- Add auth, rate-limits, moderation, and email verification before production.
  - Current MVP includes in-memory rate limits and token-guarded staff/admin endpoints.
