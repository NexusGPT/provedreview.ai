// The docs pages: every content file renders, every page is in the rail and in prev/next order, every link resolves,
// every page is valid HTML, the contents column follows the H2 rule, search finds a term from each section.
// npm test   (the search test needs Playwright: PW=<path to a playwright package>, default /root/gate-full/node_modules/playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadDocs } from './docs.mjs';

const repo = path.resolve(import.meta.dirname, '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'provedreview-docs-'));
const { sections, pages } = loadDocs();
const read = (r) => fs.readFileSync(path.join(out, r), 'utf8');
const route = (p) => `docs/${p.section.slug}/${p.slug}/index.html`;
const href = (p) => `/docs/${p.section.slug}/${p.slug}/`;
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
let build;

before(() => { build = spawnSync('node', ['scripts/build.mjs', '--out', out], { cwd: repo, encoding: 'utf8', env: { ...process.env, SITE_BASE: '/' } }); });

test('every content file is sourced: front matter, vendored sources, every code line verbatim (docs-sources)', () => {
  const r = spawnSync('node', ['scripts/docs-sources.mjs'], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('the six sections, 15 pages or more, every section with a page', () => {
  assert.deepEqual(sections.map((s) => s.title), ['Getting started', 'Lean', 'Differential attestation', 'The benchmark', 'Reference', 'FAQ']);
  assert.ok(pages.length >= 15, `pages: ${pages.length}`);
  for (const s of sections) assert.ok(pages.some((p) => p.section.slug === s.slug), s.slug);
});

test('every content file renders: the build exits 0 with no marked or shiki error, one page per file', () => {
  assert.equal(build.status, 0, build.stdout + build.stderr);
  assert.doesNotMatch(build.stderr, /error/i, build.stderr);
  assert.ok(fs.existsSync(path.join(out, 'docs/index.html')), 'docs/index.html');
  for (const p of pages) {
    assert.ok(fs.existsSync(path.join(out, route(p))), `missing ${route(p)}`);
    const html = read(route(p));
    assert.match(html, new RegExp(`<h1[^>]*>${p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`), `${p.file}: title`);
    assert.doesNotMatch(html, /<pre><code class="language-/, `${p.file}: a code block marked rendered without shiki`);
    assert.equal((html.match(/<figure class="cb/g) || []).length, p.blocks.length, `${p.file}: code blocks`);
  }
});

test('the rail lists every page on every docs page, the current one marked, all six sections open', () => {
  for (const r of ['docs/index.html', ...pages.map(route)]) {
    const html = read(r);
    const rail = html.match(/<aside class="rail"[\s\S]*?<\/aside>/)?.[0];
    assert.ok(rail, `${r}: no rail`);
    for (const p of pages) assert.ok(rail.includes(`href="${href(p)}"`), `${r}: rail lacks ${p.file}`);
    assert.equal((rail.match(/<ul/g) || []).length, 6, `${r}: six open groups`);
    const cur = [...rail.matchAll(/<a href="([^"]+)" aria-current="page"/g)].map((m) => m[1]);
    assert.deepEqual(cur, r === 'docs/index.html' ? [] : ['/' + r.replace(/index\.html$/, '')], `${r}: current entry`);
  }
});

test('prev and next walk every page in rail order', () => {
  const order = [{ href: '/docs/' }, ...pages.map((p) => ({ href: href(p) }))];
  pages.forEach((p, i) => {
    const pn = read(route(p)).match(/<nav class="pn"[\s\S]*?<\/nav>/)?.[0] || '';
    assert.match(pn, new RegExp(`class="pv" href="${order[i].href}"`), `${p.file}: prev`);
    if (i + 1 < pages.length) assert.match(pn, new RegExp(`class="nx" href="${order[i + 2].href}"`), `${p.file}: next`);
    else assert.doesNotMatch(pn, /class="nx"/, `${p.file}: the last page has no next`);
  });
});

test('the right contents: on pages with 3 or more H2s, one entry per H2 and H3, each an id on the page', () => {
  for (const p of pages) {
    const html = read(route(p));
    const h2 = (html.match(/<h2 id=/g) || []).length;
    const toc = html.match(/<nav class="dtoc"[\s\S]*?<\/nav>/)?.[0];
    if (h2 < 3) { assert.ok(!toc, `${p.file}: ${h2} H2s, no contents`); continue; }
    assert.ok(toc, `${p.file}: ${h2} H2s and no contents`);
    const ids = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1]);
    const links = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((id) => id !== 'top');
    assert.deepEqual(links, ids, `${p.file}: contents against headings`);
  }
});

test('code blocks: a line gutter, a copy control on source, a source line, output blocks marked', () => {
  let copy = 0, outb = 0;
  for (const p of pages) {
    const html = read(route(p));
    for (const fig of html.match(/<figure class="cb[\s\S]*?<\/figure>/g) || []) {
      assert.match(fig, /class="no"/, `${p.file}: no gutter`);
      if (/class="cb out"/.test(fig)) { outb++; assert.doesNotMatch(fig, /data-code=/, `${p.file}: an output block offers copy`); }
      else { copy++; assert.match(fig, /data-code="/, `${p.file}: a source block with nothing to copy`); }
      assert.match(fig, /<span class="src">[^<]+:\d+(-\d+)?<\/span>/, `${p.file}: no source line range`);
    }
  }
  assert.ok(copy > 20 && outb > 5, `copy ${copy}, output ${outb}`);
});

test('the docs landing: six sections, each with its page count and its pages', () => {
  const html = read('docs/index.html');
  const secs = html.match(/<a class="dsec"/g) || [];
  assert.equal(secs.length, 6);
  for (const s of sections) assert.ok(html.includes(`<b>${s.title}</b>`), s.title);
  assert.match(html, new RegExp(`${pages.length} pages · 6 sections`));
});

test('the owner\'s voice: no em or en dash in any docs page\'s visible text', () => {
  for (const r of ['docs/index.html', ...pages.map(route)]) assert.doesNotMatch(visible(read(r)), /[–—]/, `${r}: ${visible(read(r)).match(/.{0,40}[–—].{0,40}/)?.[0]}`);
});

test('every internal link resolves (scripts/links.mjs)', () => {
  const r = spawnSync('node', ['scripts/links.mjs', out], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('every docs page is valid HTML (scripts/validate.mjs)', () => {
  const r = spawnSync('node', ['scripts/validate.mjs', out], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('the search index holds every docs page', () => {
  const r = spawnSync('node', ['scripts/build.mjs', '--check', '--out', out], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.existsSync(path.join(out, 'pagefind/pagefind.js')));
});

// search, in a browser: a term from each section finds a page of that section
const require = createRequire(import.meta.url);
let pw = null;
try { pw = require(process.env.PW || '/root/gate-full/node_modules/playwright'); } catch { pw = null; }
const TERMS = { 'getting-started': 'container image', lean: 'verdicts', 'differential-attestation': 'predicate registry', benchmark: 'hard set', reference: 'LEAN_NET', faq: 'jail' };
let server;
after(() => server?.kill());

test('search finds a term from each section, its top hit in that section', { skip: !pw && 'Playwright not installed (PW=<path>)' }, async () => {
  const port = 8790 + Math.floor(Math.random() * 100);
  server = spawn('node', ['scripts/preview.mjs', String(port), out], { cwd: repo, stdio: 'pipe' });
  await new Promise((res) => setTimeout(res, 800));
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://127.0.0.1:${port}/docs/`);
    for (const s of sections) {
      const term = TERMS[s.slug];
      await page.fill('#dq', term);
      await page.waitForFunction((t) => document.querySelector('#rq')?.textContent === `"${t}"` && !document.querySelector('#res').hidden, term, { timeout: 8000 });
      const hits = await page.$$eval('.res .hit', (as) => as.slice(0, 3).map((a) => a.getAttribute('href')));
      assert.ok(hits[0].startsWith(`/docs/${s.slug}/`), `"${term}": top hits ${hits.join(', ')}`);
      if (s.slug === 'differential-attestation') assert.equal(await page.$eval('.res .hit b', (b) => b.textContent), 'Predicate registry', 'J3.4: the top hit');
    }
    await page.fill('#dq', 'qqzzxv nothing');
    await page.waitForSelector('.res .rempty:not([hidden])', { timeout: 8000 });
    assert.equal(await page.$$eval('.res .hit', (as) => as.length), 0, 'the empty result holds no hits');
  } finally { await browser.close(); }
});
