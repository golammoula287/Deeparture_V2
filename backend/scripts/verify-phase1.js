// Creates uniquely named verification fixtures and removes only those fixtures in finally.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const config = require('../src/config');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Membership = require('../src/v2/models/organisationMembership.model');
const Organisation = require('../src/v2/models/organisation.model');
const { parseSpreadsheet } = require('../src/v2/services/bulkFile.service');
const ExcelJS = require('exceljs');
const run = crypto.randomBytes(6).toString('hex');
const prefix = 'Phase1 Verify ' + run;
const email = 'phase1-' + run + '@example.test';
const password = crypto.randomBytes(24).toString('base64url');
let server, origin, fixtureOrg, fixtureUser, browser;
let passed = 0;
const results = [];
function pass(label) { passed++; results.push({label, status:'passed'}); console.log('PASS ' + label); }
async function api(path, token, body, method) {
 const r = await fetch(origin + path, { method: method || (body ? 'POST' : 'GET'), headers: { ...(body && !(body instanceof FormData) ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:'Bearer '+token}: {}) }, ...(body ? {body:body instanceof FormData ? body : JSON.stringify(body)}:{}), signal:AbortSignal.timeout(30000) });
 const j = await r.json(); return { status:r.status, ...j };
}
async function ok(path, token, body, method) { const r=await api(path,token,body,method); assert.ok(r.status<300 && r.success!==false, path+' failed: '+r.status+' '+(r.message||'')); return r.data; }
async function login(email,password) { const data=await ok('/api/auth/login',null,{email,password}); return data.token; }
function csv(rows) { const keys=Object.keys(rows[0]); return [keys,...rows.map(r=>keys.map(k=>r[k]??''))].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n'); }
function form(text, productType) { const f=new FormData();f.set('file',new Blob([text],{type:'text/csv'}),'verify.csv'); if(productType)f.set('productType',productType);return f; }
(async()=>{
 try {
 await mongoose.connect(config.database_url);
 if (process.env.EMAIL_DELIVERY_MODE !== 'test') throw new Error('Verification requires EMAIL_DELIVERY_MODE=test');
 server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});origin='http://127.0.0.1:'+server.address().port;
 assert.equal((await api('/health')).status,200);pass('API health');
 assert.equal((await api('/api/auth/me','invalid-token')).status,401);
 const expired=require('jsonwebtoken').sign({userId:new mongoose.Types.ObjectId().toString()},config.jwt_secret,{expiresIn:-1});
 assert.equal((await api('/api/auth/me',expired)).status,401);pass('invalid and expired tokens rejected with 401');
 const admin=await login(process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD);
 const demo=await login(process.env.DEMO_OPERATOR_EMAIL,process.env.DEMO_OPERATOR_PASSWORD);
 assert.equal((await ok('/api/auth/me',admin)).role,'admin');assert.equal((await ok('/api/auth/me',demo)).role,'operator');pass('admin and operator login, token validation');
 assert.equal((await api('/api/auth/login',null,{email:process.env.ADMIN_EMAIL,password:'deliberately-wrong-'+run})).status,401);
 for(const p of ['/api/auth/me','/api/v2/admin/catalog/template-fields','/api/v2/organisations/mine'])assert.equal((await api(p)).status,401);
 assert.equal((await api('/api/v2/admin/catalog/template-fields',demo)).status,403);pass('invalid passwords, anonymous access, admin-only permission');
 await ok('/api/v2/admin/catalog/template-fields',admin);
 const attrs=await ok('/api/v2/attributes');assert.ok(Array.isArray(attrs)?attrs.length>0:Object.keys(attrs).length>0);
 const member=await ok('/api/v2/organisations/mine',demo);assert.ok(member.length);const demoOrg=member[0].organisation._id;
 const dash=await ok('/api/v2/organisations/'+demoOrg+'/dashboard',demo);assert.ok(dash.vessels.length&&dash.resorts.length);pass('seed attributes and operator organisation dashboard');
 const vessel=await ok('/api/v2/liveaboards/demo-explorer');assert.equal(vessel.departures[0].effectiveMinPriceUsd,4950);assert.equal(vessel.departures[0].availability[0].spacesAvailable,6);await ok('/api/v2/resorts/demo-dive-resort');pass('demo detail pages data, 4950 USD pricing, six available spaces');
 const boats=[1,2].map(i=>({operatorName:prefix,operatorEmail:email,vesselName:prefix+' Boat '+i,destinations:'phase1-verification',facilities:'wifi',publish:true}));
 const imported=await ok('/api/v2/admin/catalog/import-file',admin,form(csv(boats),'vessel'));assert.equal(imported.imported,2);assert.equal(imported.failed,0);fixtureOrg=imported.successes[0].organisationId;assert.equal(imported.successes[1].organisationId,fixtureOrg);
 const importedOrg=await Organisation.findById(fixtureOrg);assert.equal(importedOrg.status,'unclaimed');assert.equal(importedOrg.source,'deeparture_import');assert.ok(importedOrg.lastCheckedAt);
 assert.equal((await ok('/api/v2/liveaboards/'+imported.successes[0].slug)).source,'deeparture_import');
 pass('catalogue-first unclaimed organisation, published page and import provenance');
 const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('Resorts');ws.addRow(['operatorName','operatorEmail','resortName','destinations','publish']);ws.addRow([prefix,email,prefix+' Resort','phase1-verification',true]);const buf=await wb.xlsx.writeBuffer();assert.equal((await parseSpreadsheet({originalname:'verify.xlsx',buffer:buf})).length,1);
 const f=new FormData();f.set('file',new Blob([buf]),'verify.xlsx');f.set('productType','resort');const resorts=await ok('/api/v2/admin/catalog/import-file',admin,f);assert.equal(resorts.imported,1);assert.equal(resorts.successes[0].organisationId,fixtureOrg);pass('CSV two-vessel and XLSX resort import, shared organisation matching');
 fixtureUser=await User.create({fullName:prefix,email,password,role:'operator',isValid:true});await Membership.create({user:fixtureUser._id,organisation:fixtureOrg,role:'owner',status:'active'});const owner=await login(email,password);
 assert.equal((await api('/api/v2/organisations/'+fixtureOrg+'/dashboard',demo)).status,403);assert.equal((await api('/api/v2/organisations/'+demoOrg+'/dashboard',owner)).status,403);pass('operators cannot access another organisation');
 const route='/api/v2/organisations/'+fixtureOrg;
 for (const [collection,id] of [['vessels',imported.successes[0].productId],['resorts',resorts.successes[0].productId]]) {
  for (const field of ['veganRating','environmentalRating','verificationStatus','listingStatus']) {
   const value=field.endsWith('Rating')?5:field==='listingStatus'?'published':'deeparture_verified';
   assert.equal((await api(route+'/'+collection+'/'+id,owner,{[field]:value},'PATCH')).status,403);
  }
 }
 pass('operators cannot self-award editorial ratings, verification or publication');
 const invitationPath='/api/v2/claims/organisations/'+fixtureOrg+'/invite';
 assert.equal((await api(invitationPath,owner,{email})).status,403);
 const invitation=await ok(invitationPath,admin,{email});const claimToken=new URL(invitation.claimUrl).searchParams.get('token');
 const ClaimToken=require('../src/v2/models/claimToken.model');
 const stored=await ClaimToken.findOne({organisation:fixtureOrg});assert.notEqual(stored.tokenHash,claimToken);
 assert.equal((await api('/api/v2/claims/accept',null,{token:claimToken,password:'wrong-password'})).status,401);
 const claims=await Promise.all([api('/api/v2/claims/accept',null,{token:claimToken,password}),api('/api/v2/claims/accept',null,{token:claimToken,password})]);
 assert.deepEqual(claims.map(x=>x.status).sort(),[200,400]);
 assert.equal(await Membership.countDocuments({organisation:fixtureOrg,user:fixtureUser._id}),1);
 await login(email,password);
 const expiredInvite=await ok(invitationPath,admin,{email});await ClaimToken.updateMany({organisation:fixtureOrg,usedAt:{$exists:false}},{$set:{expiresAt:new Date(0)}});
 assert.equal((await api('/api/v2/claims/accept',null,{token:new URL(expiredInvite.claimUrl).searchParams.get('token'),password})).status,400);
 pass('claim invitations are admin-only, hashed, expiring, single-use and preserve existing credentials and ownership');
 const again=await ok('/api/v2/admin/catalog/import-file',admin,form(csv(boats),'vessel'));
 assert.deepEqual(again.successes.map(x=>x.productId),imported.successes.map(x=>x.productId));pass('catalogue reimport preserves product IDs');
 const itineraries=boats.map((b,i)=>({vesselName:b.vesselName,itineraryName:'Verification Trip '+(i+1),cabinName:'Deluxe',basePrice:5500,currency:'USD',numberOfNights:7,destinations:'phase1-verification'}));
 assert.equal((await ok(route+'/import/itineraries',owner,form(csv(itineraries)))).imported,2);
 const start=new Date();start.setUTCFullYear(start.getUTCFullYear()+1);const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);
 const departures=[0,1,2].map((i)=>({vesselName:boats[i%2].vesselName,itineraryName:'Verification Trip '+(i%2+1),cabinName:'Deluxe',departureCode:run+'-'+i,startDate:start.toISOString(),endDate:end.toISOString(),spacesAvailable:i===2?0:6,totalSpaces:16,offerPercent:i===0?10:'',priceOverride:i===1?6000:'',currency:'USD'}));
 const deps=await ok(route+'/import/departures',owner,{rows:departures});assert.equal(deps.imported,3);assert.equal(deps.items[0].effectiveMinPriceUsd,4950);assert.equal(deps.items[1].effectiveMinPriceUsd,6000);assert.equal(deps.items[2].availability[0].status,'sold_out');pass('itinerary, cabin, three departures, override, discount and sold-out imports');
 const rep=await ok(route+'/import/itineraries',owner,{rows:[{...itineraries[0],basePrice:6000}]});assert.equal(rep.imported,1);
 const refreshed=await ok('/api/v2/liveaboards/'+imported.successes[0].slug);assert.equal(refreshed.departures.find(d=>d.externalCode===run+'-0').effectiveMinPriceUsd,5400);pass('itinerary reimport refreshes existing departure pricing');
 const depId=deps.items[0]._id;
 const foreignCabin=vessel.itineraries[0].basePrices[0].cabinType._id;
 assert.equal((await api(route+'/departures/'+depId,owner,{availability:[{cabinType:foreignCabin,spacesAvailable:1}]},'PATCH')).status,400);
 pass('cross-organisation cabin references rejected');
 assert.equal((await api(route+'/departures/'+depId,owner,{organisation:demoOrg},'PATCH')).status,400);
 assert.equal((await api(route+'/vessels/'+imported.successes[0].productId,owner,{organisation:demoOrg},'PATCH')).status,400);pass('inventory ownership cannot be transferred by a request body');
 await Membership.updateOne({user:fixtureUser._id,organisation:fixtureOrg},{$set:{role:'viewer'}});
 assert.equal((await api(route+'/vessels/'+imported.successes[0].productId,owner,{summary:'forbidden'},'PATCH')).status,403);await ok(route+'/dashboard',owner);await Membership.updateOne({user:fixtureUser._id,organisation:fixtureOrg},{$set:{role:'owner'}});pass('viewer reads allowed, viewer edits forbidden');
 await ok(route+'/import/resort_packages',owner,{rows:[{resortName:prefix+' Resort',roomType:'Water Cottage',packageName:'Verification Package',basePrice:1950,currency:'USD',numberOfNights:7}]});
 await ok(route+'/import/resort_availability',owner,{rows:[{resortName:prefix+' Resort',roomType:'Water Cottage',date:start.toISOString(),roomsAvailable:3}]});
 const resort=await ok('/api/v2/resorts/'+resorts.successes[0].slug);assert.equal(resort.packages[0].basePrice.amountUsd,1950);
 const rate=await ok(route+'/rate-periods',owner,{package:resort.packages[0]._id,roomType:resort.roomTypes[0]._id,startDate:start.toISOString(),endDate:end.toISOString(),priceOverride:{amount:2100,amountUsd:2100,currency:'USD'}});
 assert.ok((await ok('/api/v2/resorts/'+resorts.successes[0].slug)).ratePeriods.some(x=>x._id===rate._id));pass('seasonal rate creation and retrieval');
 const transport=require('../src/config/smtp');const send=transport.sendMail.bind(transport);const messages=[];
 transport.sendMail=async mail=>{const result=await send(mail);messages.push(JSON.parse(result.message));return result;};
 try {
  const enquiry=await ok('/api/v2/enquiries',null,{productType:'resort',product:resort._id,customer:{name:'Verification Customer',email:'customer@example.test',guests:2},message:'Test enquiry'});
  assert.equal(enquiry.organisation,String(fixtureOrg));assert.equal(enquiry.status,'sent_to_operator');
  for(const recipient of ['customer@example.test',email,process.env.ADMIN_EMAIL])assert.ok(messages.some(m=>m.to.some(t=>t.address===recipient)));
  assert.ok(await require('../src/v2/models/enquiry.model').exists({_id:enquiry._id}));
  pass('enquiry persisted and customer, operator, admin notifications generated in test transport');
 } finally {transport.sendMail=send;}
 const Availability=require('../src/v2/models/resortAvailability.model');assert.equal((await Availability.findOne({organisation:fixtureOrg})).roomsAvailable,3);pass('resort packages, room ownership and availability import');
 assert.equal((await ok('/api/v2/liveaboards?destination=phase1-verification')).total,2);assert.equal((await ok('/api/v2/resorts?destination=phase1-verification')).total,1);assert.equal((await ok('/api/v2/liveaboards?destination=phase1-verification&maxPrice=5500&availableOnly=true')).total,1);pass('imported records appear in destination, price and availability search');
 const defaultLogin=await api('/api/auth/login',null,{email:'operator@example.test',password:'ChangeMe123!'});assert.equal(defaultLogin.status,401);pass('documented default demo login rejected');
 if(process.argv.includes('--browser')){
  const {chromium}=require('../../frontend/node_modules/@playwright/test');browser=await chromium.launch({headless:true,...(process.env.VERIFY_BROWSER_CHANNEL?{channel:process.env.VERIFY_BROWSER_CHANNEL}:{})});
  const page=await browser.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
  const frontend=process.env.VERIFY_FRONTEND_URL||'http://localhost:3000';
  for(const [kind,label] of [['ADMIN','admin'],['DEMO_OPERATOR','operator']]){
   await page.goto(frontend+'/login');await page.getByPlaceholder('Email',{exact:true}).fill(process.env[kind+'_EMAIL']);await page.getByPlaceholder('Password',{exact:true}).fill(process.env[kind+'_PASSWORD']);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard/v2');await page.getByText('Demo Dive Company',{exact:true}).last().waitFor();pass(label+' browser login and populated dashboard');await page.evaluate(()=>localStorage.clear());
  }
  for(const [path,needle] of [['/liveaboards/demo-explorer','Demo Explorer'],['/resorts/demo-dive-resort','Demo Dive Resort'],...imported.successes.map((x,i)=>['/liveaboards/'+x.slug,boats[i].vesselName]),['/resorts/'+resorts.successes[0].slug,prefix+' Resort']]){const response=await page.goto(frontend+path);assert.equal(response.status(),200);await page.getByRole('heading',{name:needle,exact:true}).waitFor();}pass('demo and imported public pages render in browser');
  for(const [path,needle] of [['/explore/liveaboards','Demo Explorer'],['/explore/resorts','Demo Dive Resort']]){await page.goto(frontend+path);await page.getByText(needle,{exact:true}).first().waitFor();}pass('search pages load database records in browser');
  await page.setViewportSize({width:390,height:844});await page.goto(frontend+'/liveaboards/demo-explorer');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);pass('mobile detail page fits viewport');
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const path of ['/','/login','/explore/liveaboards','/explore/resorts','/liveaboards/demo-explorer','/resorts/demo-dive-resort']){
    await page.goto(frontend+path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,path+' overflow at '+width);
   }
  }pass('desktop and phone layouts fit viewport across starter pages');
  for(const [kind,name,slug] of [['liveaboards','Demo Explorer','demo-explorer'],['resorts','Demo Dive Resort','demo-dive-resort']]){
   await page.goto(frontend+'/explore/'+kind);await page.getByText(name,{exact:true}).first().waitFor();
   await page.getByPlaceholder('Destination',{exact:true}).fill('no-match-'+run);
   await page.getByText('0 '+kind,{exact:true}).waitFor();
   await page.getByPlaceholder('Destination',{exact:true}).fill('raja-ampat');await page.getByText(name,{exact:true}).first().waitFor();
   await page.locator('a[href="/'+kind+'/'+slug+'"]').first().click();await page.waitForURL('**/'+kind+'/'+slug);
  }pass('search controls filter results and listing links navigate');
  assert.deepEqual(errors,[]);pass('no browser JavaScript errors');
 }
 console.log('VERIFIED '+passed+' check groups');
 } finally {
 if(browser)await browser.close();
 // Resolve by unique email if a partially failed import created the organisation.
 if(!fixtureOrg && mongoose.connection.readyState===1)fixtureOrg=(await Organisation.findOne({primaryEmail:email}))?._id;
 if(fixtureOrg){for(const file of ['claimToken','enquiry','departure','itinerary','cabinType','resortAvailability','resortRatePeriod','resortPackage','roomType','vessel','resort','organisationMembership','auditLog']){const M=require('../src/v2/models/'+file+'.model');await M.deleteMany({organisation:fixtureOrg});}await Organisation.deleteOne({_id:fixtureOrg,primaryEmail:email});}
 if(fixtureUser)await User.deleteOne({_id:fixtureUser._id,email});
 if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();console.log('Verification fixtures cleaned up.');
 }
})().catch(e=>{results.push({label:e.message,status:'failed'});console.error('FAIL '+e.name+': '+e.message);process.exitCode=1;}).finally(()=>{
 if(process.env.VERIFY_REPORT_PATH)require('node:fs').writeFileSync(process.env.VERIFY_REPORT_PATH,JSON.stringify({testedAt:new Date().toISOString(),scope:'local; no hosted deployment sign-off',passed,results},null,2));
});
