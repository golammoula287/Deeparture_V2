# Deeparture Phase 4 brand reference

Updated: 2026-11-13 (Asia/Dhaka). Owner-selected palette recorded for ongoing planning and implementation. Shared customer colour roles are implemented; final page styling remains subject to visual review.

## Confirmed homepage direction — 13 November 2026

The owner selected **Ocean & Coral**. Keep ocean teal, warm ivory, seafoam and burnt-coral actions, with the original logo and single-diver portrait. The header and hero now share a soft vertical teal fade to remove the bright rectangular photo edge highlighted in the client screenshot. Midnight & Champagne remains a reference preview; it is not the selected direction. Overall page and functional acceptance remain separate. The owner subsequently requested a stronger hero and removal of “A world of diving”; that line is removed, with refined headline typography, spacing and a restrained coral rule. Latest visual evidence: [desktop](evidence/homepage-hero-polish-2026-11-13/home-desktop.png), [phone](evidence/homepage-hero-polish-2026-11-13/home-phone.png).

## Earlier homepage colour comparison — 12 November 2026

Ocean & Coral remains the default and a possible final choice. The owner requested an alternative: Midnight & Champagne is available at `/?palette=midnight`, with the original at `/?palette=coral`. Comparison controls appear only on explicit preview URLs. No final selection is inferred. See [both colour options and validation](HOMEPAGE_COLOUR_OPTIONS_2026-11-12.md).

## Current homepage palette — 12 November 2026

The owner subsequently removed the strict blue/white constraint and authorized colour selection using design judgement. The homepage now uses ocean deep #0B3038, teal #0B6B68, warm ivory #FBFAF6, seafoam supporting surfaces and burnt-coral #B54632 primary actions. This supersedes the earlier blue/white confirmation for the homepage. The original logo and single-diver portrait are retained. Scope, rationale and measured contrast: [Homepage colour refinement](HOMEPAGE_COLOUR_2026-11-12.md). Other routes retain their existing palette until their individual redesign.

## Earlier homepage Rev 2 review direction — 12 November 2026

The owner requested a new homepage based on earlier client UI references and the final scope PDF. The first homepage iteration uses blue #0754D8 / navy #082F68 / white, with the original logo and Manrope unchanged. The owner confirmed the earlier client blue/white reference on 12 November 2026. This is the confirmed colour direction for the page-by-page redesign; overall homepage layout review remains pending. The muted palette below remains the existing direction for other customer routes until their individual redesign; no global token replacement was made. See [Rev 2 plan and evidence](HOMEPAGE_REV2_PLAN_2026-11-12.md).

## Source of truth

The latest owner-supplied muted ocean swatches (Screenshot 2026-11-06 at 04.30.24.png) supersede the earlier bright-blue and pastel UI experiments. The seven values below were sampled from that reference and used in the subsequent prototype. Do not substitute older palettes when resuming work.

[BRAND_TOKENS.json](BRAND_TOKENS.json) stores the same values in machine-readable form for implementation handoff; it is not currently imported by the application. [BRAND_ASSETS.json](BRAND_ASSETS.json) is historical source provenance: its `brandColor: #0080FF` records the original website, not the newly selected UI palette. Keep the provenance intact.

## Palette and roles

| Token | Hex | Planned role |
| --- | --- | --- |
| Ocean night | #071925 | Primary text, primary actions, strongest dark surfaces |
| Ocean deep | #123749 | Hero shades, dark navigation/footer, deep section backgrounds |
| Ocean teal | #294E5C | Primary-action hover, secondary dark surfaces |
| Slate | #50636B | Supporting body text on light surfaces |
| Ocean blue | #527787 | Accessible secondary links/labels on white; underline links |
| Ocean mist | #6D919D | Supporting decorative accents and non-text borders where contrast suffices |
| Ocean fog | #9DB7C3 | Light accents, selected light surfaces, dark-text secondary actions |
| White | #FFFFFF | Cards, fields and gallery/dialog surfaces; text on dark backgrounds |
| Paper | #F5F8F9 | Neutral page background; supporting neutral, not another brand accent |

Use light surfaces for information-heavy search/detail pages. Reserve large dark/image surfaces for the homepage hero, navigation/footer or deliberate section transitions. Price, availability and accessibility information should be readable without scanning decorative badges.

## Component colour rules

- Primary CTA: white label on Ocean night; hover Ocean teal; visible dual-colour focus indicator suitable for the surrounding surface.
- Secondary CTA: Ocean night label on white or Ocean fog, with an identifiable border. Do not use Ocean mist behind normal-size white text.
- Body text: Ocean night; secondary text Slate. Ocean mist/Fog are not normal body-text colours on white.
- Search fields: white, visible label, explicit selected value, border discernible from adjacent surfaces. Strong focus state; placeholders never replace labels.
- Filters: dark text on light selected state plus checkmark/text/count. Colour alone must not communicate applied filters.
- Offers and availability: readable text naming the state. Fog may support an offer highlight, but an accent colour is not evidence of a discount or available space.
- Errors/success: semantic colours are additional functional tokens, not a new brand direction. Define and test them during component design; pair colour with text/icons. Avoid assigning green to every dietary/accessibility attribute or treating unknown states as success.
- Hero: preserve image detail with a layered navy overlay; test the actual crop/overlay/text at each screen size. Solid-swatch contrast does not establish contrast over photography.

