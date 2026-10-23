# Deeparture V2 Phase 2B integration

Current review correction delivery: [20 October 2026 corrections](docs/phase2b/REVIEW_CORRECTIONS_2026-10-20.md) and [complete 125-row Rev 1.3 evidence](docs/phase2b/REV1.3_ACCEPTANCE_EVIDENCE.md). Local checks passed; corrected-source Render/Atlas acceptance remains pending.

This checkout extends the Phase 2A baseline `68e30d61f969aa59d450b8b7038ca39475b624b1` with the Phase 2B Rev 1.3 implementation. Start with [the local integration record](docs/phase2b/INTEGRATION_RECORD_2026-10-15.md), then read [implementation and deployment](docs/phase2b/IMPLEMENTATION_AND_DEPLOYMENT.md), [migrations and rollback](docs/phase2b/MIGRATIONS_AND_ROLLBACK.md), and the [acceptance checklist](docs/phase2b/specifications/PHASE2B_ADMIN_AUTOMATION_TEST_CHECKLIST_REV1.3.md).

Phase 2B adds Admin import history, duplicate review, notifications, audit, source mappings and configuration, verification history, listing completeness, website-source review, resolved availability and manual overrides, shared filters, bulk actions and reporting. The existing Phase 2A catalogue, operator, pricing and enquiry flows remain in place.

Run `npm run verify:phase2b` and `npm run verify:phase2b:local` from `backend/`, then `npm run build` from `frontend/`. The local runner uses a temporary MongoDB database and generates its own private accounts. It requires `mongod` and Playwright Chromium. The frontend build must use the intended browser API URL for its environment.

Earlier archive/checksum discrepancies are preserved in the integration record. The root `PHASE2B_IMPLEMENTATION_MANIFEST.json` is regenerated for the 20 October correction delivery and identifies the shipped working-tree files. A new archive SHA256 is supplied beside the correction archive. Historical archives and patches under `docs/Phase 2B/` are excluded from the new delivery to avoid confusing them with corrected source.

The local checks do not establish Render deployment or Atlas staging acceptance. Record the deployed branch and commit, service URLs, database identity, index state, and Phase 2B staging checklist results before signing off.
