// shared/html-deliverable scenarios (tasks 2.56–2.61), on the engine and on the exported sample snapshot.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { PRIVATE_NAMES } from '../private-names.js';
import { test, expect, watch, ENGINE_PATH, openEngine, trySample, skipPrompt, go, useSnapshot, openSnapshot, noHorizontalScroll } from './helpers.js';

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// Serious and critical axe-core violations on the current page state, plus "region" (content outside landmarks).
async function axe(page, where) {
  await page.evaluate(AXE); // evaluated by the test driver, so the page's CSP does not apply
  const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  return result.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact) || v.id === 'region')
    .map((v) => `${where}: ${v.id} (${v.impact}) ${v.help} -> ${v.nodes.slice(0, 5).map((n) => n.target.join(' ')).join(' | ')}`);
}

// Tabs through the page until focus comes back round, and returns the controls reached plus those never reached.
async function tabAround(page) {
  await page.evaluate(() => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const blocked = (el) => el.closest('[hidden], dialog:not([open]), [inert]') || (document.querySelector('dialog[open]') && !el.closest('dialog[open]'));
    let i = 0;
    for (const el of document.querySelectorAll('[data-kb]')) delete el.dataset.kb;
    for (const el of document.querySelectorAll(sel)) {
      if (el.tabIndex < 0 || blocked(el) || !el.checkVisibility({ visibilityProperty: true })) continue;
      el.dataset.kb = String(i++);
    }
    document.activeElement && document.activeElement.blur();
  });
  const reached = [];
  const unseen = [];
  let first = null;
  for (let n = 0; n < 250; n++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = el.querySelector && el.querySelector(':scope > .ring, :scope > .lane-hit');
      const ringStroke = ring ? getComputedStyle(ring).stroke : 'none';
      const outlined = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const boxed = cs.boxShadow && cs.boxShadow !== 'none';
      const ringed = !!ring && ringStroke !== 'none' && !/rgba\(0, 0, 0, 0\)|transparent/.test(ringStroke);
      return { kb: el.dataset.kb ?? null, label: `${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ''} "${(el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 40)}"`, visible: el.matches(':focus-visible') && (outlined || boxed || ringed) };
    });
    if (!f) continue;
    const key = f.kb ?? f.label; // data-kb is unique; labels can repeat (the brand and breadcrumb share the model name)
    if (first === key && reached.length > 1) break;
    first ??= key;
    reached.push(f);
  }
  const all = await page.evaluate(() => [...document.querySelectorAll('[data-kb]')].map((el) => ({ kb: el.dataset.kb, label: `${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}"` })));
  const got = new Set(reached.map((r) => r.kb));
  for (const a of all) if (!got.has(a.kb)) unseen.push(a.label);
  return { reached, unseen, total: all.length };
}

