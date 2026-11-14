# Phase 4 — brand reference revision

Date: 2026-11-05 (Asia/Dhaka).

The owner supplied `Screenshot 2026-11-05 at 00.57.13.png` as the colour, text and logo reference and requested the original logo unchanged, with clean, professional supporting UI. This supersedes the initial teal/cream/serif visual direction. It does not approve unfinished API/PWA work or establish full Phase 4 acceptance.

## Applied direction

- Deeparture blue `#0080FF`, white surfaces, pale-blue supporting backgrounds and navy body text.
- Original white header logo and original blue/white footer logo downloaded from Deeparture's public site and stored byte-for-byte. No tracing, AI recreation, recolouring, stretching or CSS filters. Footer uses a navy background so both original colours remain readable.
- Outfit headings and Roboto body copy, matching the original site's font declarations. Official variable fonts and their SIL Open Font License files are served locally.
- Original headline “Inclusive dive adventures start here”; modern search boxes, pill actions, consistent cards, responsive layouts and organised advanced filters.
- A darker blue action colour (`#0067CF`) supports readable white button labels while retaining the original bright blue for the brand header/hero.

## Source references

- [Deeparture public site](https://deeparture.travel/).
- [Original header logo](https://deeparture.travel/images/client/logo.svg) → `frontend/public/brand/logo.svg`.
- [Original footer logo](https://deeparture.travel/images/client/footerLogo.svg) → `frontend/public/brand/footerLogo.svg`.
- Brand colour/font declarations: public `/_next/static/css/5b045f8d7cb6e163.css` and homepage markup, inspected on 5 November.
- [Official Outfit source and licence](https://github.com/google/fonts/tree/main/ofl/outfit).
- [Official Roboto source and licence](https://github.com/google/fonts/tree/main/ofl/roboto).

Original logo SHA256 records: [brand asset manifest](BRAND_ASSETS.json). Reference screenshot remains in its original location; it was not altered or uploaded to another service.

## Updated screenshots

| Page | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Search | [1440px](evidence/brand-revision/design-search-desktop.png) | [768px](evidence/brand-revision/design-search-tablet.png) | [390px](evidence/brand-revision/design-search-phone.png) |
| Detail | [1440px](evidence/brand-revision/design-detail-desktop.png) | [768px](evidence/brand-revision/design-detail-tablet.png) | [390px](evidence/brand-revision/design-detail-phone.png) |

[Phone filter drawer](evidence/brand-revision/design-filters-phone.png). Initial evidence remains in the parent evidence directory.

## Verification

Frontend `npm run build` passed. The browser runner now checks original-logo URLs, logo loading, local fonts and the exact blue header alongside the existing responsive/interaction/guard checks. Run from `frontend/` against the enabled local preview on 3104 and disabled production preview on 3105:

```sh
PHASE4_EVIDENCE_DIR=../../docs/phase4/evidence/brand-revision node scripts/verify-phase4-design.cjs
```

Final result: **17/17 Chromium groups passed**, no console/page errors. [Results](evidence/brand-revision/design-browser-results-2026-11-05.json). Search/detail checked at 390/768/1440px; screenshots visually inspected. Original logo hash verification and `git diff --check` passed. Also corrected a development-mode React warning by rendering the preview title as a single string.

Scope is the existing local design preview. Sample inventory and no-delivery enquiry behaviour remain explicit. Backend/full integration/staging/SEO/PWA acceptance was not rerun or claimed. No private environment edits or database/email operations. Local development preview restored on port 3000 for owner review.
