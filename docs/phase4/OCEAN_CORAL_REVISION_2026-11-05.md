# Ocean, ivory and coral — new visual direction

Date: 2026-11-05 (Asia/Dhaka). The owner rejected the previous colour combination and explicitly requested a different design. This revision supersedes the blue-dominant and photographic-overlay directions. Original logo artwork remains unchanged.

## Palette

| Role | Colour | Use |
| --- | --- | --- |
| Deep ocean | `#102C36` | Header, footer, headings and strong text |
| Warm ivory | `#F7F4EE` | Main canvas and breathing room |
| Coral clay | `#B54D3C` | Primary actions, headline accent and small highlights |
| White | `#FFFFFF` | Search, cards and forms |
| Soft sage | `#EEEEE6` | Supporting feature cards |
| Muted slate | `#65716E` | Secondary text |
| Warm divider | `#DEDED5` | Borders and grouping |

The original logo's blue/white colours are preserved. Interface accents use coral sparingly; photography contributes natural ocean colour without making every section a saturated blue panel. Normal-size primary button text meets a measured contrast ratio of at least 4.5:1 in the browser check.

## Different composition

- Split hero: dark/coral typography on ivory beside a large diving photograph, replacing the previous full-width photographic overlay and blue background.
- Plain white search surface and quieter neutral result cards, with coral actions and warm dividers.
- A new four-card Deeparture approach section with short, readable content, replacing the older generic supporting banner.
- A structured ocean-dark footer with grouped, working internal links. No invented social destinations, contact numbers or business guarantees.
- Matching detail, enquiry, drawer and mobile treatments. Logo proportions and original SVG files are unchanged.

## Review and verification

Live local preview: `http://127.0.0.1:3000/phase4-preview`.

- [Desktop search](evidence/ocean-coral-revision/design-search-desktop.png)
- [Phone search](evidence/ocean-coral-revision/design-search-phone.png)
- [Desktop detail](evidence/ocean-coral-revision/design-detail-desktop.png)
- [Phone detail](evidence/ocean-coral-revision/design-detail-phone.png)
- [Phone filters](evidence/ocean-coral-revision/design-filters-phone.png)

Tablet screenshots are in the same directory. Earlier evidence is preserved.

Frontend production build passed. **19/19 Chromium groups passed**, including the new approach/footer content, primary action contrast, original logo/font loading, revised palette, responsive layouts at 390/768/1440px and all existing preview search/filter/gallery/enquiry/production-guard checks. [Final results](evidence/ocean-coral-revision/design-browser-results-2026-11-05.json). No page/console errors in tested flows. Original logo SHA256 checks and diff/script syntax checks passed.

These are local fixture-preview results. Full Phase 4 API integration, resort rollout, SEO/PWA, hosted acceptance and business sign-off remain pending. Private environment files and databases were not changed. No commit/push/deployment performed for this revision.
