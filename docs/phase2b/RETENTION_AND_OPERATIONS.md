# Phase 2B Rev 1.3 - Retention & Operations

Phase 2B records are tagged/designed so later archival or retention policies can be introduced without deleting core catalogue/inventory state.

## Long-lived business/audit records

Prefer long retention for:

- audit logs for material business actions
- verification records
- claim history
- duplicate-resolution decisions
- material availability override/history records

Exact legal/business retention periods are not defined by Phase 2B and should be set by the business before production purge automation is introduced.

## Operational/transient records

Potential future candidates for shorter retention/archival include:

- read informational notifications
- routine technical source attempt/event records
- generated import error/export artifacts
- high-volume technical domain events once no longer operationally useful

Do not implement automatic deletion in Phase 2B without an explicit approved retention policy.

## Operation/correlation IDs

Multi-step operations such as imports and bulk actions expose an operation ID. Use the same ID when investigating:

- API response
- audit entry
- notification/event
- import/bulk history
- server log/error report

Operation IDs are identifiers, not credentials, and must not contain secrets.

## Availability maintenance

Phase 2B intentionally provides bounded Admin-triggered freshness/override maintenance without requiring Phase 5 scheduler infrastructure.

Stale means the source value is old relative to its configured freshness threshold. It does **not** mean sold out.

Manual override expiry restores normal source resolution. Overrides should have a reason and may have an expiry.

### Rev 1.3 review correction — provider precedence and disabled sources

Provider lookup uses this order, within the requested source type:

1. Exact provider at organisation scope.
2. Exact provider at global scope.
3. Explicit generic default at organisation scope.
4. Explicit generic default at global scope.

A generic default has `providerKey` equal to the normalized source type, such as `api`. Another named provider is never a generic default. The first matching configuration wins even when disabled. An organisation provider override may explicitly enable a globally disabled provider. Unconfigured sources retain the existing default behavior; absence of a configuration does not borrow another provider's settings.

Both snapshot ingestion and resolution apply this policy. Resolution re-evaluates current provider identity rather than trusting a historical `sourceConfig` association, so previously misbound snapshots and later organisation overrides use the current policy without rewriting reported source values.

Disabled configurations exclude their snapshots from resolution. If normalized snapshots exist but all are disabled, effective inventory becomes `status=unknown`, `sourceType=none`, `freshnessState=unknown`, with no available quantity or old source reference/timestamp. It does not become sold out. Active manual overrides still take precedence. A legacy mirror is retained only when no normalized snapshots exist and the mirror is not a manual override. The resolver copies availability fields only; MongoDB record IDs must never be copied between collections.

### Who runs maintenance and when

The staging administrator is responsible for running maintenance after a source configuration change, after deployment of these fixes, and when an override has expired or freshness needs reconciliation. Phase 2B does not supply an automatic scheduler: wall-clock expiry alone does not update stored public inventory.

Use the Admin availability maintenance control, or authenticated `POST /api/v2/admin/availability/refresh-state` with `{ "limit": 100, "minResolvedAgeMinutes": 1 }`. Each call processes at most 200 eligible records; check per-record results and repeat until the intended records have been processed. For immediate reconciliation of a specific identity, use its Admin re-resolution action. Ordinary public and Admin GET requests remain read-only. The timed expiry demonstration is recorded in `docs/phase2b-acceptance-results.json`.

## Source monitoring

Source configuration tracks operational health metadata such as last attempt, last successful sync and last error. Actual external connector/scheduled-sync implementation is Phase 5.
