// Explicit hosted staging samples through validated/audited APIs; no direct database access.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const env = require('dotenv').parse(fs.readFileSync(path.join(__dirname,'../../.env')));
const origin = 'https://deeparture-v2-3hr6.onrender.com';
const name = 'Sample Search Preview';
const destinations = ['raja-ampat','maldives','komodo','red-sea','galapagos','philippines'];
let token;
async function api(route, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(origin+route,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(120000)});
  const json = await response.json();
  if (!response.ok || json.success === false) throw new Error(`${method} ${route.split('?')[0]} returned ${response.status}`);
  return json.data === undefined ? json : json.data;
}
async function pool(items, fn, concurrency=4) { let cursor=0; await Promise.all(Array.from({length:concurrency},async()=>{for(;;){const i=cursor++;if(i>=items.length)break;await fn(items[i],i);}})); }
async function all(route) { const items=[]; for(let page=1;;page++){const result=await api(`${route}&page=${page}&limit=100`);items.push(...result.items);if(!result.hasNext)break;}return items; }
async function main() {
  assert(process.argv.includes('--apply'),'Pass --apply to create staging samples.');
  assert.equal(new URL(env.DATABASE_URL).pathname,'/deeparture-v2-staging');
  assert.equal((await api('/health')).emailDeliveryMode,'test');
  const login=await api('/api/auth/login',{email:env.STAGING_ADMIN_EMAIL,password:env.STAGING_ADMIN_PASSWORD});token=login.token;assert(token);
  const orgs=await api('/api/v2/admin/organisations?q='+encodeURIComponent(name));
  let org=orgs.find(item=>item.name===name);
  if(!org)org=await api('/api/v2/admin/organisations',{name,slug:'sample-search-preview',primaryEmail:'sample-search@example.test',status:'unclaimed'});
  const base=`/api/v2/organisations/${org._id}`,operator=`/api/v2/operator/organisations/${org._id}`;
  const defs=await api('/api/v2/attributes');
  for(const [key,label,group] of [['wifi','Wi-Fi','facility'],['camera_room','Photography facilities','facility'],['nitrox','Nitrox','diving'],['rebreather_support','Rebreather support','diving'],['wheelchair_access','Wheelchair access','accessibility'],['vegan_meals','Vegan meals','dietary']])if(!defs.some(d=>d.key===key))defs.push(await api('/api/v2/admin/attributes',{key,label,group,applicableTo:['both'],dataType:'boolean',active:true,filterable:true,visibleOnPage:true}));
  const jobs=destinations.flatMap(destination=>Array.from({length:20},(_,i)=>({destination,index:i+1})));
  const records={liveaboards:[],resorts:[]};
  for(const type of ['liveaboards','resorts']) {
    const existing=await all(`/api/v2/admin/catalog/${type}?organisation=${org._id}`);
    const map=new Map(existing.map(item=>[item.slug,item]));
    await pool(jobs,async({destination,index},i)=>{
      const label=destination.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),vessel=type==='liveaboards',slug=`preview-${vessel?'liveaboard':'resort'}-${destination}-${String(index).padStart(2,'0')}`;
      let item=map.get(slug);
      if(!item)item=await api(`/api/v2/admin/catalog/${type}`,{organisation:org._id,slug,name:`Sample ${label} ${vessel?'Explorer':'Dive Resort'} ${index}`,listingStatus:'published',verificationStatus:'unverified',source:'admin',summary:'Fictional sample inventory for website preview. Not bookable.',description:'Sample listing only. Photos, prices, offers and availability are illustrative, not real travel inventory.',metadata:{synthetic:true,seed:'staging-search-preview'},destinationSlugs:[destination],veganRating:5,featuredImage:vessel?'/phase4/vessel.jpg':'/phase4/hero-island.jpg',gallery:[vessel?'/phase4/vessel.jpg':'/phase4/hero-island.jpg']});
      assert.equal(String(item.organisation?._id || item.organisation),String(org._id));
      const productType=vessel?'vessel':'resort';
      const attributes=defs.filter(d=>['wifi','camera_room','nitrox','rebreather_support','wheelchair_access','vegan_meals'].includes(d.key)&&d.active!==false&&(d.applicableTo||[]).some(t=>t==='both'||t===productType)).map(d=>({key:d.key,value:true}));
      await api(base+'/product-attributes',{productType,productId:item._id,attributes},'PUT');
      records[type].push({...item,destination,index});
      if((i+1)%20===0)console.log('Sample listings prepared:',type,i+1);
    });
  }
  async function importRows(type,rows) {
    const chunks=[];for(let i=0;i<rows.length;i+=20)chunks.push(rows.slice(i,i+20));
    await pool(chunks,async(chunk,i)=>{const batch=await api(`${operator}/imports/${type}/preview`,{rows:chunk,sourceFilename:'sample-search-preview.json'});assert.equal(batch.summary.error,0,`Invalid ${type} preview`);const done=await api(`${operator}/imports/${batch._id}/commit`,{});assert.equal(done.status,'completed');console.log('Imported',type,'batch',i+1,'of',chunks.length);},2);
  }
  const now=new Date(),expiry=new Date(now.getTime()+60*86400000).toISOString();
  await importRows('itineraries',records.liveaboards.map(item=>({vesselName:item.name,itineraryName:'Sample seven-night dive itinerary',destinations:item.destination,embarkation:item.destination,disembarkation:item.destination,numberOfNights:7,numberOfDays:8,cabinName:'Sample twin cabin',basePrice:800+item.index*100,currency:'USD',totalCabins:10,berthsPerCabin:2})));
  const departures=records.liveaboards.flatMap(item=>Array.from({length:6},(_,month)=>{const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+month+1,10));return {vesselName:item.name,itineraryName:'Sample seven-night dive itinerary',externalCode:'PREVIEW-'+start.toISOString().slice(0,7),startDate:start.toISOString(),endDate:new Date(start.getTime()+7*86400000).toISOString(),cabinName:'Sample twin cabin',spacesAvailable:6,totalSpaces:20,status:'scheduled',...([1,10,11].includes(item.index)?{offerName:`Sample ${[1,10,11].indexOf(item.index)*5+10}% early booking`,offerPercent:[1,10,11].indexOf(item.index)*5+10,offerValidFrom:now.toISOString(),offerValidUntil:expiry,offerDescription:'Fictional preview offer; not bookable.'}:{})};}));
  await importRows('departures',departures);
  await importRows('resort_packages',records.resorts.map(item=>({resortName:item.name,packageName:'Sample seven-night dive package',roomType:'Sample ocean room',basePrice:800+item.index*100,currency:'USD',numberOfNights:7,numberOfDays:8,numberOfDives:12,mealPlan:'full_board'})));
  await importRows('resort_availability',records.resorts.map(item=>({resortName:item.name,roomType:'Sample ocean room',date:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,10)).toISOString(),roomsAvailable:6,status:'available'})));
  const result={organisation:org._id,liveaboards:records.liveaboards.length,resorts:records.resorts.length,departures:departures.length,discountedDepartures:departures.filter(d=>d.offerPercent).length,synthetic:true};
  fs.mkdirSync(path.join(__dirname,'../../docs/phase4/evidence/staging-seed-2026-11-14'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../../docs/phase4/evidence/staging-seed-2026-11-14/seed-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
main().catch(error=>{console.error('Staging API seed stopped:',error.message);process.exitCode=1;});
