# Phase 2B Rev 1.3 — acceptance evidence by requirement

Date: 20 October 2026 (Asia/Dhaka). Local tester: Codex automated verification; architecture/document review: Codex.

All 125 requirement/demonstration rows match the [client-supplied seven-page Revision 1.3 PDF](specifications/CLIENT_CHECKLIST_REV1.3.pdf) after whitespace/punctuation normalization. This matrix replaces use of the 45-item Rev 1.1 evidence template.

**Local verification passed. Final corrected-deployment acceptance is pending.** The owner reported that all existing Render checks passed on 20 October 2026. No individual staging execution records, tester identity, exact deployed SHAs, or Atlas database/index results were supplied for the corrected working tree. Owner confirmation is preserved separately from independently executed tests.

Each row below has a local result and an explicit staging result. `PASS` means the referenced local behavioral checks passed; `REVIEWED` means source/document review rather than a workflow execution. `PENDING` requires deployed evidence. No unchecked staging requirement is represented as a hosted pass.

## Source and environment

- Baseline: `df61c280abac73f21765d3eb4a9f7285d25231f8`.
- Correction branch: `phase2b-rev1.3-review-fixes`; working tree changes are not identified by the baseline SHA.
- Frontend staging URL from project records: `https://deeparture-v2-1.onrender.com`.
- Backend staging URL from project records: `https://deeparture-v2-3hr6.onrender.com`.
- Dedicated V2 Atlas environment, corrected deployed SHAs and staging tester: pending evidence.
- Local suites use temporary loopback MongoDB databases, generated local accounts, and test email transport.

## Evidence index

IDs use one-based `results` entries in the linked reports. `all` refers to the full successful suite. JSON timestamps are UTC; the work date above uses Asia/Dhaka.

### P1 — [phase1-test-results.json](../phase1-test-results.json)

Tested: `2026-10-20T17:14:06.203Z`; scope: local; no hosted deployment sign-off.

- **P11:** API health — passed.
- **P12:** invalid and expired tokens rejected with 401 — passed.
- **P13:** admin and operator login, token validation — passed.
- **P14:** invalid passwords, anonymous access, admin-only permission — passed.
- **P15:** seed attributes and operator organisation dashboard — passed.
- **P16:** demo detail pages data, 4950 USD pricing, six available spaces — passed.
- **P17:** catalogue-first unclaimed organisation, published page and import provenance — passed.
- **P18:** CSV two-vessel and XLSX resort import, shared organisation matching — passed.
- **P19:** operators cannot access another organisation — passed.
- **P110:** operators cannot self-award editorial ratings, verification or publication — passed.
- **P111:** claim invitations are admin-only, hashed, expiring, single-use and preserve existing credentials and ownership — passed.
- **P112:** catalogue reimport preserves product IDs — passed.
- **P113:** itinerary, cabin, three departures, override, discount and sold-out imports — passed.
- **P114:** itinerary reimport refreshes existing departure pricing — passed.
- **P115:** pricing close-out: USD 6000 itinerary base -> USD 7000 departure override -> 10 percent offer -> USD 6300 public API price — passed.
- **P116:** cross-organisation cabin references rejected — passed.
- **P117:** inventory ownership cannot be transferred by a request body — passed.
- **P118:** viewer reads allowed, viewer edits forbidden — passed.
- **P119:** seasonal rate creation and retrieval — passed.
- **P120:** enquiry persisted and customer, operator, admin notifications generated in test transport — passed.
- **P121:** resort packages, room ownership and availability import — passed.
- **P122:** imported records appear in destination, price and availability search — passed.
- **P123:** documented default demo login rejected — passed.
- **P124:** anonymous Operator link and direct dashboard access require login; invalid sessions cleared — passed.
- **P125:** admin browser login and populated dashboard — passed.
- **P126:** admin logout clears credentials and blocks dashboard re-entry — passed.
- **P127:** operator browser login and populated dashboard — passed.
- **P128:** operator logout clears credentials and blocks dashboard re-entry — passed.
- **P129:** demo and imported public pages render in browser — passed.
- **P130:** search pages load database records in browser — passed.
- **P131:** mobile detail page fits viewport — passed.
- **P132:** desktop and phone layouts fit viewport across starter pages — passed.
- **P133:** search controls filter results and listing links navigate — passed.
- **P134:** no browser JavaScript errors — passed.

### A — [phase2a-test-results.json](../phase2a-test-results.json)

