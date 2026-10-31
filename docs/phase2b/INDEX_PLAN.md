# Phase 2B Rev 1.3 - Index Plan

Indexes should support measured access patterns. Do not add broad indexes without a query/use-case.

## Notification

Purpose: recipient/audience notification center and unread count.

Expected patterns:

- recipient user + read state + newest first
- recipient organisation/audience + newest first
- operation ID lookup for traceability

## Audit

Purpose: Admin audit/activity history.

Expected patterns:

- entity type + entity ID + newest first
- organisation + newest first
- actor + newest first
- operation ID

## Import batches

Purpose: import history, error/retry investigation.

Expected patterns:

- status + createdAt
- source/adapter/product type + createdAt
- operation ID
- retry parent/batch identity

## External source mappings/configuration

Purpose: stable external ID -> Deeparture identity and source resolution.

Expected patterns:

- unique provider key + external entity type + external ID
- internal entity type + internal entity ID
- provider/source + organisation
- source status/last attempt where used operationally

## Availability

Purpose: resolve source snapshots and serve Admin/public effective availability.

Expected patterns:

- inventory key (unique/effective identity)
- inventory key + source/source config + sourceUpdatedAt
- freshness state + resolvedAt
- conflict/manual override state + resolvedAt
- organisation/product type + resolvedAt
- availability history inventory key + createdAt
- active overrides inventory key + expiry/clear state

## Search/catalogue

Purpose: shared Admin/public filtering.

Expected patterns include existing canonical location/publication/search indexes plus Phase 2B operational indexes such as:

- listing status + completeness score + updatedAt
- organisation + updatedAt
- typed product attributes: product model + definition + value

MongoDB explain/query profiling should be used later if real data shows a materially different access pattern. Phase 2B does not introduce a dedicated search engine.
