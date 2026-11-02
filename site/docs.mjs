// /docs/: the landing and one page per content/docs/<section>/<page>.md, on the picked rail layout (r1 A) in the
// terminal manual look (r2 B): the rail with all six sections open, the right contents on pages with 3 or more H2s,
// search in the rail head, prev and next, the phone menu, code blocks with a line gutter and a copy control.
import { Marked } from 'marked';
import { createHighlighter } from 'shiki';
import { head, nav, footer, esc } from '../scripts/layout.mjs';
import { theme } from '../scripts/highlight.mjs';
import { loadDocs, slug, whereOf, PINS } from '../scripts/docs.mjs';

export const route = 'docs/index.html';
export const active = 'Docs';
export const title = 'Docs · provedreview';
export const description = 'lean and differential attestation: getting started, lean, the method, the benchmark, the reference, the FAQ.';

const REPO = { lean: 'NexusGPT/lean', da: 'NexusGPT/differential-attestation' };
const pinRef = (repo) => PINS[repo].tag || PINS[repo].commit;
const srcUrl = (ref, lines) => { const [repo, file] = ref.split(/:(.*)/s); return `https://github.com/${REPO[repo]}/blob/${pinRef(repo)}/${file}${lines ? `#L${lines[0]}-L${lines[1]}` : ''}`; };
const fileOf = (ref) => ref.split(/:(.*)/s)[1];
const two = (n) => String(n).padStart(2, '0');
const hrefOf = (p) => `/docs/${p.section.slug}/${p.slug}/`;

// the words the build colours: the verdicts (docs/DESIGN.md: the spark for a witness or a refusal, green for a pass, amber for a question)
const VERDICT = /\b(WITNESS|REFUSE|PASS-proved|PASS-decided|PASS-bounded|IN-SCOPE|PASS|ASK(?::[a-z-]+)?)(?![\w-])/g;
const vclass = (v) => (/^(WITNESS|REFUSE)$/.test(v) ? 'vw' : /^ASK/.test(v) ? 'va' : 'vo');
const paintVerdicts = (escaped) => escaped.replace(VERDICT, (v) => `<span class="${vclass(v)}">${v}</span>`);

let hl;
const highlighter = async () => (hl ??= await createHighlighter({ themes: [theme], langs: ['bash', 'typescript', 'tsx', 'javascript', 'json', 'python'] }));
const SHIKI = { bash: 'bash', ts: 'typescript', tsx: 'tsx', js: 'javascript', json: 'json', python: 'python' };

function codeBlock(h, { text, lang }, sources) {
  const where = whereOf(text, sources);
  const lines = text.replace(/\n+$/, '').split('\n');
  const out = lang === 'text';
  let rows;
  if (out) rows = lines.map((l) => paintVerdicts(esc(l)));
  else rows = h.codeToTokens(text.replace(/\n+$/, ''), { lang: SHIKI[lang], theme: 'provedreview' }).tokens
    .map((line) => line.map((t) => (t.color && t.color.toLowerCase() !== '#c7ccd6' ? `<span style="color:${t.color}">${esc(t.content)}</span>` : esc(t.content))).join(''));
  const body = rows.map((r, i) => `<div class="ln"><span class="no">${out ? '›' : i + 1}</span><code>${r || ' '}</code></div>`).join('');
  const src = where ? `<a class="src" href="${srcUrl(where.source, where.lines)}"><span class="src">${esc(fileOf(where.source))}:${where.lines[0]}${where.lines[1] > where.lines[0] ? `-${where.lines[1]}` : ''}</span></a>` : '';
  const copy = out ? '' : '<button type="button" class="cp" aria-label="Copy the code">copy</button>';
  return `<figure class="cb${out ? ' out' : ''}"${out ? '' : ` data-code="${esc(text.replace(/\n+$/, ''))}"`}><figcaption><span class="lang">${out ? 'output' : esc(lang)}</span>${src}${copy}</figcaption><div class="cbody">${body}</div></figure>`;
}

// one Markdown page to HTML, with its heading list for the contents
function render(h, page) {
  const heads = [];
  const used = new Map();
  const m = new Marked({ gfm: true });
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        let id = slug(inner) || 'section';
        if (/^\d/.test(id)) id = 'n' + id; // an id begins with a letter: "1. A booking" is #n1-a-booking
        const n = (used.get(id) || 0) + 1; used.set(id, n); if (n > 1) id += `-${n}`;
        if (depth === 2 || depth === 3) heads.push({ depth, id, text: inner.replace(/<[^>]+>/g, '') });
        const hash = depth === 2 ? '#' : depth === 3 ? '##' : '###';
        return `<h${depth} id="${id}"><a class="hash" href="#${id}" aria-label="Link to this section" data-pagefind-ignore>${hash}</a>${inner}</h${depth}>\n`;
      },
      code(tok) { return codeBlock(h, { text: tok.text, lang: (tok.lang || '').split(/\s/)[0] }, page.sources); },
      codespan({ text }) {
        const t = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const v = t.match(/^(WITNESS|REFUSE|PASS-proved|PASS-decided|PASS-bounded|IN-SCOPE|PASS|NEW|ASK(?::[a-z-]+)?)$/);
        return v && t !== 'NEW' ? `<code class="v ${vclass(t)}">${esc(t)}</code>` : `<code>${esc(t)}</code>`;
      },
      blockquote({ tokens }) {
        const inner = this.parser.parse(tokens);
        const note = inner.match(/^<p><strong>Note\.<\/strong>\s*/);
        if (note) return `<div class="note" role="note"><span class="nl">note</span><div>${inner.replace(note[0], '<p>')}</div></div>\n`;
        return `<blockquote>${inner}</blockquote>\n`;
      },
      table(tok) {
        const cell = (c) => this.parser.parseInline(c.tokens);
        const al = (c) => (c.align ? ` class="a-${c.align}"` : '');
        const th = tok.header.map((c) => `<th${al(c)}>${cell(c)}</th>`).join('');
        const rows = tok.rows.map((r) => `<tr>${r.map((c) => `<td${al(c)}>${cell(c)}</td>`).join('')}</tr>`).join('');
        return `<div class="tw"><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
      link({ href, title: t, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const ext = /^https?:/.test(href);
        return `<a href="${esc(href)}"${t ? ` title="${esc(t)}"` : ''}${ext ? ' rel="noopener"' : ''}>${inner}</a>`;
      },
    },
  });
  return { html: m.parse(page.body), heads };
}

// the rail: the search field, then the tree with every section open; `cur` is the page shown (null on the landing)
function rail(sections, pages, cur) {
  const tree = sections.map((s) => {
    const mine = pages.filter((p) => p.section.slug === s.slug);
    const on = cur && cur.section.slug === s.slug;
    const items = mine.map((p, i) => {
      const me = cur && p === cur;
      return `<li${me ? ' class="cur"' : ''}><span class="gl" aria-hidden="true">${i === mine.length - 1 ? '└─' : '├─'}</span><a href="${hrefOf(p)}"${me ? ' aria-current="page"' : ''}>${esc(p.title)}</a>${me ? '<i class="spark" aria-hidden="true"></i>' : ''}</li>`;
    }).join('');
    return `<div class="sh${on ? ' on' : ''}"><span class="gl" aria-hidden="true">▾</span><b>${esc(s.title)}</b><u>${two(mine.length)}</u></div><ul aria-label="${esc(s.title)}">${items}</ul>`;
  }).join('');
  return `<aside class="rail" id="rail" aria-label="Docs">
<div class="rh"><label class="sf"><span class="pr" aria-hidden="true">/</span><input id="dq" type="search" placeholder="search docs" autocomplete="off" spellcheck="false" aria-label="Search the docs" aria-controls="res"><span class="kbd" aria-hidden="true">/</span></label>
<div class="rmeta"><span>docs/</span><span>${pages.length} pages · ${sections.length} sections</span></div></div>
<nav class="tree" aria-label="Docs pages">${tree}</nav>
</aside>`;
}

// the right contents: the H2s and H3s as a tree under the page title
function contents(page, heads) {
  if (heads.filter((x) => x.depth === 2).length < 3) return '<div class="dtoc empty"></div>';
  const items = heads.map((x, i) => {
    const lastH2 = !heads.slice(i + 1).some((y) => y.depth === 2);
    const nextIsH3 = heads[i + 1]?.depth === 3;
    const gl = x.depth === 2 ? (lastH2 ? '└─' : '├─') : `${heads.slice(i + 1).some((y) => y.depth === 2) ? '│' : ' '}  ${nextIsH3 ? '├─' : '└─'}`;
    return `<a class="h${x.depth}" href="#${x.id}"><span class="gl" aria-hidden="true">${gl}</span><span class="tx">${esc(x.text)}</span></a>`;
  }).join('');
  return `<nav class="dtoc" aria-label="On this page"><div class="th"><span>on this page</span><u>${heads.length}</u></div><div class="tt"><div class="troot"><span class="gl" aria-hidden="true">┬</span>${esc(page.title)}</div>${items}</div><div class="tf"><a href="#top">↑ top</a><a href="${srcUrl(page.sources[0])}" rel="noopener">source ↗</a></div></nav>`;
}

function pn(pages, i) {
  const prev = i === 0 ? { href: '/docs/', small: 'docs/', title: 'Docs home' } : { href: hrefOf(pages[i - 1]), small: `${pages[i - 1].section.slug}/`, title: pages[i - 1].title };
  const next = pages[i + 1] && { href: hrefOf(pages[i + 1]), small: `${pages[i + 1].section.slug}/`, title: pages[i + 1].title };
  return `<nav class="pn" aria-label="Previous and next" data-pagefind-ignore><a class="pv" href="${prev.href}"><span>← prev</span><small>${esc(prev.small)}</small><b>${esc(prev.title)}</b></a>${next ? `<a class="nx" href="${next.href}"><span>next →</span><small>${esc(next.small)}</small><b>${esc(next.title)}</b></a>` : ''}</nav>`;
}

// the phone bar under the nav: the menu (the rail as a sheet) and search
const dbar = (path) => `<div class="dbar" id="dbar"><button type="button" class="mb" id="mb" aria-controls="rail" aria-expanded="false"><span class="gl" aria-hidden="true">☰</span><span class="dp">${path}</span></button><button type="button" class="sb" id="sb"><span class="pr" aria-hidden="true">/</span>search</button>
<label class="sf ph"><span class="pr" aria-hidden="true">/</span><input id="dq2" type="search" placeholder="search docs" autocomplete="off" spellcheck="false" aria-label="Search the docs" aria-controls="res"></label><button type="button" class="cn" id="cn">cancel</button></div>`;

const searchPanel = `<div class="scrim" id="scrim" hidden></div>
<div class="res" id="res" role="dialog" aria-label="Search results" hidden><div class="rc"><span id="rcount"></span><span class="qq" id="rq"></span><span class="keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> move <kbd>↵</kbd> open <kbd>esc</kbd> close</span></div><div id="hits"></div><div class="rempty" id="rempty" hidden><span class="nl">empty</span><span>No results for "<b id="rqe"></b>"</span><button type="button" class="cp" id="rclear">clear</button></div></div>`;

function shell({ title: t, description: d, path, railHtml, main, toc }) {
  return `<!doctype html><html lang="en"><head>${head({ title: t, description: d })}
<link rel="stylesheet" href="/docs.css"></head><body class="inner docs">
${nav('Docs')}
${dbar(path)}
<div class="g3">
${railHtml}
<main id="main">
${main}
</main>
${toc}
</div>
<div class="wrapf">${footer()}</div>
${searchPanel}
<script src="/site.js"></script><script src="/docs.js"></script>
</body></html>
`;
}

function landing(sections, pages) {
  const cards = sections.map((s, i) => {
    const mine = pages.filter((p) => p.section.slug === s.slug);
    const show = mine.length > 4 ? mine.slice(0, 3) : mine;
    const li = show.map((p, j) => `<li><span class="gl" aria-hidden="true">${j === show.length - 1 && show.length === mine.length ? '└─' : '├─'}</span>${esc(p.title)}</li>`).join('')
      + (show.length < mine.length ? `<li class="mo"><span class="gl" aria-hidden="true">└─</span>+${mine.length - show.length} more</li>` : '');
    return `<a class="dsec" href="${hrefOf(mine[0])}"><span class="sk"><span class="ix">${two(i + 1)}</span><b>${esc(s.title)}</b><u>${mine.length} page${mine.length === 1 ? '' : 's'}</u></span><span class="sp">${esc(s.blurb)}</span><ul>${li}</ul></a>`;
  }).join('');
  return `<article class="col land" data-pagefind-body data-pagefind-filter="area:docs" data-pagefind-meta="section:docs">
<div class="crumb"><b>docs</b><em>${pages.length} pages · ${sections.length} sections</em></div>
<h1>Docs</h1>
<p class="lede">lean, differential attestation, the benchmark. First run: <a class="qs" href="/quick-start/">Quick start →</a></p>
<div class="secs">${cards}</div>
</article>`;
}

export function routes() {
  const { pages } = loadDocs();
  return [route, ...pages.map((p) => `docs/${p.section.slug}/${p.slug}/index.html`)];
}

// every docs route with its HTML; a page that fails to render stops the build with the file's name
export async function pages() {
  const { sections, pages: all, problems } = loadDocs();
  if (problems.length) throw new Error(`content/docs:\n${problems.join('\n')}`);
  const h = await highlighter();
  const out = [{ route, html: shell({ title, description, path: '<b>docs</b>', railHtml: rail(sections, all, null), main: landing(sections, all), toc: '<div class="dtoc empty"></div>' }) }];
  all.forEach((p, i) => {
    let r;
    try { r = render(h, p); } catch (e) { throw new Error(`content/docs/${p.file}: ${e.message}`); }
    const [repo] = p.sources[0].split(':');
    const pin = PINS[repo];
    const main = `<article class="col" data-pagefind-body data-pagefind-filter="area:docs" data-pagefind-meta="section:${esc(p.section.slug)}">
<div class="crumb"><a href="/docs/">docs</a><span>/</span><a href="${hrefOf(all.find((q) => q.section === p.section))}">${p.section.slug}</a><span>/</span><b>${p.slug}</b><em>${two(i + 1)} of ${all.length}</em></div>
<h1>${esc(p.title)}</h1>
<div class="srcl" data-pagefind-ignore><span>src</span><a href="${srcUrl(p.sources[0])}" rel="noopener">${REPO[repo]}@${esc(pin.tag || pin.commit.slice(0, 7))}</a><span>${esc(fileOf(p.sources[0]))}</span>${p.sources.length > 1 ? `<span>+${p.sources.length - 1} more</span>` : ''}<span>pinned ${esc(pin.date)}</span></div>
<p class="lede">${esc(p.lede)}</p>
${r.html}
${pn(all, i)}
</article>`;
    out.push({ route: `docs/${p.section.slug}/${p.slug}/index.html`, html: shell({ title: `${p.title} · Docs · provedreview`, description: p.lede, path: `${p.section.slug}/<b>${p.slug}</b>`, railHtml: rail(sections, all, p), main, toc: contents(p, r.heads) }) });
  });
  return out;
}

export async function body() { return ''; }