Tested: `2026-10-20T17:14:08.754Z`; scope: isolated local Phase 2A; Render deployment not verified.

- **A1:** admin login and Admin V2 dashboard API — passed.
- **A2:** unclaimed operator organisation creation — passed.
- **A3:** draft liveaboard and resort creation — passed.
- **A4:** normalized catalogue preview then explicit commit — passed.
- **A5:** normalized availability replace/upsert path with source metadata — passed.
- **A6:** Admin-first enquiry moderation flow — passed.
- **A7:** draft listing preview endpoint — passed.
- **A8:** anonymous and operator access denied across Admin V2 APIs — passed.
- **A9:** admin dashboard counts agree with persisted catalogue, claim states and enquiry queue — passed.
- **A10:** global catalogue filtering, pagination, all moderation states and published-only public access — passed.
- **A11:** claim creates owner on existing organisation; tokens cannot replay; suspension and reactivation enforced — passed.
- **A12:** CSV upload, atomic single commit and durable batch row outcomes — passed.
- **A13:** XLSX Operators/Resorts adapter, no catalogue writes before confirmation, matched organisation and draft default — passed.
- **A14:** idempotent reimport and CREATE/UPDATE/DUPLICATE_REVIEW/ERROR/SKIP preview classification — passed.
- **A15:** attribute edit, data type/options, applicability, filter/public flags and inactive admin visibility — passed.
- **A16:** canonical location edit, alias/case duplicate rejection, cycle prevention and compatible slug search — passed.
- **A17:** enquiries withheld from operator email AND dashboard until approval; receipt notifications and invalid transition guards — passed.
- **A18:** email failure retains enquiry and approval can retry without losing the lead — passed.
- **A19:** partial cabin inventory upsert preserves other cabins and source timestamps; invalid quantities rejected — passed.
- **A20:** moderation, import and enquiry audit records exist without raw invitation tokens or passwords — passed.
- **A21:** browser guest redirect, operator denial and admin login to dedicated Admin V2 — passed.
- **A22:** all Admin V2 routes, listing editors and previews render at desktop/tablet/phone widths — passed.
- **A23:** attribute creation and editing through Admin UI — passed.
- **A24:** phone location/profile editing and organisation suspend/reactivate controls — passed.
- **A25:** browser CSV preview/confirm, phone moderation and automatically rendered published page — passed.
- **A26:** phone enquiry approval UI sends enquiry to the operator — passed.
- **A27:** admin logout and no browser runtime errors — passed.

### B — [phase2b-acceptance-results.json](../phase2b-acceptance-results.json)

Tested: `2026-10-20T17:14:31.442Z`; scope: isolated local; hosted acceptance not implied.

- **B1:** import metadata, row errors, partial outcomes, provenance, affected record and normalized retry — passed.
- **B2:** duplicate existing/new decisions persist and preserve internal IDs and external mapping — passed.
- **B3:** organisation and listing verification, provenance, revocation and publication independence — passed.
- **B4:** claim sent/resend/revoke/expiry history uses shared claim service — passed.
- **B5:** shared completeness categories for both product types do not block publication — passed.
- **B6:** website queue accepts operator/product/URL and all review states — passed.
- **B7:** validation/not-found/conflict response contract with correlation IDs and no stack traces — passed.
- **B8:** fresh/aging/stale/unknown, configurable priority, conflict, stale inventory and older-write rejection — passed.
- **B9:** real timed override expiry restores source inventory and records source/override history — passed.
- **B10:** dashboard flags, operational report sections and correlated audit actor/action/entity/time — passed.
- **B11:** eleven Phase 2B screens load without horizontal page overflow at 1440/768/390px — passed.
- **B12:** import history browser error panel and affected-record navigation — passed.
- **B13:** notification actionable link, unread count and live sidebar badge update — passed.
- **B14:** claim history rendered in organisation activity — passed.
- **B15:** combined status/source/completeness Admin filters and bulk confirmation/result UI — passed.
- **B16:** availability source inspection, visible override, clear and repeat edit without stale version — passed.
- **B17:** no browser runtime errors across Phase 2B acceptance — passed.
- **B18:** 2000-row notification pagination, stable sorting and local response benchmark — passed.
- **B19:** seeded catalogue/import/report performance and deployed local index verification — passed.

### API — [phase2b-api-results.json](../phase2b-api-results.json)

Tested: `2026-10-20T17:14:09.056Z`; scope: isolated local; not Render staging.

