# Deeparture V2 - Phase 2A Implementation Delta from Uploaded Phase 1
## Revision 1.3

This is the short engineering delta to use alongside the full Phase 2A README.

| Component | Current Phase 1 state | Phase 2A action |
| --- | --- | --- |
| Auth/JWT | Working, role-aware | REUSE; add `/admin/v2` route protection |
| Organisation memberships | owner/admin/editor/reservations/viewer | REUSE |
| Ownership security | Server-side organisation ownership checks | REUSE |
| Admin UI | No dedicated Admin V2 | BUILD NEW |
| Shared dashboard | Operator-style `/dashboard/v2` | KEEP for operator foundation; BUILD separate admin dashboard |
| Vessel/resort CRUD | Organisation-scoped create/update exists | EXTEND with global admin list/filter/moderation/actions |
| Publication status | draft/published/archived | EXTEND with pending_review/restricted |
| Import publication | Imported records publish by default unless `publish=false` | CHANGE default to draft/pending review |
| CSV/XLSX parser | Working; XLSX reads first worksheet | REUSE low-level parser; add mapping/workbook adapter layer |
| Catalogue import | Direct source-row -> Mongo model writes | REFACTOR into normalized DTO -> validate/match -> preview -> confirm -> commit |
| Inventory import | Direct source-row -> itinerary/departure/resort writes | REFACTOR gradually behind normalized services |
| Import preview | None | BUILD NEW, no-write preview |
| Duplicate classification | Implicit matching exists | EXTEND into CREATE/UPDATE/DUPLICATE_REVIEW/ERROR/SKIP |
| Import batch identity/result | Basic immediate response only | EXTEND with batch/result record |
| Claim security | Strong; hashed expiring one-time token | REUSE |
| Claim Admin UX | Bulk endpoint only, no proper admin workflow UI | EXTEND / BUILD UI |
| Attributes backend | Extensible definitions + product attrs | REUSE; BUILD admin management UI |
| Locations | Model exists | EXTEND with CRUD + structured references/dual-write slugs |
| Enquiries | Immediately emails operator and sets `sent_to_operator` | REFACTOR to Admin-first approval workflow |
| Email transport | Safe test/live transport exists | REUSE; split notification functions by workflow stage |
| Pricing | Base -> override -> offer -> effective price tested | REUSE |
| Liveaboard availability | Embedded departure array, import replaces array | REFACTOR through normalized Availability Service + stable inventory upsert |
| Resort availability | Direct `findOneAndUpdate` | REFACTOR through same Availability Service boundary |
| Availability source metadata | Departure-level source; resort source fields exist | EXTEND to inventory-level/effective source + timestamps |
| Public pages | Dynamic vessel/resort pages work | REUSE |
| Search | DB-level filtering works | REUSE; keep compatible during location/availability refactor |
| Audit | Model/service exists, limited use | EXTEND coverage |
| Mobile | Starter pages locally pass viewport tests | New Admin V2 must maintain responsive standard |

## Highest-priority Phase 2A code changes

1. Build dedicated Admin V2 frontend + global admin APIs.
2. Add moderation statuses and change imports to default to draft/pending review.
3. Refactor imports into normalized adapter/DTO/preview/confirm/commit pipeline.
4. Restore Deeparture Admin-first enquiry approval before operator notification.
5. Introduce normalized Availability Service and route manual/import writes through it.
6. Add Location admin CRUD and transition from uncontrolled strings/slugs to canonical IDs without breaking current search.

## Do not duplicate

Do not replace the working claim flow, pricing service, organisation membership model, ownership checks, dynamic public pages, public search foundation, or low-level CSV/XLSX parsing without a specific defect.
