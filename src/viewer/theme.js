// The theme's terminology lookup (design D7: the theme is labels only; the frame is always the engine's own).
import { esc } from './esc.js';

export const DEFAULT_LABELS = {
  model: 'Model', models: 'Models', party: 'Party', parties: 'Parties', team: 'Team', teams: 'Teams',
  role: 'Role', roles: 'Roles', persona: 'Persona', personas: 'Personas', workstream: 'Workstream', workstreams: 'Workstreams',
  process: 'Process', processes: 'Processes', step: 'Step', steps: 'Steps', key_message: 'Key message', key_messages: 'Key messages',
};

// ponytail: party colours by position until batch 2 of add-party-brands replaces this with model.partyColours (task 1.4).
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
