# Phase 4 implementation steps

Updated: 2026-11-05 (Asia/Dhaka)

Baseline: `f6693c6a05b7bd172fc773fe010494ee61f276f9`. Requirements and constraints: [Phase 4 context](CONTEXT.md). Original 148 checklist rows: [acceptance tracker](ACCEPTANCE_STATUS.json).

| Step | Work and exit condition | Status |
| --- | --- | --- |
| 1. Review and map | Read the controlling Rev 1.1 handover; verify baseline; identify actual route/API/dependency differences; preserve existing work; capture all acceptance rows. | Complete |
| 2. Design direction | Working representative search/results and liveaboard detail preview; phone/tablet/desktop screenshots; functional preview controls; keyboard, production guard and build checks. | Implemented; see evidence in DESIGN_REVIEW.md |
| 3. Owner visual review | Agree on palette, typography, imagery, cards, filters, detail hierarchy and mobile interaction before applying the style throughout Phase 4. | Awaiting review |
| 4. Shared API integration | Reconcile overlay query/enquiry/response contracts; extend existing services backward compatibly; compound filters, effective prices, offers, freshness, deterministic sorting/pagination; automated API/domain evidence. | Pending |
| 5. Customer rollout | Apply approved reusable components to liveaboard and resort search/detail and enquiry flows; real shared taxonomy, gallery/media, cabins/rooms/packages, URL search state and robust async states. | Pending |
| 6. SEO and PWA | Crawlable content, unique metadata/canonicals, curated collections, facet controls, manifest/install/launch, safe service worker and offline/error states. | Pending |
| 7. Local acceptance | Existing Phase 1–3 regression suites; new Phase 4 domain/integration checks; production build; real-data desktop/tablet/phone journeys and browser evidence. | Pending |
| 8. Staging and handback | After publication authorization, deploy matching revisions, verify all applicable checklist rows, prepare auditable source/API/build/browser/SEO/PWA evidence and known issues for formal sign-off. | Pending |

## Review boundary

The owner asked to agree the search/results and one liveaboard detail visual direction before building the full UI. Preview filtering is intentionally isolated fixture interaction, not the production search implementation. Its success cannot establish any live catalogue, pricing, availability, enquiry, SEO or PWA acceptance result.

Owner authorized commit/push of the current Phase 4 work to new branch `phase4-customer-marketplace` on 5 November. This publication contains the design-review stage; it does not mark the later steps complete. No merge or deployment is part of this publication. No production/V1 cutover, external feeds, scraping, native apps or Agent/B2B platform is included.
