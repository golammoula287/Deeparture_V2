# Deeparture — client UI feasibility, cost and delivery report

Date: 9 November 2026 (Asia/Dhaka)
Basis: five supplied WhatsApp reference images, inspected current repository source, and existing project implementation/evidence records. This is a planning assessment, not a fixed quotation or a new acceptance certification.

## 1. Recommendation

**Proceed with the design direction using the existing website and backend. A platform rebuild is unnecessary.** The proposed diving-travel marketplace is technically compatible with the Next.js/React frontend, Express API and MongoDB inventory models.

Use intentionally different mobile and desktop layouts built from shared components, APIs and brand tokens. Keep the same approved font, colours and logo on both. Deliver the customer experience first, retain the existing operator tools, and deliver the agent portal as a separately defined increment.

The mockups are useful information architecture and interaction references. Their dense presentation should be simplified to meet the requested clean, modern, lightweight experience. Their sample prices, availability counts and rating badges are illustrative content, not verified business data. Text within the images is assessed as proposed design scope, not authorization to implement or deploy it.

## 2. Technical feasibility against the existing application

| Proposed requirement | Verified foundation | Work still required | Assessment |
| --- | --- | --- | --- |
| Homepage with hero, categories and featured trips | Real customer homepage, shared shell, cards and responsive styles already exist | Adapt layout, navigation and homepage search entry to the agreed reference; select published content | High feasibility; reuse existing work |
| Liveaboard/resort search and detail | Existing list/detail APIs and Next.js routes; reusable finder, gallery and enquiry components | Finish commercial rules, refine layouts and verify complete journeys against real development data | High feasibility; integration work remains |
| Destination, dates, price, Vegan Rating and preference filters | Destination/rating/typed attributes and operational search foundations exist | Destination picker, minimum/maximum budget UI, exact date semantics, price sorting and product-specific behaviour | Feasible; more than cosmetic styling |
| Available-only and exact spaces badges | Availability models, snapshots, overrides and source/freshness fields exist | Define confirmed versus on-request availability, enforce freshness and matching inventory relationships, verify displayed counts | Feasible; meaningful backend correction/acceptance work |
| Dedicated special offers and offer detail | Offers are represented on departures/rate periods | Public collection/detail routes, identifiers and consistent active/expired offer eligibility | Feasible extension; not currently a finished public feature |
| Destinations overview and guides | Location taxonomy and destination references exist | Editorial content structure, templates, related-trip queries and maintenance workflow | Feasible extension; content preparation affects timing |
| Standalone departure/package pages | Inventory entities and contextual enquiry exist | Add public routes/contracts if separate pages are required; preserve listing context | Feasible; currently detail views embed these choices |
| Why Deeparture / editorial pages | About and Contact customer routes exist | Approved inclusivity, safety, experience, price-policy and vegan-travel copy; reusable content template | Low technical complexity |
| Favourites and customer account | Existing authentication primarily supports staff/operator workflows | Saved-trip persistence, customer roles, registration/recovery and ownership/privacy rules; account sync if required | Separate feature; not just adding heart icons |
| Automatic listing-page creation | Published vessel/resort records already render through slug routes | Content quality, publication controls, slug-conflict handling and SEO verification | Existing architecture supports this |
| Public operator/company profile page | Organisation model has slug, contact information and status | Public-safe API, profile template, related published products and publication policy | Small additional feature, distinct from listing pages |
| Operator workspace | Existing `/operator/v2` inventory, availability, enquiries, imports, team and profile routes | Optional usability improvements and onboarding verification | Reuse existing portal |
| Agent portal | Organisation type includes `agent`; memberships/roles provide reusable foundations | Agent-specific routes, permissions, enquiries, commercial visibility and agreed business processes | Feasible new module; not already implemented |

**Important verified gaps:** current available-only search includes `on_request` among eligible statuses. Resort availability and price filtering also need to be reconciled against the same requested stay/package/room context. A badge saying “4 spaces available” must come from the relevant resolved departure inventory, not a vessel-wide or illustrative count. Current customer work explicitly leaves effective pricing/date sorts, freshness-aware availability and enquiry-time commercial revalidation outstanding.

The mockup's route names can be accommodated without changing the application stack. Preserve existing public URLs where possible; add redirects if a route changes. Existing detail routes already use server-side data loading, which is a useful SEO foundation, but does not establish complete SEO acceptance.

## 3. UI/UX evaluation

The strongest parts are the clear product categories, familiar search-to-detail-to-enquiry journey, visible dietary preferences, mobile filter drawer and consistent branding. These support both discovery and purposeful searching.

Recommended refinements:

