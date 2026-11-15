// Read-only public API checks scoped to the sample organisation from seed-result.json.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const directory=path.join(__dirname,'../../docs/phase4/evidence/staging-seed-2026-11-14');
const seed=JSON.parse(fs.readFileSync(path.join(directory,'seed-result.json')));
const origin='https://deeparture-v2-3hr6.onrender.com/api/v2';
const destinations=['raja-ampat','maldives','komodo','red-sea','galapagos','philippines'];
const results=[];
async function read(type,query={}){const params=new URLSearchParams({organisation:seed.organisation,limit:'100',...query});const response=await fetch(`${origin}/${type}?${params}`,{signal:AbortSignal.timeout(60000)});assert(response.ok);const json=await response.json();assert(json.success);return json.data;}
async function check(name,fn){await fn();results.push({name,passed:true});console.log('PASS',name);}
(async()=>{
 for(const type of ['liveaboards','resorts']){
  await check(`${type}: 120 published sample listings and disjoint pagination`,async()=>{const one=await read(type,{limit:'12',page:'1',sort:'name'}),two=await read(type,{limit:'12',page:'2',sort:'name'});assert.equal(one.total,120);assert.equal(one.items.length,12);assert(one.items.every(item=>item.name.startsWith('Sample ')));assert(!two.items.some(item=>one.items.some(first=>first._id===item._id)));});
  for(const destination of destinations)await check(`${type}: ${destination} destination and combined filters`,async()=>{const basic=await read(type,{destination});assert.equal(basic.total,20);const filtered=await read(type,{destination,availableOnly:'true',veganRatingMin:'4',attributes:JSON.stringify([{key:'wifi',op:'eq',value:true},{key:'nitrox',op:'eq',value:true}])});assert.equal(filtered.total,20);assert(filtered.items.every(item=>item.destinationSlugs.includes(destination)));});
  await check(`${type}: bounded budgets exclude unrelated prices`,async()=>{const result=await read(type,{minPrice:'1000',maxPrice:'1500'});assert(result.total>0&&result.total<120);assert.equal((await read(type,{maxPrice:'10'})).total,0);});
 }
 const now=new Date(),from=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1)),to=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+2,0));
 await check('Liveaboard dates, nights, embarkation and price combine on matching departures',async()=>{const result=await read('liveaboards',{destination:'maldives',embarkation:'maldives',startDate:from.toISOString().slice(0,10),endDate:to.toISOString().slice(0,10),minNights:'7',maxNights:'7',minPrice:'700',maxPrice:'3000',availableOnly:'true'});assert.equal(result.total,20);assert.equal((await read('liveaboards',{minNights:'30'})).total,0);});
 await check('Sample offers use linked original and discounted cabin prices',async()=>{const list=await read('liveaboards',{destination:'galapagos'});const sample=list.items.find(item=>item.slug.endsWith('-01'));assert(sample);const response=await fetch(`${origin}/liveaboards/${sample.slug}`,{signal:AbortSignal.timeout(60000)});const {data}=await response.json();const departure=data.departures[0];assert(departure.offers.length);assert(departure.effectivePrices.some(price=>price.rackAmount>price.effectiveAmount));assert(departure.effectiveMinPrice<900);});
 fs.writeFileSync(path.join(directory,'search-verification.json'),JSON.stringify({origin,organisation:seed.organisation,results},null,2)+'\n');console.log(results.length+' hosted search checks passed.');
})().catch(error=>{console.error('Search verification failed:',error.message);process.exitCode=1;});
