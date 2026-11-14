# Phase 4 customer UX plan

Prepared: 2026-11-07 (Asia/Dhaka). Status: proposed UX; not approved or implemented.

This document defines the customer experience before visual styling. It implements the owner's brief within the [production delivery plan](IMPLEMENTATION_PLAN.md). Existing V2 services remain responsible for inventory, attributes, effective pricing, offers, availability and enquiry validation. Historical hero experiments do not determine the final layouts.

## 1. Customer tasks and success

| Customer intent | Experience must answer | Success condition |
| --- | --- | --- |
| Explore without fixed dates | Where can I dive, and what type of trip suits me? | Browse useful results with optional dates; no forced account creation. |
| Find a specific trip | What departs in my date range, within my budget? | Apply destination/date/duration/price together; cards show matching trip context. |
| Check personal requirements | Can dietary, accessibility or diving needs be accommodated? | Find relevant filters and explicit product information; unknown support is not presented as confirmed. |
| Compare options | What differs in dates, duration, price and availability? | Scan consistently structured cards, open a detail and return with search state intact. |
| Enquire confidently | What am I asking about and what happens next? | Selected product/departure/package remains visible; server-accepted enquiry produces a truthful confirmation. |

Comparison initially means consistent card/departure information and preserved browsing state. A separate comparison tool, wishlist, reviews or checkout is not added without a scoped requirement.

## 2. Main customer journey

Homepage → Find a trip (dedicated page) → choose liveaboards or resorts → enter optional criteria → review results → refine → inspect product → choose departure/package where possible → enquire → confirmation.

Direct links to product pages must work without first searching. Customers without fixed dates can enquire about a product generally. Returning from detail restores filters, sort, page and practical scroll position.

## 3. Information architecture

| Screen | Primary purpose | Main action |
| --- | --- | --- |
| Public landing | Introduce Deeparture, show featured/popular trips and liveaboards; no embedded search form | Find a trip or open a featured product |
| About us (planned) | Explain Deeparture, its approach and the enquiry model | Find a trip |
| Contact (planned) | Provide approved help/contact channels | Contact the team / product enquiry |
| Liveaboard search/results | Find suitable vessels and matching departures | View trip |
| Resort search/results | Find suitable resorts and packages | View resort |
| Liveaboard detail | Evaluate vessel, itinerary, cabins and dates | View departures / Enquire |
| Resort detail | Evaluate resort, rooms, packages and stay context | View packages / Enquire |
| Enquiry form and confirmation | Collect a contextual enquiry and explain next steps | Send enquiry |

Keep the existing routes/application. Landing is part of the eventual scope, but first UX review focuses on search/results and one complete liveaboard detail. No new account requirement for browsing or enquiry unless mandated by the controlling contract.

## 4. Landing and hero behaviour

- Original logo and main navigation: **Home / About us / Contact**. Desktop places these links in the header; mobile uses a labelled bottom navigation bar. Find a trip remains a prominent contextual CTA, not a fourth bottom-nav item.
- One short heading and supporting sentence, with imagery behind a controlled readable overlay.
- Homepage hero has a clear “Find a trip” link/button that navigates to the dedicated trip-finder page. No destination/date inputs, advanced filters or interactive search results are embedded in the homepage. Curated popular-trip and liveaboard sections link directly to details or the separate finder. This is a page transition, not an anchor scroll or modal.
- Dedicated trip-finder page contains the Liveaboards / Resorts switch and destination/date controls. Labels and semantics change appropriately; incompatible values are not silently carried between products.
- No autoplay slides, giant decorative words, numbered controls or distraction cards.
- Previously liked imagery can remain a candidate; final crop depends on the homepage composition, not the other way around.

## 5. Dedicated Find a trip page

