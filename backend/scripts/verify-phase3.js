// Runs only inside the isolated local acceptance runner; never uses a hosted database.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const config = require('../src/config');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Organisation = require('../src/v2/models/organisation.model');
const Membership = require('../src/v2/models/organisationMembership.model');
const Invitation = require('../src/v2/models/organisationMemberInvitation.model');
const Vessel = require('../src/v2/models/vessel.model');
const Itinerary = require('../src/v2/models/itinerary.model');
const Departure = require('../src/v2/models/departure.model');
const Enquiry = require('../src/v2/models/enquiry.model');
const { createMemberInvitation } = require('../src/v2/services/operatorPortal.service');
const results = [];
const run = crypto.randomBytes(6).toString('hex');
const password = crypto.randomBytes(24).toString('hex');
let server, browser, origin;
function pass(label) { results.push({ label, status: 'passed' }); console.log('PASS ' + label); }
async function api(url, token, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(origin + url, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, ...(await response.json()) };
}
async function ok(url, token, body, method) {
  const result = await api(url, token, body, method);
  assert.ok(result.status < 300, `${url}: ${result.status} ${result.message}`);
  return result.data;
}
(async () => {
  try {
    assert.match(config.database_url, /^mongodb:\/\/127\.0\.0\.1:27029\/phase1_acceptance$/);
    assert.equal(process.env.EMAIL_DELIVERY_MODE, 'test');
    await mongoose.connect(config.database_url);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    origin = 'http://127.0.0.1:' + server.address().port;
    const org = await Organisation.create({ name: 'Phase3 ' + run, status: 'claimed' });
    const other = await Organisation.create({ name: 'Other Phase3 ' + run, status: 'claimed' });
    const tokens = {}, users = {};
    for (const role of ['owner','admin','editor','reservations','viewer']) {
      users[role] = await User.create({ fullName: role, email: `${run}-${role}@example.test`, password, role: 'operator', isValid: true, status: 'active' });
      await Membership.create({ organisation: org._id, user: users[role]._id, role });
      tokens[role] = (await ok('/api/auth/login', null, { email: users[role].email, password })).token;
    }
    const base = '/api/v2/operator/organisations/' + org._id;
    assert.equal((await api(base + '/dashboard')).status, 401);
    assert.equal((await api('/api/v2/operator/organisations/' + other._id + '/dashboard', tokens.owner)).status, 403);
    assert.equal((await ok('/api/v2/operator/organisations', tokens.owner)).length, 1);
    for (const role of ['viewer','reservations']) assert.equal((await api(base + '/vessels', tokens[role], { name: 'Forbidden' })).status, 403);
    assert.equal((await api(base + '/members', tokens.editor)).status, 403);
    pass('authentication, active membership, cross-organisation isolation and role restrictions');
    const vessel = await ok(base + '/vessels', tokens.editor, { name: 'Boat ' + run, source: 'admin', verificationSourceType: 'admin' });
    assert.equal(vessel.source, 'operator'); assert.equal(vessel.listingStatus, 'draft');
    assert.equal((await api(base + '/vessels/' + vessel._id, tokens.editor, { listingStatus: 'published' }, 'PATCH')).status, 403);
    const cabin = await ok(base + '/cabins', tokens.editor, { vessel: vessel._id, name: 'Deluxe', totalCabins: 4 });
    const itin = await ok(base + '/itineraries', tokens.editor, { vessel: vessel._id, name: 'Route ' + run, basePrices: [{ cabinType: cabin._id, amount: 1000, currency: 'USD' }] });
    const dep = await ok(base + '/departures', tokens.editor, { itinerary: itin._id, startDate: '2027-11-01', endDate: '2027-11-08', availability: [{ cabinType: cabin._id, spacesAvailable: 4, status: 'available' }] });
    const priced = await ok(base + '/departures/' + dep._id, tokens.editor, { priceOverrides: [{ cabinType: cabin._id, amount: 1200, currency: 'USD' }], offers: [{ name: 'Sale', type: 'percent', percent: 10, active: true }] }, 'PATCH');
    assert.equal(priced.effectiveMinPriceUsd, 1080);
    assert.ok((await ok(base + '/availability', tokens.viewer)).some(item => item.spacesAvailable === 4));
    const verified = await ok(base + '/vessels/' + vessel._id + '/verify', tokens.editor, {});
    assert.ok(verified);
    pass('draft catalogue, editorial protection, cabins, itinerary, shared pricing and normalized availability');
    const resort = await ok(base + '/resorts', tokens.editor, { name: 'Resort ' + run });
    const room = await ok(base + '/room-types', tokens.editor, { resort: resort._id, name: 'Garden', totalRooms: 6 });
    assert.equal((await ok(base + '/room-types/' + room._id, tokens.editor, { totalRooms: 8 }, 'PATCH')).totalRooms, 8);
    const pack = await ok(base + '/resort-packages', tokens.editor, { resort: resort._id, roomType: room._id, name: 'Week', basePrice: { amount: 900, currency: 'USD' } });
    await ok(base + '/resort-packages/' + pack._id, tokens.editor, { basePrice: { amount: 950, currency: 'USD' } }, 'PATCH');
    const rate = await ok(base + '/rate-periods', tokens.editor, { package: pack._id, roomType: room._id, startDate: '2027-11-01', endDate: '2027-11-30', priceOverride: { amount: 1000, currency: 'USD' } });
    await ok(base + '/rate-periods/' + rate._id, tokens.editor, { active: false }, 'PATCH');
    const stopped = await ok(base + '/resort-availability', tokens.editor, { roomType: room._id, date: '2027-11-05', roomsAvailable: 0, status: 'stop_sell' }, 'PUT');
    assert.equal(stopped.status, 'stop_sell');
    assert.equal((await ok(base + '/resorts/' + resort._id, tokens.viewer)).roomTypes.length, 1);
    const foreignResort = await require('../src/v2/models/resort.model').create({ organisation: other._id, name: 'Foreign Resort ' + run, slug: 'foreign-' + run });
    const foreignRoom = await require('../src/v2/models/roomType.model').create({ organisation: other._id, resort: foreignResort._id, name: 'Foreign room' });
    assert.equal((await api(base + '/resort-packages/' + pack._id, tokens.editor, { roomType: String(foreignRoom._id) }, 'PATCH')).status, 400);
    assert.equal((await api(base + '/rate-periods/' + rate._id, tokens.editor, { roomType: String(foreignRoom._id) }, 'PATCH')).status, 400);
    pass('resort rooms, package and seasonal rate edits and normalized stop-sell');
    const Definition = require('../src/v2/models/attributeDefinition.model');
    const definitions = await Definition.create([
      { key: 'p3_bool_' + run, label: 'Boolean', group: 'facility', applicableTo: ['vessel'], dataType: 'boolean' },
      { key: 'p3_num_' + run, label: 'Number', applicableTo: ['vessel'], dataType: 'number' },
      { key: 'p3_select_' + run, label: 'Select', applicableTo: ['vessel'], dataType: 'select', options: ['A','B'] },
      { key: 'p3_multi_' + run, label: 'Multi', applicableTo: ['vessel'], dataType: 'multi_select', options: ['A','B'] },
    ]);
    const values = [true, 12, 'A', ['A','B']];
    const attrs = definitions.map((item, i) => ({ key: item.key, value: values[i] }));
    await ok(base + '/product-attributes', tokens.editor, { productType: 'vessel', productId: vessel._id, attributes: attrs }, 'PUT');
    assert.ok((await Vessel.findById(vessel._id)).facilities.includes(definitions[0].key));
    assert.equal((await api(base + '/product-attributes', tokens.editor, { productType: 'vessel', productId: vessel._id, attributes: [{ key: definitions[2].key, value: 'invalid' }] }, 'PUT')).status, 400);
    pass('typed boolean/number/select/multi-select attributes and shared search facets');

    const media = await ok(base + '/media', tokens.editor, { entityType: 'vessel', entityId: vessel._id, url: 'https://example.test/photo.jpg', featured: true, usageApproved: true });
    assert.equal(media.usageApproved, false); assert.equal(media.source, 'operator');
    await ok(base + '/media/' + media._id, tokens.editor, { title: 'Ocean', sortOrder: 2 }, 'PATCH');
    await ok(base + '/media/' + media._id, tokens.editor, undefined, 'DELETE');
    assert.equal((await Vessel.findById(vessel._id)).gallery.length, 0);
    pass('scoped URL media, approval boundary, update and deletion');
    await Vessel.updateOne({ _id: vessel._id }, { $set: { featuredImage: 'https://example.test/legacy.jpg', gallery: ['https://example.test/legacy.jpg'] } });
    const { execFileSync } = require('node:child_process');
    const migrate = args => JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'migrate-phase3-media.js'), ...args], { env: process.env, encoding: 'utf8' }));
    const Media = require('../src/v2/models/mediaAsset.model');
    const mediaBefore = await Media.countDocuments();
    const dry = migrate([]); assert.equal(dry.mode, 'dry-run');
    assert.equal(await Media.countDocuments(), mediaBefore);
    migrate(['--apply']);
    assert.equal(migrate([]).results.reduce((sum, item) => sum + item.planned, 0), 0);
    assert.ok((await Vessel.findById(vessel._id)).gallery.includes('https://example.test/legacy.jpg'));
    pass('media migration dry run is read-only and applied backfill is idempotent on isolated data');

    const profile = await ok(base + '/profile', tokens.owner);
    await ok(base + '/profile', tokens.owner, { expectedUpdatedAt: profile.updatedAt, phone: '123' }, 'PATCH');
    assert.equal((await api(base + '/profile', tokens.owner, { expectedUpdatedAt: profile.updatedAt, phone: '456' }, 'PATCH')).status, 409);
    pass('organisation profile stale update conflict');
    const invitation = await createMemberInvitation({ organisationId: org._id, invitedBy: users.owner._id, email: `${run}-new@example.test`, role: 'viewer' });
    const stored = await Invitation.findById(invitation.invite._id).lean();
    assert.notEqual(stored.tokenHash, invitation.token); assert.equal(stored.token, undefined);
    const inviteUrl = '/api/v2/operator/member-invitations/' + invitation.token;
    const accepted = await ok(inviteUrl + '/accept', null, { password, fullName: 'New teammate' });
    assert.equal(accepted.membership.role, 'viewer');
    assert.equal((await api(inviteUrl + '/accept', null, { password })).status, 404);
    const ownerInvite = await createMemberInvitation({ organisationId: org._id, invitedBy: users.admin._id, email: users.owner.email, role: 'viewer' });
    assert.equal((await api('/api/v2/operator/member-invitations/' + ownerInvite.token + '/accept', null, { password: 'wrong' })).status, 401);
    assert.equal((await api('/api/v2/operator/member-invitations/' + ownerInvite.token + '/accept', null, { password })).status, 409);
    assert.equal((await Membership.findOne({ organisation: org._id, user: users.owner._id })).role, 'owner');
    const ownerMembership = await Membership.findOne({ organisation: org._id, user: users.owner._id });
    assert.equal((await api(base + '/members/' + ownerMembership._id, tokens.owner, { status: 'disabled' }, 'PATCH')).status, 409);
    pass('hashed single-use invitations, new-account onboarding, existing password and owner protection');
    const before = await Departure.countDocuments({ organisation: org._id });
    const rows = [{ vesselName: vessel.name, itineraryName: itin.name, startDate: '2027-12-01', endDate: '2027-12-08', cabinName: 'Deluxe', spacesAvailable: 2, departureCode: 'p3-' + run }];
    const preview = await ok(base + '/imports/departures/preview', tokens.editor, { rows });
    assert.equal(await Departure.countDocuments({ organisation: org._id }), before);
    assert.equal(preview.summary.create, 1);
    const invalid = await ok(base + '/imports/departures/preview', tokens.editor, { rows: [{ ...rows[0], spacesAvailable: -1, startDate: 'bad' }] });
    assert.equal(invalid.summary.error, 1);
    const commit = await ok(base + '/imports/' + preview._id + '/commit', tokens.editor, {});
    assert.equal(commit.summary.committed, 1);
    assert.equal((await api(base + '/imports/' + preview._id + '/commit', tokens.editor, {})).status, 409);
    const reupload = await ok(base + '/imports/departures/preview', tokens.editor, { rows });
    await ok(base + '/imports/' + reupload._id + '/commit', tokens.editor, {});
    assert.equal(await Departure.countDocuments({ organisation: org._id }), before + 1);
    const legacy = await ok('/api/v2/organisations/' + org._id + '/import/departures', tokens.editor, { rows: [{ ...rows[0], departureCode: 'legacy-' + run }] });
    assert.equal(legacy.status, 'awaiting_confirmation');
    assert.equal(await Departure.countDocuments({ organisation: org._id }), before + 1);
    pass('no-write preview, row errors, explicit commit, replay protection, stable upsert and legacy preview');
    const enquiry = await Enquiry.create({ organisation: org._id, productType: 'vessel', productModel: 'VesselV2', product: vessel._id, customer: { name: 'Guest', email: 'guest@example.test' }, status: 'new' });
    assert.equal((await ok(base + '/enquiries', tokens.reservations)).length, 0);
    assert.equal((await api(base + '/enquiries/' + enquiry._id + '/status', tokens.reservations, { status: 'operator_accepted' }, 'PATCH')).status, 400);
    enquiry.status = 'sent_to_operator'; await enquiry.save();
    assert.equal((await api(base + '/enquiries/' + enquiry._id + '/status', tokens.reservations, { status: 'quoted' }, 'PATCH')).status, 400);
    for (const status of ['operator_accepted','operator_replied','quoted']) await ok(base + '/enquiries/' + enquiry._id + '/status', tokens.reservations, { status, note: 'Local test' }, 'PATCH');
    assert.equal((await api(base + '/enquiries/' + enquiry._id + '/status', tokens.reservations, { status: 'operator_accepted' }, 'PATCH')).status, 400);
    pass('Admin-first enquiry visibility, reservations workflow and invalid transitions');
    await Organisation.updateOne({ _id: org._id }, { $set: { accountStatus: 'suspended' } });
    assert.equal((await api(base + '/dashboard', tokens.owner)).status, 403);
    assert.equal((await ok('/api/v2/operator/organisations', tokens.owner)).length, 0);
    await Organisation.updateOne({ _id: org._id }, { $set: { accountStatus: 'active' } });
    pass('suspended organisation access and organisation picker filtering');
    const Notification = require('../src/v2/models/notification.model');
    const notice = await Notification.create({ audience: 'operator', recipientOrganisation: org._id, type: 'test', title: 'Local notice', message: 'Test', actionTarget: '/operator/v2' });
    const foreignNotice = await Notification.create({ audience: 'operator', recipientOrganisation: other._id, type: 'test', title: 'Foreign notice', message: 'Test' });
    const notices = await ok(base + '/notifications', tokens.viewer);
    assert.ok(notices.items.some(item => item._id === String(notice._id)));
    assert.ok(!notices.items.some(item => item._id === String(foreignNotice._id)));
    assert.equal((await api(base + '/notifications/' + foreignNotice._id + '/read', tokens.viewer, {}, 'PATCH')).status, 404);
    await ok(base + '/notifications/' + notice._id + '/read', tokens.viewer, {}, 'PATCH');
    assert.equal((await ok(base + '/notifications', tokens.viewer)).unread, notices.unread - 1);
    pass('notification organisation isolation, unread count and scoped read marking');
    const { chromium } = require('../../frontend/node_modules/@playwright/test');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.VERIFY_FRONTEND_URL + '/login');
    await page.evaluate(token => localStorage.setItem('access-token', token), tokens.owner);
    for (const width of [390,768,1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['', '/liveaboards', '/liveaboards/' + vessel._id, '/resorts', '/resorts/' + resort._id, '/availability', '/enquiries', '/imports', '/notifications', '/team', '/profile']) {
        await page.goto(process.env.VERIFY_FRONTEND_URL + '/operator/v2' + route);
        await page.getByRole('heading', { level: 1 }).waitFor();
        await page.waitForTimeout(150);
        assert.ok(page.url().includes('/operator/v2'), 'operator authentication redirect');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'horizontal overflow: ' + route + ' at ' + width);
      }
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(process.env.VERIFY_FRONTEND_URL + '/operator/v2/liveaboards/' + vessel._id);
    await page.getByRole('combobox', { name: 'Edit cabin', exact: true }).selectOption(cabin._id);
    await page.getByLabel('Total cabins', { exact: true }).fill('9');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.getByText('Saved.', { exact: true }).waitFor();
    assert.equal((await require('../src/v2/models/cabinType.model').findById(cabin._id)).totalCabins, 9);
    await page.getByRole('textbox', { name: 'Image URL', exact: true }).fill('https://example.test/mobile.jpg');
    await page.getByRole('button', { name: 'Add image', exact: true }).click();
    await page.waitForFunction(() => Array.from(document.images).some(image => image.src === 'https://example.test/mobile.jpg'));
    pass('mobile cabin editing and image attachment controls persist through the scoped API');
    await page.goto(process.env.VERIFY_FRONTEND_URL + '/dashboard/v2');
    await page.waitForURL('**/operator/v2');
    assert.deepEqual(errors, []);
    pass('portal navigation at 390/768/1440px, legacy redirect and no browser runtime errors');
  } catch (error) {
    results.push({ label: error.message, status: 'failed' });
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    const reportDir = process.env.VERIFY_REPORT_DIR || path.join(__dirname, '../../docs/phase3/evidence');
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, 'phase3-results.json'), JSON.stringify({ testedAt: new Date().toISOString(), scope: 'isolated local database and browser; not Render acceptance', results }, null, 2) + '\n');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
