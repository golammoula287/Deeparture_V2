# Phase 3 Rev 1.0 — Known Boundaries

These are intentional architectural boundaries, not hidden failures.

1. **Binary image storage provider** — The implementation manages MediaAsset URLs and existing gallery migration. It does not store uploaded image binaries on Render local disk. A persistent media-storage adapter should be configured separately if direct file upload is required.
2. **External supplier APIs** — Real booking-system/API connectors remain Phase 5. Operator writes already use the shared services those connectors will call later.
3. **Customer faceted UI** — Customer-facing filter controls remain Phase 4. Phase 3 does not duplicate the shared Search Service.
4. **Agent commercial layer** — Agent/B2B pricing remains Phase 6.