Use the existing `/explore/liveaboards` and `/explore/resorts` routes as the product-specific trip finder. The main homepage “Find a trip” CTA initially opens `/explore/liveaboards`; the product switch links to the resort finder. Product-specific homepage links can open the corresponding route directly. Do not add an intermediate chooser screen or duplicate frontend system.

Search controls and results live together on this dedicated page. A new visitor can browse results with optional criteria; changing criteria does not send them back to the homepage. Results shareable URLs preserve product, filters, sort and page. Homepage navigation remains available from the logo.

### Search/results structure

Desktop wireframe (information order, not final styling):

```text
[Logo]                  [Home] [About us] [Contact]
Find your next dive trip
[Destination] [Departure window] [Trip length] [Price] [Search]
[Applied filters with Remove]                           [Clear all]

[Advanced filters]    [Result count]                  [Sort]
[Availability]        [Image | Name, location, matching dates]
[Vegan Rating]        [      | Duration, key attributes     ]
[Dietary]             [      | Price, offer, status, View   ]
[Accessibility]       [Next result ...                      ]
[Diving / facilities] [Pagination                           ]
```

Phone wireframe:

```text
[Logo]                             [Page title]
Find your next dive trip
[Destination                                ]
[Departure window                           ]
[Trip length             ] [Price           ]
[Search                                     ]
[Result count]            [Filters] [Sort]
[Applied-filter summary / Clear]
[Image                                      ]
[Name + destination                         ]
[Matching dates / duration                  ]
[Key attributes                             ]
[Price + basis / offer / availability       ]
[View trip                                  ]
[More cards ...] [Pagination]
[Home]              [About us]         [Contact]
```

Propose horizontal cards on desktop for easy comparison and full-width stacked cards on phone. Tablet follows available space rather than squeezing a permanent sidebar; use a filter drawer where needed.

### Main criteria

| Control | Proposed behaviour |
| --- | --- |
| Destination | Searchable options from shared location data; allow Anywhere; visible selected destination; keyboard accessible. |
| Liveaboard dates | Label “Departure window”: departure starts between selected dates. Dates optional; reject reversed ranges. Do not imply the entire trip must finish before the second date. |
| Resort dates | Check-in/check-out where supported. Never reuse departure-window semantics for stays. If rate/availability contracts cannot evaluate a stay, surface that limitation and support an enquiry. |
| Trip length | Label in nights, with Any and supported ranges. A matching trip must satisfy all selected criteria. |
| Price | Maximum budget plus currency and pricing basis. A number/range field is usable without dragging a slider. Do not compare mixed currencies without an established server policy. |

Main search fields use draft state and an explicit Search action. Keep existing results visible while a replacement loads; indicate loading and prevent repeated submits. Applied criteria go into the URL. Browser back/forward and reload restore them.

### Advanced filters

Proposed groups: availability/offers; Vegan Rating; dietary requirements; accessibility; diving features (nitrox, photography, rebreather); facilities. Options come from shared definitions and product applicability.

- A requirement checkbox means that requirement must be met. Multiple dietary/accessibility requirements are conjunctive, not silently treated as alternatives.
- Destination alternatives may use OR only if multi-destination selection is later approved. Across groups use AND. API mappings must be verified before implementation.
- Available-only excludes unknown, sold-out and on-request states; implementation depends on shared resolution/freshness rules.
- Vegan Rating uses a labelled minimum threshold and a brief explanation of the scale. Missing ratings are not zero or confirmed vegan support.
- Draft advanced selections are applied explicitly, on both desktop panel and mobile drawer, for consistent predictable behaviour.
- Drawer has a title, Close, grouped expandable sections, Clear and sticky Apply filters. Close/Escape/Cancel discards uncommitted edits; reopening starts from applied values. Clear resets draft values until Apply. Outside Clear all immediately resets all applied criteria and page.
- Show accurate selected counts. Only show a prospective result count if the API can supply it; otherwise use “Apply filters”.
- Applying criteria resets page to one. Removing an applied chip updates the URL/results. Never automatically relax a customer's dietary/accessibility requirements to fill results.

