# Deeparture V2 - Phase 2B Rev 1.3 - START HERE

Use **Revision 1.3** as the current Phase 2B implementation reference. It supersedes Phase 2B Rev 1.2.

## Read in this order

1. `Deeparture_V2_Phase2B_Admin_Automation_Developer_Specification_Rev1.3.pdf`
2. `PHASE2B_REV1.3_CHANGE_SUMMARY.md`
3. `Deeparture_V2_Complete_Platform_Architecture_Rev1.0.pdf`
4. `Deeparture_V2_Future_Proof_Architecture_Principles.pdf`
5. `Deeparture_V2_Phase2B_Admin_Automation_Test_Checklist_Rev1.3.pdf`

## Direction

Phase 2B extends the completed Phase 2A architecture. Do not rebuild or create parallel versions of the normalized import service, normalized Availability Service, organisations/claiming, Admin-first enquiries, pricing, typed attributes, canonical locations, shared search, notifications or audit foundations.

Rev 1.3 adds implementation safeguards for:

- migrations and rollback/recovery
- query/index planning
- server-side pagination/sorting/limits
- concurrency/lost-update protection
- consistent API errors
- operation/correlation IDs
- bounded bulk actions and partial-result reporting
- retention/archival readiness
- realistic-data performance verification
- Phase 1 + Phase 2A regression gating

Do not add Redis, Elasticsearch/OpenSearch, Kafka, Kubernetes or microservice decomposition merely for future-proofing. Keep the current service boundaries clean and add specialized infrastructure only if actual scale/operations later justify it.

Actual external provider integrations remain Phase 5. The polished customer filter UI remains Phase 4.

## Sign-off

After Phase 2B deployment, record:

- Render frontend URL
- Render backend/API URL
- dedicated V2 Atlas staging DB/environment
- Git branch
- exact deployed commit
- migration/backfill notes
- acceptance checklist result
- seeded performance-test dataset size
- deployment-specific changes
- known issues

Run the checklist against the deployed staging build, not only locally.
