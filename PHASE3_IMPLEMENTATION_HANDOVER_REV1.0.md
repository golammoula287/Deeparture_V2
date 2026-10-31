# Deeparture V2 — Phase 3 Operator Portal V2
## Implementation Handover — Revision 1.0

### Authoritative baseline

Phase 3 was implemented directly on the client-supplied Phase 2B source package identified as:

- Phase 2B source commit: `01cb93ea3ce312ef0227099bd224094b2072ddb8`
- Frontend Render Live commit confirmed by client: same commit
- Backend Render Live commit confirmed by client: same commit
- Dedicated V2 Atlas staging database: supplied/confirmed by client
- Availability review fixes: confirmed passing before Phase 3 baseline was accepted

Do not rebase this implementation onto an earlier Phase 2B package.

## What Phase 3 adds

- Dedicated `/operator/v2` portal and navigation
- Multi-organisation operator selection
- Operator dashboard with incomplete listings, upcoming departures, stale/conflicting availability, active offers, enquiries and notifications
- Organisation profile editor
- Multi-user organisation team management with roles: owner/admin/editor/reservations/viewer
- Secure team invitations using hashed, expiring, single-use tokens
- New-user onboarding from a team invite; existing users must authenticate with their existing password
- Liveaboard catalogue editor
- Cabin types
- Itineraries and itinerary base pricing
- Departures
- Departure availability, price overrides and offers through the existing pricing/Availability Services
- Resort catalogue editor
- Room types, packages, seasonal rate periods and room availability/stop-sell
- Structured typed attributes using the existing Attribute Service
- Operator verification distinct from Deeparture editorial verification
- Operator media asset management without hard-coding a storage vendor
- Operator notifications
- Operator enquiry workflow
- XLSX/CSV operator imports with preview → confirmation → commit and row-level errors
- Import history
- Mobile-first quick availability / offer / pricing tasks
- Audit and domain-event reuse
- Legacy `/dashboard/v2` redirect to `/operator/v2`

## Architecture rule

Phase 3 does **not** introduce operator-specific parallel pricing, availability, catalogue, enquiry, import, attribute or notification systems. It exposes the shared Phase 1/2 services through operator-scoped permissions.

## Verification completed in the implementation environment

- Phase 3 static verifier: PASS
- Phase 3 dependency-light unit tests: 6/6 PASS
- Backend JavaScript syntax checks: PASS
- Frontend JS/JSX TypeScript-transpile syntax check: PASS
- No `.env`, PEM or private-key files included

The developer must still run full dependency-based tests and the Next.js production build after `npm ci` in their deployment environment.

## Start here for deployment

1. Read `docs/phase3/IMPLEMENTATION_AND_DEPLOYMENT.md`.
2. Review `docs/phase3/MIGRATIONS_AND_ROLLBACK.md`.
3. Apply/merge the Phase 3 patch or use the full implementation ZIP.
4. Run all regression and Phase 3 checks.
5. Deploy to Render staging using the dedicated V2 Atlas staging database.
6. Complete `docs/phase3/PHASE3_ACCEPTANCE_CHECKLIST_REV1.0.md` against the deployed staging environment.
