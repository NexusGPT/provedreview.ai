// The Benchmark page against data/leaderboard.json: build current, count, values, contract, no external request,
// HTML validity, every href, the five states in a headless browser at 1440 and 390, screenshots read back.
// node --test scripts/benchmark.test.mjs   (tools from ~/.nexus-tools/node_modules, or PW=<playwright dir> HV=<html-validate dir>)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = path.join(os.homedir(), '.nexus-tools/node_modules');
const BUILD = path.join(ROOT, 'scripts/build-benchmark.mjs');
const PAGE = path.join(ROOT, 'benchmark/index.html');
const SHOTS = path.join(ROOT, 'docs/shots/bench-build');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/leaderboard.json'), 'utf8'));
const ROWS = DATA.rows;
// routes other lanes own; a link to one of them is reported, not failed, until the page lands
const PENDING = { '/quick-start/': 'quick-start lane', '/docs/': 'docs lane', '/paper/': 'paper lane' };

// the page's own number format: the precision the source gives, at least one decimal (20.0 stays 20.0)
const fmt = (v) => v.toFixed(Math.max(1, (String(v).split('.')[1] || '').length));
const thou = (n) => n.toLocaleString('en-US');
const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const html = () => fs.readFileSync(PAGE, 'utf8');
const rowSeg = (h, id) => { const a = h.indexOf(`data-id="${id}"`); assert.ok(a > 0, `row ${id} missing`); const b = h.indexOf('<div class="tr ', a + 1); return h.slice(a, b > 0 ? b : h.indexOf('<!--/rows-->', a)); };
const cell = (seg, k) => { const m = new RegExp(`data-k="${k}"[^>]*>(.*?)</span><!--/${k}-->`).exec(seg); assert.ok(m, `cell ${k} missing`); const g = /<b class="gv">(.*?)<\/b>/.exec(m[1]); return text(g ? g[1] : m[1]).trim(); };

test('the build runs and the committed page is current', () => {
  execFileSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, stdio: 'pipe' });
});

