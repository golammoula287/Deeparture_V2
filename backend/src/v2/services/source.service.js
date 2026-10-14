const ExternalSourceMapping = require('../models/externalSourceMapping.model');
const SourceConfig = require('../models/sourceConfig.model');
const AppError = require('../../error/appError');

const normalizeProviderKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const SENSITIVE_KEY = /password|secret|token|api.?key|private.?key|credential|authorization/i;
const assertNoSensitiveMetadata = (value, path = 'metadata') => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveMetadata(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) throw new AppError(400, `Secrets/credentials must not be stored in source metadata (${path}.${key})`);
    assertNoSensitiveMetadata(item, `${path}.${key}`);
  }
};
const sameId = (a, b) => String(a || '') === String(b || '');
const assertExpectedVersion = (record, expectedUpdatedAt, label) => {
  if (!record || !expectedUpdatedAt) return;
  const expected = new Date(expectedUpdatedAt).getTime();
  if (!Number.isFinite(expected) || expected !== new Date(record.updatedAt).getTime()) {
    throw new AppError(409, `${label} changed since it was loaded`, {
      code: 'conflict',
      details: { currentUpdatedAt: record.updatedAt, expectedUpdatedAt },
    });
  }
};

const upsertMapping = async (input) => {
  assertNoSensitiveMetadata(input.metadata || {});
  const providerKey = normalizeProviderKey(input.providerKey || input.providerName || input.sourceType);
  if (!providerKey || !input.internalEntityType || !input.internalEntityId || !input.externalEntityType || !input.externalId) {
    throw new AppError(400, 'provider, internal entity, external entity type and external ID are required');
  }
  const key = { providerKey, externalEntityType: input.externalEntityType, externalId: String(input.externalId) };
  const existing = await ExternalSourceMapping.findOne(key);
  assertExpectedVersion(existing, input.expectedUpdatedAt, 'Source mapping');
  if (existing && (!sameId(existing.internalEntityId, input.internalEntityId) || existing.internalEntityType !== input.internalEntityType) && input.allowReassign !== true) {
    throw new AppError(409, 'External source ID is already mapped to a different Deeparture entity', {
      code: 'conflict',
      details: {
        mappingId: existing._id,
        currentInternalEntityType: existing.internalEntityType,
        currentInternalEntityId: existing.internalEntityId,
      },
    });
  }
  const update = {
    providerKey,
    providerName: input.providerName,
    sourceType: input.sourceType,
    internalEntityType: input.internalEntityType,
    internalEntityId: input.internalEntityId,
    externalEntityType: input.externalEntityType,
    externalId: String(input.externalId),
    organisation: input.organisation || undefined,
    metadata: input.metadata || {},
    active: input.active !== false,
  };
  if (existing) {
    Object.assign(existing, update);
    await existing.save();
    return existing;
  }
  return ExternalSourceMapping.create(update);
};

const upsertSourceConfig = async (input) => {
  assertNoSensitiveMetadata(input.metadata || {});
  const providerKey = normalizeProviderKey(input.providerKey || input.providerName || input.sourceType);
  if (!providerKey || !input.providerName || !input.sourceType) throw new AppError(400, 'providerName and sourceType are required');
  const query = { providerKey, organisation: input.organisation || null };
  const existing = await SourceConfig.findOne(query);
  assertExpectedVersion(existing, input.expectedUpdatedAt, 'Source configuration');
  const update = {
    providerName: input.providerName,
    providerKey,
    sourceType: String(input.sourceType).trim().toLowerCase(),
    organisation: input.organisation || undefined,
    enabled: input.enabled !== false,
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 100,
    freshnessThresholdMinutes: Number.isFinite(Number(input.freshnessThresholdMinutes)) ? Number(input.freshnessThresholdMinutes) : 1440,
    status: input.enabled === false ? 'disabled' : (input.status || 'unconfigured'),
    metadata: input.metadata || {},
  };
  for (const key of ['lastSuccessfulSyncAt','lastAttemptAt','lastError']) if (input[key] !== undefined) update[key] = input[key];
  if (existing) {
    Object.assign(existing, update);
    await existing.save();
    return existing;
  }
  return SourceConfig.create(update);
};

const findSourceConfig = async ({ organisationId, sourceType, providerName, sourceReference }) => {
  const providerKey = normalizeProviderKey(providerName || sourceReference || sourceType);
  const exact = providerKey ? await SourceConfig.findOne({ providerKey, organisation: organisationId || null }).lean() : null;
  if (exact) return exact;
  const orgType = await SourceConfig.findOne({ organisation: organisationId || null, sourceType: String(sourceType || '').toLowerCase(), enabled: true }).sort({ priority: 1 }).lean();
  if (orgType) return orgType;
  return SourceConfig.findOne({ organisation: null, sourceType: String(sourceType || '').toLowerCase(), enabled: true }).sort({ priority: 1 }).lean();
};

module.exports = { normalizeProviderKey, upsertMapping, upsertSourceConfig, findSourceConfig, assertExpectedVersion, assertNoSensitiveMetadata };
