# Phase 1 verification ? 2026-09-19

The local application using the configured MongoDB Atlas deeparture_v2 database passes the checks below. Hosted Render deployment and private GitHub repository status remain unverified; their URLs/access were not supplied. This is not a production security audit or a statement that every possible application path has been tested.

## Results

- Backend syntax: 62 JavaScript source/script files pass.
- Regression and compatibility tests: 8 pass.
- API and browser integration: 22 check groups pass.
- Frontend production build: passes with Next.js 16.3.5 and React 19.3.0.
- npm audit: zero reported vulnerabilities in both backend and frontend at verification time.
- Atlas shared attribute and demo seeds completed.
- Admin and operator login work through the API and Chromium browser.
- Operator dashboard displays organisation-owned vessels and resorts.
- Anonymous, invalid-token, expired-token, non-admin, unrelated-organisation and viewer-write requests are rejected as expected.
- Demo liveaboard and resort pages render; demo departure shows USD 4,950 and six available spaces.
- CSV imports create two vessels; XLSX imports create one resort under the same matched organisation.
- Two itineraries and three departures import with pricing, availability, sold-out state, override and discount.
- Reimporting itinerary pricing updates existing departure prices.
- Cross-organisation cabin references and inventory ownership transfers are rejected.
- Resort package and availability imports persist correctly.
- Imported records render public pages and appear in destination, price and availability searches.
- Documented default operator credentials are rejected by the checked API.
- Mobile liveaboard page fits a 390px viewport; no JavaScript page errors were observed in the browser run.
- Verification records were uniquely named and removed afterward. Demo content and configured admin/operator accounts remain.

## Changes

- Corrected USD inheritance for departure price overrides and consistent use of the supplied date when applying offers.
- Corrected offer comparisons when currency conversion is unavailable.
- Reprice departures after itinerary imports.
- Prevent changing inventory organisation/parent references through update payloads; validate cabin and resort-room relationships.
- Return HTTP 401 for invalid/expired JWTs and reject unverified accounts.
- Fixed liveaboard grid overflow caused by the departure table on mobile.
- Updated Next.js, React, React DOM and Nodemailer; scoped an ExcelJS UUID override to its compatible CommonJS v11 release. Spreadsheet roundtrip and JSON mail transport tests pass.
- Removed demo password logging from the seed script.
- Added Docker context exclusions for credentials, local dependencies and build artifacts.
- CI runs pricing/compatibility tests and uses lockfile-based npm ci installations. Dockerfiles also use npm ci.

Next.js migration reference: https://nextjs.org/docs/app/guides/upgrading/version-16

## Repeat checks

From backend:

~~~powershell
npm ci
npm run check
npm test
npm run verify:phase1
~~~

The integration script writes uniquely named temporary fixtures into the database configured by backend/.env and cleans them up in finally. Run it against development/staging only. It uses the configured ADMIN and DEMO_OPERATOR credentials without printing passwords or tokens.

For browser checks, install frontend development dependencies and Chromium, build/start the frontend, and run the backend server using the same Atlas database:

~~~powershell
# frontend
npm ci
npx playwright install chromium
npm run build
npm start

# backend, separate terminal
npm run dev

# backend, another terminal
npm run verify:phase1 -- --browser
~~~

Browser checks default to http://localhost:3000; VERIFY_FRONTEND_URL can override that address. The frontend API URL must point to the backend using the same database as the verification script.

## Still pending outside this workspace

- Verify the actual Render backend/frontend deployment, HTTPS URLs and environment configuration after deploying these changes.
- Verify the GitHub repository exists and is private. This directory currently has no .git metadata.
- Confirm administratively that the Atlas database is isolated from production. Its name and test contents alone do not establish that.
- Verify staging credentials and public exposure on the hosted deployment; local rejection of default credentials does not prove the hosted service is configured identically.
- Docker runtime verification was not possible because Docker is not installed here.

Frontend remains the Phase 1 starter interface; final customer design remains outside this phase.
