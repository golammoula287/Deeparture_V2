# Deeparture V2 — Standalone Phase 1

This repository is a **standalone extraction of Deeparture V2 Phase 1**. It does not require the legacy Deeparture V1 application to start or to create its own V2 database.

It contains:

- Node.js / Express V2 API
- MongoDB / Mongoose V2 data models
- standalone User authentication for local/staging use
- operator Organisations and Memberships
- unclaimed → invited → claimed operator flow
- vessels, itineraries, cabins, departures, availability, price overrides and offers
- resorts, room types, packages, rate periods and availability
- catalogue CSV/XLSX imports
- operator inventory CSV/XLSX imports
- shared attributes (facilities, dietary, accessibility, diving)
- enquiry and email notification foundation
- public liveaboard/resort pages
- liveaboard/resort search pages
- operator V2 starter dashboard
- Docker Compose local MongoDB/API/frontend environment

## Important scope

This is the **standalone Phase 1 foundation**, not the finished Deeparture V2 product. Admin V2, the complete Operator Portal V2, the redesigned mobile-first customer frontend/PWA, automated website ingestion and the future Agent platform remain later phases.

The legacy migration script is intentionally **not included** in this repository because this standalone build is designed to run without V1. Migration from the existing production application should remain a separate controlled staging task.

## Quick start with Docker

Requirements: Docker + Docker Compose.

```bash
docker compose up --build -d
```

Check the API:

```bash
curl http://localhost:5000/health
```

Seed shared attributes and demo content:

```bash
docker compose exec backend npm run seed:attributes
docker compose exec backend npm run seed:demo
```

Open:

- Frontend: http://localhost:3000
- Liveaboard demo: http://localhost:3000/liveaboards/demo-explorer
- Resort demo: http://localhost:3000/resorts/demo-dive-resort
- Operator login: http://localhost:3000/login

Default demo operator (development only):

- `operator@example.test`
- `ChangeMe123!`

Do not use those credentials outside a local development database.

## Run without Docker

### 1. MongoDB

Run MongoDB locally and create/use a development database such as `deeparture_v2`.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run check
npm run seed:attributes
npm run seed:demo
npm run dev
```

API: http://localhost:5000

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: http://localhost:3000

## Create a local admin account

Edit `backend/.env` and set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then:

```bash
cd backend
npm run create:admin
```

Login through `/login`. Admin users can call the `/api/v2/admin/*` Phase 1 APIs.

## Safe email behavior

If SMTP is not configured, the standalone backend uses Nodemailer's JSON transport. Emails are generated for testing but are **not delivered to real recipients**.

Configure real SMTP only in a controlled staging/production environment.

## Key API routes

Public:

- `GET /api/v2/liveaboards`
- `GET /api/v2/liveaboards/:slug`
- `GET /api/v2/resorts`
- `GET /api/v2/resorts/:slug`
- `POST /api/v2/enquiries`
- `GET /api/v2/attributes`

Authentication:

- `POST /api/auth/login`
- `GET /api/auth/me`

Claims:

- `POST /api/v2/claims/accept`
- `POST /api/v2/claims/organisations/:organisationId/invite` (admin)

Operator organisations:

- `GET /api/v2/organisations/mine`
- `GET /api/v2/organisations/:organisationId/dashboard`
- inventory CRUD and import routes beneath `/api/v2/organisations/:organisationId/*`

Admin catalogue:

- `GET /api/v2/admin/catalog/template-fields`
- `POST /api/v2/admin/catalog/import`
- `POST /api/v2/admin/catalog/import-file`
- `POST /api/v2/admin/attributes`
- `POST /api/v2/admin/claim-invitations/bulk`

## Page creation

There are no manually-created vessel/resort HTML files. A published database record with a unique `slug` is rendered through the reusable Next.js routes:

- `/liveaboards/[slug]`
- `/resorts/[slug]`

Therefore importing 200 published vessel records can create 200 addressable listing pages without adding 200 frontend source files.

## Database isolation

The standalone project should use a new database (`deeparture_v2`, `deeparture_v2_staging`, etc.). Do not point local development at the current production Deeparture database.

## GitHub

Keep this repository **private** during development. See `GITHUB_SETUP.md`.
