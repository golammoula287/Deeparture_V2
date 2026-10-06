# Phase 1 sign-off / Phase 2A handover review

Reviewed 30 September 2026 against `specifications/Deeparture_Phase1_Signoff_Phase2A_Handover_v2.pdf`.

The PDF is a close-out checklist, not a Phase 2A implementation specification. Its recommended decision is PASS WITH ISSUES, conditional on documenting outstanding confirmations and handing over the deployed code. Its claims about Render/Atlas are supplied statements, not independently verified findings of this review.

## Code identity

- Workspace: `D:\Sifat\Deeparture_V2`.
- Local branch: `main`.
- Local HEAD: `137747914daa2de1a9c4652f08a81a2a3820fea8`.
- Uncommitted work includes dashboard session protection, logout and browser regression coverage.
- This repository uses `backend/` and `frontend/`. The IDE path `apps/api/src/config.ts` is absent; confirm the intended repository before auditing a different deployment.
- Deployed branch/commit, frontend/backend URLs, and exact Atlas database name: **not supplied or independently confirmed**.
- No ZIP has been labelled as the deployed codebase; that identity must be established first.

## Close-out mapping

| PDF requirement | Evidence / outstanding action |
| --- | --- |
| Review Phase 1 checklist | Previous audit and corrected checklist are in `docs/phase1-review.md` and `docs/specifications/`. Local pass marks do not establish hosted acceptance. |
| Confirm dedicated Atlas staging DB | Pending written confirmation of the exact database name and isolation from V1 production. Do not provide a credential-bearing connection string. |
| Demonstrate effective-price override chain | Added a real API test: itinerary USD 6,000, departure override USD 7,000, 10% offer, public detail API USD 6,300. Consult the current JSON test results for run status. The unchanged seeded example remains USD 5,500 minus 10% = USD 4,950. |
| Production email delivery plan | Production transport/provider has not been agreed. The PDF reports a hosting SMTP limitation; this review has not independently diagnosed that deployment. Current code uses JSON test transport unless explicitly configured for live SMTP. |
| Record login/logout issue | Local fix implemented: session validation before dashboard rendering, guest/invalid-session redirects, header logout, cleared credentials, cross-tab logout. Browser checks cover both operator and admin sessions. Deployment of the fix is pending. |
| Current deployed ZIP, branch and commit | Local identity recorded above. Deployment identity and matching export remain pending. |
| README / setup instructions | `README.md`, `docker-compose.yml`, `backend/.env.example`, `frontend/.env.example`. |
| Seed/import files | `backend/scripts/seed-v2-attributes.js`, `backend/scripts/seed-demo.js`, and six CSV templates in `backend/templates/`. |
| Known issues | Hosted evidence remains incomplete. Full Admin/Operator UI, automation and broader future-platform requirements are outside this close-out review. |
| Final acceptance | Owner sign-off and deployed-code confirmation remain pending. No unconditional acceptance or deployment claim is made. |

## Environment names only

Backend runtime: `DATABASE_URL`, `JWT_SECRET_KEY`, `NODE_ENV`, `PORT`, `BCRYPT_SALT_ROUNDS`, `FRONTEND_URL`, `EMAIL_DELIVERY_MODE`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.

Account/seed commands: `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_OPERATOR_EMAIL`, `DEMO_OPERATOR_PASSWORD`.

Frontend: `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`.

Local verification: `MONGOD_PATH`, `VERIFY_BROWSER_CHANNEL`, `VERIFY_FRONTEND_URL`, `VERIFY_REPORT_PATH`.

The actual JWT variable is `JWT_SECRET_KEY`; the PDF's `JWT_SECRET` is only an example. No secret values are included here.

## Proposed email release check — awaiting agreement

Choose a production-capable delivery service and confirm that the hosting configuration supports it. If choosing an HTTP email API, implement its adapter; the current code supports SMTP and JSON transport. Before launch, use controlled test recipients to verify customer acknowledgement, correct operator notification and admin notification, confirm delivery/failure evidence, and verify enquiry persistence during mail failures. Keep routine staging tests in `EMAIL_DELIVERY_MODE=test`; enable live delivery only for the explicitly configured delivery test. Record the result before production launch.

## Remaining handover inputs

Provide the frontend/backend staging URLs, deployed branch and exact commit, dedicated Atlas database name, confirmation that the deployed commit matches the supplied repository/export, and the intended production email method. Provide names and confirmations only, never passwords, tokens or secret connection strings.

Local code review can proceed from this working tree. Review of the actual deployed Phase 1 codebase requires the identity match above; Phase 2A feature development additionally needs its implementation scope.
