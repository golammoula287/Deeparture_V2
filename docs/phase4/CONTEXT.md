# Phase 4 — Customer marketplace redesign and PWA

Last updated: 2026-11-23 (Asia/Dhaka)

## Current handoff — client corrections, 20 November 2026

The client approved implementation of the consolidated corrections. Steps 01–11 are implemented and locally verified. Step 02 legal links await approved destinations. Hosted Step 03 checks and review gates remain open. Step 12 is next. The branch is `phase4-customer-ux-implementation`.

### Source order and precedence

The local client source pack is in [Phase 4 Full implementations Details](<../../deliverables/Phase 4  Full implementations Details />). The folder is Git-ignored. A fresh checkout needs the original client files supplied separately.

1. Latest pasted client approval and the four WhatsApp references. The approved contact values and behaviour are captured below. The footer mockup supplies layout guidance. Retain the existing header logo in the footer and use the confirmed contact details.
2. `Deeparture_Phase4_Consolidated_Developer_Checklist_FINAL_Rev5.pdf` (17 November, 7 pages). Use it for exact public copy, headers, search fields, Contact structure and all six FAQ entries in §7.
3. `Deeparture_Phase4_Developer_Implementation_Guide.docx` (20 November). Use its 13-step sequence and developer handback. Refer to `Deeparture_Phase4_Desktop_UI_Audit_FINAL_Tile_Decision.pdf` (8 pages) and `Deeparture_Phase4_Mobile_UI_Audit_SEND_READY.pdf` (7 pages) for responsive and interaction details that Rev5 leaves in place.
4. `Deeparture.pdf` is a visual identity concept deck. The SVG/PNG ZIPs contain logo, pictograph and social-icon artwork. Both ZIPs contain the same 19 artwork files byte for byte. They include the four original pictographs (puzzle, shield, cog and tag), two wordmarks, star graphics, a promotional diver image and social icons. The archive icons differ from the footer mockup, so verify which platforms and profile URLs the live footer actually uses. Preserve the existing site logo in both header and footer.
5. The [original Rev 1.1 package](../Deeparture_V2_Phase4_COMPLETE_Handover_Rev1.1.zip) supplies wider API, commercial, SEO, PWA and acceptance requirements where the newer documents are silent.

### Current code to build on

- [CustomerShell](../../frontend/src/components/customer/CustomerShell.jsx) already shares the logo asset between header and footer. The local fixed-header work is present. The shared header and catalogue cards have removed favourites. Discovery links use dedicated public routes. The footer contains the approved Step 02 brand and contact content, with legal destinations pending.
- [Homepage](../../frontend/pages/index.js), [HomeSearch](../../frontend/src/components/customer/HomeSearch.jsx) and [TripFinder](../../frontend/src/components/customer/TripFinder.jsx) already use V2 catalogue data. The homepage reads separate Featured and Active Offer feeds. The Featured and Special Offers links open dedicated paginated discovery pages. Liveaboards now have a shared departure range and Resorts have required stay dates. Finder prices are secondary and legacy availability-only controls have been removed from the customer flow.
- [Search service](../../backend/src/v2/services/search.service.js) already filters liveaboards by departure start and accepts structured attributes. Verify date boundaries, resort stay eligibility, definition loading and known-port sourcing. The [attribute seed](../../backend/scripts/seed-v2-attributes.js) includes Freediving, Photography, Nitrox and Rebreather.
- [Enquiry controller](../../backend/src/v2/controllers/enquiry.controller.js) and [notification service](../../backend/src/v2/services/notification.service.js) provide existing V2 persistence and submission notifications. Audit general Contact submission and listing/departure/offer context, central recipient selection and acknowledgement copy. Preserve the existing Admin review workflow.
- The November 14 release and staging sample search evidence in [the evidence directory](evidence/) describes those runs. Reproduce the catalogue and preference-loading issues from the audits against the current target before diagnosing them.

### Implementation sequence

2026-11-21 (Asia/Dhaka) — The owner confirmed that the approved main homepage (`/`) is the final UI design reference for Phase 4. Use it to guide shared UI work and retain its design when applying the Step 04 corrections. Steps 01–11 have local verification. Step 12 is next.

| Step | Work and completion check |
| --- | --- |
| 01 | Centralize theme roles and shared header. Retain the modern layout and compact hero areas. Use the current Deeparture logo, approved pictographs and replaceable artwork. Share navigation and active states across customer routes. Desktop keeps Search and Contact us. Mobile keeps Search and hamburger. Remove deferred heart, account and agent controls throughout the customer UI. |
| 02 | Build the shared footer with Brand, Explore, About, Contact, Follow, Operator login and legal links. Use the header logo and “Dive travel for everyone.” Keep “Sign in / Sign up” for Operator login. Verify existing legal and Groups/Charters destinations. Copy the official live-site social URLs into one shared configuration and verify each link. Add a floating direct WhatsApp action. |
| 03 | Trace catalogue and preference-loading failures across V2 API, configuration, taxonomy and rendering. Definitions must load independently of matching inventory. Extend the shared Dietary, Accessibility, Facilities and Diving taxonomy with Freediving alongside Nitrox, Photography and Rebreather. Display supported attributes on relevant listings. Verify matching rules and structured Liveaboard embarkation ports. Define independent Featured and Active Offer contracts for both product types. |
| 04 | Apply exact Rev5 homepage copy, including “Travel for everyone.” Keep Liveaboards as the default mode, configured shortcuts, separate Featured Trips and Special Offers, and six agreed destinations. Keep four compact “Explore Deeparture” tiles on desktop and remove the duplicate row on mobile. Mobile shortcuts are Wi-Fi, Accessible, Nitrox and All Filters. Desktop also includes Photography and Rebreather. |
| 05 | Put one Departure Window range control on the homepage and label it Departure dates on the Liveaboard finder. Use exact dates, full-calendar-month shortcuts, Clear and Apply. Match inclusive departure-start dates. A trip departing 25 February and returning 5 March matches a February window. Resorts use separate, required Check-in and Check-out fields and validate the actual stay range. |
| 06 | Move Price range to secondary filters with two handles synchronized with editable Min/Max. Keep Vegan Rating primary and explain vegan suitability. Use collapsible multi-select groups, usable duration fields and structured Liveaboard embarkation. Keep Apply/Clear and shortcut state in sync with counts and preserve unrelated search criteria. Remove Available only and use on-request/enquiry wording. |
| 07 | Update `/explore/liveaboards` and `/explore/resorts` with the Contact-style compact hero, page identity and “Find your next Deeparture.” Put the active product tab first. Use Rev5 field order and wording. Liveaboards uses Destination, Departure dates, Trip length, Vegan Rating and Search. Resorts replaces departure dates and trip length with Check-in and Check-out. Desktop results use a visible left accordion and removable chips. Mobile uses a search summary, Modify Search, full-screen Filters and separate Sort. Use a travel-relevant default and verify sorting, card data and pagination. |
| 08 | Build a dedicated mixed-product Featured Trips view and searchable `/special-offers`. Their only default restrictions are Featured = Yes and Active Offer = Yes respectively. Apply published/offer-validity rules, and test featured only, offer only, both and neither. Keep real cards, price basis, relevant detail/enquiry links and distinct no-match, no-active-offer and API-error states. Provide the dedicated `/why-deeparture` and `/destinations` routes in the customer journey. |
| 09 | Use the compact Contact hero and exact Rev5 copy. Keep “Send us a message.” primary. Place the secondary FAQ beside it on desktop and below it on mobile, with a compact contact strip after both. Form requires Name, Email, interest and message. WhatsApp/Phone and destination/trip name are optional. Interest options are Liveaboard, Resort, Special Offer and Other. |
| 10 | Use “Frequently asked questions” and the six exact Rev5 §7 question/answer pairs. Check structure and wording against the approved copy at phone and desktop widths. |
| 11 | Persist general and contextual enquiries in V2, retaining relevant listing, trip, departure or offer context. Generate the Deeparture notification through a configurable server-side recipient and acknowledge receipt to the customer. Check record persistence and both email actions independently in test mode. Customer submission routes to Deeparture and avoids booking promises. |
| 12 | Finish the wider customer journey from the original package and current V2 data, including details, galleries/lightbox, jump navigation, itineraries, cabins/rooms, departure/package detail, destination guides and offer routing. Review truthful pricing, accessibility, responsive performance, SEO and PWA. |
| 13 | Run the guide’s acceptance checks and original-package checks against appropriate data. Record exact revision, environment, checks, screenshots, test URLs, configuration/schema changes and unresolved issues. Request review for each gate and record the outcome before marking it accepted. |

Gate 1 covers shared foundations, catalogue and preferences, homepage search, dates and filters (steps 01–06). Gate 2 covers catalogue results, sorting and discovery (steps 07–08). Gate 3 covers Contact, FAQ, enquiries and the wider customer journey (steps 09–13). Approval to start is recorded. Gate approvals are pending.

### Confirmed details and pending inputs

