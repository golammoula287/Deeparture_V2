const test = require('node:test');
const assert = require('node:assert/strict');
const ResortPackage = require('../src/v2/models/resortPackage.model');
const ResortRatePeriod = require('../src/v2/models/resortRatePeriod.model');
const RoomType = require('../src/v2/models/roomType.model');
const ResortAvailability = require('../src/v2/models/resortAvailability.model');
const { resortIdsForStay, eligibleStayPackages } = require('../src/v2/services/resortStay.service');

const query = data => ({ select() { return this; }, sort() { return this; }, async lean() { return data; } });
const stay = { checkIn: '2027-02-26', checkOut: '2027-03-02' };
const period = (id, start, end, minimumStayNights) => ({
  package: id, startDate: new Date(start), endDate: new Date(end), minimumStayNights,
});

test('a stay needs coverage for each night, respects minimum stays and excludes blocked rooms', async t => {
  const ids = ['adjacent-windows', 'base-package', 'gap', 'too-short', 'blocked', 'inactive-room'];
  t.mock.method(ResortPackage, 'find', filter => {
    assert.deepEqual(filter, { active: true, 'basePrice.amountUsd': { $lte: 2000 } });
    return query(ids.map(id => ({ _id: id, resort: id, roomType: id })));
  });
  t.mock.method(ResortRatePeriod, 'find', () => query([
    period('adjacent-windows', '2027-02-15', '2027-02-28', 4),
    period('adjacent-windows', '2027-03-01', '2027-03-01', 4),
    period('gap', '2027-02-18', '2027-02-27'),
    period('gap', '2027-03-01', '2027-03-03'),
    period('too-short', '2027-02-20', '2027-03-03', 5),
  ]));
  t.mock.method(RoomType, 'find', filter => {
    assert.equal(filter.active, true);
    return query(ids.slice(0, -1).map(id => ({ _id: id, resort: id })));
  });
  t.mock.method(ResortAvailability, 'distinct', async (field, filter) => {
    assert.equal(field, 'roomType');
    assert.deepEqual(filter.date, { $gte: new Date(stay.checkIn), $lt: new Date(stay.checkOut) });
    return ['blocked'];
  });
  assert.deepEqual(await resortIdsForStay(stay, { active: true, 'basePrice.amountUsd': { $lte: 2000 } }), ['adjacent-windows', 'base-package']);
});

test('partial, invalid and non-positive stays fail before querying inventory', async t => {
  const find = t.mock.method(ResortPackage, 'find', () => { throw new Error('Unexpected inventory query'); });
  for (const input of [{ checkIn: stay.checkIn }, { checkIn: '2027-02-29', checkOut: stay.checkOut }, { checkIn: stay.checkOut, checkOut: stay.checkOut }, { checkIn: stay.checkOut, checkOut: stay.checkIn }]) {
    await assert.rejects(resortIdsForStay(input, { active: true }), { statusCode: 400 });
  }
  assert.equal(find.mock.callCount(), 0);
});

test('dated prices use the first night rate and only apply current offers covering the full stay', async t => {
  const basePrice = { amount: 800, currency: 'USD', pricingBasis: 'per_person' };
  const offer = { type: 'percent', percent: 10, validUntil: '2027-01-20' };
  const now = new Date('2027-01-10');
  const ids = ['discounted', 'expired', 'adjacent', 'base-only'];
  t.mock.method(ResortPackage, 'find', () => query(ids.map(id => ({ _id: id, basePrice }))));
  t.mock.method(ResortRatePeriod, 'find', () => query([
    { ...period('discounted', '2027-02-01', '2027-03-05', 4), priceOverride: { amount: 1100 }, offer },
    { ...period('expired', '2027-02-01', '2027-03-05', 4), priceOverride: { amount: 1050 }, offer: { ...offer, validUntil: '2027-01-09' } },
    { ...period('adjacent', '2027-02-01', '2027-02-28', 4), priceOverride: { amount: 1200 }, offer },
    { ...period('adjacent', '2027-03-01', '2027-03-05', 4), priceOverride: { amount: 1500 } },
  ]));
  t.mock.method(RoomType, 'find', () => query([]));
  t.mock.method(ResortAvailability, 'distinct', async () => []);
  const result = await eligibleStayPackages(stay, { active: true }, { resolvePrices: true, now });
  assert.deepEqual(result.map(x => [x._id, x.startingRate.amount, x.startingRate.currency, x.startingRate.pricingBasis]), [
    ['discounted', 990, 'USD', 'per_person'],
    ['expired', 1050, 'USD', 'per_person'],
    ['adjacent', 1200, 'USD', 'per_person'],
    ['base-only', 800, 'USD', 'per_person'],
  ]);
});
