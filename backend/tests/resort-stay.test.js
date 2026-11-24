const test = require('node:test');
const assert = require('node:assert/strict');
const ResortPackage = require('../src/v2/models/resortPackage.model');
const ResortRatePeriod = require('../src/v2/models/resortRatePeriod.model');
const RoomType = require('../src/v2/models/roomType.model');
const ResortAvailability = require('../src/v2/models/resortAvailability.model');
const { resortIdsForStay } = require('../src/v2/services/resortStay.service');

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
