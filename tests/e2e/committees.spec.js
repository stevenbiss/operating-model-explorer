// Change add-committee-decisions, Test tasks 2.1–2.82. New end-to-end tests for every scenario that is about
// committees, on dist/operating-model-explorer.html via file:// (author mode) and on snapshots exported through the
// real Export button (viewer mode). Tests are named "<task> <capability> › <scenario>".
//
// Scenarios already covered by an existing test (not duplicated here):
//   2.28 content-schema › Minimal valid model            = content-schema.spec.js "2.1 content-schema › Minimal valid model"
//   2.29 content-schema › Missing model file             = content-schema.spec.js "2.2 content-schema › Missing model file"
//   2.30 content-schema › Brand packs are not elements   = party-brands.spec.js "2.30 content-schema › Brand packs are not elements"
//   2.31 content-schema › Structure found by type        = structure-diagrams.spec.js "2.37 content-schema › Structure found by type, not folder"
//   2.33 content-schema › Sample exercises every type    = content-schema.spec.js "2.6 …", structure-diagrams.spec.js "2.38 …", plus the committee part here
//   2.34 content-schema › Missing required field         = content-schema.spec.js "2.7 content-schema › Missing required field"
//   2.35 content-schema › Duplicate id                   = content-schema.spec.js "2.8 content-schema › Duplicate id"
//   2.36 content-schema › Structure and workstream …     = structure-diagrams.spec.js "2.41 content-schema › Structure and workstream cannot share an id"
//   2.37 content-schema › Unknown owner                  = content-schema.spec.js "2.9 content-schema › Unknown owner"
//   2.39 content-schema › Unknown party on a line        = structure-diagrams.spec.js "2.43 content-schema › Unknown party on a line"
//   2.40 content-schema › Live step with a removed owner = removed-element-page.spec.js "a removed role opens as normal, … a step it still owns is a warning"
//   2.42 / 2.43 / 2.45 content-schema                    = capture-sheet-authoring.spec.js "2.42 …", "2.43 …", "2.44 content-schema › Sample stays clean"
//   2.46 / 2.47 / 2.50 / 2.51 / 2.52 capture-sheet       = capture-sheet-authoring.spec.js "2.1", "2.2", "2.5", "2.6", "2.55"
//   2.48 capture-sheet › Structure section recognised    = structure-diagrams.spec.js "2.46 capture-sheet › Structure section recognised"
//   2.58 / 2.59 / 2.60 / 2.62 / 2.64 / 2.67 / 2.70       = explorer-views.spec.js "2.26", "2.27", "2.28", "2.29", "2.30", "2.33", "2.37"
//   2.65 / 2.68 explorer-views                           = structure-diagrams.spec.js "2.60 … Role in diagrams", "2.62 … Find a person on a diagram"
//   2.72 / 2.74 / 2.75 / 2.77 persona-lens               = persona-lens.spec.js "2.41", "2.42", "2.43", "2.44"
//   2.78 theming › Rename workstream                     = theming.spec.js "2.19 theming › Rename workstream"
//   2.79 theming › Rename structure                      = structure-diagrams.spec.js "2.64 theming › Rename structure"
// Validation-message wording is also unit-tested in tests/unit/validate.test.js, sheet.test.js and layout.test.js.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, openEngine, loadZip, loadFolder, trySample, skipPrompt, messages, go, variant, fixtureDir, useSnapshot, openSnapshot, exportSnapshot, noHorizontalScroll } from './helpers.js';

const pv = (page) => page.getByTestId('preview');
const counts = (page) => page.getByTestId('report-counts');
const msg = (page, hasText) => messages(page).filter({ hasText });
const detail = (page) => page.getByTestId('step-detail');
const SHEET = readFileSync(join(fixtureDir('sheet-committees'), 'capture-sheet.md'), 'utf8');