### Cards, sorting and pagination

Cards show actual product image, name, destination, matching departure dates or duration, a few important attributes, starting/effective price with currency and per-person/per-night/package basis, valid offer, availability and a single clear detail link. Avoid unrelated photography implying it is the vessel/room. Missing image gets an honest neutral fallback.

If a vessel has multiple matching departures, show a representative matching departure and “More dates” only when supported. “From” price must refer to the current matching context, not a cheaper departure outside the chosen window.

Desired sort options: earliest departure, price low/high and name, only after shared services support them. Do not label an arbitrary order “Recommended” without a defined ranking. Pagination displays current page/total and Previous/Next; preserve sort and criteria and announce updates. Scroll to results heading after a page change without unexpectedly moving focus during filter editing.

## 6. Liveaboard detail structure

```text
[Navigation]
[Back to results / destination breadcrumb]
[Vessel name, location, concise identity]
[Gallery: main image + thumbnails / View photos]
[Overview | Diving & facilities | Itineraries | Cabins | Dates]

[Overview and key trip facts]         [From price + basis]
[Dietary/accessibility details]       [View departures]
[Itinerary / route / duration]        [General enquiry]
[Cabins with imagery + descriptions]
[Departure list: date, nights, status, price, Select]
[Selected trip summary and enquiry form]
```

On mobile use a swipe-capable/keyboard-capable gallery, stacked sections and readable departure cards. A small bottom CTA can jump to departures; it must not cover controls, keyboard or enquiry submission. Sticky behaviour ends or adjusts when its target section is visible.

Gallery supports labelled controls, Escape, focus return, meaningful image descriptions and missing-media handling. Section links scroll to headings with room below fixed navigation. Avoid hiding crucial information exclusively inside a gallery or hover state.

Departure selection updates a visible summary: vessel, itinerary, departure dates, duration, cabin context if available, effective price/basis and current availability. Selection persists into enquiry; switching it updates all related fields. Sold-out entries remain distinguishable and cannot imply bookable availability. Useful published pages without departure inventory offer a general enquiry.

Dietary/accessibility information describes concrete support (for example access to a particular area) rather than claiming the whole trip is universally accessible. Unknown or unverified support invites a question.

## 7. Resort adaptation

Retain the same navigation, search patterns, card hierarchy, gallery and enquiry interaction. Replace vessel concepts with rooms, occupancy where supported, packages, stay duration, check-in/out and rate periods. Show minimum stays, seasonal pricing and availability basis when supplied. Do not fabricate an exact stay total from a starting package price.

The first approved liveaboard pattern is adapted deliberately; the resort version requires its own UX pass before implementation.

## 8. Enquiry experience

1. Open from a selected departure/package or choose General enquiry.
2. Show immutable product identity and editable selection context. Carry stable IDs to the server, not only display labels.
3. Request name, email and message; make phone/extra preferences optional unless the accepted contract requires them. Explain intended use near the relevant fields; no unnecessary personal data.
4. Validate visibly, preserve input on errors and focus the first error/summary appropriately. Disable duplicate submission while pending.
5. Submit through the existing V2 enquiry endpoint and relationship validation. Revalidate selected relationships and current commercial context before treating the enquiry as accepted. If a selected departure becomes unavailable or price/context changes, preserve the message/contact fields, show the change and require review or another selection. An enquiry may still be allowed for on-request/unknown availability, but the summary must say so. Do not present a previous price as a guaranteed quote. Shared contract changes are required if this reconciliation is not supported. No browser email delivery or fabricated success.
6. After server acceptance show “Enquiry received”, the selected context, reference if returned and a concise explanation that the team will review it. An enquiry does not reserve space or confirm price. Do not promise a response time without an established service commitment.

No form submission tests send real email; use the separate development/staging database and test transport.

## 9. Required state designs

