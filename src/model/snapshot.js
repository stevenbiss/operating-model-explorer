// The model the viewer renders (design D4/D5): plain JSON, with the theme's assets as data: URIs.
// Author mode (task 1.15) embeds this in <script id="om-content" type="application/json">.
import { isFontFile, isUrl } from './theme-check.js';
import { imageRefs, markdownTexts } from './markdown.js';

const MIME = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };

function dataUri(path, bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${MIME[path.split('.').pop().toLowerCase()] || 'application/octet-stream'};base64,${btoa(bin)}`;
}

// Only the assets the model uses are kept: the theme's logo and fonts, and images in Markdown text.
// extra: fields added on export, e.g. { exported: ISO date }.
export function toSnapshot(model, extra = {}) {
  const t = model.theme || {};
  const used = [t.logo, t.fonts && t.fonts.body, t.fonts && t.fonts.heading]
    .filter((p) => typeof p === 'string' && !isUrl(p))
    .map((p) => p.trim())
    .filter((p) => p === t.logo || isFontFile(p));
  for (const x of [model.model || {}, ...Object.values(model.elements)]) for (const { text } of markdownTexts(x)) used.push(...imageRefs(text));
  const assets = {};
  for (const p of used) if (model.assets[p]) assets[p] = typeof model.assets[p] === 'string' ? model.assets[p] : dataUri(p, model.assets[p]);
  return { model: model.model, theme: model.theme, elements: model.elements, order: model.order, assets, ...extra };
}

// Safe to place inside a <script> element.
export const embedJson = (snapshot) => JSON.stringify(snapshot).replace(/</g, '\\u003c');
