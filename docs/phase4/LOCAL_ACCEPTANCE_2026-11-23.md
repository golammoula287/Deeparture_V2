# Phase 4 local acceptance — 23 November 2026

Local review evidence for the consolidated developer guide. Formal acceptance and hosting checks are pending.

## Tested source and environment

- Branch `phase4-customer-ux-implementation`, HEAD `30f0eb5685bcf1ecf9ae7512b64b062167d879f2`. The build also included the uncommitted Step 12 departure, package and offer work. The regression rerun used the updated Phase 1 browser verifier.
- Confirmed accepted Phase 3 revision `f6693c6a05b7bd172fc773fe010494ee61f276f9` is an ancestor of HEAD using `git merge-base --is-ancestor`.
- Frontend `http://127.0.0.1:3000`. API `http://127.0.0.1:5028` with the isolated sample catalogue of 120 liveaboards and 120 resorts. Email delivery was in test mode.
- The Phase 1–3 regression built a temporary source copy and used its own MongoDB, API and frontend on ports 27029, 5019 and 3019. The runner stopped those services. The normal local preview remains available.

## Checks and evidence

| Area | Local result |
|---|---|
| Shared navigation and footer | Verified the shared logo and WhatsApp destination across six customer pages at desktop and phone sizes. Final legal links and live social destination review are open. |
| Homepage filters | Passed at 320, 390, 768 and 1440 px, including typed price and slider synchronisation, validation, grouped preferences and clearing filters while retaining Vegan Rating. |
| Liveaboard and resort search | Passed sorting across pages, filtered departure/stay results, matching result data, the desktop sidebar, mobile filters and sorting, and an empty-result case. Verified widths of 320, 390, 768, 1024 and 1440 px. |
| Product details and Contact | Desktop and phone pages fit the viewport, supported contextual enquiry selection, and had no browser runtime errors. All six Contact FAQ pairs matched the approved source and worked with keyboard controls. |
| Enquiries and offers | Earlier Step 11–12 local API and browser evidence covers persistence, test notifications, validated offer context, expired offers and offline/reconnection. This acceptance pass exercised selection and focus without submitting a new enquiry. |
| SEO and PWA | Earlier local checks confirmed canonical and noindex rules, manifest install eligibility, offline fallback and reconnection. Installed launch, worker updates and hosted SEO remain open. |

The [browser result file](evidence/local-acceptance-2026-11-23/browser-results.json) records 13 passing groups. Representative screenshots include the [desktop liveaboard finder](evidence/local-acceptance-2026-11-23/liveaboard-search-1440.jpg), [phone resort finder](evidence/local-acceptance-2026-11-23/resort-search-390.jpg), [mobile filter overlay](evidence/local-acceptance-2026-11-23/filters-390.jpg) and [phone Contact](evidence/local-acceptance-2026-11-23/contact-390.jpg).

## Existing application regression

| Suite | Passing groups |
|---|---:|
| [Phase 1](evidence/local-acceptance-2026-11-23/phase1-test-results.json) | 34 |
| [Phase 2A](evidence/local-acceptance-2026-11-23/phase2a-test-results.json) | 27 |
| [Phase 2B API](evidence/local-acceptance-2026-11-23/phase2b-api-results.json) | 10 |
| [Phase 2B extended acceptance](evidence/local-acceptance-2026-11-23/phase2b-acceptance-results.json) | 19 |
| [Phase 3](evidence/local-acceptance-2026-11-23/phase3-results.json) | 14 |

Ran `npm run verify:phase3:local` from the temporary backend copy with `MONGOD_PATH` pointing to the local MongoDB executable and `VERIFY_REPORT_DIR` pointing to a temporary output directory. The first run built the production frontend, then stopped at the legacy Operator link selector. The successful rerun used `npm run verify:phase3:local -- --skip-build` with the same frontend build and the updated browser verifier. The verifier now uses the approved Operator login link, the submitted search form, required resort stay dates, and the current empty state. The acceptance suites used fresh local fixtures.

Ran `npm run verify:phase3` in the workspace backend. Syntax, Phase 2B and Phase 3 static checks, and all 49 unit tests passed.

## Deployment handoff

- V2 customer enquiries use `POST /api/v2/enquiries/general` and the existing contextual `POST /api/v2/enquiries`. General and offer fields are additive. Set `ENQUIRY_NOTIFICATION_EMAIL` after the receiving inbox is confirmed.
- `GET /api/v2/departures/:id`, `GET /api/v2/packages/:id`, and `GET /api/v2/offers/:id` resolve to published listing context. Invalid or unavailable options return HTTP 404. Offer prices are resolved through the existing V2 catalogue offer service.
- Public indexing is enabled at build time with `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ALLOW_INDEXING=true`. The local preview retains the default indexing protection.
- Outstanding for sign-off are the approved staging revision, hosted catalogue and SEO verification, installed PWA launch and worker updates, final client inputs and formal review. The original full acceptance checklist still requires its local and hosted evidence mapping.
