const httpStatus = require('http-status');
const AppError = require('../../error/appError');
const Departure = require('../models/departure.model');
const CabinType = require('../models/cabinType.model');
const ResortAvailability = require('../models/resortAvailability.model');
const RoomType = require('../models/roomType.model');
const AvailabilitySnapshot = require('../models/availabilitySnapshot.model');
const AvailabilityOverride = require('../models/availabilityOverride.model');
const AvailabilityHistory = require('../models/availabilityHistory.model');
const AvailabilityEffective = require('../models/availabilityEffective.model');
const SourceConfig = require('../models/sourceConfig.model');
const { findSourceConfig, selectSourceConfig, normalizeProviderKey } = require('./source.service');
const { publishDomainEvent } = require('./domainEvent.service');
const { notifyAdminsInApp } = require('./notification.service');

const ALLOWED_STATUS = new Set(['unknown', 'available', 'limited', 'sold_out', 'on_request', 'stop_sell']);
const normalizeSource = (sourceType) => String(sourceType || 'operator').trim().toLowerCase();
const numeric = (value, label = 'Inventory quantity') => {
  if (value === undefined || value === null || value === '') return undefined;
  if (!Number.isInteger(Number(value)) || Number(value) < 0) throw new AppError(400, `${label}: inventory quantities must be non-negative integers`);
  return Number(value);
};
const cleanDate = (value) => {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) throw new AppError(400, 'A valid availability date is required');
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const normalizeAvailabilityInput = (input = {}, defaults = {}) => {
  const quantity = input.spacesAvailable ?? input.cabinsAvailable ?? input.roomsAvailable;
  const status = String(input.status || defaults.status || (quantity === 0 ? 'sold_out' : Number(quantity) > 0 ? 'available' : 'on_request')).toLowerCase();
  if (!ALLOWED_STATUS.has(status)) throw new AppError(httpStatus.BAD_REQUEST, `Unsupported availability status: ${status}`);
  const totalSpaces = numeric(input.totalSpaces, 'totalSpaces');
  const spacesAvailable = numeric(input.spacesAvailable, 'spacesAvailable');
  const totalCabins = numeric(input.totalCabins, 'totalCabins');
  const cabinsAvailable = numeric(input.cabinsAvailable, 'cabinsAvailable');
  const roomsAvailable = numeric(input.roomsAvailable, 'roomsAvailable');
  if (spacesAvailable !== undefined && totalSpaces !== undefined && spacesAvailable > totalSpaces) throw new AppError(400, 'Available inventory cannot exceed total inventory');
  if (cabinsAvailable !== undefined && totalCabins !== undefined && cabinsAvailable > totalCabins) throw new AppError(400, 'Available inventory cannot exceed total inventory');
  if (input.sourceUpdatedAt && !Number.isFinite(new Date(input.sourceUpdatedAt).getTime())) throw new AppError(400, 'Invalid source timestamp');
  return {
    cabinType: input.cabinType || defaults.cabinType,
    totalCabins, cabinsAvailable, totalSpaces, spacesAvailable, roomsAvailable,
    status,
    updatedAt: new Date(),
    sourceType: normalizeSource(input.sourceType || defaults.sourceType),
    sourceReference: input.sourceReference || defaults.sourceReference,
    providerName: input.providerName || defaults.providerName,
    sourceUpdatedAt: input.sourceUpdatedAt ? new Date(input.sourceUpdatedAt) : (defaults.sourceUpdatedAt ? new Date(defaults.sourceUpdatedAt) : new Date()),
    receivedAt: new Date(),
  };
};

const departureInventoryKey = (departureId, cabinType) => `departure:${departureId}:cabin:${cabinType || 'overall'}`;
const resortInventoryKey = (roomTypeId, date) => `resort-room:${roomTypeId}:date:${cleanDate(date).toISOString().slice(0, 10)}`;
const sourceKeyFor = ({ sourceType, providerName, sourceReference }) => `${normalizeSource(sourceType)}:${normalizeProviderKey(providerName || sourceReference || sourceType) || 'default'}`;

const freshnessFor = (snapshot, config, now = Date.now()) => {
  if (!snapshot?.sourceUpdatedAt) return 'unknown';
  const threshold = Math.max(1, Number(config?.freshnessThresholdMinutes || 1440)) * 60 * 1000;
  const age = Math.max(0, now - new Date(snapshot.sourceUpdatedAt).getTime());
  if (age <= threshold) return 'fresh';
  if (age <= threshold * 2) return 'aging';
  return 'stale';
};

