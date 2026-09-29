// Real client or employer names that built files must never contain. They are kept out of git:
// list them, one regular expression per line, in tests/private-names.txt (gitignored).
import { readFileSync } from 'node:fs';

let src = '';
try { src = readFileSync(new URL('./private-names.txt', import.meta.url), 'utf8'); } catch {}
const names = src.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
export const PRIVATE_NAMES = names.length ? new RegExp(String.raw`\b(${names.join('|')})\b`, 'i') : null;