- Public email `info@deeparture.travel` uses `mailto:info@deeparture.travel`. WhatsApp `+63 917 907 8121` uses `https://wa.me/639179078121`. Phone `+64 21 024 13170` uses `tel:+642102413170`. Verify official social URLs against the current footer at `deeparture.travel` during step 02.
- Brett will provide final colours, real imagery and the receiving inbox. Preserve agreed hero proportions and the same overall hero treatment on Contact, Liveaboards and Resorts. Track final homepage logo placement separately from the instruction to use the current header logo in the footer. The public mailto and the enquiry notification recipient are separate settings.
- Incomplete inventory is expected during development. Use clearly identified test records to exercise behaviour and preserve graceful empty states. Verify existing taxonomy combination rules, resort stay/rate semantics, offer validity, ranking if Recommended is chosen, and existing legal/Groups/Charters routes before fixing those contracts in code.
- Start implementation with steps 01–03. Inventory the shared shell/theme and verify catalogue and taxonomy requests in an isolated environment. Record the observed baseline before changing search or data handling.

### Work log — 2026-11-23 (Asia/Dhaka)

- Step 12 core increment added page metadata, clean canonicals, filter/sample noindex rules, robots and a published-inventory sitemap. Set `NEXT_PUBLIC_SITE_URL` to the approved public origin and enable `NEXT_PUBLIC_ALLOW_INDEXING` only on the public build. Reused the supplied manifest, icons and offline page. The worker caches only the offline and installation assets. Updated shared detail navigation, enquiry focus and pricing/status display.
- Both production builds and 11 frontend tests passed. Chromium verified SEO rules against a temporary localhost indexable build, sample product details at 390/768/1440 px, contextual selection, manifest install eligibility, cache contents, offline fallback and reconnection. The default local preview is back on port 3000 with indexing disabled. Next: wider departure/package/offer checks, installed launch and worker update testing, and hosted SEO acceptance. Step 12 remains open. Cumulative development hours are still pending reconciliation.

- 2026-11-23 (Asia/Dhaka) — Rebuilt the frontend successfully and prepared the Step 10 FAQ as a separate local commit.

- Step 11 routes general Contact and contextual enquiries through V2. General records appear in Admin review. Listing, departure, package and offer relationships are validated server-side. The configurable `ENQUIRY_NOTIFICATION_EMAIL` overrides active Admin email recipients for new enquiry notices, while the customer acknowledgement is attempted independently.
- Backend syntax check (114 files), 49 backend tests, 11 frontend tests, production build and diff check passed. On the isolated local search database, confirmed general, liveaboard and resort records, rejected invalid input and mismatched offers, and verified persistence and customer acknowledgement after a simulated Deeparture email failure. Chromium covered Contact at 390, 768 and 1440 px, a connection error and retry, homepage offer links for both product types, and one Special Offers to confirmed-enquiry flow. Verified both email actions in JSON transport using synthetic recipients. Cleaned up synthetic records after the run. The approved final inbox and staging verification remain pending.
- Step 12 baseline review confirmed reusable product details, gallery dialog, jump navigation, itineraries, and embedded departure/package options. Review standalone departure/package/offer routes against the agreed architecture, then prioritise core SEO checks and PWA integration against the remaining approved hours. Cumulative development hours remain unreconciled.

#### Client progress report — 23 November 2026

Hi Brett,

A quick Phase 4 progress update. The work below took **9.5 development hours** and has been verified locally.

| Work area | Completed |
|---|---|
| **Customer navigation** | Standardised the header and navigation across customer pages on desktop and mobile. |
| **Footer and contact** | Added a shared footer with direct contact links, Operator login, and a floating WhatsApp button. |
| **Catalogue and preferences** | Added Freediving and Photography to the shared preferences and made embarkation ports selectable in liveaboard search. |
| **Homepage search** | Applied the approved copy, set Liveaboards as the default, and updated the desktop and mobile search shortcuts. Featured Trips and Special Offers now load independently. |
| **Travel dates** | Added a departure date range with full-month shortcuts for liveaboards and separate check-in and check-out fields for resorts. |
| **Filters and pricing** | Added collapsible preference filters and a price slider with editable minimum and maximum values. Vegan Rating stays in the main search, and clearing secondary filters preserves the main search selections. |

Hosted catalogue and preference checks, the final Terms, Privacy and Cookie Policy links, and your review are still pending.

### Work log — 2026-11-22 (Asia/Dhaka)

- 2026-11-22 (Asia/Dhaka) — Phase 4 Step 10 is implemented and locally verified. Replaced the provisional Contact FAQs with all six Rev5 section 7 question-and-answer pairs in the approved order. Preserved the existing secondary panel and Operator login link. Next: Step 11 enquiry persistence and receipt emails. Frontend production build and diff check passed. Chromium verified all six exact text pairs against the extracted approved guide, Enter/Space accordion toggling, no horizontal overflow and secondary placement at 320, 390, 768 and 1440 px. Restarted the local frontend and left it running at port 3000. No commit or deployment.

- 2026-11-22 (Asia/Dhaka) — Phase 4 Step 09 Contact page and form are implemented and locally verified. Added the approved compact hero and form copy, required and optional fields, desktop/mobile FAQ placement, and direct Email, WhatsApp and Phone strip. Next: Step 10 exact FAQ content. The current form opens a draft in the visitor’s email app and does not claim receipt. In-app persistence and receipt emails are Step 11. Existing FAQ entries remain pending the approved six-entry replacement in Step 10. Existing artwork fills the hero until the client supplies its final image. Frontend production build and diff check passed. Chromium passed at 320, 390, 768 and 1440 px for layout, copy, active header, required fields, optional fields, special-offer preselection and draft link. No emails were sent. Local port 3000 serves the latest build. No commit or deployment.


- Step 08 added `/featured-trips`, `/special-offers`, `/destinations`, six destination guides and `/why-deeparture`. Homepage and shared navigation point to the dedicated routes. Product details preserve the return link. The Why page uses approved copy and the supplied icons while expanded approved copy and final destination imagery remain client inputs.
- Discovery defaults to both product types without destination constraints. Featured reads the managed flag. Offers read qualifying promotions and match the specific departure or resort package, travel dates, rate window and promotional price. Product-specific dates are available after selecting Liveaboards or Resorts. Distinct no-match, no-active-offer and API failure states are verified. Booking and availability remain on enquiry.
- Backend syntax (114 files), 49 backend tests, 11 frontend tests, production build and diff check passed. Chromium verified four widths (320, 390, 768 and 1440) using the isolated sample API. API fixture checks covered Featured-only, Offer-only, both and neither for each product and matching travel dates, expiry, minimum stay and budget. Temporary sample changes were restored. Synthetic 503 and empty fixtures covered the page states. Local port 3000 serves the latest build. Next: Step 09 Contact page and form.


- Step 07 applied the Rev5 finder copy and field order, product-specific compact heroes using replaceable existing artwork, and active-product-first tabs. Desktop has a left secondary filter accordion and removable chips. Mobile has a compact search summary, Modify Search, full-screen Filters and separate Sort.
- Finder API results order eligible products before slicing pages. Liveaboards default to earliest qualifying upcoming departure. Resort Recommended uses existing listing completeness, then starting USD price and stable name/ID ties. Both support price in either direction and Vegan Rating, with missing numeric values last. Cards link to the qualifying departure or resort package and show starting pricing and enquiry wording. Earlier API consumers retain their existing default sort.
- Backend syntax (114 files), 49 backend tests, 11 frontend tests, production build and diff check passed. The isolated sample catalogue verified API sort order across pages, matching prices/dates and correct package links. Chromium passed both finders at 320, 390, 768, 1024 and 1440 px, plus sidebar submission and independent chip removal. An isolated synthetic 503 confirmed retry status and usable preference definitions. Local port 3000 serves Step 07. Final hero imagery and hosted review remain pending. No commit or deployment. Next: Step 08.

### Work log — 2026-11-21 (Asia/Dhaka)

2026-11-21 (Asia/Dhaka) — Polished the shared All Filters panel with an ocean header, visible coral Apply action, card groups, selected counts and a default-open price slider. Frontend unit tests (11), final build, diff check and Chromium filter regressions at four widths passed. Local app refreshed. Follow-up Chromium verification on port 3000 passed across the homepage and both finders at 320, 390, 768 and 1440 px, including visible actions after scrolling and Escape focus restoration. Next: Step 07 results pages.


- Step 06 moved prices into shared collapsible secondary filters and added two draggable price handles with exact USD inputs. Shared groups render the API taxonomy with multi-select controls. Vegan Rating remains primary and the filter panel explains what it measures. Clearing secondary filters preserves destination, dates, primary duration and Vegan Rating. Removed the availability-only control and ignored it in legacy customer finder URLs. The backend contract remains available to its existing consumers.
- Frontend production build, 11 frontend tests, and diff check passed. Chromium passed at 320, 390, 768 and 1440 px against the isolated local catalogue, covering combined Wi-Fi/Nitrox/accessibility/dietary and USD price filters, result counts, focused slider changes, Clear and independent chip removal, and a valid zero-match resort search. A separate browser check dragged both price handles and verified the legacy preview controls. Local frontend restarted and left running on port 3000.
- Next: Step 07 results pages. Hosted Gate 1 review and earlier hosted API verification remain open.



