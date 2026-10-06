// Change list-idle-committee-members, Test tasks 2.1–2.22: one test per scenario in the change's three delta specs
// (committees, explorer-views, persona-lens), on snapshots exported through the real Export button and opened via
// file://, at 1280×800. Tests are named "<task> <capability> › <scenario>".
//
// Scenarios already covered by an existing test (not duplicated here):
//   2.2  committees › Membership shown in the member's own lane      = committees.spec.js "2.17 committees › Membership shown in the member's own lane"
//   2.3  committees › Two committees in one process                  = committees.spec.js "2.18 committees › Two committees in one process"
//   2.4  committees › Lane header opens the committee                = committees.spec.js "2.19 committees › Lane header opens the committee"
//   2.5  committees › Committee after the first party with members   = wide-diagrams.spec.js "2.18 committees › Committee after the first party with members"
//   2.12 committees › Open the committee decision                    = committees.spec.js "2.20 committees › Open the committee decision"
//   2.13 committees › Sample committee loads                         = committees.spec.js "2.27 committees › Sample committee loads"
//   2.14 explorer-views › Lanes and steps                            = explorer-views.spec.js "2.26 explorer-views › Lanes and steps"
//   2.15 explorer-views › Decision branches                          = explorer-views.spec.js "2.27 explorer-views › Decision branches"
//   2.16 explorer-views › Cross-party handoff                        = explorer-views.spec.js "2.28 explorer-views › Cross-party handoff"
//   2.17 explorer-views › Process without committees                 = committees.spec.js "2.61 explorer-views › Process without committees"
// flow()'s idleness rules are unit-tested in tests/unit/layout.test.js ("1.1 …", and the placement test
// "committees sit where the first member party would be when all its members are idle").
import { test, expect, useSnapshot, openSnapshot, skipPrompt, variant, noHorizontalScroll } from './helpers.js';

// Lane headers and bands of the swimlane, with their vertical extents.
async function geometry(page) {
  const lanes = await page.locator('.lane-heads [data-testid^="lane-"]').evaluateAll((els) =>
    els.map((a) => ({ id: a.dataset.testid.slice(5), y: +a.querySelector('.lane-hit').getAttribute('y'), h: +a.querySelector('.lane-hit').getAttribute('height') })),
  );
  const bands = await page.locator('.lane-heads .band').evaluateAll((gs) =>
    gs.map((g) => ({ name: g.querySelector('.band-name').textContent.trim(), party: g.dataset.party, y: +g.querySelector('.band-bg').getAttribute('y') })).sort((a, b) => a.y - b.y),
  );
  return { lanes, bands, lane: (id) => lanes.find((l) => l.id === id), bandOf: (id) => bands.filter((b) => b.y <= lanes.find((l) => l.id === id).y).at(-1).name };
}
async function expectInLane(page, step, laneId) {
  const l = (await geometry(page)).lane(laneId);
  expect(l, `lane ${laneId} exists`).toBeTruthy();
  const b = await page.locator(`svg.swimlane [data-testid="step-${step}"] .box`).evaluate((r) => ({ y: +r.getAttribute('y'), h: +r.getAttribute('height') }));
  expect(b.y, `${step} inside the ${laneId} lane`).toBeGreaterThanOrEqual(l.y);
  expect(b.y + b.h, `${step} inside the ${laneId} lane`).toBeLessThanOrEqual(l.y + l.h);
}
// The idle entries listed in a committee lane's header, in order: their role ids.
const idleIds = (page, c) => page.locator(`.lane-heads [data-testid^="idle-${c}-"]:not([data-testid="idle-more-${c}"])`).evaluateAll((as, c) => as.map((a) => a.dataset.testid.slice(`idle-${c}-`.length)), c);
// The party shown beside an idle entry: its swatch's data-party, or that of the party mark drawn level with it.
async function entryParty(page, entry) {
  const sw = entry.locator('.idle-swatch');
  if (await sw.count()) return sw.getAttribute('data-party');
  const box = await entry.locator('.lane-hit').boundingBox();
  for (const m of await page.locator('.lane-heads .idle-mark').all()) {
    const mb = await m.boundingBox();
    if (mb.y + mb.height / 2 >= box.y && mb.y + mb.height / 2 <= box.y + box.height) return m.locator('.mk').getAttribute('data-party');
  }
  return null;
}
// Distinct text lines drawn in a committee lane's idle list (names, person lines and "+ N more").
const idleLines = (page, c) => page.locator(`.lane-heads [data-testid^="idle-${c}-"] text`).evaluateAll((ts) => new Set(ts.map((t) => t.getAttribute('y'))).size);
const tip = (page) => page.getByTestId('people-tip');