const valueSignature = (value) => JSON.stringify([
  value?.status, value?.totalCabins, value?.cabinsAvailable, value?.totalSpaces,
  value?.spacesAvailable, value?.roomsAvailable,
]);

const effectiveSignature = (value) => JSON.stringify([
  valueSignature(value), Boolean(value?.manualOverride), value?.sourceType, value?.sourceReference,
  value?.freshnessState, Boolean(value?.conflictState), value?.overrideExpiresAt ? new Date(value.overrideExpiresAt).toISOString() : null,
]);

const validateCabin = async ({ organisationId, vesselId, cabinType }) => {
  if (!cabinType) return;
  const exists = await CabinType.exists({ _id: cabinType, organisation: organisationId, vessel: vesselId });
  if (!exists) throw new AppError(httpStatus.BAD_REQUEST, 'Cabin type does not belong to this vessel/organisation');
};

const configsFor = async (snapshots, organisationId) => {
  // Re-evaluate provider identity even for snapshots linked by older buggy lookups.
  // Fetch once for all snapshots; avoid a per-snapshot query.
  const sourceTypes = [...new Set(snapshots.map(s => s.sourceType))];
  const configs = sourceTypes.length ? await SourceConfig.find({
    sourceType: { $in: sourceTypes },
    $or: [{ organisation: organisationId }, { organisation: null }],
  }).lean() : [];
  return snapshot => selectSourceConfig(configs, { ...snapshot, organisationId });
};

const currentMirror = async ({ productType, departureId, cabinType, roomTypeId, date }) => {
  if (productType === 'vessel') {
    const dep = await Departure.findById(departureId).lean();
    const key = cabinType ? String(cabinType) : 'overall';
    const item = (dep?.availability || []).find(a => (a.cabinType ? String(a.cabinType) : 'overall') === key);
    return item || null;
  }
  return ResortAvailability.findOne({ roomType: roomTypeId, date: cleanDate(date) }).lean();
};

const persistenceUpdate = (values) => {
  const $set = {};
  const $unset = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) $unset[key] = 1;
    else $set[key] = value;
  }
  return { $set, ...(Object.keys($unset).length ? { $unset } : {}) };
};

const writeMirror = async (identity, effective) => {
  if (identity.productType === 'vessel') {
    const dep = await Departure.findById(identity.departureId);
    if (!dep) throw new AppError(404, 'Departure not found while resolving availability');
    const key = identity.cabinType ? String(identity.cabinType) : 'overall';
    const index = (dep.availability || []).findIndex(a => (a.cabinType ? String(a.cabinType) : 'overall') === key);
    const value = {
      cabinType: identity.cabinType || undefined,
      totalCabins: effective.totalCabins,
      cabinsAvailable: effective.cabinsAvailable,
      totalSpaces: effective.totalSpaces,
      spacesAvailable: effective.spacesAvailable,
      status: effective.status,
      sourceType: effective.sourceType,
      sourceReference: effective.sourceReference,
      sourceUpdatedAt: effective.sourceUpdatedAt,
      receivedAt: effective.receivedAt,
      updatedAt: new Date(),
      freshnessState: effective.freshnessState,
      conflictState: effective.conflictState,
      manualOverride: effective.manualOverride,
      overrideExpiresAt: effective.overrideExpiresAt,
      effectiveSourceName: effective.effectiveSourceName,
      resolvedAt: new Date(),
    };
    if (index >= 0) Object.assign(dep.availability[index], value);
    else dep.availability.push(value);
    dep.availabilityUpdatedAt = new Date();
    dep.sourceUpdatedAt = effective.sourceUpdatedAt || new Date();
    await dep.save();
    return dep;
  }
  const day = cleanDate(identity.date);
  return ResortAvailability.findOneAndUpdate(
    { roomType: identity.roomTypeId, date: day },
    persistenceUpdate({
      organisation: identity.organisationId,
      resort: identity.resortId,
      roomType: identity.roomTypeId,
      date: day,
      roomsAvailable: effective.roomsAvailable,
      status: effective.status,
      source: effective.sourceType,
      sourceReference: effective.sourceReference,
      sourceUpdatedAt: effective.sourceUpdatedAt,
      receivedAt: effective.receivedAt,
      freshnessState: effective.freshnessState,
      conflictState: effective.conflictState,
      manualOverride: effective.manualOverride,
      overrideExpiresAt: effective.overrideExpiresAt,
      effectiveSourceName: effective.effectiveSourceName,
      resolvedAt: new Date(),
    }),
    { new: true, upsert: true, runValidators: true }
  );
};

