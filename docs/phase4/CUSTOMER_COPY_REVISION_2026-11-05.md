# Customer-facing copy cleanup

Date: 2026-11-05 (Asia/Dhaka). Owner explicitly requested removal of preview/demo/sample language from the customer pages.

Removed the top development banner and customer-visible review disclaimers from page titles/descriptions, navigation, footer, result counts, detail sections, rating/gallery labels, image alt text and enquiry controls. Replaced them with normal customer copy. “Review enquiry” retains selected trip/date context and shows a review state; it does not falsely confirm delivery or send a request.

This is a presentation change. The local fixture source, internal route/module names, noindex/no-store headers, production access guard and original logos remain unchanged. Full API integration and actual enquiry submission are still pending and are not claimed by the cleaned copy.

Verification: frontend production build passed; **22/22 Chromium groups passed**, including assertions that customer-visible body/title/alt text contains no preview/demo/sample/illustrative wording, plus existing responsive, card/search/filter/gallery, selected enquiry context, zero submission requests, contrast and access-guard checks. Widths: 390/768/1440px. No page/console errors. Diff/script checks and logo hash verification passed.

Evidence: [results](evidence/customer-copy-revision/design-browser-results-2026-11-05.json), [desktop](evidence/customer-copy-revision/design-search-desktop.png), [phone](evidence/customer-copy-revision/design-search-phone.png), [detail](evidence/customer-copy-revision/design-detail-desktop.png). Earlier revisions retained.

Local UI: `http://127.0.0.1:3000/phase4-preview?review=customer-copy`. No backend, private environment, database, email or deployment changes.
