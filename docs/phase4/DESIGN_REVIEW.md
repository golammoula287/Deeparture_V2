# Phase 4 — first design review

Prepared: 2026-11-05 (Asia/Dhaka). Status: ready for owner visual review; full Phase 4 integration is pending.

## Proposed direction

Ocean-led imagery, deep teal actions, warm off-white backgrounds, soft green dietary/accessibility accents, spacious editorial headings and restrained cards. Search and detail share the same palette, typography, controls and information hierarchy. Native select/date controls provide keyboard and platform support inside the styled search boxes.

The two representative pages are implemented in the existing Next.js application, using isolated fictional inventory. They do not modify customer/public catalogue routes, connect to a database or submit enquiries. The shared AuthProvider only gains an optional header switch for these preview pages; authentication logic is unchanged.

## Review images

| Experience | Desktop · 1440px | Tablet · 768px | Phone · 390px |
| --- | --- | --- | --- |
| Search/results | [Desktop search](evidence/design-search-desktop.png) | [Tablet search](evidence/design-search-tablet.png) | [Phone search](evidence/design-search-phone.png) |
| Liveaboard detail | [Desktop detail](evidence/design-detail-desktop.png) | [Tablet detail](evidence/design-detail-tablet.png) | [Phone detail](evidence/design-detail-phone.png) |

[Phone advanced-filter drawer](evidence/design-filters-phone.png).

Full-page detail captures include the fixed mobile CTA at its viewport position; its position within a long stitched image does not represent document flow.

## Interactive local review

From the repository root:

```sh
cd frontend
npm run dev -- --hostname 127.0.0.1 --port 3104
```

Open:

- Search/results: `http://127.0.0.1:3104/phase4-preview`
- Representative detail: `http://127.0.0.1:3104/phase4-preview/liveaboards/coral-horizon`

Development mode enables preview routes. Production returns 404 by default; explicit `PHASE4_DESIGN_PREVIEW=true` enables them for a controlled local review. Responses use `private, no-store` and noindex/nofollow headers/metadata. This setting was passed only on the command line, not written into private or tracked environment files.

Try destination/date/duration/budget controls, advanced dietary/accessibility/diving/facility filters, sorting, pagination, gallery navigation and selecting a departure before previewing an enquiry. All trip names, ratings, inventory states, offers and prices are sample data; photography is illustrative. Form submission only updates local UI state, with explicit wording that nothing was sent or saved.

## Verification actually executed

- `npm run build` in `frontend/`: PASS, Next.js 16.3.5 production build; new preview routes compile as dynamic routes. Existing Admin/Operator/public routes remain present.
- `node scripts/verify-phase4-design.cjs` in `frontend/`: PASS, **16/16** Chromium browser groups. [Machine-readable results](evidence/design-browser-results-2026-11-05.json).
- Browser coverage: 390/768/1440px search/detail layouts, image loading, no horizontal overflow, gallery next/close/Escape and focus return, filter application/cancellation, drawer viewport bounds and focus containment, compound sample filtering, empty/reset, sorting/pagination, selected enquiry context, zero POST/submission requests, production preview guard, shared login header and anonymous operator redirect. No console/page errors in these flows.
- `node --check frontend/scripts/verify-phase4-design.cjs`: PASS. `git diff --check`: PASS.
- Source checklist extraction: all 148 numbered requirements captured with separate Local/Staging `NOT RUN` statuses. Preview tests are not represented as integrated acceptance.

An initial build command from the repository root failed because there is no root `package.json`; the command was rerun successfully in `frontend/`. An initial browser run stopped after 10 passing groups on a search-label selector timeout. Explicit accessible search labels and cramped filter-legend flow were corrected; the final full run passed. The mobile drawer screenshot was refined to capture the viewport, with added bounds/focus assertions; the subsequent complete run also passed.

No backend source changed, so backend unit/API/database suites were not rerun. No real inventory, integrated Phase 4 services, resort rollout, SEO indexing, PWA installation/offline behaviour, hosted deployment or full Phase 1–3 regression acceptance is claimed. No commit, push, deployment, email delivery or environment-file edits were performed. Local QA servers were stopped after verification.

## Next decision

The owner's instruction was to agree the search/results and one liveaboard detail visual direction before applying it throughout Phase 4. Review the screenshots or interactive pages and approve this direction, or identify changes to palette, typography, imagery, cards, search controls or detail hierarchy. After that review, continue shared V2 integration and customer rollout according to the [implementation plan](IMPLEMENTATION_PLAN.md) and [API integration map](API_INTEGRATION_MAP.md).