const resolveAvailability = async (identity, { actorUserId, operationId, reason } = {}) => {
  const now = new Date();

  // Record expiries once before resolving. Expiry is intentionally different from a manual clear:
  // the source-derived value becomes effective again without rewriting source snapshots.
  const expired = await AvailabilityOverride.find({
    inventoryKey: identity.inventoryKey,
    clearedAt: { $exists: false },
    expiredAt: { $exists: false },
    expiresAt: { $lte: now },
  });
  for (const item of expired) {
    item.expiredAt = now;
    await item.save();
    await AvailabilityHistory.create({
      inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId,
      eventType: 'override_expired', effective: item.toObject(), reason: 'override_expired', actorUser: actorUserId, operationId,
    });
  }

  const override = await AvailabilityOverride.findOne({
    inventoryKey: identity.inventoryKey,
    clearedAt: { $exists: false },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  }).sort({ createdAt: -1 }).lean();

  const previous = await currentMirror(identity);
  let effective;
  let competing = [];
  if (override) {
    effective = {
      status: override.status,
      totalCabins: override.totalCabins, cabinsAvailable: override.cabinsAvailable,
      totalSpaces: override.totalSpaces, spacesAvailable: override.spacesAvailable,
      roomsAvailable: override.roomsAvailable,
      sourceType: 'admin_manual_override', sourceReference: String(override._id),
      sourceUpdatedAt: override.createdAt, receivedAt: override.createdAt,
      freshnessState: 'fresh', conflictState: false, manualOverride: true,
      overrideExpiresAt: override.expiresAt,
      effectiveSourceName: 'Admin manual override', resolvedAt: now,
    };
  } else {
    const snapshots = await AvailabilitySnapshot.find({ inventoryKey: identity.inventoryKey }).sort({ sourceUpdatedAt: -1 }).lean();
    const configFor = await configsFor(snapshots, identity.organisationId);
    competing = snapshots.map(snapshot => {
      const config = configFor(snapshot);
      return { ...snapshot, config, priority: Number(config?.priority ?? 100), freshnessState: freshnessFor(snapshot, config), enabled: config?.enabled !== false };
    }).filter(x => x.enabled);
    const current = competing.filter(x => ['fresh','aging'].includes(x.freshnessState));
    const pool = current.length ? current : competing;
    pool.sort((a,b) => a.priority - b.priority || new Date(b.sourceUpdatedAt || 0) - new Date(a.sourceUpdatedAt || 0));
    const chosen = pool[0];
    if (!chosen) {
      // Never let an expired/cleared manual override become an anonymous source value.
      // A legacy/source-backed mirror may be retained when no normalized snapshot exists yet,
      // but an override-only mirror must fall back to unknown.
      const reusablePrevious = snapshots.length === 0 && previous && (previous.sourceType || previous.source) !== 'admin_manual_override' && !previous.manualOverride;
      effective = reusablePrevious ? {
        status: previous.status,
        totalCabins: previous.totalCabins, cabinsAvailable: previous.cabinsAvailable,
        totalSpaces: previous.totalSpaces, spacesAvailable: previous.spacesAvailable,
        roomsAvailable: previous.roomsAvailable,
        sourceType: previous.sourceType || previous.source,
        sourceReference: previous.sourceReference, sourceUpdatedAt: previous.sourceUpdatedAt,
        receivedAt: previous.receivedAt, effectiveSourceName: previous.effectiveSourceName,
        freshnessState: previous.freshnessState || 'unknown', conflictState: false,
        manualOverride: false, overrideExpiresAt: undefined, resolvedAt: now,
      } : {
        status: 'unknown', totalCabins: undefined, cabinsAvailable: undefined, totalSpaces: undefined, spacesAvailable: undefined, roomsAvailable: undefined, sourceType: 'none', sourceReference: undefined, sourceUpdatedAt: undefined, receivedAt: now,
        freshnessState: 'unknown', conflictState: false, manualOverride: false, overrideExpiresAt: undefined, effectiveSourceName: 'No source', resolvedAt: now,
      };
    } else {
      const compare = pool.filter(x => x.freshnessState !== 'stale');
      const variants = new Set((compare.length ? compare : pool).map(valueSignature));
      effective = {
        status: chosen.status,
        totalCabins: chosen.totalCabins, cabinsAvailable: chosen.cabinsAvailable,
        totalSpaces: chosen.totalSpaces, spacesAvailable: chosen.spacesAvailable,
        roomsAvailable: chosen.roomsAvailable,
        sourceType: chosen.sourceType, sourceReference: chosen.sourceReference,
        sourceUpdatedAt: chosen.sourceUpdatedAt, receivedAt: chosen.receivedAt,
        freshnessState: chosen.freshnessState,
        conflictState: variants.size > 1,
        manualOverride: false,
        overrideExpiresAt: undefined,
        effectiveSourceName: chosen.config?.providerName || chosen.providerName || chosen.sourceReference || chosen.sourceType,
        resolvedAt: now,
      };
    }
  }

  const changed = effectiveSignature(previous) !== effectiveSignature(effective);
  if (changed) await writeMirror(identity, effective);
  await AvailabilityEffective.findOneAndUpdate(
    { inventoryKey: identity.inventoryKey },
    persistenceUpdate({
      inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId,
      vessel: identity.vesselId, departure: identity.departureId, cabinType: identity.cabinType,
      resort: identity.resortId, roomType: identity.roomTypeId, date: identity.date,
      ...effective, operationId,
    }),
    { new: true, upsert: true, runValidators: true }
  );
  if (changed) {
    await AvailabilityHistory.create({ inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId, eventType: 'effective_changed', effective, reason, actorUser: actorUserId, operationId });
    await publishDomainEvent({ name: 'availability.updated', aggregateType: identity.productType === 'vessel' ? 'departure' : 'roomAvailability', aggregateId: identity.departureId || identity.roomTypeId, organisation: identity.organisationId, actorUser: actorUserId, operationId, payload: { inventoryKey: identity.inventoryKey, effective }, retentionClass: 'business' });
  }
  if (effective.conflictState && !previous?.conflictState) {
    await AvailabilityHistory.create({ inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId, eventType: 'conflict_detected', effective, reason: 'Competing current sources disagree', actorUser: actorUserId, operationId });
    await publishDomainEvent({ name: 'availability.conflict_detected', aggregateType: identity.productType, aggregateId: identity.departureId || identity.roomTypeId, organisation: identity.organisationId, actorUser: actorUserId, operationId, payload: { inventoryKey: identity.inventoryKey }, retentionClass: 'operational' });
    await notifyAdminsInApp({ type: 'availability.conflict', title: 'Availability source conflict', message: `Competing sources disagree for ${identity.inventoryKey}.`, relatedRecordType: 'availability', actionTarget: `/admin/v2/availability?conflict=true`, operationId, metadata: { inventoryKey: identity.inventoryKey, organisationId: String(identity.organisationId) } });
  }
  if (effective.freshnessState === 'stale' && previous?.freshnessState !== 'stale') {
    await publishDomainEvent({ name: 'availability.stale', aggregateType: identity.productType, aggregateId: identity.departureId || identity.roomTypeId, organisation: identity.organisationId, actorUser: actorUserId, operationId, payload: { inventoryKey: identity.inventoryKey, sourceUpdatedAt: effective.sourceUpdatedAt }, retentionClass: 'operational' });
    await notifyAdminsInApp({ type: 'availability.stale', title: 'Stale availability', message: `Availability has become stale for ${identity.inventoryKey}.`, relatedRecordType: 'availability', actionTarget: `/admin/v2/availability?freshnessState=stale`, operationId, metadata: { inventoryKey: identity.inventoryKey, organisationId: String(identity.organisationId) } });
  }
  return { effective, competing, override };
};

