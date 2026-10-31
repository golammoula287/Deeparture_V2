# Deeparture V2 - Phase 2B Admin Automation Acceptance Checklist

**Revision 1.3 - Architecture-aligned + implementation guardrails after Phase 2A completion.**

**Evidence for all 125 rows:** [Rev 1.3 row-by-row evidence](../REV1.3_ACCEPTANCE_EVIDENCE.md). Checkboxes below represent final staging acceptance and remain unchecked until corrected-deployment evidence is attached. The owner reports existing Render checks passed; local results are recorded separately.

Use this checklist to confirm **Phase 2B - Admin Automation & Management Enhancements** is complete before Phase 3.

## Test environment

- Admin V2 URL: https://deeparture-v2-1.onrender.com/admin/v2 (from project records)
- Frontend Render staging URL: https://deeparture-v2-1.onrender.com (from project records)
- Backend/API Render URL: https://deeparture-v2-3hr6.onrender.com (from project records)
- MongoDB Atlas staging DB/environment: PENDING — dedicated V2 database/index evidence not supplied
- Git branch: phase2b-rev1.3-review-fixes (local); deployed branch pending verification
- Exact deployed commit: PENDING — corrected working tree is not committed/deployed
- Test date: 20 October 2026 local verification; final-revision staging date pending
- Tested by: Codex (local automated checks); owner reports existing staging passed; staging tester name pending

## 1. Import History & Versioning

- [ ] **Import batches are stored.**  
  _Verify:_ Timestamp/user/source/type/results available.
- [ ] **Import adapter/source type is recorded.**  
  _Verify:_ History identifies the source adapter/contract.
- [ ] **Import schema/template version is recorded.**  
  _Verify:_ Later format versions can be traced.
- [ ] **Row-level errors are visible.**  
  _Verify:_ Admin can understand failures.
- [ ] **Affected records can be opened.**  
  _Verify:_ History is operational.
- [ ] **Partial failures are clearly reported.**  
  _Verify:_ No hidden state.
- [ ] **Retry/reprocess uses the normalized import pipeline.**  
  _Verify:_ No second importer/direct MongoDB write path.

## 2. Duplicate Reconciliation

- [ ] **Ambiguous matches enter review.**  
  _Verify:_ No silent merge.
- [ ] **Admin can choose existing/new.**  
  _Verify:_ Manual resolution works.
- [ ] **Resolved decision persists.**  
  _Verify:_ Future matching can reuse the decision/mapping where appropriate.
- [ ] **Reconciliation does not replace permanent Deeparture IDs.**  
  _Verify:_ External/source IDs remain mappings only.

## 3. Reusable Notifications

- [ ] **In-app notification records are created.**  
  _Verify:_ Import/claim/enquiry/etc.
- [ ] **Notification is recipient/audience aware.**  
  _Verify:_ Supports recipient user/organisation or audience such as admin/operator.
- [ ] **Unread count works.**  
  _Verify:_ Header/badge updates.
- [ ] **Notification links to correct record/action.**  
  _Verify:_ Actionable.
- [ ] **Notification service is reusable for Phase 3.**  
  _Verify:_ No Admin-only data model that would require an Operator notification subsystem later.
- [ ] **Email remains a channel/service, not controller-coupled business logic.**  
  _Verify:_ New notification types do not require duplicating workflow rules in email controllers.

## 4. Audit, Provenance & External Source Mapping

- [ ] **Important Admin actions create audit entries.**  
  _Verify:_ Actor/action/entity/time.
- [ ] **Bulk actions and verification changes create audit entries.**  
  _Verify:_ Same audit path as individual actions.
- [ ] **Sensitive secrets are excluded.**  
  _Verify:_ No passwords/raw tokens/API credentials in payloads.
- [ ] **Source type/URL/reference can be viewed.**  
  _Verify:_ Provenance visible.
- [ ] **Last checked/updated dates can be stored.**  
  _Verify:_ Future automation readiness.
- [ ] **Reusable external source/provider mappings exist.**  
  _Verify:_ Internal entity can map to provider/source external IDs without changing its Deeparture ID.
- [ ] **Mapping foundation is not availability-only.**  
  _Verify:_ Suitable for catalogue imports and later Phase 5 connectors as well.

