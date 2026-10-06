# Phase 2A local acceptance — 6 October 2026

**Implementation and local verification passed. Hosted staging acceptance remains pending.**

- [x] Backend syntax: 69 JavaScript files checked.
- [x] Unit/regression tests: 14 passed, zero failures.
- [x] Retained Phase 1 API/browser verification: 34 groups passed.
- [x] Phase 2A API/browser verification: 27 groups passed.
- [x] Next.js production build: passed with all Admin V2 routes.
- [x] Desktop (1440px), tablet (768px), phone (390px): admin routes, editors and previews fit the viewport; no browser runtime errors.
- [x] Only fresh temporary local MongoDB and test-mode email were used. Fixtures were removed and test services stopped.
- [ ] Render deployment, deployed acceptance checklist and exact deployed commit confirmation.
- [ ] Dedicated Atlas staging database identity/isolation confirmation.
- [ ] Production email provider/hosting plan and controlled delivery test before launch.

## Evidence by client checklist area

| Client area | Local evidence |
| --- | --- |
| Baseline/regression | Local and remote main baseline matched `137747914daa2de1a9c4652f08a81a2a3820fea8`; separate `phase2a-integration` branch. Retained auth, ownership, claims, pricing, imports and public browser flows pass. |
| Admin access/layout/dashboard | Guest redirects, operator API/UI denial, admin login and counts tested; navigation/pages checked at three viewport widths. |
| Catalogue/drafts/moderation | Create, preview, all five publication states, public exclusion of unpublished products, list filtering and pagination verified. Phone publish action produces a public database-backed page. |
| Import contracts/preview/commit | CSV and multi-sheet XLSX; no catalogue writes before confirm; draft defaults; matched organisation; classification, stable IDs, persisted outcomes, duplicate and concurrent commit rejection. |
| Organisations/claims | New account claims existing organisation, single-use hashed token, suspension/reactivation, shared product ownership and browser profile editing. Existing expiry/concurrent-claim tests remain in Phase 1 regression. |
| Attributes | Create/edit/activation, options/type/applicability/filter/public flags, inactive admin visibility; browser create/edit checked. |
| Canonical locations | Edit, alias/case matching, duplicate and cyclic-parent rejection, stable slug search and canonical product references; phone editor checked. |
| Admin-first enquiries | Receipt goes to admin/customer only; no operator email or dashboard access before approval; invalid transitions rejected; mail failures retain leads and permit retry; phone approval checked. |
| Availability | Manual/import service paths, partial cabin updates preserve other cabins, repeated stable identity, source/timestamps and negative-quantity rejection; resort import retained in regression. |
| Audit/email | Import, moderation and approval audit records asserted; no raw tested passwords/invitation tokens in logs; safe-mail unit tests and simulated delivery failure pass. |
| End-to-end | Preview -> commit -> draft -> publication -> public page; claiming; admin-first lead approval; inventory update and metadata. |

Machine-readable evidence: [Phase 1 regression](../phase1-test-results.json), [Phase 2A checks](../phase2a-test-results.json). Commands, intentional behavior replacements and known operational limits are in [implementation/deployment notes](IMPLEMENTATION_AND_DEPLOYMENT.md).

The original client acceptance checklist is preserved alongside this report. Its staging/Render boxes remain for the deployment owner to complete against the actual hosted commit. Local passes do not authorise a Phase 2B baseline labelled as deployed.
