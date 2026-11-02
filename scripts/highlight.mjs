// Code blocks at build time: shiki with the site's own theme (the palette of docs/DESIGN.md), a copy control from site.js.
import { createHighlighter } from 'shiki';
import { esc } from './layout.mjs';

const C = { fg: '#c7ccd6', mut: '#8b90a0', steel: '#9fb3c8', cream: '#f3efe6', ok: '#8fd3b4', ask: '#e6c37a', wit: '#f0a08c', white: '#e9eaee' };
export const theme = {
  name: 'provedreview',
  type: 'dark',
  colors: { 'editor.background': '#05060900', 'editor.foreground': C.fg },
  tokenColors: [
    { settings: { foreground: C.fg } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: C.mut } },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: C.cream } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: C.ask } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.command'], settings: { foreground: C.white } },
    { scope: ['constant.other.option', 'variable.parameter', 'support.type.property-name', 'meta.object-literal.key'], settings: { foreground: C.steel } },
    { scope: ['keyword', 'storage', 'keyword.operator'], settings: { foreground: C.steel } },
    { scope: ['variable', 'variable.other'], settings: { foreground: C.fg } },
  ],
};

let hl;
export async function highlighter() {
  hl ??= await createHighlighter({ themes: [theme], langs: ['bash', 'json', 'typescript'] });
  return hl;
}

// A command block: the exact text a reader copies, highlighted. `note` sits in the caption (the pin, the requirement).
export async function command(src, { lang = 'bash', label = 'shell', note = '' } = {}) {
  const h = await highlighter();
  const html = h.codeToHtml(src, { lang, theme: 'provedreview' });
  return `<figure class="code" data-copy="${esc(src)}"><figcaption><span class="lang">${esc(label)}</span>${note ? `<span class="note">${note}</span>` : ''}</figcaption>${html}</figure>`;
}

// What the run prints. `verdict` names the line's kind (WITNESS, PASS-decided); the colour follows docs/DESIGN.md.
export async function output(src, { verdict = '', lang = 'text' } = {}) {
  const h = await highlighter();
  const body = lang === 'text' ? `<pre class="shiki"><code>${esc(src)}</code></pre>` : h.codeToHtml(src, { lang, theme: 'provedreview' });
  const kind = /^WITNESS/.test(verdict) ? 'w' : /^PASS/.test(verdict) ? 'ok' : 'ask';
  return `<figure class="code out"><figcaption><span class="lang">output</span>${verdict ? `<span class="verdict ${kind}">${esc(verdict)}</span>` : ''}</figcaption>${body}</figure>`;
}
