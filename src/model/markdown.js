import MarkdownIt from 'markdown-it';

// html: false escapes raw HTML, so content can never inject markup or scripts.
const md = new MarkdownIt({ html: false, linkify: false });

// Images come only from the model's own assets, as data: URIs (the CSP blocks anything else).
// An image that isn't in the assets is shown as its alt text; validation reports it as an error.
let images = {};
export const useImages = (assets) => {
  images = assets || {};
};
const imagePath = (src) => {
  try {
    return decodeURI(src).replace(/^\.\//, '');
  } catch {
    return src;
  }
};
md.renderer.rules.image = (tokens, i, opts, env, self) => {
  const t = tokens[i];
  const src = images[imagePath(t.attrGet('src'))];
  const alt = md.utils.escapeHtml(self.renderInlineAsText(t.children, opts, env));
  return src ? `<img src="${md.utils.escapeHtml(src)}" alt="${alt}">` : alt;
};

export const renderMarkdown = (text) => md.render(text || '');
export const renderInline = (text) => md.renderInline(text || '');

// The image paths a Markdown text refers to, e.g. "![Plan](assets/plan.png)" -> ["assets/plan.png"].
export const imageRefs = (text) =>
  md
    .parse(String(text || ''), {})
    .flatMap((t) => t.children || [])
    .filter((c) => c.type === 'image')
    .map((c) => imagePath(c.attrGet('src')));

// Every Markdown text of a model, element or process: [{ text, step? }].
export const markdownTexts = (x) => [
  ...[x.purpose, x.body].map((text) => ({ text })),
  ...(Array.isArray(x.key_messages) ? x.key_messages : []).map((text) => ({ text })),
  ...(Array.isArray(x.steps) ? x.steps : []).filter((s) => s && typeof s === 'object').map((s) => ({ text: s.description, step: typeof s.id === 'string' ? s.id : undefined })),
].filter((t) => typeof t.text === 'string' && t.text);
