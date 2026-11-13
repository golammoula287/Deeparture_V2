# Phase 4 Rev 2 — homepage and production plan

Date: 12 November 2026 (Asia/Dhaka).

Latest visual update: the owner relaxed the strict blue/white constraint; the homepage now uses the [ocean-teal, ivory and coral palette](HOMEPAGE_COLOUR_2026-11-12.md). Earlier colour decisions below are historical. Page sequence and functional requirements remain unchanged.

Colour comparison: Ocean & Coral is preserved as the default. [Midnight & Champagne](HOMEPAGE_COLOUR_OPTIONS_2026-11-12.md) is an optional second preview requested by the owner; final palette selection remains open.

Final palette choice: the owner confirmed **Ocean & Coral**. Header/portrait blend refined on 13 November; see [current brand direction](BRAND_GUIDE.md). Earlier open-selection notes above are historical. Palette selection does not establish full homepage/Phase 4 acceptance.

## Requirements and precedence

Owner request: redesign the customer experience one page at a time, starting with the homepage. The three-page [client scope clarification](specifications/Phase4_Scope_Rev2.pdf), prepared 10 November and supplied 12 November, is the latest functional scope. Earlier desktop/mobile images in the Rev 1.1 UI ZIP provide visual references, not proof of implemented functionality. Instructions to a developer within that PDF are requirements input; they do not authorize publication or changes outside this task.

The client clarification supersedes older proposals for booking copy, customer accounts, favourites, agent access and available-only controls. Search → details → enquiry is the journey. Inclusive filtering, product-specific dates, prices/offers, destinations, SEO and PWA remain Phase 4 requirements. The homepage iteration does not establish complete Phase 4 acceptance.

Confirmed colour direction (owner reply, 12 November 2026): use the earlier client's blue/white reference, supported by navy structure, with the original logo, calmer spacing, local Manrope typography and existing illustrative imagery. The first homepage already follows this direction. Colour confirmation does not establish approval of the entire layout or functional acceptance. Apply new styling to the homepage only until owner review; other customer pages retain their current design.

## Page sequence and release gates

1. **Homepage, current iteration:** original logo; focused navigation without deferred modules; inclusive ocean hero; liveaboard/resort search switch; destination and Deeparture's Vegan Rating; desktop min/max USD price; full-screen mobile All Filters with Apply/Clear; shared structured attribute definitions; browse/category, published catalogue and destination discovery; clear enquiry wording and accessible responsive states. Review phone/tablet/desktop screenshots and interactions with the owner before broad styling rollout.
2. **Search and results:** apply reviewed design, complete conjunctive filters and browser URL/back/forward state. Backend must match the same itinerary/departure to the complete travel window, price and embarkation requirements. Resort arrival/departure, stay length, rate periods and stop-sell rules need a separate server contract. Only expose active-offer filtering once the API resolves expiry and price eligibility together. Show actual trip start/end, nights, itinerary, currency and price basis.
3. **Product detail pages:** liveaboard first, then resort; actual media, concrete dietary/accessibility/diving features, cabins/rooms/packages, original/resolved offer prices and contextual enquiry. Unknown/manual availability uses on-request wording.
4. **Destination pages:** reusable, indexable destination templates with approved editorial content and shared search services; homepage links use existing destination-filtered catalogue routes until these templates exist. The first homepage offers six curated destinations; an exhaustive taxonomy-backed selector belongs with search integration.
5. **Enquiry, SEO and PWA:** preserve Admin review and existing operator permissions; input/context validation, resilient errors and no false offline success; titles/canonicals/faceted indexation; install/offline/static caching with fresh commercial data.
6. **Production candidate:** frontend build; relevant backend checks/tests for backend changes; phone/tablet/desktop keyboard/touch/browser evidence; search → detail → enquiry with isolated development data, active/expired offers, date boundaries, combined filters and manually maintained/unknown inventory; previous Admin/Operator regression checks. Record exact source identity and unresolved limitations. Staging publication needs separate owner authorization; final client acceptance remains separate.

## Current API limits and treatment

