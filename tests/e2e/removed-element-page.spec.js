// explorer-views › Current vs future display: only removed STEPS are hidden while change markers are off (html-qa
// round 1, minor 3). A removed role opens as normal, with a Removed badge while markers are on, and validation warns
// when a step that stays is owned by a removed role. Fixture: the sample with the pricing analyst marked removed.
import { zipSync } from 'fflate';
import { test, expect, openEngine, readFolder, SAMPLE_DIR, go, messages } from './helpers.js';

const files = readFolder(SAMPLE_DIR);
const role = new TextDecoder().decode(files['roles/pricing-analyst.md']).replace('status: new', 'status: removed');
files['roles/pricing-analyst.md'] = new TextEncoder().encode(role);
const zip = Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([p, d]) => [`removed-role/${p}`, d]))));

test('a removed role opens as normal, badged while markers are on; a step it still owns is a warning', { tag: '@mobile' }, async ({ page }) => {
  await openEngine(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load .zip' }).click();
  await (await chooser).setFiles({ name: 'removed-role.zip', mimeType: 'application/zip', buffer: zip });
  await expect(page.getByTestId('report-counts')).toContainText('0 errors, 1 warning');
  const warning = messages(page).filter({ hasText: 'pricing-analyst' });
  await expect(warning).toHaveAttribute('data-level', 'warning');
  await expect(warning).toContainText('processes/02-build-proposal.md');
  await expect(warning).toContainText('price-solution');
  await expect(warning).toContainText('owned by the role "pricing-analyst", which is marked as removed');

  const pv = page.getByTestId('preview');
  await pv.getByTestId('persona-skip').click();
  // Markers off: the page opens where the link points, with no redirect, notice or badge.
  await go(page, '#/r/pricing-analyst');
  await expect(pv.locator('main h1')).toHaveText('Pricing analyst');
  await expect(page).toHaveURL(/#\/r\/pricing-analyst$/);
  await expect(pv.getByTestId('removed-notice')).toBeHidden();
  await expect(pv.locator('main .page-head').getByTestId('badge')).toHaveCount(0);
  await expect(pv.locator('main')).toContainText('Price the solution');
  // Markers on: the same page carries a Removed badge.
  await go(page, '#/r/pricing-analyst?changes=1');
  await expect(pv.locator('main .page-head').getByTestId('badge')).toHaveText('Removed');
  // The lane label and role chips lead to it, rather than to a dead end.
  await go(page, '#/w/presales');
  await pv.locator('main .chip', { hasText: 'Pricing analyst' }).click();
  await expect(pv.locator('main h1')).toHaveText('Pricing analyst');
  await expect(pv.getByTestId('removed-notice')).toBeHidden();
});