// In list order: by letter (A, C, I), then party, then role order (task 1.7).
const NINE = ['Partner director', 'Finance director', 'Legal counsel', 'Risk officer', 'Delivery director', 'HR partner', 'Comms lead', 'Security officer', 'Quality lead'];

// ---------------------------------------------------------------------------------------------------------------
// 2.1: committee-basic, varied so that both accountable members also take part in other steps.
const BOTH_ACTIVE = variant('committee-basic', 'committee-both-active', {
  'processes/01-flow.md': (t) => t.replace('    raci:\n      solution-architect: A\n', '    raci:\n      solution-architect: A\n      partner-manager: I\n'),
});
test.describe('idle members (exported committee-basic, both members active)', () => {
  const snap = useSnapshot(BOTH_ACTIVE);

  test('2.1 committees › Committee lane and badge', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    const g = await geometry(page);
    expect(g.bands.map((b) => b.name)).toEqual(['Alpha Ltd', 'Committees', 'Beta Inc']);
    // Both members take part elsewhere, so both have lanes, in their own parties; the committee sits between them.
    expect(g.bandOf('account-lead')).toBe('Alpha Ltd');
    expect(g.bandOf('partner-manager')).toBe('Beta Inc');
    expect(g.bandOf('bid-board')).toBe('Committees');
    expect(g.lane('account-lead').y).toBeLessThan(g.lane('bid-board').y);
    expect(g.lane('bid-board').y).toBeLessThan(g.lane('partner-manager').y);
    await expect(page.getByTestId('lane-bid-board').locator('.lane-name')).toHaveText('Bid board');
    await expect(page.locator('.lane-heads [data-testid^="idle-bid-board-"]')).toHaveCount(0); // nobody idle
    await expectInLane(page, 'go-no-go', 'bid-board');
    await expect(page.locator('svg.swimlane [data-testid="step-go-no-go"] .pill text')).toHaveText(['By committee']);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2.22: committee-three-parties, varied so the deal board's only members are two Acme roles that are idle.
const THREE_IDLE = variant('committee-three-parties', 'committee-three-idle', {
  'processes/01-deal.md': (t) => t.replace('      account-lead: I\n', ''),
  'committees/01-deal-board.md': (t) => t.replace('  account-lead: A\n  partner-manager: A\n', '  account-lead: A\n  bid-manager: C\n'),
  'roles/bid-manager.md': '---\nid: bid-manager\ntype: role\nname: Bid manager\nparty: acme\n---\n',
});
test.describe('idle members (exported committee-three-parties, idle Acme members)', () => {
  const snap = useSnapshot(THREE_IDLE);

  test('2.22 committees › Placement when member parties have no lanes', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/deal');
    const g = await geometry(page);
    expect(g.bands.map((b) => b.name)).toEqual(['Customer', 'Committees', 'Globex']);
    expect(g.lanes.map((l) => l.id)).toEqual(['buyer', 'deal-board', 'partner-manager']);
    expect(await idleIds(page, 'deal-board')).toEqual(['account-lead', 'bid-manager']);
    const acme = '1'; // Customer, Acme, Globex: Acme is the second party
    for (const [r, text] of [['account-lead', 'Account lead · A'], ['bid-manager', 'Bid manager · C']]) {
      const e = page.getByTestId(`idle-deal-board-${r}`);
      await expect(e).toContainText(text);
      await expect(e).toHaveAccessibleName(new RegExp(`^${text.split(' · ')[0]}, Acme, `));
      expect(await entryParty(page, e), `${r} shown with Acme's colour`).toBe(acme);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('idle members (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.6 committees › Idle member listed in the committee lane', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('lane-legal-counsel')).toHaveCount(0);
    expect(await idleIds(page, 'bid-board')).toEqual(['legal-counsel']);
    const e = page.getByTestId('idle-bid-board-legal-counsel');
    await expect(e).toHaveText('Legal counsel · C');
    await expect(e).toHaveAccessibleName('Legal counsel, Acme Corp, consulted');
    // Under Acme: its entry carries Acme's mark (or swatch).
    const acme = (await geometry(page)).bands.find((b) => b.name === 'Acme Corp').party;
    expect(await entryParty(page, e)).toBe(acme);
    // It sits in the bid board's header, below the committee's name.
    const lane = (await geometry(page)).lane('bid-board');
    const hit = await e.locator('.lane-hit').evaluate((r) => ({ y: +r.getAttribute('y'), h: +r.getAttribute('height') }));
    expect(hit.y).toBeGreaterThan(lane.y);
    expect(hit.y + hit.h).toBeLessThanOrEqual(lane.y + lane.h);
    await expect(e).toHaveAttribute('href', /#\/r\/legal-counsel$/);
    await e.click();
    await expect(page.locator('main h1')).toHaveText('Legal counsel');
  });

  test('2.7 committees › Member with its own step keeps its lane', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('lane-account-lead')).toContainText('Acme + Globex bid board member · A');
    await expectInLane(page, 'capture-lead', 'account-lead');
    await expect(page.getByTestId('idle-bid-board-account-lead')).toHaveCount(0);
    expect(await idleIds(page, 'bid-board')).not.toContain('account-lead');
  });

  test('2.8 committees › Member with a RACI letter on another step keeps its lane', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    // Partner manager owns no step, and is I on "Assess solution fit" (owned by Solution architect).
    await expect(page.locator('svg.swimlane .node[data-testid^="step-"]')).toHaveCount(5);
    await page.getByTestId('step-assess-fit').click();
    await expect(page.getByTestId('step-detail')).toContainText('Partner manager');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('lane-partner-manager')).toHaveCount(1);
    await expect(page.getByTestId('idle-bid-board-partner-manager')).toHaveCount(0);
    expect(await idleIds(page, 'bid-board')).toEqual(['legal-counsel']);
  });

  test('2.11 committees › Idle in one process, a lane in another', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('lane-legal-counsel')).toHaveCount(0);
    await expect(page.getByTestId('idle-bid-board-legal-counsel')).toBeVisible();
    await openSnapshot(page, snap, '#/p/build-proposal');
    await expect(page.getByTestId('lane-legal-counsel')).toHaveCount(1);
    await expect(page.getByTestId('lane-legal-counsel').locator('.lane-name')).toHaveText('Legal counsel');
    await expect(page.locator('[data-testid$="-legal-counsel"][data-testid^="idle-"]')).toHaveCount(0);
  });

  test('phones unchanged: the sample process is a list at 375 with no horizontal scroll', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('swimlane')).toHaveAttribute('data-layout', 'list');
    await expect(page.locator('.idle-entry, .idle-more')).toHaveCount(0);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2.9: the sample, with Legal counsel naming one person.
