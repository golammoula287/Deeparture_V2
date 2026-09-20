const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateEffectivePrices } = require('../src/v2/services/pricing.service');
const base = { basePrices: [{ cabinType: 'cabin', amount: 5500, amountUsd: 5500, currency: 'USD' }] };
const price = (departure, at) => calculateEffectivePrices(base, departure, at)[0];
test('base discount produces 4950 USD', () => assert.equal(price({ offers: [{ type: 'percent', percent: 10 }] }).effectiveAmountUsd, 4950));
test('USD override replaces the inherited USD amount before discount', () => {
 const result = price({ priceOverrides: [{ cabinType: 'cabin', amount: 6000, currency: 'USD' }], offers: [{ type: 'percent', percent: 10 }] });
 assert.equal(result.effectiveAmount, 5400); assert.equal(result.effectiveAmountUsd, 5400);
});
test('foreign currency override without conversion does not retain stale USD', () => {
 const result = price({ priceOverrides: [{ cabinType: 'cabin', amount: 6000, currency: 'EUR' }], offers: [{ type: 'percent', percent: 10 }] });
 assert.equal(result.effectiveAmount, 5400); assert.equal(result.effectiveAmountUsd, undefined);
});
test('explicit USD conversion is used for foreign currency override', () => {
 assert.equal(price({ priceOverrides: [{ cabinType: 'cabin', amount: 6000, amountUsd: 6600, currency: 'EUR' }], offers: [{ type: 'percent', percent: 10 }] }).effectiveAmountUsd, 5940);
});
test('offer validity consistently uses the requested pricing date', () => {
 const departure = { offers: [{ type: 'percent', percent: 10, validFrom: new Date('2000-01-01'), validUntil: new Date('2000-12-31') }] };
 assert.equal(price(departure, new Date('2000-06-01')).effectiveAmount, 4950);
 assert.equal(price(departure, new Date('2001-01-01')).effectiveAmount, 5500);
});
test('best offer is chosen without stacking discounts', () => {
 assert.equal(price({ offers: [{ type: 'percent', percent: 10 }, { type: 'fixed_amount', amount: 1000, currency: 'USD' }] }).effectiveAmountUsd, 4500);
});