| State | Customer-facing behaviour |
| --- | --- |
| First visit | Helpful optional search defaults; browse without filling every field. |
| Loading | Stable layout/skeletons; current criteria visible; accessible status announcement. |
| No matches | Explain current criteria; offer targeted edits or Clear all; preserve requirements until explicitly changed. |
| Network/server failure | Clear retry action; retain criteria/form values; do not display failure as zero inventory. |
| Unknown/stale availability | “Check availability” with context; no false space count or available badge. |
| Missing price | Enquire for price; never show zero/free. |
| Expired offer | Resolve through shared services; remove invalid savings and refresh relevant context. |
| Unpublished/not found | Useful not-found navigation without exposing draft inventory. |
| Enquiry error | Preserve input, explain retry path and avoid duplicate acceptance. |
| Offline | Honest offline status; do not present cached commercial information as current confirmation. |

## 10. Accessibility and usability review

Visible labels, logical headings, keyboard-operable search/filters/gallery, visible focus, sufficient contrast, comfortable touch targets, screen-reader status/error messages and reduced-motion support are part of UX from the start. Use native controls where they provide a better experience; custom date/location controls must earn their complexity.

Review at 320/390px phone, 768px tablet and 1440px desktop, plus browser zoom. Test long product names, large prices, missing media, many filters and slow/error responses. Avoid hidden horizontal page scrolling, hover-only information and overly tall hero content.

## 11. First review deliverables and approval boundary

Deliver these before applying a full visual theme:

- Low-fidelity mobile and desktop search/results layouts, plus tablet filter behaviour.
- Low-fidelity mobile and desktop liveaboard detail with gallery, departure selection and enquiry.
- Advanced-filter drawer interaction showing draft/apply/cancel/reset.
- Empty/error/unknown examples and a screen-to-data-source matrix.
- A short task walkthrough: find a date/budget match; apply dietary/accessibility requirements; compare departures; submit a contextual enquiry; return to results.

UX approval concerns order, task flow, controls, data clarity and mobile behaviour. Visual approval of palette, type, imagery and component finish follows in a separate concrete review. Neither approval is production acceptance.

Unresolved contract items to verify during the audit: supported price/date sorts, same-departure compound matching, freshness-aware available-only filtering, resort stay/occupancy pricing, available cabin context and enquiry context fields. Do not expose unsupported controls as working functionality.

Next task: produce the low-fidelity review package from this plan in the existing frontend, without another banner redesign. No additional feature scope or new frontend architecture is implied.

## 12. Persistent brand constraints

Read [BRAND_GUIDE.md](BRAND_GUIDE.md) before every visual implementation task. Current ocean palette: **#071925 / #123749 / #294E5C / #50636B / #527787 / #6D919D / #9DB7C3**. Earlier bright-blue/pastel palettes are historical. White and Paper (#F5F8F9) are supporting neutral surfaces. Preserve original logo SVGs and colours; use the original pale-white version against dark surfaces. Current customer UI uses a single locally hosted Manrope type family following the later owner-requested GitHub design guidance; original logo files remain unchanged.

UX wireframes may be neutral to keep discussion on structure, but their eventual component roles must respect that brand reference. Do not reinterpret a neutral wireframe as approval to introduce another colour palette.

## 13. Screen-by-screen content and action specification

### H1 — Homepage `/`

Purpose: help a new visitor understand Deeparture and reach the trip finder. No embedded search/filter/results module.

Order:

