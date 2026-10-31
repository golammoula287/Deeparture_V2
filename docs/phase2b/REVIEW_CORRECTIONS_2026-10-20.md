# Rev 1.3 developer review corrections — 20 October 2026

Review: `Deeparture_Phase2B_Developer_Review.docx`, supplied by the user. Its requirements are review input; deployment claims require separate evidence.

## Source identity

- Reviewed baseline: `df61c280abac73f21765d3eb4a9f7285d25231f8`, from `origin/phase2b-rev1.3-integration`.
- Local correction branch: `phase2b-rev1.3-review-fixes`.
- Corrected source is an uncommitted working tree until the user commits it. The baseline SHA does not identify these corrections.
- The source archive and file manifest identify the delivered working tree by SHA256. They do not prove a Render deployment.

## Findings addressed

1. **Older checklist:** use the full 125-row Rev 1.3 checklist and the accompanying row-by-row `REV1.3_ACCEPTANCE_EVIDENCE.md`. The client-supplied seven-page Rev 1.3 PDF was read and compared with the repository checklist. A 45-row Rev 1.1 checklist is not used for this handover.
2. **Deployment evidence:** added backend `/health` source SHA and frontend `/api/release` build-time SHA. Invalid or missing identities return null, never an inferred pass. The read-only `backend/scripts/verify-render-release.js` checks expected frontend/backend identities and authenticated Admin access without logging credentials. Full staging workflow and Atlas evidence remain separate requirements.
3. **Provider isolation:** exact organisation provider, exact global provider, explicit organisation generic default, then explicit global generic default. Disabled configurations are respected. Snapshot resolution uses the same policy and handles historical incorrect associations.
4. **Disabled sole source:** return unknown inventory with cleared quantities and source metadata when all normalized sources are disabled. Preserve genuine legacy inventory only when there are no normalized snapshots. Manual overrides continue to work. Explicit MongoDB unsets remove stale room/effective inventory fields. Legacy fallback copies only availability fields, avoiding cross-collection immutable ID errors.

## Regression evidence

- Complete backend unit suite: 30 tests passed.
- Backend syntax and Phase 2B static architecture checks passed.
- Frontend production build passed.
- Real isolated MongoDB review regressions: seven groups passed, covering both resorts and liveaboard departures.
- Full Phase 1, Phase 2A, Phase 2B API and extended browser/scale suites are recorded in the dated JSON reports linked by the evidence matrix.
- Added an explicit combined canonical-port, price, availability and four typed-attribute search demonstration with negative controls.

## Render and Atlas status

On 20 October 2026 the project owner stated: “i confirmed all passed so do that.” This is recorded as owner-reported success of the existing Render deployment. It does not identify a deployment containing these subsequent local changes.

Frontend reported by the existing project evidence: `https://deeparture-v2-1.onrender.com`.
Backend reported by the existing project evidence: `https://deeparture-v2-3hr6.onrender.com`.

No staging admin credential, Render deployment access, exact deployed source SHA, or Atlas database/index evidence was supplied for this correction task. No hosted writes or deployments were performed. The older hosted JSON reports remain historical records, including their failed login; they are not rewritten to claim a new successful run.

Final staging sign-off remains pending until the corrected source is committed and deployed, both live SHA endpoints match that commit, dated authenticated workflow evidence is attached, and the dedicated V2 Atlas database/environment and indexes are verified. No V1 production database was accessed by this task.

## Reproduce and deploy

1. Run `npm ci --ignore-scripts` in backend and frontend, then `npm run verify:phase2b` in backend.
2. With a local MongoDB binary and Playwright Chromium installed, run `MONGOD_PATH=/absolute/path/to/mongod node scripts/verify-phase1-local.js --phase2b` from backend. This launches an isolated database and local browser services, including a production build.
3. For the focused review tests, start a separate local MongoDB instance and set `REVIEW_DATABASE_URL=mongodb://127.0.0.1:27030/deeparture_review_UNIQUE` with a lowercase alphanumeric/underscore suffix. Run `node scripts/verify-review-availability.js` in backend. Use a new database name each run. The script rejects remote database URLs.
4. Review the source changes, commit them and deploy that exact commit to both intended Render staging services. Render's `RENDER_GIT_COMMIT` supplies identity; other build systems must set `BUILD_COMMIT` to the exact source SHA before build/start. Do not label a modified local build with its baseline SHA.
5. Supply `EXPECTED_DEPLOYED_COMMIT`, `STAGING_ADMIN_EMAIL`, `STAGING_ADMIN_PASSWORD`, and `STAGING_TESTER` through a private environment. Run `node scripts/verify-render-release.js` in backend. A missing/mismatched identity or unavailable authentication fails the report. This collector is read-only apart from login; it does not replace the complete workflow checklist.
6. Run critical workflows on dedicated V2 staging fixtures, record dated per-row staging evidence, database name and index verification, and run the bounded Admin availability maintenance described in `RETENTION_AND_OPERATIONS.md`.
7. Complete final acceptance only after those results identify the delivered corrected commit. Keep credentials out of evidence files.
