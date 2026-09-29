// Theme checks that JSON Schema can't express (design D8): colour contrast, web addresses and missing assets.
// Pure: returns messages in the same plain-English shape as validate.js.

// The neutral default theme's light colours. A theme's own colours are checked against these when it leaves some out.
export const LIGHT = { primary: '#1f3a5f', accent: '#c05621', background: '#fbfbfa', surface: '#ffffff', text: '#1b1f24' };

const rgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

// WCAG 2 relative luminance and contrast ratio.
export const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isUrl = (v) => /^[a-z][a-z0-9+.-]*:|^\/\//i.test(v.trim());
export const isFontFile = (v) => /\.(woff2?|ttf|otf)$/i.test(v.trim()) || v.trim().startsWith('assets/');

const LABEL_PAIRS = [['model', 'models'], ['party', 'parties'], ['team', 'teams'], ['role', 'roles'], ['persona', 'personas'], ['workstream', 'workstreams'], ['process', 'processes'], ['step', 'steps'], ['key_message', 'key_messages']];
// Good-enough English guesses for the suggested fix.
const pluralOf = (w) => (/[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : /(s|x|z|ch|sh)$/i.test(w) ? `${w}es` : `${w}s`);
const singularOf = (w) => (/[^aeiou]ies$/i.test(w) ? `${w.slice(0, -3)}y` : /(s|x|z|ch|sh)es$/i.test(w) ? w.slice(0, -2) : w.replace(/s$/i, ''));

// [text colour, background colour, what it is used for]
const PAIRS = [
  ['text', 'background', 'body text'],
  ['text', 'surface', 'text on cards and panels'],
  ['primary', 'background', 'links and selected items'],
];

export function checkTheme(docs, assets) {
  const doc = docs.find((d) => d.header && d.header.type === 'theme');
  if (!doc) return [];
  const { file, header: t } = doc;
  const out = [];
  const err = (problem, fix) => out.push({ level: 'error', file, problem, fix });

  if (typeof t.logo === 'string') {
    if (isUrl(t.logo)) err(`The logo "${t.logo}" is a web address. The logo must be an image file in the assets/ folder, so the model works offline.`, 'Put the image in the assets/ folder and write its path, e.g. "assets/logo.svg".');
    else if (!assets[t.logo]) err(`The logo file "${t.logo}" was not found. Images must be files in the assets/ folder.`, 'Add the file to the assets/ folder, or correct the path.');
  }
  for (const key of ['body', 'heading']) {
    const v = t.fonts && t.fonts[key];
    if (typeof v !== 'string') continue;
    if (isUrl(v)) err(`The ${key} font "${v}" is a web address. Fonts must be files in the assets/ folder (e.g. assets/brand.woff2) or a system font such as "Georgia, serif".`, 'Put the font file in the assets/ folder and write its path, or use a system font stack.');
    else if (isFontFile(v) && !assets[v.trim()]) err(`The ${key} font file "${v}" was not found. Fonts must be files in the assets/ folder.`, 'Add the font file to the assets/ folder, or correct the path.');
  }

  // A renamed term needs both forms, or the UI mixes "Value stream" with "Workstreams".
  const labels = t.labels && typeof t.labels === 'object' ? t.labels : {};
  const set = (k) => typeof labels[k] === 'string' && labels[k].trim();
  for (const [one, many] of LABEL_PAIRS) {
    if (!set(one) === !set(many)) continue;
    const [has, missing, guess] = set(one) ? [one, many, pluralOf(labels[one].trim())] : [many, one, singularOf(labels[many].trim())];
    out.push({
      level: 'warning',
      file,
      problem: `The label "${has}" is renamed to "${labels[has].trim()}", but "${missing}" is not, so the viewer will still use the default word for it.`,
      fix: `Add "${missing}: ${guess}" under labels (or the right word, if that isn't it).`,
    });
  }

  const c = t.colors && typeof t.colors === 'object' ? t.colors : {};
  for (const [fg, bg, use] of PAIRS) {
    if (!(fg in c) && !(bg in c)) continue; // both are defaults, which already pass
    const a = c[fg] ?? LIGHT[fg];
    const b = c[bg] ?? LIGHT[bg];
    if (!HEX.test(a) || !HEX.test(b)) continue; // the schema check already reports bad colours
    const ratio = contrast(a, b);
    if (ratio < 4.5) {
      out.push({
        level: 'warning',
        file,
        problem: `The ${fg} colour ${a} on the ${bg} colour ${b} (${use}) has a contrast ratio of ${Math.min(Number(ratio.toFixed(2)), 4.49).toFixed(2)}:1, below the WCAG AA minimum of 4.5:1.`,
        fix: `Make the ${fg} colour darker or the ${bg} colour lighter (or the other way round), so the ratio is at least 4.5:1.`,
      });
    }
  }
  return out;
}
