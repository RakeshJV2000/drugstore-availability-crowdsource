# medmonitor (MVP)

Monolithic Next.js + Prisma app to crowdsource drug availability at pharmacies. Includes auth, search with maps, admin tools, and seed data.

## Stack

- Next.js App Router (API routes + minimal UI)
- Prisma ORM with PostgreSQL
- Auth0 for authentication (`@auth0/nextjs-auth0`)
- MapLibre + MapTiler (tiles + geocoding/autocomplete)
- Tailwind UI primitives

## Getting Started

1. Create a Postgres database and set `DATABASE_URL` in `.env` (copy `.env.example`).
2. Install deps: `npm install`.
3. Generate Prisma client: `npm run prisma:generate`.
4. Apply schema: `npm run prisma:migrate` (name the migration).
5. (Optional) Seed example data: `npm run db:seed` (adds 50 drugs + 50 NYC/Jersey City pharmacies with sample reports).
6. Run dev server: `npm run dev` and open http://localhost:3000.

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
- Maps/Geocoding:
  - `NEXT_PUBLIC_MAPTILER_API_KEY` (public key restricted to your domain)

## Core Models

- Drug, Pharmacy, AvailabilityReport, StatusAggregate, User, Flag, AuditLog, Watchlist.

## API Overview

- `POST /api/reports`
  - Body: `{ drug, status, pharmacy: { id? | name, address, lat, lng }, note? }`
  - Requires Auth0 sign-in. Creates a report and updates aggregates.
- `GET /api/search`
  - Drug mode: `?mode=drug&drug=...&lat=..&lng=..&radiusMi=10`
    - Returns nearby pharmacies for the drug with `status`, `confidence` (0–1), `lastVerifiedAt`, and `distanceMi`.
  - Store mode: `?mode=store&lat=..&lng=..&radiusMi=10[&q=Walgreens,CVS]`
    - Returns nearby pharmacies grouped by status arrays: `inStock|low|out|unknown` with `lastVerifiedAt` and `distanceMi`.
- `GET /api/drugs/autocomplete?q=...` — simple drug search by name/ndc/synonym.
- `POST /api/pharmacies/claim` — stub: logs claim intent (email + pharmacyId).
- `PATCH /api/pharmacies/:id/availability` — staff update; requires `X-Staff-Token: ${STAFF_TOKEN}`.
- `POST /api/flags` — create a moderation flag (rate limited).
- Admin:
  - `GET /api/admin/flags`, `PATCH /api/admin/flags/:id`
  - `GET /api/admin/users`, `DELETE /api/admin/users/:id`
  - `GET /api/admin/drugs`, `DELETE /api/admin/drugs/:id`
  - `GET /api/admin/stats` — totals for users and drugs
  - `GET /api/me` — current session user with anonymous handle

## UI (Customer-first)

- Home
  - Search modes: Drug or Store
  - Location: pick via address autocomplete (MapTiler), map click, or “Use my location” (explicit only); distance in miles
  - Map: shows center marker (green for “You”) and store markers with name + address popup
  - Drug mode: shows only non-OUT stores with status chip, confidence %, updated time, and distance in miles
  - Store mode: shows all nearby stores; each card has 4 collapsed sections (IN_STOCK/LOW/OUT/UNKNOWN) with counts; expanding shows drugs and “updated X ago”
  - Filters: brand checkboxes (Walgreens/CVS/etc.), “Hide stores with no data” toggle
  - Fallback: adds nearby pharmacy POIs from MapTiler if DB has few results (clearly marked as “No data available”)
- Report
  - Address autocomplete (POI/address) fills address and auto-populates lat/lng; mini map supports click-to-set location
  - Requires sign-in; rate-limited; stores anonymous handle
- Admin `/admin`
  - Submit token to authenticate; shows tabbed Users, Drugs, Flags
  - Users: list with handle, email, reports count, joined date; delete user
  - Drugs: list with counts and recent reports; delete drug
  - Flags: list and triage (resolve/dismiss)
  - Header stats: total users and drugs

## Auth & Identity

- Auth0 integration with routes at `/api/auth/*`
- Navbar displays anonymous handle (e.g., `brisk-otter-a1b`) for signed-in users
- Server-side resolves/creates users on first sign-in and backfills unique handles

## Aggregation & Confidence

- Aggregation: time-decayed scoring over the last reports (72h decay, floor at 0.2)
- No source weighting: all reports count equally
- Chosen status = highest decayed score; confidence = normalized top score (0–1)
- `lastVerifiedAt` = newest contributing report timestamp

## Seed Data

- `npm run db:seed` inserts:
  - 50 common drugs (with simple NDCs)
  - 50 pharmacies across NYC & Jersey City (brands + neighborhoods)
  - Randomized availability reports per store; aggregates recomputed

## Notes

- Add auth scopes, rate-limits, moderation, and email verification before production use
- Tokens: Admin actions require `Authorization: Bearer ${ADMIN_TOKEN}` in requests
