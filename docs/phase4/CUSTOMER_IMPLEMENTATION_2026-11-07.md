# Customer marketplace implementation — 7 November 2026

Status: requested customer layout and connected-route implementation completed locally on `phase4-customer-ux-implementation`; uncommitted. This is not full Phase 4 production/staging acceptance.

Latest colour/contrast refinement: [colour theory notes](COLOUR_THEORY_2026-11-07.md); browser report now contains 14 passing groups. Original 13-group run below is the earlier implementation baseline.

## Implemented

- Actual homepage `/`: approved reef atmosphere artwork, original logo and muted ocean palette, Find a trip navigation CTA, featured departures, a bounded liveaboard collection, resort entry and inclusive-travel/process content. No embedded search form, autoplay, giant decorative words or numbered/pause controls.
- Shared responsive customer shell: desktop Home / About us / Contact, original logo and Find a trip CTA; mobile app-like bottom navigation with active states, safe-area padding and footer operator access. Existing protected AuthProvider behaviour retained; legacy header hidden only for marked customer/preview pages.
- `/about-us` and `/contact`: substantive content and user-reference-sourced email/phone links, FAQs and product-enquiry guidance. No unsupported general contact submission form or fabricated team metrics.
- Dedicated `/explore/liveaboards` and `/explore/resorts`: server-backed V2 catalogue reads, optional destination/budget, supported liveaboard departure window/duration controls, supported sorting and pagination, URL-applied criteria, clear/remove actions, typed taxonomy filters and native-dialog preference drawer with explicit Apply/Cancel/Escape/focus restoration.
- Actual liveaboard/resort detail routes: gallery/dialog, overview, features, itinerary/cabin or room/package content, responsive departure/package cards, selected enquiry context and return-to-search URL.
- Shared enquiry form: visible labels, optional phone, required message/contact validation, duplicate-submit guard, pending/error states, persistent server-confirmed success, no reservation/price guarantee, preserved fields on failure.
- Backend compound-search correction: when itinerary criteria combine with departure criteria, the same itinerary must qualify. Public itinerary criteria use active itineraries; admin status scope preserved. No change to availability or offer policy.

## Data boundaries

The application imports no Phase 4 fixture inventory. Homepage reads existing published V2 catalogue/detail endpoints; finder delegates filtering/pagination to V2. Typed advanced choices come from the shared attribute-definition endpoint.

There is no popularity ranking contract, so homepage uses a featured/exploration treatment rather than invented popularity counts. List endpoints do not supply resolved commercial data; regular catalogue cards link to detail for dates/prices. Featured departure prices come from existing detail fields, with pricing-basis/availability confirmation wording. No frontend discount arithmetic, imaginary offers or summed available-space claims.

Catalogue failures, empty results, missing images/prices and detail/API failure are distinct. Detail content is `private, no-store`; a genuine missing product returns 404 and API failure returns retryable 503.

## Verification actually completed

| Check | Result |
| --- | --- |
| Frontend production build with loopback test API configuration | Passed |
| Frontend production build restored to normal configuration | Passed |
| `node --test frontend/scripts/customer-search-state.test.cjs` | 5/5 passed |
| `node scripts/verify-customer-marketplace.cjs` from `frontend/` | 13/13 browser groups passed |
| Backend `npm run check` | 107 JavaScript files passed |
| Backend `npm test` | 46/46 passed, including 5 new same-itinerary regressions |
| Diff, test-runner syntax and original SVG SHA256 checks | Passed |

Browser evidence: [results](evidence/customer-marketplace-2026-11-07/results.json), [desktop home](evidence/customer-marketplace-2026-11-07/home-desktop.png), [phone home](evidence/customer-marketplace-2026-11-07/home-phone.png), [phone finder](evidence/customer-marketplace-2026-11-07/finder-phone.png), [desktop detail](evidence/customer-marketplace-2026-11-07/detail-desktop.png), [phone resort](evidence/customer-marketplace-2026-11-07/resort-phone.png).

Browser checks use the actual production customer routes with a synthetic loopback-only API owned by the test runner. This tests frontend behaviour/contracts, not real database/API/staging acceptance. Test enquiry posts stay in memory; no email/database writes. Screenshots contain synthetic test inventory and must not be marketed as real products. Original images/media in actual product cards come from API values. Full-page stitched screenshots show the fixed mobile nav at its initial viewport position; it remains viewport-fixed in the running page.

