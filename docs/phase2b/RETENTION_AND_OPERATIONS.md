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

## Source monitoring

Source configuration tracks operational health metadata such as last attempt, last successful sync and last error. Actual external connector/scheduled-sync implementation is Phase 5.
