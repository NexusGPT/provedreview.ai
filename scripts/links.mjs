// Every internal link and asset in the built site resolves: the file exists, and the #anchor is an id on that page.
// node scripts/links.mjs [dist] [--base /prefix/]   exit 1 on any broken link, each one named
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const bi = args.indexOf('--base');
const base = bi >= 0 ? args.splice(bi, 2)[1] : '/';
const dist = path.resolve(args[0] || 'dist');

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(dist).filter((f) => f.endsWith('.html'));
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};
// a URL path to the file GitHub Pages would serve for it
const target = (p) => {
  let f = path.join(dist, decodeURIComponent(p));
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  else if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  return f;
};

const broken = [];
let count = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, (s) => (/\ssrc="/.test(s.slice(0, s.indexOf('>'))) ? s.slice(0, s.indexOf('>') + 1) : ''));
  const pageUrl = '/' + path.relative(dist, page).split(path.sep).join('/');
  for (const m of html.matchAll(/\s(href|src|poster)="([^"]*)"/g)) {
    const raw = m[2];
    if (!raw || /^(https?:|mailto:|data:|javascript:)/.test(raw) || raw.startsWith('//')) continue;
    count++;
    const u = new URL(raw, 'http://site' + pageUrl);
    let p = u.pathname;
    if (raw.startsWith('#')) p = pageUrl;
    else if (raw.startsWith('/')) {
      if (!p.startsWith(base)) { broken.push(`${pageUrl}: ${raw} (outside the base ${base})`); continue; }
      p = '/' + p.slice(base.length);
    }
    const file = target(p);
    if (!fs.existsSync(file)) { broken.push(`${pageUrl}: ${raw} (no file ${path.relative(dist, file)})`); continue; }
    const hash = decodeURIComponent(u.hash.slice(1));
    if (hash && file.endsWith('.html') && !idsOf(file).has(hash)) broken.push(`${pageUrl}: ${raw} (no id "${hash}" on ${path.relative(dist, file)})`);
  }
}
for (const b of broken) console.log('BROKEN ' + b);
console.log(`links: ${count} internal links on ${pages.length} pages, ${broken.length} broken`);
process.exit(broken.length ? 1 : 0);