1. Desktop header: original logo/home link, Home, About us, Contact and a separate Find a trip CTA. Mobile: compact logo/title top bar and persistent Home / About us / Contact bottom navigation; avoid duplicating those links in a hamburger menu.
2. Hero: one concise heading, short supporting copy and primary **Find a trip** CTA. CTA navigates to `/explore/liveaboards`, rather than scrolling or opening a modal. No carousel, extra journey cards or decorative giant word.
3. Popular trips: a small curated set of actual published trips/packages with image, destination, relevant dates/duration, effective price/basis and availability when verified. Cards open matching details. No search form or pagination in this section.
4. Liveaboards: a distinct section of actual published vessels with image, name, destination and a few useful attributes. View liveaboard opens detail; View all liveaboards opens `/explore/liveaboards`.
5. Product entry link for Dive resorts opens `/explore/resorts`, without adding another main-navigation item.
6. A concise explanation of how Deeparture helps with diving, dietary and accessibility preferences. Claims must be supported; avoid universal guarantees.
7. Simple process explanation: explore trips, review details, send an enquiry. Clarify the enquiry model rather than implying instant booking.
8. Footer: working customer navigation, contact/help/legal links only to real approved destinations, plus existing operator access. Unsupported destinations are content dependencies, not decorative dead links.

Do not add testimonials, trust statistics, promotional counters or destination collections without approved content and an existing route/data plan. Prioritise the first two representative review pages before implementing this full homepage.

### F1/F2 — Liveaboard/resort finder

Purpose: identify relevant trips and understand the price/availability context. Dedicated routes `/explore/liveaboards` and `/explore/resorts`.

Order:

1. Compact header and page title; no full-screen hero.
2. Product switch with active state and optional criteria appropriate to the selected type.
3. Main search form. Large screens use a horizontal row; phones stack destination/date controls and pair duration/price only when labels/inputs fit.
4. Results heading/count and supported sort. On phone, Filters is adjacent and shows the number of applied advanced selections.
5. Applied-filter summary with individual removal and Clear all; wrap without horizontal page overflow. On phone, collapse excessive chips under a labelled Show filters action with an accurate count.
6. Desktop advanced sidebar with Apply/Clear. Tablet/phone drawer uses the same groups, state and taxonomy.
7. Comparable result cards and pagination. On desktop use one readable horizontal result per row; on phone image above information. Make a prototype choice once, then test with long names and sparse data before approving it.

A card's View trip/View resort link is the single primary action. The image/title can link to the same destination. Do not add speculative favourites, compare buttons, ratings or booking widgets.

### D1 — Liveaboard detail

Order: back/breadcrumb → identity/location → gallery → key facts → overview → dietary/accessibility/diving/facilities → itineraries → cabins → departures → selected enquiry context/form → related navigation/footer.

Desktop can show a compact sticky enquiry/price summary alongside readable content. Phone uses sequential sections; a sticky bottom action is allowed only if it improves access and never covers the form. The full price basis and availability status remain accessible outside the sticky summary.

Default action: **View departures** when usable dated inventory exists; **Enquire about this liveaboard** when it does not. Within a departure: **Enquire about this departure**, which selects the date and takes the customer to the context/form. Do not label any action Book now unless a real supported booking flow exists.

### D2 — Resort detail

Order: back/breadcrumb → resort identity/location → gallery → overview/diving → dietary/accessibility/facilities → rooms → packages → stay/rate context → enquiry.

Room/package relationships must remain clear. Distinguish package duration from requested stay dates. Default action is **View packages** or **Enquire about this resort**, according to actual data. Missing seasonal rate coverage must not produce an invented total.

### E1/E2 — Enquiry and confirmation

The enquiry form is an anchored section of the relevant detail page for the first proposal; it does not require another full-screen route or account. A direct link can target it. The detail title and product context remain visible; mobile does not require a context-hiding modal.

Header: “Enquire about [product]”. Summary: product, selected itinerary/departure/package, relevant dates and latest price/availability context. Include **Change trip details** linking to the appropriate selector without discarding typed contact/message values. Explain that an enquiry is not a reservation.

After acceptance, replace the form area with a confirmation panel that remains visible for the current page session and appropriate product/search navigation. Reload must never resubmit automatically. Cross-reload confirmation requires a supported non-sensitive server receipt mechanism; otherwise reload returns to the detail/form without inventing a recovered success state. Do not persist contact/message values in localStorage just to recreate confirmation. Do not rely on a transient toast. Display returned reference only when supplied. Preserve the summary, omit unnecessary exposure of personal data and do not claim payment/booking confirmation.