- Reduce the competing navigation rows, blue borders, icons and card badges. Use generous spacing, neutral reading surfaces and one clear primary action per section.
- On desktop, keep destination and dates prominent; move less-used preferences into an accessible filter panel. On mobile, use stacked controls, a full-height filter sheet and a sticky Apply button that does not hide results or the keyboard.
- Label icons, preserve visible focus, provide large touch targets and test contrast. Vegan Rating stars must be clearly distinguished from accommodation/review ratings; explain the rating basis.
- Clarify whether From/To means earliest/latest departure date or the customer's whole travel window. The current liveaboard search filters departure start dates. Resort check-in/check-out and occupancy require different semantics.
- Show a clear price basis: currency, per person/room/trip, duration and relevant inclusions. Distinguish “From”, confirmed spaces, on request, sold out and unknown/stale inventory.
- Include tablet, loading, empty, error, missing-image, missing-price and expired-offer states. The supplied images do not specify these or full product-detail and enquiry screens.
- Resolve navigation differences before implementation: the reference uses category navigation and a hamburger; current local customer work uses Home/About/Contact mobile tabs and a dedicated finder. Choose one coherent journey and retain previously approved brand assets rather than silently replacing them.

**Separate mobile and desktop design:** yes, as distinct compositions and interaction patterns in one responsive application. A phone filter sheet and desktop side panel can share filter state and API logic. Separate websites or duplicated business logic would increase delivery and ongoing maintenance costs without helping this scope.

## 4. Automatic operator-page creation

“Operator page” can mean three different things:

1. **Public vessel/resort listing:** already generated from a published record through `/liveaboards/[slug]` or `/resorts/[slug]`. No individual source file is needed per product. Imports create drafts; publication remains controlled.
2. **Public operator company profile:** a new reusable `/operators/[slug]`-style template can show approved company information and its published inventory. Do not expose private organisation fields or create thin, empty public pages automatically.
3. **Private operator workspace:** already exists. Invitations/claims and memberships should grant access to the correct organisation after the existing checks; creating a public listing must not automatically grant an unverified user ownership.

Recommended workflow: import/create organisation and inventory → validate and review → publish eligible public records → generate addressable pages through templates → invite/verify operator → grant organisation-scoped workspace access. This scales economically because effort follows templates and content quality rather than the number of HTML pages.

## 5. Agent portal scope

The reference images specify customer journeys; they do not define an agent workflow. An `agent` value in the organisation schema is not proof of a complete B2B product.

For a cost-controlled first version, assume invited agent organisations, team access, shared catalogue search, agent-attributed enquiry submission and a dashboard showing only that agency's enquiries and statuses. Admin retains review/control. Add auditability and explicit tests proving agents cannot read another agency's enquiries or edit operator inventory. Agent enquiry attribution and visibility require deliberate model/API work.

Define separately whether agents need net rates, commissions, customer markups, quotations, booking/payment, credit limits, invoices or white-label pages. These change data security and commercial scope substantially. Reuse the shared catalogue and design system; do not expose the operator portal to agents as a shortcut.

## 6. Cost-effectiveness

**Cost-effective if delivered as an incremental extension.** Existing inventory, imports, taxonomy, product templates, authentication, operator workflows and customer components reduce new work. The biggest cost drivers are commercial correctness, missing content, customer accounts and agent business rules—not the blue visual styling.

Keep costs controlled by using one responsive codebase, reusable templates, existing dependencies, a lightweight icon set and approved local font/logo assets. Avoid a new CMS, search service, UI framework or animation system until an actual requirement justifies one. A CMS can become useful if nontechnical staff need frequent editorial publishing.

Separate cost categories:

| Category | Cost treatment |
| --- | --- |
| Development and QA | Estimate below; charge against an agreed rate and explicit scope |
| Hosting/database/storage | Review current capacity and observed traffic before changing plans; redesign alone does not establish a need for new infrastructure |
| Images and editorial content | Client-supplied/licensed imagery and approved copy; image rights, destination writing and catalogue cleanup are separate effort |
| Ongoing maintenance | Shared component fixes, dependency updates, content and availability operations; allow an initial planning provision of 1–3 person-days/month, then revise from actual usage |
| External feeds, payments and integrations | Outside this estimate unless explicitly specified |

No currency quote or vendor price is asserted: team rates, hosting usage and third-party requirements have not been supplied. Budget formula: **estimated person-days × agreed daily rate**, plus content/asset and service costs, plus a separately visible contingency of approximately 20–25% while scope remains incomplete. These are engineering planning allowances, not researched market prices.

## 7. Delivery estimate from the current working tree

Assumptions: one experienced full-stack developer, timely client feedback, existing architecture retained, approved brand assets available, usable isolated development data, no payment/booking engine, no external inventory feeds, and customer enquiries continuing through Admin review. Estimates are remaining effort; already implemented foundations are not counted as a new build. A person-day is focused engineering effort, not a guaranteed elapsed calendar day.