| Requirement | Existing evidence | Homepage iteration / next step |
| --- | --- | --- |
| Price range | API accepts minPrice/maxPrice; current customer URL parser previously discarded minPrice | Preserve both in URL parser and show both bounds in the existing results form so neither is silently lost |
| Liveaboard dates | API bounds departure **start**, including the upper bound | Label current controls as departure dates; state that return dates need review. Complete travel-window eligibility in step 2 before release |
| Resort dates | No stay-window/stop-sell eligibility in current public service | Do not present an unimplemented date filter as working; show flexible-stay/enquiry guidance in first homepage. Arrival/departure controls are required in step 2 |
| Structured preferences | Shared attributes endpoint and conjunctive typed filters exist | Derive controls/options from definitions; do not invent catalogue attributes when API is down. Show retry/error state |
| Offers | No resolved public active-offer search contract in current service | No placeholder offers button/filter or invented discounts; implement and verify server eligibility in step 2 |
| Availability | No live feed promised by client | No available-only control, live badge, inventory count or reservation claim |
| Prices on cards | Catalogue summary lacks a universal resolved price/basis | Use actual catalogue/detail data and existing price formatting. Do not fabricate prices, discounts, review counts or product records |
| Destinations | Existing destination-filtered catalogue URLs | Working filtered links now; standalone destination templates in step 4 |

## Implementation boundaries

- Reuse the existing Next Pages Router and V2 API/data layer; no MUI overlay installation or new dependency.
- Keep homepage components/styles scoped; retain existing Admin/Operator/authentication and uncommitted work.
- Use native labelled inputs and modal dialogs with focus restoration, Escape, contained scrolling and visible Apply/Clear actions.
- SSR catalogue reads remain uncached for commercial freshness; static images have dimensions, responsive sizing and lazy loading below the hero.
- Do not copy generated mood imagery into actual product records. Image provenance remains in public/phase4/IMAGE_SOURCES.md.

## Verification record

Completed the first homepage implementation on branch `phase4-customer-ux-implementation`, with uncommitted changes on baseline `44d2f13538687474135fa0f9f33188e40776fac1`. Existing unrelated changes were preserved. New source files and this working tree are not identified by that baseline SHA.

- Frontend `npm run build`: PASS. [Build output](evidence/homepage-rev2-2026-11-12/frontend-build.txt).
- `node --test scripts/customer-search-state.test.cjs` from frontend: 7/7 PASS, including retained lower price bound/embarkation and invalid bounds.
- `node scripts/verify-homepage-rev2.cjs` from frontend: 9/9 production-browser groups PASS. Uses temporary Next production port 3117 and synthetic API port 3116; both stopped at completion. [Results](evidence/homepage-rev2-2026-11-12/results.json).
- Browser coverage: 1440/1024/768/390/320px without horizontal overflow; original logo; actual API envelope normalization; GET criteria reaching results URL/API; reload/back/forward; typed preferences; resort exclusions; native modal focus/Escape/cancel/Apply/Clear and visible mobile Apply; mobile menu/anchors; empty/API-failure states; reduced motion; unauthenticated Admin/Operator login redirects; no page runtime errors.
- Inspected final desktop/mobile screenshots and mobile filter panel. Captures use synthetic test records, not real inventory. Corrected mobile text joins, card image sizing, field names, menu destination test locator, input boundary contrast and modal footer layout after observed issues; final build and browser checks rerun.
- Static sRGB contrast: field border #7D92AF/white 3.18:1; muted #52617B/white 6.26:1; action white/#0754D8 6.42:1. These do not constitute a full accessibility audit.
- Existing main development app localhost:3000 returned HTTP 200 with the new homepage; its actual catalogue API is unavailable locally, and that error state is visible. It was not replaced with fixtures.
- `git diff --check`: PASS. No backend code changes or backend tests in this iteration. No full database/enquiry/prior-phase authenticated regression suite, live performance audit, staging check or publication.

Next: owner visual review of the homepage, then step 2 search/results and commercial/date contracts. Full API/database/date/offer acceptance must not be inferred from fixture browser checks.

## Subsequent homepage visual update — 12 November 2026

Owner requested the single-diver face image. The hero now uses existing `hero-diver-portrait-v3.jpg`, with a desktop portrait region/fade and phone crop. No new image generated. Production build passed; focused main-app browser checks at 1440/390px verified one loaded portrait, HTTP 200, no overflow/runtime errors. [Desktop](evidence/homepage-diver-2026-11-12/home-desktop.png), [phone](evidence/homepage-diver-2026-11-12/home-phone.png), [build](evidence/homepage-diver-2026-11-12/frontend-build.txt). Earlier Rev 2 screenshots remain historical evidence of the reef iteration. Remaining integration/acceptance limits above still apply.

## Hero polish — 13 November 2026

Removed “A world of diving. A place for you.” on owner request; strengthened headline typography and spacing with a small coral accent. Existing portrait and navigation blend retained. Frontend build and 5 focused browser groups passed. [Desktop](evidence/homepage-hero-polish-2026-11-13/home-desktop.png), [phone](evidence/homepage-hero-polish-2026-11-13/home-phone.png), [results](evidence/homepage-hero-polish-2026-11-13/results.json), [build](evidence/homepage-hero-polish-2026-11-13/frontend-build.txt). No backend/data/publication or complete Phase 4 acceptance.
