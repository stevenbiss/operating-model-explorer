// html-qa B1 (security): theme labels and content with markup are shown as text, never as markup, in the author
// preview and in an exported snapshot; and the CSP blocks an inline handler even if one reached the DOM.
// Fixtures: tests/fixtures/xss (every label and most content fields, structures included, carry an <img onerror> payload; valid, so it
// exports) and tests/fixtures/xss-raci (a RACI value with markup: an error, so preview only).
import { test, expect, openEngine, loadZip, go, useSnapshot, openSnapshot } from './helpers.js';

const PAYLOAD = '<img src=x onerror="document.body.dataset.pwned=1">';
const ROUTES = [
  '#/', '#/?persona=lead', '#/w/main-ws', '#/p/flow', '#/p/flow?persona=lead&changes=1', '#/p/flow/s/start?persona=lead&changes=1',
  '#/p/flow/s/design', '#/r/account-lead?changes=1', '#/r/solution-architect?persona=lead', '#/e/alpha', '#/e/alpha-team', '#/e/lead',
  '#/search?q=img', '#/me?persona=lead', '#/me?persona=lead&only=1&changes=1', '#/no/such/page',
  '#/d/org', '#/d/org?changes=1', '#/d/org?persona=lead&changes=1', '#/d/sub', '#/search?q=Box',
];
const RACI_ROUTES = ['#/p/flow', '#/p/flow/s/start', '#/p/flow/s/start?persona=sa', '#/p/flow?persona=sa', '#/r/solution-architect', '#/me?persona=sa'];

// No handler ran, no payload element exists and no element carries an on* attribute, anywhere in the document.
const injected = (page) =>
  page.evaluate(() => ({
    pwned: document.body.dataset.pwned || null,
    imgs: document.querySelectorAll('img[src="x"]').length,
    handlers: [...document.querySelectorAll('*')].filter((e) => [...e.attributes].some((a) => /^on/i.test(a.name))).map((e) => e.outerHTML.slice(0, 80)),
  }));
const CLEAN = { pwned: null, imgs: 0, handlers: [] };

async function walk(page, routes, h1) {
  for (const hash of routes) {
    await go(page, hash);
    await expect(h1).toBeVisible();
    expect(await injected(page), hash).toEqual(CLEAN);
  }
}

test.describe('markup in labels and content is shown as text', () => {
  const snap = useSnapshot('xss');

  test('author preview: every route, with markup in every label and in names, KPIs and other fields', { tag: '@mobile' }, async ({ page }) => {
    await openEngine(page);
    await loadZip(page, 'xss');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    const pv = page.getByTestId('preview');
    await expect(pv.getByTestId('persona-prompt')).toBeVisible();
    expect(await injected(page)).toEqual(CLEAN);
    await pv.getByTestId('persona-skip').click();
    await walk(page, ROUTES, pv.locator('main h1'));
    // Shown as text, where the viewer's own wording and the content meet.
    await go(page, '#/');
    await expect(pv.locator('main h1')).toHaveText(`Model ${PAYLOAD}`);
    await expect(pv.locator('main')).toContainText(`${PAYLOAD}workstreams`);
    await go(page, '#/p/flow/s/start');
    await expect(pv.getByTestId('step-detail')).toContainText(`KPI ${PAYLOAD}`);
    // html-qa N8: structure fields are shown as text on the diagram page.
    await go(page, '#/d/org?changes=1');
    await expect(pv.locator('main h1')).toHaveText(`Structure ${PAYLOAD}`);
    await expect(pv.getByTestId('structure-kind')).toHaveText(`Kind ${PAYLOAD}`);
    await expect(pv.getByTestId('structure-diagram')).toContainText(`Box note ${PAYLOAD}`);
    await expect(pv.getByTestId('structure-line-label').first()).toHaveText(`Line ${PAYLOAD}`);
    // The persona announcement goes through the live region.
    await pv.getByTestId('persona-select').selectOption('lead');
    await expect(pv.getByTestId('announcer')).toHaveText(`Now viewing as Persona ${PAYLOAD}`);
    expect(await injected(page)).toEqual(CLEAN);
  });

  test('exported snapshot: every route, and the persona prompt', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await expect(page.getByTestId('persona-prompt')).toBeVisible();
    await expect(page.getByTestId('persona-prompt')).toContainText(`Persona ${PAYLOAD}`);
    expect(await injected(page)).toEqual(CLEAN);
    await page.getByTestId('persona-skip').click();
    await walk(page, ROUTES, page.locator('main h1'));
    await go(page, '#/');
    await expect(page.locator('main h1')).toHaveText(`Model ${PAYLOAD}`);
    await expect(page.getByTestId('footer')).toContainText(`Version 1 ${PAYLOAD}`);
    await expect(page).toHaveTitle(`Model ${PAYLOAD}`);
    await go(page, '#/d/org?changes=1');
    await expect(page.locator('main h1')).toHaveText(`Structure ${PAYLOAD}`);
    await expect(page.getByTestId('structure-diagram')).toContainText(`Box today ${PAYLOAD}`);
    expect(await injected(page)).toEqual(CLEAN);
  });

  test('author preview: a RACI value with markup is an error and is shown as text', { tag: '@mobile' }, async ({ page }) => {
    await openEngine(page);
    await loadZip(page, 'xss-raci');
    await expect(page.getByTestId('report-counts')).toContainText('1 error');
    const pv = page.getByTestId('preview');
    await expect(pv.locator('main h1')).toBeVisible();
    await walk(page, RACI_ROUTES, pv.locator('main h1'));
    await go(page, '#/p/flow/s/start');
    await expect(pv.getByTestId('step-detail').locator('.raci-table')).toContainText(PAYLOAD);
  });
});

test.describe('Content Security Policy', () => {
  const snap = useSnapshot('sample');

  test('allows only the engine script by hash, identically in the engine and the snapshot', async ({ page }) => {
    await openEngine(page);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toMatch(/script-src 'sha256-[A-Za-z0-9+/]+=*';/);
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    const engine = await page.locator('#om-engine').evaluate((s) => s.textContent);
    expect(snap.html).toContain(`<meta http-equiv="Content-Security-Policy" content="${csp}">`);
    expect(snap.html).toContain(`<script id="om-engine">${engine}</script>`);
    // The hash is the engine script's own.
    const digest = await page.evaluate(async (t) => btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t))))), engine);
    expect(csp).toContain(`'sha256-${digest}'`);
  });

  for (const where of ['engine', 'snapshot']) {
    test(`blocks an inline event handler that reaches the DOM (${where})`, async ({ page, sink }) => {
      if (where === 'engine') await openEngine(page);
      else await openSnapshot(page, snap);
      const blocked = await page.evaluate(
        () =>
          new Promise((done) => {
            const seen = [];
            document.addEventListener('securitypolicyviolation', (e) => seen.push(e.violatedDirective));
            const el = document.createElement('div');
            el.innerHTML = '<img src="data:," onerror="document.body.dataset.pwned=1"><a id="om-js" href="javascript:document.body.dataset.pwned=2">x</a>';
            document.body.append(el);
            el.querySelector('#om-js').click();
            setTimeout(() => done({ pwned: document.body.dataset.pwned || null, seen }), 500);
          }),
      );
      expect(blocked.pwned).toBeNull();
      expect(blocked.seen.some((d) => d.startsWith('script-src'))).toBe(true);
      // The browser reports each blocked handler on the console; those are this test's expected outcome.
      sink.errors = sink.errors.filter((e) => !/Content Security Policy/i.test(e));
    });
  }
});