const writeSnapshot = async (identity, item, { actorUserId, operationId } = {}) => {
  const sourceConfig = await findSourceConfig({ organisationId: identity.organisationId, sourceType: item.sourceType, providerName: item.providerName, sourceReference: item.sourceReference });
  const sourceKey = sourceKeyFor(item);
  const attemptedAt = new Date();
  if (sourceConfig?._id) await SourceConfig.updateOne({ _id: sourceConfig._id }, { $set: { lastAttemptAt: attemptedAt } });
  const existing = await AvailabilitySnapshot.findOne({ inventoryKey: identity.inventoryKey, sourceKey });
  if (existing?.sourceUpdatedAt && item.sourceUpdatedAt && new Date(item.sourceUpdatedAt) < new Date(existing.sourceUpdatedAt)) {
    if (sourceConfig?._id && sourceConfig.enabled !== false) await SourceConfig.updateOne({ _id: sourceConfig._id }, { $set: { status: 'warning', lastError: 'Rejected older availability update', lastAttemptAt: attemptedAt } });
    throw new AppError(409, 'Older source update rejected to prevent lost availability data', { code: 'stale_source_update', details: { currentSourceUpdatedAt: existing.sourceUpdatedAt, receivedSourceUpdatedAt: item.sourceUpdatedAt } });
  }
  const snapshot = await AvailabilitySnapshot.findOneAndUpdate(
    { inventoryKey: identity.inventoryKey, sourceKey },
    {
      inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId,
      vessel: identity.vesselId, departure: identity.departureId, cabinType: identity.cabinType,
      resort: identity.resortId, roomType: identity.roomTypeId, date: identity.date ? cleanDate(identity.date) : undefined,
      status: item.status, totalCabins: item.totalCabins, cabinsAvailable: item.cabinsAvailable,
      totalSpaces: item.totalSpaces, spacesAvailable: item.spacesAvailable, roomsAvailable: item.roomsAvailable,
      sourceType: item.sourceType, sourceReference: item.sourceReference, sourceKey, providerName: item.providerName,
      sourceConfig: sourceConfig?._id, sourceUpdatedAt: item.sourceUpdatedAt, receivedAt: new Date(), operationId,
    },
    { new: true, upsert: true, runValidators: true }
  );
  await AvailabilityHistory.create({ inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId, eventType: 'source_reported', sourceType: item.sourceType, sourceReference: item.sourceReference, reported: snapshot.toObject(), actorUser: actorUserId, operationId });
  if (sourceConfig?._id && sourceConfig.enabled !== false) await SourceConfig.updateOne({ _id: sourceConfig._id }, { $set: { status: 'healthy', lastSuccessfulSyncAt: new Date(), lastAttemptAt: attemptedAt, lastError: null } });
  return snapshot;
};

