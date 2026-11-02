// The site builds from a clean copy of the repository, and what it builds holds together.
// npm test   (the copy is every tracked and untracked, not ignored file: what a clone sees once committed)
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'provedreview-build-'));
const dist = path.join(tmp, 'dist');
const ROUTES = ['index.html', 'benchmark/index.html', 'quick-start/index.html', 'docs/index.html', 'paper/index.html', '404.html'];
const NAV = [['Benchmark', '/benchmark/'], ['Quick start', '/quick-start/'], ['Docs', '/docs/'], ['Paper', '/paper/'], ['GitHub', 'https://github.com/NexusGPT/lean']];
const read = (p) => fs.readFileSync(path.join(dist, p), 'utf8');
const run = (cmd, args, cwd = tmp) => spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, SITE_BASE: '/' } });
let build;

before(() => {
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const f of files) {
    if (!fs.existsSync(path.join(repo, f))) continue; // deleted in the working tree
    fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true });
    fs.copyFileSync(path.join(repo, f), path.join(tmp, f));
  }
  const ci = run('npm', ['ci', '--offline', '--no-audit', '--no-fund']);
  assert.equal(ci.status, 0, ci.stderr);
  build = run('npm', ['run', 'build']);
});

test('npm run build exits 0 from a clean copy', () => {
  assert.equal(build.status, 0, build.stdout + build.stderr);
});

test('the five routes and the 404 page exist in dist/', () => {
  for (const r of ROUTES) assert.ok(fs.existsSync(path.join(dist, r)), `missing dist/${r}`);
});

test('one page per source: build --check', () => {
  const r = run('node', ['scripts/build.mjs', '--check']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('the Pagefind index is present', () => {
  assert.ok(fs.existsSync(path.join(dist, 'pagefind/pagefind.js')), 'dist/pagefind/pagefind.js');
  assert.ok(fs.readdirSync(path.join(dist, 'pagefind')).some((f) => f.startsWith('pagefind-entry')), 'pagefind-entry.json');
});

test('every internal link resolves (scripts/links.mjs)', () => {
  const r = run('node', ['scripts/links.mjs', dist]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('every page is valid HTML (scripts/validate.mjs)', () => {
  const r = run('node', ['scripts/validate.mjs', dist]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('every page carries the one shared nav and footer, the current page marked', () => {
  const current = { 'benchmark/index.html': 'Benchmark', 'quick-start/index.html': 'Quick start', 'docs/index.html': 'Docs', 'paper/index.html': 'Paper' };
  for (const r of ROUTES) {
    const html = read(r);
    const nav = html.match(/<header class="nav"[\s\S]*?<\/header>/)?.[0];
    assert.ok(nav, `${r}: no shared nav`);
    for (const [label, href] of NAV) assert.ok(nav.includes(`href="${href}"`) && nav.includes(`>${label}<`), `${r}: nav lacks ${label}`);
    assert.match(html, /<footer class="foot"/, `${r}: no shared footer`);
    const marked = [...nav.matchAll(/aria-current="page"[^>]*>([^<]+)</g)].map((m) => m[1]);
    assert.deepEqual(marked, current[r] ? [current[r]] : [], `${r}: current page`);
  }
});

test('fonts are self-hosted: no request leaves the site for a font', () => {
  for (const r of ROUTES) assert.doesNotMatch(read(r), /fonts\.(googleapis|gstatic)\.com/, r);
  const css = fs.readFileSync(path.join(dist, 'site.css'), 'utf8');
  const urls = [...css.matchAll(/url\((\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
  for (const f of ['Inter', 'JetBrains Mono', 'Source Serif 4']) assert.match(css, new RegExp(`font-family:"${f}"`), f);
  assert.ok(urls.length >= 7, `woff2 faces: ${urls.length}`);
  for (const u of urls) assert.ok(fs.existsSync(path.join(dist, u)), u);
});

test('quick start: every command it offers to copy is verbatim in the pinned lean README', () => {
  const readme = fs.readFileSync(path.join(tmp, 'content/lean/README.md'), 'utf8');
  const html = read('quick-start/index.html');
  const copies = [...html.matchAll(/data-copy="([^"]*)"/g)].map((m) => m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
  assert.ok(copies.length >= 5, `copyable blocks: ${copies.length}`);
  for (const c of copies) for (const line of c.split('\n')) assert.ok(readme.includes(line), `not in README: ${line}`);
  assert.match(html, /\{&quot;input&quot;:17,&quot;floor&quot;:-1,&quot;parent&quot;:1,&quot;candidate&quot;:0\}|\{"input":17,"floor":-1,"parent":1,"candidate":0\}/);
  assert.match(html, /v0\.1\.3/); assert.match(html, /dbe9a32/); assert.match(html, /Node 24/);
});

test('home: the benchmark and quick start are teasers that lead to their pages', () => {
  const html = read('index.html');
  assert.match(html, /href="\/benchmark\/"[^>]*>[^<]*every row/i);
  assert.match(html, /href="\/quick-start\/"[^>]*>Quick start →</);
  assert.match(html, /href="\/docs\/"/);
  assert.equal((html.match(/<tr[\s>]/g) || []).length, 4, 'header and three teaser rows');
});

test('the owner\'s voice: no em or en dashes in any page\'s visible text', () => {
  for (const r of ROUTES) {
    const text = read(r).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /[–—]/, `${r}: ${text.match(/.{0,40}[–—].{0,40}/)?.[0]}`);
  }
});

test('benchmark carries the shell with the review placeholder', () => {
  for (const r of ['benchmark/index.html']) assert.match(read(r), /layout and style under review/i, r);
});

test('the 404 page names the missing path and links all five pages', () => {
  const html = read('404.html');
  assert.match(html, /No page at/);
  for (const href of ['/benchmark/', '/quick-start/', '/docs/', '/paper/']) assert.ok(html.split(`href="${href}"`).length > 2, `404 body links ${href}`);
});

test('SITE_BASE prefixes every root path, engine and CSS included', () => {
  const out = path.join(tmp, 'dist-base');
  const r = spawnSync('node', ['scripts/build.mjs', '--out', out, '--no-search'], { cwd: tmp, encoding: 'utf8', env: { ...process.env, SITE_BASE: '/provedreview/' } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const home = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /(href|src)="\/(?!provedreview\/)/);
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'engine.js'), 'utf8'), /['"`]\/public\//);
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'site.css'), 'utf8'), /url\(\/(?!provedreview\/)/);
  const l = spawnSync('node', ['scripts/links.mjs', out, '--base', '/provedreview/'], { cwd: tmp, encoding: 'utf8' });
  assert.equal(l.status, 0, l.stdout + l.stderr);
});