## Verified solid-colour contrast

Calculated locally using sRGB relative luminance. Ratios rounded to two decimals; these are planning checks, not a completed accessibility audit.

| Foreground / background | Ratio | Use |
| --- | --- | --- |
| White / Ocean night | 17.88:1 | Normal text and actions |
| White / Ocean deep | 12.59:1 | Normal text on dark sections |
| White / Ocean teal | 8.98:1 | Normal text and hover actions |
| Slate / White | 6.29:1 | Secondary body text |
| Ocean blue / White | 4.83:1 | Normal text; links also need non-colour cues |
| Ocean night / Ocean fog | 8.51:1 | Dark text on light accents |
| Ocean mist / White | 3.39:1 | Not normal-size body text |
| White / Ocean mist | 3.39:1 | Not normal-size button text |

Test neutral surfaces, focus indicators, disabled states, actual images, opacity and semantic colours in the final implementation.

## Logo invariants

- Preserve original Deeparture wordmark/mark shapes, proportions and SVG files. No CSS colour filters, redrawing, stretching, outlined box treatment or replacement logo inspired by a reference site.
- `/brand/logo.svg`: original pale-white version for dark backgrounds.
- `/brand/footerLogo.svg`: original blue/pale version; its baked-in blue remains original brand identity, not a request to recolour every UI component bright blue. Choose a suitable background with readable full wordmark.
- Keep clear space and a responsive width that fits navigation. Use meaningful Deeparture alt text and a homepage link.
- If a proper dark-on-light logo is unavailable, use the original light logo on a deliberate dark header surface; do not invent a new variant without a specific request.
- Existing asset checksums in BRAND_ASSETS.json remain the verification reference.

## Typography and imagery

Current customer UI uses one locally hosted Manrope family following the owner-requested GitHub design skill. Retain the bundled OFL licence. Existing Outfit/Roboto files remain historical assets; the original logo is untouched. Named Heading/Title/Body/Button/Caption roles use a consistent scale across search/detail with readable labels and calm line lengths. See [skill application](GITHUB_DESIGN_SKILL_2026-11-07.md).

Generated banner artwork is atmosphere only. Listing/gallery/cabin/room images must represent their actual products and have approved provenance. Do not generate evidence of facilities or destinations. The owner liked the reef image and later requested a portrait trial; neither image preference establishes approval of the whole marketplace design.

## Continuity checklist

At every implementation handoff, read this guide and UX_PLAN.md. Mobile uses an app-like web/PWA shell with Home / About us / Contact navigation; homepage includes curated trips/liveaboards while full search remains on a separate page. Confirm the separate trip-finder page, current palette, original logo, no decorative DEEP word, no autoplay/number/pause controls and no invented business claims. A future owner instruction can update these choices; record the change explicitly rather than mixing old and new palettes.


## Applied colour theory — 7 November 2026

The customer UI uses analogous ocean harmony: nearby blue/blue-green hues create continuity, while lightness contrast defines hierarchy. The existing owner-selected palette stays intact; no new decorative accent or logo recolouring is introduced.

- **Dominance and restraint:** use a 60/30/10-style guide for composition: predominantly light neutral reading surfaces, a smaller share of structural ocean colours, and sparing selected/focus accents. This is a design heuristic, not a measured pixel ratio; photographic hero sections have their own tonal balance.
- **Value contrast:** darkest ink carries headings/prices; Slate carries readable supporting text. Primary actions are dark with white labels. Control boundaries now use Ocean mist (#6D919D) rather than barely visible pale borders.
- **Surface hierarchy:** Canvas (#F5F8F9), white cards and Soft (#EDF3F5) supporting panels keep dense search/detail information distinct without adding unrelated hues. Selected states use #E1EBEF plus explicit text/shape/active indicators.
- **Action hierarchy:** one dark primary action; light or outlined secondary actions; underlined textual links. Hover moves within the same ocean family.
- **Focus:** Ocean blue with a white separation ring provides a distinct keyboard cue across light and dark contexts. Validate the composed component, not just the colour token.
- **Semantic exceptions:** error text #8F2F35 on #FFF1F1; confirmed success text #24574C on #EDF5F2. These are functional feedback colours and do not expand the decorative brand palette. Pair them with words and roles; no colour-only availability claims.

Shared semantic tokens live on CustomerShell.module.css and are consumed by marketplace/detail/enquiry styles with safe fallbacks. BRAND_TOKENS.json remains documentation/handoff, not an application import. Browser verification checks actual computed primary-action contrast >=4.5:1 and input-boundary contrast >=3:1; image overlay contrast still needs crop-specific visual review.
