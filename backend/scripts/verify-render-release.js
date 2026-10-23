// Read-only evidence collector. Uses environment credentials; never records tokens or response bodies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const results = [];
const report = { testedAt: new Date().toISOString(), tester: process.env.STAGING_TESTER || 'Codex automated read-only verifier',
  scope: 'Render release identity and authenticated read-only smoke checks; not full workflow acceptance', results };
const record = async (check, action) => {
  try { results.push({ check, passed: true, ...await action() }); }
  catch { results.push({ check, passed: false, note: 'Check failed or evidence unavailable; inspect the staging configuration privately.' }); }
};
const request = async (url, options = {}) => {
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200);
  return response.json();
};
(async () => {
  const frontend = process.env.STAGING_FRONTEND_URL || 'https://deeparture-v2-1.onrender.com';
  const backend = process.env.STAGING_BACKEND_URL || 'https://deeparture-v2-3hr6.onrender.com';
  for (const url of [frontend, backend]) {
    const parsed = new URL(url);
    assert.equal(parsed.protocol, 'https:');
    assert.equal(parsed.username, ''); assert.equal(parsed.password, '');
    assert.equal(parsed.origin, url);
  }
  report.frontend = frontend; report.backend = backend;
  const expected = process.env.EXPECTED_DEPLOYED_COMMIT || '';
  report.expectedCommit = /^[a-f0-9]{40}$/i.test(expected) ? expected : null;
  await record('frontend deployed source identity', async () => {
    const data = await request(frontend + '/api/release');
    assert.ok(report.expectedCommit); assert.equal(data.commit, expected);
    return { commit: data.commit };
  });
  await record('backend deployed source identity', async () => {
    const data = await request(backend + '/health');
    assert.equal(data.ok, true); assert.ok(report.expectedCommit); assert.equal(data.commit, expected);
    return { commit: data.commit };
  });
  let token;
  await record('authenticated staging admin login', async () => {
    assert.ok(process.env.STAGING_ADMIN_EMAIL && process.env.STAGING_ADMIN_PASSWORD);
    const data = await request(backend + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.STAGING_ADMIN_EMAIL, password: process.env.STAGING_ADMIN_PASSWORD }) });
    assert.equal(data.success, true); assert.equal(data.data?.user?.role, 'admin');
    assert.ok(data.data.token); token = data.data.token;
    return {};
  });
  for (const route of ['/imports/history', '/notifications', '/audit', '/availability', '/sources/configs', '/reports/operational']) {
    await record('authenticated GET ' + route, async () => {
      assert.ok(token);
      const data = await request(backend + '/api/v2/admin' + route + '?limit=1', { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(data.success, true);
      return {};
    });
  }
})().catch(() => results.push({ check: 'verifier configuration', passed: false })).finally(() => {
  report.passed = results.length > 0 && results.every(item => item.passed);
  fs.writeFileSync(path.join(__dirname, '../../docs/phase2b-render-release-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
});
