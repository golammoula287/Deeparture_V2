# Phase 2B Rev 1.3 - Migrations, Backfill & Rollback

## Migration strategy

Phase 2B is designed as an **additive, backward-compatible extension** of Phase 2A wherever practical. No destructive migration is required by this implementation.

New collections/models can be introduced without rewriting existing Phase 2A records. Existing catalogue/inventory fields remain readable while Phase 2B normalized operational records are populated progressively.

## New persistent models

Phase 2B adds persistent models for:

- availability source snapshots
- effective/resolved availability
- availability manual overrides
- availability history
- claim invitation history
- domain events
- duplicate-resolution decisions
- external source mappings
- in-app notifications
- source configurations
- verification history
- website-source review queue

## Existing model extensions

Existing Phase 2A models receive additive fields/indexes for items such as:

- import source/adapter/schema version, operation ID, retry metadata and outcomes
- richer audit context/operation IDs
- listing completeness / verification / source-related metadata
- resolved availability metadata mirrored to existing public/search inventory structures
- external/source and search indexes

## Backfill

No mandatory destructive backfill is required before the application can start.

Recommended staged backfill/maintenance actions:

1. Refresh completeness scores for existing vessels and resorts through the shared completeness service/Admin endpoint.
2. Re-resolve availability records as they are touched/imported or through bounded Admin maintenance.
3. Configure provider/source records only for sources that are actually used.
4. Add verification records progressively; do not infer historical verification that did not occur.

## Index deployment

Index creation should be verified in staging before production. See `INDEX_PLAN.md`.

For a large future production dataset, create potentially expensive indexes deliberately during a controlled maintenance/deployment window rather than relying on unobserved automatic index creation.

## Rollback approach

Because the changes are additive, code rollback to the accepted Phase 2A commit is the primary recovery path.

If Phase 2B is rolled back:

- leave new Phase 2B collections in place unless there is a documented reason to remove them
- do not delete audit/history records as part of ordinary rollback
- existing Phase 2A catalogue, pricing, organisation, claim and enquiry records remain authoritative
- availability mirror fields retained on Phase 2A models remain compatible with earlier readers where possible

If a Phase 2B write has materially changed an existing catalogue record, use the audit/history trail to review/reverse the individual business change rather than dropping data wholesale.

## Safety rules

- Never run destructive migration commands against V1 production.
- Confirm the database/environment name before any migration/index operation.
- Back up/snapshot production before future destructive migrations.
- Do not store secrets, raw claim tokens or credentials in migration logs.
- Record migration command/version, operator, timestamp and deployed commit for production changes.
