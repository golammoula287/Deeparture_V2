// Real MongoDB regressions. Only permits an isolated loopback DB and test email transport.
process.env.EMAIL_DELIVERY_MODE = 'test';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const SourceConfig = require('../src/v2/models/sourceConfig.model');
const Snapshot = require('../src/v2/models/availabilitySnapshot.model');
const Effective = require('../src/v2/models/availabilityEffective.model');
const ResortAvailability = require('../src/v2/models/resortAvailability.model');
const Departure = require('../src/v2/models/departure.model');
const { findSourceConfig } = require('../src/v2/services/source.service');
const { resolveAvailability, resortInventoryKey, departureInventoryKey, applyManualOverride, clearManualOverride } = require('../src/v2/services/availability.service');

const results = [];
const pass = check => { results.push({ check, passed: true }); console.log(`PASS ${check}`); };
const id = () => new mongoose.Types.ObjectId();

(async () => {
  const uri = process.env.REVIEW_DATABASE_URL;
  assert.match(uri || '', /^mongodb:\/\/127\.0\.0\.1:\d+\/deeparture_review_[a-z0-9_]+$/);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const organisationId = id();
  const alpha = await SourceConfig.create({ providerName: 'Alpha', providerKey: 'alpha', sourceType: 'api', priority: 1 });
  const beta = await SourceConfig.create({ providerName: 'Beta', providerKey: 'beta', sourceType: 'api', priority: 50, enabled: false });
  const lookup = { organisationId, sourceType: 'api', providerName: 'Beta' };
  assert.equal(String((await findSourceConfig(lookup))._id), String(beta._id));
  pass('real MongoDB: disabled global Beta does not inherit Alpha');

  const identity = { productType: 'resort', organisationId, resortId: id(), roomTypeId: id(), date: new Date('2030-01-01') };
  identity.inventoryKey = resortInventoryKey(identity.roomTypeId, identity.date);
  const fixture = { inventoryKey: identity.inventoryKey, productType: 'resort', organisation: organisationId,
    resort: identity.resortId, roomType: identity.roomTypeId, date: identity.date, sourceType: 'api',
    sourceKey: 'api:beta', providerName: 'Beta', sourceReference: 'beta', sourceConfig: alpha._id,
    sourceUpdatedAt: new Date(), receivedAt: new Date(), status: 'available', roomsAvailable: 8 };
  // Deliberately reproduce a previously misbound snapshot.
  await Snapshot.create(fixture);
  await ResortAvailability.create({ organisation: organisationId, resort: identity.resortId, roomType: identity.roomTypeId,
    date: identity.date, status: 'available', roomsAvailable: 8, source: 'api', sourceReference: 'beta', sourceUpdatedAt: new Date() });
  await Effective.create({ ...fixture, roomsAvailable: 8 });
  let resolved = await resolveAvailability(identity);
  assert.equal(resolved.competing.length, 0);
  assert.equal(resolved.effective.status, 'unknown');
  for (const record of [await ResortAvailability.findOne({ roomType: identity.roomTypeId }).lean(), await Effective.findOne({ inventoryKey: identity.inventoryKey }).lean()]) {
    assert.equal(record.status, 'unknown');
    assert.equal(record.roomsAvailable, undefined);
    assert.equal(record.sourceReference, undefined);
    assert.equal(record.sourceUpdatedAt, undefined);
    assert.equal(record.freshnessState, 'unknown');
  }
  pass('real MongoDB: disabled sole source clears persisted room counts and provenance, including misbound snapshots');

  const local = await SourceConfig.create({ providerName: 'Beta', providerKey: 'beta', sourceType: 'api', organisation: organisationId, enabled: true, priority: 7 });
  assert.equal(String((await findSourceConfig(lookup))._id), String(local._id));
  resolved = await resolveAvailability(identity);
  assert.equal(resolved.effective.status, 'available');
  assert.equal(resolved.effective.roomsAvailable, 8);
  assert.equal(resolved.competing[0].priority, 7);
  pass('real MongoDB: new organisation override replaces historical snapshot configuration');

  await SourceConfig.updateOne({ _id: local._id }, { $set: { enabled: false } });
  await Snapshot.create({ ...fixture, sourceKey: 'api:alpha', providerName: 'Alpha', sourceReference: 'alpha', sourceConfig: alpha._id, roomsAvailable: 3 });
  resolved = await resolveAvailability(identity);
  assert.equal(resolved.competing.length, 1);
  assert.equal(resolved.effective.roomsAvailable, 3);
  assert.equal(resolved.effective.effectiveSourceName, 'Alpha');
  pass('real MongoDB: disabling one provider retains another enabled provider');

  await Snapshot.deleteMany({ inventoryKey: identity.inventoryKey });
  await ResortAvailability.updateOne({ roomType: identity.roomTypeId }, { $set: { status: 'available', roomsAvailable: 5, manualOverride: false, source: 'operator' } });
  resolved = await resolveAvailability(identity);
  assert.equal(resolved.effective.roomsAvailable, 5);
  assert.equal(resolved.effective.status, 'available');
  pass('real MongoDB: legacy inventory without normalized snapshots is preserved');

  const departure = await Departure.create({ organisation: organisationId, vessel: id(), itinerary: id(),
    startDate: new Date('2030-01-01'), endDate: new Date('2030-01-08'),
    availability: [{ status: 'available', spacesAvailable: 8, cabinsAvailable: 4, sourceType: 'api', sourceReference: 'beta' }] });
  const vesselIdentity = { productType: 'vessel', organisationId, vesselId: departure.vessel, departureId: departure._id,
    inventoryKey: departureInventoryKey(departure._id) };
  await Snapshot.create({ inventoryKey: vesselIdentity.inventoryKey, productType: 'vessel', organisation: organisationId,
    departure: departure._id, vessel: departure.vessel, sourceType: 'api', providerName: 'Beta', sourceKey: 'api:beta',
    sourceConfig: beta._id, sourceUpdatedAt: new Date(), status: 'available', spacesAvailable: 8, cabinsAvailable: 4 });
  resolved = await resolveAvailability(vesselIdentity);
  assert.equal(resolved.effective.status, 'unknown');
  let savedDeparture = await Departure.findById(departure._id).lean();
  assert.equal(savedDeparture.availability[0].spacesAvailable, undefined);
  assert.equal(savedDeparture.availability[0].cabinsAvailable, undefined);
  assert.equal(savedDeparture.availability[0].status, 'unknown');
  pass('real MongoDB: disabled sole departure source clears eight spaces and four cabins');

  const actorUserId = id();
  const overridden = await applyManualOverride({ identity: vesselIdentity, actorUserId,
    reason: 'Isolated disabled-source regression', values: { status: 'limited', spacesAvailable: 2 } });
  assert.equal(overridden.effective.manualOverride, true);
  assert.equal(overridden.effective.spacesAvailable, 2);
  await clearManualOverride({ identity: vesselIdentity, overrideId: overridden.override._id, actorUserId });
  savedDeparture = await Departure.findById(departure._id).lean();
  assert.equal(savedDeparture.availability[0].status, 'unknown');
  assert.equal(savedDeparture.availability[0].spacesAvailable, undefined);
  assert.equal(savedDeparture.availability[0].manualOverride, false);
  pass('real MongoDB: manual override still works and clearing it cannot revive a disabled source');

  fs.writeFileSync(path.join(__dirname, '../../docs/phase2b-review-availability-results.json'), JSON.stringify({ testedAt: new Date().toISOString(), scope: 'isolated local real MongoDB; not Render staging', results }, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
