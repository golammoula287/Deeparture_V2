// Local, read-only browser verification. Exercises fixture previews; never submits to APIs.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.PHASE4_PREVIEW_URL || 'http://127.0.0.1:3104';
const disabled = process.env.PHASE4_DISABLED_URL || 'http://127.0.0.1:3105';
for (const url of [base, disabled]) assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Preview checks must target loopback only');
const dir = path.resolve(__dirname, '../../docs/phase4/evidence');
fs.mkdirSync(dir, { recursive: true });
const report = { date: '2026-11-05', scope: 'Fixture design preview only; not Phase 4 API or staging acceptance', results: [], errors: [] };

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('request', req => { if (!['GET', 'HEAD'].includes(req.method())) writes.push(req.url()); });
    const check = async (name, fn) => { await fn(); report.results.push({ name, status: 'PASS' }); };
    await check('Production preview guard rejects list and detail without opt-in', async () => {
      for (const route of ['/phase4-preview', '/phase4-preview/liveaboards/coral-horizon']) {
        const response = await context.request.get(disabled + route);
        assert.equal(response.status(), 404);
        assert.match(response.headers()['cache-control'], /no-store/);
        assert.match(response.headers()['x-robots-tag'], /noindex/);
      }
    });
    await check('Enabled preview renders with noindex and no-store', async () => {
      const response = await page.goto(base + '/phase4-preview');
      assert.equal(response.status(), 200);
      assert.match(response.headers()['cache-control'], /no-store/);
      await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('blue horizon');
      await expect(page.locator('article')).toHaveCount(3);
    });
    for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 768, 1024], ['phone', 390, 844]]) {
      await check(`${name} search layout, image loading and screenshot`, async () => {
        await page.setViewportSize({ width, height });
        await page.goto(base + '/phase4-preview');
        await page.locator('article').first().waitFor();
        await page.evaluate(async () => { await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
        assert(await page.evaluate(() => [...document.images].every(img => img.complete && img.naturalWidth > 0)), 'Broken image');
        await page.screenshot({ path: path.join(dir, `design-search-${name}.png`), fullPage: true });
      });
      await check(`${name} detail layout, gallery and screenshot`, async () => {
        await page.goto(base + '/phase4-preview/liveaboards/coral-horizon');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coral Horizon');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
        await page.screenshot({ path: path.join(dir, `design-detail-${name}.png`), fullPage: true });
        await page.getByRole('button', { name: 'View all 4 photos' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: 'Next image', exact: true }).click();
        await expect(page.getByRole('dialog')).toContainText('2 / 4');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByRole('button', { name: 'View all 4 photos' })).toBeFocused();
      });
    }
    await check('Phone advanced filter drawer applies conjunctive sample filters', async () => {
      await page.goto(base + '/phase4-preview');
      await page.getByRole('button', { name: 'Filters', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Available spaces only').check();
      await dialog.getByLabel('Vegan meals', { exact: true }).check();
      await dialog.getByLabel('Minimum Deeparture rating').selectOption('5');
      assert(await dialog.evaluate(el => el.contains(document.activeElement)), 'Focus must remain inside the modal');
      const bounds = await dialog.boundingBox();
      assert(bounds.y >= 0 && bounds.y < 2 && bounds.height <= 844, 'Drawer must fit the phone viewport');
      await page.screenshot({ path: path.join(dir, 'design-filters-phone.png') });
      await dialog.getByRole('button', { name: 'Show 1 journey' }).click();
      await expect(page.locator('article')).toHaveCount(1);
      await expect(page.locator('article')).toContainText('Coral Horizon');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByRole('button', { name: /^Filters/ })).toBeFocused();
    });
    await check('Drawer cancellation discards uncommitted changes and returns focus', async () => {
      await page.getByRole('button', { name: /^Filters/ }).click();
      await page.getByRole('dialog').getByLabel('Rebreather support').check();
      await page.keyboard.press('Escape');
      await expect(page.locator('article')).toHaveCount(1);
      await page.getByRole('button', { name: /^Filters/ }).click();
      await expect(page.getByRole('dialog').getByLabel('Rebreather support')).not.toBeChecked();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Clear all filters' }).click();
      await expect(page.locator('article')).toHaveCount(3);
    });
    await check('Sample destination, date, duration and price controls affect results', async () => {
      await page.getByLabel('Destination', { exact: true }).selectOption('Raja Ampat');
      await page.getByLabel('Depart from', { exact: true }).fill('2027-02-01');
      await page.getByLabel('Depart by', { exact: true }).fill('2027-02-28');
      await page.getByLabel('Trip length', { exact: true }).selectOption('8');
      await page.getByLabel('Budget · USD', { exact: true }).selectOption('5000');
      await page.getByRole('button', { name: 'Find my trip' }).click();
      await expect(page.locator('article')).toHaveCount(1);
      await expect(page.locator('article')).toContainText('Coral Horizon');
    });
    await check('Empty state offers working reset', async () => {
      await page.getByLabel('Budget · USD', { exact: true }).selectOption('2500');
      await page.getByRole('button', { name: 'Find my trip' }).click();
      await expect(page.getByRole('heading', { name: 'A different horizon awaits.' })).toBeVisible();
      await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
      await expect(page.locator('article')).toHaveCount(3);
    });
    await check('Sample sorting and pagination work', async () => {
      await page.getByLabel('Sort journeys').selectOption('price');
      await expect(page.locator('article').first()).toContainText('Reef Wanderer');
      await page.getByRole('button', { name: 'Next results page' }).click();
      await expect(page.getByRole('button', { name: 'Results page 2', exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('article').first()).toContainText('Southern Cross');
    });
    await check('Departure context and enquiry preview never send a request', async () => {
      await page.goto(base + '/phase4-preview/liveaboards/coral-horizon');
      await page.locator('#departures article').nth(1).getByRole('button', { name: 'Enquire', exact: true }).click();
      await expect(page.getByLabel('Sample departure')).toHaveValue('second');
      await page.getByLabel('Your name', { exact: true }).fill('Preview Guest');
      await page.getByLabel('Email address', { exact: true }).fill('preview@example.test');
      await page.getByRole('button', { name: 'Preview enquiry' }).click();
      await expect(page.getByRole('status')).toContainText('No enquiry was submitted');
      await expect(page.getByRole('status')).toContainText('12 May 2027');
      await expect(page.locator('#departures article').last().getByRole('button')).toBeDisabled();
      assert.deepEqual(writes, []);
    });
    await check('Shared header and operator authentication remain intact', async () => {
      await page.goto(base + '/login');
      await expect(page.getByRole('link', { name: 'Deeparture V2' })).toBeVisible();
      await page.goto(base + '/operator/v2');
      await page.waitForURL('**/login');
    });
    await check('No console errors or page errors in accepted preview flows', async () => { assert.deepEqual(errors, []); });
  } catch (error) { report.errors.push(error.stack); process.exitCode = 1; }
  finally {
    await browser.close();
    fs.writeFileSync(path.join(dir, 'design-browser-results-2026-11-05.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: report.results.length, errors: report.errors }, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
