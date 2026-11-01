const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

test('SMTP credentials cannot enable delivery in default or test mode', () => {
  for (const mode of ['', 'test']) {
    const output = execFileSync(process.execPath, ['-e', `
      const transport = require('./src/config/smtp');
      transport.sendMail({from:'sender@example.test',to:'recipient@example.test',subject:'Safe test',text:'test'})
        .then(result => { if (JSON.parse(result.message).subject !== 'Safe test') process.exit(1); console.log('safe'); });
    `], { cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8', timeout: 60000,
      env: { ...process.env, EMAIL_DELIVERY_MODE: mode, SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', SMTP_USER: 'test', SMTP_PASS: 'test' } });
    assert.match(output, /safe/);
  }
});

test('demo seed rejects missing and documented default passwords before connecting', () => {
  for (const password of ['', 'ChangeMe123!']) {
    assert.throws(() => execFileSync(process.execPath, ['scripts/seed-demo.js'], {
      cwd: require('node:path').resolve(__dirname, '..'), timeout: 60000, stdio: 'pipe',
      env: { ...process.env, DEMO_OPERATOR_PASSWORD: password, DATABASE_URL: 'mongodb://127.0.0.1:1/unused' }
    }), error => error.stderr.toString().includes('Set DEMO_OPERATOR_PASSWORD'));
  }
});

test('health reports the actual email transport mode without exposing SMTP configuration', () => {
  for (const mode of ['test', 'live']) {
    const output = execFileSync(process.execPath, ['-e', `
      const app = require('./src/app');
      const route = app._router.stack.find(layer => layer.route?.path === '/health');
      route.route.stack[0].handle({}, {set() {}, json(value) {console.log(JSON.stringify(value));}});
    `], { cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8', timeout: 60000,
      env: { ...process.env, EMAIL_DELIVERY_MODE: mode, SMTP_HOST: '127.0.0.1', SMTP_USER: 'private-test-smtp-user', SMTP_PASS: 'private-test-smtp-password' } });
    const health = JSON.parse(output.trim().split('\n').pop());
    assert.equal(health.emailDeliveryMode, mode);
    assert.equal(health.ok, true);
    assert.ok(!output.includes('private-test-smtp'));
  }
});

test('media migration rejects malformed scope flags before connecting to a database', () => {
  for (const arg of ['--organisation=bad', '--organisation', '--organistion=0123456789abcdef01234567']) {
    assert.throws(() => execFileSync(process.execPath, ['scripts/migrate-phase3-media.js', arg], {
      cwd: require('node:path').resolve(__dirname, '..'), timeout: 10000, stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'mongodb://127.0.0.1:1/unused' },
    }), error => error.stderr.toString().includes('Use --apply and/or --organisation='));
  }
});