## 14. Interaction rules and state ownership

| Event | Proposed behaviour |
| --- | --- |
| Edit destination/date/length/price | Draft only until Search; show criteria used by current results separately from uncommitted edits. |
| Search | Validate ranges, apply main draft while retaining applied advanced filters, reset page, update shareable URL and request current results. |
| Apply advanced filters | Apply advanced draft against the currently applied main criteria. Unsubmitted main edits remain draft; show a clear unapplied-changes cue to avoid ambiguous results. |
| Close advanced drawer | Discard advanced edits; retain applied criteria/results. Restore trigger focus. |
| Remove applied chip | Update applied state and its matching draft field, reset page and query. Preserve unrelated pending main edits. |
| Clear all | Reset main and advanced applied/draft criteria plus page; retain product type. Sort returns to the documented default. |
| Change sort/page | Use applied criteria, preserve draft edits and make current state unambiguous. Sort resets page; page does not reset criteria. |
| Browser back/forward/reload | Restore applied state from URL; ignore unsupported keys, validate known values and explain any invalid criteria that were reset. Do not overwrite a newer request with an older response. Do not put names/emails/messages in URLs. |
| Change liveaboards/resorts | Keep destination only when valid for both; reset incompatible dates/duration/attributes/page. Explain product change; never silently reinterpret a departure window as a stay. |
| Leave detail for results | Restore the originating result URL/page and practical scroll position; direct-entry detail has a default finder link. |
| Change departure/package | Update selected context atomically and retain contact/message fields. Prevent old price/status remaining attached to new IDs. |
| Submission timeout/retry | Preserve input, avoid automatic repeated submissions; use the server's duplicate/idempotency behaviour if supported and define reconciliation before rollout. |

Avoid duplicate filter truth in separate components. URL state describes applied criteria; form/drawer draft state is explicit. UI state does not calculate prices, availability or eligibility.

## 15. Data and screen responsibility matrix

This is a planned mapping to existing V2 resources, not confirmation that every required field/sort is currently supported. Respect configured API bases; do not hardcode a new service.

| Screen/interaction | Existing shared resource | Required verification |
| --- | --- | --- |
| Liveaboard results | `GET /v2/liveaboards` | Same-departure compound matching, normalized filters, supported sorts, pagination, effective price/basis, offer validity, freshness-aware availability. |
| Resort results | `GET /v2/resorts` | Room/package/stay criteria and occupancy where supported, rate coverage, pricing basis, availability semantics. |
| Liveaboard detail | `GET /v2/liveaboards/:slug` | Published media, itineraries/cabins/departures, correct relationships and consistent effective commercial fields. |
| Resort detail | `GET /v2/resorts/:slug` | Rooms/packages/rate periods, inclusions and missing-stay-coverage states. |
| Advanced choices/features | Shared attribute definitions and product attributes | Product applicability, stable IDs, labels and conjunctive requirement semantics. |
| Destination picker | Existing shared location data or server-provided facets | Confirm public access and hierarchy before choosing a contract; no independent hardcoded destination catalogue. |
| Enquiry | `POST /v2/enquiries` | Accepted customer/context fields, relationship validation, duplicate handling, Admin review and test email transport. |
| Homepage media/help/legal copy | Approved local content/media and actual destinations | Provenance, truthful claims, operational links, responsive crop and no sensitive/stale inventory content. |

Missing contracts are tracked as implementation dependencies. UX layouts can illustrate a required state, but a control is not shipped as functional until its shared service behaviour is verified.

## 16. Responsive and component handoff rules