- Step 05 added the shared Departure Window/Departure dates control with exact dates, full calendar month shortcuts, Clear and Apply. Public Liveaboard matching applies the range to departure start, includes the entire final UTC day and ignores return date.
- Resorts have required Check-in and Check-out fields and reject incomplete, invalid, same-day or reversed stays. Stay eligibility uses active packages, continuous coverage when active rate periods are configured, their minimum stay rules and explicit sold-out and stop-sell records for linked rooms. Eligible base packages without active rate periods remain on request. Check-out is excluded from occupied nights. The API keeps undated browsing and does not promise room availability.
- Backend syntax check (113 files), 49 backend tests, 11 frontend tests, frontend production build and diff check passed. Local production frontend and isolated sample API were restarted. Chromium passed at 320, 390, 768 and 1440 px for month and leap-year shortcuts, date validation, clear/apply, submitted URLs and matching resort results. Verified a partial stay returns HTTP 400 from the local API. No commit or deployment. Next: Step 06.


- Step 04 applied the exact Rev5 homepage copy, retained four shallow desktop Explore Deeparture tiles, hid those tiles on mobile, and retained the six agreed destinations and existing art. The homepage defaults to Liveaboards, uses the documented shortcut order for each viewport, keeps price inputs in All Filters, and removes Available only.
- Featured Trips and Special Offers read independent mixed-product catalogue feeds. The temporary View all link opens paginated featured results on the homepage. Dedicated discovery routes are Step 08. Resort offer cards show pricing on request and a confirmed offer badge. Final destination imagery is still a client input.
- Frontend production build, 10 frontend tests and diff check passed. Chromium passed at 320, 390, 700, 701, 768, 1024 and 1440 px with a synthetic local API, covering approved copy, controls, mixed-product cards, featured pagination and empty/error states. Restarted port 3000 and confirmed HTTP 200 with sample offer cards and an empty featured state because no local listings are flagged.
- Next: Step 05 departure window, resort check-in/check-out and date matching.



- Step 03 added shared Freediving and Photography definitions for both product types. Search keeps existing AND matching for selected requirements and respects definition eligibility. Structured embarkation choices use active itineraries on published liveaboards, with canonical port records and legacy stored slugs supported. Harbour labels in fixtures reflect their synthetic data.
- Both catalogue APIs accept `featured=true` for the admin-managed listing flag and `activeOffer=true` for an actual current discount on eligible departure cabin pricing or an active resort package and rate period. The filters can be combined. Homepage selection and dedicated discovery views are scheduled for Steps 04 and 08.
- Before changes, the local catalogue and preference endpoints succeeded with 120 listings per type and six definitions per type. Added 31 standard definitions only to the isolated sample database. Backend syntax (112 files), all 46 tests, frontend production build and diff check passed. Verified filter combinations and port matching through the local API, all Featured/Active Offer combinations per product type using temporary fixture changes, and homepage and finder controls in Chromium at 390, 768 and 1440 px. A separate synthetic 503 verified that the frontend preserves working preferences and distinguishes catalogue/offer outages from no results. Removed temporary offer fixtures and restored prior featured flags after validation.
- Four read-only requests to the hosted catalogue and definitions timed out at 20 seconds. The client-reported hosted failure is unresolved. Local port 3000 serves Step 03. Next implementation step: Step 04 homepage copy and search.

2026-11-21 (Asia/Dhaka) — Replaced the floating WhatsApp outline with a filled white mark in a 56 px green button. The approved chat URL is retained. Production build and diff check passed. Restarted the local frontend and verified the button and link before and after scrolling at 320, 390 and 1440 px. Next: review the Step 02 button.

2026-11-21 (Asia/Dhaka) — Refined the Step 02 footer grid and aligned the social icons with the heading. Icons are white with the shared coral accent on hover and keyboard focus. Production build and diff check passed. Restarted port 3000 and verified alignment, overflow and icon styles in Chromium at 320, 390, 768, 961 and 1440 px. Next: review the updated footer.

2026-11-21 (Asia/Dhaka) — Restarted the local frontend on port 3000 after a report that Step 02 was missing. Chromium verified the new homepage footer, fixed WhatsApp button and successful Next.js asset loads on port 3000 at 390 and 1440 px. The local server remains running. Next: review Step 02 on the homepage.

2026-11-21 (Asia/Dhaka) — Started the Phase 4 production build locally at http://127.0.0.1:3000 with the isolated test-mode API and existing sample database. Verified homepage HTTP 200 with the Step 01 pictographs and API HTTP 200 for 120 liveaboards and 120 resorts. Left the services running for review.

- Implemented Step 01 on `phase4-customer-ux-implementation`. Centralized shared navigation palette and homepage hero artwork, added the four supplied brand pictographs, kept the approved homepage layout, and removed header and card favourites and customer account controls. The shared fixed header has desktop Search and Contact us, mobile Search and menu, and active links on category, detail and Contact routes.
- Frontend production build and diff check passed. Chromium verified seven customer routes at 320, 390, 768, 901 and 1440 px using a production build and synthetic loopback API. Also verified menu Escape and focus return, homepage populated, empty and API-error states, pictograph loading, Search anchor and both palette options.
- Step 02 added the shared footer, approved contact details and fixed direct WhatsApp link. The live footer publishes Instagram, Facebook and X. It has an empty Telegram link, no YouTube or TikTok link, plain text for Groups or Charters, Terms and Privacy, and no Cookie Policy link. Group enquiries use a subject-prefilled email. Legal links and any additional social destinations await approved URLs.
- Frontend production build and diff check passed. Chromium passed 42 checks across seven customer routes and six widths (320, 390, 768, 960, 961 and 1440 px) using the isolated sample API and representative liveaboard and resort details. Checked footer layout, logo, icons, configured link targets, and WhatsApp before/after scrolling. The published social URLs and WhatsApp destination returned HTTP 200 after redirects. Verified Step 02 on local port 3000.
- Next implementation step: Step 03 catalogue and taxonomy. Gate 1 review remains pending.

### Work log — 2026-11-20 (Asia/Dhaka)

Reviewed the client message, implementation guide, four PDFs, four visual/message references and both asset ZIP inventories. Checked the current branch and relevant source entry points, then added the scoped instructions and implementation handoff. Documentation validation covers the diff and referenced local paths. Application builds and tests were outside this documentation task.

Follow-up visual review covered all 45 PDF pages, the three embedded guide mockups and all 19 unique ZIP assets. The Contact, footer and departure-window references confirm the layout and interaction details above. The alternate brand concepts and artwork remain reference material.

## Historical status through 13 November 2026

Removed the vertical “Beneath the surface, beyond the everyday.” homepage hero caption and its unused CSS, as requested. Frontend production build PASS; source absence and diff checks PASS. Build log: `docs/phase4/evidence/homepage-hero-polish-2026-11-13/frontend-build-caption-removal.txt`. No new tests/browser rerun/backend/deployment; known catalogue API limitation unchanged. Next: continue homepage visual review.

Polished the homepage hero at the owner’s request and removed the entire “A world of diving. A place for you.” line. Increased desktop headline scale, refined its weight/line spacing, added a small decorative coral rule beside “start here.” and adjusted the text spacing. Confirmed Ocean & Coral palette, original logo, single-diver portrait, header/image blend and search behaviour retained.

Validation: frontend build PASS; five focused main-app browser groups PASS (1440/768/390/320px plus mobile filter open/Escape), confirming removed text, one H1/portrait, coral accent, headline above search, no overflow/runtime errors and HTTP 200. Desktop/phone screenshots visually reviewed. Build/results/captures: `docs/phase4/evidence/homepage-hero-polish-2026-11-13/`. Diff check PASS. No new tests/backend/deployment; real catalogue API remains unavailable. Next: owner review of the polished hero, then planned search/results work.

### Previous homepage refinement

Owner confirmed Ocean & Coral as the chosen homepage palette and highlighted the navigation/photo colour seam in the supplied screenshot. Added a 132px vertical fade using the same header colour above the existing portrait treatment, so the image blends into navigation rather than starting with a bright rectangular edge. The default remains Ocean & Coral; Midnight & Champagne is retained only as an optional reference preview. This is palette selection, not complete Phase 4 acceptance.

Validation: frontend build PASS; focused main-app browser checks at 1440/768/390/320px PASS. Sampled rendered pixels at three positions along the header/hero join match within 3 RGB levels at every width; portrait loads, HTTP 200, no horizontal overflow/runtime errors. Desktop/phone screenshots visually inspected; build output and results in `docs/phase4/evidence/homepage-header-blend-2026-11-13/`. Diff check PASS. No new tests/backend/deployment; known real catalogue API limitation persists. Next: review the blended Ocean & Coral homepage, then proceed with the planned search/results redesign.

### Earlier colour comparison

Added Option 2 “Midnight & Champagne” for homepage colour comparison at `/?palette=midnight`, while preserving Option 1 “Ocean & Coral” at `/` and `/?palette=coral`. The owner liked Option 1 but has not made a final selection. Explicit palette URLs show comparison links and noindex metadata; the default homepage has no comparison controls. Shared scoped tokens preserve the same logo, diver portrait, content and search behaviour. Review guide: `docs/phase4/HOMEPAGE_COLOUR_OPTIONS_2026-11-12.md`.

