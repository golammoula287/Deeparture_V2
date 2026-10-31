# Phase 3 Operator Portal V2 Rev 1.0 — Final Packaging Verification

## Authoritative baseline

- Phase 2B live source commit: `01cb93ea3ce312ef0227099bd224094b2072ddb8`
- Client source archive SHA256: `cea37e32a86e2635028dbec7f8225ec5b2264543b4b89e0fd157f7d6af2f484b`
- Frontend and backend Render Live commits were confirmed as the same baseline before Phase 3 work began.
- Dedicated V2 Atlas staging database and Phase 2B availability fixes were confirmed before accepting this baseline.

## Verification completed in the implementation environment

- Phase 3 static architecture/security verifier: **PASS**
- Phase 3 dependency-light unit tests: **6/6 PASS**
- Backend JavaScript syntax: **111 files PASS**
- Frontend JavaScript/JSX syntax/transpile: **63 files PASS, 0 syntax errors**
- Raw Phase 2B → Phase 3 patch: `git apply --check` against clean Phase 2B baseline **PASS**
- No real `.env`, PEM/private-key or credential file is included in the handover package.

## Key architecture checks covered

- Operator routes are isolated under `/api/v2/operator` and require operator/admin authentication.
- Organisation role/ownership checks protect operator-owned writes.
- The Operator Portal reuses shared catalogue, pricing, Availability, attribute, import, audit, notification and enquiry foundations.
- Operator availability writes continue through the shared inventory/Availability service boundary.
- Operator imports use preview before commit and reuse the shared inventory importer.
- Team invitations use hashed, expiring, single-use tokens; existing users prove their password.
- Notifications are user/organisation scoped.
- Operator verification remains separate from Deeparture editorial verification.
- Media records are organisation/entity scoped and provider-agnostic.
- Legacy `/dashboard/v2` redirects to `/operator/v2`.

## Environment-dependent checks still required by the developer

Run after installing dependencies in the integration/deployment environment:

```bash
cd backend
npm ci
npm run check
npm run verify:phase3:static
npm test
npm run verify:phase2b

cd ../frontend
npm ci
npm run build
```

Then deploy to staging and complete `docs/phase3/PHASE3_ACCEPTANCE_CHECKLIST_REV1.0.md` against the actual Render/Atlas environment.

## Intentional boundary

Phase 3 does not hard-wire binary media storage to Render local disk. Media management is URL/record based with a dry-run/apply backfill script so a durable object-storage provider can be connected later without redesigning the domain.
