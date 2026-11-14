# Phase 4 production design and delivery plan

Updated: 2026-11-07 (Asia/Dhaka). Status: customer route implementation available for review; final visual sign-off and full acceptance pending.

This plan supersedes the hero experiments as the delivery direction. Follow the owner's UI/UX brief in [CONTEXT.md](CONTEXT.md), the controlling Rev 1.1 handover and all [148 acceptance requirements](ACCEPTANCE_STATUS.json). Preserve accepted Phase 3 architecture, existing Next.js application and shared V2 services.

The detailed [customer UX plan](UX_PLAN.md) defines journeys, screen-by-screen structure, search/filter semantics and enquiry behaviour before visual design. The [brand guide](BRAND_GUIDE.md) and [recorded colour tokens](BRAND_TOKENS.json) preserve the latest owner-selected muted ocean palette; older palette experiments are historical.

Latest: [customer implementation and evidence](CUSTOMER_IMPLEMENTATION_2026-11-07.md). The original stages below remain the full delivery/acceptance roadmap; they are not all complete.

## Historical planning baseline and remaining risks

- `/phase4-preview` and its liveaboard detail are isolated fixture prototypes. Browser checks establish preview behaviour, not production readiness or integrated acceptance.
- Actual customer routes remain `/explore/liveaboards`, `/explore/resorts`, `/liveaboards/[slug]` and `/resorts/[slug]`. The liveaboard search currently uses basic fields/client fetching; its detail uses existing V2 components and server-side data.
- Repeated hero changes have not established an approved marketplace-wide system. Historical CSS contains overlapping treatments; historical review notes cite incompatible palettes and directions.
- Generated diver artwork is atmosphere artwork, not proof of a destination, vessel or customer experience. Listing and detail media must represent the actual product.
- Shared query, availability, effective-price, offer and enquiry contracts still need reconciliation. See [API_INTEGRATION_MAP.md](API_INTEGRATION_MAP.md); its observations must be rechecked during implementation.

Do not deploy or promote the current prototype as a completed marketplace. Do not repeat isolated hero polishing as the primary workstream.

## Design decisions to use in the first proposal

- Premium travel marketplace: restrained typography, useful imagery, generous but purposeful spacing, clear information hierarchy. Main navigation: Home / About us / Contact; mobile has an app-like shell with safe labelled bottom navigation. About us/Contact pages are planned additions within the existing frontend.
- Preserve the original Deeparture logo artwork. Use its existing white version on dark imagery; do not recolour or redraw it casually.
- Ocean palette: #071925 text/actions, #123749 and #294E5C dark surfaces, #50636B secondary text, #527787/#6D919D supporting accents, #9DB7C3 pale accents. Use white/off-white content surfaces; light palette colours must not reduce text contrast. Semantic errors/success need separately tested accessible colours.
- One heading family and one body family from the existing licensed local fonts. Define a restrained type scale, spacing scale, container widths, corner radii, borders, focus and elevation tokens.
- No decorative DEEP word, pause/number controls, autoplay carousel or unnecessary arrow/icon clutter. Use icons only where they improve comprehension.
- Homepage hero introduces Deeparture with a clear “Find a trip” CTA leading to a separate search/results page. No embedded homepage search form or interactive search-results module. Include curated popular/featured trips and liveaboards linking to details or the finder. Reuse `/explore/liveaboards` and `/explore/resorts`; their main search controls are immediately accessible under a compact introduction.
- Use short factual copy. No invented ratings, urgency, verified claims, savings, testimonials or availability. Unknown dietary/accessibility support must remain unknown, not silently become unsupported or confirmed.

These are proposal constraints, not a claim that any existing hero is approved. Present the complete page composition before production rollout.

## Delivery sequence and gates

| Stage | Concrete output | Exit condition |
| --- | --- | --- |
| 1. Audit and customer journey | Route/component inventory; requirement-to-screen map; search → compare → detail → departure/package → enquiry journey; endpoint/field/state matrix. | Every requested feature has an owning screen and shared data source; missing contracts and product differences are recorded. |
| 2. Layout and interaction design | Mobile-first wireframes for search/results and one complete liveaboard detail; desktop/tablet adaptations; filter and enquiry flow definitions. | Customer can understand where to search, compare and enquire; key information and controls are present without decorative placeholders. |
| 3. Visual direction and design system | One coherent polished search/results page and one full liveaboard detail in the existing application, plus component/state sheet and review captures. | Owner approves the two complete pages and mobile behaviour. Approval recorded explicitly; individual image preferences are not whole-design approval. |
| 4. Shared V2 contract implementation | Rechecked endpoint mapping, backwards-compatible service fixes where required, typed taxonomy, consistent query/response mapping and integration tests. | Search/detail/enquiry agree on the same product/departure, effective price, offer and availability; no frontend business-rule duplication. |
| 5. Production customer frontend | Approved shared components applied to actual liveaboard routes, then product-specific resort routes and enquiry flow. | End-to-end journeys run on isolated real V2 data; all UI states work and fixture code is excluded from production customer flows. |
| 6. SEO, responsive performance and PWA | Crawlable useful pages, metadata/canonicals/facet policy, media optimization, manifest and safe service-worker/offline behaviour. | Applicable handover SEO/PWA requirements pass; stale availability and personal submissions are not served as current or cached unsafely. |
| 7. Acceptance and release preparation | Requirement evidence, regression results, accessibility/performance/browser reports, release/rollback instructions and source identity. | Applicable checklist rows verified locally and on authorized staging; owner reviews final release candidate; deployment is separately authorized. |

