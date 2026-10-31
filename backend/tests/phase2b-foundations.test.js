const test = require('node:test');
const assert = require('node:assert/strict');

const { parsePagination, pagedResult } = require('../src/v2/services/pagination.service');
const operationId = require('../src/middleware/operationId');
const { normalizeCatalogRow } = require('../src/v2/services/catalogImportAdapter.service');
const { intersect } = require('../src/v2/services/search.service');

test('unfiltered catalogue search keeps the unrestricted product set', () => {
  assert.equal(intersect(null, null), null);
  assert.deepEqual(intersect(['a', 'b'], null), ['a', 'b']);
  assert.deepEqual(intersect(null, ['a']), ['a']);
  assert.deepEqual(intersect(['a', 'b'], ['b']), ['b']);
});

const runOperationMiddleware = (header) => {
  const req = { headers: {} };
  if (header !== undefined) req.headers['x-operation-id'] = header;
  const responseHeaders = {};
  const res = { setHeader: (key, value) => { responseHeaders[key] = value; } };
  let nextCalled = false;
  operationId(req, res, () => { nextCalled = true; });
  return { req, responseHeaders, nextCalled };
};

test('Phase 2B pagination clamps limits and preserves stable descending sort', () => {
  const result = parsePagination(
    { page: '3', limit: '999', sort: '-updatedAt' },
    { defaultLimit: 25, maxLimit: 100, allowedSort: ['createdAt', 'updatedAt'], defaultSort: '-createdAt' }
  );
  assert.equal(result.page, 3);
  assert.equal(result.limit, 100);
  assert.equal(result.skip, 200);
  assert.deepEqual(result.sort, { updatedAt: -1, _id: -1 });
});

test('Phase 2B pagination falls back to the full default sort when an unsupported sort is requested', () => {
  const result = parsePagination(
    { sort: 'unsupportedField' },
    { allowedSort: ['createdAt', 'updatedAt'], defaultSort: '-createdAt' }
  );
  assert.deepEqual(result.sort, { createdAt: -1, _id: -1 });
});

test('Phase 2B paged result reports navigation metadata', () => {
  assert.deepEqual(
    pagedResult({ items: ['a'], total: 51, page: 2, limit: 25 }),
    { items: ['a'], total: 51, page: 2, limit: 25, pages: 3, hasPrevious: true, hasNext: true }
  );
});

test('Operation IDs preserve a safe caller supplied ID', () => {
  const result = runOperationMiddleware('import.batch:abc-1234');
  assert.equal(result.req.operationId, 'import.batch:abc-1234');
  assert.equal(result.responseHeaders['X-Operation-Id'], 'import.batch:abc-1234');
  assert.equal(result.nextCalled, true);
});

test('Operation IDs replace unsafe/too-short caller values', () => {
  const result = runOperationMiddleware('bad');
  assert.match(result.req.operationId, /^[0-9a-f-]{36}$/i);
  assert.notEqual(result.req.operationId, 'bad');
});

test('Catalogue adapter carries the import schema version into the normalized DTO', () => {
  const dto = normalizeCatalogRow({
    row: { operatorName: 'Example Operator', vesselName: 'Example Vessel' },
    rowNumber: 7,
    productType: 'vessel',
    sourceType: 'xlsx',
    schemaVersion: 3,
  });
  assert.equal(dto.schemaVersion, 3);
  assert.equal(dto.rowNumber, 7);
  assert.equal(dto.sourceType, 'xlsx');
  assert.equal(dto.errors.length, 0);
});


test('Catalogue adapter treats blank optional spreadsheet fields as no-update values', () => {
  const dto = normalizeCatalogRow({
    row: { operatorName: 'Example Operator', vesselName: 'Example Vessel', gallery: '', facilities: '', summary: '' },
    rowNumber: 1,
    productType: 'vessel',
    sourceType: 'xlsx',
  });
  assert.equal(dto.product.gallery, undefined);
  assert.equal(dto.product.facilities, undefined);
  assert.equal(dto.product.summary, undefined);
});

test('Catalogue adapter still accepts explicit empty arrays for an intentional structured clear', () => {
  const dto = normalizeCatalogRow({
    row: { operatorName: 'Example Operator', vesselName: 'Example Vessel', facilities: [] },
    rowNumber: 1,
    productType: 'vessel',
    sourceType: 'json',
  });
  assert.deepEqual(dto.product.facilities, []);
});
