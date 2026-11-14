# Homepage colour options — 12 November 2026

The owner liked Ocean & Coral and requested another option while preserving the first as a possible final choice. Neither comment establishes final visual or functional acceptance.

**Subsequent owner decision:** Ocean & Coral is confirmed. On 13 November the header/photo seam was softened with a vertical fade. Midnight & Champagne remains a reference preview. [Latest desktop](evidence/homepage-header-blend-2026-11-13/home-desktop.png), [latest phone](evidence/homepage-header-blend-2026-11-13/home-phone.png), [build](evidence/homepage-header-blend-2026-11-13/frontend-build.txt), [four-width browser/pixel checks](evidence/homepage-header-blend-2026-11-13/results.json). Earlier comparison/selection notes below describe the preceding review.

## Review URLs

- **Option 1, Ocean & Coral:** `http://localhost:3000/?palette=coral`.
- **Option 2, Midnight & Champagne:** `http://localhost:3000/?palette=midnight`.
- **Default homepage:** `http://localhost:3000/` continues to show Ocean & Coral without comparison controls.

The two explicit preview URLs display labelled comparison links. Selection is server-rendered from an allowlisted query value; it survives reload and browser back/forward. Unknown or repeated palette values use the default without preview controls. There is no cookie/local-storage preference and no separate application. Preview variants emit noindex,follow. Search/detail URLs continue to use existing V2 contracts and do not send palette parameters to the API. These are local review URLs, not published releases.

## Option 2 palette

| Role | Colour |
| --- | --- |
| Midnight structural surfaces | #101D34 |
| Main ink | #172C43 |
| Supporting text | #566479 |
| Links and focus | #275B85 |
| Porcelain canvas | #F7F8FC |
| Pale supporting surface | #EDF3FA |
| Champagne primary action | #E6C27D |
| Primary-action text | #172C43 |
| Primary-action border | #8C672A |
| Input border | #7C8DA8 |
| Hero heading accent | #F0D9A4 |

Midnight blue relates to the underwater portrait; champagne creates restrained warm/cool contrast for primary actions. Dark button text provides stronger legibility than white on pale gold. The darker action border distinguishes the light gold surface against white. The original logo, single-diver image, content, page layout and search controls are retained. Shared scoped tokens support both options; other routes keep their existing colours.

## Verification

- Frontend `npm run build`: PASS; [build output](evidence/homepage-options-2026-11-12/frontend-build.txt).
- Focused main-app browser checks **12/12 PASS**: each palette at 1440/768/390/320px, filter visibility/Apply/Escape for each, palette switching/back/reload, and default/invalid-query preservation. HTTP 200, no horizontal overflow or runtime errors; SSR props and preview noindex verified.
- Computed primary-action contrast: Option 1 **5.40:1**, Option 2 **8.38:1**. Input border against white: Option 1 **3.31:1**, Option 2 **3.37:1**. Mobile Apply contrast also checked. These are focused solid-colour checks, not a full accessibility audit.
- [Browser results](evidence/homepage-options-2026-11-12/results.json), [Option 1 desktop](evidence/homepage-options-2026-11-12/coral-desktop.png), [Option 2 desktop](evidence/homepage-options-2026-11-12/midnight-desktop.png), [Option 2 phone](evidence/homepage-options-2026-11-12/midnight-phone.png). Screenshots visually reviewed.
- `git diff --check`: PASS. No backend/data/email/staging/publication operation. No new test files or full workflow rerun; current real catalogue API remains unavailable. Previous functional integration gaps remain recorded in the Rev 2 plan.

Next: compare both locally, choose/refine the preferred palette, then continue the agreed page-by-page redesign. Option 1 remains the default until a later explicit change.