- **API1:** admin authorization — passed.
- **API2:** bounded operational lists — passed.
- **API3:** completeness and verification history — passed.
- **API4:** website source queue and stale edit protection — passed.
- **API5:** source configuration, mappings, and secret protection — passed.
- **API6:** bounded bulk action with partial outcomes — passed.
- **API7:** manual availability override, sources, and history — passed.
- **API8:** combined boolean, numeric, select, and multi-select search — passed.
- **API9:** canonical port plus price, availability and four typed attributes combine with negative controls — passed.
- **API10:** shared search, reporting, audit, and notifications — passed.

### R — [phase2b-review-availability-results.json](../phase2b-review-availability-results.json)

Tested: `2026-10-20T17:18:23.780Z`; scope: isolated local real MongoDB; not Render staging.

- **R1:** real MongoDB: disabled global Beta does not inherit Alpha — passed.
- **R2:** real MongoDB: disabled sole source clears persisted room counts and provenance, including misbound snapshots — passed.
- **R3:** real MongoDB: new organisation override replaces historical snapshot configuration — passed.
- **R4:** real MongoDB: disabling one provider retains another enabled provider — passed.
- **R5:** real MongoDB: legacy inventory without normalized snapshots is preserved — passed.
- **R6:** real MongoDB: disabled sole departure source clears eight spaces and four cabins — passed.
- **R7:** real MongoDB: manual override still works and clearing it cannot revive a disabled source — passed.

Backend unit/syntax/static evidence: [phase2b-backend-checks.txt](../phase2b-backend-checks.txt). The full isolated runner also completed the Next.js production build before executing the API/browser suites. Browser widths: 1440, 768 and 390 pixels. Scale fixtures: 2,000 notifications, 1,000 additional vessels and 1,000 additional import batches. Local index results are included in B19; they do not establish Atlas index state.

