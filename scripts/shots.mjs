// Headless Chromium over every page at 1440 and 390: no horizontal scroll, no failed request, no script error,
// every section revealed, then a full-page screenshot of each.   node scripts/shots.mjs [base] [outdir]
// Playwright is not a site dependency: PW=<path to a playwright package> (default /root/gate-full/node_modules/playwright).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pw = require(process.env.PW || '/root/gate-full/node_modules/playwright');
const base = (process.argv[2] || 'http://127.0.0.1:8769').replace(/\/$/, '');
const out = process.argv[3] || 'docs/shots/site-build';
const PAGES = [['home', '/'], ['quick-start', '/quick-start/'], ['paper', '/paper/'], ['benchmark', '/benchmark/'], ['docs', '/docs/'], ['404', '/docs/verdict']];
const VIEWS = [['desktop', 1440, 900, false], ['phone', 390, 844, true]];
fs.mkdirSync(out, { recursive: true });

const browser = await pw.chromium.launch();
const report = []; let fail = false;
try {
  for (const [vname, w, h, mobile] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    for (const [name, url] of PAGES) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', (e) => errs.push(String(e)));
      p.on('console', (m) => { if (m.type() === 'error' && !/404 \(Not Found\)/.test(m.text())) errs.push(m.text()); });
      p.on('response', (r) => { if (r.status() >= 400 && !(name === '404' && r.url() === base + url)) errs.push(r.status() + ' ' + r.url()); });
      const resp = await p.goto(base + url, { waitUntil: 'load', timeout: 30000 });
      await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= H; y += Math.round(h * 0.6)) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(900);
      const m = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth, iw: innerWidth,
        hidden: [...document.querySelectorAll('.rv:not(.in)')].length,
        // a block whose content is wider than its box (html and body hide horizontal overflow, so scrollWidth alone misses a clipped line)
        wide: [...document.querySelectorAll('main *, .nav *, .foot *')].filter((e) => { const s = getComputedStyle(e); return e.scrollWidth > e.clientWidth + 1 && s.overflowX === 'visible' && e.clientWidth > 0 && !['CANVAS', 'svg'].includes(e.tagName); }).slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${e.className} ${e.scrollWidth}>${e.clientWidth}`),
        fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')).filter((v, i, a) => a.indexOf(v) === i),
      }));
      const file = path.join(out, `${name}-${vname}.png`);
      await p.screenshot({ path: file, fullPage: true });
      const row = { page: name, view: vname, status: resp.status(), ...m, errs, file };
      const bad = m.sw > m.iw || m.hidden || m.wide.length || errs.length || resp.status() !== (name === '404' ? 404 : 200);
      if (bad) fail = true;
      report.push({ ok: !bad, ...row });
      await p.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); }
for (const r of report) console.log(JSON.stringify(r));
process.exit(fail ? 1 : 0);
