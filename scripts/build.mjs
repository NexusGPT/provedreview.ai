// One command builds the site into dist/: the home from index.html, the other pages from site/*.mjs, the shared shell
// from scripts/layout.mjs, then the Pagefind index over the built pages.
// node scripts/build.mjs [--out dir] [--no-search] [--check]
//   SITE_BASE=/repo/  serves the site under a path (a Pages URL before the custom domain); default "/"
//   --check           builds nothing; verifies dist/ holds one page per source and nothing else
import fs from 'node:fs';
import path from 'node:path';
import { assets, nav, footer, page, esc } from './layout.mjs';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const out = path.resolve(root, opt('--out') || 'dist');
const BASE = process.env.SITE_BASE || '/';
if (!/^\/([^/]+\/)*$/.test(BASE)) throw new Error(`SITE_BASE must start and end with "/": ${BASE}`);

const PAGES = ['quick-start', 'paper', 'benchmark', 'docs', 'not-found'];
// a page module writes one route (`route`), or several (`routes()` and `pages()`: the docs, one per content file)
const SOURCES = { 'index.html': 'index.html', ...Object.fromEntries((await Promise.all(PAGES.map(async (p) => { const m = await import(`../site/${p}.mjs`); return (m.routes ? m.routes() : [m.route]).map((r) => [r, `site/${p}.mjs`]); }))).flat()) };

if (args.includes('--check')) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const built = walk(out).filter((f) => f.endsWith('.html') && !f.includes(`${path.sep}pagefind${path.sep}`)).map((f) => path.relative(out, f).split(path.sep).join('/')).sort();
  const want = Object.keys(SOURCES).sort();
  const missing = want.filter((r) => !built.includes(r)); const extra = built.filter((r) => !want.includes(r));
  for (const r of missing) console.log(`MISSING dist/${r} (from ${SOURCES[r]})`);
  for (const r of extra) console.log(`EXTRA dist/${r} (no source)`);
  console.log(`check: ${want.length} sources, ${built.length} pages, ${missing.length} missing, ${extra.length} extra`);
  process.exit(missing.length + extra.length ? 1 : 0);
}

// root paths follow SITE_BASE: attributes, CSS url(), and the engine's '/public/' strings
const rebase = (s) => (BASE === '/' ? s : s
  .replace(/(\s(?:href|src|poster|content|action)=")\/(?!\/)/g, `$1${BASE}`)
  .replace(/url\(\/(?!\/)/g, `url(${BASE}`)
  .replace(/(['"`])\/public\//g, `$1${BASE}public/`));
// every page names its scripts and stylesheets with the file's content hash (/engine.js?v=1a2b3c4d), so a deploy is never
// shadowed by a copy a browser or the Pages cache kept (the koi rework stayed on screen after its withdrawal)
import crypto from 'node:crypto';
const stamp = (rel) => crypto.createHash('sha1').update(fs.readFileSync(path.join(root, rel))).digest('hex').slice(0, 8);
const STAMPED = ['engine.js', 'site.js', 'docs.js', 'styles.css', 'site.css', 'docs.css'].filter((f) => fs.existsSync(path.join(root, f)));
const stamps = Object.fromEntries(STAMPED.map((f) => [f, stamp(f)]));
const versioned = (html) => html.replace(/((?:src|href)=")\/(engine\.js|site\.js|docs\.js|styles\.css|site\.css|docs\.css)(")/g, (m, a, f, z) => stamps[f] ? `${a}/${f}?v=${stamps[f]}${z}` : m);
const write = (rel, body) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, rel.endsWith('.html') ? versioned(body) : body); };
const copy = (from, to = from) => fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true });

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// static files: the public folder whole, the engine and the stylesheets with their paths rebased
copy('public');
for (const f of ['styles.css', 'site.css', 'engine.js', 'site.js', 'docs.css', 'docs.js']) write(f, rebase(fs.readFileSync(path.join(root, f), 'utf8')));
write('.nojekyll', '');

// the data the pages read
const board = JSON.parse(fs.readFileSync(path.join(root, 'data/leaderboard.json'), 'utf8'));
const ctx = { rows: board.rows, board };

// the home: index.html with the shell filled in and the three teaser rows from the data
const top3 = [...board.rows].sort((a, b) => b.f1 - a.f1).slice(0, 3);
const teaser = top3.map((r, i) => `<tr${i === 0 ? ' class="ours"' : ''}><td class="en">${esc(r.system)} <small>· ${esc(r.model.replace(/ \(reader\)/, ''))}</small></td><td class="by">${r.measured_by === 'Measured by us' ? 'Nexus' : 'Open Code Review'}</td><td><span class="num">${r.instances}</span></td><td><span class="num">${r.f1.toFixed(2)}</span></td></tr>`).join('');
let home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const fill = (marker, html) => { const re = new RegExp(`<!--#${marker}[^>]*-->`); if (!re.test(home)) throw new Error(`index.html lacks <!--#${marker}-->`); home = home.replace(re, html); };
fill('shell-head', assets());
fill('nav', nav(''));
// the home's footer line is direction D's (2026-11-03); every other page keeps the shared line in scripts/layout.mjs
fill('footer', footer('Nexus builds differential attestation. lean is the checker inside it.'));
fill('teaser-rows', teaser);
home = home.replace('<main class="hero">', '<main class="hero" data-pagefind-body>').replace('<div class="below">', '<div class="below" data-pagefind-body>');
write('index.html', rebase(home));

// the other pages
for (const p of PAGES) {
  const m = await import(`../site/${p}.mjs`);
  const raw = m.raw && await m.raw(ctx);
  if (raw) { write(m.route, rebase(raw)); continue; } // a complete document of its own (the benchmark page, built by scripts/build-benchmark.mjs)
  if (m.pages) { for (const { route, html } of await m.pages(ctx)) write(route, rebase(html)); continue; }
  const html = page({ title: m.title, description: m.description, active: m.active, index: m.index !== false, body: await m.body(ctx) });
  write(m.route, rebase(html));
}
if (fs.existsSync(path.join(root, 'benchmark/leaderboard.json'))) copy('benchmark/leaderboard.json'); // the benchmark page fetches it beside itself
console.log(`built ${Object.keys(SOURCES).length} pages into ${path.relative(root, out) || '.'} (base ${BASE})`);

// search: Pagefind over the built pages (only what sits inside data-pagefind-body)
if (!args.includes('--no-search')) {
  const pagefind = await import('pagefind');
  const { index, errors } = await pagefind.createIndex({});
  if (errors.length) throw new Error(errors.join('\n'));
  const added = await index.addDirectory({ path: out, glob: '**/index.html' }); // the 404 page stays out
  if (added.errors.length) throw new Error(added.errors.join('\n'));
  const written = await index.writeFiles({ outputPath: path.join(out, 'pagefind') });
  if (written.errors.length) throw new Error(written.errors.join('\n'));
  await pagefind.close();
  console.log(`search: ${added.page_count} pages indexed into ${path.relative(root, path.join(out, 'pagefind'))}`);
}