Validation: frontend build PASS; 12/12 focused main-app browser checks PASS (both palettes at 1440/768/390/320px, mobile filters, contrast, SSR selection, switch/back/reload, default/invalid query handling), no overflow/runtime errors. Primary-action contrast A 5.40:1 / B 8.38:1; input borders A 3.31:1 / B 3.37:1. Screenshots visually reviewed; evidence under `docs/phase4/evidence/homepage-options-2026-11-12/`. Diff check PASS. No backend/new test files/deployment; real catalogue API limitation remains. Next: owner comparison and preferred palette selection; keep A as default meanwhile.

### Earlier colour iteration

Owner relaxed the strict blue/white colour requirement and authorized design judgement. Applied a homepage-only ocean-teal / warm-ivory palette with seafoam accents and burnt-coral primary actions. Centralized colour roles in the scoped homepage shell; preserved original logo, single-diver portrait, layout, content and search behaviour. Guide: `docs/phase4/HOMEPAGE_COLOUR_2026-11-12.md`. This latest instruction supersedes the earlier blue/white confirmation for the homepage.

Validation: frontend build PASS; focused main-app browser checks 5/5 groups PASS at 1440/768/390/320px plus mobile filters, with no overflow/runtime errors. Computed contrast: primary text 5.40:1, supporting copy on canvas 5.83:1, input boundary 3.31:1. Screenshots visually inspected; evidence/build log in `docs/phase4/evidence/homepage-colour-2026-11-12/`. Diff check PASS. No new tests/backend changes/deployment; real catalogue API limitation and remaining Phase 4 integration requirements persist. Next: homepage visual review, then search/results.

### Earlier homepage iterations

Replaced the homepage hero with the existing single-diver face portrait `/phase4/hero-diver-portrait-v3.jpg` at the owner’s request. Adjusted the desktop image region/fade and phone crop to keep the portrait visible alongside readable text. Existing original logo, confirmed blue/white direction and search controls retained. No new image generated; existing generated-atmosphere provenance remains in IMAGE_SOURCES.md.

Validation: frontend `npm run build` PASS; focused browser checks on the main localhost:3000 app at 1440px and 390px PASS (HTTP 200, exactly one loaded hero image using the portrait, no horizontal overflow or runtime errors). Screenshots visually inspected; build output and captures in `docs/phase4/evidence/homepage-diver-2026-11-12/`. Existing real catalogue API limitation remains. No backend changes, new tests, deployment or complete Phase 4 acceptance. Next: owner visual review of the portrait homepage.

Implemented the first homepage redesign from the client’s three-page `Phase4_Scope_Rev2.pdf` (prepared 10 November, supplied 12 November). Source copy: `docs/phase4/specifications/Phase4_Scope_Rev2.pdf`; SHA256 `409af26e21289836703991eb6962efb21f231f22f5c798a173922d0cd965571b`. Production/page sequence and remaining requirements: `docs/phase4/HOMEPAGE_REV2_PLAN_2026-11-12.md`.

Homepage uses the earlier client blue/white/navy reference, confirmed by the owner on 12 November 2026, original logo, inclusive reef hero, liveaboard/resort switch, desktop price range, mobile All Filters, shared structured preferences, real-data catalogue cards, destination discovery and enquiry wording. No customer account/favourites/agent/live-availability controls. Other pages retain their styling; minimal results-form/URL changes preserve minPrice and embarkation rather than dropping homepage choices. No backend changes. Existing unrelated work preserved on `phase4-customer-ux-implementation`; all new changes uncommitted.

Validation: frontend build PASS; search-state 7/7 PASS; production browser 9/9 groups PASS using temporary loopback fixtures, five viewport widths, modal focus/cancel/apply/clear, URL/API forwarding/reload/back/forward, product-specific exclusions, error/empty states and protected-route redirects, with no runtime errors. Final screenshots visually inspected; evidence/build log under `docs/phase4/evidence/homepage-rev2-2026-11-12/`. Main localhost:3000 HTTP 200; real catalogue API remains unavailable. Diff check PASS. No database/email/staging/publication or complete Phase 4 acceptance. Outstanding: full travel-window and resort stay/stop-sell eligibility, active-offer contract, exhaustive destination taxonomy, later page designs, SEO/PWA and integrated acceptance. Next: review homepage visually before redesigning search/results.

### Earlier implementation status

Hero portrait now uses the exact original-logo D path as an image mask with a restrained depth layer. Header has a solid ocean background so navigation stays readable. Original wordmark unchanged; mobile tabs, current palette, Manrope and motion retained. Build and 17 loopback browser groups passed; desktop/phone screenshots inspected. Branch phase4-customer-ux-implementation, changes uncommitted. Frontend3000 normal config; real inventory still requires development V2API/database. Full Phase4 acceptance pending.

Customer route implementation now extends the earlier design-review stage; full Phase 4 acceptance is not complete. Remaining shared commercial resolution, complete SEO/PWA and integrated/staging acceptance remain pending. The 148-row tracker is not marked passed by fixture previews. Initial preview commit `44d2f13538687474135fa0f9f33188e40776fac1` is merged/pushed to main; later visual revisions are local.

Accepted Phase 3 baseline: `f6693c6a05b7bd172fc773fe010494ee61f276f9`. The initial checkout matched this baseline on 5 November; main subsequently advanced to preview commit `44d2f13538687474135fa0f9f33188e40776fac1`. Existing uncommitted Phase 3 context, tooling and evidence must be preserved. Earlier Phase 3 acceptance results are recorded in the root [CONTEXT.md](../../CONTEXT.md); they were not rerun for this review.

## Source package and reading order

Original archive: [Deeparture_V2_Phase4_COMPLETE_Handover_Rev1.1.zip](../Deeparture_V2_Phase4_COMPLETE_Handover_Rev1.1.zip).

Archive root: `Deeparture_V2_Phase4_Complete_Developer_Handover_Rev1.1/`. Paths below are inside that archive:

1. `00_START_HERE_PHASE4.md`: baseline, package precedence and workflow.
2. `01_PHASE4_SPECIFICATION_AND_ACCEPTANCE/`: controlling Rev 1.1 Developer Specification, Acceptance Checklist, Future-Proofing Compliance Matrix and `PHASE4_DEVELOPER_RETURN_REQUIREMENTS.md`.
3. `02_PHASE4_CODE_OVERLAY/`: read `README.md`, `INTEGRATION.md`, `SOURCE_BASELINE_NOTE.md`, `API_CONTRACT.md`, `CHECKLIST_COVERAGE.md` and `TEST_RESULTS.md` before merging `overlay/`.
4. `03_ORIGINAL_ZIPS/`: original specification and overlay ZIPs retained for provenance.

The controlling specification folder takes precedence over reference documents bundled with the overlay. The owner's clarification below governs the intended visual/UX work. Preserve the original archive; resolve implementation details against the accepted repository rather than replacing the repository wholesale.

## Owner clarification — required UI/UX scope

Phase 4 includes a fresh customer-facing UI/UX redesign that makes Deeparture feel like a finished, modern travel marketplace. Connecting the existing public frontend to V2 APIs alone does not satisfy the scope. The supplied components define functional structure; their appearance is not the final approved design.

Design direction:

- Clean, modern and premium, with strong underwater/travel imagery and retained Deeparture identity; reproduction of the existing website is not required.
- Spacious layouts, clear hierarchy, intuitive search and consistent design across search, collections, details and enquiry.
- Mobile-first interactions with deliberately designed phone, tablet and desktop layouts.
- Dietary, Vegan Rating and accessibility information visible and naturally integrated.
- Clear enquiry/availability actions without excessive sales pressure.

Prepare the main design direction first: a representative search/results page and one liveaboard detail page, including phone and desktop layouts and tablet behaviour. Present these for the owner's visual review before applying the style throughout Phase 4. Visual approval is separate from functional/staging acceptance. Use the existing frontend and shared design components; this is a presentation/UX improvement within the V2 architecture.

## Customer experience to deliver

| Area | Required behaviour and presentation |
| --- | --- |
| Main search | Immediately accessible destination, dates, trip length and price controls; working search/filter boxes rather than decorative controls. Product-appropriate semantics for liveaboards and resorts. |
| Advanced filters | Organised panel/drawer for Vegan Rating, dietary requirements, accessibility, facilities, nitrox, photography, rebreather support, availability and offers as applicable. Shared taxonomy drives options. |
| Search results | Visual cards with image, vessel/resort, destination/route, dates or duration, effective starting price and currency, active offer, availability, important attributes and clear detail/enquiry path. |
| Search state | Conjunctive server-side filters, deterministic sorting and pagination; shareable URL state, clear/reset actions and useful loading, empty and error states. |
| Liveaboard detail | Strong gallery, overview, facilities/diving/dietary/accessibility features, itineraries, departures, cabin information, resolved prices/offers/availability and contextual enquiry. |
| Resort detail | Consistent gallery/overview/features, room types, packages, seasonal pricing and availability where supported, and contextual enquiry. |
| Responsive UX | Touch-friendly mobile filters and galleries, readable departure cards replacing squeezed tables, unobstructed sticky actions where useful, intentional tablet/desktop layouts. |
| Robustness | Keyboard access, visible focus, labelled controls, drawer focus/dismissal, accessible validation, responsive images and no critical overflow or runtime errors. |

