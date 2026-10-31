const test = require('node:test');
const assert = require('node:assert/strict');
const { selectSourceConfig } = require('../src/v2/services/source.service');

const globalAlpha = { providerKey: 'alpha', sourceType: 'api', enabled: true, priority: 1 };
const globalBeta = { providerKey: 'beta', sourceType: 'api', enabled: false, priority: 50 };
const input = { organisationId: 'org', sourceType: 'api', providerName: 'Beta' };

test('disabled exact global provider wins over another enabled global provider', () => {
  assert.equal(selectSourceConfig([globalAlpha, globalBeta], input), globalBeta);
});

test('organisation provider override wins over global provider, including disabled overrides', () => {
  for (const enabled of [true, false]) {
    const local = { ...globalBeta, organisation: 'org', enabled };
    assert.equal(selectSourceConfig([globalAlpha, globalBeta, local], input), local);
  }
});

test('exact global provider wins over organisation generic default', () => {
  const generic = { providerKey: 'api', sourceType: 'api', organisation: 'org', enabled: true };
  assert.equal(selectSourceConfig([generic, globalBeta], input), globalBeta);
});

test('explicit generic defaults respect organisation scope and disabled state', () => {
  const generic = { providerKey: 'api', sourceType: 'api', enabled: true };
  const local = { ...generic, organisation: 'org', enabled: false };
  assert.equal(selectSourceConfig([globalAlpha, generic, local], input), local);
  assert.equal(selectSourceConfig([globalAlpha, generic], input), generic);
});

test('provider lookup excludes unrelated providers, organisations and source types', () => {
  assert.equal(selectSourceConfig([
    globalAlpha, { ...globalBeta, organisation: 'other' }, { ...globalBeta, sourceType: 'csv' },
  ], input), null);
});

test('provider reference and source type defaults normalize consistently', () => {
  assert.equal(selectSourceConfig([globalBeta], { organisationId: 'org', sourceType: 'API', sourceReference: ' Beta ' }), globalBeta);
  assert.equal(selectSourceConfig([globalBeta], { sourceType: 'api', providerName: 'Beta' }), globalBeta);
});
