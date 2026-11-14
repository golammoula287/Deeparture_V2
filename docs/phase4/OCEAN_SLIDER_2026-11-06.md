# Ocean hero revision — 6 November 2026

### 2026-11-06 — Continuous ocean hero and sliding headlines

Implemented the owner’s ocean reference as one uninterrupted hero with transparent overlaid navigation, original unmodified Deeparture logo, muted ocean colours sampled from the supplied palette (#071925, #9DB7C3, #50636B, #123749, #294E5C, #6D919D, #527787), local ocean-wave photography, restrained background typography and three sliding headlines. Numbered text controls pause on manual selection; explicit play/pause and reduced-motion support are included. No decorative arrows, extra header band or customer-facing demo wording. Existing search/cards/detail flows retained; earlier blue palette remains outside the hero.

Validation: frontend production build and 23/23 Chromium groups passed, including overlay positioning, manual/automatic slides, pause, reduced motion, 390/768/1440px layouts and existing customer flows. No browser errors or API writes. Evidence: docs/phase4/evidence/ocean-slider-2026-11-06/. Local UI runs on port 3000. Changes remain local; full shared V2 integration, resort rollout, PWA/SEO and staging acceptance remain pending. Next: owner reviews the hero before further visual changes.

The wave photograph is a static local image; the headline text slides. Existing production route guards/noindex/no-store remain in place. This verification covers the isolated fixture UI, not full Phase 4 acceptance.


### 2026-11-06 — Scuba hero and faded 3D headlines

Replaced surface-wave hero photography with a local high-resolution scuba-diver/reef photograph. Removed the decorative OCEAN word and its unused CSS. Headline colour is now translucent ocean mist (76% opacity), with restrained depth shadows, a perspective entrance and gentle 3D tilt/float. Manual slide selection and Pause stop animation; reduced motion disables both entrance and headline animation. Transparent navigation and original logos remain unchanged.

Validation: frontend production build passed; 23/23 Chromium groups passed, including the scuba asset, absence of the background word, translucent headline, animation, slideshow controls, reduced motion and desktop/tablet/phone flows. No browser errors or API writes. Syntax and diff checks passed. Evidence: docs/phase4/evidence/scuba-3d-2026-11-06/. Local app restored on port 3000. No commit/push/deployment or backend changes. Full Phase 4 integration remains pending. Next: owner reviews this hero refinement.


### 2026-11-06 — Owner reference diver and STO-style typography

Used the owner-supplied clear-water diver screenshot (04.47.26) as the hero asset, converted to a local JPEG. Added oversized translucent DEEP lettering behind smaller uppercase sliding headlines, echoing the supplied STO composition. Background lettering has gentle perspective motion and follows Pause/reduced-motion settings. Lighter overlay preserves turquoise water and sandy seabed; navigation continues over the same image. Original logos/cards retained.

Validation: frontend production build passed; 23/23 Chromium groups passed, including reference asset, decorative text accessibility, faded headline, pause/manual/automatic slides, reduced motion and responsive layouts. Syntax and diff checks passed. Evidence: docs/phase4/evidence/reference-diver-2026-11-06/. Local app restored on port 3000. No commit/push/deploy or backend changes. Full Phase 4 integration remains pending. Next: owner reviews the revised hero.


### 2026-11-06 — Different real photograph and consistent muted ocean palette

Replaced the supplied screenshot with a different real scuba photograph by Olga ga from Unsplash (IQMCYVVa2Wc), served locally as hero-open-water-diver.jpg. Inspected the image: diver beneath sunlit open water. Preserved translucent DEEP typography, subtle 3D animation, transparent navigation and original logos. Applied owner-reference colours throughout the customer UI: #071925, #9DB7C3, #50636B, #123749, #294E5C, #6D919D, #527787. Replaced earlier bright blue base tokens with muted ocean roles. Headline now “Dive beyond / the everyday.” with specific copy about destinations/dates/features, cabin options/prices and dietary/accessibility features. No fabricated testimonials or statistics added.

Validation: frontend production build, syntax/diff checks and 23/23 Chromium groups passed; responsive screenshots and browser evidence under docs/phase4/evidence/authentic-ocean-2026-11-06/. No browser errors or API writes. Local UI restored on port 3000. No commit, push, deployment or backend changes. Full Phase 4 shared integration and acceptance remain pending. Next: owner reviews current photograph/palette.


### 2026-11-06 — Original custom hero banner

Created an original AI-generated underwater banner using the imagegen skill and built-in image generation. Scene: muted blue-green open water, sunlight from upper left and scuba diver at right with calm space for live text. Saved original PNG and optimized JPEG in frontend/public/phase4/hero-custom-banner-v1.*. Replaced stock hero with JPEG; adjusted overlay and mobile crop. Original logo, live 3D typography, reduced-motion/pause controls and ocean palette retained. This is generated atmosphere artwork, not a real destination photograph or inventory representation.

Validation: production frontend build, syntax/diff checks and 23/23 Chromium groups passed. Responsive screenshots/report: docs/phase4/evidence/custom-banner-2026-11-06/. No browser errors or API writes. Local app restored on port 3000. No commit/push/deployment/backend changes. Full Phase 4 integration remains pending. Next: owner reviews the custom banner.


### 2026-11-06 — Hero layout refactor after owner feedback

Replaced the accumulated hero overrides with one responsive composition. Desktop headline is left aligned in the image’s open water; diver stays visible at right. Reduced decorative DEEP lettering from 36vw/28% opacity to 27vw/10%, moved it lower, restored sentence-case headline hierarchy, shortened overall desktop hero height and put controls in a compact bottom row. Retained muted palette, original logo, custom background, slider/manual/pause controls and reduced-motion support. Consolidated hero CSS rather than appending another override layer.

Validation: frontend production build and 23/23 Chromium groups passed, including responsive layouts, image loading, manual/automatic slideshow, pause and reduced motion. Inspected desktop and phone screenshots. Diff check passed. Evidence: docs/phase4/evidence/hero-refactor-2026-11-06/. Local app restored on port 3000. No commit/push/deploy or backend changes. Full Phase 4 integration remains pending. Next: owner reviews the rebuilt composition.


### 2026-11-06 — Clean hero without background lettering

Removed decorative DEEP markup, styling and unused animation. Refined headline weight/scale and spacing, rounded CTA, quieter slide controls and navigation matched to the original pale-white logo. Preserved original SVG artwork/colour as previously requested; no logo filters/redrawing. Existing ocean palette, custom banner and slideshow/reduced-motion controls retained.

Validation: frontend production build and 23/23 Chromium groups passed, including absence of DEEP, original logo loading, responsive layouts, slideshow and reduced motion. Desktop screenshot inspected. Diff check passed. Evidence: docs/phase4/evidence/clean-hero-2026-11-06/. Local app restored on port 3000. No commit/push/deploy/backend changes. Full Phase 4 integration remains pending. Next: owner reviews the cleaner hero.
