# Phase 4 — Customer marketplace redesign and PWA

Last updated: 2026-11-05 (Asia/Dhaka)

## Current status

Steps 1–2 are ready for review: handover/API reconciliation audit, all 148 acceptance rows captured, and working search/results + liveaboard detail design previews in the existing frontend. Production build and 16/16 local Chromium preview groups passed. See [design review and screenshots](DESIGN_REVIEW.md), [step-by-step plan](IMPLEMENTATION_PLAN.md), [API integration map](API_INTEGRATION_MAP.md) and [acceptance tracker](ACCEPTANCE_STATUS.json).

Owner visual approval is pending before broad rollout. The supplied overlay has not been merged into live customer routes. Full shared-service integration, resort rollout, SEO/PWA and integrated/staging acceptance remain pending. Preview inventory and interactions are isolated fixtures, not live business logic.

Accepted Phase 3 baseline: `f6693c6a05b7bd172fc773fe010494ee61f276f9`. Local `main` HEAD matches this baseline, verified on 5 November. Existing uncommitted Phase 3 context, tooling and evidence must be preserved. Earlier Phase 3 acceptance results are recorded in the root [CONTEXT.md](../../CONTEXT.md); they were not rerun for this review.

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