| Sequential work package | Person-days | Deliverable |
| --- | ---: | --- |
| Confirm scope and mobile/desktop direction | 2–3 | Agreed navigation, representative screens, filter/date semantics and brand continuity |
| Customer layout and component refinement | 5–7 | Home, listing, detail, enquiry and intentional mobile/tablet/desktop layouts |
| Search, pricing, offers and availability integration | 5–8 | Consistent commercial behaviour and error/unknown states across the journey |
| QA, accessibility, performance, SEO essentials and staging preparation | 4–6 | Reviewed customer release candidate with recorded checks |
| **Core customer release subtotal** | **16–24** | **Approximately 4–6 working weeks** |
| Dedicated offer/destination/editorial templates, public operator profiles and standalone trip/package pages where needed | +6–10 | Broader reference sitemap using reusable templates; approved content supplied |
| Customer accounts and synchronised favourites | +4–7 | Account lifecycle and ownership-safe saved trips |
| Agent enquiry-portal MVP described above | +10–15 | Agency-scoped access, enquiries, tracking and permission tests |
| **Expanded scope total** | **36–56** | **Approximately 8–12 working weeks** |

Calendar windows are rounded planning ranges with modest coordination time; slow approvals, content delays and unresolved commercial rules can extend them. Apply contingency to the effort budget above. Do not promise an exact completion date before confirming those dependencies.

An advanced agent platform with commissions, net-rate contracts, quotes and booking/payment is a separate project. A preliminary allowance is **another 20–40+ person-days beyond the agent MVP**, subject to workflow discovery; accounting/payment integrations can exceed that range. Full installable PWA/offline acceptance from the existing Phase 4 programme is also outside these UI-release totals; allow approximately **3–5 additional person-days** if required now. Do not double-count overlapping work when producing the final statement of work.

The fastest responsible sequence is to release the core customer journey, then complete the expanded sitemap and agent MVP in agreed increments. Avoid presenting a visually complete homepage as proof that search, inventory and enquiries are complete.

## 8. Loading speed and quality controls

Use responsive image sizes, modern compression, explicit dimensions and lazy loading below the fold; load the primary hero intentionally. Keep the current approved font locally hosted with only required weights. Avoid autoplay video, large sliders and unnecessary motion. Mobile should not download a second desktop hero or duplicate application tree unnecessarily.

Keep filtering/pagination in the API and profile representative compound queries before adding indexes or a new search engine. Load card summaries rather than complete galleries/inventory for every result. Cache appropriate public/editorial content and static assets, while keeping prices, offers and availability freshness-aware. Private agent/operator responses must never enter shared public caches.

Proposed measurable release targets, to be verified rather than promised: LCP ≤2.5 seconds, INP ≤200 milliseconds and CLS ≤0.1 at the 75th percentile of real usage when enough field data exists. Before launch, use repeatable mobile lab tests, inspect page/image/JavaScript weight, and test lower-end phones and slower networks. A Lighthouse score alone does not prove these field targets.

Acceptance should cover customer liveaboard and resort search → detail → enquiry, same-inventory compound filters, active/expired offers, inherited/overridden prices, sold-out/on-request/stale states, enquiry context and failure recovery. Test keyboard and touch use at phone/tablet/desktop sizes, preserve existing admin/operator access, and test agency isolation before any agent release.

## 9. Evidence and limits of this assessment

Reviewed: root context/README, Phase 2B correction/evidence documents, Phase 4 context and implementation record, current public routes, search service, organisation/membership/access models, frontend route inventory, finder state/component and server-rendered liveaboard route. Existing uncommitted user work was preserved.

Key repository references:

- [Current customer implementation and outstanding gaps](CUSTOMER_IMPLEMENTATION_2026-11-07.md)
- [Phase 4 scope and acceptance boundaries](CONTEXT.md)
- [Public API routes](../../backend/src/v2/routes/public.routes.js)
- [Current search rules](../../backend/src/v2/services/search.service.js)
- [Organisation model](../../backend/src/v2/models/organisation.model.js)
- [Organisation access control](../../backend/src/v2/middleware/organisationAccess.js)
- [Customer finder](../../frontend/src/components/customer/TripFinder.jsx)
- [Dynamic public listing route](../../frontend/pages/liveaboards/[slug].jsx)

This task is documentation-only. No application build, test suite, live performance measurement, staging acceptance, database operation or deployment was run. Previously recorded passing checks are historical evidence and do not certify the proposed scope. Full Phase 4 acceptance remains pending. The immediate next step is to turn the selected release scope and unresolved agent/commercial requirements into a bounded implementation backlog and quotation.
