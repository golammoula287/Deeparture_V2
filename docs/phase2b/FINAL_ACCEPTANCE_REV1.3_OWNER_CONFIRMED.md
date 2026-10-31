# Deeparture V2 Phase 2B — Final Acceptance Checklist Rev 1.3

Confirmation date: 21 October 2026 (Asia/Dhaka).

**Overall result: PASS — project-owner-confirmed acceptance.** All 125 requirements are recorded as passed for local and Render based on the owner’s explicit confirmation that they have already checked both environments. This is an owner-attested acceptance record, not a new independently executed staging test report.

The owner attributes earlier local failures to missing environment configuration. Historical machine reports are preserved unchanged. Previously executed local checks passed: 30 unit tests; 7 focused MongoDB groups; Phase 1: 34 groups; Phase 2A: 27 groups; Phase 2B API: 10 groups; extended Phase 2B: 19 groups; production build and browser checks.

Frontend: https://deeparture-v2-1.onrender.com  
Backend: https://deeparture-v2-3hr6.onrender.com  
Exact deployed frontend/backend commit IDs and Atlas database name: not supplied in this acceptance record. No values have been inferred.

| ID | Rev 1.3 requirement | Local | Render | Basis |
|---|---|---|---|---|
| 1.1 | Import batches are stored. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 1.2 | Import adapter/source type is recorded. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 1.3 | Import schema/template version is recorded. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 1.4 | Row-level errors are visible. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 1.5 | Affected records can be opened. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 1.6 | Partial failures are clearly reported. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 1.7 | Retry/reprocess uses the normalized import pipeline. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 2.1 | Ambiguous matches enter review. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 2.2 | Admin can choose existing/new. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 2.3 | Resolved decision persists. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 2.4 | Reconciliation does not replace permanent Deeparture IDs. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 3.1 | In-app notification records are created. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 3.2 | Notification is recipient/audience aware. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 3.3 | Unread count works. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 3.4 | Notification links to correct record/action. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 3.5 | Notification service is reusable for Phase 3. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 3.6 | Email remains a channel/service, not controller-coupled business logic. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.1 | Important Admin actions create audit entries. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.2 | Bulk actions and verification changes create audit entries. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.3 | Sensitive secrets are excluded. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.4 | Source type/URL/reference can be viewed. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.5 | Last checked/updated dates can be stored. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.6 | Reusable external source/provider mappings exist. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 4.7 | Mapping foundation is not availability-only. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 5.1 | Admin can verify organisation/listing. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 5.2 | Verification records who and when. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 5.3 | Verification records source/scope where relevant. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 5.4 | Verification can be revoked/marked stale. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 5.5 | Claim invitation history is visible. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 5.6 | Existing Phase 2A claim service is reused. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.1 | Listing completeness indicator works. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.2 | Completeness comes from shared/configurable rules. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.3 | Completeness supports different product types. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.4 | Completeness does not block basic publication. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.5 | Website source queue accepts URL/product/operator. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.6 | Website queue statuses work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 6.7 | Future website extraction is designed to feed normalized import service. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.1 | Admin can see availability source and timestamps. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.2 | Freshness state is calculated/configurable. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.3 | Stale does not mean sold out. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.4 | Source priority can be configured. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.5 | Conflicting source updates are detectable. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.6 | Older/lower-priority data cannot silently replace accepted effective value. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.7 | Manual override works. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.8 | Manual override is visibly identified. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.9 | Expired override stops controlling effective availability. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.10 | Availability history is traceable. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.11 | Availability source configuration exists. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.12 | Provider/entity IDs reuse shared source mapping foundation where appropriate. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.13 | No external provider connection is required to pass Phase 2B. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 7.14 | Future connectors write through Phase 2A Availability Service. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.1 | Advanced structured filters use the shared Search Service. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.2 | Boolean filterable attributes work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.3 | Numeric filterable attributes work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.4 | Controlled single-select/enum attributes work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.5 | Controlled multi-select attributes work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.6 | Structured fields and typed attributes combine in one query. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.7 | Adding a new filterable attribute does not require a new product schema field. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 8.8 | Final customer filter UI is not required in Phase 2B. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 9.1 | Advanced dashboard flags operational issues. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 9.2 | Safe bulk Admin actions work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 9.3 | Bulk actions enforce permissions/state rules. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 9.4 | Bulk actions create audit records. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 9.5 | Advanced catalogue filters work. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 9.6 | Operational reporting is available. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 10.1 | Important side effects are behind service/event boundaries. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 10.2 | Key internal events can be represented. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 10.3 | A distributed event bus is not required. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 10.4 | Future background workers can be added without rewriting domain workflows. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.1 | Phase 2B schema/index/data changes have documented migration steps. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.2 | Migration rollback/recovery approach is documented. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.3 | Important Phase 2B query patterns have an indexing plan. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.4 | Growing operational datasets use server-side pagination/cursors. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.5 | List APIs enforce bounded page sizes. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.6 | Sorting is server-side and stable for paginated datasets. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.7 | Concurrency/lost-update protection exists where material. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.8 | Conflict is returned/reported explicitly. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.9 | New Phase 2B APIs use a consistent error contract. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.10 | Client errors do not expose stack traces or secrets. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.11 | Multi-step operations have operation/correlation IDs. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.12 | Bulk actions have sensible batch limits/chunking. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.13 | Bulk actions expose per-record or partial outcomes. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.14 | Retention/archival readiness is documented. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.15 | Realistic seeded-data performance check is completed. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.16 | No obvious N+1/full-collection query pattern is introduced. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 11.17 | No unnecessary heavy infrastructure is introduced. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.1 | Phase 2A import workflow still works. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.2 | Phase 2A claim workflow still works. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.3 | Phase 2A enquiry workflow still works. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.4 | Phase 2A pricing/search/public-page regressions remain green. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.5 | Phase 2A Availability Service remains authoritative. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.6 | Phase 1 + Phase 2A automated/regression verification remains green. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.7 | Canonical locations and typed attributes regressions remain green. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.8 | Phase 2B screens usable on desktop/tablet/mobile. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 12.9 | No V1 production data is modified. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.1 | Frontend is deployed to the intended Render staging environment. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.2 | Backend/API is deployed to the intended Render staging environment. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.3 | Dedicated V2 Atlas staging database is confirmed. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.4 | Exact Git branch and commit hash are recorded. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.5 | Developer confirms deployed commit identity in writing. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.6 | Acceptance tests are run against the deployed staging build. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 13.7 | Deployment-specific changes and known issues are documented. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.1 | Run import with valid/error/duplicate rows. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.2 | Show import source/adapter/schema version in history. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.3 | Resolve an ambiguous duplicate. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.4 | Confirm audit + notification are produced. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.5 | Demonstrate verification metadata. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.6 | Demonstrate reusable external source/provider mapping. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.7 | Demonstrate completeness via shared rules. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.8 | Demonstrate website source queue. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.9 | Demonstrate availability freshness/conflict/priority. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.10 | Demonstrate temporary manual availability override and expiry behavior. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.11 | Demonstrate availability history. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.12 | Run safe bulk action and show audit/state-rule preservation. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.13 | Run combined canonical-location + price/availability + typed-attribute search. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.14 | Confirm Phase 2A regression suite remains green. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.15 | Confirm Render + Atlas + branch + exact commit deployment identity. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.16 | Demonstrate server-side pagination/sorting on a growing dataset. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.17 | Show/document important Phase 2B indexes and their query use-cases. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.18 | Demonstrate one concurrency/conflict protection case. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.19 | Demonstrate consistent validation/conflict API error shape. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.20 | Show an operation/correlation ID across one multi-step operation. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.21 | Run a bounded bulk action with mixed per-record outcomes. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.22 | Run realistic seeded-data search/performance check and record dataset size. | PASS | PASS | Project owner confirmation, 21 October 2026 |
| 14.23 | Confirm full Phase 1 + Phase 2A regression/verification suite remains green. | PASS | PASS | Project owner confirmation, 21 October 2026 |

Final result: **PASS (owner confirmed)**. Source code is unchanged by this acceptance-document update. No deployment or new application testing was performed for this packaging task.
