// The docs pages as data: content/docs/<section>/<page>.md with front matter, read and checked before anything renders.
// Every code block is matched line by line against the page's vendored sources (content/<repo>/<file> at the pin in
// content/PINS.json); the match gives the block its source line range, a miss is a problem.
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const root = path.resolve(import.meta.dirname, '..');
export const PINS = JSON.parse(fs.readFileSync(path.join(root, 'content/PINS.json'), 'utf8'));

// a heading's anchor id: lower case, backticks dropped, every other run of non-alphanumerics one hyphen
export const slug = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/`/g, '').replace(/&[a-z]+;|&#\d+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const LANGS = new Set(['bash', 'ts', 'tsx', 'js', 'json', 'python', 'text']);
const REQUIRED = ['title', 'order', 'lede', 'sources'];

function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: null, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: src.slice(m[0].length) };
}

const sourceCache = new Map();
function sourceLines(ref) {
  if (!sourceCache.has(ref)) {
    const [repo, file] = ref.split(/:(.*)/s);
    const pin = PINS[repo];
    const f = path.join(root, 'content', repo, file || '');
    // a Markdown table cell writes a pipe as \|; a code block copied from it writes the pipe
    sourceCache.set(ref, pin && pin.files.includes(file) && fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').map((l) => l.replace(/\\\|/g, '|')) : null);
  }
  return sourceCache.get(ref);
}

const codeLines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

// the first of the page's sources that holds every line of a block, in order, and the line range there
export function whereOf(text, sources) {
  const lines = codeLines(text);
  for (const s of sources) { const src = sourceLines(s); const r = src && locate(lines, src); if (r) return { source: s, lines: r }; }
  return null;
}

// where a block's lines sit in one source, in order: [first, last] (1-based), or null
function locate(lines, src) {
  let at = -1, first = -1;
  for (const l of lines) {
    let i = Math.max(at, 0); // two commands of a block may sit on one source line (a table cell)
    while (i < src.length && !src[i].includes(l)) i++;
    if (i >= src.length) return null;
    if (first < 0) first = i;
    at = i;
  }
  return [first + 1, at + 1];
}

export function loadDocs(dir = path.join(root, 'content/docs')) {
  const sections = JSON.parse(fs.readFileSync(path.join(dir, 'sections.json'), 'utf8'));
  const problems = [];
  const pages = [];
  for (const sec of sections) {
    const sdir = path.join(dir, sec.slug);
    const files = fs.existsSync(sdir) ? fs.readdirSync(sdir).filter((f) => f.endsWith('.md')).sort() : [];
    if (!files.length) problems.push(`${sec.slug}/: no pages`);
    const mine = [];
    for (const f of files) {
      const rel = `${sec.slug}/${f}`;
      const raw = fs.readFileSync(path.join(sdir, f), 'utf8');
      const { meta, body } = frontMatter(raw);
      if (!meta) { problems.push(`${rel}: no front matter`); continue; }
      for (const k of REQUIRED) if (!meta[k]) problems.push(`${rel}: front matter lacks ${k}`);
      const sources = (meta.sources || '').split(',').map((s) => s.trim()).filter(Boolean);
      for (const s of sources) if (!sourceLines(s)) problems.push(`${rel}: source ${s} is not a vendored file in content/PINS.json`);
      if (/[–—]/.test(raw)) problems.push(`${rel}: an em or en dash: ${raw.match(/.{0,30}[–—].{0,30}/)[0]}`);
      if (/^#\s/m.test(body.replace(/```[\s\S]*?```/g, ''))) problems.push(`${rel}: an H1 in the body (the title is the front matter's)`);
      const blocks = [];
      const tokens = marked.lexer(body);
      marked.walkTokens(tokens, (tok) => {
        if (tok.type !== 'code') return;
        const lang = (tok.lang || '').split(/\s/)[0];
        if (!LANGS.has(lang)) problems.push(`${rel}: code block language "${tok.lang || ''}" (one of ${[...LANGS].join(', ')})`);
        const where = whereOf(tok.text, sources);
        if (!where) for (const l of codeLines(tok.text)) if (!sources.some((s) => sourceLines(s)?.some((x) => x.includes(l)))) problems.push(`${rel}: code line not in its sources: ${l.slice(0, 120)}`);
        blocks.push({ lang, text: tok.text, where });
      });
      mine.push({ section: sec, slug: f.replace(/\.md$/, ''), file: rel, meta, title: meta.title, order: Number(meta.order), lede: meta.lede, sources, body, blocks });
    }
    mine.sort((a, b) => a.order - b.order);
    const orders = mine.map((p) => p.order);
    if (orders.some((o) => !Number.isInteger(o))) problems.push(`${sec.slug}/: an order that is not an integer`);
    if (new Set(orders).size !== orders.length) problems.push(`${sec.slug}/: two pages share an order`);
    pages.push(...mine);
  }
  return { sections, pages, problems };
}