- Mobile 320–700px: app-like compact top bar and Home / About us / Contact bottom navigation, one main reading column, stacked search, advanced drawer, full-width cards and readable departure cards. Avoid full-page horizontal scrolling and mandatory swipe-only actions.
- Tablet 701–1100px: adequate form widths; use a drawer when a sidebar leaves inadequate result space. Gallery/departure layout adapts independently of the main page breakpoint.
- Desktop above 1100px: shared centred container (proposed maximum 1296px), readable side panel and broad result rows. Header, title, controls and content use the same gutter.
- Use a consistent 4/8px-based spacing proposal in visual design, with practical labelled field sizes and at least 44px primary touch targets. Final measurements follow content fit, accessibility and owner review.
- Keyboard focus must survive result refreshes and return correctly after drawers/galleries close. Announce result count changes without reading the entire result list.
- A modal/drawer title and visible Close are required. Sticky elements must account for viewport height, mobile keyboard and safe-area insets.
- Price is a structured component: prefix if needed, amount, currency, basis, eligible duration/date context, original price/discount only when valid. Availability is a separate labelled state, not inferred from price.
- Inclusive-travel attributes use concrete labels, explanations and “Not provided / Ask us” where appropriate. A lack of data never becomes a negative claim or an accessibility guarantee.

## 17. Wireframe package and review checklist

The next concrete deliverable is a neutral wireframe package, not another banner iteration:

| Review item | Required examples | Review question |
| --- | --- | --- |
| Homepage entry | App-like phone shell, desktop header, concise hero, popular trips, liveaboards and Find a trip link | Is content discoverable and the separate finder easy to reach? |
| Finder | 390/1440px populated results, 768px adaptation and 320px fit | Can a customer search and compare without hunting for price/date/status? |
| Filters | Drawer open, edited, applied, cancelled and cleared | Is it clear which requirements currently affect results? |
| Detail | Full liveaboard, sparse inventory variant, gallery and cabins | Can a customer judge the product without jumping between unrelated areas? |
| Departures/enquiry | Two departures with differing states, context selection, form/error/success | Does the enquiry accurately describe the chosen trip? |
| Resort adaptation | Room/package/stay sketch | Are resort-specific concepts clear rather than relabelled vessel fields? |
| State samples | Loading, zero results, network failure, unknown status, missing media/price | Is each outcome honest and recoverable? |
| Brand reference | Palette role sheet, original logo usage and contrast notes | Does later styling have one consistent reference? |

Walk through five tasks before requesting UX approval: browse with no dates; find a date/budget match; apply dietary/accessibility requirements; select a departure and enquire; return to the originating results. Record observed problems, revise the wireframes, and present the resulting package. No usability study has been performed yet; these are review tasks to execute, not completed test results.

Scope gates: agree information architecture/interactions → create polished search/results + one detail design → obtain explicit visual approval → verify/implement shared V2 contracts → roll out integrated shared components to liveaboards/resorts → verify all Phase 4 requirements. The owner's separate-page decision and current palette are fixed inputs unless subsequently changed by the owner.


## 18. Owner update — mobile app view, homepage discovery and navigation

Recorded: 2026-11-07. This updates the earlier homepage/navigation proposal while retaining the separate trip finder and current brand palette.

### Navigation and route model

| Main item | Destination | Planned behaviour |
| --- | --- | --- |
| Home | `/` | Homepage discovery content, hero, popular trips and liveaboards. |
| About us | `/about-us` (planned) | Deeparture story, inclusive-travel approach, how enquiries work and Find a trip CTA. Only substantiated team/experience claims. |
| Contact | `/contact` (planned) | Approved support channels, help guidance and a clear path to a product-specific enquiry. |

About us and Contact customer routes were not found in the current route inventory; these are planned new pages in the same Next.js application, not existing working destinations. Approved copy/contact channels are content dependencies. Do not create dead nav links in the review or ship an unsupported contact form. If a general contact form is required, its service/validation/delivery contract must be scoped rather than misusing product enquiries.

