const test = require('node:test');
const assert = require('node:assert/strict');
const { listVessels, searchAdminProducts } = require('../src/v2/services/search.service');
const Vessel = require('../src/v2/models/vessel.model');
const Itinerary = require('../src/v2/models/itinerary.model');
const Departure = require('../src/v2/models/departure.model');
const Location = require('../src/v2/models/location.model');

// Narrow Mongo-style fixture matcher; these tests never open a database.
const field = (item, path) => path.split('.').reduce((value, key) => value?.[key], item);
const matches = (item, filter) => Object.entries(filter).every(([key, expected]) => {
  if (key === '$or') return expected.some(condition => matches(item, condition));
  if (key === '$and') return expected.every(condition => matches(item, condition));
  const actual = field(item, key);
  if (expected instanceof RegExp) return expected.test(String(actual));
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    return Object.entries(expected).every(([op, value]) => {
      if (op === '$in') return value.map(String).includes(String(actual));
      if (op === '$nin') return !value.map(String).includes(String(actual));
      if (op === '$gte') return actual >= value;
      if (op === '$lte') return actual <= value;
      throw new Error(`Unsupported fixture operator ${op}`);
    });
  }
  return String(actual) === String(expected);
});
const query = result => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; }, lean() { return Promise.resolve(result); } });
function fixture(t, { vessels, itineraries, departures }) {
  t.mock.method(Vessel, 'find', filter => query(vessels.filter(item => matches(item, filter))));
  t.mock.method(Vessel, 'countDocuments', async filter => vessels.filter(item => matches(item, filter)).length);
  t.mock.method(Itinerary, 'find', filter => query(itineraries.filter(item => matches(item, filter))));
  t.mock.method(Itinerary, 'distinct', async (key, filter) => [...new Set(itineraries.filter(item => matches(item, filter)).map(item => field(item, key)))]);
  const departureQuery = t.mock.method(Departure, 'distinct', async (key, filter) => [...new Set(departures.filter(item => matches(item, filter)).map(item => field(item, key)))]);
  t.mock.method(Location, 'findOne', () => query(null));
  return departureQuery;
}
const vessel = id => ({ _id: id, name: id, listingStatus: 'published' });
const itinerary = (id, vesselId, nights, extra = {}) => ({ _id: id, vessel: vesselId, numberOfNights: nights, status: 'active', ...extra });
const departure = (id, vesselId, itineraryId, amount, extra = {}) => ({ _id: id, vessel: vesselId, itinerary: itineraryId, startDate: new Date('2027-02-10'), effectiveMinPriceUsd: amount, status: 'scheduled', ...extra });

test('duration and price/date must match the same itinerary, not different trips on one vessel', async t => {
  fixture(t, { vessels: [vessel('false-positive'), vessel('matching')], itineraries: [itinerary('long', 'false-positive', 14), itinerary('short', 'false-positive', 7), itinerary('eligible', 'matching', 14)], departures: [departure('cheap-short', 'false-positive', 'short', 1500), departure('expensive-long', 'false-positive', 'long', 5000), departure('eligible-trip', 'matching', 'eligible', 1800)] });
  const result = await listVessels({ minNights: '12', maxPrice: '2000', startDate: '2027-02-01', endDate: '2027-02-28' });
  assert.deepEqual(result.items.map(item => item._id), ['matching']);
  assert.equal(result.total, 1);
});

test('port and country criteria stay attached to the qualifying departure itinerary', async t => {
  fixture(t, { vessels: [vessel('false-positive'), vessel('matching')], itineraries: [itinerary('sorong', 'false-positive', 10, { embarkation: { slug: 'sorong' }, country: 'Indonesia' }), itinerary('male', 'false-positive', 10, { embarkation: { slug: 'male' }, country: 'Maldives' }), itinerary('eligible', 'matching', 10, { embarkation: { slug: 'sorong' }, country: 'Indonesia' })], departures: [departure('wrong-port', 'false-positive', 'male', 1000), departure('eligible-trip', 'matching', 'eligible', 1000)] });
  const result = await listVessels({ embarkation: 'Sorong', country: 'Indonesia', maxPrice: '2000' });
  assert.deepEqual(result.items.map(item => item._id), ['matching']);
});

test('public filters exclude archived itineraries; admin retains prior status scope', async t => {
  fixture(t, { vessels: [vessel('archived-only'), vessel('active')], itineraries: [itinerary('old', 'archived-only', 10, { status: 'archived' }), itinerary('current', 'active', 10)], departures: [departure('old-trip', 'archived-only', 'old', 1000), departure('current-trip', 'active', 'current', 1000)] });
  assert.deepEqual((await listVessels({ minNights: '10', maxPrice: '2000' })).items.map(item => item._id), ['active']);
  assert.deepEqual((await searchAdminProducts('vessel', { minNights: '10', maxPrice: '2000' })).items.map(item => item._id), ['archived-only', 'active']);
});

test('no eligible itinerary prevents unrelated matching departures from returning a vessel', async t => {
  const departureQuery = fixture(t, { vessels: [vessel('short-only')], itineraries: [itinerary('short', 'short-only', 7)], departures: [departure('cheap', 'short-only', 'short', 1000)] });
  assert.equal((await listVessels({ minNights: '12', maxPrice: '2000' })).total, 0);
  assert.deepEqual(departureQuery.mock.calls[0].arguments[1].itinerary, { $in: [] });
});

test('departure-only and itinerary-only searches keep independent filtering behaviour', async t => {
  const departureQuery = fixture(t, { vessels: [vessel('short'), vessel('long')], itineraries: [itinerary('short-i', 'short', 7), itinerary('long-i', 'long', 14)], departures: [departure('short-trip', 'short', 'short-i', 1000), departure('long-trip', 'long', 'long-i', 4000)] });
  assert.deepEqual((await listVessels({ maxPrice: '2000' })).items.map(item => item._id), ['short']);
  assert.equal(departureQuery.mock.calls[0].arguments[1].itinerary, undefined);
  const before = departureQuery.mock.callCount();
  assert.deepEqual((await listVessels({ minNights: '12' })).items.map(item => item._id), ['long']);
  assert.equal(departureQuery.mock.callCount(), before);
});
