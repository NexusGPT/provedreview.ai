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
const SOURCES = { 'index.html': 'index.html', ...Object.fromEntries(await Promise.all(PAGES.map(async (p) => [(await import(`../site/${p}.mjs`)).route, `site/${p}.mjs`]))) };

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
const write = (rel, body) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };
const copy = (from, to = from) => fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true });

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// static files: the public folder whole, the engine and the stylesheets with their paths rebased
copy('public');
for (const f of ['styles.css', 'site.css', 'engine.js', 'site.js']) write(f, rebase(fs.readFileSync(path.join(root, f), 'utf8')));
write('.nojekyll', '');

// the data the pages read
const board = JSON.parse(fs.readFileSync(path.join(root, 'data/leaderboard.json'), 'utf8'));
const ctx = { rows: board.rows, board };

// the home: index.html with the shell filled in and the three teaser rows from the data
const top3 = [...board.rows].sort((a, b) => b.f1 - a.f1).slice(0, 3);
const teaser = top3.map((r, i) => `<tr${i === 0 ? ' class="ours"' : ''}><td class="en">${esc(r.system)}<small>${esc(r.model.replace(/ \(reader\)/, ''))}</small></td><td class="by">${r.measured_by === 'Measured by us' ? 'Nexus' : 'Open Code Review'}</td><td><span class="num">${r.instances}</span></td><td><span class="num">${r.f1.toFixed(2)}</span></td></tr>`).join('');
let home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const fill = (marker, html) => { const re = new RegExp(`<!--#${marker}[^>]*-->`); if (!re.test(home)) throw new Error(`index.html lacks <!--#${marker}-->`); home = home.replace(re, html); };
fill('shell-head', assets());
fill('nav', nav(''));
fill('footer', footer());
fill('teaser-rows', teaser);
home = home.replace('<main class="hero">', '<main class="hero" data-pagefind-body>').replace('<div class="below">', '<div class="below" data-pagefind-body>');
write('index.html', rebase(home));

// the other pages
for (const p of PAGES) {
  const m = await import(`../site/${p}.mjs`);
  const html = page({ title: m.title, description: m.description, active: m.active, index: m.index !== false, body: await m.body(ctx) });
  write(m.route, rebase(html));
}
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