// Lane headers and party/committee bands of the first swimlane inside scope, with their vertical extents.
async function geometry(scope) {
  const lanes = await scope.locator('.lane-heads [data-testid^="lane-"]').evaluateAll((els) =>
    els.map((a) => ({ id: a.dataset.testid.slice(5), y: +a.querySelector('.lane-hit').getAttribute('y'), h: +a.querySelector('.lane-hit').getAttribute('height'), text: a.textContent.replace(/\s+/g, ' ').trim() })),
  );
  const bands = await scope.locator('.lane-heads .band').evaluateAll((gs) => gs.map((g) => ({ name: g.querySelector('.band-name').textContent.trim(), y: +g.querySelector('.band-bg').getAttribute('y') })));
  return { lanes, bands, lane: (id) => lanes.find((l) => l.id === id) };
}
// The step's box lies inside the lane's vertical extent.
async function expectInLane(scope, step, laneId) {
  const g = await geometry(scope);
  const l = g.lane(laneId);
  expect(l, `lane ${laneId} exists`).toBeTruthy();
  const b = await scope.locator(`svg.swimlane [data-testid="step-${step}"] .box`).evaluate((r) => ({ y: +r.getAttribute('y'), h: +r.getAttribute('height') }));
  expect(b.y, `${step} inside the ${laneId} lane`).toBeGreaterThanOrEqual(l.y);
  expect(b.y + b.h, `${step} inside the ${laneId} lane`).toBeLessThanOrEqual(l.y + l.h);
}
// The lane's band: the last band starting above it.
const bandOf = (g, laneId) => g.bands.filter((b) => b.y <= g.lane(laneId).y).at(-1).name;
const pillsOf = (scope, step) => scope.locator(`svg.swimlane [data-testid="step-${step}"] .pill text`);
// Member rows of a committee members block: [[party, role, letter word], ...].
const memberRows = (block) =>
  block.locator('[data-testid="member-party"]').evaluateAll((ps) =>
    ps.flatMap((p) => [...p.querySelectorAll('tr')].map((tr) => [[...p.querySelector('.ptag').childNodes].filter((n) => !(n.classList && n.classList.contains('mk'))).map((n) => n.textContent).join('').trim(), tr.querySelector('th a, th').textContent.trim(), tr.querySelector('td').textContent.replace(/\s+/g, ' ').trim()])),
  );

