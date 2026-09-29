// html-qa round 1, minors 5 and 6, on the exported sample: Escape on the modal persona prompt puts focus on the
// page heading, and a selected step scrolled into view is clear of the sticky lane-header column.
import { test, expect, useSnapshot, openSnapshot } from './helpers.js';

test.describe('viewer polish (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('Escape on the persona prompt returns focus to the page heading', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await expect(page.getByTestId('persona-prompt')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('persona-prompt')).toBeHidden();
    await expect(page.locator('main h1')).toBeFocused();
  });

  test('a selected step scrolled into view leaves its incoming connector clear of the lane headers', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/build-proposal/s/review-proposal?changes=1');
    const gap = await page.evaluate(() => {
      const sc = document.querySelector('.swim-scroll');
      const box = document.querySelector('.node[aria-current] .box').getBoundingClientRect();
      const heads = document.querySelector('.lane-heads').getBoundingClientRect();
      return { scrolled: sc.scrollLeft > 0, gap: box.left - heads.right, right: sc.getBoundingClientRect().right - box.right };
    });
    expect(gap.scrolled).toBe(true);
    expect(gap.gap).toBeGreaterThanOrEqual(80); // the column gap, where connectors and their labels run
    expect(gap.right).toBeGreaterThanOrEqual(80);
  });
});