Find a trip remains a visible CTA in the homepage hero and relevant pages, opening `/explore/liveaboards`; Liveaboards/Resorts switch stays inside the finder. Main navigation remains the three owner-requested items. Detail/search pages retain back-to-results and product-specific navigation without introducing more global tabs.

### Phone app-like shell

```text
[Original Deeparture logo]           [Page context]
[Concise hero + Find a trip                    ]
[Popular trips                     View all   ]
[Trip card with dates/price/context            ]
[More curated cards                           ]
[Liveaboards              View all liveaboards]
[Vessel cards                                 ]
[Inclusive travel / How it works / Footer      ]
[Home]               [About us]        [Contact]
```

- This remains the responsive website/PWA within the existing frontend; no native app or separate mobile system.
- Bottom navigation has three equal labelled targets, at least 44px high, visible active state and screen-reader page context. Keep text labels; any later icon must aid recognition and never replace the label.
- Use a dark Ocean deep/night surface with original light logo above; bottom navigation uses dark text on white or clearly contrasted labels on a dark surface. Active state uses underline/shape/weight as well as colour. Follow BRAND_GUIDE.md; no new palette.
- Main content reserves space for bottom-nav height plus `env(safe-area-inset-bottom)`. Fixed navigation must not cover cards, pagination, enquiry errors or the final form action.
- Avoid stacked fixed bars: on detail pages place any trip CTA inside a coordinated action area above the nav or in normal flow; hide/reflow it while enquiry controls are in view. When a drawer/gallery opens, its modal layer owns focus; background navigation is not interactive. Reflow/hide persistent bars when the mobile keyboard would obstruct fields.
- Preserve native browser back behaviour, search URL state and useful scroll restoration between tabs/routes. Do not add gesture-only navigation, forced splash screens or unnecessary page transitions.
- Prefer a compact mobile hero so Popular trips becomes discoverable early in the scroll. Crop images intentionally; avoid shrinking a desktop promotional canvas into a tall phone banner.
- Tablet can use top navigation when all three links and CTA fit; desktop uses the header navigation with no persistent bottom bar.

### Homepage popular-trip and liveaboard rules

- Proposed initial density: three popular trips and three liveaboards on desktop, with a small vertical set on phone. This is a layout proposal to validate, not an inventory promise. No autoplay sliders; if a horizontal shelf is later chosen, provide explicit accessible navigation and avoid page overflow.
- Popular trip cards are trip/departure/package-led; Liveaboards cards are vessel-led. Reuse product facts consistently but avoid showing the exact same item repeatedly across both sections when alternatives exist.
- “Popular” is a factual claim. Use an agreed selection/ranking source only if available. Until genuine popularity evidence exists, label the section **Featured trips** or **Trips to explore**, keeping the requested discovery section without fabricated booking counts, urgency or rankings.
- Selection uses published eligible V2 data and an approved editorial selection if required. Do not copy fixture arrays into the live homepage, infer popularity from arbitrary order or invent a separate availability/pricing engine.
- Price/date/status must match the selected trip; if no dependable dated context exists, use vessel-level descriptive content and View liveaboard rather than a misleading offer. Empty collections collapse gracefully; errors are not marketed as no trips existing.
- Homepage card-to-detail links retain selected departure/package context only using contract-supported identifiers. View all goes to the dedicated finder, with a matching supported collection/filter only if implemented.
- Loading and missing media states must retain readable labels and avoid layout shift. Generated atmosphere imagery may decorate the hero; listing images must represent actual products.

### Additions to the next UX review

Include app-like mobile Home, About us and Contact sketches; a populated homepage with both discovery sections; the separate finder transition; and detail/enquiry layouts with safe bottom navigation. Check 320/390px, keyboard-open form, bottom safe area, modal layering and returning from detail. Existing Phase 4 SEO/PWA acceptance remains separate from this app-like visual behaviour.
