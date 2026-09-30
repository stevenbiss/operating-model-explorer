// The model the viewer renders (design D4/D5): plain JSON, with the images it uses as data: URIs.
// Author mode (task 1.15) embeds this in <script id="om-content" type="application/json">.
import { imageRefs, markdownTexts } from './markdown.js';

const MIME = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

function dataUri(path, bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${MIME[path.split('.').pop().toLowerCase()] || 'application/octet-stream'};base64,${btoa(bin)}`;
}

// Only the assets the model uses are kept: images in Markdown text.
// Brands (design D8): each party's resolved colours, the marks of the brands parties use (by brand id), and
// brandsUsed [{ party, brand, version }]. Usage notes and packs no party uses are never included.
// extra: fields added on export, e.g. { exported: ISO date }.
export function toSnapshot(model, extra = {}) {
  const uri = (p) => (typeof model.assets[p] === 'string' ? model.assets[p] : dataUri(p, model.assets[p]));
  const used = [];
  for (const x of [model.model || {}, ...Object.values(model.elements)]) for (const { text } of markdownTexts(x)) used.push(...imageRefs(text));
  const assets = {};
  for (const p of used) if (p.startsWith('assets/') && model.assets[p]) assets[p] = uri(p);
  const marks = {};
  const brandsUsed = [];
  for (const party of model.order.party) {
    const brand = model.elements[party].brand;
    const pack = model.brands && typeof brand === 'string' && Object.hasOwn(model.brands, brand) ? model.brands[brand] : null;
    if (!pack) continue;
    brandsUsed.push({ party, brand, version: pack.version });
    if (pack.marks.mark && model.assets[pack.marks.mark]) marks[brand] = uri(pack.marks.mark);
  }
  const partyColours = (model.partyColours || []).map(({ party, band, bandText, tint, darkBand, darkBandText, darkTint }) => ({ party, band, bandText, tint, darkBand, darkBandText, darkTint }));
  return { model: model.model, theme: model.theme, elements: model.elements, order: model.order, assets, partyColours, marks, brandsUsed, ...extra };
}

// Safe to place inside a <script> element.
export const embedJson = (snapshot) => JSON.stringify(snapshot).replace(/</g, '\\u003c');