Coverage: homepage no search form/working finder CTA, 320/390/768/1440px layout/no overflow, exact nav/active states, About/Contact, URL state/reload, typed drawer apply/cancel/Escape/focus, sorting/pagination, gallery, selected departure/package, enquiry error retention/server success, empty/error states, preview guard and anonymous operator redirect. Desktop/home/detail and phone layouts visually inspected.

## Local runtime and limits

Frontend runs at `http://127.0.0.1:3000/` using normal configuration. Test ports/API are stopped; no `.env` file was edited. Existing configuration remains the source of API URLs.

No local V2 API or MongoDB was running during this work; port 5000 belongs to a macOS system process, not the API. Therefore real catalogue browsing requires the development V2 API/database to be started separately with isolated development configuration. Until then the homepage/finder honestly show catalogue-unavailable/retry states. Never point local development at production to fill these sections.

Outstanding Phase 4 contract work: effective-price/date sorts, freshness-aware confirmed availability filtering, active/expired offer resolution throughout the journey, exact resort stay/occupancy pricing and enquiry-time commercial revalidation. Unsupported controls are not exposed as working features. Typed preferences, product facts and existing supported filters are implemented.

Remaining full-Phase-4 work: resolve those shared-service gaps, final owner visual review, complete SEO/canonical/facet/collection policy, installable PWA/service worker/offline/update verification, real development-data end-to-end and Phase 1–3 full regression/staging evidence against all 148 checklist requirements. This report does not mark that checklist passed.

No commit, push, deployment, production database access or external email delivery performed.


### 2026-11-07 — Restored face-image hero on customer homepage

Owner rejected the reef hero and requested the previously generated face image. Changed the actual homepage to hero-diver-portrait-v3.jpg, with mask/face visible to the right of desktop copy and above the mobile copy. Added a flat ocean shade and image mask to blend portrait into the existing navy surface. Retained original logo, Manrope system, current colours, Find a trip route, mobile navigation and all remaining customer pages. No image generation or business logic changes.

Validation: test-config and normal frontend builds passed; 15/15 synthetic loopback API browser groups passed, now asserting portrait asset. Desktop/phone hero crops visually inspected; diff check passed. Existing V2 API runtime limitation and full Phase4 acceptance gaps remain. Frontend restored3000 normal config. No commit/push/deploy/backend changes.


### 2026-11-07 — Subtle 3D depth and scroll reveals

Added progressive-enhancement useHomeMotion hook to actual homepage. Hero portrait responds to fine-pointer movement with small perspective rotations and to scrolling with bounded20px depth movement; only image transforms, text/CTA remain stable. Offscreen homepage sections rise/fade once using IntersectionObserver, cards lift on fine-pointer hover. Scroll work coalesced by requestAnimationFrame, stops offscreen/hidden; listeners/frames/observers cleaned up. Keyboard focus reveals content; no JS means visible fallback. Live reduced-motion changes remove transforms and pending reveals. No autoplay, hijacked scrolling or numbered/pause controls.

Validation: frontend test-config and normal builds passed; 16/16 loopback synthetic-API browser groups passed, including pointer depth response, targeted section reveal and live reduced-motion reset. Existing customer flows/contrast/responsive checks pass. Diff/runner syntax checks passed. Full-page home captures use reduced motion to avoid documenting unrevealed below-fold content as incomplete. No backend/API/DB/email changes. Frontend restored3000 normal config; existing real catalogue API dependency/full Phase4 gaps remain. No commit/push/deploy.


### 2026-11-07 — Logo-shaped D portrait and visible navigation

Reused the original logo's D vector path in a separate hero-d-mask.svg asset without changing the original wordmark. Hero portrait now sits in the actual D outline with a small offset ocean-colour depth layer; mobile positions it above copy. Added a solid Ocean deep header surface and high-contrast active/nav labels. Existing pointer/scroll motion, app-like phone tabs, original logo, palette and finder routes retained.

Validation: frontend test-config and normal builds passed; 17/17 loopback synthetic-API browser groups passed, including D-mask URL and image/header separation. Desktop and phone screenshots visually inspected. Diff check and original logo hashes passed. No backend/business-data changes. Frontend restored3000 normal config; local V2API and full Phase4 acceptance gaps unchanged. No commit/push/deploy.
