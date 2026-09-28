# Phase 1 acceptance review — 29 September 2026

The supplied checklist broadly matches the standalone Phase 1 pilot, but it was not sufficient for full acceptance: claim invitation security, import provenance and protection of Deeparture editorial fields were missing. These checks have been added to the Word document. The specifications use different phase boundaries: shared-platform section 24 makes claims and invitation security part of Foundation; liveaboard foundation includes pricing and ownership. This review does not certify the complete future platform described by all three specifications.

The original Word document referenced missing reports and fixes absent from this checkout. Those notes have been replaced with evidence from this review. Base revision: `2fd67d2`; reviewed changes are local and uncommitted.

## Corrections

- SMTP credentials alone no longer enable delivery. JSON test transport is the default; real delivery requires `EMAIL_DELIVERY_MODE=live`. Docker explicitly selects test mode.
- Demo seed requires a private password of at least 12 characters and rejects the documented default. Environment examples no longer supply passwords. Existing deployed accounts are not rotated by this change.
- Operators cannot assign Deeparture vegan/environmental ratings, verification badges or publication status to vessels/resorts. Admins retain those permissions.
- Claim acceptance requires an existing account's password instead of overwriting its credentials. Restricted/unverified accounts cannot claim. Token consumption is atomic, preventing concurrent reuse. Inviting a claimed/verified organisation no longer downgrades its state. If provisioning fails after consumption, an admin must issue another invitation.
- Claim page explains existing-account passwords and the minimum length for new accounts.
- Added isolated acceptance runner and persistent JSON results; expanded imports, rates, enquiry recipients, claims, provenance, browser filters and viewport checks.

## Verification

- 10 regression tests passed, including pricing, spreadsheet compatibility, SMTP safety and seed-password checks.
- Backend syntax check passed for 63 JavaScript files.
- Attribute and demo seeds ran twice in a fresh local MongoDB; admin creation succeeded with generated credentials.
- Next.js production build passed.
- API/browser results are recorded in [phase1-test-results.json](phase1-test-results.json). Browser tests use real Chromium against the production frontend with a temporary database.
- No configured Atlas or production database was used. Test email was generated locally without SMTP delivery. Test fixtures were cleaned up and spawned services stopped.

Run from `backend`: `npm.cmd test`, then `npm.cmd run verify:phase1:local`. The latter requires `mongod` on PATH and installed Playwright Chromium; `MONGOD_PATH` and `VERIFY_BROWSER_CHANNEL` can override those. Ports 27029, 5019 and 3019 must be free. It builds the frontend using isolated local API URLs, so rebuild normally before running against your usual API. Temporary MongoDB files remain in the system temporary directory for inspection.

## Outstanding acceptance evidence

The Word checklist retains pending items for private GitHub repository/deployed revision, Render frontend/backend health and logs, Render-to-Atlas connectivity, Atlas network allowlist and database isolation, remote secret history, deployed account passwords, staging admin creation and deployed test-only email configuration. Final Phase 2 sign-off depends on those checks. Local success does not establish hosted success.

Provide the staging frontend/backend URLs and access to the relevant deployment/account settings to finish these checks; do not paste secrets into chat. No deployment, remote account changes or external messages were performed.

The broader specifications also describe later capabilities such as complete operator/admin workflows, import previews/jobs, richer resort pricing, media management and legacy-account migration. The starter checklist is not an acceptance test for those full-product capabilities.