const WITH_PERSON = variant('acme-sample', 'acme-sample-person', {
  'roles/legal-counsel.md': (t) => t.replace('party: acme\n', 'party: acme\npeople: [Sam Example]\n'),
});
test.describe('idle members (exported sample with a person on Legal counsel)', () => {
  const snap = useSnapshot(WITH_PERSON);

  test('2.9 committees › People on a listed member', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const e = page.getByTestId('idle-bid-board-legal-counsel');
    expect((await e.locator('text').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim())).toEqual(['Legal counsel · C', 'Sam Example']);
    // The person is the muted person line, on a line of its own, never split.
    await expect(e.locator('text.lane-people')).toHaveText('Sam Example');
    // The name leaves the person out; the description (aria-describedby) reads it out once.
    await expect(e).toHaveAccessibleName('Legal counsel, Acme Corp, consulted');
    await expect(e).toHaveAccessibleDescription('People: Sam Example');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('idle members (exported committee-idle-long)', () => {
  const snap = useSnapshot('committee-idle-long');

  test('2.10 committees › Long member list', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/change-flow');
    await skipPrompt(page);
    const shown = await idleIds(page, 'steering-group');
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(9);
    // The first entries, in list order: letter (A, C, I), then party, then role.
    expect(shown).toEqual(['partner-director', 'finance-director', 'legal-counsel', 'risk-officer', 'delivery-director', 'hr-partner', 'comms-lead', 'security-officer', 'quality-lead'].slice(0, shown.length));
    // Beta Inc has no lanes (all its members are idle), but its members are listed, so the legend has its key.
    await expect(page.getByTestId('legend-party')).toHaveText([/Alpha Ltd$/, /Beta Inc$/]); // after the mark (initials for Beta)
    const more = page.getByTestId('idle-more-steering-group');
    await expect(more).toHaveText(`+ ${9 - shown.length} more`);
    expect(await idleLines(page, 'steering-group'), 'the list, with "+ N more", fits in four lines').toBeLessThanOrEqual(4);
    // Its accessible name lists all nine.
    const name = await more.getAttribute('aria-label');
    expect(name).toMatch(new RegExp(`^${9 - shown.length} more members\\. All 9: `));
    for (const n of NINE) expect(name, `accessible name lists ${n}`).toContain(n);
    // Its tooltip lists all nine, on hover…
    await more.locator('text').hover();
    await expect(tip(page)).toBeVisible();
    await expect(tip(page).locator('.people-tip-h')).toHaveText('Steering group');
    const items = tip(page).locator('li');
    await expect(items).toHaveCount(9);
    for (const [i, n] of NINE.entries()) await expect(items.nth(i)).toContainText(n);
    await page.mouse.move(1200, 780);
    await expect(tip(page)).toBeHidden();
    // …and on keyboard focus; Escape closes it and leaves focus where it is.
    await page.locator('main h1').focus();
    let id = '';
    for (let i = 0; i < 30 && id !== 'idle-more-steering-group'; i++) {
      await page.keyboard.press('Tab');
      id = await page.evaluate(() => document.activeElement.dataset.testid || '');
    }
    expect(id, '"+ N more" reached by Tab').toBe('idle-more-steering-group');
    await expect(tip(page)).toBeVisible();
    await expect(tip(page).locator('li')).toHaveCount(9);
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
    await expect(more).toBeFocused();
    // It opens the committee page.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/e\/steering-group/);
    await expect(page.locator('main h1')).toHaveText('Steering group');
  });

  test('2.20 persona-lens › Hidden behind more', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/change-flow?persona=beta-quality-lead');
    // Quality lead is the last idle member, hidden behind "+ N more".
    await expect(page.getByTestId('idle-steering-group-quality-lead')).toHaveCount(0);
    const more = page.getByTestId('idle-more-steering-group');
    await expect(more).toContainText(/^\+ \d+ more You$/);
    await expect(more.locator('.idle-you')).toHaveText('You');
    await expect(page.getByTestId('lane-steering-group').locator('.pill.cue')).toHaveText('Your committee');
    // No shown entry carries the cue.
    await expect(page.locator('.lane-heads .idle-entry .idle-you')).toHaveCount(0);
    // The pop-up marks the persona's member, and only that one.
    await more.locator('text').hover();
    await expect(tip(page).locator('li strong')).toHaveText(['You']);
    await expect(tip(page).locator('li', { has: page.locator('strong') })).toContainText('Quality lead · I');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2.18: committee-idle-long, varied so the steering group has three idle members and one with a lane.
const THREE_MEMBERS = variant('committee-idle-long', 'committee-three-idle-members', {
  'committees/01-steering-group.md': (t) => t.replace(/members:\n(  .*\n)+/, 'members:\n  change-lead: A\n  finance-director: A\n  hr-partner: C\n  security-officer: I\n'),
});
test.describe('idle members (exported steering group of three idle members)', () => {
  const snap = useSnapshot(THREE_MEMBERS);

  test('2.18 explorer-views › No empty member lanes', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/change-flow');
    await skipPrompt(page);
    for (const r of ['finance-director', 'hr-partner', 'security-officer']) await expect(page.getByTestId(`lane-${r}`)).toHaveCount(0);
    expect(await idleIds(page, 'steering-group')).toEqual(['finance-director', 'hr-partner', 'security-officer']);
    await expect(page.getByTestId('idle-more-steering-group')).toHaveCount(0);
    // Every role lane owns a step or has a letter on a role-owned step. The only role steps here are owned by
    // Change lead (Raise, Announce); Approve is the steering group's.
    const g = await geometry(page);
    expect(g.lanes.map((l) => l.id)).toEqual(['change-lead', 'steering-group']);
    await expectInLane(page, 'raise', 'change-lead');
    await expectInLane(page, 'announce', 'change-lead');
    await expectInLane(page, 'approve', 'steering-group');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('idle members (exported committee-idle-persona)', () => {
  const snap = useSnapshot('committee-idle-persona');

  test('2.19 persona-lens › Persona is an idle member', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=acme-legal-counsel');
    await expect(page.getByTestId('lane-legal-counsel')).toHaveCount(0);
    await expect(page.getByTestId('lane-bid-board').locator('.pill.cue')).toHaveText('Your committee');
    const e = page.getByTestId('idle-bid-board-legal-counsel');
    await expect(e).toHaveText('Legal counsel · C You');
    await expect(e.locator('.idle-you')).toHaveText('You'); // a text cue, not colour alone
    await expect(e).toHaveAccessibleName(/, you$/);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2.23: committee-basic, varied so the bid board's idle members are an Alpha role marked C, a Beta role marked A and
// an Alpha role marked I (Account lead, A, owns steps and keeps its lane; Solution architect, C, owns "scope").
const MIXED_LETTERS = variant('committee-basic', 'committee-mixed-letters', {
  'committees/01-bid-board.md': (t) => t.replace(/members:\n(  .*\n)+/, 'members:\n  account-lead: A\n  bid-manager: C\n  partner-manager: A\n  delivery-manager: I\n  solution-architect: C\n'),
  'processes/01-flow.md': (t) => t.replace('    raci:\n      delivery-manager: I\n', ''),
});
test.describe('idle members (exported committee-basic, mixed letters)', () => {
  const snap = useSnapshot(MIXED_LETTERS);

  test('2.23 committees › Accountable members first', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    for (const r of ['bid-manager', 'partner-manager', 'delivery-manager']) await expect(page.getByTestId(`lane-${r}`)).toHaveCount(0);
    // The Beta A member first, then the Alpha C member, then the Alpha I member: in the header, top to bottom.
    expect(await idleIds(page, 'bid-board')).toEqual(['partner-manager', 'bid-manager', 'delivery-manager']);
    const ys = await page.locator('.lane-heads .idle-entry .lane-hit').evaluateAll((rs) => rs.map((r) => +r.getAttribute('y')));
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    await expect(page.locator('.lane-heads .idle-entry')).toHaveText(['Partner manager · A', 'Bid manager · C', 'Delivery manager · I']);
    await expect(page.locator('.lane-heads .idle-entry').nth(0)).toHaveAccessibleName('Partner manager, Beta Inc, accountable');
    await expect(page.locator('.lane-heads .idle-entry').nth(1)).toHaveAccessibleName('Bid manager, Alpha Ltd, consulted');
    await expect(page.locator('.lane-heads .idle-entry').nth(2)).toHaveAccessibleName('Delivery manager, Alpha Ltd, informed');
    await expect(page.getByTestId('idle-more-bid-board')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2.24: committee-idle-long: Partner director is the only idle A member, and Beta Inc is the last party.
test.describe('idle members (exported committee-idle-long, accountable member)', () => {
  const snap = useSnapshot('committee-idle-long');

  test('2.24 committees › Accountable member not hidden', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/change-flow');
    await skipPrompt(page);
    const more = page.getByTestId('idle-more-steering-group');
    await expect(more).toBeVisible();
    const shown = await idleIds(page, 'steering-group');
    expect(shown[0], 'the A member is the first entry shown').toBe('partner-director');
    await expect(page.getByTestId('idle-steering-group-partner-director')).toBeVisible();
    await expect(page.getByTestId('idle-steering-group-partner-director')).toContainText('Partner director · A');
    await expect(page.getByTestId('idle-steering-group-partner-director')).toHaveAccessibleName(/^Partner director, Beta Inc, accountable/);
    // It is above "+ N more", which counts only the others.
    const pd = await page.getByTestId('idle-steering-group-partner-director').locator('.lane-hit').boundingBox();
    const mb = await more.locator('.lane-hit').boundingBox();
    expect(pd.y).toBeLessThan(mb.y);
    await expect(more).toHaveText(`+ ${9 - shown.length} more`);
    // The same order in the "+ N more" accessible name and tooltip: Partner director first.
    const name = await more.getAttribute('aria-label');
    const order = NINE.map((n) => name.indexOf(n));
    expect(order.every((i) => i >= 0), 'aria-label names all nine').toBe(true);
    expect([...order].sort((a, b) => a - b), 'aria-label in list order').toEqual(order);
    expect(name).toMatch(/All 9: Partner director, Beta Inc, accountable;/);
    await more.locator('text').hover();
    await expect(tip(page).locator('li')).toHaveCount(9);
    await expect(tip(page).locator('li').first()).toContainText('Partner director · A');
    for (const [i, n] of NINE.entries()) await expect(tip(page).locator('li').nth(i)).toContainText(n);
  });
});
