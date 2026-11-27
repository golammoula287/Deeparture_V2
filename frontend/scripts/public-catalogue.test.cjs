const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../src/lib/customer/publicCatalogue.js'), 'utf8');
const publicOrigin = 'https://public-api.example.test/api';
const internalOrigin = 'https://internal-api.example.test/api';
const listing = { items: [{ slug: 'sample-resort' }], total: 1 };

async function loadReader(fetchStub, internalBaseUrl = publicOrigin) {
  const moduleSource = source.replace(
    "import { baseUrl, internalBaseUrl } from '@/src/config/serverConfig';",
    `const baseUrl = ${JSON.stringify(publicOrigin)}; const internalBaseUrl = ${JSON.stringify(internalBaseUrl)};`
  );
  const { catalogueRead } = await import('data:text/javascript;base64,' + Buffer.from(moduleSource).toString('base64'));
  return async (...args) => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = fetchStub;
      return await catalogueRead(...args);
    } finally {
      globalThis.fetch = originalFetch;
    }
  };
}

test('catalogue request recovers after a startup response and preserves its filters', async () => {
  const requests = [];
  const read = await loadReader(async (url, options) => {
    requests.push(url);
    assert.equal(options.cache, 'no-store');
    return requests.length === 1
      ? new Response('Starting', { status: 503 })
      : Response.json({ success: true, data: listing });
  });
  assert.deepEqual(await read('resorts', { destination: 'raja-ampat' }), { data: listing, error: null, status: 200 });
  assert.deepEqual(requests, Array(2).fill(publicOrigin + '/v2/resorts?destination=raja-ampat'));
});

test('catalogue uses the public API when the configured internal route fails', async () => {
  const requests = [];
  const read = await loadReader(async url => {
    requests.push(url);
    return requests.length === 1 ? new Response('Forbidden', { status: 403 }) : Response.json({ success: true, data: listing });
  }, internalOrigin);
  assert.deepEqual((await read('resorts')).data, listing);
  assert.deepEqual(requests, [internalOrigin + '/v2/resorts', publicOrigin + '/v2/resorts']);
});

test('a missing listing on the public API is returned immediately', async () => {
  let requests = 0;
  const read = await loadReader(async () => {
    requests += 1;
    return new Response(null, { status: 404 });
  });
  assert.equal((await read('resorts/missing')).status, 404);
  assert.equal(requests, 1);
});
