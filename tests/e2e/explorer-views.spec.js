// explorer-views scenarios (tasks 2.23–2.37), on snapshots exported through the real Export button.
import { test, expect, useSnapshot, openSnapshot, skipPrompt, noHorizontalScroll } from './helpers.js';

const KEY_MESSAGES = [
  'One team, one plan. Clients see a single Acme + Globex team, not two suppliers.',
  'Acme owns the client relationship. Globex owns the solution.',
  'Decide early. Every opportunity gets a go or no-go within five working days.',
];
const PARTY = { 'account-lead': 'acme', 'bid-manager': 'acme', 'delivery-manager': 'acme', 'legal-counsel': 'acme', 'partner-manager': 'globex', 'solution-architect': 'globex', 'pricing-analyst': 'globex' };
const PARTY_NAME = { acme: 'Acme Corp', globex: 'Globex' };
const QUALIFY = [
  ['capture-lead', 'account-lead'],
  ['assess-fit', 'solution-architect'],
  ['go-no-go', 'account-lead'],
  ['decline', 'account-lead'],
  ['kick-off-bid', 'bid-manager'],
];
const detailTitle = (page) => page.getByTestId('step-detail').locator('h2#om-detail-title');

test.describe('explorer-views (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.23 explorer-views › Overview content', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const main = page.locator('main');
    await expect(main.getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    await expect(main.getByTestId('purpose')).toContainText('How Acme and Globex find, win and deliver joint work');
    await expect(main.getByTestId('party-card-acme')).toContainText('Acme Corp');
    await expect(main.getByTestId('party-card-globex')).toContainText('Globex');
    await expect(main.getByTestId('workstream-card-presales')).toContainText('Presales');
    await expect(main.getByTestId('workstream-card-delivery')).toContainText('Delivery');
    await expect(main.getByTestId('key-messages').locator('li p')).toHaveText(KEY_MESSAGES);
  });

  test('2.24 explorer-views › Key messages from a step detail', { tag: '@mobile' }, async ({ page }) => {
    const seen = [];
    for (const persona of ['', 'acme-account-lead', 'acme-delivery-manager', 'globex-solution-team']) {
      await openSnapshot(page, snap, `#/p/qualify-opportunity/s/go-no-go${persona ? `?persona=${persona}` : ''}`);
      await expect(page.getByTestId('step-detail')).toBeVisible();
      await page.getByTestId('key-messages-button').click(); // one action
      const dlg = page.getByTestId('key-messages-dialog');
      await expect(dlg).toBeVisible();
      await expect(dlg.locator('li p')).toHaveText(KEY_MESSAGES);
      seen.push(await dlg.innerText());
      await dlg.getByRole('button', { name: 'Close' }).click();
      await expect(dlg).toBeHidden();
    }
    expect(new Set(seen).size).toBe(1);
  });

  test('2.25 explorer-views › Outline workstream', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await page.getByTestId('workstream-card-delivery').click();
    const main = page.locator('main');
    await expect(main.locator('h1')).toHaveText('Delivery');
    await expect(main.getByTestId('outline-label')).toHaveText('Outline only');
    await expect(main.locator('.lead')).toHaveText('Running the project once it is won. To be detailed in a later version.');
    await expect(main.locator('[data-testid^="process-card-"]')).toHaveCount(0);
    await expect(main.locator('#om-pr-h')).toHaveCount(0);
    await expect(main).not.toContainText(/No processes yet/i);
  });

  test('2.26 explorer-views › Lanes and steps', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const lane = page.getByTestId('swimlane');
    await expect(lane).toHaveAttribute('data-layout', 'svg');
    // One lane per role that owns or takes part in a step.
    const lanes = await lane.locator('[data-testid^="lane-"]').evaluateAll((els) =>
      els.map((a) => ({ id: a.dataset.testid.slice(5), y: +a.querySelector('.lane-hit').getAttribute('y'), h: +a.querySelector('.lane-hit').getAttribute('height'), name: a.textContent })),
    );
    expect(lanes.map((l) => l.id).sort()).toEqual(['account-lead', 'bid-manager', 'delivery-manager', 'partner-manager', 'solution-architect']);
    // Grouped under the two party names, in bands.
    const bands = await lane.locator('.lane-heads .band').evaluateAll((gs) => gs.map((g) => ({ name: g.querySelector('.band-name').textContent, y: +g.querySelector('.band-bg').getAttribute('y') })));
    expect(bands.map((b) => b.name)).toEqual(['Acme Corp', 'Globex']);
    for (const l of lanes) {
      const i = bands.findIndex((b) => b.name === PARTY_NAME[PARTY[l.id]]);
      expect(l.y, `${l.id} lane under ${bands[i].name}`).toBeGreaterThan(bands[i].y);
      if (bands[i + 1]) expect(l.y).toBeLessThan(bands[i + 1].y);
    }
    // Each step sits in its owner's lane, in list order.
    const boxes = {};
    for (const [step, owner] of QUALIFY) {
      const b = await lane.getByTestId(`step-${step}`).locator('.box').evaluate((r) => ({ x: +r.getAttribute('x'), y: +r.getAttribute('y'), h: +r.getAttribute('height') }));
      const l = lanes.find((x) => x.id === owner);
      expect(b.y, `${step} inside ${owner} lane`).toBeGreaterThanOrEqual(l.y);
      expect(b.y + b.h).toBeLessThanOrEqual(l.y + l.h);
      boxes[step] = { ...b, owner };
    }
    for (const owner of new Set(QUALIFY.map(([, o]) => o))) {
      const xs = QUALIFY.filter(([, o]) => o === owner).map(([s]) => boxes[s]);
      for (let i = 1; i < xs.length; i++) expect(xs[i].x > xs[i - 1].x || (xs[i].x === xs[i - 1].x && xs[i].y > xs[i - 1].y), `${owner} steps in list order`).toBe(true);
    }
  });

  test('2.27 explorer-views › Decision branches', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const svg = page.locator('svg.swimlane').first();
    await expect(svg.locator('path.edge[data-from="go-no-go"]')).toHaveCount(2);
    await expect(svg.locator('path.edge[data-from="go-no-go"][data-to="kick-off-bid"]')).toHaveCount(1);
    await expect(svg.locator('path.edge[data-from="go-no-go"][data-to="decline"]')).toHaveCount(1);
    const labels = await svg.locator('.edge-label').allTextContents();
    expect(labels).toEqual(expect.arrayContaining(['Go', 'No go']));
    // The step's accessible name also gives both branches with their labels.
    await expect(page.getByTestId('step-go-no-go')).toHaveAttribute('aria-label', /Next: Kick off the bid \(Go\), Decline politely \(No go\)/);
  });

  test('2.28 explorer-views › Cross-party handoff', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const svg = page.locator('svg.swimlane').first();
    const cross = svg.locator('path.edge[data-from="capture-lead"][data-to="assess-fit"]'); // Acme -> Globex
    const same = svg.locator('path.edge[data-from="go-no-go"][data-to="decline"]'); // Acme -> Acme
    await expect(cross).toHaveClass(/\bcross\b/);
    await expect(same).not.toHaveClass(/\bcross\b/);
    const style = (l) => l.evaluate((p) => ({ dash: getComputedStyle(p).strokeDasharray, marker: p.getAttribute('marker-end') }));
    const [c, s] = [await style(cross), await style(same)];
    expect(c.dash).not.toBe(s.dash);
    expect(c.marker).not.toBe(s.marker);
    const legend = page.getByTestId('legend');
    await expect(legend).toContainText('Handoff within a party');
    await expect(legend).toContainText('Handoff between parties');
    // The legend's samples use the same two styles.
    expect(await legend.locator('path.edge.cross').evaluate((p) => getComputedStyle(p).strokeDasharray)).toBe(c.dash);
    expect(await legend.locator('path.edge:not(.cross)').evaluate((p) => getComputedStyle(p).strokeDasharray)).toBe(s.dash);
  });

  test('2.29 explorer-views › Open and move along the flow', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.getByTestId('step-capture-lead').click();
    await expect(detailTitle(page)).toHaveText('Capture the lead');
    await expect(page.getByTestId('step-capture-lead')).toHaveAttribute('aria-current', 'step');
    await page.getByTestId('step-next').click();
    await expect(detailTitle(page)).toHaveText('Assess solution fit');
    await expect(page.getByTestId('step-assess-fit')).toHaveAttribute('aria-current', 'step');
    await expect(page.getByTestId('step-capture-lead')).not.toHaveAttribute('aria-current', 'step');
    if ((await page.getByTestId('swimlane').getAttribute('data-layout')) === 'svg') await expect(page.getByTestId('step-assess-fit')).toHaveClass(/\bselected\b/);
    else await expect(page.getByTestId('step-assess-fit').locator('xpath=..')).toHaveClass(/\bselected\b/);
    // A decision offers each next step by its label.
    await page.goto(`${snap.url}#/p/qualify-opportunity/s/go-no-go`);
    await expect(page.getByTestId('step-next')).toHaveCount(2);
    await expect(page.getByTestId('step-next').nth(0)).toContainText('Go');
    await expect(page.getByTestId('step-next').nth(1)).toContainText('No go');
  });

  test('2.30 explorer-views › Role across processes', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.getByTestId('lane-account-lead').click();
    const main = page.locator('main');
    await expect(main.locator('h1')).toHaveText('Account lead');
    const groups = main.locator('.group');
    await expect(groups.locator('h3')).toHaveText(['Qualify an opportunity', 'Build the proposal']);
    await expect(groups.nth(0).locator('.step-list a')).toHaveText(['Capture the lead', 'Assess solution fit', 'Go or no-go', 'Decline politely']);
    await expect(groups.nth(1).locator('.step-list a')).toHaveText(['Review the proposal', 'Submit the proposal']);
    await groups.nth(1).getByRole('link', { name: 'Submit the proposal' }).click();
    await expect(detailTitle(page)).toHaveText('Submit the proposal');
    await expect(page.getByTestId('breadcrumb')).toContainText('Build the proposal');
  });

  test('2.31 explorer-views › Deep link', async ({ page, context }) => {
    await openSnapshot(page, snap, '#/p/build-proposal');
    await page.getByTestId('step-price-solution').click();
    await expect(detailTitle(page)).toHaveText('Price the solution');
    const url = page.url();
    expect(url).toContain('#/p/build-proposal/s/price-solution');
    const tab = await context.newPage();
    await tab.goto(url);
    await expect(tab.getByTestId('step-detail').locator('h2')).toHaveText('Price the solution');
    await expect(tab.getByTestId('breadcrumb')).toContainText('Price the solution');
    await expect(tab.getByTestId('persona-prompt')).toBeHidden();
  });

  test('2.32 explorer-views › Back button', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await page.getByTestId('workstream-card-presales').click();
    await page.getByTestId('process-card-qualify-opportunity').click();
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    await page.goBack();
    await expect(page.locator('main h1')).toHaveText('Presales');
    await page.goBack();
    await expect(page.getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    await expect(page.getByTestId('party-card-acme')).toBeVisible();
    await page.goForward();
    await expect(page.locator('main h1')).toHaveText('Presales');
  });

  test('2.33 explorer-views › Find a step', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/w/presales');
    await page.getByTestId('search-input').fill('solution fit');
    await page.getByTestId('search-input').press('Enter');
    const group = page.getByTestId('search-group-step');
    await expect(group.locator('h2')).toContainText('Steps');
    const hit = group.getByRole('link', { name: 'Assess solution fit' });
    await expect(hit).toBeVisible();
    await hit.click();
    await expect(detailTitle(page)).toHaveText('Assess solution fit');
  });

  test('2.35 explorer-views › Change markers', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const pills = (id) => page.getByTestId(`step-${id}`).locator('.pill text');
    await expect(pills('decline')).toHaveCount(0);
    await page.getByTestId('change-toggle').locator('input').check();
    await expect(page).toHaveURL(/changes=1/);
    await expect(pills('decline')).toHaveText(['New']);
    await expect(pills('kick-off-bid')).toHaveText(['Changed']);
    await expect(page.getByTestId('step-decline')).toHaveAttribute('aria-label', /\bNew\./);
    await page.getByTestId('step-kick-off-bid').click();
    const detail = page.getByTestId('step-detail');
    await expect(detail.getByTestId('badge')).toHaveText('Changed');
    await expect(detail.getByTestId('today')).toContainText('Today');
    await expect(detail.getByTestId('today')).toContainText('Kick-off happened by email, and Globex joined a week later.');
  });

  test('2.36 explorer-views › Keyboard through a swimlane', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.locator('main h1').focus();
    let testid = '';
    for (let i = 0; i < 15 && !testid.startsWith('step-'); i++) {
      await page.keyboard.press('Tab');
      testid = await page.evaluate(() => document.activeElement.dataset.testid || '');
    }
    expect(testid, 'first step reached by Tab').toBe('step-capture-lead');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('step-assess-fit')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(detailTitle(page)).toHaveText('Assess solution fit');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('step-detail')).toHaveCount(0);
    await expect(page.getByTestId('step-assess-fit')).toBeFocused();
  });

  test('2.37 explorer-views › Mobile swimlane', { tag: '@mobile-only' }, async ({ page }) => {
    expect(page.viewportSize().width).toBe(375);
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const lane = page.getByTestId('swimlane');
    await expect(lane).toHaveAttribute('data-layout', 'list');
    await expect(lane.locator('svg')).toHaveCount(0);
    const items = lane.getByTestId('swimlane-list').locator('> li');
    await expect(items).toHaveCount(5);
    const ids = await lane.locator('a.flow-item').evaluateAll((as) => as.map((a) => a.dataset.step));
    // Flow order: every forward connector goes down the list.
    const pos = Object.fromEntries(ids.map((id, i) => [id, i]));
    for (const [from, to] of [['capture-lead', 'assess-fit'], ['assess-fit', 'go-no-go'], ['go-no-go', 'kick-off-bid'], ['go-no-go', 'decline']]) expect(pos[from]).toBeLessThan(pos[to]);
    expect(ids[0]).toBe('capture-lead');
    for (const [step, owner] of QUALIFY) {
      const it = lane.getByTestId(`step-${step}`);
      const roleName = { 'account-lead': 'Account lead', 'solution-architect': 'Solution architect', 'bid-manager': 'Bid manager' }[owner];
      await expect(it.locator('.fi-lane')).toHaveText(`${roleName} · ${PARTY_NAME[PARTY[owner]]}`);
      await expect(it.locator('.fi-next')).toHaveText(/^(Next: .+|End of the flow)$/);
    }
    await expect(lane.getByTestId('step-go-no-go').locator('.fi-next')).toHaveText('Next: Kick off the bid (Go), Decline politely (No go)');
    // Vertical: each item below the previous one.
    const tops = await items.evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect().top));
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe('explorer-views (three detailed processes)', () => {
  const snap = useSnapshot('three-processes');

  test('2.34 explorer-views › Progress updates', async ({ page }) => {
    await openSnapshot(page, snap);
    const progress = page.getByTestId('progress');
    await expect(progress).toContainText('0 of 3 processes explored');
    await page.getByTestId('workstream-card-main-ws').click();
    await page.getByTestId('process-card-flow').click();
    await expect(progress).toContainText('1 of 3 processes explored');
    await page.goBack();
    await page.getByTestId('process-card-flow-2').click();
    await expect(page.locator('main h1')).toHaveText('Flow number 2');
    await expect(progress).toContainText('2 of 3 processes explored');
    // Progress does not restrict navigation, and links to the key messages.
    await progress.getByTestId('key-messages-button').click();
    await expect(page.getByTestId('key-messages-dialog')).toBeVisible();
    await expect(page.getByTestId('key-messages-dialog').locator('li')).toHaveCount(2);
  });
});
