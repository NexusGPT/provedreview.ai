// Headless Chromium over the docs at 1440 and 390: the landing, a short page, a long page (arrived by a contents entry,
// one block copied), search open, and on the phone the menu open. Each frame: no sideways scroll, no failed request,
// no script error, no block wider than its box (the column aside: its code blocks run 64 px past it by design). One PNG per frame into docs/shots/docs-build/.
// node scripts/docs-shots.mjs [base] [outdir]   (PW=<path to a playwright package>, default /root/gate-full/node_modules/playwright)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pw = require(process.env.PW || '/root/gate-full/node_modules/playwright');
const base = (process.argv[2] || 'http://127.0.0.1:8769').replace(/\/$/, '');
const out = process.argv[3] || 'docs/shots/docs-build';
const SHORT = '/docs/reference/environment/';
const LONG = '/docs/lean/writing-provable-code/';
fs.mkdirSync(out, { recursive: true });

const FRAMES = [
  ['landing', '/docs/', async () => {}],
  ['short-page', SHORT, async () => {}],
  ['long-page', LONG, async (p, phone) => {
    if (!phone) await p.click('.dtoc .tt a.h2 >> nth=2'); else await p.evaluate(() => { location.hash = document.querySelectorAll('.col h2')[2].id; });
    await p.waitForTimeout(400);
    await p.click('.cb[data-code] .cp >> nth=0', { force: true }).catch(() => {});
  }, true],
  ['long-page-target', LONG, async (p, phone) => {
    if (!phone) await p.click('.dtoc .tt a.h2 >> nth=2'); else await p.evaluate(() => { location.hash = document.querySelectorAll('.col h2')[2].id; });
    await p.waitForTimeout(400);
    await p.click('.cb[data-code] .cp >> visible=true', { force: true }).catch(() => {});
  }],
  ['search-open', LONG, async (p, phone) => {
    if (phone) { await p.click('#sb'); await p.fill('#dq2', 'predicate registry'); } else await p.fill('#dq', 'predicate registry');
    await p.waitForFunction(() => !document.querySelector('#res').hidden && document.querySelector('#rq').textContent === '"predicate registry"', null, { timeout: 8000 });
    await p.waitForTimeout(300);
  }],
  ['search-empty', '/docs/', async (p, phone) => {
    if (phone) { await p.click('#sb'); await p.fill('#dq2', 'regsitry predikat'); } else await p.fill('#dq', 'regsitry predikat');
    await p.waitForSelector('#rempty:not([hidden])', { timeout: 8000 });
  }],
  ['menu-open', LONG, async (p, phone) => { if (!phone) return 'skip'; await p.click('#mb'); await p.waitForTimeout(300); }],
];
const VIEWS = [['1440', 1440, 900, false], ['390', 390, 844, true]];

const browser = await pw.chromium.launch();
const report = []; let fail = false;
try {
  for (const [vname, w, h, mobile] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, permissions: ['clipboard-read', 'clipboard-write'] });
    for (const [name, url, act, full] of FRAMES) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', (e) => errs.push(String(e)));
      p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
      await p.goto(base + url, { waitUntil: 'load', timeout: 30000 });
      await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
      if ((await act(p, mobile)) === 'skip') { await p.close(); continue; }
      const m = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth, iw: innerWidth,
        wide: [...document.querySelectorAll('main *, .rail *, .dtoc *, .dbar *, .nav *, .foot *, .res *')].filter((e) => { const s = getComputedStyle(e); return e.scrollWidth > e.clientWidth + 1 && s.overflowX === 'visible' && e.clientWidth > 0 && !['CANVAS', 'svg', 'CODE'].includes(e.tagName) && !e.closest('.cbody,.tw') && !e.matches('.col'); }).slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${e.className} ${e.scrollWidth}>${e.clientWidth}`),
        copied: document.querySelector('.cp.ok')?.textContent || null,
        target: location.hash || null,
      }));
      const file = path.join(out, `${vname}-${name}.png`);
      await p.screenshot({ path: file, fullPage: !!full });
      const bad = m.sw > m.iw || m.wide.length || errs.length;
      if (bad) fail = true;
      report.push({ ok: !bad, frame: `${vname} ${name}`, ...m, errs, file });
      await p.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); }
for (const r of report) console.log(JSON.stringify(r));
process.exit(fail ? 1 : 0);
