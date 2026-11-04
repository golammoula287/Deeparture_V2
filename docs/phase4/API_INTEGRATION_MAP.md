# Phase 4 integration map — implementation preparation

Reviewed: 2026-11-05. These are code observations and planned integration checks, not API acceptance results. Backend source is unchanged in the design-review step.

| Area | Accepted code | Integration work / verification |
| --- | --- | --- |
| Public routes | `backend/src/v2/routes/public.routes.js`: liveaboard/resort lists/details, enquiries, attributes | Extend existing V2 boundaries; do not blindly mount the overlay router alongside equivalent endpoints. Standalone departure endpoint is not currently mounted here. |
| Frontend root | `frontend/pages/`, `@/*` maps to frontend root | Overlay `src/pages` routes and `@/components` examples must be relocated/reconciled; avoid duplicate `.js`/`.jsx` routes. |
| API client | `src/lib/v2Api.js`, `src/config/serverConfig.js` | Reconcile public customer client with existing URL base and `{success,data}` responses; retain protected-client authentication behaviour. |
| Pagination | `pagination.service.js`: `page`, `limit`; response `items,total,page,limit,pages,hasPrevious,hasNext` | Normalize overlay `pageSize` / `totalPages` centrally. Preserve existing callers. Sorting already includes `_id` as tie-breaker. |
| Sorts | Search allows `name`, `updatedAt`, `createdAt`, `completenessScore`, `veganRating` (and descending forms) | Effective-price and departure-date sorts need shared service support before exposing them in production controls. Define missing-value and mixed-currency semantics. |
| Date filters | Existing search uses `startDate` and `endDate` as bounds on departure start | Map overlay `startFrom`/`startTo`; validate dates/ranges centrally; document whether dates mean departure date or stay date for each product. |
| Attributes | Single legacy `facility`, `dietary`, `accessibility`; typed `attributes` and `attr_*` filters also exist | Reconcile plural/list controls with shared definitions and correct conjunction semantics; don't normalize an entire selected array into one facet string. Respect product applicability. |
| Diving controls | Structured typed attribute search exists | Map nitrox/photography/rebreather controls to shared definitions rather than an independent taxonomy. |
| Compound search | Current vessel selection intersects itinerary-eligible vessel IDs with departure-eligible vessel IDs | Test that duration/port/date/price/availability match the same eligible departure/itinerary, including negative cases with multiple itineraries on one vessel. |
| Availability | Current available-only search includes `on_request`; matching reads stored availability fields | Define confirmed available/limited versus enquiry-only eligibility, and enforce source freshness/disabled-source rules through shared resolution. Verify quantities/status from the same resolved record. |
| Prices / offers | Search reads effective departure mirrors; detail returns stored effective fields | Verify automatic active/expired offer resolution throughout search → detail → enquiry. Integrate shared pricing rather than frontend arithmetic; do not infer an offer from an old label. |
| Liveaboard detail | `getVesselBySlug` returns published vessel, active itineraries and future non-cancelled departures with selected cabin references | Provide required cabin/media/customer context and resolved commercial fields through the shared service. Inventory-free published pages must remain useful. |
| Resort detail | Controller returns published resort, active room types/packages/rate periods | Add accurate resolved availability/seasonal price context where supported; preserve incomplete-package enquiry states and product relationships. |
| Enquiry | Requires `productType: vessel/resort`, `product`, `customer`, `message`, optional `itinerary/departure/package` | Adapt overlay's `fullName/email/context` example centrally; preserve server-side relationship/organisation validation and Admin review before operator notification. |
| Cache | Existing liveaboard SSR sets `s-maxage=300, stale-while-revalidate=600` | Reassess HTML containing current prices/offers/availability; do not let PWA or intermediary caching imply stale confirmation. |
| Runtime | Current package declares Next.js 16 / React 19 | Integrate against accepted versions; no downgrade to match the overlay's older assumptions. |

The design fixtures under `frontend/src/lib/phase4/previewData.js` are intentionally separate from these contracts. Replace sample selection with shared server-side queries when implementing customer routes after visual review.
