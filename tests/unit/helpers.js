import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE = fileURLToPath(new URL('../../examples/acme-sample/', import.meta.url));

// A content folder on disk -> [{ path, data }], as the browser readers produce.
export function readFolder(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => ({ path: relative(root, join(e.parentPath, e.name)).replace(/\\/g, '/'), data: new Uint8Array(readFileSync(join(e.parentPath, e.name))) }));
}

// { 'model.md': 'text', ... } -> [{ path, data }]
export const files = (obj) => Object.entries(obj).map(([path, text]) => ({ path, data: new TextEncoder().encode(text) }));

export const MODEL = `---
id: mini
type: model
name: Mini
purpose: A tiny model.
key_messages: [One]
---
`;
