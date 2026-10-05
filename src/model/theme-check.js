// Theme checks that JSON Schema can't express: retired keys and label pairs (design D7).
// Pure: returns messages in the same plain-English shape as validate.js.

export const isUrl = (v) => /^[a-z][a-z0-9+.-]*:|^\/\//i.test(v.trim());

// The theme keys retired in 1.2, and what replaces each one. The capture sheet reader uses these too.
export const RETIRED = {
  colors: 'Party colours now come from brand packs, and the frame always uses the engine\'s neutral colours.',
  fonts: 'The engine always uses its own fonts. No font is fetched or embedded.',
  logo: 'The header now shows the model name with the party marks from brand packs.',
  palette: 'Each party\'s colour now comes from its brand pack.',
};
// what: e.g. 'Remove "colors" from theme.md.'
export const retiredFix = (key, what) => `${what}${key === 'fonts' ? '' : " To show a party's colours and mark, copy its brand pack into brands/<id>/ and name it in the party (brand: <id>, or the Brand column of a capture sheet)."}`;

const LABEL_PAIRS = [['model', 'models'], ['party', 'parties'], ['team', 'teams'], ['role', 'roles'], ['committee', 'committees'], ['persona', 'personas'], ['workstream', 'workstreams'], ['process', 'processes'], ['step', 'steps'], ['structure', 'structures'], ['key_message', 'key_messages']];
// Good-enough English guesses for the suggested fix.
const pluralOf = (w) => (/[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : /(s|x|z|ch|sh)$/i.test(w) ? `${w}es` : `${w}s`);
const singularOf = (w) => (/[^aeiou]ies$/i.test(w) ? `${w.slice(0, -3)}y` : /(s|x|z|ch|sh)es$/i.test(w) ? w.slice(0, -2) : w.replace(/s$/i, ''));

export function checkTheme(docs) {
  const doc = docs.find((d) => d.header && d.header.type === 'theme');
  if (!doc) return [];
  const { file, header: t } = doc;
  const at = { file, ...(doc.where && { where: doc.where }) };
  const out = [];

  for (const [key, instead] of Object.entries(RETIRED)) {
    if (key in t) out.push({ level: 'warning', ...at, problem: `The theme sets "${key}", which is retired, so it is ignored. ${instead}`, fix: retiredFix(key, `Remove "${key}" from ${file}.`) });
  }

  // A renamed term needs both forms, or the UI mixes "Value stream" with "Workstreams".
  const labels = t.labels && typeof t.labels === 'object' ? t.labels : {};
  const set = (k) => typeof labels[k] === 'string' && labels[k].trim();
  for (const [one, many] of LABEL_PAIRS) {
    if (!set(one) === !set(many)) continue;
    const [has, missing, guess] = set(one) ? [one, many, pluralOf(labels[one].trim())] : [many, one, singularOf(labels[many].trim())];
    out.push({
      level: 'warning',
      ...at,
      problem: `The label "${has}" is renamed to "${labels[has].trim()}", but "${missing}" is not, so the viewer will still use the default word for it.`,
      fix: `Add "${missing}: ${guess}" under labels (or the right word, if that isn't it).`,
    });
  }
  return out;
}
