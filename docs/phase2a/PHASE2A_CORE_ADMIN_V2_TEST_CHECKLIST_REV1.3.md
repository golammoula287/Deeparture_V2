# Deeparture V2 - Phase 2A Acceptance Test Checklist
## Code-Aware Revision 1.3

Use this checklist against the Phase 1 source supplied in `DPHandover_V2.zip`.

> Phase 2A acceptance is based on extending the existing working Phase 1 code. A passed Phase 1 capability should not be rebuilt unnecessarily; it must remain regression-tested.

## Test environment

- Admin V2 URL: __________________________________________
- Frontend staging URL: __________________________________
- Backend/API URL: _______________________________________
- GitHub branch: _________________________________________
- Deployed commit: _______________________________________
- Atlas staging DB name: _________________________________
- Test date / tester: ____________________________________

## 1. Baseline Identity & Regression

- [ ] **The reviewed Phase 1 working tree has been committed.**  
  _Verify:_ Full commit hash recorded.
- [ ] **Render frontend/backend use the recorded commit.**  
  _Verify:_ Deployment revision matches the handover baseline plus Phase 2A changes.
- [ ] **V2 staging uses a dedicated Atlas database.**  
  _Verify:_ Database name is documented and separate from V1 production.
- [ ] **Phase 1 regression suite remains green.**  
  _Verify:_ Auth, ownership, pricing, claims, imports, public pages/search and browser checks still pass or have documented intentional replacements.

## 2. Admin V2 Access & Layout

- [ ] **Dedicated `/admin/v2` area exists.**  
  _Verify:_ It is not merely the existing operator organisation dashboard.
- [ ] **Admin can access Admin V2.**  
  _Verify:_ Valid admin session works.
- [ ] **Operator cannot access Admin V2.**  
  _Verify:_ Frontend and backend both reject access.
- [ ] **Admin navigation works on desktop/tablet/phone.**  
  _Verify:_ No critical squeezed table/navigation layout.

## 3. Admin Dashboard

- [ ] **Dashboard shows liveaboard/resort totals.**  
  _Verify:_ Counts match database.
- [ ] **Dashboard shows draft/pending counts.**  
  _Verify:_ Counts reflect moderation states.
- [ ] **Dashboard shows unclaimed/invited/claimed organisations.**  
  _Verify:_ Claim-state counts are separate from listing publication states.
- [ ] **Dashboard shows pending admin enquiries.**  
  _Verify:_ Links open the correct queue.

## 4. Catalogue Moderation

- [ ] **Admin can globally list/search/filter liveaboards.**  
  _Verify:_ Pagination/search/status/operator/destination filters work.
- [ ] **Admin can globally list/search/filter resorts.**  
  _Verify:_ Equivalent controls work.
- [ ] **Publication status supports draft/pending_review/published/restricted/archived.**  
  _Verify:_ Model/API/UI agree on statuses.
- [ ] **Public API returns only published listings.**  
  _Verify:_ Pending/restricted/archived records are not public.
- [ ] **Admin can publish/unpublish/restrict/archive.**  
  _Verify:_ Status changes persist and audit events are written.
- [ ] **Imported records do not publish by default.**  
  _Verify:_ New catalogue imports enter draft/pending review unless explicitly approved by Admin.

## 5. Draft & Pending Review

- [ ] **Draft queue works.**  
  _Verify:_ Admin can open/edit/preview a draft.
- [ ] **Pending-review queue works.**  
  _Verify:_ Admin can approve/publish or reject/archive.
- [ ] **Basic listing can publish without current availability.**  
  _Verify:_ Catalogue-first model remains intact.

## 6. Normalized Import Architecture

- [ ] **CSV parser still works.**  
  _Verify:_ Existing parser remains functional as an adapter.
- [ ] **XLSX parser still works.**  
  _Verify:_ XLSX remains preferred human/admin source.
- [ ] **Source adapters map to normalized DTOs.**  
  _Verify:_ OrganisationImport/LiveaboardImport/ResortImport or equivalent are documented.
- [ ] **Core import service does not depend on spreadsheet header names.**  
  _Verify:_ Spreadsheet-specific names stay in adapter/mapping layer.
- [ ] **Parser/adapter does not write catalogue records directly.**  
  _Verify:_ Commit happens only after preview/confirmation.
- [ ] **Standard XLSX structure is documented.**  
  _Verify:_ Operators/Liveaboards/Resorts sheets or documented equivalent.

## 7. Import Preview / Commit

- [ ] **Upload creates a no-write preview.**  
  _Verify:_ Database catalogue records are unchanged before confirmation.
- [ ] **Preview classifies CREATE.**  
  _Verify:_ New records are identified.
- [ ] **Preview classifies UPDATE.**  
  _Verify:_ Existing records are matched.
- [ ] **Preview classifies DUPLICATE_REVIEW.**  
  _Verify:_ Ambiguous records are not silently merged.
- [ ] **Preview classifies ERROR/SKIP.**  
  _Verify:_ Row reason is human-readable.
- [ ] **Admin confirmation commits the batch.**  
  _Verify:_ Only confirmed rows write to catalogue.
- [ ] **Batch result records row outcomes.**  
  _Verify:_ Batch ID + counts + row results available.
- [ ] **Re-import preserves stable record IDs where matched.**  
  _Verify:_ Existing Phase 1 idempotent behaviour remains.

## 8. Organisations & Claiming

- [ ] **Admin can create an unclaimed operator organisation.**  
  _Verify:_ No operator user account is required.
- [ ] **Same organisation can own liveaboards and resorts.**  
  _Verify:_ Existing shared-organisation model remains.
- [ ] **Admin can suspend/reactivate an organisation.**  
  _Verify:_ Organisation state is enforced.