const replaceDepartureAvailability = async ({ organisationId, departureId, updates = [], sourceType = 'operator', sourceReference, providerName, sourceUpdatedAt, actorUserId, operationId }) => {
  const departure = await Departure.findOne({ _id: departureId, organisation: organisationId });
  if (!departure) throw new AppError(httpStatus.NOT_FOUND, 'Departure not found for this organisation');
  const results = [];
  for (const update of updates) {
    const item = normalizeAvailabilityInput(update, { sourceType, sourceReference, providerName, sourceUpdatedAt });
    if (item.status === 'stop_sell') throw new AppError(httpStatus.BAD_REQUEST, 'stop_sell is a resort availability status, not a liveaboard departure status');
    await validateCabin({ organisationId, vesselId: departure.vessel, cabinType: item.cabinType });
    const identity = { productType: 'vessel', organisationId, vesselId: departure.vessel, departureId: departure._id, cabinType: item.cabinType, inventoryKey: departureInventoryKey(departure._id, item.cabinType) };
    await writeSnapshot(identity, item, { actorUserId, operationId });
    results.push(await resolveAvailability(identity, { actorUserId, operationId, reason: 'source_update' }));
  }
  return Departure.findById(departure._id);
};

const upsertDepartureAvailability = async ({ organisationId, departureId, update, sourceType = 'operator', sourceReference, providerName, sourceUpdatedAt, actorUserId, operationId }) => replaceDepartureAvailability({ organisationId, departureId, updates: [update], sourceType, sourceReference, providerName, sourceUpdatedAt, actorUserId, operationId });

