# Deeparture V2 - Phase 2B Rev 1.3 Implementation & Deployment

## Baseline

Phase 2B Rev 1.3 is implemented directly on the accepted Phase 2A integration baseline:

- Branch supplied by developer: `phase2a-integration`
- Phase 2A commit: `68e30d61f969aa59d450b8b7038ca39475b624b1`
- Phase 2A source archive used for this implementation: `Deeparture_V2-phase2a-integration-68e30d6(1).zip`

Phase 2B extends the existing Phase 2A services. It does not create parallel catalogue, pricing, availability, search, organisation/claim or enquiry systems.

## Phase 2B implementation summary

Implemented foundations include:

- import history, schema/adapter metadata, row errors, retry preview and operation IDs
- duplicate reconciliation with recorded decisions
- recipient-aware in-app notifications
- richer audit/provenance and security sanitization
- reusable external source mappings and source configurations
- verification history
- claim invitation history, resend and revoke operations
- shared product completeness service
- approved website-source review queue foundation
- normalized availability snapshots, effective state, freshness, conflicts, priority, overrides and history
- Admin availability maintenance/re-resolution controls
- typed-attribute + structured operational search/filtering through the shared Search Service
- advanced dashboard, organisation activity and operational reporting
- bounded service-driven bulk actions with per-record outcomes
- lightweight internal domain-event boundary
- operation/correlation IDs and consistent API error responses
- server-side pagination and bounded list APIs
- optimistic concurrency/conflict checks on material Admin/source writes

## Atlas / environment note

Development and acceptance of the supplied Phase 2A baseline were performed against local/temporary MongoDB. The application continues to obtain MongoDB configuration from environment variables.

Connecting Render staging to the user's dedicated MongoDB Atlas V2 staging database is an environment/deployment step and does not require a separate Phase 2B data architecture.

Before final Phase 2B sign-off, record and verify:

- Render frontend URL
- Render backend/API URL
- dedicated Atlas V2 staging database/environment name
- Git branch
- exact deployed commit hash
- any environment/configuration-only changes
- migration/index status
- acceptance checklist result

The acceptance checklist must be run against the deployed staging revision, not only a local checkout.

## Required developer deployment sequence

1. Create a branch from the exact Phase 2A baseline or apply the supplied Phase 2B patch to the matching commit.
2. Review `docs/phase2b/MIGRATIONS_AND_ROLLBACK.md` and `docs/phase2b/INDEX_PLAN.md`.
3. Install backend/frontend dependencies from lockfiles (`npm ci`).
4. Run backend syntax/static/unit/regression checks.
5. Run the frontend production build.
6. Start against an isolated staging database and allow Mongoose/index creation only in the intended staging environment.
7. Exercise the Phase 2B acceptance checklist, including realistic seeded-data pagination/filter tests.
8. Deploy backend and frontend to Render staging.
9. Re-run critical acceptance/regression checks against the deployed environment.
10. Record the exact deployed commit and database/environment identity.

## Required verification commands

Backend:

```bash
cd backend
npm ci
npm run check
npm run verify:phase2b:static
npm test
# When a local/staging MongoDB is available:
npm run verify:phase2a
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

## Scope boundaries

Phase 2B does **not** require actual third-party booking-system integrations, supplier API ingestion, webhook ingestion or scheduled provider synchronization. Those belong to Phase 5.

Phase 2B does **not** require the polished public/customer faceted filter interface. That belongs to Phase 4. Phase 2B establishes and proves the backend/shared-service capability.

Do not add Redis, Elasticsearch/OpenSearch, Kafka, Kubernetes or microservice decomposition simply for future-proofing. Add specialist infrastructure only when real scale/operational evidence justifies it.
