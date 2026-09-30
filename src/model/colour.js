// Colour maths and party colour resolution (design D1, D3). Pure: works in Node and the browser.

export const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// ---------- sRGB, WCAG contrast ----------

const rgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const linear = (hex) => rgb(hex).map(toLinear);
const byte = (c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0');
const hexOf = (lin) => `#${lin.map((c) => byte(fromLinear(Math.max(0, c)))).join('')}`;

// WCAG 2 relative luminance and contrast ratio.
export const luminance = (hex) => {
  const [r, g, b] = linear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// p of a mixed into b, like CSS color-mix(in srgb, a p, b).
export const mix = (a, b, p) => {
  const y = rgb(b);
  return `#${rgb(a).map((c, i) => byte(c * p + y[i] * (1 - p))).join('')}`;
};

// ---------- OKLab / OKLCH (Ottosson) ----------

const labOfLinear = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const linearOfLab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
};
export const oklab = (hex) => labOfLinear(linear(hex));
export const oklch = (hex) => {
  const [L, a, b] = oklab(hex);
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
};
// OKLCH -> hex, reducing chroma until the colour fits in sRGB.
export const fromOklch = ([L, C, h]) => {
  const lab = (c) => [L, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  const fits = (c) => linearOfLab(lab(c)).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let c = C;
  if (!fits(C)) {
    let [lo, hi] = [0, C];
    for (let i = 0; i < 24; i++) [lo, hi] = fits((lo + hi) / 2) ? [(lo + hi) / 2, hi] : [lo, (lo + hi) / 2];
    c = lo;
  }
  return hexOf(linearOfLab(lab(c)));
};
export const deltaE = (a, b) => {
  const [x, y] = [oklab(a), oklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

// ---------- colour-vision deficiency (Machado, Oliveira & Fernandes 2009, severity 1, on linear RGB) ----------

export const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export const simulate = (hex, kind) => {
  const c = linear(hex);
  return hexOf(CVD[kind].map((row) => Math.min(1, row[0] * c[0] + row[1] * c[1] + row[2] * c[2])));
};
// The smallest OKLab difference: in normal vision and under each simulation.
export const distance = (a, b) => Math.min(deltaE(a, b), ...Object.keys(CVD).map((k) => deltaE(simulate(a, k), simulate(b, k))));

// ---------- the engine's colours ----------

// Light and dark values of the tokens in src/styles.css (a unit test keeps them in step). frame: what party
// tints sit on and the text on them. meaning: colours a party must never be mistaken for (--om-accent,
// --om-new, --om-changed, --om-removed; errors use removed, notices changed, focus rings --om-link).
export const ENGINE = {
  light: { frame: { surface: '#ffffff', text: '#1b1f24' }, meaning: { accent: '#c05621', new: '#1a7f4b', changed: '#9a6700', removed: '#b42318', focus: '#1f3a5f' } },
  dark: { frame: { surface: '#171d24', text: '#e7eaee' }, meaning: { accent: '#f0883e', new: '#3fb97a', changed: '#d4a72c', removed: '#f47067', focus: '#8fb8ec' } },
};
// How each meaning colour is named in the report.
export const MEANING_NAMES = {
  accent: '"Your lane" highlighting and cross-party handoffs',
  new: 'the "New" badge',
  changed: 'the "Changed" badge and notices',
  removed: 'the "Removed" badge and errors',
  focus: 'the keyboard focus ring',
};
const SHORT = { accent: '"Your lane"', new: '"New"', changed: '"Changed"', removed: '"Removed"', focus: 'the focus ring' };

// For parties without a brand: low chroma, spread in lightness and hue, clear of the meaning colours. The first three
// stay T apart in both schemes and under every simulation; later ones are shifted if they need to be.
export const NEUTRALS = ['#3e5c71', '#c0c9a5', '#635737', '#bea0ba', '#a2cfc5', '#a8ae99'];
const INK = { dark: '#111111', light: '#ffffff' };

// Tuned in task 1.3 (design D3).
export const T = 0.06; // smallest distance allowed, in OKLab, in normal vision and under every simulation
const HUE_STEP = 20; // degrees, tried +20, -20, +40, ... up to HUE_MAX
const HUE_MAX = 120;
const L_STEP = 0.06; // then OKLCH lightness, darker first, up to L_MAX
const L_MAX = 0.3;
const DARK_L = [0.62, 0.78]; // a derived dark-mode variant: OKLCH lightness clamped to this range

// The ink (near-black or white) with the better contrast, and the colour shifted in lightness until it reaches 4.5:1.
function readable(hex) {
  const best = (c) => (contrast(c, INK.light) >= contrast(c, INK.dark) ? INK.light : INK.dark);
  const ink = best(hex);
  const [L, C, h] = oklch(hex);
  let c = hex.toLowerCase();
  for (let i = 1; contrast(c, ink) < 4.5 && i <= 60; i++) c = fromOklch([ink === INK.light ? L - 0.01 * i : L + 0.01 * i, C, h]);
  return { band: c, bandText: ink };
}

// Candidates for one party in one scheme, in the order they are tried: [{ band, bandText, how }].
function candidates(first, secondary) {
  const out = [{ colour: first, how: 'as given' }];
  if (secondary) out.push({ colour: secondary, how: 'secondary' });
  const [L, C, h] = oklch(first);
  for (let d = HUE_STEP; d <= HUE_MAX; d += HUE_STEP) for (const s of [d, -d]) out.push({ colour: fromOklch([L, C, (h + s + 360) % 360]), how: 'shade' });
  for (let d = L_STEP; d <= L_MAX + 1e-9; d += L_STEP) for (const s of [-d, d]) if (L + s > 0.05 && L + s < 0.97) out.push({ colour: fromOklch([L + s, C, h]), how: 'shade' });
  return out.map((c) => ({ how: c.how, ...readable(c.colour) }));
}

// Every colour already in use, with how far this one is from it: parties by distance() (normal vision and the
// three simulations), meaning colours by ΔE in normal vision (their meaning is never shown by colour alone).
const gaps = (colour, taken, meaning) => [
  ...taken.map((t) => ({ kind: 'party', id: t.id, d: distance(colour, t.band), cvd: deltaE(colour, t.band) >= T })),
  ...Object.entries(meaning).map(([id, c]) => ({ kind: 'meaning', id, d: deltaE(colour, c) })),
];
// What a colour is too close to, a party before a meaning colour; or null.
const clashes = (colour, taken, meaning) => {
  const near = gaps(colour, taken, meaning).filter((g) => g.d < T);
  return near.find((g) => g.kind === 'party') || near[0] || null;
};
const margin = (colour, taken, meaning) => Math.min(...gaps(colour, taken, meaning).map((g) => g.d));

// parties: [{ id, brand? }] in order; brands: { id: { colours: { primary, secondary?, dark? } } }; engine: ENGINE.
// -> one entry per party: { party, source, base, dark, band, bandText, tint, darkBand, darkBandText, darkTint, adjusted }
// adjusted: [{ scheme, from, to, how: 'secondary'|'shade'|'contrast'|'unresolved', reason?: 'party'|'meaning', other?, cvd? }]
// (cvd: the clash with another party shows only under a colour-vision simulation)
export function resolvePartyColours(parties, brands = {}, engine = ENGINE) {
  const hex = (v) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : undefined);
  let neutral = 0;
  const out = parties.map((p) => {
    const b = (p.brand && brands[p.brand] && brands[p.brand].colours) || {};
    const primary = hex(b.primary);
    return { party: p.id, source: primary ? 'brand' : 'neutral', base: primary || NEUTRALS[neutral++ % NEUTRALS.length], secondary: primary && hex(b.secondary), packDark: primary && hex(b.dark), adjusted: [] };
  });
  for (const scheme of ['light', 'dark']) {
    const { frame, meaning } = engine[scheme];
    const taken = [];
    for (const r of out) {
      let first = r.base;
      if (scheme === 'dark') {
        // The pack's dark colour goes with its primary. Any other light colour is lifted into the dark range.
        const [L, C, h] = oklch(r.usedPrimary ? r.base : r.band);
        first = r.dark = r.usedPrimary && r.packDark ? r.packDark : fromOklch([Math.min(DARK_L[1], Math.max(DARK_L[0], L)), C, h]);
      }
      const list = candidates(first, scheme === 'light' ? r.secondary : undefined);
      const why = clashes(list[0].band, taken, meaning);
      // The first candidate clear of everything; failing that, the one furthest from its nearest colour.
      const far = (x) => margin(x.band, taken, meaning);
      const pick = list.find((x) => !clashes(x.band, taken, meaning)) || list.reduce((a, x) => (far(x) > far(a) ? x : a));
      const [band, bandText, tint] = scheme === 'light' ? ['band', 'bandText', 'tint'] : ['darkBand', 'darkBandText', 'darkTint'];
      Object.assign(r, { [band]: pick.band, [bandText]: pick.bandText, [tint]: mix(pick.band, frame.surface, 0.1) });
      if (scheme === 'light') r.usedPrimary = pick === list[0];
      if (why) r.adjusted.push({ scheme, from: first, to: pick.band, how: pick === list[0] ? 'unresolved' : pick.how, reason: why.kind, other: why.id, ...(why.cvd && { cvd: true }) });
      else if (pick.band !== first && r.source === 'brand') r.adjusted.push({ scheme, from: first, to: pick.band, how: 'contrast' });
      taken.push({ id: r.party, band: pick.band });
    }
  }
  return out.map(({ secondary, packDark, usedPrimary, ...r }) => r);
}

// Adjustment records -> plain-English report warnings (design D3 step 4). Parties without a brand never get one.
// nameOf(partyId) -> display name; at(partyId) -> { file, where?, element }.
export function colourMessages(resolved, nameOf, at) {
  const out = [];
  for (const r of resolved.filter((x) => x.source === 'brand')) {
    const who = nameOf(r.party);
    for (const a of r.adjusted) {
      const mode = a.scheme === 'dark' ? ' in dark mode' : '';
      const like = a.reason === 'party' ? `${nameOf(a.other)}'s colour${a.cvd ? ' for people with common colour-blindness' : ''}` : `the colour of ${MEANING_NAMES[a.other]}`;
      const drawn = a.how === 'secondary' ? `its brand's secondary colour, ${a.to}` : `a shifted shade, ${a.to}`;
      const problem = {
        contrast: `${who}'s colour ${a.from}${mode} is drawn as ${a.to}, so that text on it meets the WCAG AA contrast of 4.5:1.`,
        unresolved: `${who}'s colour ${a.from}${mode} is close to ${like}, and no clearly different shade was found. The name and mark still tell them apart.`,
      }[a.how] || `${who}'s colour ${a.from}${mode} is too close to ${like}, so ${who} is drawn in ${drawn}${a.reason === 'meaning' ? `, so it can't be mistaken for ${SHORT[a.other]}` : ''}.`;
      const fix = a.how === 'contrast'
        ? `Nothing to do if this looks right. To choose the shade yourself, give ${who}'s brand pack a${mode ? ' dark' : ' primary'} colour with at least 4.5:1 contrast against white or near-black text.`
        : `Nothing to do if this looks right. To choose the colour yourself, give ${who}'s brand pack a${mode ? ' dark' : ' secondary'} colour that is clearly different from ${a.reason === 'party' ? `${nameOf(a.other)}'s` : SHORT[a.other]}.`;
      out.push({ level: 'warning', ...at(r.party), problem, fix });
    }
  }
  return out;
}