test('count: every row of data/leaderboard.json is in the page, once', () => {
  const ids = [...html().matchAll(/<div class="tr (?:own|pub)[^"]*" data-id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, ROWS.length);
  assert.deepEqual([...ids].sort(), ROWS.map((r) => r.id).sort());
});

test('values: every number and condition in a row matches the data file', () => {
  const h = html();
  for (const r of ROWS) {
    const seg = rowSeg(h, r.id), t = text(seg);
    for (const k of ['f1', 'precision', 'recall']) assert.equal(cell(seg, k), fmt(r[k]), `${r.id} ${k}`);
    assert.equal(cell(seg, 'instances'), String(r.instances), `${r.id} instances`);
    assert.equal(cell(seg, 'avg_time'), r.avg_time ?? '—', `${r.id} time`);
    assert.equal(cell(seg, 'avg_tokens'), r.avg_tokens ?? '—', `${r.id} tokens`);
    for (const k of ['system', 'model', 'vendor', 'measured_by', 'version', 'judge', 'source', 'read']) assert.ok(t.includes(r[k]), `${r.id} ${k}: ${r[k]}`);
    assert.ok(t.includes(`${thou(r.notes)} human notes`), `${r.id} notes`);
    assert.ok(t.includes(`${thou(r.comments)} tool comments`), `${r.id} comments`);
    if (r.rounds) assert.ok(t.includes(`${r.rounds} rounds`), `${r.id} rounds`);
    for (const k of ['precision_fraction', 'recall_fraction', 'avg_tokens_in_out']) if (r[k]) assert.ok(t.includes(r[k]), `${r.id} ${k}`);
    if (r.measured_by === 'Measured by us') assert.ok(t.includes(`${DATA.unscored.count} unscored: ${DATA.unscored.reason}`), `${r.id} unscored`);
  }
  const e = DATA.escaped_defects, t = text(h);
  for (const [k, v] of Object.entries({ recordings_and_proof: e.recordings_and_proof, recordings: e.recordings, strongest_reader: e.strongest_reader })) assert.ok(t.includes(`${v} / ${e.of}`), `escaped ${k}`);
});

test('contract: a row without its source never ships', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-')); const bad = structuredClone(DATA); delete bad.rows[3].source;
  fs.writeFileSync(path.join(dir, 'lb.json'), JSON.stringify(bad));
  const r = spawnSync(process.execPath, [BUILD, '--data', path.join(dir, 'lb.json'), '--out', path.join(dir, 'out')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /pub-02.*source/); assert.ok(!fs.existsSync(path.join(dir, 'out/index.html')));
});

test('no external request in the markup', () => {
  const h = html();
  assert.deepEqual([...h.matchAll(/\s(?:src|srcset|poster|data)="([^"]*)"/g)].map((m) => m[1]).filter((u) => /^(https?:)?\/\//.test(u)), []);
  assert.deepEqual([...h.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]), []);
  assert.doesNotMatch(h, /url\(\s*['"]?(https?:)?\/\//); assert.doesNotMatch(h, /@import/); assert.doesNotMatch(h, /<script[^>]+src=/);
});

test('HTML validity (html-validate:standard)', async () => {
  const { HtmlValidate } = require(process.env.HV || path.join(TOOLS, 'html-validate'));
  const report = await new HtmlValidate({ extends: ['html-validate:standard'] }).validateFile(PAGE);
  const msgs = report.results.flatMap((r) => r.messages.map((m) => `${m.line}:${m.column} ${m.ruleId} ${m.message}`));
  assert.deepEqual(msgs, []);
});

test('links: every href resolves', () => {
  // the markup only: the inlined script's templates hold hrefs the build already rendered into the markup
  const h = html().replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''), ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])), pending = new Set();
  const hrefs = [...new Set([...h.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&')))];
  assert.ok(hrefs.length > 10);
  for (const href of hrefs) {
    if (href.startsWith('#')) { assert.ok(ids.has(href.slice(1)), `anchor ${href}`); continue; }
    if (/^https:\/\//.test(href)) { assert.ok(new URL(href).hostname.includes('.'), href); continue; }
    assert.doesNotMatch(href, /^(\/|[a-z]+:)/i, `${href}: relative links only, the site may be served under a path`);
    const u = new URL(href, 'http://x/benchmark/'), p = path.join(ROOT, decodeURIComponent(u.pathname));
    if (u.hash) assert.ok(ids.has(u.hash.slice(1)) || !u.pathname.startsWith('/benchmark/'), `anchor ${href}`);
    if (fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html')))) continue;
    assert.ok(PENDING[u.pathname], `${href} resolves to nothing (${p})`); pending.add(`${u.pathname} (${PENDING[u.pathname]})`);
  }
  if (pending.size) console.log('# pending routes, owned by other lanes:', [...pending].join(', '));
});

// ---------- in the browser ----------
let server, base, browser;
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
before(async () => {
  server = http.createServer((req, res) => {
    let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const pw = require(process.env.PW || path.join(TOOLS, 'playwright'));
  browser = await pw.chromium.launch();
  fs.mkdirSync(SHOTS, { recursive: true });
});
after(async () => { await browser?.close(); server?.close(); });

async function open(vp, query = '', opts = {}) {
  const ctx = await browser.newContext({ viewport: vp === 'p' ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: vp === 'p', hasTouch: vp === 'p', javaScriptEnabled: opts.js !== false });
  const page = await ctx.newPage(), errs = [], outside = [];
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('request', (q) => { const u = q.url(); if (!u.startsWith(base) && !/^(data|blob|about):/.test(u)) outside.push(u); });
  page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  if (opts.route) await page.route(base + '/benchmark/', opts.route);
  await page.goto(base + '/benchmark/' + query, { waitUntil: 'load' });
  return { page, ctx, errs, outside };
}
const ids = (page) => page.$$eval('.tbl .tr[data-id]', (els) => els.map((e) => e.dataset.id));
const cnt = (page) => page.$eval('.bar .cnt', (e) => e.textContent.trim());
async function shot(page, name, full = true) {
  if (full) { const H = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y <= H + 600; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1000);
    assert.deepEqual(await page.$$eval('.rv:not(.in)', (els) => els.map((e) => e.id)), [], 'every section revealed before the shot'); }
  else await page.waitForTimeout(900); // a reveal on scroll runs .8 s
  const f = path.join(SHOTS, name + '.png'); await page.screenshot({ path: f, fullPage: full });
  return f;
}
// read the PNG back: its header width and height, and its size on disk
const png = (f) => { const b = fs.readFileSync(f); assert.equal(b.toString('latin1', 1, 4), 'PNG'); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length }; };

test('desktop 1440: loaded, sort, filter, expand, empty; no external request', async () => {
  const { page, ctx, errs, outside } = await open('d');
  assert.equal((await ids(page)).length, ROWS.length); assert.equal(await cnt(page), `${ROWS.length} of ${ROWS.length} rows`);
  // the DOM values against the file, after the client took over
  const dom = await page.$$eval('.tbl .tr[data-id]', (els) => els.map((e) => ({ id: e.dataset.id, ...Object.fromEntries(['f1', 'precision', 'recall'].map((k) => [k, parseFloat(e.querySelector(`[data-k=${k}] .gv`).textContent)])) })));
  for (const d of dom) { const r = ROWS.find((x) => x.id === d.id); for (const k of ['f1', 'precision', 'recall']) assert.equal(d[k], r[k], `${d.id} ${k}`); }
  const by = (k, dir) => [...ROWS].sort((a, b) => (dir === 'desc' ? b[k] - a[k] : a[k] - b[k]))[0].id;
  assert.equal((await ids(page))[0], by('f1', 'desc'));
  assert.equal(await page.getAttribute('[data-sort=f1]', 'aria-label'), 'F1, sorted descending');
  for (const k of ['precision', 'recall']) {
    await page.click(`[data-sort=${k}]`); assert.equal((await ids(page))[0], by(k, 'desc'), `${k} desc`);
    await page.click(`[data-sort=${k}]`); assert.equal((await ids(page))[0], by(k, 'asc'), `${k} asc`);
  }
  await page.click('[data-sort=measured_by]');
  const mb = await page.$$eval('.tbl .tr[data-id]', (els) => els.map((e) => e.classList.contains('own') ? 'own' : 'pub'));
  assert.deepEqual(mb, [...mb].sort(), 'measured-by groups the runs'); assert.notEqual(mb[0], mb[mb.length - 1]);
  await page.click('[data-sort=f1]'); assert.equal((await ids(page))[0], by('f1', 'desc'));
  // filter by system
  const cc = ROWS.filter((r) => r.system === 'Claude Code');
  await page.click('.chip[data-f=sys][data-v="Claude Code"]');
  assert.deepEqual((await ids(page)).sort(), cc.map((r) => r.id).sort()); assert.equal(await cnt(page), `${cc.length} of ${ROWS.length} rows`);
  assert.match(page.url(), /system=Claude\+Code/);
  await page.click('.chip[data-f=sys][data-v="Claude Code"]'); assert.equal((await ids(page)).length, ROWS.length);
  // expand the DA + lean row
  const da = ROWS[0];
  await page.click(`.tr[data-id="${da.id}"] .row`); await page.waitForTimeout(400);
  assert.equal(await page.getAttribute(`.tr[data-id="${da.id}"] .row`, 'aria-expanded'), 'true');
  const det = await page.$eval(`.tr[data-id="${da.id}"] .det`, (e) => ({ t: e.innerText, h: e.getBoundingClientRect().height }));
  assert.ok(det.h > 150, `detail height ${det.h}`);
  for (const s of [`${da.instances} of ${DATA.unscored.of} scored`, `${DATA.unscored.count} unscored`, da.judge, `${da.rounds} rounds`, da.version, 'The paper →', 'Copy']) assert.ok(det.t.includes(s), `detail shows ${s}`);
  const fx = await shot(page, 'desktop-expanded', false);
  await page.click(`.tr[data-id="${da.id}"] .row`); await page.waitForTimeout(300);
  assert.equal(await page.getAttribute(`.tr[data-id="${da.id}"] .row`, 'aria-expanded'), 'false');
  // empty: Codex measured by us
  await page.click('.chip[data-f=sys][data-v="Codex"]'); await page.click('.chip[data-f=by][data-v="Measured by us"]');
  assert.equal((await ids(page)).length, 0); assert.equal(await cnt(page), `0 of ${ROWS.length} rows`);
  assert.match(await page.$eval('.empty', (e) => e.textContent), /No row matches System: Codex · Measured by: Measured by us/);
  const fe = await shot(page, 'desktop-empty', false);
  await page.click('.empty [data-reset]'); assert.equal((await ids(page)).length, ROWS.length);
  assert.doesNotMatch(page.url(), /\?/, 'reset clears the URL');
  // sixteen rows above the fold, as the board drew them
  const lastBottom = await page.$eval('.tbl .tr:last-child .row', (e) => e.getBoundingClientRect().bottom);
  assert.ok(lastBottom <= 900, `last row bottom ${lastBottom} under the fold`);
  const fl = await shot(page, 'desktop-loaded');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1440, 'no horizontal scroll');
  for (const [f, w] of [[fx, 1440], [fe, 1440], [fl, 1440]]) { const p = png(f); assert.equal(p.w, w, f); assert.ok(p.bytes > 20000, `${f} ${p.bytes} bytes`); }
  assert.deepEqual(outside, []); assert.deepEqual(errs, []);
  await ctx.close();
});

test('a deep link opens a row and a filter from the URL', async () => {
  const { page, ctx, errs } = await open('d', `?by=${encodeURIComponent('Published by Open Code Review')}&sort=recall&open=pub-12`);
  assert.equal((await ids(page)).length, ROWS.filter((r) => r.measured_by !== 'Measured by us').length);
  assert.equal((await ids(page))[0], 'pub-12'); // the highest recall among the published rows
  assert.equal(await page.getAttribute('.tr[data-id="pub-12"] .row', 'aria-expanded'), 'true');
  assert.deepEqual(errs, []); await ctx.close();
});

test('loading and error states', async () => {
  let { page, ctx, errs, outside } = await open('d', '?state=loading');
  assert.equal(await page.$$eval('.sk .tr', (e) => e.length), 10); assert.equal((await ids(page)).length, 0);
  assert.doesNotMatch(await page.$eval('.tbl .sk', (e) => e.textContent), /\d/, 'no value before it is read');
  assert.ok(await page.$eval('.chip', (e) => e.disabled)); assert.equal(await cnt(page), 'reading rows…');
  const fl = await shot(page, 'desktop-loading', false); assert.equal(png(fl).w, 1440);
  assert.deepEqual(outside, []); assert.deepEqual(errs, []); await ctx.close();

  ({ page, ctx, errs } = await open('d', '?state=error'));
  assert.match(await page.$eval('.err', (e) => e.textContent), /data\/leaderboard\.json did not load/);
  assert.equal(await page.$eval('.err [data-retry]', (e) => e.textContent), 'Retry');
  assert.deepEqual(await page.$eval('.err [data-retry]', (e) => getComputedStyle(e).padding), '8px 13px', 'the button keeps the .btn padding'); assert.equal(await cnt(page), 'no rows');
  const fe = await shot(page, 'desktop-error', false); assert.equal(png(fe).w, 1440);
  await Promise.all([page.waitForURL(/\/benchmark\/$/), page.click('.err [data-retry]')]);
  assert.equal((await ids(page)).length, ROWS.length, 'retry loads the rows'); assert.deepEqual(errs, []); await ctx.close();

  // the real failure: the inlined data does not parse
  ({ page, ctx } = await open('d', '', { route: async (route) => { const r = await route.fetch(); const b = (await r.text()).replace(/(<script type="application\/json" id="lb-data">)[\s\S]*?(<\/script>)/, '$1{"rows": [$2'); await route.fulfill({ response: r, body: b }); } }));
  assert.match(await page.$eval('.err', (e) => e.textContent), /did not load/); assert.equal((await ids(page)).length, 0);
  await ctx.close();
});

test('without JavaScript the page still holds every row', async () => {
  const { page, ctx, outside } = await open('d', '', { js: false });
  assert.equal((await ids(page)).length, ROWS.length); assert.deepEqual(outside, []); await ctx.close();
});

test('phone 390: loaded, no page overflow, filters sheet, sort select, expand', async () => {
  const { page, ctx, errs, outside } = await open('p');
  assert.equal((await ids(page)).length, ROWS.length);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, 'no horizontal page scroll');
  assert.ok(await page.$eval('.tbl .tr .row .f1c', (e) => e.getBoundingClientRect().right <= 390), 'F1 holds on screen');
  const fl = await shot(page, 'phone-loaded');
  assert.equal(await page.isVisible('.chip[data-f=sys]'), false, 'chips sit in the sheet');
  await page.click('[data-sheet]'); assert.equal(await page.isVisible('.chip[data-f=sys]'), true);
  const fs1 = await shot(page, 'phone-filters', false);
  await page.click('.chip[data-f=sys][data-v="Codex"]'); assert.equal((await ids(page)).length, 1);
  assert.match(await page.$eval('[data-sheet]', (e) => e.textContent), /Filters \(1\)/);
  await page.click('.bar [data-reset]'); assert.equal((await ids(page)).length, ROWS.length);
  await page.selectOption('[data-sortsel]', 'recall');
  assert.equal((await ids(page))[0], [...ROWS].sort((a, b) => b.recall - a.recall)[0].id);
  await page.selectOption('[data-sortsel]', 'f1');
  await page.tap(`.tr[data-id="${ROWS[0].id}"] .row`); await page.waitForTimeout(400);
  const box = await page.$eval(`.tr[data-id="${ROWS[0].id}"] .dbox`, (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, h: b.height }; });
  assert.ok(box.l >= 0 && box.r <= 390 && box.h > 200, `detail inside the screen ${JSON.stringify(box)}`);
  await page.$eval(`.tr[data-id="${ROWS[0].id}"]`, (e) => e.scrollIntoView());
  const fx = await shot(page, 'phone-expanded', false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, 'no horizontal page scroll with a row open');
  for (const f of [fl, fs1, fx]) assert.equal(png(f).w, 390, f);
  assert.deepEqual(outside, []); assert.deepEqual(errs, []); await ctx.close();
});

test('between the phone and 1440 the table scrolls in its box, never the page', async () => {
  for (const w of [1024, 800]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } }), page = await ctx.newPage();
    await page.goto(base + '/benchmark/', { waitUntil: 'load' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), w, `no page scroll at ${w}`);
    assert.ok(await page.$eval('.scr', (e) => e.scrollWidth > e.clientWidth), `the table scrolls at ${w}`);
    await ctx.close();
  }
});
