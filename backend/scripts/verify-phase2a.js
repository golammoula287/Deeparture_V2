// Phase 2A staging/local verification. Creates uniquely named fixtures and removes them.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const config = require("../src/config");
const app = require("../src/app");
const Organisation = require("../src/v2/models/organisation.model");
const Vessel = require("../src/v2/models/vessel.model");
const Resort = require("../src/v2/models/resort.model");
const Itinerary = require("../src/v2/models/itinerary.model");
const Departure = require("../src/v2/models/departure.model");
const Enquiry = require("../src/v2/models/enquiry.model");
const ImportBatch = require("../src/v2/models/importBatch.model");
const AuditLog = require("../src/v2/models/auditLog.model");

const run = crypto.randomBytes(5).toString("hex");
const prefix = `Phase2A Verify ${run}`;
const email = `phase2a-${run}@example.test`;
let server, origin, orgId, browser;
const results = [];
const extraIds = { locations: [], attributes: [], batches: [] };
let passed = 0;
const pass = (label) => { passed += 1; results.push({label,status:"passed"}); console.log(`PASS ${label}`); };
const api = async (path, token, body, method) => {
  const response = await fetch(origin + path, {
    method: method || (body ? "POST" : "GET"),
    headers: { ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const json = await response.json();
  return { httpStatus: response.status, ...json };
};
const ok = async (path, token, body, method) => {
  const result = await api(path, token, body, method);
  assert.ok(result.httpStatus < 300 && result.success !== false, `${path}: ${result.httpStatus} ${result.message || ""}`);
  return result.data;
};

(async () => {
  try {
    await mongoose.connect(config.database_url);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    if (process.env.EMAIL_DELIVERY_MODE && process.env.EMAIL_DELIVERY_MODE !== "test") throw new Error("Run verification with EMAIL_DELIVERY_MODE=test");
    server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
    origin = `http://127.0.0.1:${server.address().port}`;

    const login = await ok("/api/auth/login", null, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const token = login.token;
    assert.equal(login.user.role, "admin");
    await ok("/api/v2/admin/dashboard", token);
    pass("admin login and Admin V2 dashboard API");

    const org = await ok("/api/v2/admin/organisations", token, { name: `${prefix} Operator`, primaryEmail: email, website: `https://${run}.example.test` });
    orgId = org._id;
    assert.equal(org.status, "unclaimed");
    assert.equal(org.accountStatus, "active");
    pass("unclaimed operator organisation creation");

    const vessel = await ok("/api/v2/admin/catalog/liveaboards", token, { organisation: orgId, name: `${prefix} Vessel`, summary: "Verification vessel" });
    const resort = await ok("/api/v2/admin/catalog/resorts", token, { organisation: orgId, name: `${prefix} Resort`, summary: "Verification resort" });
    assert.equal(vessel.listingStatus, "draft");
    assert.equal(resort.listingStatus, "draft");
    pass("draft liveaboard and resort creation");

    const preview = await ok("/api/v2/admin/catalog/import/preview", token, {
      productType: "vessel",
      rows: [{ operatorName: `${prefix} Operator`, operatorEmail: email, vesselName: `${prefix} Imported Vessel`, destinations: "raja-ampat" }],
    });
    assert.equal(preview.summary.create, 1);
    assert.equal(await Vessel.countDocuments({ name: `${prefix} Imported Vessel` }), 0);
    const committed = await ok(`/api/v2/admin/catalog/import-batches/${preview.batchId}/commit`, token, {});
    assert.equal(committed.summary.committed, 1);
    const imported = await Vessel.findOne({ name: `${prefix} Imported Vessel` });
    assert.ok(imported);
    assert.equal(imported.listingStatus, "draft");
    pass("normalized catalogue preview then explicit commit");

    const itinerary = await ok(`/api/v2/organisations/${orgId}/itineraries`, token, { vessel: vessel._id, name: `${prefix} Itinerary`, numberOfNights: 7, basePrices: [] });
    const start = new Date(); start.setUTCFullYear(start.getUTCFullYear() + 1);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7);
    const departure = await ok(`/api/v2/organisations/${orgId}/departures`, token, {
      itinerary: itinerary._id, startDate: start.toISOString(), endDate: end.toISOString(),
      availability: [{ status: "limited", spacesAvailable: 2, sourceType: "admin_manual", sourceReference: "phase2a-verification" }],
    });
    assert.equal(departure.availability[0].spacesAvailable, 2);
    assert.equal(departure.availability[0].sourceType, "admin_manual");
    assert.ok(departure.availabilityUpdatedAt);
    const departure2 = await ok(`/api/v2/organisations/${orgId}/departures/${departure._id}`, token, {
      availability: [{ status: "available", spacesAvailable: 4, sourceType: "admin_manual", sourceReference: "phase2a-verification" }],
    }, "PATCH");
    assert.equal(departure2.availability.length, 1);
    assert.equal(departure2.availability[0].spacesAvailable, 4);
    pass("normalized availability replace/upsert path with source metadata");

    await ok(`/api/v2/admin/catalog/resorts/${resort._id}/status`, token, { listingStatus: "published" }, "PATCH");
    const enquiry = await ok("/api/v2/enquiries", null, { productType: "resort", product: resort._id, customer: { name: "Phase2A Customer", email: "customer@example.test", guests: 2 }, message: "Verification enquiry" });
    assert.equal(enquiry.status, "new");
    const approved = await ok(`/api/v2/admin/enquiries/${enquiry._id}/approve`, token, {});
    assert.equal(approved.status, "sent_to_operator");
    pass("Admin-first enquiry moderation flow");

    const previewData = await ok(`/api/v2/admin/catalog/liveaboards/${vessel._id}/preview`, token);
    assert.equal(previewData.name, vessel.name);
    pass("draft listing preview endpoint");


    const User = require('../src/models/user.model');
    const Membership = require('../src/v2/models/organisationMembership.model');
    const ClaimToken = require('../src/v2/models/claimToken.model');
    const Location = require('../src/v2/models/location.model');
    const Attribute = require('../src/v2/models/attributeDefinition.model');
    const transport = require('../src/config/smtp');
    const originalSend = transport.sendMail.bind(transport);
    const messages = [];
    transport.sendMail = async mail => {const result=await originalSend(mail);messages.push(JSON.parse(result.message));return result;};
    assert.equal((await api('/api/v2/admin/dashboard')).httpStatus,401);
    const demoLogin=await ok('/api/auth/login',null,{email:process.env.DEMO_OPERATOR_EMAIL,password:process.env.DEMO_OPERATOR_PASSWORD});
    for(const path of ['/dashboard','/catalog/liveaboards','/catalog/resorts','/organisations','/locations','/attributes','/enquiries'])assert.equal((await api('/api/v2/admin'+path,demoLogin.token)).httpStatus,403);
    pass('anonymous and operator access denied across Admin V2 APIs');

    const counts=(await ok('/api/v2/admin/dashboard',token)).counts;
    assert.equal(counts.liveaboards,await Vessel.countDocuments({listingStatus:{$ne:'archived'}}));
    assert.equal(counts.claimed,await Organisation.countDocuments({type:'operator',status:{$in:['claimed','verified']}}));
    assert.equal(counts.enquiries,await Enquiry.countDocuments({status:'new'}));
    pass('admin dashboard counts agree with persisted catalogue, claim states and enquiry queue');
    for(const [kind,item] of [['liveaboards',vessel],['resorts',resort]]){
      for(const status of ['draft','pending_review','restricted','archived','published']){
        await ok(`/api/v2/admin/catalog/${kind}/${item._id}/status`,token,{listingStatus:status},'PATCH');
        assert.equal((await api(`/api/v2/${kind}/${item.slug}`)).httpStatus,status==='published'?200:404);
      }
      const listed=await ok(`/api/v2/admin/catalog/${kind}?organisation=${orgId}&q=${encodeURIComponent(prefix)}&status=published&limit=1`,token);
      assert.equal(listed.items.length,1);assert.equal(listed.limit,1);
    }
    pass('global catalogue filtering, pagination, all moderation states and published-only public access');

    const invite=await ok(`/api/v2/claims/organisations/${orgId}/invite`,token,{email});
    const rawToken=new URL(invite.claimUrl).searchParams.get('token');
    const password=crypto.randomBytes(20).toString('hex');
    assert.notEqual((await ClaimToken.findOne({organisation:orgId})).tokenHash,rawToken);
    const claimed=await ok('/api/v2/claims/accept',null,{token:rawToken,password,fullName:prefix});
    assert.equal(String(claimed.organisation._id),String(orgId));
    assert.equal((await api('/api/v2/claims/accept',null,{token:rawToken,password})).httpStatus,400);
    const owner=(await ok('/api/auth/login',null,{email,password})).token;
    assert.equal(await Organisation.countDocuments({_id:orgId}),1);assert.equal(await Membership.countDocuments({organisation:orgId}),1);
    await ok(`/api/v2/admin/organisations/${orgId}`,token,{accountStatus:'suspended'},'PATCH');
    assert.equal((await api(`/api/v2/organisations/${orgId}/dashboard`,owner)).httpStatus,403);
    await ok(`/api/v2/admin/organisations/${orgId}`,token,{accountStatus:'active'},'PATCH');
    await ok(`/api/v2/organisations/${orgId}/dashboard`,owner);
    pass('claim creates owner on existing organisation; tokens cannot replay; suspension and reactivation enforced');

    const csvForm=new FormData();csvForm.set('productType','vessel');csvForm.set('file',new Blob([`operatorName,operatorEmail,vesselName\n${prefix} Operator,${email},${prefix} CSV Boat`]),'catalog.csv');
    const csvPreview=await ok('/api/v2/admin/catalog/import-file/preview',token,csvForm);extraIds.batches.push(csvPreview.batchId);
    assert.equal(csvPreview.summary.create,1);
    const simultaneous=await Promise.all([api(`/api/v2/admin/catalog/import-batches/${csvPreview.batchId}/commit`,token,{}),api(`/api/v2/admin/catalog/import-batches/${csvPreview.batchId}/commit`,token,{})]);
    assert.deepEqual(simultaneous.map(x=>x.httpStatus).sort(),[200,409]);
    const batch=await ok(`/api/v2/admin/catalog/import-batches/${csvPreview.batchId}`,token);
    assert.equal(batch.results.length,1);assert.equal(batch.results[0].productId,simultaneous.find(x=>x.httpStatus===200).data.successes[0].productId);
    pass('CSV upload, atomic single commit and durable batch row outcomes');

    const ExcelJS=require('exceljs');const workbook=new ExcelJS.Workbook();
    const operators=workbook.addWorksheet('Operators');operators.addRow(['operatorKey','operatorName','operatorEmail']);operators.addRow(['o1',`${prefix} Operator`,email]);
    const sheet=workbook.addWorksheet('Resorts');sheet.addRow(['operatorKey','resortName']);sheet.addRow(['o1',`${prefix} XLSX Resort`]);
    const form=new FormData();form.set('productType','resort');form.set('file',new Blob([await workbook.xlsx.writeBuffer()]),'catalog.xlsx');
    const workbookPreview=await ok('/api/v2/admin/catalog/import-file/preview',token,form);extraIds.batches.push(workbookPreview.batchId);
    assert.equal(workbookPreview.summary.create,1);assert.equal(await Resort.countDocuments({name:`${prefix} XLSX Resort`}),0);
    const xlsxResult=await ok(`/api/v2/admin/catalog/import-batches/${workbookPreview.batchId}/commit`,token,{});
    const xlsxRecord=await Resort.findById(xlsxResult.successes[0].productId);assert.equal(xlsxRecord.listingStatus,'draft');assert.equal(String(xlsxRecord.organisation),String(orgId));
    pass('XLSX Operators/Resorts adapter, no catalogue writes before confirmation, matched organisation and draft default');
    const reimport=await ok('/api/v2/admin/catalog/import/preview',token,{productType:'resort',rows:[{operatorName:`${prefix} Operator`,operatorEmail:email,resortName:xlsxRecord.name}]});extraIds.batches.push(reimport.batchId);
    assert.equal(reimport.summary.update,1);const reResult=await ok(`/api/v2/admin/catalog/import-batches/${reimport.batchId}/commit`,token,{});assert.equal(reResult.successes[0].productId,String(xlsxRecord._id));
    const badPreview=await ok('/api/v2/admin/catalog/import/preview',token,{productType:'vessel',rows:[{operatorName:`${prefix} Operator`,operatorEmail:email,vesselName:vessel.name},{operatorName:`${prefix} Operator`,operatorEmail:email,vesselName:vessel.name},{operatorName:'Missing product'},{skip:true}]});extraIds.batches.push(badPreview.batchId);
    assert.equal(badPreview.summary.update,1);assert.equal(badPreview.summary.duplicateReview,1);assert.equal(badPreview.summary.error,1);assert.equal(badPreview.summary.skip,1);
    assert.equal((await api(`/api/v2/admin/catalog/import-batches/${badPreview.batchId}/commit`,token,{})).httpStatus,400);
    pass('idempotent reimport and CREATE/UPDATE/DUPLICATE_REVIEW/ERROR/SKIP preview classification');

    const attr=await ok('/api/v2/admin/attributes',token,{key:'phase2a_'+run,label:prefix+' Attribute',group:'facility',dataType:'boolean',applicableTo:['both']});extraIds.attributes.push(attr._id);
    const attrEdit=await ok('/api/v2/admin/attributes/'+attr._id,token,{label:prefix+' Edited',filterable:false,visibleOnPage:false,applicableTo:['resort'],dataType:'select',options:['yes','no'],active:false},'PATCH');
    assert.equal(attrEdit.active,false);assert.equal(attrEdit.filterable,false);assert.equal(attrEdit.visibleOnPage,false);assert.deepEqual(attrEdit.options,['yes','no']);
    assert.ok((await ok('/api/v2/admin/attributes',token)).some(x=>x._id===attr._id));assert.ok(!(await ok('/api/v2/attributes')).some(x=>x._id===attr._id));
    pass('attribute edit, data type/options, applicability, filter/public flags and inactive admin visibility');
    const loc=await ok('/api/v2/admin/locations',token,{name:prefix+' Destination',type:'destination',aliases:[prefix+' Alias']});extraIds.locations.push(loc._id);
    assert.equal((await api('/api/v2/admin/locations',token,{name:(prefix+' Alias').toUpperCase(),type:'destination'})).httpStatus,409);
    await ok('/api/v2/admin/locations/'+loc._id,token,{name:prefix+' Renamed'},'PATCH');
    assert.equal((await api('/api/v2/admin/locations/'+loc._id,token,{parent:loc._id},'PATCH')).httpStatus,400);
    const mapped=await ok('/api/v2/admin/catalog/liveaboards/'+vessel._id,token,{destinationLocations:[loc._id]},'PATCH');
    assert.deepEqual(mapped.destinationSlugs,[loc.slug]);assert.equal((await ok('/api/v2/liveaboards?destination='+loc.slug)).total,1);
    pass('canonical location edit, alias/case duplicate rejection, cycle prevention and compatible slug search');

    messages.length=0;
    const newEnquiry=await ok('/api/v2/enquiries',null,{productType:'resort',product:resort._id,customer:{name:prefix+' Approve',email:'customer@example.test',guests:2},message:'Admin-first test',status:'confirmed',notificationInFlight:true});
    assert.equal(newEnquiry.status,'new');assert.equal(newEnquiry.notificationInFlight,false);
    assert.ok(messages.some(m=>m.to.some(t=>t.address==='customer@example.test')));assert.ok(messages.some(m=>m.to.some(t=>t.address===process.env.ADMIN_EMAIL)));assert.ok(!messages.some(m=>m.to.some(t=>t.address===email)));
    assert.ok(!(await ok(`/api/v2/organisations/${orgId}/dashboard`,owner)).enquiries.some(e=>e._id===newEnquiry._id));
    assert.equal((await api(`/api/v2/admin/enquiries/${newEnquiry._id}/status`,token,{status:'confirmed'},'PATCH')).httpStatus,400);
    await ok(`/api/v2/admin/enquiries/${newEnquiry._id}/approve`,token,{});
    assert.ok(messages.some(m=>m.to.some(t=>t.address===email)));
    assert.ok((await ok(`/api/v2/organisations/${orgId}/dashboard`,owner)).enquiries.some(e=>e._id===newEnquiry._id));
    await ok(`/api/v2/admin/enquiries/${newEnquiry._id}/status`,token,{status:'closed'},'PATCH');
    assert.equal((await api(`/api/v2/admin/enquiries/${newEnquiry._id}/approve`,token,{})).httpStatus,400);
    pass('enquiries withheld from operator email AND dashboard until approval; receipt notifications and invalid transition guards');
    transport.sendMail=async()=>{throw new Error('Simulated mail failure');};
    const failedMail=await ok('/api/v2/enquiries',null,{productType:'resort',product:resort._id,customer:{name:prefix+' Failed mail',email:'customer@example.test'},message:'Persist despite email failure'});
    assert.ok(await Enquiry.exists({_id:failedMail._id}));assert.equal((await api(`/api/v2/admin/enquiries/${failedMail._id}/approve`,token,{})).httpStatus,502);
    assert.equal((await Enquiry.findById(failedMail._id)).status,'admin_approved');
    transport.sendMail=originalSend;await ok(`/api/v2/admin/enquiries/${failedMail._id}/approve`,token,{});
    pass('email failure retains enquiry and approval can retry without losing the lead');

    const Cabin=require('../src/v2/models/cabinType.model');
    const cabins=await Cabin.create([{organisation:orgId,vessel:vessel._id,name:'A'},{organisation:orgId,vessel:vessel._id,name:'B'}]);
    await ok(`/api/v2/organisations/${orgId}/departures/${departure._id}`,token,{availability: cabins.map(c=>({cabinType:c._id,spacesAvailable:3,totalSpaces:6,status:'available'}))},'PATCH');
    const patched=await ok(`/api/v2/organisations/${orgId}/departures/${departure._id}`,token,{availability:[{cabinType:cas(cabins[0]),spacesAvailable:1,sourceType:'admin_manual'}]},'PATCH');
    function cas(c){return c._id.toString();}
    assert.equal(patched.availability.find(x=>x.cabinType===cas(cabins[1])).spacesAvailable,3);
    assert.equal(patched.availability.filter(x=>x.cabinType===cas(cabins[0])).length,1);
    assert.ok(patched.availability.find(x=>x.cabinType===cas(cabins[0])).receivedAt);
    assert.equal((await api(`/api/v2/organisations/${orgId}/departures/${departure._id}`,token,{availability:[{spacesAvailable:-1}]},'PATCH')).httpStatus,400);
    const publicBoat=await ok('/api/v2/liveaboards/'+vessel.slug);assert.ok(publicBoat.departures[0].availability[0].sourceType);
    pass('partial cabin inventory upsert preserves other cabins and source timestamps; invalid quantities rejected');
    assert.ok(await AuditLog.exists({entityId:csvPreview.batchId,action:'catalog.import.commit'}));
    assert.ok(await AuditLog.exists({organisation:orgId,action:'vessel.status'}));assert.ok(await AuditLog.exists({organisation:orgId,action:'enquiry.approved'}));
    const logs=JSON.stringify(await AuditLog.find({organisation:orgId}).lean());assert.ok(!logs.includes(rawToken));assert.ok(!logs.includes(password));
    pass('moderation, import and enquiry audit records exist without raw invitation tokens or passwords');

    if(process.argv.includes('--browser')) {
      const {chromium}=require('../../frontend/node_modules/@playwright/test');browser=await chromium.launch({headless:true,...(process.env.VERIFY_BROWSER_CHANNEL?{channel:process.env.VERIFY_BROWSER_CHANNEL}:{})});
      const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const frontend=process.env.VERIFY_FRONTEND_URL||'http://localhost:3019';
      await page.goto(frontend+'/admin/v2');await page.waitForURL('**/login');
      await page.evaluate(t=>localStorage.setItem('access-token','Bearer '+t),demoLogin.token);await page.goto(frontend+'/admin/v2');await page.getByRole('alert').filter({hasText:'An admin account is required'}).waitFor();
      await page.evaluate(()=>localStorage.clear());await page.goto(frontend+'/login');await page.getByPlaceholder('Email',{exact:true}).fill(process.env.ADMIN_EMAIL);await page.getByPlaceholder('Password',{exact:true}).fill(process.env.ADMIN_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/admin/v2');await page.getByRole('heading',{name:'Admin Dashboard',exact:true}).waitFor();
      pass('browser guest redirect, operator denial and admin login to dedicated Admin V2');
      const paths=['','/liveaboards','/resorts','/operators','/attributes','/locations','/enquiries','/import','/liveaboards/'+vessel._id,'/resorts/'+resort._id,'/preview/liveaboard/'+vessel._id,'/preview/resort/'+resort._id];
      for(const width of [1440,768,390]){await page.setViewportSize({width,height:900});for(const path of paths){await page.goto(frontend+'/admin/v2'+path);await page.locator('main h1').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'Overflow '+width+' '+path);}}
      pass('all Admin V2 routes, listing editors and previews render at desktop/tablet/phone widths');
      await page.goto(frontend+'/admin/v2/attributes');await page.getByLabel('Label',{exact:true}).fill(prefix+' Browser attribute');await page.getByRole('button',{name:'Create',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved'}).waitFor();
      const attrArticle=page.locator('article').filter({hasText:prefix+' Browser attribute'});await attrArticle.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Public display').uncheck();await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('status').filter({hasText:'Saved'}).waitFor();
      pass('attribute creation and editing through Admin UI');
      await page.goto(frontend+'/admin/v2/locations');const locArticle=page.locator('article').filter({hasText:prefix+' Renamed'});await locArticle.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Name',{exact:true}).fill(prefix+' UI Location');await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('status').filter({hasText:'Saved'}).waitFor();assert.equal((await Location.findById(loc._id)).name,prefix+' UI Location');
      await page.goto(frontend+'/admin/v2/operators');await page.getByLabel('Search records').fill(prefix+' Operator');const orgArticle=page.locator('article').filter({hasText:prefix+' Operator'});await orgArticle.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Phone',{exact:true}).fill('0123456789');await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('status').filter({hasText:'Saved'}).waitFor();assert.equal((await Organisation.findById(orgId)).phone,'0123456789');
      await orgArticle.getByRole('button',{name:'Suspend',exact:true}).click();await orgArticle.getByRole('button',{name:'Reactivate',exact:true}).waitFor();await orgArticle.getByRole('button',{name:'Reactivate',exact:true}).click();await orgArticle.getByRole('button',{name:'Suspend',exact:true}).waitFor();
      pass('phone location/profile editing and organisation suspend/reactivate controls');

      await page.goto(frontend+'/admin/v2/import');await page.locator('input[type=file]').setInputFiles({name:'browser.csv',mimeType:'text/csv',buffer:Buffer.from(`operatorName,operatorEmail,vesselName\n${prefix} Operator,${email},${prefix} Browser Boat`)});await page.getByRole('button',{name:'Create preview'}).click();await page.getByRole('button',{name:'Confirm import'}).waitFor();assert.equal(await Vessel.countDocuments({name:prefix+' Browser Boat'}),0);await page.getByRole('button',{name:'Confirm import'}).click();await page.getByText('Committed 1; errors 0.',{exact:true}).waitFor();
      const browserBoat=await Vessel.findOne({name:prefix+' Browser Boat'});assert.equal(browserBoat.listingStatus,'draft');
      await page.goto(frontend+'/admin/v2/liveaboards');await page.getByLabel('Search listings').fill(prefix+' Browser Boat');await page.getByRole('button',{name:'Filter',exact:true}).click();const article=page.locator('article').filter({hasText:prefix+' Browser Boat'});await article.getByRole('button',{name:'Publish',exact:true}).click();await article.getByRole('button',{name:'Unpublish',exact:true}).waitFor();
      await page.goto(frontend+'/liveaboards/'+browserBoat.slug);await page.getByRole('heading',{name:prefix+' Browser Boat',exact:true}).waitFor();
      pass('browser CSV preview/confirm, phone moderation and automatically rendered published page');
      const uiEnquiry=await ok('/api/v2/enquiries',null,{productType:'resort',product:resort._id,customer:{name:prefix+' UI enquiry',email:'customer@example.test'},message:'Browser approval'});
      await page.goto(frontend+'/admin/v2/enquiries');const enquiryArticle=page.locator('article').filter({hasText:prefix+' UI enquiry'});await enquiryArticle.getByRole('button',{name:'Approve & send to operator'}).click();await page.getByText('Enquiry approved and sent to operator',{exact:true}).waitFor();assert.equal((await Enquiry.findById(uiEnquiry._id)).status,'sent_to_operator');
      pass('phone enquiry approval UI sends enquiry to the operator');
      await page.getByRole('button',{name:'Logout',exact:true}).click();await page.waitForURL('**/login');assert.equal(await page.evaluate(()=>localStorage.getItem('access-token')),null);
      assert.deepEqual(errors,[]);pass('admin logout and no browser runtime errors');
    }

    console.log(`VERIFIED ${passed} Phase 2A groups`);
  } finally {
    if(browser) await browser.close();
    if (orgId) {
      await Enquiry.deleteMany({ organisation: orgId });
      await Departure.deleteMany({ organisation: orgId });
      await Itinerary.deleteMany({ organisation: orgId });
      await Vessel.deleteMany({ organisation: orgId });
      await Resort.deleteMany({ organisation: orgId });
      await AuditLog.deleteMany({ organisation: orgId });
      for(const model of ['cabinType','organisationMembership','claimToken'])await require('../src/v2/models/'+model+'.model').deleteMany({organisation:orgId});
      await require('../src/models/user.model').deleteMany({email});
      await Organisation.deleteOne({ _id: orgId });
    }
    await require('../src/v2/models/location.model').deleteMany({_id:{$in:extraIds.locations}});
    await require('../src/v2/models/attributeDefinition.model').deleteMany({$or:[{_id:{$in:extraIds.attributes}},{label:prefix+' Browser attribute'}]});
    await ImportBatch.deleteMany({_id:{$in:extraIds.batches}});
    await ImportBatch.deleteMany({ "rows.organisation.primaryEmail": email });
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
})().catch((error) => { results.push({label:error.message,status:'failed'});console.error(`FAIL ${error.stack || error.message}`); process.exitCode = 1; }).finally(()=>{
 if(process.env.VERIFY_REPORT_PATH)require('node:fs').writeFileSync(process.env.VERIFY_REPORT_PATH,JSON.stringify({testedAt:new Date().toISOString(),scope:'isolated local Phase 2A; Render deployment not verified',passed,results},null,2));
});
