// Isolated acceptance run: never loads the configured database or SMTP service.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');
const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'deeparture-phase1-'));
const env = { ...process.env, NODE_ENV: 'development', DATABASE_URL: 'mongodb://127.0.0.1:27029/phase1_acceptance',
  PORT: '5019', FRONTEND_URL: 'http://localhost:3019', EMAIL_DELIVERY_MODE: 'test',
  JWT_SECRET_KEY: crypto.randomBytes(32).toString('hex'), ADMIN_EMAIL: 'admin@example.test',
  ADMIN_PASSWORD: crypto.randomBytes(24).toString('hex'), DEMO_OPERATOR_EMAIL: 'operator@example.test',
  DEMO_OPERATOR_PASSWORD: crypto.randomBytes(24).toString('hex'),
  NEXT_PUBLIC_API_URL: 'http://localhost:5019/api', API_INTERNAL_URL: 'http://localhost:5019/api',
  VERIFY_FRONTEND_URL: 'http://localhost:3019', VERIFY_REPORT_PATH: path.join(root, 'docs/phase1-test-results.json') };
const children = [];
function start(exe, args, cwd, extra = {}) {
  const child = spawn(exe, args, { cwd, env: { ...env, ...extra }, stdio: 'inherit', windowsHide: true });
  children.push(child); return child;
}
function run(script, cwd = backend, args = [], extra = {}) {
  return new Promise((resolve, reject) => {
    const child = start(process.execPath, [script, ...args], cwd, extra);
    child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(script + ' exited ' + code)));
  });
}
async function ready(url) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Service not ready: ' + url);
}
(async () => {
  try {
    const mongo = start(process.env.MONGOD_PATH || 'mongod', ['--dbpath', dbPath, '--port', '27029', '--bind_ip', '127.0.0.1', '--logpath', path.join(dbPath, 'mongo.log')], backend);
    mongo.once('error', error => console.error(error.message));
    const mongoose = require('mongoose');
    await mongoose.connect(env.DATABASE_URL, { serverSelectionTimeoutMS: 15000 }); await mongoose.disconnect();
    await run('scripts/check-v2-syntax.js');
    await run('scripts/seed-v2-attributes.js');
    await run('scripts/seed-demo.js');
    await run('scripts/create-admin.js');
    await run('scripts/seed-v2-attributes.js');
    await run('scripts/seed-demo.js');
    await run('node_modules/next/dist/bin/next', frontend, ['build', '--webpack'], { NODE_ENV: 'production' });
    start(process.execPath, ['src/server.js'], backend);
    start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3019'], frontend, { NODE_ENV: 'production' });
    await ready('http://localhost:5019/health'); await ready('http://localhost:3019');
    await run('scripts/verify-phase1.js', backend, ['--browser']);
  } finally {
    for (const child of children.reverse()) if (child.exitCode === null) child.kill();
    console.log('Local verification services stopped; isolated temporary database: ' + dbPath);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