Resorts must not expose misleading liveaboard-only filters. Missing inventory, prices or availability must yield a useful enquiry-led experience. Published liveaboards without departures and resorts without complete package data must remain usable.

## Architecture and business rules to preserve

- Overlay accepted Phase 3; preserve authentication, organisation ownership, roles, Admin/Operator tools, notifications and enquiry review/approval behaviour.
- Use versioned V2 APIs through a centralized frontend API/data layer. Extend existing shared services backward compatibly when necessary; do not create a separate frontend system or duplicate domain logic.
- Resolve core filtering, pagination, sorting, pricing, active offers and availability eligibility in backend services. Do not download the catalogue and apply core business filters in React.
- Reuse pricing inheritance, valid departure/cabin overrides and time-limited offers. Display original/sale prices when supported; expired offers disappear through backend resolution. Retain original currency semantics.
- Use resolved availability and source freshness. Unknown/stale states become enquiry states; live/real-time wording requires evidence. Available-only search must exclude sold-out inventory.
- Validate enquiry inputs and listing/itinerary/departure/package relationships server-side, preserving context through Admin review and subsequent operator notification.
- Keep reusable cards, filters, galleries, pricing/offer/availability displays and enquiry components. Derive taxonomy from shared structured data.
- Preserve stable public slugs, existing routes/redirects, media URL/reference handling and future object-storage/CDN compatibility. Introduce no new base64-in-database image path.
- Use a separate development database; keep staging email in test mode and secrets outside tracked files and logs.

## Integration findings to resolve before applying the overlay

These are verified differences or integration questions, not completed fixes:

- The overlay README assumes Next.js 14 / React 18; the current frontend manifest declares Next.js `^16.3.5`, React/React DOM `^19.3.0`. Retain the accepted dependency baseline and check compatibility rather than downgrading to match the overlay description.
- Existing `frontend/jsconfig.json` maps `@/*` to the frontend root. Overlay examples using `@/components/...` require reconciliation with the actual `src/` location.
- Existing centralized access is `frontend/src/lib/v2Api.js`, with configuration in `frontend/src/config/serverConfig.js`. The overlay supplies `src/api/v2Client.js` and `customerApi.js`; reconcile URL bases, response envelopes, server/browser use and error handling into a coherent customer data layer without disrupting protected workflows.
- Existing public routes are in `backend/src/v2/routes/public.routes.js`. They expose liveaboard/resort list/detail, enquiries and attributes; no standalone `/departures` route is mounted in that file. Do not assume the overlay's route examples already exist.
- Existing `search.service.js` already uses shared pagination and allowed sorts. Map the overlay's `pageSize`, sort and filter names to actual service semantics, preserving earlier clients. Audit compound filters and effective-price/date sorting against real inventory relationships.
- The overlay enquiry example (`fullName`, `email`, nested `context`) differs from the current controller contract (`productType` of `vessel`/`resort`, `product`, `customer`, optional `itinerary`/`departure`/`package`). Adapt centrally and preserve ownership validation; do not submit the sample payload unchanged.
- The package explicitly lacks a full merged build/regression/staging verification. Its recorded 9/9 helper tests are package-author evidence only, not locally rerun or integrated acceptance.

## SEO and PWA

Implement these around the agreed customer experience:

- Crawlable essential listing content, useful unique titles/descriptions, correct canonicals and preserved/redirected retained URLs.
- Curated discovery pages use the same taxonomy/search APIs. Control faceted indexation with documented canonical/noindex handling.
- Valid manifest/icons, working registration, supported-browser installation and installed launch/navigation.
- Conservative static asset caching; network-aware freshness for prices, offers and availability. Offline/interrupted navigation must explain the state, and offline enquiries must never report false success.

## Implementation sequence and review gates

1. Preserve current changes; read directory instructions and the controlling package. Inventory public components/routes and map every checklist requirement to intended implementation/evidence.
2. Prepare the search/results and liveaboard detail design direction in the existing frontend. Use clearly identified preview data where needed; do not represent it as live inventory.
3. Obtain owner review of the concrete visual direction before broad UI rollout.
4. Reconcile and integrate the overlay with shared services; implement the approved reusable design across liveaboard/resort journeys, then complete SEO/PWA integration.
5. Run meaningful Phase 4 tests and required Phase 1–3 regressions; backend `npm run check` and relevant `npm test`, frontend `npm run build`. Review scripts before service-dependent/data-writing checks.
6. Under explicit publication/deployment authorization, deploy staging and verify exact frontend/backend revisions, browser journeys, responsive behaviour, PWA and SEO. Do not infer publication authorization from the supplied workflow.
7. Return the completed acceptance checklist and evidence package for independent review/formal sign-off.

## Acceptance and handback

Use all applicable rows of the controlling Rev 1.1 checklist, with separate Local and Render/Staging results and evidence for every PASS. Required scenarios include compound destination/date/duration/price/Vegan Rating/offer/availability search; sold-out exclusion; inherited pricing; valid overrides; active/expired offers; stale/unknown inventory; incomplete published listings; and mobile liveaboard/resort search → detail → enquiry.

Return one auditable ZIP containing branch/full commit and baseline identity, change summary/patch, frontend/API staging URLs and matching revisions, non-secret environment identity, API queries/payloads/responses, service ownership, exact test/build commands and outputs, prior-phase regressions, desktop/phone visual evidence plus tablet checks, PWA install/offline evidence, SEO evidence, configuration/dependency changes, any migration dry-run/backup/rollback instructions and all known limitations. Identify reusable components, taxonomy configuration, data layer and media path. Future clients must remain able to reuse the same V2 contracts.

Formal Phase 4 acceptance is separate from developer completion and visual approval. Do not mark Phase 5 ready before formal Infinite Blue acceptance.

Deferred: native apps, external operator feeds/webhooks, automated scraping/rechecks, Agent/B2B platform, dynamic packaging, production V1 cutover/retirement, destructive production migration and restyling Admin/Operator tools solely to match the customer design.

## Review evidence and next action

On 5 November 2026, read root context/README, handover text documents, specification/checklist/compliance DOCX text and representative current API/configuration code. Verified ZIP CRC integrity and all 63 master-manifest SHA256 entries. Checked baseline HEAD and existing working-tree changes. No application tests, application edits, deployment or database operations were performed.

Historical next action from the initial review: prepare the representative design direction. This is now implemented as described below; full integration and acceptance remain outstanding.


## 2026-11-05 — Design direction implemented and verified

Added isolated `/phase4-preview` search/results and `/phase4-preview/liveaboards/[slug]` detail routes with scoped customer styles, local illustrative photographs and fictional fixtures. Includes working sample primary/advanced filters, sorting/pagination, empty/reset states, gallery dialog, itinerary/features/cabins, responsive departures, contextual non-delivering enquiry preview and mobile action bar. Header suppression is opt-in per preview component; existing auth behaviour remains in place. Production routes return 404 unless explicitly enabled; metadata/headers prevent indexing and caching. Existing customer/API routes and private environment files were not changed.

Validation: frontend production build passed; all 16 final local Chromium groups passed at 390/768/1440px, including production guard, focus/dismissal, sample interactions, zero submission requests, shared login header and protected operator redirect. No console/page errors in tested flows. Initial layout/label issues were corrected before the final successful run. Browser JSON and seven screenshots are under `docs/phase4/evidence/`; syntax and diff checks passed. Backend and full integrated acceptance tests were not run in this frontend-preview step; all 148 Local/Staging integration rows remain NOT RUN. No commit, push, deployment, database changes or email delivery.

Next: owner reviews concrete screenshots/pages and confirms or refines the visual direction, then continue the shared V2 API integration and apply the approved design to real liveaboard/resort journeys. SEO/PWA, full local regressions and authorized staging handback follow. See DESIGN_REVIEW.md for local preview commands and exact limitations.


## 2026-11-05 — Authorized branch publication

Owner authorized committing and pushing all current Phase 4 work to a new branch, `phase4-customer-marketplace`, based on the accepted Phase 3 commit. Publication includes the original supplied archive, design-preview source/assets, evidence and implementation documents. Commit title: `Add Phase 4 marketplace design previews and implementation handover`. Existing frontend production build and 16/16 browser results cover unchanged application source; publication checks validate the selected diff and exclude environment files and unrelated Phase 3 work. Full Phase 4 completion and staging acceptance remain pending. No merge or deployment is authorized by this branch publication task.


## 2026-11-05 — Brand identity preserved

