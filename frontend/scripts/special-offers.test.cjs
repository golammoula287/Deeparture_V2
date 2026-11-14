const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const loaded = import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(require('node:path').join(__dirname,'../src/lib/customer/specialOffers.js'),'utf8')).toString('base64'));
const now = Date.parse('2026-11-14T12:00:00Z');
const make = () => ({effectiveMinPrice:850,effectiveCurrency:'USD',effectivePrices:[{rackAmount:1000,effectiveAmount:850,currency:'USD',offerName:'Save 15%'}],offers:[{name:'Save 15%',active:true,validFrom:'2026-11-01',validUntil:'2026-12-01'}]});
test('Offer uses actual displayed price and original amount',async()=>{const {departureOffer}=await loaded;assert.deepEqual(departureOffer(make(),now),{name:'Save 15%',percent:15,originalPrice:1000,validUntil:'2026-12-01'});});
test('Expired, future, disabled and mismatched offers are excluded',async()=>{const {departureOffer}=await loaded;for(const change of [{validUntil:'2026-11-01'},{validFrom:'2027-01-01'},{active:false},{name:'Other offer'},{validUntil:'invalid'}]){const d=make();Object.assign(d.offers[0],change);assert.equal(departureOffer(d,now),null);}for(const change of [{currency:'EUR'},{effectiveAmount:900},{rackAmount:800}]){const d=make();Object.assign(d.effectivePrices[0],change);assert.equal(departureOffer(d,now),null);}assert.equal(departureOffer(null,now),null);});
