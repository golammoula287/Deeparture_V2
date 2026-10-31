const test = require('node:test');
const assert = require('node:assert/strict');
const { safeRole, canManageRole, requiredImportErrors, productTypeForImport, clampOperatorLimit } = require('../src/v2/services/operatorPortal.helpers');

test('operator member roles default safely to viewer', () => {
  assert.equal(safeRole('editor'), 'editor');
  assert.equal(safeRole('owner'), 'viewer');
  assert.equal(safeRole('made_up'), 'viewer');
});

test('organisation admin cannot change an owner role', () => {
  assert.equal(canManageRole({ requesterRole:'admin', targetRole:'owner', nextRole:'editor' }), false);
  assert.equal(canManageRole({ requesterRole:'admin', targetRole:'editor', nextRole:'viewer' }), true);
});

test('owner can manage non-owner roles', () => {
  assert.equal(canManageRole({ requesterRole:'owner', targetRole:'editor', nextRole:'admin' }), true);
});

test('operator import requirements identify missing departure dates', () => {
  const errors = requiredImportErrors('departures', { vesselName:'Boat', itineraryName:'Route' });
  assert.deepEqual(errors, ['startDate is required','endDate is required']);
});

test('operator import types map to the correct product domain', () => {
  assert.equal(productTypeForImport('resort_packages'),'resort');
  assert.equal(productTypeForImport('departures'),'vessel');
});

test('operator list limits are bounded', () => {
  assert.equal(clampOperatorLimit(1000),250);
  assert.equal(clampOperatorLimit(0),50);
  assert.equal(clampOperatorLimit(25),25);
});

const { validateImportValues, canTransitionEnquiry } = require('../src/v2/services/operatorPortal.helpers');
test('preview rejects invalid inventory, prices and dates before writes', () => {
  assert.deepEqual(validateImportValues('departures', { spacesAvailable: 0, offerPercent: 100 }), []);
  assert.equal(validateImportValues('departures', { spacesAvailable: -1, offerPercent: 101, startDate: 'bad' }).length, 3);
  assert.equal(validateImportValues('departures', { startDate: '2027-02-02', endDate: '2027-02-01' }).length, 1);
});
test('enquiries require Admin dispatch and reject backward operator transitions', () => {
  assert.equal(canTransitionEnquiry('new', 'operator_accepted'), false);
  assert.equal(canTransitionEnquiry('sent_to_operator', 'quoted'), false);
  assert.equal(canTransitionEnquiry('sent_to_operator', 'operator_accepted'), true);
  assert.equal(canTransitionEnquiry('operator_accepted', 'quoted'), true);
  assert.equal(canTransitionEnquiry('quoted', 'operator_accepted'), false);
});