- [ ] **Admin can send a single claim invitation.**  
  _Verify:_ Existing secure claim service is reused.
- [ ] **Claim token remains hashed, expiring and single-use.**  
  _Verify:_ Phase 1 security regression passes.
- [ ] **Claim attaches user to existing organisation.**  
  _Verify:_ Existing listings remain attached; no duplicate organisation is created.

## 9. Attributes

- [ ] **Admin can list active/inactive attribute definitions.**  
  _Verify:_ Admin view is not limited to public active definitions.
- [ ] **Admin can create/edit/deactivate attributes.**  
  _Verify:_ Facilities/dietary/accessibility/diving can be maintained without core model rewrite.
- [ ] **Filterable/public/applicableTo/dataType controls work.**  
  _Verify:_ Existing extensible model is preserved.

## 10. Locations & Ports

- [ ] **Admin can CRUD canonical locations.**  
  _Verify:_ Country/region/destination/port supported.
- [ ] **Catalogue/itinerary can reference canonical Location IDs.**  
  _Verify:_ Identity is not dependent on free-text spelling.
- [ ] **Existing slug-based search still works during transition.**  
  _Verify:_ Structured-reference change does not regress public search.
- [ ] **Aliases/case variants do not create accidental duplicate filters.**  
  _Verify:_ Canonical matching/validation works.

## 11. Admin-First Enquiry Workflow

- [ ] **New customer enquiry persists as pending Admin review.**  
  _Verify:_ It is not immediately marked `sent_to_operator`.
- [ ] **Customer acknowledgement is sent/generated.**  
  _Verify:_ Staging-safe transport.
- [ ] **Admin receives notification/queue item.**  
  _Verify:_ Operator has not yet received the enquiry.
- [ ] **Admin can approve enquiry.**  
  _Verify:_ Valid state transition is persisted.
- [ ] **Operator is notified only after Admin approval.**  
  _Verify:_ Correct organisation recipients.
- [ ] **Email failure does not lose the enquiry record.**  
  _Verify:_ Persistence remains authoritative.
- [ ] **Admin can reject/spam/close as configured.**  
  _Verify:_ Invalid state jumps are prevented.

## 12. Normalized Availability Service

- [ ] **A documented Availability Service exists.**  
  _Verify:_ Manual/import code does not own separate availability business logic.
- [ ] **Normalized availability-update contract exists.**  
  _Verify:_ IDs, status/quantity, source and timestamps are defined.
- [ ] **Liveaboard availability import routes through the service.**  
  _Verify:_ `inventoryImport.service.js` no longer directly owns final availability write logic.
- [ ] **Manual departure availability routes through the service.**  
  _Verify:_ `inventory.controller.js` delegates to common service.
- [ ] **Resort availability routes through the service.**  
  _Verify:_ Direct model upsert is moved behind the service boundary.
- [ ] **Stable liveaboard inventory upsert works.**  
  _Verify:_ Same departure+cabin update modifies the intended inventory rather than creating duplicates.
- [ ] **Source type and update timestamps are returned.**  
  _Verify:_ Effective inventory can state where/when it was updated.
- [ ] **Search/public consumer uses effective availability.**  
  _Verify:_ Consumer need not know if source was Admin/CSV/XLSX.
- [ ] **Availability is not labelled live solely because a value exists.**  
  _Verify:_ Future freshness semantics remain possible.

## 13. Audit & Email Regression

- [ ] **Moderation actions create audit records.**  
  _Verify:_ Publish/restrict/archive tracked.
- [ ] **Import commit creates audit record.**  
  _Verify:_ Batch identity included where appropriate.
- [ ] **Enquiry approval/rejection creates audit record.**  
  _Verify:_ Actor/action/entity/time visible.
- [ ] **No passwords/raw claim tokens/secrets enter audit payloads.**  
  _Verify:_ Security review passes.
- [ ] **Existing safe email transport remains functional.**  
  _Verify:_ Test-mode regression passes.

## 14. Mobile / Responsive

- [ ] **Admin dashboard usable on phone.**  
  _Verify:_ No critical horizontal squeeze.
- [ ] **Catalogue moderation usable on phone.**  
  _Verify:_ Publish/restrict actions are touch-friendly.
- [ ] **Enquiry approval usable on phone.**  
  _Verify:_ No hover-only control.
- [ ] **Import preview usable at least on desktop/tablet.**  
  _Verify:_ Mobile may be simplified, but no broken page.

## 15. End-to-End Phase 2A Demonstration

- [ ] **Create/import an unclaimed organisation.**
- [ ] **Upload one liveaboard and one resort.**
- [ ] **See preview before database commit.**
- [ ] **Confirm import and receive batch result.**
- [ ] **Records enter draft/pending review, not public by default.**
- [ ] **Admin reviews and publishes both.**
- [ ] **Automatic public pages appear.**
- [ ] **Send claim invitation and claim existing organisation.**
- [ ] **No duplicate organisation/listing is created.**
- [ ] **Submit customer enquiry; confirm Admin receives it before operator.**
- [ ] **Admin approves; operator then receives it.**
- [ ] **Update a test departure through Availability Service.**
- [ ] **Repeat same inventory update; confirm stable upsert.**
- [ ] **Public/API response includes effective availability source/update metadata.**
- [ ] **Phase 1 pricing/claim/search/public-page regressions remain green.**

## Final Result

- [ ] **PASS - Phase 2A accepted**
- [ ] **PASS WITH ISSUES - non-critical issues documented**
- [ ] **FAIL - Phase 2A not ready for Phase 2B**

### Outstanding issues

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
4. _________________________________________________

## Next Phase

Once this passes, proceed to **Phase 2B - Admin Automation & Management Enhancements**.
