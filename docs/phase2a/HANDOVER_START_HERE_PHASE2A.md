# Deeparture Phase 2A integration handover

Updated 6 October 2026. This checkout contains the client-supplied Phase 2A implementation, reviewed fixes and preserved Phase 1 login/logout work.

1. Read `docs/phase2a/IMPLEMENTATION_AND_DEPLOYMENT.md` for delivered behavior, contracts, tests and deployment instructions.
2. See `docs/phase2a/LOCAL_ACCEPTANCE.md` and the two `docs/phase*-test-results.json` files for verification evidence.
3. Follow `README.md` to install dependencies and configure private environment values locally. The source uses `backend/` and `frontend/`.
4. Compare branch `phase2a-integration` with the branch configured in BOTH Render services before merging/deploying. The local and remote main baseline checked during integration was `137747914daa2de1a9c4652f08a81a2a3820fea8`.
5. Complete `docs/deployment-confirmation.md` after testing the actual staged deployment. Render URLs/commit, Atlas staging isolation and production delivery remain external confirmations.

Client specifications and acceptance checklist are in `docs/phase2a/`; original Phase 1 documents remain in `docs/specifications/`. Earlier Phase 1 reports describe historical behavior; import and enquiry flows have intentional Phase 2A replacements documented in the current notes.

The deliverable ZIP includes a manifest recording the exact local integration commit, file hashes and exclusions. It is not evidence that Render is using that commit. No real `.env`, credentials, `.git`, dependencies, build outputs, logs or database files are included.

Install dependencies with `npm ci` in each application. `npm run verify:phase2a:local` from `backend/` runs the production build and isolated Phase 1/Phase 2A API/browser tests. It requires MongoDB and Playwright Chromium. Rebuild the frontend with the intended API URLs before running normally or deploying.

Phase 2B remains deferred until Phase 2A staging acceptance and deployed revision confirmation.
