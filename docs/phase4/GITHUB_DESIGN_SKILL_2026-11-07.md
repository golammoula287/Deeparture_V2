# GitHub design-skill application — 7 November 2026

Owner asked to follow https://github.com/elayadesign/ai-design-skills/tree/main/skills . Read the current landing-page-design SKILL.md, reviewed the Figma skill scope (no Figma task/file requested), and read the linked redesign-existing-projects companion audit. Applied the guidance directly to this existing Next.js application; no global skill/plugin installation or Figma write was needed.

Sources:
- https://github.com/elayadesign/ai-design-skills/blob/main/skills/landing-page-design/SKILL.md
- https://github.com/elayadesign/redesign-skill/blob/main/skills/redesign-existing-projects/SKILL.md

## Audit and changes

Diagnosed small labels, arbitrary type/spacing values, paired fonts, weak loading hierarchy and overly vague homepage messaging. Refined the actual customer pages in place: locally hosted Manrope as the single UI family; named typography/spacing tokens; readable labels; consistent button/radius treatments; clearer hero copy; a three-step enquiry journey; six factual FAQs and a final Find a trip CTA. Added a restrained word reveal to the existing two-line tagline with IntersectionObserver and reduced-motion fallback. Removed the hero background gradient in favour of a flat photograph shade; text uses a white-to-brand-fog treatment.

Original logo files and seven ocean colours preserved. Desktop Home/About us/Contact, app-like mobile tabs, separate finder and V2 data flow retained. Generic black-only surfaces and floating/hamburger navigation in the source guidance were not substituted for these owner requirements. Marketplace catalogue cards remain comparable; no decorative testimonial/customer-logo/statistic/guarantee sections were invented. Existing API text is not rewritten to remove punctuation or hyphens from actual product facts.

Manrope source: https://github.com/google/fonts/tree/main/ofl/manrope ; font and OFL licence saved in frontend/public/brand. Existing Outfit/Roboto assets and original provenance manifest remain historical and available; current customer UI uses Manrope. No extra JavaScript package installed.

## Validation and limits

Frontend test-config and normal-config production builds passed. 15/15 loopback synthetic-API browser groups passed, including typography, factual FAQ interaction, reduced-motion tagline, contrast, responsive layout and search/detail/enquiry flows. Desktop/phone screenshots inspected. Diff and runner syntax checks passed. Updated evidence: docs/phase4/evidence/customer-marketplace-2026-11-07/.

No backend changes or additional backend tests in this pass. No real API/database/email writes. The test inventory is synthetic and is not bundled into production pages. Local frontend restored at3000 using normal config; real catalogue still requires isolated development V2 API/database.

Full production legal/SEO/PWA/real-data/staging acceptance remains separate. There is no claim of literal compliance with every generic landing-page pattern or of a completed full Phase4 audit. Current user requirements take precedence over generic skill defaults. No commit/push/deploy.
