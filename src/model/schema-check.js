// Interpreter for the JSON Schema 2020-12 subset used in schema/*.schema.json.
// No code generation (no eval / new Function). Returns raw issues; validate.js words them.

export const SUPPORTED = ['type', 'required', 'enum', 'pattern', 'properties', 'items', 'additionalProperties'];
export const ANNOTATIONS = ['$schema', '$id', 'title', 'description', 'examples', 'x-edgy'];

export function kindOf(v) {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

const matchesType = (v, t) => t === kindOf(v) || (t === 'number' && kindOf(v) === 'integer');
const isObject = (v) => kindOf(v) === 'object';

// Issue: { level: 'error'|'warning', path: [key|index...], keyword, expected?, actual?, allowed?, schema }
export function check(value, schema, path = []) {
  const issues = [];
  const err = (keyword, extra) => issues.push({ level: 'error', path, keyword, schema, ...extra });

  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some((t) => matchesType(value, t))) {
      err('type', { expected: types, actual: kindOf(value) });
      return issues;
    }
  }
  if (schema.enum && !schema.enum.includes(value)) err('enum', { allowed: schema.enum, actual: value });
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern, 'u').test(value)) err('pattern', { actual: value });

  if (isObject(value)) {
    for (const key of schema.required || []) {
      if (!(key in value)) issues.push({ level: 'error', path: [...path, key], keyword: 'required', schema });
    }
    const props = schema.properties || {};
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) issues.push(...check(v, props[key], [...path, key]));
      else if (schema.additionalProperties === false) {
        issues.push({ level: 'warning', path: [...path, key], keyword: 'additionalProperties', known: Object.keys(props), schema });
      } else if (isObject(schema.additionalProperties)) issues.push(...check(v, schema.additionalProperties, [...path, key]));
    }
  }
  if (Array.isArray(value) && schema.items) value.forEach((v, i) => issues.push(...check(v, schema.items, [...path, i])));
  return issues;
}

// Every keyword used anywhere in a schema that this interpreter does not understand.
export function unsupportedKeywords(schema, where = '') {
  const found = [];
  for (const [key, v] of Object.entries(schema)) {
    if (!SUPPORTED.includes(key) && !ANNOTATIONS.includes(key)) found.push(`${where}${key}`);
    if (key === 'properties') for (const [p, s] of Object.entries(v)) found.push(...unsupportedKeywords(s, `${where}${p}.`));
    if ((key === 'items' || key === 'additionalProperties') && isObject(v)) found.push(...unsupportedKeywords(v, `${where}${key}.`));
  }
  return found;
}