test.describe('html-deliverable: exported sample', () => {
  const snap = useSnapshot('sample');

  test('2.56 html-deliverable › Opens offline from disk', { tag: '@mobile' }, async ({ page, context, sink }) => {
    await context.setOffline(true);
    // The engine: load the sample, browse the preview, open the reference.
    await openEngine(page);
    await trySample(page);
    await skipPrompt(page);
    await go(page, '#/p/qualify-opportunity/s/go-no-go');
    await expect(page.getByTestId('preview').getByTestId('step-detail')).toContainText('Go or no-go');
    await page.getByRole('button', { name: 'Content reference' }).click();
    await expect(page.getByTestId('reference-dialog')).toBeVisible();
    const engineHtml = readFileSync(ENGINE_PATH, 'utf8');
    expect(engineHtml).toContain("default-src 'none'");
    expect(engineHtml).not.toMatch(/<script[^>]+src=|<link[^>]+href=|<img[^>]+src="https?:|@import|url\((['"])?https?:/i);
    // The exported snapshot, in a new tab.
    page = await context.newPage();
    await openSnapshot(page, snap);
    await page.getByTestId('persona-option-acme-account-lead').click();
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    await page.getByTestId('step-go-no-go').click();
    await page.getByTestId('step-next').first().click();
    await expect(page.getByTestId('step-detail')).toContainText('Kick off the bid');
    await page.getByTestId('key-messages-button').click();
    await expect(page.getByTestId('key-messages-dialog')).toBeVisible();
    // The party marks (add-party-brands; the theme logo is retired) are embedded, and decode offline.
    await expect(page.getByTestId('logo')).toHaveCount(0);
    const marks = page.getByTestId('lockup').locator('img.mk');
    await expect(marks).toHaveCount(2);
    for (const m of await marks.all()) {
      await expect(m).toBeVisible();
      expect(await m.evaluate((img) => img.complete && img.naturalWidth > 0 && img.src.startsWith('data:image/svg+xml;base64,')), 'mark decoded offline').toBe(true);
    }
    expect(sink.requests).toEqual([]);
    expect(snap.html).toContain("default-src 'none'");
    expect(snap.html).not.toMatch(/<script[^>]+src=|<link[^>]+href=|<img[^>]+src="https?:|@import|url\((['"])?https?:/i);
  });

  test('2.57 html-deliverable › Clean console', { tag: '@mobile' }, async ({ page, context, browser, sink }) => {
    // Engine main flows (author mode is specified for 768px and up).
    const engine = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    const own = { errors: [], dialogs: [], requests: [] };
    watch(engine, own);
    const ap = await engine.newPage();
    await openEngine(ap);
    await ap.getByRole('button', { name: 'Content reference' }).click();
    await ap.getByTestId('reference-dialog').getByRole('button', { name: 'Close' }).click();
    await trySample(ap);
    await skipPrompt(ap);
    await go(ap, '#/p/build-proposal/s/review-proposal');
    await ap.getByTestId('step-next').first().click();
    const dl = ap.waitForEvent('download');
    await ap.getByTestId('export').click();
    await dl;
    await ap.getByTestId('load-other').click();
    await engine.close();
    expect(own.errors, 'engine console errors').toEqual([]);

    // Snapshot main flows.
    await openSnapshot(page, snap);
    await page.getByTestId('persona-option-globex-solution-team').click();
    await page.getByTestId('process-card-build-proposal').click();
    await page.getByTestId('step-design-solution').click();
    await page.getByTestId('step-next').first().click();
    await page.getByTestId('change-toggle').locator('input').check();
    await page.getByTestId('me-link').click();
    await page.getByTestId('only-changes').locator('input').check();
    await page.getByTestId('search-input').fill('proposal');
    await page.getByTestId('search-input').press('Enter');
    await page.getByTestId('search-result').first().click();
    await page.getByTestId('persona-select').selectOption('');
    await page.getByTestId('key-messages-button').click();
    await page.keyboard.press('Escape');
    await page.goBack();
    await page.goForward();
    await page.setViewportSize({ width: page.viewportSize().width < 768 ? 1280 : 375, height: 800 }); // crossing the list/SVG breakpoint
    await page.goto(`${snap.url}#/p/qualify-opportunity`);
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    expect(sink.errors, 'snapshot console errors').toEqual([]);
  });

  test('2.58 html-deliverable › Keyboard-only use', async ({ page, browser }) => {
    test.slow(); // many Tab presses across nine views
    const report = [];
    const check = async (where, min = 4) => {
      const { reached, unseen, total } = await tabAround(page);
      expect(total, `${where}: controls found`).toBeGreaterThanOrEqual(min);
      expect(unseen, `${where}: controls Tab never reached`).toEqual([]);
      expect(reached.filter((r) => !r.visible).map((r) => r.label), `${where}: focused without a visible indicator`).toEqual([]);
      report.push(`${where}: ${total} controls`);
    };
    // Engine start screen, then operate it by keyboard only.
    await openEngine(page);
    await check('engine start');
    const sample = page.getByRole('button', { name: 'Try the sample' });
    while (!(await sample.evaluate((b) => b === document.activeElement))) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('report')).toBeVisible();
    await expect(page.getByTestId('persona-prompt')).toBeVisible();
    await check('engine persona prompt (modal)');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('persona-prompt')).toBeHidden();
    await check('engine report and preview');
    await page.getByRole('button', { name: 'Content reference' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('reference-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('reference-dialog')).toBeHidden();

    // Snapshot views.
    await openSnapshot(page, snap);
    await page.keyboard.press('Escape');
    await check('snapshot overview');
    const card = page.getByTestId('workstream-card-presales');
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main h1')).toHaveText('Presales');
    await page.getByTestId('process-card-qualify-opportunity').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    await check('snapshot swimlane');
    await page.getByTestId('step-go-no-go').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('step-detail')).toBeVisible();
    await check('snapshot step detail');
    await page.getByTestId('change-toggle').locator('input').focus();
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/changes=1/);
    await page.getByTestId('key-messages-button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('key-messages-dialog')).toBeVisible();
    await check('snapshot key messages (modal)', 1);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('key-messages-dialog')).toBeHidden();
    await page.goto(`${snap.url}#/me?persona=acme-account-lead`);
    await check('snapshot what matters for me');
    test.info().annotations.push({ type: 'keyboard', description: report.join('; ') });
  });

  test('2.59 html-deliverable › Automated accessibility scan', { tag: '@mobile' }, async ({ page, browser }) => {
    test.slow(); // 32 axe-core scans
    const found = [];
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      // Engine: author mode is specified for 768px and up (author-mode spec), so it is scanned at no less than 768px.
      const size = page.viewportSize();
      if (size.width < 768) await page.setViewportSize({ width: 768, height: size.height });
      await openEngine(page);
      found.push(...(await axe(page, `${scheme} engine start`)));
      await trySample(page);
      found.push(...(await axe(page, `${scheme} engine persona prompt`)));
      await skipPrompt(page);
      found.push(...(await axe(page, `${scheme} engine report and preview`)));
      await page.getByRole('button', { name: 'Content reference' }).click();
      found.push(...(await axe(page, `${scheme} engine content reference`)));
      await page.setViewportSize(size);
      // Snapshot views, at the project's size (375px on mobile).
      for (const [hash, name, prep] of [
        ['', 'persona prompt'],
        ['#/?persona=acme-account-lead', 'overview'],
        ['#/w/presales?persona=acme-account-lead', 'workstream'],
        ['#/w/delivery', 'outline workstream'],
        ['#/p/qualify-opportunity?persona=acme-account-lead&changes=1', 'swimlane with persona and changes'],
        ['#/p/build-proposal/s/courier-copies?changes=1', 'removed step detail'],
        ['#/p/build-proposal/s/courier-copies', 'removed step notice'],
        ['#/p/qualify-opportunity/s/kick-off-bid?changes=1', 'step detail'],
        ['#/r/account-lead', 'role profile'],
        ['#/e/acme', 'party'],
        ['#/me?persona=globex-solution-team', 'what matters for me'],
        ['#/search?q=proposal', 'search results'],
        ['#/p/qualify-opportunity', 'key messages dialog', async () => page.getByTestId('key-messages-button').click()],
      ]) {
        await openSnapshot(page, snap, hash);
        if (prep) await prep();
        found.push(...(await axe(page, `${scheme} snapshot ${name}`)));
      }
    }
    expect(found, 'serious or critical axe-core violations, or content outside landmarks').toEqual([]);
  });

  test('2.60 html-deliverable › Small screen', { tag: '@mobile-only' }, async ({ page }) => {
    expect(page.viewportSize().width).toBe(375);
    const wide = [];
    for (const hash of ['', '#/?persona=acme-account-lead', '#/w/presales', '#/w/delivery', '#/p/qualify-opportunity?persona=acme-account-lead&changes=1', '#/p/build-proposal/s/review-proposal', '#/r/account-lead', '#/e/globex', '#/me?persona=globex-solution-team', '#/search?q=the']) {
      await openSnapshot(page, snap, hash);
      if (!(await noHorizontalScroll(page))) wide.push(`${hash || '#/'}: scrollWidth ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
      // Every visible control sits inside the viewport.
      const outside = await page.evaluate(() =>
        [...document.querySelectorAll('a[href], button, input, select, [tabindex="0"]')]
          .filter((el) => el.checkVisibility() && !el.closest('dialog:not([open])') && !el.classList.contains('skip'))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
          })
          .map((el) => el.dataset.testid || el.textContent.trim().slice(0, 30)),
      );
      if (outside.length) wide.push(`${hash || '#/'}: controls outside the viewport: ${outside.join(', ')}`);
    }
    expect(wide).toEqual([]);
    // The controls work on the small screen.
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.getByTestId('step-assess-fit').click();
    await expect(page.getByTestId('step-detail')).toBeVisible();
    await page.getByTestId('step-next').click();
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Go or no-go');
    await page.getByTestId('persona-select').selectOption('acme-account-lead');
    await page.getByTestId('key-messages-button').click();
    await expect(page.getByTestId('key-messages-dialog')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.61 html-deliverable › Content check', async () => {
    const files = { 'dist/operating-model-explorer.html': readFileSync(ENGINE_PATH, 'utf8'), 'exported acme-sample.html': snap.html };
    const PATTERNS = {
      'API key or token': /\b(sk-[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|gh[ousr]_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})\b/,
      'private key': /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      'bearer token': /Bearer\s+[A-Za-z0-9._~+/-]{20,}/,
      'key assignment': /\b(api[_-]?key|secret|password|access[_-]?token)\b\s*[:=]\s*["'][^"']{8,}["']/i,
      'JWT': /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
      // Hostnames and addresses; not the bare word "localhost" inside the bundled linkify library's URL grammar.
      'internal hostname': /\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(internal|corp|intranet|lan|local)\b|\/\/(localhost|127\.0\.0\.1)\b|\b(10\.\d{1,3}|192\.168)\.\d{1,3}\.\d{1,3}\b/i,
      ...(PRIVATE_NAMES ? { 'real client or employer name': PRIVATE_NAMES } : {}),
      'author file path or e-mail': /[A-Z]:\\\\?Users|OneDrive|StevenBiss|[\w.+-]+@[\w-]+\.(com|net|org|co\.uk)/i,
    };
    const hits = [];
    for (const [file, text] of Object.entries(files)) {
      for (const [what, re] of Object.entries(PATTERNS)) {
        const m = text.match(re);
        if (m) hits.push(`${file}: ${what}: "${text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40)}"`);
      }
    }
    expect(hits).toEqual([]);
  });
});