## 5. Verification & Claim History

- [ ] **Admin can verify organisation/listing.**  
  _Verify:_ Separate from publication state.
- [ ] **Verification records who and when.**  
  _Verify:_ verifiedBy + verifiedAt or equivalent.
- [ ] **Verification records source/scope where relevant.**  
  _Verify:_ Not a provenance-free permanent boolean.
- [ ] **Verification can be revoked/marked stale.**  
  _Verify:_ History/audit remains visible.
- [ ] **Claim invitation history is visible.**  
  _Verify:_ Sent/expiry/resend/revoke/claimed.
- [ ] **Existing Phase 2A claim service is reused.**  
  _Verify:_ No second claim-token mechanism.

## 6. Completeness & Website Queue

- [ ] **Listing completeness indicator works.**  
  _Verify:_ Shows missing categories.
- [ ] **Completeness comes from shared/configurable rules.**  
  _Verify:_ Not frontend-only hard-coded checks.
- [ ] **Completeness supports different product types.**  
  _Verify:_ Liveaboard/resort rules can differ without duplicating UI logic.
- [ ] **Completeness does not block basic publication.**  
  _Verify:_ Informational only.
- [ ] **Website source queue accepts URL/product/operator.**  
  _Verify:_ Ready for Phase 5 extractor.
- [ ] **Website queue statuses work.**  
  _Verify:_ queued/draft_created/needs_review/etc.
- [ ] **Future website extraction is designed to feed normalized import service.**  
  _Verify:_ No direct catalogue-model write path is introduced.

## 7. Availability Source Management

- [ ] **Admin can see availability source and timestamps.**  
  _Verify:_ Effective availability displays source, sourceUpdatedAt and/or receivedAt.
- [ ] **Freshness state is calculated/configurable.**  
  _Verify:_ Test data can become fresh/aging/stale/unknown based on configured rule.
- [ ] **Stale does not mean sold out.**  
  _Verify:_ Aging beyond threshold does not change inventory to sold_out automatically.
- [ ] **Source priority can be configured.**  
  _Verify:_ Priority is data/configuration, not hard-coded universal provider ranking.
- [ ] **Conflicting source updates are detectable.**  
  _Verify:_ Admin can see two sources disagreeing for the same inventory.
- [ ] **Older/lower-priority data cannot silently replace accepted effective value.**  
  _Verify:_ Resolution is deterministic and reviewable.
- [ ] **Manual override works.**  
  _Verify:_ Admin can set value/status with reason and optional expiry.
- [ ] **Manual override is visibly identified.**  
  _Verify:_ Effective availability clearly shows override state.
- [ ] **Expired override stops controlling effective availability.**  
  _Verify:_ Resolution returns to applicable source value.
- [ ] **Availability history is traceable.**  
  _Verify:_ Source updates/effective changes/overrides can be reviewed.
- [ ] **Availability source configuration exists.**  
  _Verify:_ Provider/source, enabled state, priority, freshness threshold and sync metadata can be stored.
- [ ] **Provider/entity IDs reuse shared source mapping foundation where appropriate.**  
  _Verify:_ No isolated availability-only identity system.
- [ ] **No external provider connection is required to pass Phase 2B.**  
  _Verify:_ Connector-ready architecture only.
- [ ] **Future connectors write through Phase 2A Availability Service.**  
  _Verify:_ No second availability subsystem.

## 8. Shared Search & Typed Attribute Filtering

- [ ] **Advanced structured filters use the shared Search Service.**  
  _Verify:_ Country/destination/port/status/price/availability filtering is not page-only browser filtering.
- [ ] **Boolean filterable attributes work.**  
  _Verify:_ Example such as nitrox/rebreather support.
- [ ] **Numeric filterable attributes work.**  
  _Verify:_ Example such as vegan grade/minimum dives/rating threshold.
- [ ] **Controlled single-select/enum attributes work.**  
  _Verify:_ Exact controlled-value matching.
- [ ] **Controlled multi-select attributes work.**  
  _Verify:_ Appropriate contains/any/all semantics documented.
- [ ] **Structured fields and typed attributes combine in one query.**  
  _Verify:_ Canonical geography + price/availability + at least two attributes produce correct results.
