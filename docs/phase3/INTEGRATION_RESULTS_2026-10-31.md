# Phase 3 integration — 31 October 2026 (Asia/Dhaka)

## Source and precedence

Integrated on `phase2b-rev1.3-review-fixes`, directly from full baseline `01cb93ea3ce312ef0227099bd224094b2072ddb8`. Phase 1, Phase 2A and corrected Phase 2B remain included. Phase 3 changes are uncommitted; the baseline hash is not a Phase 3 release hash.

Read both supplied ZIPs under `docs/`. The Clean Developer Package's `00_START_HERE.md` explicitly supersedes the earlier Operator Portal Developer Package where they conflict. Its authoritative implementation uses the exact current baseline and provider-independent media URLs. Verified all 13 outer manifest entries by byte count and SHA256; the supplied raw patch passed `git apply --check`. Integrated only the manifest's 31 new and 10 modified files from the complete source ZIP. Did not apply the patch a second time or overwrite the baseline SOURCE_MANIFEST, existing context, historical evidence, or private environment files.

The package reports client-confirmed Render/Atlas baseline acceptance. That is supplied handover information; this task did not independently inspect Render Live or Atlas identity.

## Implemented behavior

- `/operator/v2` portal, organisation picker, operational dashboard, protected navigation and legacy `/dashboard/v2` redirect.
- Profile editing, team roles and hashed/expiring/single-use invitations, including new-account onboarding and existing-account password verification.
- Liveaboard/cabin/itinerary/departure editing, shared pricing and availability, offers and price overrides.
- Resort rooms/packages/seasonal rates and normalized availability/stop-sell.
- Shared typed attributes, operator verification, notifications, enquiry workflow and organisation-scoped import history.
- CSV/XLSX parser reuse with separate preview and explicit commit.
- Scoped URL media records and additive gallery backfill. No binary storage on Render local disk.

## Corrections beyond the supplied implementation

- Legacy inventory uploads now preview rather than bypassing confirmation. Clients must explicitly commit through the operator import-batch endpoint.
- Import preview rejects invalid numeric/date values. Commit acquires an atomic batch lock and completed batches cannot replay.
- Invitations cannot overwrite an existing membership, including the last owner; suspended organisations are excluded from the picker and invitation acceptance.
- Profile writes use an atomic timestamp condition to detect concurrent edits.
- Operator enquiry transitions require Admin dispatch and reject backward transitions.
- Restored explicit rejection of vessel/resort organisation-transfer requests, preserving the earlier ownership regression contract.
- Package/rate edits validate room references against the same organisation and resort.
- Attribute definitions use the existing `visibleOnPage` schema field.
- Fixed portal effects returning promises. Login enters `/operator/v2` directly.
- Added controls for editing existing cabins, itinerary base prices, departure dates, room types, packages and seasonal rates; added image featuring, ordering and removal.
- Regression runner supports a separate report directory, preserving earlier historical reports. Earlier inventory regression tests now explicitly preview and commit.

## Executed validation

Used existing installed dependencies; no dependency or lockfile changes were required. Downloaded MongoDB 8.0.16 to a temporary directory to run isolated loopback databases. All credentials were generated for local fixtures, email remained in test mode, and no configured Atlas database was used.

| Check | Actual result | Evidence |
|---|---|---|
| Backend syntax | PASS, 104 JavaScript files | [backend checks](evidence/backend-checks.txt) |
| Phase 2B and Phase 3 static checks | PASS | [backend checks](evidence/backend-checks.txt) |
| Complete backend unit suite | PASS, 38/38 | [backend checks](evidence/backend-checks.txt) |
| Next.js production build | PASS, including all operator routes | [build output](evidence/frontend-build.txt) |
| Phase 1 regression | PASS, 34 groups | [report](evidence/phase1-test-results.json) |
| Phase 2A regression | PASS, 27 groups | [report](evidence/phase2a-test-results.json) |
| Phase 2B API regression | PASS, 10 groups | [report](evidence/phase2b-api-results.json) |
| Extended Phase 2B regression | PASS, 19 groups | [report](evidence/phase2b-acceptance-results.json) |
| Phase 3 API and browser | PASS, 14 groups | [report](evidence/phase3-results.json) |
| Documentation/whitespace | `git diff --check` passed | Local checkout |

Phase 3 checks cover role/organisation isolation, draft/editorial boundaries, pricing and normalized availability, resort edits/stop-sell, typed attributes, media approval boundaries, stale profile writes, invitation account/owner protection, preview/commit/upsert/replay behavior, Admin-first enquiry transitions, notifications and suspended access. Media migration dry-run, apply and idempotency were verified only in the isolated test database. Browser navigation covered approximately 390px, 768px and 1440px, both product editors, no horizontal overflow/runtime errors, legacy redirect, mobile cabin edit and image attachment persistence. These automated checks do not constitute manual completion of every staging checklist row.

## Deployment and acceptance still required

No commit, push, Render deployment, remote database migration or real email delivery was performed. The supplied staging checklist remains an unchecked template rather than an invented all-pass result.

1. Review and commit/push the changes under owner authorization; record the new full Phase 3 commit.
2. Configure both Render services to deploy that same branch/commit, using their existing `backend` and `frontend` roots and private V2 staging environment values.
3. Verify frontend `/api/release` and backend `/health` against the new full commit. Do not use the Phase 2B baseline hash as the identity of this modified source.
4. Confirm the dedicated V2 Atlas staging database and indexes. Review the media migration dry run there before applying it.
5. Complete [the staging acceptance checklist](PHASE3_ACCEPTANCE_CHECKLIST_REV1.0.md), including manual team invitation email flow, CSV/XLSX imports and routine mobile availability/enquiry/offer/media tasks. Record actual service hashes and staging evidence.
6. Follow [migration and rollback instructions](MIGRATIONS_AND_ROLLBACK.md). Direct binary image storage remains a separately configured durable provider; external supplier APIs remain Phase 5.
