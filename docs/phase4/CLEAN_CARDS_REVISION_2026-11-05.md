# Clean cards and text-only actions

Date: 2026-11-05 (Asia/Dhaka).

Owner requested removing arrows and making the cards cleaner. This refinement retains the latest ocean/ivory/coral direction and unchanged original logos.

- Removed decorative arrow SVGs from header, hero, search, destination shortcuts, footer, enquiry and mobile actions.
- Replaced gallery and pagination arrow glyphs with Previous/Next text, retaining keyboard navigation and accessible names. Native select/calendar affordances and the original logo artwork are preserved.
- Search card now has a short heading, consistent softly bordered destination/date fields and a plain “Search trips” button.
- Trip cards now show location, title, date/duration, quiet feature text, price and availability in a clearer hierarchy. Removed the round arrow control; each card has a full-width “View trip” text action.
- Reduced badge treatment and internal divider noise; retained useful active offer and availability information.

## Verification

Frontend production build passed. **20/20 Chromium groups passed**, including a new assertion that decorative arrows are absent and that a card's View trip link opens the correct detail page. Existing search/filter, pagination/gallery, enquiry-preview, original-logo/font/palette, primary-action contrast, production-guard and responsive 390/768/1440px checks passed with no page/console errors.

Evidence: [results](evidence/clean-cards-revision/design-browser-results-2026-11-05.json), [desktop search/cards](evidence/clean-cards-revision/design-search-desktop.png), [phone search/cards](evidence/clean-cards-revision/design-search-phone.png). Tablet/detail/drawer screenshots are in the same directory. Earlier evidence is retained. Original logo hashes, script syntax and diff checks passed.

Latest local preview: `http://127.0.0.1:3000/phase4-preview?review=clean-cards`. Fixture inventory remains explicit. Full Phase 4 integration and staging acceptance are still pending; this task changes presentation in the existing frontend. No backend, environment, database, email or deployment changes.
