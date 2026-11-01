// Explicit staging acceptance runner. Creates uniquely named fixtures; never drops databases.
// Requires the ignored repository-root .env and exact staging database name.
const privateEnv = require('dotenv').parse(require('fs').readFileSync(require('path').join(__dirname, '../../.env')));
Object.assign(process.env, privateEnv);
process.env.EMAIL_DELIVERY_MODE = 'test'; // Local helpers never send email; hosted mail endpoints are not invoked.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const config = require('../src/config');

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
const run = 'render_' + crypto.randomBytes(6).toString('hex');
const password = crypto.randomBytes(24).toString('hex');
let server, browser, origin;
function pass(label) { results.push({ label, status: 'passed' }); console.log('PASS ' + label); }
async function api(url, token, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(origin + url, { signal: AbortSignal.timeout(45000), method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, ...(await response.json()) };
}
async function ok(url, token, body, method) {
  const result = await api(url, token, body, method);
  assert.ok(result.status < 300, `${url}: ${result.status} ${result.message}`);
  return result.data;
}
(async () => {
  try {
    assert.equal(new URL(config.database_url).pathname, '/deeparture-v2-staging');
    await mongoose.connect(config.database_url, { serverSelectionTimeoutMS: 20000 });
    origin = 'https://deeparture-v2-3hr6.onrender.com';
    process.env.VERIFY_FRONTEND_URL = 'https://deeparture-v2-1.onrender.com';
    for (const kind of ['ADMIN', 'OPERATOR']) {
      const logged = await ok('/api/auth/login', null, { email: privateEnv['STAGING_' + kind + '_EMAIL'], password: privateEnv['STAGING_' + kind + '_PASSWORD'] });
      assert.equal(logged.user.role, kind.toLowerCase());
    }
    pass('provided staging admin and operator authenticate against Render');
    const org = await Organisation.create({ name: 'Phase3 ' + run, status: 'claimed' });
    const other = await Organisation.create({ name: 'Other Phase3 ' + run, status: 'claimed' });
    const tokens = {}, users = {};
    for (const role of ['owner','admin','editor','reservations','viewer']) {
      if (role === 'owner') users[role] = await User.findOne({ email: privateEnv.STAGING_OPERATOR_EMAIL.trim().toLowerCase() });
      else users[role] = await User.create({ fullName: 'Render acceptance ' + role, email: `${run}-${role}@example.test`, password, role: 'operator', isValid: true, status: 'active' });
      await Membership.create({ organisation: org._id, user: users[role]._id, role });
      tokens[role] = (await ok('/api/auth/login', null, { email: users[role].email, password: role === 'owner' ? privateEnv.STAGING_OPERATOR_PASSWORD : password })).token;
    }

    const base = '/api/v2/operator/organisations/' + org._id;
    assert.equal((await api(base + '/dashboard')).status, 401);
    assert.equal((await api('/api/v2/operator/organisations/' + other._id + '/dashboard', tokens.owner)).status, 403);
    assert.ok((await ok('/api/v2/operator/organisations', tokens.owner)).some(item => item._id === String(org._id)));
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
    // No global hosted migration apply: preserve nonfixture records.
    assert.ok(dry.results.some(item => item.planned > 0));
    assert.ok((await Vessel.findById(vessel._id)).gallery.includes('https://example.test/legacy.jpg'));
    pass('hosted media migration dry run is read-only; global apply intentionally not executed');

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
    assert.equal((await api('/api/v2/operator/member-invitations/' + ownerInvite.token + '/accept', null, { password: privateEnv.STAGING_OPERATOR_PASSWORD })).status, 409);
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
    assert.ok(!(await ok('/api/v2/operator/organisations', tokens.owner)).some(item => item._id === String(org._id)));
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
    const additional = async (label, action) => { try { await action(); pass(label); } catch(error) { results.push({label, status:'failed', detail:String(error.message).slice(0,600)}); console.log('FAIL '+label+': '+String(error.message).slice(0,300)); } };
    await additional('CSV and XLSX file previews, separate commits and scoped import history', async()=>{
      const ExcelJS=require('exceljs');
      const row={...rows[0],departureCode:'file-'+run}; const keys=Object.keys(row);
      for(const format of ['csv','xlsx']){
        const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Inventory');sheet.addRow(keys);sheet.addRow(keys.map(k=>row[k]));
        const buffer=format==='xlsx'?await workbook.xlsx.writeBuffer():Buffer.from(keys.join(',')+'\n'+keys.map(k=>row[k]).join(',')+'\n');
        const form=new FormData();form.append('file',new Blob([buffer]),'acceptance.'+format);
        const response=await fetch(origin+base+'/imports/departures/preview',{method:'POST',headers:{Authorization:'Bearer '+tokens.editor},body:form,signal:AbortSignal.timeout(45000)});
        const value=await response.json();assert.equal(response.status,201);assert.equal(value.data.summary.create,1);await ok(base+'/imports/'+value.data._id+'/commit',tokens.editor,{});
      }
      const history=await ok(base+'/imports',tokens.viewer);const items=history.items||history;assert.ok(items.every(x=>String(x.organisation)===String(org._id)));
    });
    await additional('Dashboard listing, incomplete, upcoming, stale, conflict, offer and unread counts',async()=>{
      const Effective=require('../src/v2/models/availabilityEffective.model');
      await Effective.updateMany({organisation:org._id},{$set:{freshnessState:'stale',conflictState:true}});
      await ok(base+'/departures/'+dep._id,tokens.editor,{startDate:new Date(Date.now()+7*86400000).toISOString(),endDate:new Date(Date.now()+14*86400000).toISOString()},'PATCH');
      const dashboard=await ok(base+'/dashboard',tokens.owner);
      assert.equal(dashboard.counts.vessels,await Vessel.countDocuments({organisation:org._id,listingStatus:{$ne:'archived'}}));
      assert.equal(dashboard.counts.resorts,1);assert.ok(dashboard.incomplete.length>0);assert.ok(dashboard.upcomingDepartures.some(x=>String(x._id)===String(dep._id)));
      assert.equal(dashboard.counts.staleAvailability,await Effective.countDocuments({organisation:org._id,freshnessState:'stale'}));
      assert.equal(dashboard.counts.availabilityConflicts,await Effective.countDocuments({organisation:org._id,conflictState:true}));
      assert.ok(dashboard.counts.activeOffers>0);assert.ok(Number.isInteger(dashboard.counts.unreadNotifications));
    });
    await additional('Dashboard active enquiry count includes records beyond the eight-row preview',async()=>{
      await Enquiry.insertMany(Array.from({length:10},(_,i)=>({organisation:org._id,productType:'vessel',productModel:'VesselV2',product:vessel._id,customer:{name:'Acceptance '+i,email:run+'-'+i+'@example.test'},status:'sent_to_operator'})));
      const dashboard=await ok(base+'/dashboard',tokens.owner);const expected=await Enquiry.countDocuments({organisation:org._id,status:{$in:['sent_to_operator','operator_accepted','operator_replied','quoted']}});
      assert.equal(dashboard.counts.pendingEnquiries,expected);assert.ok(dashboard.enquiries.length<=8);
    });
    await additional('Attribute definition visibility and role-specific membership permissions',async()=>{
      const definitions=await ok(base+'/attributes/definitions',tokens.viewer);assert.ok(definitions.every(x=>x.active&&x.visibleOnPage));
      const members=await ok(base+'/members',tokens.owner);assert.ok(members.members.length>=5);
      assert.equal((await api(base+'/profile',tokens.editor,{phone:'unauthorized'},'PATCH')).status,403);
      assert.equal((await api(base+'/enquiries',tokens.viewer)).status,403);
      assert.equal((await api(base+'/members/'+ownerMembership._id,tokens.admin,{role:'viewer'},'PATCH')).status,403);
    });
    const { chromium } = require('../../frontend/node_modules/@playwright/test');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.VERIFY_FRONTEND_URL + '/login');
    await page.evaluate(({token,org}) => { localStorage.setItem('access-token', token); localStorage.setItem('deeparture-operator-org',org); }, {token:tokens.owner,org:String(org._id)});
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
    await additional('Provided admin and operator credentials work through browser login forms', async()=>{
      for(const kind of ['ADMIN','OPERATOR']) {
        const context=await browser.newContext();const login=await context.newPage();
        await login.goto(process.env.VERIFY_FRONTEND_URL+'/login');
        await login.getByPlaceholder('Email',{exact:true}).fill(privateEnv['STAGING_'+kind+'_EMAIL']);
        await login.getByPlaceholder('Password',{exact:true}).fill(privateEnv['STAGING_'+kind+'_PASSWORD']);
        await login.getByRole('button',{name:'Sign in',exact:true}).click();
        await login.waitForURL(kind==='ADMIN'?'**/admin/v2':'**/operator/v2',{timeout:45000});
        await login.getByRole('heading',{level:1}).waitFor();await context.close();
      }
    });
    await additional('Phone quick availability, enquiry response and offer/price edits persist', async()=>{
      await page.setViewportSize({width:390,height:900});
      await page.goto(process.env.VERIFY_FRONTEND_URL+'/operator/v2/availability');
      page.once('dialog',dialog=>dialog.accept('3'));
      await page.getByRole('button',{name:'Quick update',exact:true}).first().click();
      await page.getByText('Availability updated.',{exact:true}).waitFor();
      await page.goto(process.env.VERIFY_FRONTEND_URL+'/operator/v2/enquiries');
      await page.getByPlaceholder('Internal/operator response note').first().fill('Render mobile acceptance');
      await page.getByRole('button',{name:'Accept',exact:true}).first().click();
      await page.getByText('Enquiry updated.',{exact:true}).waitFor();
      assert.ok(await Enquiry.exists({organisation:org._id,'statusHistory.note':'Render mobile acceptance'}));
      await page.goto(process.env.VERIFY_FRONTEND_URL+'/operator/v2/liveaboards/'+vessel._id);
      const replies=['4','12','1300'];const handle=dialog=>dialog.accept(replies.shift());page.on('dialog',handle);
      await page.getByRole('button',{name:'Quick update',exact:true}).first().click();
      await page.getByText('Departure updated.',{exact:true}).waitFor();page.off('dialog',handle);
      const latest=await Departure.findById(dep._id);assert.equal(latest.priceOverrides[0].amount,1300);assert.equal(latest.offers[0].percent,12);
    });
    if(results.some(item=>item.status==='failed')) process.exitCode=1;
  } catch (error) {
    results.push({ label: String(error.message).replace(/member-invitations\/[^/ :]+/g, 'member-invitations/[REDACTED]'), status: 'failed' });
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    const reportDir = path.join(__dirname, '../../docs/phase3/evidence');
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, 'phase3-render-results-2026-11-02.json'), JSON.stringify({ testedAt: new Date().toISOString(), scope: 'Render HTTPS API/browser checks; uniquely named fixtures in dedicated staging database; no real emails or global migration apply', fixturePrefix: run, results }, null, 2) + '\n');
  }
})().catch(error => { console.error('Staging verification failed; see redacted result report.'); process.exitCode = 1; });
