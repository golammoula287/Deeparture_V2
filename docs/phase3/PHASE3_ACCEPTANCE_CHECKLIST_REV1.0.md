# Deeparture V2 — Phase 3 Operator Portal V2 Acceptance Checklist
## Revision 1.0

Record: frontend URL, backend/API URL, Git branch, full commit, Render Live commit(s), Atlas V2 staging environment, test date/tester.

## 1. Baseline & Regression
- [ ] Phase 3 is based on Phase 2B commit `01cb93ea3ce312ef0227099bd224094b2072ddb8` or a documented descendant.
- [ ] Phase 1 regression checks remain green.
- [ ] Phase 2A regression checks remain green.
- [ ] Phase 2B availability/source/freshness fixes remain green.
- [ ] Frontend production build passes.

## 2. Operator Authentication & Organisation Isolation
- [ ] Operator can open `/operator/v2` after login.
- [ ] Legacy `/dashboard/v2` redirects to Operator Portal.
- [ ] Operator sees only organisations where they have an active membership.
- [ ] Operator A cannot read or mutate Operator B organisation IDs.
- [ ] Suspended organisation access is rejected.

## 3. Dashboard
- [ ] Vessel/resort counts are correct.
- [ ] Incomplete listing queue is shown.
- [ ] Upcoming departures are shown.
- [ ] Stale availability count is shown.
- [ ] Availability conflict count is shown.
- [ ] Active-offer count is shown.
- [ ] Active enquiries and unread notifications are shown.

## 4. Organisation Profile & Team
- [ ] Admin/owner can edit organisation contact/profile fields.
- [ ] Concurrent profile update returns conflict instead of silent overwrite.
- [ ] Team members and roles are visible.
- [ ] Admin/owner can send a team invitation.
- [ ] Invitation token is not stored raw.
- [ ] New user can accept an invitation and create an account.
- [ ] Existing user must use their existing password.
- [ ] Wrong email/account cannot consume an invitation.
- [ ] Last active owner cannot accidentally be removed/demoted.
- [ ] Viewer/editor/reservations/admin permissions are enforced server-side.

## 5. Liveaboard Management
- [ ] Operator can create a draft vessel.
- [ ] Operator can edit allowed vessel profile fields.
- [ ] Deeparture-controlled ratings/publication fields cannot be edited by operator.
- [ ] Operator can add/edit cabin types.
- [ ] Operator can create/edit itineraries.
- [ ] Itinerary base cabin pricing can be maintained.
- [ ] Operator can create/edit departures.
- [ ] Departure price overrides use the shared pricing service.
- [ ] Offers use the shared pricing service.
- [ ] Availability writes use the shared normalized Availability Service.
- [ ] Operator can mark its own listing `operator_verified` but cannot set `deeparture_verified`.

## 6. Resort Management
- [ ] Operator can create a draft resort.
- [ ] Operator can edit allowed resort profile fields.
- [ ] Operator can create/update room types.
- [ ] Operator can create/update packages.
- [ ] Operator can create/update seasonal rate periods.
- [ ] Resort availability updates use normalized Availability Service.
- [ ] Stop-sell is supported for resort inventory.

## 7. Structured Attributes
- [ ] Operator can view applicable active/public attribute definitions.
- [ ] Boolean attributes work.
- [ ] Numeric attributes work.
- [ ] Select attributes validate allowed values.
- [ ] Multi-select attributes validate/store allowed values.
- [ ] Attribute changes refresh shared search facets rather than creating parallel operator-only fields.

## 8. Media
- [ ] Operator can attach/manage image URLs for owned vessel/resort.
- [ ] Media asset is organisation/entity scoped.
- [ ] Operator-created media remains source-attributed.
- [ ] Operator cannot self-approve media usage unless separately authorized/admin.
- [ ] Existing gallery URL backfill dry run is safe and idempotent.

## 9. Enquiries & Notifications
- [ ] Operator sees only enquiries sent to its organisation after Admin approval.
- [ ] Reservations role can accept/reply/quote.
- [ ] Invalid enquiry state jumps are rejected.
- [ ] Operator notifications are recipient/user or organisation scoped.
- [ ] Unread count works.
- [ ] Notification links open the Operator Portal.

## 10. Operator XLSX/CSV Imports
- [ ] XLSX works.
- [ ] CSV works.
- [ ] Upload creates a no-write preview.
- [ ] Required/reference errors are visible by row.
- [ ] Commit is a separate explicit action.
- [ ] Commit reuses shared inventory import service.
- [ ] Import history is organisation scoped.
- [ ] Re-upload/upsert behavior does not duplicate stable departures.

## 11. Mobile / Responsive
At minimum test widths approximately 390px, 768px and desktop.
- [ ] Navigation is usable on phone.
- [ ] Quick availability update is usable on phone.
- [ ] Enquiry response is usable on phone.
- [ ] Offer/price update is usable on phone.
- [ ] Image/media task is usable on phone.
- [ ] No critical horizontal squeeze or hover-only action.

## 12. Deployment Identity
- [ ] Frontend Render Live commit recorded.
- [ ] Backend Render Live commit recorded.
- [ ] Exact Git branch/full commit recorded.
- [ ] Dedicated Atlas V2 staging database confirmed.
- [ ] Media migration result recorded if applied.
- [ ] No secrets or `.env` files committed.

## Final Result
- [ ] PASS — Phase 3 accepted
- [ ] PASS WITH ISSUES — non-critical issues documented
- [ ] FAIL — Phase 3 not ready for Phase 4

Next phase: Phase 4 — Customer Frontend V2 + PWA.
