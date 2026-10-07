import { dump } from 'js-yaml';

// Generates the human-readable content reference (Markdown) from the schemas, so the docs can't drift from the rules.

const WORDS = { string: 'text', array: 'list', object: 'group of fields', number: 'number', integer: 'whole number', boolean: 'true or false' };
const cell = (s) => String(s).replace(/\|/g, '\\|');

function valueOf(s) {
  if (s.enum) return `one of: ${s.enum.join(', ')}`;
  if (s.items) return `${[].concat(s.type).filter((t) => t !== 'array').map((t) => `${WORDS[t]} or `).join('')}list of ${s.items.enum ? `(${s.items.enum.join(', ')})` : [].concat(s.items.type).map((t) => (t === 'object' ? 'groups of fields' : WORDS[t])).join(' or ')}`;
  if (s.additionalProperties && typeof s.additionalProperties === 'object') return `role id: ${s.additionalProperties.enum.join(', ')}`;
  return [].concat(s.type).map((t) => WORDS[t]).join(' or ');
}

function rows(schema, prefix = '') {
  const out = [];
  for (const [name, s] of Object.entries(schema.properties || {})) {
    const field = prefix + name;
    const edgy = s['x-edgy'] || s.items?.['x-edgy'];
    const desc = (s.description || '') + (edgy ? ` (EDGY: ${edgy})` : '');
    out.push(`| \`${field}\` | ${(schema.required || []).includes(name) ? 'Yes' : 'No'} | ${cell(valueOf(s))} | ${cell(desc)} |`);
    if (s.properties) out.push(...rows(s, `${field}.`));
    if (s.items?.properties) out.push(...rows(s.items, `${field}[].`));
  }
  return out;
}

export function contentReference(schemas) {
  const parts = [
    '# Content reference',
    '',
    'Every content file starts with a header between two `---` lines, followed by optional Markdown text. This page lists the header fields for each `type`.',
    'Fields inside an optional group (such as `change.status`) are only required when that group is used.',
    '',
    '_Generated from `schema/*.schema.json` by `npm run build`. Do not edit by hand._',
  ];
  for (const s of Object.values(schemas)) {
    parts.push(
      '',
      `## ${s.title}`,
      '',
      s.description,
      '',
      `**EDGY concept:** ${s['x-edgy']}`,
      '',
      '| Field | Required | Value | Description |',
      '|---|---|---|---|',
      ...rows(s),
      '',
      '**Example**',
      '',
      '```yaml',
      '---',
      dump(s.examples[0], { lineWidth: 100, flowLevel: 3 }).trimEnd(),
      '---',
      '```',
    );
  }
  return parts.join('\n') + '\n';
}