- [ ] **Adding a new filterable attribute does not require a new product schema field.**  
  _Verify:_ Attribute-definition-driven extension remains intact.
- [ ] **Final customer filter UI is not required in Phase 2B.**  
  _Verify:_ Backend/search capability is proven; polished UI remains Phase 4.

## 9. Advanced Admin Tools & Bulk Actions

- [ ] **Advanced dashboard flags operational issues.**  
  _Verify:_ Stale/error/unclaimed/conflict/etc.
- [ ] **Safe bulk Admin actions work.**  
  _Verify:_ Confirm + result reporting.
- [ ] **Bulk actions enforce permissions/state rules.**  
  _Verify:_ Same domain/service methods as individual actions.
- [ ] **Bulk actions create audit records.**  
  _Verify:_ No direct DB mass update bypass.
- [ ] **Advanced catalogue filters work.**  
  _Verify:_ Status/source/completeness/location/availability/filterable attributes as designed.
- [ ] **Operational reporting is available.**  
  _Verify:_ Catalogue/import/claim/enquiry/availability summaries.

## 10. Event / Background-Job Readiness

- [ ] **Important side effects are behind service/event boundaries.**  
  _Verify:_ Controllers do not directly contain all notification/audit/background logic.
- [ ] **Key internal events can be represented.**  
  _Verify:_ e.g. import.completed, claim.completed, enquiry.approved, availability.updated.
- [ ] **A distributed event bus is not required.**  
  _Verify:_ Lightweight implementation is acceptable if boundaries are clear.
- [ ] **Future background workers can be added without rewriting domain workflows.**  
  _Verify:_ Sync/retry/staleness/email/indexing can attach to existing boundaries.


## 11. Engineering Guardrails - Migrations, Scale & Safety

- [ ] **Phase 2B schema/index/data changes have documented migration steps.**  
  _Verify:_ Forward change, affected models/collections and any backfill are documented.
- [ ] **Migration rollback/recovery approach is documented.**  
  _Verify:_ No destructive staging/production change relies on undocumented manual recovery.
- [ ] **Important Phase 2B query patterns have an indexing plan.**  
  _Verify:_ Notifications/audit/import history/source mappings/availability history/search fields have justified indexes where needed.
- [ ] **Growing operational datasets use server-side pagination/cursors.**  
  _Verify:_ Audit, notifications, import history/errors, claim history and availability/source history do not fetch entire datasets to the browser.
- [ ] **List APIs enforce bounded page sizes.**  
  _Verify:_ Client cannot request an unbounded result set.
- [ ] **Sorting is server-side and stable for paginated datasets.**  
  _Verify:_ Repeated paging does not reorder unpredictably.
- [ ] **Concurrency/lost-update protection exists where material.**  
  _Verify:_ Older Admin/import/source writes cannot silently overwrite newer accepted data in a demonstrated conflict case.
- [ ] **Conflict is returned/reported explicitly.**  
  _Verify:_ Conflict is visible rather than silently "last write wins" where data loss is possible.
- [ ] **New Phase 2B APIs use a consistent error contract.**  
  _Verify:_ Validation, permission, not-found, conflict and internal errors have predictable codes/shapes.
- [ ] **Client errors do not expose stack traces or secrets.**  
  _Verify:_ Safe API responses.
- [ ] **Multi-step operations have operation/correlation IDs.**  
  _Verify:_ Import/bulk/source operation can be traced across response, UI/history, audit/logs.
- [ ] **Bulk actions have sensible batch limits/chunking.**  
  _Verify:_ No unbounded mass operation.
- [ ] **Bulk actions expose per-record or partial outcomes.**  
  _Verify:_ Mixed success/failure is not hidden behind one opaque result.
- [ ] **Retention/archival readiness is documented.**  
  _Verify:_ Audit/business records can be distinguished from purgeable operational/technical records without damaging core state.
- [ ] **Realistic seeded-data performance check is completed.**  
  _Verify:_ Dataset size recorded; common Admin/search/history paths remain responsive and bounded.
- [ ] **No obvious N+1/full-collection query pattern is introduced.**  
  _Verify:_ Review main Phase 2B list/search/detail paths.
- [ ] **No unnecessary heavy infrastructure is introduced.**  
  _Verify:_ Redis/search engine/Kafka/Kubernetes/microservices are not added without a demonstrated requirement.