Stages 1–3 come first. Reversible contract investigation can run alongside design; applying the visual system across the full site waits for the explicit visual approval gate. No new frontend framework, separate app or unsolicited plugin installation is needed.

## Representative search/results page

Design the information architecture before final decoration:

1. Navigation with original logo and clear liveaboard/resort entry points.
2. Main search controls: destination, dates, trip length and price. Labels remain visible; date semantics are explicit and differ appropriately for stays versus departures.
3. Results count, applied-filter summary, clear/reset actions and supported sort options.
4. Advanced filters grouped into availability/offers, Vegan Rating, dietary, accessibility, diving and facilities. Desktop panel and phone drawer use the same taxonomy and selection semantics. Drawer supports Apply, Cancel and Reset, focus containment and focus restoration.
5. Visual cards with actual vessel/resort image, name/location, matching dates/duration, effective starting price/currency/basis, valid offer, availability and a few decision-relevant attributes. No misleading vessel image borrowed from an unrelated reef photograph.
6. Deterministic pagination and shareable URL state. Reload/back/forward retain filters, sort and page. Changing criteria resets page correctly.

Include loading, initial, populated, zero-result, failed request/retry, missing image, unavailable price and unknown/stale availability states. Handle outdated responses from rapid filter changes without replacing newer results.

## Representative liveaboard detail page

- Product identity, destination, gallery and clear summary above the fold.
- Overview, relevant dietary/accessibility/diving information and facilities; avoid unexplained badge walls.
- Itinerary/route and trip-length presentation, cabin descriptions and images.
- Departure list with dates, availability, cabin context, effective price, currency/basis and valid offers. Keep sold-out, on-request and unknown states distinct.
- Enquiry CTA carries the selected departure/itinerary/cabin context, where supported. Mobile sticky CTA must not obscure content, keyboard, gallery or form controls.
- Accessible gallery, useful missing-media states and usable published pages without bookable inventory.
- Enquiry validation, pending, server success, failure/retry and duplicate-submit protection. Claim success only after server acceptance; retain Admin-review delivery flow and test email transport.

Resorts follow after visual approval and adapt the pattern for rooms, packages, stay dates, seasonal rates and occupancy. Do not relabel vessel concepts as resort concepts.

## Review package for the owner

Prepare a concrete review before requesting approval:

- Search/results and one full liveaboard detail at 390px and 1440px, with 768px behaviour demonstrated; also check 320px and wide desktop.
- Phone filter drawer open, populated card comparison and departure-to-enquiry selection.
- Component sheet: colours, fonts, spacing, buttons, fields, cards, pricing, availability, offers and inclusive-travel attributes.
- Representative loading/error/empty/unknown states, not only the ideal screenshot.
- One short list of design decisions to approve and any genuine unresolved data limitations.

Use one preferred direction. Record feedback against specific components; freeze approved tokens/layout before expanding to the remaining pages. Keep historical experiments for provenance, but remove them from the authoritative current-review pointer.

## Production acceptance criteria

- **Truthful data:** filtering conditions match the same eligible departure/package. Active/expired offers, source freshness, disabled sources, price basis and currency handled in shared V2 services. Unknown information displayed honestly.
- **Usability:** visible labels, logical keyboard order, clear focus, accessible errors and status announcements, drawer/gallery Escape and focus return. Target WCAG 2.2 AA; verify normal text contrast >=4.5:1 and large text/UI contrast as applicable. No horizontal page overflow at 320/390/768/1440px; support zoom and reduced motion.
- **Responsive layout:** deliberate mobile cards/drawers/departures/forms, readable desktop comparisons, no clipped controls or obstructive sticky UI. Header/hero/content alignment checked geometrically and visually.
- **Performance:** responsive compressed images with dimensions and appropriate loading priority; avoid shipping unused original PNGs to the browser. Measure production-build LCP/CLS/INP where possible; target LCP <=2.5s, CLS <=0.1, INP <=200ms using representative conditions. Lab results do not establish field performance.
- **Architecture:** reuse existing API client/config and shared services, preserve protected Admin/Operator behaviour, no fixture inventory or frontend pricing/availability algorithms in live routes.
- **SEO/PWA:** implement exact Rev 1.1 requirements, index only intended public pages, preserve preview guards/noindex, avoid caching personal data and stale commercial confirmation; test actual install/update/offline states.
- **Evidence:** frontend production build, meaningful API/domain/browser tests, required Phase 1–3 regressions and all applicable Phase 4 checklist evidence. Never substitute preview-check totals for full acceptance.

## Implementation boundaries and next action

Current work remains uncommitted local visual refinements on main after the earlier preview merge. Preserve unrelated user changes. Before implementation, isolate new work on a focused Phase 4 branch; do not commit/push/deploy as part of this planning task.

Next action: complete Stage 1's screen/data-state matrix and Stage 2's search/results + detail wireframes. Then build the Stage 3 review package and request visual approval of that concrete result. Do not restart another image-generation or hero-only revision unless the owner specifically requests it.

No delivery dates are committed here. Estimate implementation after the audit identifies service gaps and the visual review scope is stable.