Applied owner-supplied colour/text/logo reference to both preview pages. Original public SVG assets are stored unchanged with SHA256 source records in BRAND_ASSETS.json; local official Outfit/Roboto variable fonts include OFL licences. Clean blue/white layouts retain working filters, galleries, responsive departure/enquiry previews and all preview guards. Original screenshots preserved; new evidence is in evidence/brand-revision/. Final production build and 17/17 Chromium preview groups passed; no console/page errors. Fixed development title warning. Logo hashes, documentation references and diff checks passed. Local preview restored on port 3000; both routes return HTTP 200. Existing Phase 3 changes and private environments preserved. Full integration/resort/SEO/PWA and staging acceptance remain pending; visual feedback is not treated as full acceptance.


### 2026-11-05 — Cleaner UI, restrained palette and photographic hero

Owner rejected the previous overall UI and requested an attractive hero, easier interactions and a consistent modern palette. Rebuilt the hero around locally served aerial ocean photography, a concise headline, readable overlay and a single primary search surface. Destination/date controls are prominent; duration and budget form a secondary row. Added working quick destination buttons, removed the long desktop filter sidebar in favour of the existing accessible drawer, enlarged result imagery/text and simplified detail surfaces. Shared CSS tokens now define brand/action blue, navy ink, muted text, white/grey/blue surfaces and consistent dividers. Original SVG logos remain unchanged. Image provenance updated.

Validation: frontend production build passed; 18/18 Chromium preview groups passed at 390/768/1440px with no console/page errors, including quick destination selection/reset and prior filter/gallery/enquiry/brand/guard checks. Final screenshots visually reviewed; evidence is under docs/phase4/evidence/clean-revision/, with earlier evidence preserved. Logo hashes and diff/script checks passed. Local development preview restored on port 3000. No backend/database/email or environment-file changes; full Phase 4 shared-service integration and acceptance remain pending. Next: owner reviews the simplified design and continue remaining integration work.


## 2026-11-05 — Ocean/ivory/coral direction

Owner rejected the earlier combination and requested a different design. Added a new split hero, controlled ocean/ivory/coral palette, four supporting approach cards and a structured footer with working internal navigation. Original SVG artwork remains unchanged. Final frontend build and 19/19 browser groups passed, including button contrast, footer/approach, responsive and existing interaction/guard checks; no page/console errors. Evidence is under evidence/ocean-coral-revision/, earlier revisions preserved. Logo hash, diff and script checks passed. Local preview restored on port 3000. Full integration/staging acceptance remains outstanding. See OCEAN_CORAL_REVISION_2026-11-05.md for palette and review images.


## 2026-11-05 — Clean cards and text actions

Removed decorative arrows, simplified the search card and result hierarchy, and replaced arrow circles with View trip buttons. Native select/calendar controls, keyboard gallery navigation and original logo artwork are preserved. Final frontend build and 20/20 Chromium groups passed; no page/console errors. Evidence under evidence/clean-cards-revision/; earlier revisions retained. Logo hashes, syntax and diff checks passed. Local preview restored on port 3000. Full shared-service integration and acceptance remain pending.


### 2026-11-05 — Immersive underwater references and minimal content

Owner liked the clean cards and supplied underwater moodboard ideas, requesting fewer unnecessary icons/elements. Replaced the split hero with a high-resolution underwater photograph, centered headline and one plain CTA. Removed the custom SVG icon component, decorative feature counters, repeated eyebrow/image labels and redundant search-header CTA. Preserved the approved clean-card structure, original logos, restrained palette, labelled native controls and accessible text-based gallery/drawer interactions. Image provenance updated.

Validation: frontend production build passed; 21/21 Chromium groups passed at 390/768/1440px with no page/console errors, including new hero asset/CTA and no decorative SVGs in main content, plus existing interaction/card/brand/contrast/guard checks. Evidence under docs/phase4/evidence/immersive-revision/; earlier evidence retained. Original-logo hashes, syntax and diff checks passed. Local preview restored on port 3000. No backend/environment/database/email or deployment changes. Full Phase 4 integration remains pending. Next: owner reviews the reference-inspired refinement and continue remaining shared-service implementation.


### 2026-11-05 — Remove customer-visible preview/demo wording

Owner explicitly requested removing preview/design/demo text. Removed the development banner and customer-facing disclaimers/labels across metadata/navigation/footer/search/detail/gallery/rating/alt text and enquiry controls, replacing them with normal product copy. Review enquiry preserves trip/date context without claiming a request was sent. Internal fixture modules, routes, noindex/no-store and production guard remain intact; real shared API/submission integration is still pending. Original logos and current visual design retained.

Validation: frontend production build and 22/22 Chromium groups passed at 390/768/1440px, including new negative-copy assertions on body/title/alt text, existing interactions/contrast/guards and zero submission requests. No page/console errors. Diff/script and original-logo hash checks passed. Evidence under docs/phase4/evidence/customer-copy-revision/, with historical results preserved. Local UI restored on port 3000. No backend/environment/database/email or deployment changes. Next: review normal customer copy and continue remaining shared V2 integration.


### 2026-11-05 — Owner-selected four-colour palette

Owner requested a one-by-one workflow beginning with colour and supplied exact #30AFFF, #92EEFF, #D8FFC5 and #C4F7CA swatches. Added explicit shared palette tokens and applied blue to header/actions, cyan to hover/emphasis, lime to offers and mint to selected/supporting states. Kept white/light supporting surfaces and dark navy text for contrast. Removed earlier warm UI colours. Changed colour styles only; no layout, copy, typography, imagery, controls or domain logic edits. Original logo assets remain unchanged.

Validation: frontend production build and 22/22 Chromium groups passed at 390/768/1440px, including exact palette/header values and primary-button normal-text contrast >=4.5:1. No page/console errors. Logo SHA256, script syntax and diff checks passed. Evidence under docs/phase4/evidence/selected-palette/; historical evidence preserved. Local UI restored on port 3000 with review=palette. No backend/environment/database/email or deployment changes. Full Phase 4 integration remains pending. Next: owner reviews colour before proceeding to another design step.


### 2026-11-06 — Colour step completion

Completed the active colour-only step using the four owner-selected swatches. Confirmed the existing local server is listening on port 3000, the palette page returns HTTP 200, and opened it for review. Existing production-build and 22/22 browser results were inspected; application source is unchanged and tests were not rerun. Layout and original logos remain unchanged. Full Phase 4 integration is still pending; continue the owner-requested one-step-at-a-time workflow. No commit, push, deployment or environment changes.


### 2026-11-06 — Replacement deep/royal/sky/ice blue palette

Owner supplied a replacement palette: #050C9C, #3572EF, #3ABEF9 and #A7E6FF. Replaced earlier colour tokens/roles; deep blue anchors header/footer and primary actions, royal blue supports emphasis/focus, sky blue supports hover/offers and ice blue supporting states. Used white text on deep blue and deep text on light colours. Original logos/layout/copy/typography/images/behaviour unchanged. Updated browser report dating to support explicit work date/Asia-Dhaka dates.

Validation: frontend production build passed; 22/22 Chromium groups passed at 390/768/1440px with no page/console errors, including exact palette/header colour and primary-button contrast >=4.5:1. Logo hashes, syntax and diff checks passed. Evidence under docs/phase4/evidence/blue-palette-2026-11-06/; old reports preserved. Local UI restored on port 3000. No backend/environment/database/email/deployment changes. Full Phase 4 integration remains pending. Next: owner reviews this colour step before further design work.


### 2026-11-06 — Continuous ocean hero and sliding headlines

