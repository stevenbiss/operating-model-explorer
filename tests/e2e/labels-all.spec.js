// theming › Terminology labels, with all 9 terms renamed (singular and plural). Every route of the preview
// is scanned (visible text, closed dialogs, aria-label, title and alt) for a default term word or a wrong
// article before a term. Content text (names, summaries, Markdown bodies) is taken out first: only the
// viewer's own wording is checked.
import { zipSync } from 'fflate';
import { load as loadYaml } from 'js-yaml';
import { test, expect, openEngine, readFolder, SAMPLE_DIR, go } from './helpers.js';

const LABELS = {
  model: 'Blueprint', models: 'Blueprints', party: 'Organisation', parties: 'Organisations', team: 'Squad', teams: 'Squads',
  role: 'Position', roles: 'Positions', persona: 'Viewpoint', personas: 'Viewpoints', workstream: 'Value stream', workstreams: 'Value streams',
  process: 'Procedure', processes: 'Procedures', step: 'Activity', steps: 'Activities', key_message: 'Big idea', key_messages: 'Big ideas',
};
const DEFAULT_WORD = /\b(models?|part(y|ies)|teams?|roles?|personas?|workstreams?|process(es)?|steps?|key messages?)\b/i;
const BAD_ARTICLE = /\ba (?=[aeiou])|\ban (?=[bcdfgjklmnpqrstvwxyz])/; // lower case only: "A Accountable" is the RACI key

const files = readFolder(SAMPLE_DIR);
const theme = new TextDecoder().decode(files['theme.md']).replace(/labels:[\s\S]*?(?=---)/, `labels:\n${Object.entries(LABELS).map(([k, v]) => `  ${k}: ${v}\n`).join('')}`);
files['theme.md'] = new TextEncoder().encode(theme);
const zip = Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([p, d]) => [`labels-all/${p}`, d]))));

// Every string in the sample's front matter: the content, which may use the default words freely.
const content = new Set();
const collect = (v) => (typeof v === 'string' ? content.add(v.trim()) : v && typeof v === 'object' && Object.values(v).forEach(collect));
for (const [p, d] of Object.entries(files)) {
  const m = p.endsWith('.md') && new TextDecoder().decode(d).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (m) collect(loadYaml(m[1]));
}
const CONTENT = [...content].filter((s) => s.length > 1).sort((a, b) => b.length - a.length);

const ROUTES = [
  '#/', '#/?persona=acme-account-lead', '#/w/presales', '#/w/delivery', '#/p/qualify-opportunity',
  '#/p/qualify-opportunity?persona=acme-account-lead', '#/p/qualify-opportunity/s/assess-fit?persona=acme-account-lead&changes=1',
  '#/p/build-proposal?persona=acme-delivery-manager', '#/p/build-proposal/s/courier-copies?changes=1', '#/p/build-proposal/s/review-proposal',
  '#/r/account-lead?persona=acme-account-lead', '#/r/pricing-analyst?changes=1', '#/e/acme', '#/e/acme-sales', '#/e/globex-solution-team',
  '#/search', '#/search?q=pro', '#/search?q=pro&changes=1', '#/search?q=zzz', '#/me', '#/me?persona=globex-solution-team',
  '#/me?persona=acme-account-lead&only=1&changes=1', '#/no/such/page', '#/', // back to no persona: the announcer speaks
];

async function scan(page) {
  return page.getByTestId('preview').evaluate((pv, CONTENT) => {
    const strip = (t) => CONTENT.reduce((s, c) => s.split(c).join(' '), t || '');
    const attrs = [...pv.querySelectorAll('[aria-label], [title], [alt]')].flatMap((e) => ['aria-label', 'title', 'alt'].map((a) => e.getAttribute(a)).filter(Boolean));
    const clone = pv.cloneNode(true);
    clone.querySelectorAll('.prose, .purpose, .messages, .node-name, .lane-name, .lane-team, .band-name, .edge-label').forEach((e) => e.remove());
    clone.querySelectorAll('*').forEach((e) => e.append(' ')); // keep words in neighbouring elements apart
    return { text: strip(clone.textContent).replace(/\s+/g, ' '), attrs: attrs.map(strip) };
  }, CONTENT);
}

for (const [size, width] of [['desktop', 1280], ['mobile', 375]]) {
  test(`theming › Terminology labels: all 9 terms renamed, no default word on any route (${size})`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width, height: 900 });
    await openEngine(page);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load .zip' }).click();
    await (await chooser).setFiles({ name: 'labels-all.zip', mimeType: 'application/zip', buffer: zip });
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
    const pv = page.getByTestId('preview');
    await expect(pv.getByTestId('persona-prompt')).toBeVisible();
    await expect(pv.getByTestId('persona-skip')).toHaveText('Explore without a viewpoint');
    const found = [];
    for (const hash of ROUTES) {
      await go(page, hash);
      await expect(pv.locator('main h1')).toBeVisible();
      const { text, attrs } = await scan(page);
      for (const t of [text, ...attrs]) {
        const m = t.match(DEFAULT_WORD) || t.match(BAD_ARTICLE);
        if (m) found.push(`${hash}: "${m[0]}" in "…${t.slice(Math.max(0, m.index - 50), m.index + 50)}…"`);
      }
    }
    expect(found).toEqual([]);
    // Spot checks that the configured terms are actually used.
    await go(page, '#/p/qualify-opportunity?persona=acme-account-lead');
    if (width > 767) {
      await expect(pv.getByTestId('legend')).toContainText('Handoff within an organisation');
      await expect(pv.getByTestId('step-capture-lead')).toHaveAttribute('aria-label', /Your activity\./);
      await expect(pv.getByTestId('swimlane-more')).toHaveText(/More activities/);
    } else await expect(pv.getByTestId('legend')).toContainText('Your activity');
    await go(page, '#/');
    await expect(pv.getByTestId('announcer')).toHaveText('Now viewing without a viewpoint');
  });
}
