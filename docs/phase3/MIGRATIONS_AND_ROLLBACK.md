# Phase 3 Rev 1.0 — Migrations & Rollback

## Schema changes

Phase 3 is additive.

### `MediaAssetV2`
Adds optional:
- `entityType`
- `entityId`
- `sortOrder`
- `featured`

Existing MediaAsset records remain valid.

### `ImportBatchV2`
Adds:
- `operator_inventory` batch kind
- optional `organisation`
- optional `importType`

Existing catalogue import batches remain valid.

### `OrganisationMemberInvitationV2`
New collection for operator team invitations.

## Existing media backfill

Dry run:

```bash
cd backend
npm run migrate:phase3:media
```

Apply only after reviewing the dry-run counts:

```bash
npm run migrate:phase3:media -- --apply
```

For a controlled staging check, restrict both commands to the same test organisation:

```bash
npm run migrate:phase3:media -- --organisation=<organisation-id>
npm run migrate:phase3:media -- --organisation=<organisation-id> --apply
```

Only products belonging to that organisation are scanned or changed. Omit the angle brackets and use its 24-character MongoDB ID. Malformed scope flags fail before connecting. A scoped fixture run does not represent migration of every organisation.

The API `/health` response reports `emailDeliveryMode` from the actual configured transport. Keep it `test` for staging acceptance; this diagnostic contains no SMTP credentials.

The migration converts existing vessel/resort `featuredImage` and `gallery` URLs into MediaAsset records while preserving the original fields. It is idempotent because it checks for an existing organisation/entity/url combination before creating a record.

## Rollback

Application rollback:

1. Redeploy the last accepted Phase 2B commit `01cb93ea3ce312ef0227099bd224094b2072ddb8`.
2. Existing Phase 2B code ignores the additive Phase 3 fields/collection.
3. Do not delete Phase 3 team-invitation or MediaAsset records during an emergency rollback unless a separate cleanup is explicitly approved.

Media backfill rollback is normally unnecessary because it is additive and the original `featuredImage/gallery` fields remain unchanged.