## 1. Import History & Versioning

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 1.1 | Import batches are stored.   | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
| 1.2 | Import adapter/source type is recorded.   | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
| 1.3 | Import schema/template version is recorded.   | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
| 1.4 | Row-level errors are visible.   | PASS (isolated local) — B1 B12. | Pending final-revision evidence; owner reports existing deployment passed. |
| 1.5 | Affected records can be opened.   | PASS (isolated local) — B12. | Pending final-revision evidence; owner reports existing deployment passed. |
| 1.6 | Partial failures are clearly reported.   | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
| 1.7 | Retry/reprocess uses the normalized import pipeline.   | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
## 2. Duplicate Reconciliation

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 2.1 | Ambiguous matches enter review.   | PASS (isolated local) — B2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 2.2 | Admin can choose existing/new.   | PASS (isolated local) — B2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 2.3 | Resolved decision persists.   | PASS (isolated local) — B2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 2.4 | Reconciliation does not replace permanent Deeparture IDs.   | PASS (isolated local) — B2. | Pending final-revision evidence; owner reports existing deployment passed. |
## 3. Reusable Notifications

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 3.1 | In-app notification records are created.   | PASS (isolated local) — B13 API10. | Pending final-revision evidence; owner reports existing deployment passed. |
| 3.2 | Notification is recipient/audience aware.   | PASS (isolated local) — B13. | Pending final-revision evidence; owner reports existing deployment passed. |
| 3.3 | Unread count works.   | PASS (isolated local) — B13. | Pending final-revision evidence; owner reports existing deployment passed. |
| 3.4 | Notification links to correct record/action.   | PASS (isolated local) — B13. | Pending final-revision evidence; owner reports existing deployment passed. |
| 3.5 | Notification service is reusable for Phase 3.   | REVIEWED — [notification.service.js](../../backend/src/v2/services/notification.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
| 3.6 | Email remains a channel/service, not controller-coupled business logic.   | REVIEWED — [notification.service.js](../../backend/src/v2/services/notification.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
## 4. Audit, Provenance & External Source Mapping

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 4.1 | Important Admin actions create audit entries.   | PASS (isolated local) — B10. | Pending final-revision evidence; owner reports existing deployment passed. |
| 4.2 | Bulk actions and verification changes create audit entries.   | PASS (isolated local) — B10 API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 4.3 | Sensitive secrets are excluded.   | PASS (isolated local) — A20 API5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 4.4 | Source type/URL/reference can be viewed.   | PASS (isolated local) — B1 B12. | Pending final-revision evidence; owner reports existing deployment passed. |
| 4.5 | Last checked/updated dates can be stored.   | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
| 4.6 | Reusable external source/provider mappings exist.   | PASS (isolated local) — B2 API5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 4.7 | Mapping foundation is not availability-only.   | REVIEWED — [externalSourceMapping.model.js](../../backend/src/v2/models/externalSourceMapping.model.js). | Pending final-revision evidence; owner reports existing deployment passed. |
## 5. Verification & Claim History

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 5.1 | Admin can verify organisation/listing.   | PASS (isolated local) — B3. | Pending final-revision evidence; owner reports existing deployment passed. |
| 5.2 | Verification records who and when.   | PASS (isolated local) — B3. | Pending final-revision evidence; owner reports existing deployment passed. |
| 5.3 | Verification records source/scope where relevant.   | PASS (isolated local) — B3. | Pending final-revision evidence; owner reports existing deployment passed. |
| 5.4 | Verification can be revoked/marked stale.   | PASS (isolated local) — B3. | Pending final-revision evidence; owner reports existing deployment passed. |
| 5.5 | Claim invitation history is visible.   | PASS (isolated local) — B4 B14. | Pending final-revision evidence; owner reports existing deployment passed. |
| 5.6 | Existing Phase 2A claim service is reused.   | PASS (isolated local) — B4. | Pending final-revision evidence; owner reports existing deployment passed. |
## 6. Completeness & Website Queue

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 6.1 | Listing completeness indicator works.   | PASS (isolated local) — B5 B12. | Pending final-revision evidence; owner reports existing deployment passed. |
| 6.2 | Completeness comes from shared/configurable rules.   | PASS (isolated local) — B5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 6.3 | Completeness supports different product types.   | PASS (isolated local) — B5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 6.4 | Completeness does not block basic publication.   | PASS (isolated local) — B5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 6.5 | Website source queue accepts URL/product/operator.   | PASS (isolated local) — B6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 6.6 | Website queue statuses work.   | PASS (isolated local) — B6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 6.7 | Future website extraction is designed to feed normalized import service.   | REVIEWED — [catalogImportAdapter.service.js](../../backend/src/v2/services/catalogImportAdapter.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
## 7. Availability Source Management

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 7.1 | Admin can see availability source and timestamps.   | PASS (isolated local) — B16 B9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.2 | Freshness state is calculated/configurable.   | PASS (isolated local) — B8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.3 | Stale does not mean sold out.   | PASS (isolated local) — B8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.4 | Source priority can be configured.   | PASS (isolated local) — B8 R3. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.5 | Conflicting source updates are detectable.   | PASS (isolated local) — B8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.6 | Older/lower-priority data cannot silently replace accepted effective value.   | PASS (isolated local) — B8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.7 | Manual override works.   | PASS (isolated local) — B16. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.8 | Manual override is visibly identified.   | PASS (isolated local) — B16. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.9 | Expired override stops controlling effective availability.   | PASS (isolated local) — B9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.10 | Availability history is traceable.   | PASS (isolated local) — B9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.11 | Availability source configuration exists.   | PASS (isolated local) — API5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.12 | Provider/entity IDs reuse shared source mapping foundation where appropriate.   | PASS (isolated local) — B2 API5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.13 | No external provider connection is required to pass Phase 2B.   | REVIEWED — [PHASE2B_ADMIN_AUTOMATION_README_REV1.3.md](../../docs/phase2b/specifications/PHASE2B_ADMIN_AUTOMATION_README_REV1.3.md). | Pending final-revision evidence; owner reports existing deployment passed. |
| 7.14 | Future connectors write through Phase 2A Availability Service.   | REVIEWED — [availability.service.js](../../backend/src/v2/services/availability.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
## 8. Shared Search & Typed Attribute Filtering

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 8.1 | Advanced structured filters use the shared Search Service.   | PASS (isolated local) — API9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.2 | Boolean filterable attributes work.   | PASS (isolated local) — API8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.3 | Numeric filterable attributes work.   | PASS (isolated local) — API8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.4 | Controlled single-select/enum attributes work.   | PASS (isolated local) — API8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.5 | Controlled multi-select attributes work.   | PASS (isolated local) — API8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.6 | Structured fields and typed attributes combine in one query.   | PASS (isolated local) — API9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.7 | Adding a new filterable attribute does not require a new product schema field.   | PASS (isolated local) — API8 A15. | Pending final-revision evidence; owner reports existing deployment passed. |
| 8.8 | Final customer filter UI is not required in Phase 2B.   | REVIEWED — [PHASE2B_ADMIN_AUTOMATION_README_REV1.3.md](../../docs/phase2b/specifications/PHASE2B_ADMIN_AUTOMATION_README_REV1.3.md). | Pending final-revision evidence; owner reports existing deployment passed. |
## 9. Advanced Admin Tools & Bulk Actions

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 9.1 | Advanced dashboard flags operational issues.   | PASS (isolated local) — B10. | Pending final-revision evidence; owner reports existing deployment passed. |
| 9.2 | Safe bulk Admin actions work.   | PASS (isolated local) — B15 API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 9.3 | Bulk actions enforce permissions/state rules.   | PASS (isolated local) — API1 API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 9.4 | Bulk actions create audit records.   | PASS (isolated local) — B10 API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 9.5 | Advanced catalogue filters work.   | PASS (isolated local) — B15 API9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 9.6 | Operational reporting is available.   | PASS (isolated local) — B10 API10. | Pending final-revision evidence; owner reports existing deployment passed. |
## 10. Event / Background-Job Readiness

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 10.1 | Important side effects are behind service/event boundaries.   | REVIEWED — [domainEvent.service.js](../../backend/src/v2/services/domainEvent.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
| 10.2 | Key internal events can be represented.   | REVIEWED — [domainEvent.service.js](../../backend/src/v2/services/domainEvent.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
| 10.3 | A distributed event bus is not required.   | REVIEWED — [domainEvent.service.js](../../backend/src/v2/services/domainEvent.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
| 10.4 | Future background workers can be added without rewriting domain workflows.   | REVIEWED — [domainEvent.service.js](../../backend/src/v2/services/domainEvent.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
## 11. Engineering Guardrails - Migrations, Scale & Safety

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 11.1 | Phase 2B schema/index/data changes have documented migration steps.   | REVIEWED — [MIGRATIONS_AND_ROLLBACK.md](../../docs/phase2b/MIGRATIONS_AND_ROLLBACK.md). | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.2 | Migration rollback/recovery approach is documented.   | REVIEWED — [MIGRATIONS_AND_ROLLBACK.md](../../docs/phase2b/MIGRATIONS_AND_ROLLBACK.md). | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.3 | Important Phase 2B query patterns have an indexing plan.   | REVIEWED — [INDEX_PLAN.md](../../docs/phase2b/INDEX_PLAN.md). | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.4 | Growing operational datasets use server-side pagination/cursors.   | PASS (isolated local) — B18 B19 API2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.5 | List APIs enforce bounded page sizes.   | PASS (isolated local) — API2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.6 | Sorting is server-side and stable for paginated datasets.   | PASS (isolated local) — B18. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.7 | Concurrency/lost-update protection exists where material.   | PASS (isolated local) — B8 API4. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.8 | Conflict is returned/reported explicitly.   | PASS (isolated local) — B7 B8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.9 | New Phase 2B APIs use a consistent error contract.   | PASS (isolated local) — B7. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.10 | Client errors do not expose stack traces or secrets.   | PASS (isolated local) — B7 A20. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.11 | Multi-step operations have operation/correlation IDs.   | PASS (isolated local) — B7 B10. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.12 | Bulk actions have sensible batch limits/chunking.   | PASS (isolated local) — API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.13 | Bulk actions expose per-record or partial outcomes.   | PASS (isolated local) — API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.14 | Retention/archival readiness is documented.   | REVIEWED — [RETENTION_AND_OPERATIONS.md](../../docs/phase2b/RETENTION_AND_OPERATIONS.md). | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.15 | Realistic seeded-data performance check is completed.   | PASS (isolated local) — B18 B19. | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.16 | No obvious N+1/full-collection query pattern is introduced.   | REVIEWED — [availability.service.js](../../backend/src/v2/services/availability.service.js). | Pending final-revision evidence; owner reports existing deployment passed. |
| 11.17 | No unnecessary heavy infrastructure is introduced.   | REVIEWED — [package.json](../../backend/package.json). | Pending final-revision evidence; owner reports existing deployment passed. |
## 12. Regression, Mobile & Data Safety

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 12.1 | Phase 2A import workflow still works.   | PASS (isolated local) — A4 A12 A13 A14. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.2 | Phase 2A claim workflow still works.   | PASS (isolated local) — A11 B4. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.3 | Phase 2A enquiry workflow still works.   | PASS (isolated local) — A6 A17 A18. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.4 | Phase 2A pricing/search/public-page regressions remain green.   | PASS (isolated local) — P1:all A:all. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.5 | Phase 2A Availability Service remains authoritative.   | PASS (isolated local) — A5 A19 R:all. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.6 | Phase 1 + Phase 2A automated/regression verification remains green.   | PASS (isolated local) — P1:all A:all. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.7 | Canonical locations and typed attributes regressions remain green.   | PASS (isolated local) — A15 A16 API8 API9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.8 | Phase 2B screens usable on desktop/tablet/mobile.   | PASS (isolated local) — B11 B17. | Pending final-revision evidence; owner reports existing deployment passed. |
| 12.9 | No V1 production data is modified.   | REVIEWED — [verify-phase1-local.js](../../backend/scripts/verify-phase1-local.js). | Pending final-revision evidence; owner reports existing deployment passed. |
## 13. Deployment Identity

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 13.1 | Frontend is deployed to the intended Render staging environment.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 13.2 | Backend/API is deployed to the intended Render staging environment.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 13.3 | Dedicated V2 Atlas staging database is confirmed.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 13.4 | Exact Git branch and commit hash are recorded.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 13.5 | Developer confirms deployed commit identity in writing.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 13.6 | Acceptance tests are run against the deployed staging build.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 13.7 | Deployment-specific changes and known issues are documented.   | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
## 14. End-to-End Phase 2B Demonstration

| ID | Requirement | Local result and evidence | Corrected Render staging |
|---|---|---|---|
| 14.1 | Run import with valid/error/duplicate rows. | PASS (isolated local) — B1 B2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.2 | Show import source/adapter/schema version in history. | PASS (isolated local) — B1. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.3 | Resolve an ambiguous duplicate. | PASS (isolated local) — B2. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.4 | Confirm audit + notification are produced. | PASS (isolated local) — B10 B13. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.5 | Demonstrate verification metadata. | PASS (isolated local) — B3. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.6 | Demonstrate reusable external source/provider mapping. | PASS (isolated local) — B2 API5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.7 | Demonstrate completeness via shared rules. | PASS (isolated local) — B5. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.8 | Demonstrate website source queue. | PASS (isolated local) — B6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.9 | Demonstrate availability freshness/conflict/priority. | PASS (isolated local) — B8 R:all. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.10 | Demonstrate temporary manual availability override and expiry behavior. | PASS (isolated local) — B9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.11 | Demonstrate availability history. | PASS (isolated local) — B9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.12 | Run safe bulk action and show audit/state-rule preservation. | PASS (isolated local) — API6 B10. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.13 | Run combined canonical-location + price/availability + typed-attribute search. | PASS (isolated local) — API9. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.14 | Confirm Phase 2A regression suite remains green. | PASS (isolated local) — A:all. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.15 | Confirm Render + Atlas + branch + exact commit deployment identity. | PENDING — exact corrected deployment/Atlas identity and authenticated evidence required. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.16 | Demonstrate server-side pagination/sorting on a growing dataset. | PASS (isolated local) — B18. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.17 | Show/document important Phase 2B indexes and their query use-cases. | PASS (isolated local) — B19. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.18 | Demonstrate one concurrency/conflict protection case. | PASS (isolated local) — API4 B8. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.19 | Demonstrate consistent validation/conflict API error shape. | PASS (isolated local) — B7. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.20 | Show an operation/correlation ID across one multi-step operation. | PASS (isolated local) — B7 B10. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.21 | Run a bounded bulk action with mixed per-record outcomes. | PASS (isolated local) — API6. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.22 | Run realistic seeded-data search/performance check and record dataset size. | PASS (isolated local) — B18 B19. | Pending final-revision evidence; owner reports existing deployment passed. |
| 14.23 | Confirm full Phase 1 + Phase 2A regression/verification suite remains green. | PASS (isolated local) — P1:all A:all. | Pending final-revision evidence; owner reports existing deployment passed. |

## Final result

Local implementation and regression verification: **PASS**. Hosted acceptance of the corrected revision: **PENDING**. Do not mark overall PASS or PASS WITH ISSUES until exact corrected frontend/backend identities, authenticated staging workflow results, dedicated V2 Atlas identity and index evidence are attached.

Operational demonstration: B9 proves expiry through the bounded Admin maintenance trigger; the staging administrator must run and record that trigger after corrected deployment and source configuration changes. See [operations](RETENTION_AND_OPERATIONS.md) and [review corrections](REVIEW_CORRECTIONS_2026-10-20.md).