## 12. Regression, Mobile & Data Safety

- [ ] **Phase 2A import workflow still works.**  
  _Verify:_ Preview/confirm/commit remains intact.
- [ ] **Phase 2A claim workflow still works.**  
  _Verify:_ No duplicate organisation/listing created.
- [ ] **Phase 2A enquiry workflow still works.**  
  _Verify:_ Admin receives before operator.
- [ ] **Phase 2A pricing/search/public-page regressions remain green.**  
  _Verify:_ No regression.
- [ ] **Phase 2A Availability Service remains authoritative.**  
  _Verify:_ All new availability features extend it rather than replacing it.
- [ ] **Phase 1 + Phase 2A automated/regression verification remains green.**  
  _Verify:_ Accepted earlier-phase tests are rerun after Phase 2B changes.
- [ ] **Canonical locations and typed attributes regressions remain green.**  
  _Verify:_ Phase 2B changes do not break the filter/search foundations.
- [ ] **Phase 2B screens usable on desktop/tablet/mobile.**  
  _Verify:_ No critical layout break.
- [ ] **No V1 production data is modified.**  
  _Verify:_ Mandatory.

## 13. Deployment Identity

- [ ] **Frontend is deployed to the intended Render staging environment.**  
  _Verify:_ URL recorded above.
- [ ] **Backend/API is deployed to the intended Render staging environment.**  
  _Verify:_ URL recorded above.
- [ ] **Dedicated V2 Atlas staging database is confirmed.**  
  _Verify:_ Database/environment recorded above.
- [ ] **Exact Git branch and commit hash are recorded.**  
  _Verify:_ No local-only/uncommitted baseline ambiguity.
- [ ] **Developer confirms deployed commit identity in writing.**  
  _Verify:_ "This commit is the version currently deployed to the Deeparture V2 Render staging environment."
- [ ] **Acceptance tests are run against the deployed staging build.**  
  _Verify:_ Not local-only.
- [ ] **Deployment-specific changes and known issues are documented.**  
  _Verify:_ Clean handoff to Phase 3.

## 14. End-to-End Phase 2B Demonstration

- [ ] Run import with valid/error/duplicate rows.
- [ ] Show import source/adapter/schema version in history.
- [ ] Resolve an ambiguous duplicate.
- [ ] Confirm audit + notification are produced.
- [ ] Demonstrate verification metadata.
- [ ] Demonstrate reusable external source/provider mapping.
- [ ] Demonstrate completeness via shared rules.
- [ ] Demonstrate website source queue.
- [ ] Demonstrate availability freshness/conflict/priority.
- [ ] Demonstrate temporary manual availability override and expiry behavior.
- [ ] Demonstrate availability history.
- [ ] Run safe bulk action and show audit/state-rule preservation.
- [ ] Run combined canonical-location + price/availability + typed-attribute search.
- [ ] Confirm Phase 2A regression suite remains green.
- [ ] Confirm Render + Atlas + branch + exact commit deployment identity.
- [ ] Demonstrate server-side pagination/sorting on a growing dataset.
- [ ] Show/document important Phase 2B indexes and their query use-cases.
- [ ] Demonstrate one concurrency/conflict protection case.
- [ ] Demonstrate consistent validation/conflict API error shape.
- [ ] Show an operation/correlation ID across one multi-step operation.
- [ ] Run a bounded bulk action with mixed per-record outcomes.
- [ ] Run realistic seeded-data search/performance check and record dataset size.
- [ ] Confirm full Phase 1 + Phase 2A regression/verification suite remains green.

## Final Result

- [ ] PASS - Phase 2B - Admin Automation & Management Enhancements accepted
- [ ] PASS WITH ISSUES - non-critical issues documented
- [ ] FAIL - Phase 2B - Admin Automation & Management Enhancements not ready for Phase 3

### Outstanding issues

1. Exact corrected frontend/backend deployed commit identities and authenticated staging workflow evidence.
2. Dedicated V2 Atlas database/environment and index verification.
3. Record staging administrator maintenance execution after deployment/source changes.
4. Owner-reported existing deployment pass is recorded; final corrected-revision sign-off remains pending.

## Next phase

Once this passes, proceed to **Phase 3 - Operator Portal V2**.