// ---------------------------------------------------------------------------------------------------------------
test.describe('committees (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 committees › Committee loads from a folder', async ({ page }) => {
    await loadFolder(page, 'committee-basic');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(msg(page, /bid.board/i)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/flow/s/go-no-go');
    const owner = pv(page).getByTestId('owner');
    await expect(owner).toContainText('Bid board');
    await expect(owner.getByTestId('by-committee')).toHaveText('By committee');
    await expectInLane(pv(page), 'go-no-go', 'bid-board');
  });

  test('2.2 committees › Committee with no members', async ({ page }) => {
    await loadZip(page, variant('committee-basic', 'committee-no-members', { 'committees/01-bid-board.md': (t) => t.replace(/members:[\s\S]*?\n---/, 'members: {}\n---') }));
    const m = msg(page, 'has no members');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('"Bid board"');
    await expect(m).toContainText('at least one member role');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.3 committees › Member without a valid letter', async ({ page }) => {
    await loadFolder(page, 'committee-member-letter');
    let m = msg(page, 'Partner manager');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('The committee "Bid board"');
    await expect(m.locator('.msg-problem')).toContainText('"A/R"');
    await expect(m.locator('.msg-fix')).toContainText('Use one of R, A, C or I');
    await expect(page.getByTestId('export')).toBeDisabled();
    // No letter at all.
    await page.getByTestId('load-other').click();
    await loadZip(page, variant('committee-basic', 'committee-no-letter', { 'committees/01-bid-board.md': (t) => t.replace('partner-manager: A', 'partner-manager:') }));
    m = msg(page, 'Partner manager');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('The committee "Bid board"');
    await expect(m.locator('.msg-problem')).toContainText('no RACI letter');
    await expect(m.locator('.msg-fix')).toContainText('Use one of R, A, C or I');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.4 committees › Unknown member', async ({ page }) => {
    await loadFolder(page, 'committee-unknown-member');
    const m = msg(page, 'partner-mgr');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('Bid board');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean partner-manager?');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.5 committees › No accountable member', async ({ page }) => {
    await loadFolder(page, 'committee-no-a');
    const m = msg(page, 'is marked A');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('No member of the committee "Bid board" is marked A');
    await expect(m.locator('.msg-fix')).toContainText('Which members make the decision');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.6 committees › One accountable member', async ({ page }) => {
    await loadFolder(page, 'committee-one-a');
    const m = msg(page, 'Only one member');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('"Bid board"');
    await expect(m.locator('.msg-fix')).toContainText('Make Account lead the owner');
    await expect(m.locator('.msg-fix')).toContainText(/RACI/);
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.7 committees › Accountable members from one party', async ({ page }) => {
    await loadFolder(page, 'committee-one-party');
    const m = msg(page, 'all belong to');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('"Bid board"');
    await expect(m.locator('.msg-problem')).toContainText('Alpha Ltd');
    await expect(m.locator('.msg-fix')).toContainText('team or a single owner');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.8 committees › Committee that owns nothing', async ({ page }) => {
    await loadFolder(page, 'committee-unused');
    const m = msg(page, "doesn't own any step");
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('"Steering group"');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.9 committees › Same name as a role', async ({ page }) => {
    await loadFolder(page, 'committee-name-clash');
    const m = msg(page, 'same name');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('The committee "Bid board"');
    await expect(m.locator('.msg-problem')).toContainText('the role "Bid Board"');
    await expect(m.locator('.msg-fix')).toContainText(/Rename the committee or the role|different name/i);
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.11 committees › Committee owns a working step', async ({ page }) => {
    await loadFolder(page, 'committee-basic');
    await expect(page.locator('[data-testid="report-message"][data-level="error"]')).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/flow');
    // "Review together" has no branches and is owned by the bid board.
    await expect(pv(page).locator('svg.swimlane path.edge[data-from="review"]')).toHaveCount(0);
    await expectInLane(pv(page), 'review', 'bid-board');
    await expect(pillsOf(pv(page), 'review')).toHaveText(['By committee']);
  });

  test('2.12 committees › Joint accountability', async ({ page }) => {
    await loadFolder(page, 'committee-basic');
    await expect(msg(page, /accountable/i)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/flow/s/go-no-go');
    const rows = await memberRows(pv(page).getByTestId('committee-members'));
    expect(rows.filter(([, , l]) => /^A /.test(l))).toEqual([
      ['Alpha Ltd', 'Account lead', 'A Accountable, jointly'],
      ['Beta Inc', 'Partner manager', 'A Accountable, jointly'],
    ]);
  });

  test('2.13 committees › Others informed on the step', async ({ page }) => {
    await loadFolder(page, 'committee-basic');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/flow/s/go-no-go');
    const d = detail(pv(page));
    const raci = d.locator('.field', { has: page.locator('h3', { hasText: /^RACI$/ }) });
    await expect(raci.locator('tr')).toHaveCount(1);
    await expect(raci.locator('tr th')).toHaveText('Delivery manager');
    await expect(raci.locator('tr td')).toContainText('Informed');
    // Below the committee members.
    const membersBottom = await d.getByTestId('committee-members').evaluate((e) => e.getBoundingClientRect().bottom);
    const raciTop = await raci.evaluate((e) => e.getBoundingClientRect().top);
    expect(raciTop).toBeGreaterThanOrEqual(membersBottom);
  });

  test('2.14 committees › A non-member marked A', async ({ page }) => {
    await loadFolder(page, 'committee-nonmember-a');
    const m = msg(page, 'Bid manager has A');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('Go or no-go');
    await expect(m.locator('.msg-problem')).toContainText('"Bid board"');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.15 committees › A member given a letter on the step', async ({ page }) => {
    await loadFolder(page, 'committee-member-on-step');
    const m = msg(page, "Members' letters are set on the committee");
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('Partner manager');
    await skipPrompt(page);
    await go(page, '#/p/flow/s/go-no-go');
    const rows = await memberRows(pv(page).getByTestId('committee-members'));
    expect(rows.find(([, r]) => r === 'Partner manager')).toEqual(['Beta Inc', 'Partner manager', 'A Accountable, jointly']);
    // The step's own C for the member is not shown anywhere in the detail.
    await expect(detail(pv(page)).locator('tr', { hasText: 'Partner manager' })).toHaveCount(1);
    await expect(detail(pv(page)).locator('tr', { hasText: 'Partner manager' })).not.toContainText('Consulted');
  });

  test('2.32 content-schema › Committee found by type, not folder', async ({ page }) => {
    const src = readFileSync(join(fixtureDir('committee-basic'), 'committees', '01-bid-board.md'), 'utf8');
    await loadZip(page, variant('committee-basic', 'committee-in-roles', { 'committees/01-bid-board.md': null, 'roles/bid-board.md': src }));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(msg(page, /bid.board/i)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/e/bid-board');
    await expect(pv(page).locator('main h1')).toHaveText('Bid board');
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Committee');
  });

  test('2.33 content-schema › Sample exercises every type (committee)', async ({ page }) => {
    // The other types and the decision step: content-schema.spec.js "2.6" and structure-diagrams.spec.js "2.38".
    await trySample(page);
    await expect(counts(page)).toContainText('0 errors');
    await skipPrompt(page);
    await go(page, '#/e/bid-board');
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Committee');
    await expect(pv(page).locator('main h1')).toHaveText('Acme + Globex bid board');
    await go(page, '#/p/qualify-opportunity');
    await expect(pv(page).locator('svg.swimlane path.edge[data-from="go-no-go"]')).toHaveCount(2);
  });

  test('2.38 content-schema › Unknown owner close to a committee', async ({ page }) => {
    await loadZip(page, variant('committee-basic', 'owner-bid-bord', { 'processes/01-flow.md': (t) => t.replace('name: Go or no-go\n    owner: bid-board', 'name: Go or no-go\n    owner: bid-bord') }));
    const m = msg(page, 'bid-bord');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('processes/01-flow.md');
    await expect(m.locator('.msg-where')).toContainText(/go-no-go|Go or no-go/);
    await expect(m.locator('.msg-fix')).toContainText('Did you mean bid-board?');
  });

  test('2.41 content-schema › Live step with a removed committee', async ({ page }) => {
    await loadFolder(page, 'committee-removed');
    const m = msg(page, 'marked as removed').filter({ hasText: 'go-no-go' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('committee "bid-board"');
    await expect(page.locator('[data-testid="report-message"][data-level="error"]')).toHaveCount(0);
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.44 content-schema › Committee counts as accountable', async ({ page }) => {
    await loadFolder(page, 'committee-basic');
    // "Go or no-go" and "Review together" have no A of their own; the bid board has two A members.
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(msg(page, /accountable|signs it off/i)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('committees (exported committee-basic)', () => {
  const snap = useSnapshot('committee-basic');

  test('2.10 committees › Committee owns a decision', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    const body = page.locator('body');
    await expectInLane(body, 'go-no-go', 'bid-board');
    const svg = page.locator('svg.swimlane').first();
    await expect(svg.locator('path.edge[data-from="go-no-go"]')).toHaveCount(2);
    await expect(svg.locator('path.edge[data-from="go-no-go"][data-to="scope"]')).toHaveCount(1);
    await expect(svg.locator('path.edge[data-from="go-no-go"][data-to="decline"]')).toHaveCount(1);
    expect(await svg.locator('.edge-label').allTextContents()).toEqual(expect.arrayContaining(['Go', 'No go']));
  });

  test('2.16 committees › Committee lane and badge', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    const g = await geometry(page.locator('body'));
    expect(g.bands.map((b) => b.name)).toEqual(['Alpha Ltd', 'Committees', 'Beta Inc']);
    expect(bandOf(g, 'bid-board')).toBe('Committees');
    expect(bandOf(g, 'account-lead')).toBe('Alpha Ltd');
    expect(bandOf(g, 'partner-manager')).toBe('Beta Inc');
    // Header: only the committee's name, linking to its page; no member list.
    expect(g.lane('bid-board').text.trim()).toBe('Bid board');
    await expect(page.getByTestId('lane-bid-board')).toHaveAttribute('href', /#\/e\/bid-board/);
    await expectInLane(page.locator('body'), 'go-no-go', 'bid-board');
    await expect(pillsOf(page, 'go-no-go')).toHaveText(['By committee']);
  });

  test('2.21 committees › Handoff into a committee', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    const svg = page.locator('svg.swimlane').first();
    // Capture the lead (Account lead, Alpha) -> Go or no-go (Alpha + Beta bid board).
    const into = svg.locator('path.edge[data-from="capture"][data-to="go-no-go"]');
    await expect(into).toHaveClass(/\bcross\b/);
    await expect(into).toHaveAttribute('marker-end', 'url(#om-open)');
  });
});

test.describe('committees (exported two committees)', () => {
  const snap = useSnapshot('committee-two');

  test('2.18 committees › Two committees in one process', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    const g = await geometry(page.locator('body'));
    // One heading, between the two parties.
    expect(g.bands.map((b) => b.name)).toEqual(['Alpha Ltd', 'Committees', 'Beta Inc']);
    expect(bandOf(g, 'pricing-panel')).toBe('Committees');
    expect(bandOf(g, 'bid-board')).toBe('Committees');
    // The pricing panel is listed second in the content but owns the first committee step, so its lane is on top.
    expect(g.lane('pricing-panel').y).toBeLessThan(g.lane('bid-board').y);
    await expectInLane(page.locator('body'), 'price', 'pricing-panel');
    await expectInLane(page.locator('body'), 'go-no-go', 'bid-board');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('committees (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.17 committees › Membership shown in the member\'s own lane', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('lane-partner-manager')).toContainText('Acme + Globex bid board member · A');
    await expect(page.getByTestId('lane-solution-architect')).toContainText('Acme + Globex bid board member · C');
  });

  test('2.19 committees › Lane header opens the committee', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.getByTestId('lane-bid-board').click();
    await expect(page).toHaveURL(/#\/e\/bid-board/);
    await expect(page.locator('main h1')).toHaveText('Acme + Globex bid board');
    await expect(page.getByTestId('committee-members')).toBeVisible();
  });

  test('2.20 committees › Open the committee decision', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.getByTestId('step-go-no-go').click();
    const d = detail(page);
    await expect(d.locator('h2#om-detail-title')).toHaveText('Go or no-go');
    await expect(d.getByTestId('owner')).toContainText('Acme + Globex bid board');
    await expect(d.getByTestId('owner').getByTestId('by-committee')).toHaveText('By committee');
    const block = d.getByTestId('committee-members');
    await expect(block.locator('[data-testid="member-party"] .ptag')).toHaveText(['Acme Corp', 'Globex']);
    expect(await memberRows(block)).toEqual([
      ['Acme Corp', 'Account lead', 'A Accountable, jointly'],
      ['Acme Corp', 'Bid manager', 'I Informed'],
      ['Globex', 'Partner manager', 'A Accountable, jointly'],
      ['Globex', 'Solution architect', 'C Consulted'],
    ]);
    // Each party heading carries the party's mark.
    await expect(block.locator('[data-testid="member-party"] .ptag .mk')).toHaveCount(2);
    // The owner leads, before the members.
    const ownerTop = await d.getByTestId('owner').evaluate((e) => e.getBoundingClientRect().top);
    expect(await block.evaluate((e) => e.getBoundingClientRect().top)).toBeGreaterThan(ownerTop);
  });

  test('2.22 committees › Committee page content', async ({ page }) => {
    await openSnapshot(page, snap, '#/e/bid-board');
    await skipPrompt(page);
    const main = page.locator('main');
    await expect(main.locator('h1')).toHaveText('Acme + Globex bid board');
    await expect(main).toContainText('Decides together whether to bid.');
    const members = main.getByTestId('committee-members');
    expect(await memberRows(members)).toEqual([
      ['Acme Corp', 'Account lead', 'A Accountable, jointly'],
      ['Acme Corp', 'Bid manager', 'I Informed'],
      ['Globex', 'Partner manager', 'A Accountable, jointly'],
      ['Globex', 'Solution architect', 'C Consulted'],
    ]);
    for (const a of await members.locator('th a').all()) await expect(a).toHaveAttribute('href', /^#\/r\/[a-z-]+/);
    const steps = main.getByTestId('committee-steps');
    await expect(steps.locator('.group h3')).toHaveText(['Qualify an opportunity']);
    await expect(steps.locator('.step-list a')).toHaveText(['Go or no-go']);
    // Working links.
    await members.getByRole('link', { name: 'Partner manager' }).click();
    await expect(main.locator('h1')).toHaveText('Partner manager');
    await page.goBack();
    await steps.getByRole('link', { name: 'Go or no-go' }).click();
    await expect(detail(page).locator('h2')).toHaveText('Go or no-go');
    await page.goBack();
    await steps.getByRole('link', { name: 'Qualify an opportunity' }).click();
    await expect(main.locator('h1')).toHaveText('Qualify an opportunity');
  });

  test('2.23 committees › Deep link to a committee', async ({ page, context }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.getByTestId('lane-bid-board').click();
    await expect(page.locator('main h1')).toHaveText('Acme + Globex bid board');
    const url = page.url();
    const tab = await context.newPage();
    await tab.goto(url);
    await expect(tab.locator('main h1')).toHaveText('Acme + Globex bid board');
    await expect(tab.getByTestId('committee-members')).toBeVisible();
    await expect(tab.getByTestId('persona-prompt')).toBeHidden();
  });

  test('2.24 committees › Keyboard into a committee step', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.locator('main h1').focus();
    let testid = '';
    for (let i = 0; i < 20 && testid !== 'step-assess-fit'; i++) {
      await page.keyboard.press('Tab');
      testid = await page.evaluate(() => document.activeElement.dataset.testid || '');
    }
    expect(testid, 'the step before the committee step, reached by Tab').toBe('step-assess-fit');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('step-go-no-go')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(detail(page).locator('h2#om-detail-title')).toHaveText('Go or no-go');
    await expect(detail(page).getByTestId('committee-members').locator('[data-testid="member-party"] .ptag')).toHaveText(['Acme Corp', 'Globex']);
    await page.keyboard.press('Escape');
    await expect(detail(page)).toHaveCount(0);
    await expect(page.getByTestId('step-go-no-go')).toBeFocused();
  });

  test('2.25 committees › Accessible name', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const step = page.getByTestId('step-go-no-go');
    await expect(step).toHaveAccessibleName(/^Go or no-go\b/);
    await expect(step).toHaveAccessibleName(/by committee/);
    await expect(step).toHaveAccessibleName(/Acme \+ Globex bid board/);
    // The committee lane header is its name only; member lane headers expose membership and letters as text.
    await expect(page.getByTestId('lane-bid-board')).toHaveAccessibleName('Acme + Globex bid board');
    await expect(page.getByTestId('lane-partner-manager')).toHaveAccessibleName(/Acme \+ Globex bid board member · A/);
  });

  test('2.26 committees › Mobile committee step', { tag: '@mobile-only' }, async ({ page }) => {
    expect(page.viewportSize().width).toBe(375);
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const lane = page.getByTestId('swimlane');
    await expect(lane).toHaveAttribute('data-layout', 'list');
    const it = lane.getByTestId('step-go-no-go');
    // The committee's name and badge only, no member list.
    await expect(it.locator('.fi-lane')).toHaveText('Acme + Globex bid board');
    for (const m of ['Account lead', 'Bid manager', 'Partner manager', 'Solution architect']) await expect(it).not.toContainText(m);
    await expect(it.getByTestId('by-committee')).toHaveText('By committee');
    expect(await noHorizontalScroll(page)).toBe(true);
    // Its detail shows the members split by organisation, as on wider screens.
    await it.click();
    await expect(detail(page).getByTestId('committee-members').locator('[data-testid="member-party"] .ptag')).toHaveText(['Acme Corp', 'Globex']);
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.61 explorer-views › Process without committees', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/build-proposal');
    const g = await geometry(page.locator('body'));
    expect(g.bands.length).toBeGreaterThan(0);
    expect(g.bands.map((b) => b.name)).not.toContain('Committees');
    await expect(page.locator('svg.swimlane .pill.committee')).toHaveCount(0);
    await expect(page.getByTestId('swimlane')).not.toContainText(/committee/i);
  });

  test('2.63 explorer-views › Committee owner in the detail', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity/s/go-no-go');
    const owner = detail(page).getByTestId('owner');
    await expect(owner.getByRole('link', { name: 'Acme + Globex bid board' })).toBeVisible();
    await expect(owner.getByTestId('by-committee')).toHaveText('By committee');
    await expect(detail(page).getByTestId('committee-members').locator('[data-testid="member-party"] .ptag')).toHaveText(['Acme Corp', 'Globex']);
    await expect(detail(page).getByTestId('committee-members').locator('td').first()).toContainText(/^[RACI] /);
    await owner.getByRole('link', { name: 'Acme + Globex bid board' }).click();
    await expect(page.locator('main h1')).toHaveText('Acme + Globex bid board');
    await expect(page).toHaveURL(/#\/e\/bid-board/);
  });

  test('2.66 explorer-views › Role on a committee', async ({ page }) => {
    await openSnapshot(page, snap, '#/r/partner-manager');
    const main = page.locator('main');
    await expect(main.locator('h1')).toHaveText('Partner manager');
    const coms = main.getByTestId('role-committees');
    await expect(coms.locator('li')).toHaveCount(1);
    await expect(coms.getByRole('link', { name: 'Acme + Globex bid board' })).toHaveAttribute('href', /#\/e\/bid-board/);
    await expect(coms.locator('li abbr')).toHaveText('A');
    const row = main.locator('.group', { has: page.locator('h3', { hasText: 'Qualify an opportunity' }) }).locator('li', { hasText: 'Go or no-go' });
    await expect(row).toHaveCount(1);
    await expect(row.locator('abbr')).toHaveText('A');
    await expect(row.getByTestId('via-committee')).toHaveText('Acme + Globex bid board');
    await coms.getByRole('link', { name: 'Acme + Globex bid board' }).click();
    await expect(main.locator('h1')).toHaveText('Acme + Globex bid board');
  });

  test('2.69 explorer-views › Find a committee', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/w/presales');
    await page.getByTestId('search-input').fill('bid board');
    await page.getByTestId('search-input').press('Enter');
    const group = page.getByTestId('search-group-committee');
    await expect(group.locator('h2')).toContainText('Committees');
    const hit = group.getByRole('link', { name: /Acme \+ Globex bid board/ });
    await expect(hit).toBeVisible();
    await hit.click();
    await expect(page.locator('main h1')).toHaveText('Acme + Globex bid board');
    await expect(page.getByTestId('committee-members')).toBeVisible();
  });

  test('2.71 explorer-views › Open a party from search', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/w/presales');
    await page.getByTestId('search-input').fill('Globex');
    await page.getByTestId('search-input').press('Enter');
    const group = page.getByTestId('search-group-party');
    await expect(group).toBeVisible();
    await group.getByRole('link', { name: /^Globex/ }).click();
    const main = page.locator('main');
    await expect(main.locator('h1')).toHaveText('Globex');
    await expect(main).toContainText('The solution partner. Globex designs, prices and builds the solution.');
    await expect(main.locator('a.chip[href="#/e/globex-solutions"]')).toBeVisible();
    for (const r of ['partner-manager', 'solution-architect', 'pricing-analyst']) await expect(main.locator(`a.chip[href="#/r/${r}"]`)).toBeVisible();
    await main.locator('a.chip[href="#/r/partner-manager"]').click();
    await expect(main.locator('h1')).toHaveText('Partner manager');
  });

  test('2.73 persona-lens › Your committee', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=acme-account-lead');
    await expect(page.getByTestId('lane-bid-board')).toContainText('Your committee');
    await expect(page.getByTestId('lane-bid-board').locator('.pill.cue')).toHaveText('Your committee');
    await expect(page.getByTestId('step-go-no-go')).toHaveClass(/\bmine\b/);
    await expect(page.getByTestId('lane-account-lead')).toContainText('Your lane');
    await expect(page.getByTestId('lane-account-lead')).not.toContainText('Your committee');
  });

  test('2.76 persona-lens › Committee step in the summary', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/me?persona=acme-account-lead');
    await expect(page.locator('main h1')).toHaveText('What matters for me');
    const row = page.getByTestId('me-group-qualify-opportunity').getByTestId('me-step').filter({ hasText: 'Go or no-go' });
    await expect(row).toHaveCount(1);
    await expect(row.locator('abbr')).toHaveText('A');
    await expect(row.getByTestId('via-committee')).toHaveText('Acme + Globex bid board');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('committees (sample, both forms)', () => {
  test('2.27 committees › Sample committee loads', async ({ page }) => {
    for (const load of [(p) => loadFolder(p, 'acme-sample'), (p) => loadFolder(p, 'acme-capture-sheet')]) {
      await openEngine(page);
      await load(page);
      await expect(counts(page)).toHaveText('0 errors, 0 warnings');
      await skipPrompt(page);
      await go(page, '#/e/bid-board');
      await expect(pv(page).locator('main h1')).toHaveText('Acme + Globex bid board');
      const proc = pv(page).getByTestId('committee-steps').getByRole('link', { name: 'Qualify an opportunity' });
      await proc.click();
      await expect(pv(page).locator('main h1')).toHaveText('Qualify an opportunity');
      const step = pv(page).locator('svg.swimlane .node', { hasText: 'Go or no-go' });
      const id = await step.getAttribute('data-step');
      await expectInLane(pv(page), id, 'bid-board');
      await expect(pillsOf(pv(page), id)).toHaveText(['By committee']);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('capture-sheet committees (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));
  const sheet = (name, fn) => variant('sheet-committees', name, { 'capture-sheet.md': fn });

  test('2.49 capture-sheet › Committees section recognised', async ({ page }) => {
    await loadFolder(page, 'sheet-committees');
    await expect(msg(page, /section|heading/i)).toHaveCount(0);
    await expect(msg(page, 'Committees')).toHaveCount(0);
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
  });

  test('2.53 capture-sheet › Same name for a role and a committee', async ({ page }) => {
    await loadZip(page, sheet('sheet-role-committee-clash', (t) => t.replace('| Solution architect | Beta Inc | Designs the solution. |', '| Solution architect | Beta Inc | Designs the solution. |\n| Bid board | Alpha Ltd | A role with the committee\'s name. |')));
    const m = msg(page, 'same name');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('Committees › row 1 (Bid board)');
    await expect(m).toContainText('Roles › row 6 (Bid board)');
    await expect(m.locator('.msg-fix')).toContainText(/Rename the committee or the role|different name/i);
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.54 capture-sheet › Committee owns a step in a sheet', async ({ page }) => {
    // The fixture's Committees row: "Account lead (A); Partner manager (A); Solution architect (C)"; the step Owner is "bid board".
    await loadZip(page, sheet('sheet-committee-two-members', (t) => t.replace('Account lead (A); Partner manager (A); Solution architect (C)', 'Account lead (A); Partner manager (A)')));
    await expect(page.locator('[data-testid="report-message"][data-level="error"]')).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/main-flow');
    await expect(pv(page).locator('main h1')).toHaveText('Main flow');
    const step = pv(page).locator('svg.swimlane .node', { hasText: 'Go or no-go' });
    const id = await step.getAttribute('data-step');
    await expectInLane(pv(page), id, 'bid-board');
    await expect(pillsOf(pv(page), id)).toHaveText(['By committee']);
    await expect(pv(page).getByTestId('lane-bid-board')).toContainText('Bid board');
  });

  test('2.55 capture-sheet › Unknown member in a sheet', async ({ page }) => {
    await loadZip(page, sheet('sheet-unknown-member', (t) => t.replace('Partner manager (A)', 'Partner mgr (A)')));
    const m = msg(page, 'Partner mgr');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Committees › row 1 (Bid board)');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean Partner manager?');
  });

  test('2.56 capture-sheet › Member without a letter in a sheet', async ({ page }) => {
    await loadZip(page, sheet('sheet-member-no-letter', (t) => t.replace('Account lead (A); Partner manager (A)', 'Account lead; Partner manager (A)')));
    const m = msg(page, 'Account lead has no RACI letter');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Committees › row 1 (Bid board)');
    await expect(m.locator('.msg-fix')).toContainText('one letter in brackets');
    await expect(m.locator('.msg-fix')).toContainText('A if they share the decision, C if consulted, I if informed, R if they do the work');
  });

  test('2.57 capture-sheet › Missing Members column', async ({ page }) => {
    await loadZip(page, sheet('sheet-no-members-column', (t) => t.replace('| Committee | Members | Summary |\n|---|---|---|\n| Bid board | Account lead (A); Partner manager (A); Solution architect (C) | Decides together whether to bid. |', '| Committee | Summary |\n|---|---|\n| Bid board | Decides together whether to bid. |')));
    const m = msg(page, '"Members" column');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toHaveText('Committees');
    await expect(m.locator('.msg-problem')).toHaveText('The Committees table has no "Members" column.');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// committee-labels (the theme renames committee/committees) plus a persona, with model text that doesn't say
// "committee", so any "committee" left in the viewer is the viewer's own wording.
const LABELLED = variant('committee-labels', 'committee-labels', {
  'model.md': '---\nid: committee-labels\ntype: model\nname: Tiny model (labels)\npurpose: A small test model.\nkey_messages:\n  - Decide together.\n---\n',
  'personas/alpha-lead.md': '---\nid: alpha-lead\ntype: persona\nname: Alpha lead\nsummary: You lead the client.\nroles: [account-lead]\nentry: { view: process, id: flow }\n---\n',
});

test.describe('theming (exported committee-labels)', () => {
  const snap = useSnapshot(LABELLED);

  test('2.80 theming › Rename committee', async ({ page }) => {
    const seen = [];
    const grab = async () => {
      seen.push(await page.locator('body').innerText());
      seen.push(await page.locator('[aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).join(' | ')));
    };
    await openSnapshot(page, snap);
    await grab(); // persona prompt
    await openSnapshot(page, snap, '#/p/flow?persona=alpha-lead');
    const g = await geometry(page.locator('body'));
    expect(g.bands.map((b) => b.name)).toEqual(['Alpha Ltd', 'Steering groups', 'Beta Inc']);
    await expect(pillsOf(page, 'go-no-go').first()).toHaveText('By steering group');
    await expect(page.getByTestId('lane-bid-board').locator('.pill.cue')).toHaveText('Your steering group');
    await expect(page.getByTestId('step-go-no-go')).toHaveAccessibleName(/by steering group/);
    await grab();
    await page.getByTestId('step-go-no-go').click();
    await expect(detail(page).getByTestId('by-committee')).toHaveText('By steering group');
    await grab();
    await openSnapshot(page, snap, '#/e/bid-board');
    await expect(page.locator('main .eyebrow').first()).toHaveText('Steering group');
    await grab();
    await openSnapshot(page, snap, '#/r/partner-manager');
    await expect(page.getByTestId('role-committees').locator('h2')).toHaveText('Steering groups');
    await grab();
    await openSnapshot(page, snap, '#/me?persona=alpha-lead');
    await grab();
    await openSnapshot(page, snap, '#/search?q=bid');
    await expect(page.getByTestId('search-group-committee').locator('h2')).toContainText('Steering groups');
    await grab();
    for (const t of seen) expect(t).not.toMatch(/committee/i);
  });
});
