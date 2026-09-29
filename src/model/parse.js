import { load, CORE_SCHEMA } from 'js-yaml';

// Splits a content file into its YAML header and Markdown body.
// Returns { header, body } or { error: { line?, problem, fix } }, or { none: true } if there is no header.
export function parseFile(text) {
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  if (lines[0].trim() !== '---') return { none: true };
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end < 0) {
    return { error: { problem: 'The header has no closing --- line.', fix: 'Add a line containing only --- after the last header field.' } };
  }
  let header;
  try {
    // CORE_SCHEMA keeps dates and words like "no" as plain text.
    header = load(lines.slice(1, end).join('\n'), { schema: CORE_SCHEMA });
  } catch (e) {
    const line = e.mark ? e.mark.line + 2 : undefined; // header starts on line 2 of the file
    return {
      error: {
        line,
        problem: `The header is not valid YAML${line ? ` at line ${line}` : ''}: ${e.reason || 'it could not be read'}.`,
        fix: 'Check the indentation on that line, and put quotes around any text that contains ": " or starts with a symbol.',
      },
    };
  }
  if (header === null || header === undefined || typeof header !== 'object' || Array.isArray(header)) {
    return { error: { line: 2, problem: 'The header does not contain any fields.', fix: 'Write the header as "field: value" lines, e.g. "type: role".' } };
  }
  return { header, body: lines.slice(end + 1).join('\n').trim() };
}
