# Clean customer UI and hero revision

Date: 2026-11-05 (Asia/Dhaka). Supersedes the previous brand-revision layout, following owner feedback that the overall UI needed to be simpler and the hero more attractive.

## Visual system

| Token | Colour | Use |
| --- | --- | --- |
| Brand | `#0080FF` | Original identity and compact header |
| Action | `#0067CF` | Primary buttons and selected controls |
| Ink | `#102D50` | Headings, body emphasis and footer |
| Muted | `#60748B` | Secondary labels and metadata |
| Surface | `#FFFFFF` | Page, search and cards |
| Muted surface | `#F6F8FB` | Subtle supporting sections |
| Blue surface | `#EAF3FF` | Selected states and quiet highlights |
| Divider | `#E1E8F0` | Borders and grouping |

CSS custom properties in `DesignPreview.module.css` define the palette. Photography supplies natural ocean colours; text and interface surfaces use the controlled blue/navy/white system. Green is retained only for semantic dietary/availability information. Original SVG logos are unchanged, with their original colours and proportions.

## Layout changes

- A wide, rounded photographic hero with restrained dark shading, a short headline and readable white copy. The blue header is compact rather than extending into a solid-colour hero.
- One search surface with destination and dates as primary controls; budget and trip length form a quieter second row. Search remains functional with the sample inventory.
- Quick destination buttons offer a direct path into results.
- Advanced preferences use the existing accessible drawer on every screen size, removing the long desktop sidebar.
- Larger result imagery and readable card content, more white space, fewer competing borders/badges and one consistent heading style.
- Shared detail typography, surfaces and enquiry presentation follow the same palette.

## Validation and scope

Frontend production build passed. Final browser report and screenshots: [clean revision evidence](evidence/clean-revision/design-browser-results-2026-11-05.json). The 18-group run includes quick destination selection/reset as well as existing responsive, search/filter, gallery, enquiry-preview, original-logo/font/palette and production-guard checks. This is fixture-preview verification, not API/staging acceptance.

Review: [desktop search](evidence/clean-revision/design-search-desktop.png), [phone search](evidence/clean-revision/design-search-phone.png), [desktop detail](evidence/clean-revision/design-detail-desktop.png), [phone detail](evidence/clean-revision/design-detail-phone.png), [phone filters](evidence/clean-revision/design-filters-phone.png). Tablet images are in the same evidence directory. Earlier evidence is retained.

Local preview: `http://127.0.0.1:3000/phase4-preview`. Full Phase 4 integration remains pending; this revision changes presentation and sample interactions in the existing frontend.
