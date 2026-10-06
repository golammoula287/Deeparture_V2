# Deployment confirmation — to be completed by deployment owner

Phase 2A update, 6 October 2026: local integration is on `phase2a-integration`; use the delivered ZIP's `PACKAGE_MANIFEST.json` or `git rev-parse HEAD` for the exact integration commit. Local verification passed (14 unit tests, 34 Phase 1 groups, 27 Phase 2A groups, production build). These results do not confirm Render deployment. See `phase2a/LOCAL_ACCEPTANCE.md`.

This template collects the remaining client handover confirmations. Blank entries are pending, not passes. Do not include passwords, JWT values, API keys or credential-bearing connection strings.

| Confirmation | Value / evidence |
| --- | --- |
| Private repository name/link | Pending |
| Render-deployed branch | Pending |
| Render-deployed full commit hash | Pending |
| Frontend staging URL | Pending |
| Backend/API staging URL | Pending |
| Exact Atlas staging database name (name only) | Pending |
| Dedicated V2 staging database; separate from V1 production | Pending owner confirmation |
| Deployment includes the latest login/logout fixes | Pending |
| Export matches deployed code, including local changes | Pending; current package contains uncommitted working-tree changes |
| Production email service and delivery method | Pending decision |
| Delivery-supporting hosting configuration | Pending confirmation |
| Controlled customer/operator/admin delivery retest before launch | Pending result and date |
| Email test plan agreed by | Pending |
| Accepted as PASS WITH ISSUES by / date | Pending |
| Phase 2A deployed-code audit authorised by / date | Pending |

Suggested confirmation text, to use only once verified:

> The deployed branch is [branch], at commit [full hash]. This revision matches the supplied code export. The V2 staging application uses the dedicated Atlas database [database name], separate from V1 production. Frontend: [URL]. Backend: [URL]. Production email will use [service/method] and delivery will be retested before launch by [owner/date]. Remaining issues: [list].

Local snapshot base: `main` / `137747914daa2de1a9c4652f08a81a2a3820fea8`. Commit the reviewed local fixes and verify the resulting deployment before filling in a matching deployed revision.
