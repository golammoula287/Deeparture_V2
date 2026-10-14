// Runs only against the isolated local database started by verify-phase1-local.js.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const AttributeDefinition = require('../src/v2/models/attributeDefinition.model');
const ProductAttribute = require('../src/v2/models/productAttribute.model');

const origin = `http://127.0.0.1:${process.env.PORT || 5019}`;
const run = crypto.randomBytes(5).toString('hex');
const operationId = `phase2b.verify.${run}`;
const request = async (path, token, body, method) => {
  const response = await fetch(origin + path, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), 'X-Operation-Id': operationId },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const json = await response.json();
  return { status: response.status, ...json };
};
const ok = async (path, token, body, method) => {
  const result = await request(path, token, body, method);
  assert.equal(result.success, true, `${path}: ${result.status} ${result.message}`);
  return result.data;
};
const pass = (label) => console.log(`PASS Phase 2B ${label}`);

(async () => {
  const login = await ok('/api/auth/login', null, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const admin = login.token;
  assert.equal((await request('/api/v2/admin/imports/history')).status, 401);
  const operator = (await ok('/api/auth/login', null, { email: process.env.DEMO_OPERATOR_EMAIL, password: process.env.DEMO_OPERATOR_PASSWORD })).token;
  assert.equal((await request('/api/v2/admin/imports/history', operator)).status, 403);
  pass('admin authorization');

  for (const path of ['/api/v2/admin/imports/history', '/api/v2/admin/notifications', '/api/v2/admin/audit', '/api/v2/admin/availability']) {
    const data = await ok(`${path}?limit=999`, admin);
    assert.equal(data.limit, 100);
    assert.ok(Array.isArray(data.items));
  }
  pass('bounded operational lists');

  const org = await ok('/api/v2/admin/organisations', admin, { name: `Phase 2B Verify ${run}`, primaryEmail: `phase2b-${run}@example.test` });
  const vessel = await ok('/api/v2/admin/catalog/liveaboards', admin, { organisation: org._id, name: `Phase 2B Vessel ${run}`, summary: 'Verification fixture' });
  const completeness = await ok(`/api/v2/admin/catalog/vessel/${vessel._id}/completeness`, admin);
  assert.ok(Number.isFinite(completeness.score));
  const verified = await ok(`/api/v2/admin/verification/vessel/${vessel._id}`, admin, { status: 'deeparture_verified', sourceType: 'admin_manual', scope: 'listing' });
  assert.equal(verified.item.verificationStatus, 'deeparture_verified');
  const verificationHistory = await ok(`/api/v2/admin/verification/vessel/${vessel._id}/history`, admin);
  assert.equal(verificationHistory.total, 1);
  pass('completeness and verification history');

  const queue = await ok('/api/v2/admin/imports/website', admin, { organisation: org._id, productType: 'vessel', productName: `Phase 2B Vessel ${run}`, sourceUrl: `https://${run}.example.test` });
  assert.equal(queue.status, 'queued');
  const reviewed = await ok(`/api/v2/admin/imports/website/${queue._id}`, admin, { status: 'needs_review', expectedUpdatedAt: queue.updatedAt }, 'PATCH');
  assert.equal(reviewed.status, 'needs_review');
  assert.equal((await request(`/api/v2/admin/imports/website/${queue._id}`, admin, { notes: 'stale', expectedUpdatedAt: queue.updatedAt }, 'PATCH')).status, 409);
  pass('website source queue and stale edit protection');

  const config = await ok('/api/v2/admin/sources/configs', admin, { providerName: `Verification ${run}`, sourceType: 'api', organisation: org._id, priority: 5, freshnessThresholdMinutes: 60 });
  assert.equal(config.priority, 5);
  const mappingInput = { providerName: `Verification ${run}`, sourceType: 'api', internalEntityType: 'vessel', internalEntityId: vessel._id, externalEntityType: 'vessel', externalId: `external-${run}`, organisation: org._id };
  const mapping = await ok('/api/v2/admin/sources/mappings', admin, mappingInput);
  assert.equal(mapping.internalEntityId, vessel._id);
  assert.equal((await request('/api/v2/admin/sources/mappings', admin, { ...mappingInput, metadata: { apiKey: 'must-not-persist' } })).status, 400);
  assert.equal((await request('/api/v2/admin/sources/mappings', admin, { ...mappingInput, internalEntityId: org._id })).status, 409);
  pass('source configuration, mappings, and secret protection');

  const bulk = await ok('/api/v2/admin/bulk', admin, { productType: 'vessel', action: 'publish', ids: [vessel._id, '000000000000000000000001'] });
  assert.equal(bulk.summary.succeeded, 1);
  assert.equal(bulk.summary.failed, 1);
  assert.equal(bulk.operationId, operationId);
  assert.equal((await request('/api/v2/admin/bulk', admin, { productType: 'vessel', action: 'publish', ids: Array.from({ length: 101 }, (_, i) => `00000000000000000000${String(i).padStart(4, '0')}`) })).status, 413);
  pass('bounded bulk action with partial outcomes');

  const demo = await ok('/api/v2/liveaboards/demo-explorer');
  const departure = demo.departures[0];
  const cabin = departure.availability[0].cabinType;
  const override = await ok('/api/v2/admin/availability/override', admin, {
    productType: 'vessel', departureId: departure._id, cabinType: cabin?._id || cabin,
    status: 'limited', spacesAvailable: 2, reason: 'Isolated Phase 2B verification',
  });
  assert.equal(override.effective.manualOverride, true);
  const sources = await ok(`/api/v2/admin/availability/${encodeURIComponent(override.inventoryKey)}/sources`, admin);
  assert.ok(sources.overrides.some(item => item._id === override.override._id));
  const history = await ok(`/api/v2/admin/availability/${encodeURIComponent(override.inventoryKey)}/history`, admin);
  assert.ok(history.total >= 1);
  await ok(`/api/v2/admin/availability/${encodeURIComponent(override.inventoryKey)}/overrides/${override.override._id}`, admin, undefined, 'DELETE');
  pass('manual availability override, sources, and history');

  const publicList = await ok(`/api/v2/liveaboards?q=${encodeURIComponent(`Phase 2B Vessel ${run}`)}`);
  assert.ok(publicList.items.some(item => item._id === vessel._id));
  await mongoose.connect(process.env.DATABASE_URL, { serverSelectionTimeoutMS: 15000 });
  try {
    const nitrox = await AttributeDefinition.findOne({ key: 'nitrox' });
    assert.ok(nitrox);
    const typed = await Promise.all([
      AttributeDefinition.create({ key: `phase2b_rating_${run}`, label: 'Verification rating', dataType: 'number', applicableTo: ['vessel'], filterable: true }),
      AttributeDefinition.create({ key: `phase2b_zone_${run}`, label: 'Verification zone', dataType: 'select', options: ['west', 'east'], applicableTo: ['vessel'], filterable: true }),
      AttributeDefinition.create({ key: `phase2b_features_${run}`, label: 'Verification features', dataType: 'multi_select', options: ['camera', 'wifi'], applicableTo: ['vessel'], filterable: true }),
    ]);
    await ProductAttribute.create([
      { productModel: 'VesselV2', product: vessel._id, definition: nitrox._id, value: true },
      { productModel: 'VesselV2', product: vessel._id, definition: typed[0]._id, value: 4 },
      { productModel: 'VesselV2', product: vessel._id, definition: typed[1]._id, value: 'west' },
      { productModel: 'VesselV2', product: vessel._id, definition: typed[2]._id, value: ['camera', 'wifi'] },
    ]);
  } finally {
    await mongoose.disconnect();
  }
  const typedQuery = new URLSearchParams({ attr_nitrox: 'true', [`attr_phase2b_rating_${run}_gte`]: '3', [`attr_phase2b_zone_${run}`]: 'west', [`attr_phase2b_features_${run}_all`]: 'camera,wifi' });
  const typedMatches = await ok(`/api/v2/liveaboards?${typedQuery}`, admin);
  assert.ok(typedMatches.items.some(item => item._id === vessel._id));
  typedQuery.set(`attr_phase2b_rating_${run}_gte`, '5');
  const typedNonmatches = await ok(`/api/v2/liveaboards?${typedQuery}`, admin);
  assert.ok(!typedNonmatches.items.some(item => item._id === vessel._id));
  pass('combined boolean, numeric, select, and multi-select search');
  const report = await ok('/api/v2/admin/reports/operational', admin);
  assert.ok(report.catalogue.total >= 1);
  const audit = await ok(`/api/v2/admin/audit?operationId=${operationId}`, admin);
  assert.ok(audit.total >= 1);
  const notifications = await ok('/api/v2/admin/notifications', admin);
  assert.ok(notifications.total >= 1);
  pass('shared search, reporting, audit, and notifications');
  console.log('VERIFIED 9 Phase 2B API groups');
})().catch(error => { console.error('FAIL Phase 2B', error); process.exitCode = 1; });