Implemented the owner’s ocean reference as one uninterrupted hero with transparent overlaid navigation, original unmodified Deeparture logo, muted ocean colours sampled from the supplied palette (#071925, #9DB7C3, #50636B, #123749, #294E5C, #6D919D, #527787), local ocean-wave photography, restrained background typography and three sliding headlines. Numbered text controls pause on manual selection; explicit play/pause and reduced-motion support are included. No decorative arrows, extra header band or customer-facing demo wording. Existing search/cards/detail flows retained; earlier blue palette remains outside the hero.

Validation: frontend production build and 23/23 Chromium groups passed, including overlay positioning, manual/automatic slides, pause, reduced motion, 390/768/1440px layouts and existing customer flows. No browser errors or API writes. Evidence: docs/phase4/evidence/ocean-slider-2026-11-06/. Local UI runs on port 3000. Changes remain local; full shared V2 integration, resort rollout, PWA/SEO and staging acceptance remain pending. Next: owner reviews the hero before further visual changes.


### 2026-11-06 — Scuba hero and faded 3D headlines

Replaced surface-wave hero photography with a local high-resolution scuba-diver/reef photograph. Removed the decorative OCEAN word and its unused CSS. Headline colour is now translucent ocean mist (76% opacity), with restrained depth shadows, a perspective entrance and gentle 3D tilt/float. Manual slide selection and Pause stop animation; reduced motion disables both entrance and headline animation. Transparent navigation and original logos remain unchanged.

Validation: frontend production build passed; 23/23 Chromium groups passed, including the scuba asset, absence of the background word, translucent headline, animation, slideshow controls, reduced motion and desktop/tablet/phone flows. No browser errors or API writes. Syntax and diff checks passed. Evidence: docs/phase4/evidence/scuba-3d-2026-11-06/. Local app restored on port 3000. No commit/push/deployment or backend changes. Full Phase 4 integration remains pending. Next: owner reviews this hero refinement.


### 2026-11-06 — Owner reference diver and STO-style typography

Used the owner-supplied clear-water diver screenshot (04.47.26) as the hero asset, converted to a local JPEG. Added oversized translucent DEEP lettering behind smaller uppercase sliding headlines, echoing the supplied STO composition. Background lettering has gentle perspective motion and follows Pause/reduced-motion settings. Lighter overlay preserves turquoise water and sandy seabed; navigation continues over the same image. Original logos/cards retained.

Validation: frontend production build passed; 23/23 Chromium groups passed, including reference asset, decorative text accessibility, faded headline, pause/manual/automatic slides, reduced motion and responsive layouts. Syntax and diff checks passed. Evidence: docs/phase4/evidence/reference-diver-2026-11-06/. Local app restored on port 3000. No commit/push/deploy or backend changes. Full Phase 4 integration remains pending. Next: owner reviews the revised hero.


### 2026-11-06 — Different real photograph and consistent muted ocean palette

Replaced the supplied screenshot with a different real scuba photograph by Olga ga from Unsplash (IQMCYVVa2Wc), served locally as hero-open-water-diver.jpg. Inspected the image: diver beneath sunlit open water. Preserved translucent DEEP typography, subtle 3D animation, transparent navigation and original logos. Applied owner-reference colours throughout the customer UI: #071925, #9DB7C3, #50636B, #123749, #294E5C, #6D919D, #527787. Replaced earlier bright blue base tokens with muted ocean roles. Headline now “Dive beyond / the everyday.” with specific copy about destinations/dates/features, cabin options/prices and dietary/accessibility features. No fabricated testimonials or statistics added.

Validation: frontend production build, syntax/diff checks and 23/23 Chromium groups passed; responsive screenshots and browser evidence under docs/phase4/evidence/authentic-ocean-2026-11-06/. No browser errors or API writes. Local UI restored on port 3000. No commit, push, deployment or backend changes. Full Phase 4 shared integration and acceptance remain pending. Next: owner reviews current photograph/palette.


### 2026-11-06 — Original custom hero banner

Created an original AI-generated underwater banner using the imagegen skill and built-in image generation. Scene: muted blue-green open water, sunlight from upper left and scuba diver at right with calm space for live text. Saved original PNG and optimized JPEG in frontend/public/phase4/hero-custom-banner-v1.*. Replaced stock hero with JPEG; adjusted overlay and mobile crop. Original logo, live 3D typography, reduced-motion/pause controls and ocean palette retained. This is generated atmosphere artwork, not a real destination photograph or inventory representation.

Validation: production frontend build, syntax/diff checks and 23/23 Chromium groups passed. Responsive screenshots/report: docs/phase4/evidence/custom-banner-2026-11-06/. No browser errors or API writes. Local app restored on port 3000. No commit/push/deployment/backend changes. Full Phase 4 integration remains pending. Next: owner reviews the custom banner.


### 2026-11-06 — Hero layout refactor after owner feedback

Replaced the accumulated hero overrides with one responsive composition. Desktop headline is left aligned in the image’s open water; diver stays visible at right. Reduced decorative DEEP lettering from 36vw/28% opacity to 27vw/10%, moved it lower, restored sentence-case headline hierarchy, shortened overall desktop hero height and put controls in a compact bottom row. Retained muted palette, original logo, custom background, slider/manual/pause controls and reduced-motion support. Consolidated hero CSS rather than appending another override layer.

Validation: frontend production build and 23/23 Chromium groups passed, including responsive layouts, image loading, manual/automatic slideshow, pause and reduced motion. Inspected desktop and phone screenshots. Diff check passed. Evidence: docs/phase4/evidence/hero-refactor-2026-11-06/. Local app restored on port 3000. No commit/push/deploy or backend changes. Full Phase 4 integration remains pending. Next: owner reviews the rebuilt composition.


### 2026-11-06 — Clean hero without background lettering

Removed decorative DEEP markup, styling and unused animation. Refined headline weight/scale and spacing, rounded CTA, quieter slide controls and navigation matched to the original pale-white logo. Preserved original SVG artwork/colour as previously requested; no logo filters/redrawing. Existing ocean palette, custom banner and slideshow/reduced-motion controls retained.

Validation: frontend production build and 23/23 Chromium groups passed, including absence of DEEP, original logo loading, responsive layouts, slideshow and reduced motion. Desktop screenshot inspected. Diff check passed. Evidence: docs/phase4/evidence/clean-hero-2026-11-06/. Local app restored on port 3000. No commit/push/deploy/backend changes. Full Phase 4 integration remains pending. Next: owner reviews the cleaner hero.


### 2026-11-06 — Elegant reef banner generation

Generated a new original underwater reef banner with the imagegen skill: detailed sculptural coral at right, natural sunlight, small distant diver and open blue water for text. Saved non-destructive hero-elegant-reef-v2.png and optimized quality-90 JPEG. Updated hero asset and reduced desktop overlay to preserve light/detail. Original logo, clean typography, muted palette and responsive/slideshow controls retained. Generated atmosphere artwork is not an actual destination or inventory photograph.

Validation: frontend production build, diff check and 23/23 Chromium groups passed. Evidence: docs/phase4/evidence/elegant-reef-2026-11-06/. Local app restored on port 3000. No commit/push/deploy or backend changes. Full Phase 4 integration remains pending. Next: owner reviews the new image.


### 2026-11-06 — Static aligned hero content

Kept the approved elegant reef image. Removed pause/play, numbered slide buttons, carousel semantics, timer/state and unused control CSS. Hero now has one stable headline with shorter two-line supporting copy, consistent left alignment and natural spacing through the CTA. Removed continuous text motion; retained a short entrance disabled by reduced-motion preference.

Validation: frontend production build, diff check and 23/23 Chromium groups passed, including no hero buttons/carousel, responsive layouts and reduced-motion entrance. Evidence: docs/phase4/evidence/static-hero-content-2026-11-06/. Local app restored on port 3000. No commit/push/deploy/backend changes. Full Phase 4 integration remains pending. Next: owner reviews content alignment.


### 2026-11-06 — Hero display alignment fix

Unified header and hero gutters using a shared responsive variable (24px phone; centred 1296px desktop content area). Logo, eyebrow, headline, supporting copy and CTA share the same left edge. Removed remaining perspective entrance that shifted text relative to static elements. Approved image, colours and static content retained.

Validation: frontend build and 23/23 Chromium groups passed. Added bounding-box assertions for shared left alignment within 2px at 390/768/1440px; existing no-overflow and customer-flow checks pass. Diff check passed. Evidence: docs/phase4/evidence/hero-alignment-2026-11-06/. Local app restored on port 3000. No commit/push/deploy/backend changes. Full Phase 4 integration remains pending. Next: owner reviews alignment.


### 2026-11-06 — Portrait-led hero reference trial

Implemented the owner's new close-up diver reference direction using an original imagegen portrait (hero-diver-portrait-v3.png/JPEG), large editorial “Scuba / diving.” typography at left, transparent original-logo navigation and a compact translucent journey panel at right. Journey links target search results and Coral Horizon life-on-board content; no dummy controls, numbering, pause or carousel. Mobile stacks the journey panel below the headline with a portrait crop. Earlier reef assets preserved. Generated image is atmosphere artwork, not an actual destination/inventory photograph.

Validation: production frontend build and 23/23 Chromium groups passed, including responsive left alignment, image loading, no controls, no overflow and existing customer flows. Desktop and phone screenshots visually inspected. Evidence: docs/phase4/evidence/portrait-hero-2026-11-06/. Local app restored on port 3000. No commit/push/deploy/backend changes. Full Phase 4 integration remains pending. Next: owner reviews this reference-led direction.


### 2026-11-06 — Centred shaded portrait hero

Removed both journey cards and unused panel/thumbnail CSS. Restored “Dive beyond / the everyday.” and previous supporting copy. Centred headline, eyebrow, body and CTA; added layered dark navy shade plus text shadow for visibility over the portrait. Original logo/image retained; no numbered or pause controls.

Validation: frontend production build, diff check and 23/23 Chromium groups passed; explicit centre geometry assertions within 2px at desktop/tablet/phone and no hero journey navigation. Desktop screenshot inspected. Evidence: docs/phase4/evidence/centred-shaded-hero-2026-11-06/. Local app restored on port 3000. No commit/push/deploy/backend changes. Full Phase 4 integration remains pending. Next: owner reviews centred layout.


### 2026-11-07 — Production design reset and staged plan

Owner rejected current design for production and requested a proper plan. Reviewed current preview fixtures, actual customer routes, shared public API routes, previous implementation plan and integration map. Rewrote docs/phase4/IMPLEMENTATION_PLAN.md with verified current gaps, proposed design constraints, seven ordered delivery stages, complete search/detail requirements, resort adaptation, explicit owner approval of two representative pages, data contracts and production acceptance criteria. Updated DESIGN_REVIEW.md to remove conflicting current-direction claims. No application source changed.

Validation: documentation diff and referenced repository paths checked; application build/tests not run (documentation-only). Existing 23-group preview evidence remains historical and does not establish production readiness. Full integration/SEO/PWA/staging acceptance pending. Next: screen/data-state matrix and mobile-first wireframes, then one concrete full-page visual review package. No commit/push/deployment.


### 2026-11-07 — Customer UX plan before visual design

Prepared docs/phase4/UX_PLAN.md: customer tasks, information architecture, low-fidelity page structure, product-specific search semantics, consistent draft/apply filters, result-card comparison, detail/departure/enquiry flow, resort adaptation, error/unknown states and accessibility review. Linked from implementation plan. Plan is proposed, not owner-approved or implemented. No application source changed.

Validation: documentation diff and relative links checked; no application tests/build needed for documentation-only work. Next: low-fidelity mobile/desktop search/results and detail review package plus data-state matrix, before visual styling. No commit/push/deployment.


### 2026-11-07 — Dedicated Find a trip page

Owner clarified that Find a trip belongs on a different page. Updated UX and implementation plans: homepage contains an introduction and navigation CTA, without search form/results. CTA opens existing /explore/liveaboards; resort switch/product links use /explore/resorts. Search, advanced filters, sort and results remain together on the dedicated product-specific finder. No intermediate chooser or new architecture. Documentation only; no application implementation implied.

Validation: diff checked; no application build/tests run. Next: wireframe homepage-to-finder navigation and dedicated search/results/detail flows. No commit/push/deploy.


### 2026-11-07 — Detailed UX specification and persistent brand reference

Expanded UX_PLAN.md with per-screen content/action specifications, state ownership, public-resource dependencies, responsive rules and concrete wireframe review tasks. Homepage remains separate from trip finder. Recorded current seven-colour muted ocean palette and roles in BRAND_GUIDE.md/BRAND_TOKENS.json; preserved original SVG provenance and clarified historical #0080FF. Calculated solid-colour contrast locally. Fixed stale Phase 4 current summary and marked earlier bright-blue/pastel notes historical. Read-only independent plan review identified and resolved rollout sequencing, homepage-crop wording and stale enquiry-context reconciliation gaps.

Validation: documentation diff, relative links, JSON and palette contrast arithmetic checked. No application tests/build run (documentation only). Plans remain proposed, not implemented/owner-approved. No commit/push/deployment. Next: low-fidelity homepage entry, dedicated finder and full liveaboard detail/filters/enquiry wireframe package, with resort adaptation and error/unknown states before visual approval.


### 2026-11-07 — App-like mobile shell and homepage discovery

Owner requested app-like mobile, homepage popular trips/liveaboards and main navigation Home/About us/Contact. Updated UX_PLAN.md with labelled mobile bottom navigation, safe-area/keyboard/modal/sticky-action rules, homepage discovery sections backed by published V2 data, honest Popular versus Featured selection and planned /about-us and /contact routes/content dependencies. Dedicated finder remains separate. Updated implementation/brand continuity documents. Independent read-only review confirmed these navigation, data-truth and route-gap concerns. No application edits.

Validation: documentation diff/relative links checked; application tests/build not run (documentation only). Plan remains proposed; no new UI implemented. Next: wireframes for mobile shell/home discovery/about/contact and dedicated finder/detail flows using current muted ocean palette and original logo. No commit/push/deploy.


### 2026-11-07 — Implemented customer marketplace UX in real routes

User authorized implementation then asked to complete. Created branch phase4-customer-ux-implementation preserving prior local/unrelated changes. Implemented shared original-logo/ocean-colour shell, app-like mobile bottom nav Home/About us/Contact, actual homepage featured departures/liveaboards, About/Contact pages, separate V2-backed finders, liveaboard/resort detail/gallery/contextual enquiry and form states. Corrected same-itinerary compound search in shared backend with 5 regressions. No fixture inventory imports in production customer pages. Read docs/phase4/CUSTOMER_IMPLEMENTATION_2026-11-07.md for files, evidence and limits.

Validation: normal-config frontend build and loopback-test build passed; 13/13 production-route Chromium groups with synthetic API, 5/5 frontend query-state units, backend syntax107 files and 46/46 units passed; original logo hashes/diff/syntax checks passed. Browser screenshots inspected. No local V2 API/database running; port5000 is macOS system process. Frontend restored on3000 normal config and test servers stopped. Catalogue requires isolated devAPI; unavailability handled honestly. Full shared commercial gaps, SEO/PWA and integrated/staging acceptance remain pending. No commit/push/deploy/email/env edits. Next: owner reviews actual homepage/finder/detail; start isolated V2 development API for real-data verification, then close documented Phase4 contract gaps.


### 2026-11-07 — Applied colour theory and shared semantic roles

Used existing analogous ocean palette with dominant neutral reading surfaces, structural navy/teal and restrained selected/focus accents. Added shared colour roles to CustomerShell and consumed them in marketplace/detail/enquiry CSS. Improved border/focus contrast and semantic error/success feedback; original brand/logo unchanged. Updated BRAND_GUIDE/BRAND_TOKENS; corrected document-title warning. See docs/phase4/COLOUR_THEORY_2026-11-07.md.

Validation: test-config and normal frontend builds passed, 14/14 loopback synthetic-API browser groups passed including computed CTA contrast >=4.5:1 and field border >=3:1; diff check passed. No backend changes/tests or DB/email calls. Local dev restored3000 normalconfig; V2API still not running. No commit/push/deploy. Full Phase4 acceptance remains pending.


### 2026-11-07 — Applied owner-linked GitHub design skills

Read elayadesign/ai-design-skills landing-page-design and linked existing-project redesign audit; applied relevant guidance in current stack. Single locally hosted Manrope with OFL licence, named type/spacing roles, larger labels, consistent button/radius treatments, specific homepage copy, three-step journey, factual FAQ/final CTA and reduced-motion word reveal. Preserved original logo, ocean palette, mobile 3-tab nav, separate finder and V2 data boundaries; generic conflicting skill defaults not applied. No global install/Figma operations needed. See docs/phase4/GITHUB_DESIGN_SKILL_2026-11-07.md.

Validation: test-config/normal frontend builds passed, 15/15 loopback synthetic-API browser groups passed including type/FAQ/reduced-motion/contrast/flows. Desktop/phone screenshots inspected; diff check passed. No backend changes/tests rerun, no real DB/email writes, no env edits/commit/push/deploy. Frontend restored3000 normal config; local V2API still absent. Full Phase4 acceptance pending.


### 2026-11-07 — Restored face-image hero on customer homepage

Owner rejected the reef hero and requested the previously generated face image. Changed the actual homepage to hero-diver-portrait-v3.jpg, with mask/face visible to the right of desktop copy and above the mobile copy. Added a flat ocean shade and image mask to blend portrait into the existing navy surface. Retained original logo, Manrope system, current colours, Find a trip route, mobile navigation and all remaining customer pages. No image generation or business logic changes.

Validation: test-config and normal frontend builds passed; 15/15 synthetic loopback API browser groups passed, now asserting portrait asset. Desktop/phone hero crops visually inspected; diff check passed. Existing V2 API runtime limitation and full Phase4 acceptance gaps remain. Frontend restored3000 normal config. No commit/push/deploy/backend changes.


### 2026-11-07 — Subtle 3D depth and scroll reveals

Added progressive-enhancement useHomeMotion hook to actual homepage. Hero portrait responds to fine-pointer movement with small perspective rotations and to scrolling with bounded20px depth movement; only image transforms, text/CTA remain stable. Offscreen homepage sections rise/fade once using IntersectionObserver, cards lift on fine-pointer hover. Scroll work coalesced by requestAnimationFrame, stops offscreen/hidden; listeners/frames/observers cleaned up. Keyboard focus reveals content; no JS means visible fallback. Live reduced-motion changes remove transforms and pending reveals. No autoplay, hijacked scrolling or numbered/pause controls.

Validation: frontend test-config and normal builds passed; 16/16 loopback synthetic-API browser groups passed, including pointer depth response, targeted section reveal and live reduced-motion reset. Existing customer flows/contrast/responsive checks pass. Diff/runner syntax checks passed. Full-page home captures use reduced motion to avoid documenting unrevealed below-fold content as incomplete. No backend/API/DB/email changes. Frontend restored3000 normal config; existing real catalogue API dependency/full Phase4 gaps remain. No commit/push/deploy.


### 2026-11-07 — Logo-shaped D portrait and visible navigation

Reused the original logo's D vector path in a separate hero-d-mask.svg asset without changing the original wordmark. Hero portrait now sits in the actual D outline with a small offset ocean-colour depth layer; mobile positions it above copy. Added a solid Ocean deep header surface and high-contrast active/nav labels. Existing pointer/scroll motion, app-like phone tabs, original logo, palette and finder routes retained.

Validation: frontend test-config and normal builds passed; 17/17 loopback synthetic-API browser groups passed, including D-mask URL and image/header separation. Desktop and phone screenshots visually inspected. Diff check and original logo hashes passed. No backend/business-data changes. Frontend restored3000 normal config; local V2API and full Phase4 acceptance gaps unchanged. No commit/push/deploy.
