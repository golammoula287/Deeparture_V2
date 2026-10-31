# Phase 2A integration — 6 October 2026

Phase 2A has been integrated into the existing Express/Mongoose and Next.js application from the client's Implementation Rev 1.0 package. The local baseline and remote `main` both resolved to `137747914daa2de1a9c4652f08a81a2a3820fea8` when checked. Existing login/logout work was preserved. The implementation archive checksum matched the client's manifest before review.

This is local implementation evidence. Render service identity, deployment configuration and Atlas database isolation have not been confirmed. Do not represent local results as hosted acceptance, or begin Phase 2B from an assumed deployed revision.

## Delivered behavior

- Separate admin-only `/admin/v2` dashboard, with catalogue, import, organisations, attributes, locations and enquiry screens.
- Global liveaboard/resort search, pagination and filters for publication, organisation, destination and claim state. Draft preview and publication actions remain separate from importing.
- Editable operator profiles, claim invitations, suspension/reactivation and links to owned listings.
- Attribute creation/editing/activation, type/options, applicability, visibility/filter flags and ordering. Stable machine keys prevent breaking existing facets.
- Canonical location creation/editing/deactivation and aliases; duplicate names/case variants/aliases and parent cycles are rejected. Slugs remain stable when labels change.
- CSV/XLSX catalogue preview, explicit commit, draft defaults, duplicate/error/skip classification and persisted row outcomes. Concurrent commits of the same batch are rejected.
- Admin-first enquiry approval. Pending enquiries are withheld from both operator notifications and the operator dashboard. Customer/admin receipt notifications are retained. Failed approval delivery keeps the enquiry for retry; invalid state transitions are rejected.
- Shared availability service with source metadata and quantity validation. Updating one cabin preserves other cabins; resort dates normalize to UTC day boundaries.
- Existing authentication/logout, claims, ownership, public pages/search and pricing remain covered by regression checks.

## Corrections beyond the supplied implementation

Completed incomplete attribute/location/operator editing controls and catalogue filters/pagination. Added claimed-organisation dashboard counts and queue links. Corrected missing import audit/results, non-atomic batch commit, operator visibility of unapproved leads, enquiry transition validation, retryable mail failure, partial cabin update data loss, invalid quantities and unstable location duplicates. Listing edits preserve legacy destination slugs unless destinations are explicitly changed. Public enquiry selections are checked against the selected listing; customer payloads cannot set workflow state.

## Import contract

`bulkFile.service` parses CSV or Excel worksheets; `catalogImportAdapter.service` maps source headers into a versioned normalized row: `schemaVersion`, `rowNumber`, `sourceType`, `organisation`, `productType`, `product`, `errors`, `skip`. `catalogImport.service` classifies normalized records and owns preview/commit writes.

Use `Operators` plus `Liveaboards` or `Resorts` sheets. Products can reference `operatorKey`; the Operators sheet provides organisation details. A single product sheet containing the operator columns also works. Existing CSV templates remain in `backend/templates/`. The selected product type determines which sheet is imported; import each type separately.

Preview creates an `ImportBatchV2` audit/working record, but no catalogue or organisation records. Actions are CREATE, UPDATE, DUPLICATE_REVIEW, ERROR and SKIP. Conflicting rows block the normal UI commit. The API supports explicit partial commit; it never commits ERROR/DUPLICATE_REVIEW/SKIP rows. Stored batch `results` and `rowErrors` retain row outcomes. Imported new listings always enter draft, regardless of a spreadsheet `publish` column. Matching updates preserve listing IDs and publication state; admin publication is a separate action.

## Availability contract

Departure updates identify organisation, departure and optional cabin. Inventory carries `status`, optional non-negative integral `totalSpaces`/`spacesAvailable` and `totalCabins`/`cabinsAvailable`, `sourceType`, `sourceReference`, `sourceUpdatedAt`, `receivedAt`, `updatedAt`. The existing `replaceDepartureAvailability` entry point now merges by cabin identity so partial uploads do not erase other cabins. Resort inventory uses organisation, room type and UTC date, with quantity/status/source metadata. Manual and import controllers delegate persistence to the shared service.

Phase 2A does not implement competing-feed priority, webhook connectors or a freshness/conflict engine. A timestamp is not a promise of live availability.

## Enquiry contract

New enquiries persist as `new` and notify the customer/admin only. Approval moves through `admin_approved` to `sent_to_operator`; delivery failure leaves `admin_approved` for retry. An in-flight flag prevents simultaneous approval sends. Operator responses are limited to organisation-owned, already-released enquiries. Admin closure/rejection/confirmation follows permitted transitions and creates audit entries.

An application crash during email delivery may require an admin to inspect delivery evidence and reset a stuck in-flight flag; this release is not a durable email queue and does not claim exactly-once external delivery. The general notification infrastructure improvements remain later work. Test mode generates messages locally; real SMTP requires explicit `EMAIL_DELIVERY_MODE=live` and hosting/provider support.

## Repeatable verification

From `backend/`, run `npm ci`, `npm run check`, `npm test`, and `npm run verify:phase2a:local`. From `frontend/`, run `npm ci` and install Playwright Chromium (`npx playwright install chromium`) before browser verification.

The isolated runner requires `mongod` on PATH and free ports 27029, 5019 and 3019. It creates a fresh temporary MongoDB directory, generated private accounts, JSON email transport and a production frontend build, then runs retained Phase 1 checks and Phase 2A checks. It does not use the configured Atlas database. Temporary database files remain in the OS temp directory; spawned services stop after testing. Reports: `docs/phase1-test-results.json` and `docs/phase2a-test-results.json`.

Phase 1's immediate catalogue imports and immediate operator notification have intentional replacements: its regression runner now previews, commits and explicitly publishes imports, and approves an enquiry before expecting operator delivery. Admin login now routes to `/admin/v2`; operators retain `/dashboard/v2`.

## Deploy and establish the baseline

1. Compare this integration branch/commit with the branch configured in both existing Render V2 services. Preserve deployment-specific changes. Back up the dedicated V2 staging database.
2. Use the current frontend/backend build and start settings (`backend`: `npm ci`, `npm start`; `frontend`: `npm ci && npm run build`, `npm start`). Set the browser-facing `NEXT_PUBLIC_API_URL` to the staging backend `/api` URL at build time and configure `API_INTERNAL_URL` for server-side requests. Set the backend `FRONTEND_URL` to the staging frontend.
3. Use private existing database/JWT/account values and staging-safe `EMAIL_DELIVERY_MODE=test`. No new required secret variables are introduced. Keep real `.env` files out of Git and exports.
4. Deploy the reviewed integration commit to V2 staging. Confirm `/health`, admin login, import/preview/publication, enquiry approval, claim/ownership/pricing regressions and responsive admin screens using the client checklist.
5. Record frontend URL, backend URL, deployed branch, exact full commit from BOTH Render services, Atlas staging database name (no credentials), test date, checklist results, configuration changes and known issues in `docs/deployment-confirmation.md`.

Only after that verification state: “This commit is the version currently deployed to the Deeparture V2 Render staging environment.” No remote deployment has been performed from this workspace during this integration.

The workspace remains `D:\Sifat\Deeparture_V2`; the IDE's `D:\Deeparture\deeparture-v2` environment file belongs to a different checkout.
