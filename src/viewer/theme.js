// Theme -> CSS custom properties and the terminology lookup (design D8). The default light and dark
// colours live in styles.css; a theme only overrides what it sets.
import { contrast, isFontFile, isUrl, LIGHT, luminance } from '../model/theme-check.js';
import { esc } from './esc.js';

export const DEFAULT_LABELS = {
  model: 'Model', models: 'Models', party: 'Party', parties: 'Parties', team: 'Team', teams: 'Teams',
  role: 'Role', roles: 'Roles', persona: 'Persona', personas: 'Personas', workstream: 'Workstream', workstreams: 'Workstreams',
  process: 'Process', processes: 'Processes', step: 'Step', steps: 'Steps', key_message: 'Key message', key_messages: 'Key messages',
};

export const DEFAULT_PALETTE = ['#2f6f9f', '#2e7d5b', '#8a4f9e', '#b0671a', '#b03a48', '#4d6b2e'];

// L('workstreams') -> "Value streams"; L.lower('workstream') -> "value stream" (keeps acronyms such as "CRM team").
// Every output is HTML-escaped, so it goes into markup as it is and must not be escaped again.
export function labeller(theme) {
  const labels = { ...DEFAULT_LABELS };
  const own = theme && theme.labels && typeof theme.labels === 'object' ? theme.labels : {};
  for (const k of Object.keys(DEFAULT_LABELS)) if (typeof own[k] === 'string' && own[k].trim()) labels[k] = esc(own[k].trim());
  const L = (k) => labels[k];
  L.lower = (k) => (/^[A-Z][A-Z]/.test(labels[k]) ? labels[k] : labels[k][0].toLowerCase() + labels[k].slice(1));
  L.a = (k) => `${article(L.lower(k))} ${L.lower(k)}`; // "a party", "an organisation"
  return L;
}

// "a" or "an" for an English word or acronym, by sound: an hour, a unit, a one-off, an FAQ, a CRM team.
export function article(word) {
  const w = String(word);
  if (/^[A-Z]{2}/.test(w)) return /^[AEFHILMNORSX]/.test(w) ? 'an' : 'a';
  return /^(h(our|onest|eir)|[ai]|e(?!u)|o(?!ne\b|nce\b)|u(?!ni|s[eu]|til|r[aeiou]))/i.test(w) ? 'an' : 'a';
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const onColor = (bg) => (contrast(bg, '#ffffff') >= contrast(bg, '#111111') ? '#ffffff' : '#111111');

// Returns the CSS text for <style id="om-theme"> and the party palette. scope: the element the theme applies to
// (the whole page, or only the preview in author mode).
export function themeCss(snapshot, scope = ':root:root') {
  const t = snapshot.theme || {};
  const c = t.colors && typeof t.colors === 'object' ? t.colors : {};
  const ok = (v) => typeof v === 'string' && HEX.test(v);
  const vars = [];
  if (ok(c.primary)) vars.push(`--om-primary:${c.primary}`, `--om-on-primary:${onColor(c.primary)}`);
  if (ok(c.accent)) vars.push(`--om-accent:${c.accent}`);
  // A theme that sets its own page colours is one fixed scheme; otherwise the default light/dark pair still applies.
  if (['background', 'surface', 'text'].some((k) => ok(c[k]))) {
    const x = Object.fromEntries(Object.keys(LIGHT).map((k) => [k, ok(c[k]) ? c[k] : LIGHT[k]]));
    vars.push(`color-scheme:${luminance(x.background) < 0.2 ? 'dark' : 'light'}`, `--om-bg:${x.background}`, `--om-surface:${x.surface}`, `--om-text:${x.text}`, `--om-link:${x.primary}`);
  }
  let faces = '';
  for (const key of ['body', 'heading']) {
    const v = t.fonts && typeof t.fonts[key] === 'string' ? t.fonts[key].trim() : '';
    if (!v || isUrl(v)) continue;
    if (isFontFile(v)) {
      if (!snapshot.assets[v]) continue;
      faces += `@font-face{font-family:"om-${key}";src:url("${snapshot.assets[v]}");font-display:swap}`;
      vars.push(`--om-font-${key}:"om-${key}",system-ui,sans-serif`);
    } else vars.push(`--om-font-${key}:${v.replace(/[^\w\s,'"-]/g, '')}`);
  }
  const palette = Array.isArray(c.palette) && c.palette.filter(ok).length ? c.palette.filter(ok) : DEFAULT_PALETTE;
  return { css: `${faces}${scope}{${vars.join(';')}}`, palette };
}