const upsertResortAvailability = async ({ organisationId, roomTypeId, date, roomsAvailable, status, sourceType = 'operator', sourceReference, providerName, sourceUpdatedAt, actorUserId, operationId }) => {
  const room = await RoomType.findOne({ _id: roomTypeId, organisation: organisationId });
  if (!room) throw new AppError(httpStatus.NOT_FOUND, 'Room type not found for this organisation');
  const day = cleanDate(date);
  const item = normalizeAvailabilityInput({ roomsAvailable, status, sourceType, sourceReference, providerName, sourceUpdatedAt });
  const identity = { productType: 'resort', organisationId, resortId: room.resort, roomTypeId: room._id, date: day, inventoryKey: resortInventoryKey(room._id, day) };
  await writeSnapshot(identity, item, { actorUserId, operationId });
  await resolveAvailability(identity, { actorUserId, operationId, reason: 'source_update' });
  return ResortAvailability.findOne({ roomType: room._id, date: day });
};

const applyManualOverride = async ({ identity, values, reason, expiresAt, actorUserId, operationId }) => {
  if (!reason) throw new AppError(400, 'Override reason is required');
  if (!actorUserId) throw new AppError(400, 'Override actor is required');
  // Force the override source identity; do not allow a caller-supplied sourceType to
  // disguise a manual Admin override as provider/operator data.
  const normalized = normalizeAvailabilityInput({ ...values, sourceType: 'admin_manual_override', sourceReference: undefined, providerName: undefined });
  if (expiresAt && !Number.isFinite(new Date(expiresAt).getTime())) throw new AppError(400, 'Invalid override expiry');
  if (expiresAt && new Date(expiresAt) <= new Date()) throw new AppError(400, 'Override expiry must be in the future');

  // Only one manual override may control an inventory identity at a time. Supersede any
  // currently-active override explicitly so an older override cannot reappear later.
  const activeOverrides = await AvailabilityOverride.find({
    inventoryKey: identity.inventoryKey,
    clearedAt: { $exists: false },
    expiredAt: { $exists: false },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  for (const active of activeOverrides) {
    active.clearedAt = new Date();
    active.clearedBy = actorUserId;
    active.clearReason = 'superseded';
    await active.save();
    await AvailabilityHistory.create({ inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId, eventType: 'override_cleared', effective: active.toObject(), reason: 'superseded', actorUser: actorUserId, operationId });
  }

  const override = await AvailabilityOverride.create({
    inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId,
    status: normalized.status, totalCabins: normalized.totalCabins, cabinsAvailable: normalized.cabinsAvailable,
    totalSpaces: normalized.totalSpaces, spacesAvailable: normalized.spacesAvailable, roomsAvailable: normalized.roomsAvailable,
    reason, createdBy: actorUserId, expiresAt: expiresAt ? new Date(expiresAt) : undefined, operationId,
  });
  await AvailabilityHistory.create({ inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId, eventType: 'override_set', effective: override.toObject(), reason, actorUser: actorUserId, operationId });
  const resolved = await resolveAvailability(identity, { actorUserId, operationId, reason: 'manual_override_set' });
  return { override, ...resolved };
};

const clearManualOverride = async ({ identity, overrideId, actorUserId, operationId }) => {
  const override = await AvailabilityOverride.findOne({ _id: overrideId, inventoryKey: identity.inventoryKey, clearedAt: { $exists: false } });
  if (!override) throw new AppError(404, 'Active availability override not found');
  override.clearedAt = new Date();
  override.clearedBy = actorUserId;
  await override.save();
  await AvailabilityHistory.create({ inventoryKey: identity.inventoryKey, productType: identity.productType, organisation: identity.organisationId, eventType: 'override_cleared', effective: override.toObject(), reason: 'manual_clear', actorUser: actorUserId, operationId });
  return resolveAvailability(identity, { actorUserId, operationId, reason: 'manual_override_cleared' });
};

const identityFromInput = async (input) => {
  if (input.productType === 'vessel') {
    const departure = await Departure.findById(input.departureId).lean();
    if (!departure) throw new AppError(404, 'Departure not found');
    if (input.organisationId && String(departure.organisation) !== String(input.organisationId)) throw new AppError(403, 'Departure does not belong to this organisation');
    if (input.cabinType) await validateCabin({ organisationId: departure.organisation, vesselId: departure.vessel, cabinType: input.cabinType });
    return { productType: 'vessel', organisationId: departure.organisation, vesselId: departure.vessel, departureId: departure._id, cabinType: input.cabinType, inventoryKey: departureInventoryKey(departure._id, input.cabinType) };
  }
  if (input.productType === 'resort') {
    const room = await RoomType.findById(input.roomTypeId).lean();
    if (!room) throw new AppError(404, 'Room type not found');
    if (input.organisationId && String(room.organisation) !== String(input.organisationId)) throw new AppError(403, 'Room type does not belong to this organisation');
    const day = cleanDate(input.date);
    return { productType: 'resort', organisationId: room.organisation, resortId: room.resort, roomTypeId: room._id, date: day, inventoryKey: resortInventoryKey(room._id, day) };
  }
  throw new AppError(400, 'productType must be vessel or resort');
};

const refreshAvailabilityStates = async ({ limit = 50, minResolvedAgeMinutes = 15, actorUserId, operationId } = {}) => {
  const cutoff = new Date(Date.now() - Math.max(1, Number(minResolvedAgeMinutes) || 15) * 60 * 1000);
  const candidates = await AvailabilityEffective.find({
    $or: [
      { resolvedAt: { $exists: false } },
      { resolvedAt: { $lte: cutoff } },
      { manualOverride: true, overrideExpiresAt: { $lte: new Date() } },
    ],
  }).sort({ resolvedAt: 1, _id: 1 }).limit(Math.min(200, Math.max(1, Number(limit) || 50))).lean();
  const results = [];
  for (const effective of candidates) {
    try {
      const identity = await identityFromInput(effective.productType === 'vessel'
        ? { productType: 'vessel', departureId: effective.departure, cabinType: effective.cabinType, organisationId: effective.organisation }
        : { productType: 'resort', roomTypeId: effective.roomType, date: effective.date, organisationId: effective.organisation });
      const resolved = await resolveAvailability(identity, { actorUserId, operationId, reason: 'freshness_maintenance' });
      results.push({ inventoryKey: effective.inventoryKey, success: true, freshnessState: resolved.effective.freshnessState, conflictState: resolved.effective.conflictState });
    } catch (error) {
      results.push({ inventoryKey: effective.inventoryKey, success: false, message: error.message });
    }
  }
  return results;
};

const identityFromEffective = async (effective) => identityFromInput(effective.productType === 'vessel'
  ? { productType: 'vessel', departureId: effective.departure, cabinType: effective.cabinType, organisationId: effective.organisation }
  : { productType: 'resort', roomTypeId: effective.roomType, date: effective.date, organisationId: effective.organisation });

const reconcileExpiredOverrides = async ({ limit = 50, actorUserId, operationId } = {}) => {
  const now = new Date();
  const expired = await AvailabilityOverride.find({
    clearedAt: { $exists: false },
    expiredAt: { $exists: false },
    expiresAt: { $lte: now },
  }).sort({ expiresAt: 1 }).limit(Math.min(200, Math.max(1, Number(limit) || 50))).lean();
  const results = [];
  for (const override of expired) {
    try {
      const effective = await AvailabilityEffective.findOne({ inventoryKey: override.inventoryKey }).lean();
      if (!effective) {
        await AvailabilityOverride.updateOne({ _id: override._id }, { $set: { expiredAt: now } });
        results.push({ inventoryKey: override.inventoryKey, success: true, resolved: false });
        continue;
      }
      const identity = await identityFromEffective(effective);
      await resolveAvailability(identity, { actorUserId, operationId, reason: 'override_expired' });
      results.push({ inventoryKey: override.inventoryKey, success: true, resolved: true });
    } catch (error) {
      results.push({ inventoryKey: override.inventoryKey, success: false, message: error.message });
    }
  }
  return results;
};

const effectiveDepartureAvailability = (departure) => ({ departureId: departure._id, availability: departure.availability || [], lastUpdatedAt: departure.availabilityUpdatedAt || departure.sourceUpdatedAt || departure.updatedAt });

module.exports = {
  normalizeAvailabilityInput, replaceDepartureAvailability, upsertDepartureAvailability, upsertResortAvailability,
  effectiveDepartureAvailability, resolveAvailability, applyManualOverride, clearManualOverride, identityFromInput,
  departureInventoryKey, resortInventoryKey, freshnessFor, sourceKeyFor, valueSignature, effectiveSignature, reconcileExpiredOverrides, refreshAvailabilityStates,
};
