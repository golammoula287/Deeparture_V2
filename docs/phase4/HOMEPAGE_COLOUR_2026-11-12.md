# Homepage colour refinement — 12 November 2026

The owner relaxed the earlier blue/white restriction and authorized colour selection using design judgement. This update applies to the homepage, including its navigation, filter modal and footer. Other routes retain their current styling. It changes presentation only; the client’s functional scope remains unchanged.

## Palette and purpose

| Role | Colour | Use |
| --- | --- | --- |
| Ocean deep | #0B3038 | Header, hero shade and dark structural surfaces |
| Ocean ink | #15383E | Main headings, product names and price emphasis |
| Sea teal | #0B6B68 | Links, selected tabs, preference icons and focus |
| Seafoam | #B9DFD2 / #EDF5F1 | Hero heading accent and subtle supporting panels |
| Warm ivory | #FBFAF6 | Main canvas; white forms/cards remain distinct |
| Burnt coral | #B54632 | Primary Search, Apply Filters and final adventure CTA |
| Coral hover | #943724 | Primary-action hover |
| Supporting ink | #526665 | Secondary copy |
| Control edge | #7A9291 | Input boundaries |

The cool ocean hues provide continuity with the diver image. A restrained warm coral accent introduces complementary temperature contrast and gives primary actions more emphasis than secondary links. Warm ivory softens the information surfaces. This is a design choice, not a scientifically unique “best” palette or a measured conversion claim. Strong lightness contrast carries readability; colour is accompanied by existing text, selected-state borders and focus outlines.

Homepage tokens are centralized in the scoped CustomerShell clientHome class. HomePage styles consume them; typography, original logo files, portrait image, content and search behaviour are retained. The original wordmark is not recoloured or filtered. Existing error colours remain semantic feedback.

## Validation

- Frontend `npm run build`: PASS. [Build output](evidence/homepage-colour-2026-11-12/frontend-build.txt).
- Focused main-app browser checks: 5/5 groups PASS, comprising 1440/768/390/320px layouts and mobile filter interaction. HTTP 200, one loaded diver hero image, no horizontal overflow, visible Apply action, Escape dismissal and no runtime errors.
- Computed solid-colour contrast measured in browser: white on coral primary action **5.40:1**; supporting ink on warm ivory **5.83:1**; input border on white **3.31:1**. Mobile Apply action also meets 4.5:1. These checks are not a complete accessibility audit or a measurement of every photographic background.
- [Results and measurements](evidence/homepage-colour-2026-11-12/results.json), [desktop preview](evidence/homepage-colour-2026-11-12/home-desktop.png), [phone preview](evidence/homepage-colour-2026-11-12/home-phone.png), [mobile filters](evidence/homepage-colour-2026-11-12/filters-phone.png). Desktop/phone screenshots visually inspected.
- `git diff --check`: PASS. No new tests or backend changes; no full workflow regression rerun was needed for this presentation change. Local catalogue API remains unavailable. No database/email/staging/publication operation or full Phase 4 acceptance.

Next: owner review of the refined homepage, followed by search/results design under the existing Rev 2 production plan.
