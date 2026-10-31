# Phase 3 Rev 1.0 — Implementation & Deployment

## Backend additions

New operator routes are mounted at `/api/v2/operator`.

Key source files:

- `src/v2/routes/operator.routes.js`
- `src/v2/controllers/operator.controller.js`
- `src/v2/services/operatorPortal.service.js`
- `src/v2/services/operatorImport.service.js`
- `src/v2/services/operatorPortal.helpers.js`
- `src/v2/models/organisationMemberInvitation.model.js`

Existing shared services remain authoritative:

- `availability.service.js`
- `pricing.service.js`
- `attribute.service.js`
- `notification.service.js`
- `audit.service.js`
- `domainEvent.service.js`
- `inventoryImport.service.js`

## Frontend additions

Operator portal entry point: `/operator/v2`

Primary pages:

- Dashboard
- Liveaboards
- Resorts
- Availability
- Enquiries
- Bulk Upload
- Notifications
- Team
- Profile

The previous `/dashboard/v2` route remains as a compatibility redirect.

## Permissions

Organisation roles remain:

- owner
- admin
- editor
- reservations
- viewer

Backend organisation ownership/role checks remain authoritative. Frontend visibility is not a security boundary.

## Operator editing restrictions

Operators cannot directly edit Deeparture-controlled fields such as:

- publication status
- Deeparture verification status
- vegan rating
- environmental rating
- source/provenance identity

Operator catalogue updates are whitelisted and source-attributed as `operator`.

## Team invitation security

- random 32-byte token
- SHA-256 token hash stored in MongoDB
- expiry
- superseded pending invitations revoked
- new invitees can create a new operator account
- existing invitees must provide their existing account password
- invitation email controls account identity
- at least one organisation owner is protected

## Operator imports

New operator imports use:

`upload -> parse -> validate/references -> no-write preview -> confirm -> shared inventory import service -> audit/history`

Supported Phase 3 operator import types:

- itineraries
- departures
- resort_packages
- resort_availability

## Media

Phase 3 deliberately does not write uploaded binaries to Render's ephemeral local filesystem.

The portal manages media assets by URL through `MediaAssetV2`, which is the stable abstraction boundary. Existing gallery URLs can be backfilled into MediaAsset records with the included dry-run migration.

A future storage provider (S3-compatible, Cloudinary, etc.) should plug into this media boundary without altering the catalogue model.

## Verification commands

Backend:

```bash
cd backend
npm ci
npm run check
npm run verify:phase2b:static
npm run verify:phase3:static
npm test
npm run verify:phase2a
npm run verify:phase1
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

## Deploy identity

After deployment record:

- frontend Render service + Live commit hash
- backend Render service + Live commit hash
- Git branch + full commit hash
- Atlas V2 staging database name/environment
- migration result
- Phase 3 checklist result

Frontend and backend should be confirmed against the exact same intended release revision unless a documented reason exists otherwise.

## Integration updates — 31 October 2026

See `INTEGRATION_RESULTS_2026-10-31.md` for actual local results. Package verification claims above describe the supplier's environment; current execution evidence is under `evidence/`.

The legacy `/api/v2/organisations/:organisationId/import/:importType` endpoint now returns the same no-inventory-write preview as the portal. Clients must explicitly POST to `/api/v2/operator/organisations/:organisationId/imports/:batchId/commit`. It no longer immediately writes inventory.

Operators sign in directly to `/operator/v2`. Existing inventory can be edited and URL media can be featured, reordered and removed through the portal.

Full isolated regression with browser (requires a local `mongod` and installed Playwright Chromium):

```bash
cd backend
MONGOD_PATH=/absolute/path/to/mongod VERIFY_REPORT_DIR=/absolute/path/to/docs/phase3/evidence npm run verify:phase3:local
```

This launches a temporary loopback database with generated test credentials and test email transport. It does not use the configured Atlas database. For a focused rerun after a build, use `node scripts/verify-phase1-local.js --phase3-only --skip-build` with the same environment. `VERIFY_REPORT_DIR` preserves earlier-phase historical reports by writing this run's reports to a separate directory.
