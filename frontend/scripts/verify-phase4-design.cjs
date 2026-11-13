// Local, read-only browser verification. Exercises fixture previews; never submits to APIs.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.PHASE4_PREVIEW_URL || 'http://127.0.0.1:3104';
const disabled = process.env.PHASE4_DISABLED_URL || 'http://127.0.0.1:3105';
for (const url of [base, disabled]) assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Preview checks must target loopback only');
const dir = path.resolve(__dirname, process.env.PHASE4_EVIDENCE_DIR || '../../docs/phase4/evidence');
fs.mkdirSync(dir, { recursive: true });
const evidenceDate = process.env.PHASE4_EVIDENCE_DATE || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const report = { date: evidenceDate, scope: 'Fixture design preview only; not Phase 4 API or staging acceptance', results: [], errors: [] };

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
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Dive beyond');
      await expect(page.locator('article')).toHaveCount(3);
    });
    await check('Original logos, owner-selected four-colour palette and local fonts load', async () => {
      await page.evaluate(() => document.fonts.ready);
      const logo = page.locator('header img[alt="Deeparture"]');
      await expect(logo).toHaveAttribute('src', '/brand/logo.svg');
      await expect(page.locator('footer img[alt="Deeparture"]')).toHaveAttribute('src', '/brand/footerLogo.svg');
      assert(await logo.evaluate(img => img.complete && img.naturalWidth > 0));
      assert(await page.evaluate(() => document.fonts.check('400 20px "Deeparture Outfit"') && document.fonts.check('400 15px "Deeparture Roboto"')));
      assert.equal(await page.locator('header').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      const palette = await page.locator('main').evaluate(el => {
        const style = getComputedStyle(el);
        return ['--palette-deep', '--palette-royal', '--palette-sky', '--palette-ice'].map(key => style.getPropertyValue(key).trim().toLowerCase());
      });
      assert.deepEqual(palette, ['#071925', '#294e5c', '#6d919d', '#9db7c3']);
    });
    await check('New approach section, footer navigation and readable primary action', async () => {
      await expect(page.locator('#our-approach').getByRole('heading', { level: 3 })).toHaveCount(4);
      await expect(page.locator('footer nav')).toHaveCount(3);
      await expect(page.locator('footer').getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/login');
      const colors = await page.getByRole('button', { name: 'Search trips' }).evaluate(el => {
        const style = getComputedStyle(el);
        return { foreground: style.color, background: style.backgroundColor };
      });
      const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((total, value, i) => total + value * [.2126, .7152, .0722][i], 0);
      const a = luminance(colors.foreground), b = luminance(colors.background);
      assert((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, 'Primary button text must meet normal-text contrast');
    });
    await check('Clean cards use working text actions without decorative arrows', async () => {
      await expect(page.locator('article').getByRole('link', { name: 'View trip', exact: true })).toHaveCount(3);
      assert(!/[←→]/.test(await page.locator('body').innerText()), 'Arrow glyphs should be replaced with text');
      assert.equal(await page.locator('svg path[d="M4 12h16m-6-6 6 6-6 6"]').count(), 0);
      await page.locator('article').first().getByRole('link', { name: 'View trip', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coral Horizon');
      await page.goto(base + '/phase4-preview');
    });
    await check('Immersive hero loads with a quiet icon-free content layout', async () => {
      const hero = page.locator('main > section').first();
      await expect(hero.locator('img')).toHaveAttribute('src', '/phase4/hero-diver-portrait-v3.jpg');
      assert(await hero.locator('img').evaluate(img => img.complete && img.naturalWidth > 0));
      await expect(hero.getByRole('link', { name: 'Explore journeys', exact: true })).toHaveAttribute('href', '#results');
      assert.equal(await page.locator('main svg').count(), 0);
      await expect(hero.getByText('OCEAN', { exact: true })).toHaveCount(0);
      await expect(hero.getByText('DEEP', { exact: true })).toHaveCount(0);
      const headline = await hero.locator('h1').evaluate(el => ({ color: getComputedStyle(el).color, animation: getComputedStyle(el).animationName }));
      assert.equal(headline.color, 'rgb(247, 250, 251)');
      assert.equal(headline.animation, 'none');
      await expect(page.locator('#our-approach').getByRole('heading', { level: 3 })).toHaveCount(4);
    });
    await check('Hero navigation overlays the image and content has no slideshow controls', async () => {
      await page.goto(base + '/phase4-preview');
      const hero = page.getByRole('region', { name: 'Ocean adventures' });
      const headerBox = await page.locator('header').boundingBox();
      const heroBox = await hero.boundingBox();
      assert.equal(heroBox.y, 0);
      assert(headerBox.y + headerBox.height < heroBox.y + heroBox.height);
      await expect(hero.getByRole('button')).toHaveCount(0);
      await expect(hero).not.toHaveAttribute('aria-roledescription', 'carousel');
      await expect(hero.getByRole('heading')).toContainText('Dive beyond');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await hero.locator('h1').evaluate(el => getComputedStyle(el.parentElement).animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });
    await check('Customer pages omit preview, demo and sample wording', async () => {
      for (const route of ['/phase4-preview', '/phase4-preview/liveaboards/coral-horizon']) {
        await page.goto(base + route);
        assert(!/\b(preview|demo|sample|illustrative|fictional)\b/i.test(await page.locator('body').innerText()));
        assert(!/\b(preview|demo|sample)\b/i.test(await page.title()));
        const alts = await page.locator('img').evaluateAll(images => images.map(img => img.alt).join(' '));
        assert(!/\b(preview|demo|sample|illustrative)\b/i.test(alts));
      }
      await page.goto(base + '/phase4-preview');
    });
    for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 768, 1024], ['phone', 390, 844]]) {
      await check(`${name} search layout, image loading and screenshot`, async () => {
        await page.setViewportSize({ width, height });
        await page.goto(base + '/phase4-preview');
        await page.locator('article').first().waitFor();
        await page.evaluate(async () => { await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
        assert(await page.evaluate(() => [...document.images].every(img => img.complete && img.naturalWidth > 0)), 'Broken image');
        const alignment = await page.getByRole('region', { name: 'Ocean adventures' }).evaluate(hero => {
          const box = hero.getBoundingClientRect();
          const title = hero.querySelector('h1');
          const content = title.parentElement.parentElement;
          const c = content.getBoundingClientRect();
          const link = content.querySelector('a').getBoundingClientRect();
          return { offset: Math.abs((c.left + c.width / 2) - (box.left + box.width / 2)), buttonOffset: Math.abs((link.left + link.width / 2) - (box.left + box.width / 2)), align: getComputedStyle(title).textAlign, navCount: hero.querySelectorAll('nav').length };
        });
        assert(alignment.offset < 2 && alignment.buttonOffset < 2 && alignment.align === 'center', `${name}: hero content must be centred`);
        assert.equal(alignment.navCount, 0, 'Journey cards removed');
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
      await page.getByRole('button', { name: 'Search trips' }).click();
      await expect(page.locator('article')).toHaveCount(1);
      await expect(page.locator('article')).toContainText('Coral Horizon');
    });
    await check('Empty state offers working reset', async () => {
      await page.getByLabel('Budget · USD', { exact: true }).selectOption('2500');
      await page.getByRole('button', { name: 'Search trips' }).click();
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
    await check('Quick destination buttons apply a search and remain resettable', async () => {
      await page.getByRole('button', { name: 'Maldives', exact: true }).click();
      await expect(page.locator('article')).toHaveCount(2);
      await expect(page.getByLabel('Destination', { exact: true })).toHaveValue('Maldives');
      await page.getByRole('button', { name: 'Clear all filters' }).click();
      await expect(page.locator('article')).toHaveCount(3);
    });
    await check('Departure context and enquiry preview never send a request', async () => {
      await page.goto(base + '/phase4-preview/liveaboards/coral-horizon');
      await page.locator('#departures article').nth(1).getByRole('button', { name: 'Enquire', exact: true }).click();
      await expect(page.getByLabel('Departure', { exact: true })).toHaveValue('second');
      await page.getByLabel('Your name', { exact: true }).fill('Preview Guest');
      await page.getByLabel('Email address', { exact: true }).fill('preview@example.test');
      await page.getByRole('button', { name: 'Review enquiry' }).click();
      await expect(page.getByRole('status')).toContainText('Check your trip details before sending');
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
    fs.writeFileSync(path.join(dir, `design-browser-results-${evidenceDate}.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: report.results.length, errors: report.errors }, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
