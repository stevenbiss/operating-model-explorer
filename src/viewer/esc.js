// HTML-escapes text for element content and quoted attribute values. The one escaper for every HTML string the engine builds.
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
