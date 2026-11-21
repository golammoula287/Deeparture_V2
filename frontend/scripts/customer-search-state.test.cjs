const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const moduleSource = name => fs.readFileSync(path.resolve(__dirname, `../src/lib/customer/${name}.js`), 'utf8');
const asModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const loaded = import(asModule(moduleSource('searchState').replace('./searchDates', asModule(moduleSource('searchDates')))));
test('Finder preserves supported applied criteria and encodes a shareable URL', async()=>{const {searchState,finderUrl}=await loaded;const {state,invalid}=searchState({destination:'raja-ampat',startDate:'2027-03-01',endDate:'2027-04-01',minNights:'7',maxNights:'10',maxPrice:'2500',page:'2',sort:'-name'});assert.equal(invalid,false);assert.equal(state.page,'2');const q=new URL(finderUrl('/explore/liveaboards',state),'https://test.invalid').searchParams;assert.equal(q.get('startDate'),'2027-03-01');assert.equal(q.get('maxPrice'),'2500');assert.equal(q.get('sort'),'-name');});
test('Invalid dates, reversed nights and negative budget are not sent as filters', async()=>{const {searchState}=await loaded;const {state,invalid}=searchState({startDate:'2027-02-31',endDate:'no-date',minNights:'20',maxNights:'7',maxPrice:'-1'});assert.equal(invalid,true);assert.equal(state.startDate,'');assert.equal(state.endDate,'');assert.equal(state.minNights,'');assert.equal(state.maxNights,'');assert.equal(state.maxPrice,'');});
test('Resort criteria ignore liveaboard departure dates and trip length', async()=>{const {searchState}=await loaded;const {state}=searchState({startDate:'2027-04-01',endDate:'2027-05-01',minNights:'7',maxPrice:'1800'},true);assert.equal(state.startDate,undefined);assert.equal(state.minNights,undefined);assert.equal(state.maxPrice,'1800');});
test('Typed conjunctive attributes preserve values without allowing nested query objects', async()=>{const {searchState}=await loaded;const {state}=searchState({attributes:JSON.stringify([{key:'nitrox',op:'eq',value:true},{key:'dietary',op:'all',value:['vegan','gluten_free']},{key:'bad',op:'eq',value:{$gt:0}}])});assert.deepEqual(JSON.parse(state.attributes),[{key:'nitrox',op:'eq',value:true},{key:'dietary',op:'all',value:['vegan','gluten_free']}]);});
test('Unsupported sorts fall back to a real API sort rather than an invented ranking', async()=>{const {searchState,finderUrl}=await loaded;const {state}=searchState({sort:'popular',page:'-5'});assert.equal(state.sort,'name');assert.equal(state.page,'1');assert.equal(finderUrl('/explore/liveaboards',state),'/explore/liveaboards');});
test('Homepage price range and embarkation reach the shared search URL without losing the lower bound', async()=>{const {searchState,finderUrl}=await loaded;for(const resort of [false,true]){const {state,invalid}=searchState({minPrice:'1500',maxPrice:'4000',embarkation:'sorong'},resort);assert.equal(invalid,false);assert.equal(state.minPrice,'1500');assert.equal(state.maxPrice,'4000');assert.equal(state.embarkation,resort?undefined:'sorong');const params=new URL(finderUrl('/explore/liveaboards',state),'https://test.invalid').searchParams;assert.equal(params.get('minPrice'),'1500');assert.equal(params.get('maxPrice'),'4000');}});
test('Reversed or invalid price bounds do not become silent partial filters',async()=>{const {searchState}=await loaded;const reversed=searchState({minPrice:'4000',maxPrice:'1500'});assert.equal(reversed.invalid,true);assert.equal(reversed.state.minPrice,'');assert.equal(reversed.state.maxPrice,'');for(const value of ['-10','Infinity','not-a-price']){const {state,invalid}=searchState({minPrice:value});assert.equal(invalid,true);assert.equal(state.minPrice,'');}});

test('Legacy availability-only URLs no longer activate a customer filter', async () => {
  const { searchState, finderUrl } = await loaded;
  for (const resort of [false, true]) {
    const { state } = searchState({ availableOnly: 'true' }, resort);
    assert.equal(state.availableOnly, undefined);
    assert(!finderUrl('/explore/liveaboards', state).includes('availableOnly'));
  }
});


test('Resort stay dates survive URL changes only as a valid pair', async () => {
  const { searchState, finderUrl } = await loaded;
  const { state, invalid } = searchState({ checkIn: '2028-02-29', checkOut: '2028-03-02' }, true);
  assert.equal(invalid, false);
  assert.equal(finderUrl('/explore/resorts', state), '/explore/resorts?checkIn=2028-02-29&checkOut=2028-03-02');
  for (const pair of [{ checkIn: '2027-03-01' }, { checkIn: '2027-02-29', checkOut: '2027-03-05' }, { checkIn: '2027-03-02', checkOut: '2027-03-02' }, { checkIn: '2027-03-03', checkOut: '2027-03-02' }]) {
    const result = searchState(pair, true);
    assert.equal(result.invalid, true);
    assert.equal(result.state.checkIn, undefined);
    assert.equal(result.state.checkOut, undefined);
  }
});
