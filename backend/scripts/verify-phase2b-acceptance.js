// Behavioral acceptance against the isolated runner only. Never loads .env.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { chromium } = require('../../frontend/node_modules/@playwright/test');
const model = name => require(`../src/v2/models/${name}.model`);
const availability = require('../src/v2/services/availability.service');
const claims = require('../src/v2/services/claim.service');
const origin = `http://127.0.0.1:${process.env.PORT || 5019}`;
const frontend = process.env.VERIFY_FRONTEND_URL || 'http://localhost:3019';
const results = [];
const run = Date.now().toString(36);
const operationId = `acceptance.${run}`;
let token, browser;
const pass = (label, evidence = {}) => { results.push({ label, status: 'passed', ...evidence }); console.log('PASS extended Phase 2B ' + label); };
async function request(route, body, method) {
  const response = await fetch(origin + '/api/v2/admin' + route, { method: method || (body === undefined ? 'GET' : 'POST'), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Operation-Id': operationId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  return { httpStatus: response.status, ...await response.json() };
}
async function ok(route, body, method) { const r = await request(route, body, method); assert.equal(r.success, true, `${route}: ${JSON.stringify(r)}`); return r.data; }

(async () => {
  assert.match(process.env.DATABASE_URL || '', /^mongodb:\/\/127\.0\.0\.1:27029\/phase1_acceptance$/);
  assert.equal(process.env.EMAIL_DELIVERY_MODE, 'test');
  await mongoose.connect(process.env.DATABASE_URL);
  const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  const auth = (await login.json()).data; token = auth.token;
  const adminId = auth.user._id;
  const org = await ok('/organisations', { name: `Acceptance ${run}`, primaryEmail: `${run}@example.test` });
  const input = { operatorName: org.name, operatorEmail: org.primaryEmail, vesselName: `Acceptance boat ${run}`, sourceUrl: 'https://example.test/catalogue' };
  const preview = await ok('/catalog/import/preview', { productType: 'vessel', rows: [input, input, { operatorName: org.name }] });
  assert.equal(preview.summary.duplicateReview, 1); assert.equal(preview.summary.error, 1);
  const committed = await ok(`/catalog/import-batches/${preview.batchId}/commit`, { allowPartial: true });
  assert.equal(committed.successes.length, 1);
  assert.equal(committed.status, 'completed_with_errors');
  const batch = await ok(`/catalog/import-batches/${preview.batchId}`);
  assert.ok(batch.createdAt && batch.createdBy && batch.sourceType && batch.adapterType && batch.schemaVersion);
  assert.equal(batch.results.length, 1);
  const errors = await ok(`/catalog/import-batches/${preview.batchId}/errors`);
  assert.equal(errors.total, 2); assert.ok(errors.items.every(x => x.reason));
  const vesselId = committed.successes[0].productId;
  const vessel = await ok(`/catalog/liveaboards/${vesselId}`);
  assert.ok(vessel.sourceUrl && vessel.lastCheckedAt);
  const retry = await ok(`/catalog/import-batches/${preview.batchId}/retry-preview`, { correctedRows: [{ ...input, vesselName: `Retry ${run}` }] });
  assert.equal(retry.summary.create, 1);
  assert.equal(await model('vessel').countDocuments({ name: `Retry ${run}` }), 0);
  pass('import metadata, row errors, partial outcomes, provenance, affected record and normalized retry');

  // Two same-name products force a real ambiguous match, independent of batch duplicates.
  await ok('/catalog/liveaboards', { organisation: org._id, name: input.vesselName });
  const duplicate = await ok('/catalog/import/preview', { productType: 'vessel', rows: [input] });
  assert.equal(duplicate.summary.duplicateReview, 1);
  const resolved = await ok(`/duplicates/${duplicate.batchId}/1/resolve`, { decision: 'match_existing', productId: vesselId, providerKey: 'acceptance', providerName: 'Acceptance', externalId: run });
  assert.equal(resolved.row.productMatchId, vesselId);
  const resolvedCommit = await ok(`/catalog/import-batches/${duplicate.batchId}/commit`, {});
  assert.equal(resolvedCommit.successes[0].productId, vesselId);
  assert.ok(await model('duplicateResolution').exists({ importBatch: duplicate.batchId, productId: vesselId }));
  const mappings = await ok(`/sources/mappings?providerKey=acceptance&externalId=${run}`);
  assert.equal(mappings.items[0].internalEntityId, vesselId);
  const mappedPreview = await ok('/catalog/import/preview', { productType: 'vessel', rows: [{ ...input, providerKey: 'acceptance', externalId: run }] });
  assert.equal(mappedPreview.summary.update, 1);
  assert.equal(mappedPreview.rows[0].productMatchId, vesselId);
  const newPreview = await ok('/catalog/import/preview', { productType: 'vessel', rows: [input] });
  await ok(`/duplicates/${newPreview.batchId}/1/resolve`, { decision: 'create_new', organisationId: org._id });
  const newCommit = await ok(`/catalog/import-batches/${newPreview.batchId}/commit`, {});
  assert.notEqual(newCommit.successes[0].productId, vesselId);
  pass('duplicate existing/new decisions persist and preserve internal IDs and external mapping');

  for (const type of ['organisation', 'vessel']) {
    const id = type === 'organisation' ? org._id : vesselId;
    const verification = await ok(`/verification/${type}/${id}`, { status: 'deeparture_verified', sourceType: 'admin_manual', sourceRef: 'https://example.test/evidence', scope: 'listing' });
    assert.ok(verification.record.verifiedAt && verification.record.verifiedByUser);
    assert.equal(verification.record.verificationScope, 'listing');
    if (type === 'vessel') assert.equal(verification.item.listingStatus, 'draft');
    await ok(`/verification/${type}/${id}`, { status: 'revoked' });
    assert.equal((await ok(`/verification/${type}/${id}/history`)).total, 2);
  }
  pass('organisation and listing verification, provenance, revocation and publication independence');
  const invite = await claims.createClaimInvitation({ organisationId: org._id, email: org.primaryEmail, createdBy: adminId, operationId });
  const resent = await ok(`/organisations/${org._id}/claim-history/${invite.historyId}/resend`, {});
  await ok(`/organisations/${org._id}/claim-history/${resent.historyId}/revoke`, { reason: 'Acceptance check' });
  const expiring = await claims.createClaimInvitation({ organisationId: org._id, email: org.primaryEmail, createdBy: adminId, operationId });
  await model('claimInvitationHistory').updateOne({ _id: expiring.historyId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  const history = await ok(`/organisations/${org._id}/claim-history`);
  assert.ok(history.items.some(x => x.status === 'expired')); assert.ok(history.items.some(x => x.status === 'revoked'));
  const finalInvite = await claims.createClaimInvitation({ organisationId: org._id, email: org.primaryEmail, createdBy: adminId, operationId });
  await claims.acceptClaim({ token: new URL(finalInvite.claimUrl).searchParams.get('token'), fullName: 'Acceptance Operator', password: require('node:crypto').randomBytes(24).toString('hex'), operationId });
  assert.ok((await ok(`/organisations/${org._id}/claim-history`)).items.some(x => x.status === 'claimed' && x.claimedAt));
  pass('claim sent/resend/revoke/expiry history uses shared claim service');
  const complete = await ok(`/catalog/vessel/${vesselId}/completeness`);
  assert.ok(complete.missing.length && complete.categories.length);
  const bulk = await ok('/bulk', { productType: 'vessel', action: 'publish', ids: [vesselId] });
  assert.equal(bulk.summary.succeeded, 1);
  const resort = await ok('/catalog/resorts', { organisation: org._id, name: `Acceptance resort ${run}` });
  const resortComplete = await ok(`/catalog/resort/${resort._id}/completeness`);
  assert.ok(resortComplete.categories.length && resortComplete.missing.length);
  pass('shared completeness categories for both product types do not block publication');
  let website = await ok('/imports/website', { organisation: org._id, productType: 'vessel', sourceUrl: 'https://example.test', productName: input.vesselName });
  for (const status of ['draft_created', 'needs_review', 'approved', 'rejected']) {
    website = await ok(`/imports/website/${website._id}`, { status, expectedUpdatedAt: website.updatedAt }, 'PATCH'); assert.equal(website.status, status);
  }
  assert.ok(website.reviewedAt && website.reviewedBy);
  pass('website queue accepts operator/product/URL and all review states');
  const invalid = await request('/imports/website', { productType: 'invalid' });
  const conflict = await request(`/imports/website/${website._id}`, { status: 'queued', expectedUpdatedAt: '2000-01-01T00:00:00Z' }, 'PATCH');
  const missing = await request('/verification/vessel/000000000000000000000001', { status: 'deeparture_verified' });
  for (const [r, status, code] of [[invalid, 400, 'validation_error'], [conflict, 409, 'conflict'], [missing, 404, 'not_found']]) {
    assert.equal(r.httpStatus, status); assert.equal(r.code, code); assert.equal(r.operationId, operationId); assert.equal(r.success, false); assert.equal(r.stack, undefined);
  }
  pass('validation/not-found/conflict response contract with correlation IDs and no stack traces');

  const departure = await model('departure').findOne();
  const cabinType = departure.availability[0].cabinType;
  const identity = await availability.identityFromInput({ productType: 'vessel', departureId: departure._id, cabinType });
  const configInput = { organisation: String(identity.organisationId), sourceType: 'api', providerName: 'Acceptance primary', priority: 1, freshnessThresholdMinutes: 60 };
  await ok('/sources/configs', configInput);
  await ok('/sources/configs', { ...configInput, providerName: 'Acceptance secondary', priority: 50 });
  const disabledConfig = await ok('/sources/configs', { ...configInput, providerName: 'Acceptance disabled', enabled: false, lastAttemptAt: new Date().toISOString(), lastSuccessfulSyncAt: new Date().toISOString(), metadata: { adapter: 'future-feed' } });
  assert.equal(disabledConfig.enabled, false); assert.equal(disabledConfig.status, 'disabled');
  assert.ok(disabledConfig.lastAttemptAt && disabledConfig.lastSuccessfulSyncAt);
  assert.equal(disabledConfig.metadata.adapter, 'future-feed');
  const write = (providerName, spacesAvailable, sourceUpdatedAt = new Date()) => availability.upsertDepartureAvailability({ organisationId: identity.organisationId, departureId: departure._id, sourceType: 'api', providerName, sourceUpdatedAt, actorUserId: adminId, operationId, update: { cabinType, totalSpaces: 20, spacesAvailable, status: 'available' } });
  await write('Acceptance primary', 8); await write('Acceptance secondary', 3);
  let effective = (await availability.resolveAvailability(identity)).effective;
  assert.equal(effective.spacesAvailable, 8); assert.equal(effective.conflictState, true);
  await assert.rejects(write('Acceptance primary', 1, new Date(Date.now() - 60000)), /Older source update rejected/);
  for (const [age, expected] of [[0, 'fresh'], [90, 'aging'], [180, 'stale']]) {
    assert.equal(availability.freshnessFor({ sourceUpdatedAt: new Date(Date.now() - age * 60000) }, { freshnessThresholdMinutes: 60 }), expected);
  }
  assert.equal(availability.freshnessFor({}, {}), 'unknown');
  // Age isolated fixture snapshots, then invoke the real resolver and verify inventory.
  await model('availabilitySnapshot').updateMany({ inventoryKey: identity.inventoryKey }, { $set: { sourceUpdatedAt: new Date(Date.now() - 10080 * 60000) } });
  effective = (await availability.resolveAvailability(identity)).effective;
  assert.equal(effective.freshnessState, 'stale'); assert.equal(effective.spacesAvailable, 8); assert.equal(effective.status, 'available');
  pass('fresh/aging/stale/unknown, configurable priority, conflict, stale inventory and older-write rejection');
  const override = await ok('/availability/override', { productType: 'vessel', departureId: String(departure._id), cabinType: String(cabinType), status: 'limited', spacesAvailable: 2, reason: 'Timed acceptance override', expiresAt: new Date(Date.now() + 1200).toISOString() });
  assert.equal(override.effective.manualOverride, true);
  await new Promise(resolve => setTimeout(resolve, 1400));
  await ok('/availability/refresh-state', { limit: 200, minResolvedAgeMinutes: 1 });
  const detail = await ok(`/availability/${encodeURIComponent(identity.inventoryKey)}/sources`);
  assert.equal(detail.effective.manualOverride, false); assert.equal(detail.effective.spacesAvailable, 8);
  const events = await ok(`/availability/${encodeURIComponent(identity.inventoryKey)}/history`);
  for (const name of ['source_reported', 'override_set', 'override_expired']) assert.ok(events.items.some(x => x.eventType === name), name);
  assert.ok(detail.snapshots.every(x => x.receivedAt && x.sourceUpdatedAt));
  pass('real timed override expiry restores source inventory and records source/override history');
  const dashboard = await ok('/dashboard/advanced');
  assert.ok(dashboard.staleAvailability > 0 && dashboard.conflicts > 0 && dashboard.importErrors > 0);
  const report = await ok('/reports/operational');
  for (const key of ['catalogue', 'organisations', 'imports', 'enquiries', 'availability']) assert.ok(report[key]);
  const audit = await ok(`/audit?operationId=${operationId}`);
  for (const action of ['bulk.action', 'verification.changed', 'import.duplicate.resolved', 'availability.override.set']) assert.ok(audit.items.some(x => x.action === action), action);
  assert.ok(audit.items.every(x => x.createdAt && x.actorUser && x.entityType));
  pass('dashboard flags, operational report sections and correlated audit actor/action/entity/time');

  browser = await chromium.launch({ headless: true, ...(process.env.VERIFY_BROWSER_CHANNEL ? { channel: process.env.VERIFY_BROWSER_CHANNEL } : {}) });
  const page = await browser.newPage(); const browserErrors = [];
  page.on('pageerror', e => browserErrors.push(e.message));
  await page.goto(frontend + '/login');
  await page.evaluate(t => localStorage.setItem('access-token', 'Bearer ' + t), token);
  const routes = ['imports/history', 'duplicates', 'notifications', 'audit', 'sources', 'website-sources', 'reports', 'availability', `operators/${org._id}`, 'liveaboards', 'resorts'];
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(frontend + '/admin/v2/' + route); await page.locator('h1').waitFor(); await page.waitForLoadState('networkidle');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} overflows at ${width}`);
    }
  }
  pass('eleven Phase 2B screens load without horizontal page overflow at 1440/768/390px');
  await page.goto(frontend + '/admin/v2/imports/history');
  await page.getByRole('button', { name: 'View errors/review rows' }).first().click();
  await page.getByRole('heading', { name: 'Errors / duplicate-review rows' }).waitFor();
  await page.getByRole('button', { name: 'Open affected records' }).first().click();
  await page.getByRole('link', { name: 'Open listing' }).first().click();
  await page.waitForURL('**/admin/v2/liveaboards/*');
  await page.getByRole('heading', { name: 'Source & provenance', exact: true }).waitFor();
  await page.goto(frontend + `/admin/v2/liveaboards/${vesselId}`);
  await page.getByText('https://example.test/catalogue', { exact: true }).waitFor();
  await page.getByText('Missing / incomplete', { exact: true }).waitFor();
  pass('import history browser error panel and affected-record navigation');
  await page.goto(frontend + '/admin/v2/notifications');
  await page.waitForLoadState('networkidle');
  const unread = await ok('/notifications?unread=true'); assert.ok(unread.unread > 0);
  const target = unread.items.find(x => x.actionTarget); assert.ok(target);
  const article = page.locator('article').filter({ hasText: target.title }).first();
  assert.equal(await article.getByRole('link', { name: 'Open', exact: true }).getAttribute('href'), target.actionTarget);
  await article.getByRole('link', { name: 'Open', exact: true }).click(); await page.waitForURL(frontend + target.actionTarget);
  await page.goto(frontend + '/admin/v2/notifications');
  await page.getByRole('button', { name: 'Mark all read' }).click();
  await page.getByText('0 unread', { exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('[aria-label$="unread notifications"]'));
  assert.equal((await ok('/notifications?unread=true')).unread, 0);
  pass('notification actionable link, unread count and live sidebar badge update');
  await page.goto(frontend + `/admin/v2/operators/${org._id}`);
  await page.getByRole('heading', { name: 'Claim invitation history', exact: true }).waitFor();
  await page.getByText('claimed', { exact: true }).last().waitFor();
  await page.getByText('expired', { exact: true }).waitFor();
  pass('claim history rendered in organisation activity');
  await page.goto(frontend + `/admin/v2/liveaboards?organisation=${org._id}&status=published&source=deeparture_import&completenessMax=70`);
  await page.getByRole('checkbox', { name: `Select ${input.vesselName}`, exact: true }).check();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Apply bulk action' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Apply bulk action' }).click();
  await page.getByText(/Bulk operation .*1 succeeded, 0 failed/).waitFor();
  pass('combined status/source/completeness Admin filters and bulk confirmation/result UI');
  await page.goto(frontend + '/admin/v2/availability');
  await page.getByRole('button', { name: 'Inspect', exact: true }).first().click();
  await page.getByPlaceholder('Reason (required)').fill('Browser override acceptance');
  await page.getByRole('button', { name: 'Apply override', exact: true }).click();
  await page.getByText('Manual override applied', { exact: true }).waitFor();
  await page.getByText('manual override', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Clear override', exact: true }).first().click();
  await page.getByText('Override cleared', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Apply override', exact: true }).click();
  await page.getByText('Manual override applied', { exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  pass('availability source inspection, visible override, clear and repeat edit without stale version');
  assert.deepEqual(browserErrors, []);
  pass('no browser runtime errors across Phase 2B acceptance');

  const Notification = model('notification');
  await Notification.insertMany(Array.from({ length: 2000 }, (_, i) => ({ audience: 'admin', type: 'acceptance.scale', title: `Scale ${i}`, message: 'Isolated seeded acceptance record', operationId })));
  await Notification.createIndexes();
  const timings = [];
  for (let i = 0; i < 5; i++) {
    const started = performance.now(); const list = await ok('/notifications?limit=100&sort=-createdAt');
    timings.push(Math.round(performance.now() - started)); assert.equal(list.items.length, 100); assert.ok(list.total >= 2000);
    if (i === 0) {
      const second = await ok('/notifications?limit=100&page=2&sort=-createdAt');
      assert.equal(new Set([...list.items, ...second.items].map(x => x._id)).size, 200);
      assert.deepEqual((await ok('/notifications?limit=100&sort=-createdAt')).items.map(x => x._id), list.items.map(x => x._id));
    }
  }
  assert.ok(Math.max(...timings) < 2000);
  pass('2000-row notification pagination, stable sorting and local response benchmark', { dataset: 2000, timingsMs: timings, thresholdMs: 2000 });
  await model('vessel').insertMany(Array.from({ length: 1000 }, (_, i) => ({ organisation: org._id, name: `Scale vessel ${i}`, slug: `scale-${run}-${i}`, listingStatus: 'published', source: 'deeparture_import', completenessScore: 25 })));
  await model('importBatch').insertMany(Array.from({ length: 1000 }, (_, i) => ({ productType: 'vessel', sourceType: 'json', status: 'completed', sourceFilename: `scale-${i}`, operationId, summary: { total: 1, committed: 1 } })));
  const benchmarks = [];
  for (const route of ['/catalog/liveaboards?status=published&source=deeparture_import&completenessMax=30&limit=25', '/imports/history?limit=25', '/audit?limit=25', '/reports/operational']) {
    const started = performance.now(); const data = await ok(route); const ms = Math.round(performance.now() - started);
    assert.ok(ms < 3000, `${route}: ${ms}ms`); if (data.items) assert.ok(data.items.length <= 25);
    benchmarks.push({ route, ms });
  }
  const indexes = {};
  for (const name of ['notification', 'auditLog', 'importBatch', 'externalSourceMapping', 'sourceConfig', 'availabilitySnapshot', 'availabilityEffective', 'availabilityHistory', 'productAttribute']) {
    await model(name).createIndexes(); const list = await model(name).listIndexes(); assert.ok(list.length > 1); indexes[name] = list.map(x => ({ name: x.name, key: x.key }));
  }
  pass('seeded catalogue/import/report performance and deployed local index verification', { additionalVessels: 1000, additionalImports: 1000, benchmarks, indexes });
})().catch(error => { console.error(error); results.push({ status: 'failed', message: error.message, stack: error.stack }); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); await mongoose.disconnect();
  fs.writeFileSync(path.join(process.env.VERIFY_REPORT_DIR || path.join(__dirname, '../../docs'), 'phase2b-acceptance-results.json'), JSON.stringify({ testedAt: new Date().toISOString(), scope: 'isolated local; hosted acceptance not implied', results }, null, 2));
});
