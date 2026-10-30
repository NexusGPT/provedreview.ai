// Headless check of the page: widths, the hero against q4, the reveal, two full-page screenshots.
// node scripts/check.mjs [base] [outdir]   (Playwright from ~/.nexus-tools, or PW=<path to playwright>)
import { createRequire } from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW || path.join(os.homedir(), '.nexus-tools/node_modules/playwright'));
const base = process.argv[2] || 'http://127.0.0.1:8768'; const out = process.argv[3] || 'docs/shots';
const result = {}; const done = (code) => { console.log(JSON.stringify(result, null, 1)); process.exit(code); };
setTimeout(() => { result.timeout = true; done(1); }, 110000);
const HERO = ['.nav', '.logo', '.links', '.nav .btn.p', '.kicker', 'h1', '.hero .sub', '.cert', '.stats', '.hero .btn.p'];
const rects = (page) => page.evaluate((sels) => Object.fromEntries(sels.map((s) => { const e = document.querySelector(s); if (!e) return [s, null]; const r = e.getBoundingClientRect(); return [s, [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10)]; })), HERO);
const browser = await pw.chromium.launch();
let fail = false;
try {
  for (const [name, w, h, mobile] of [['desktop', 1440, 900, false], ['phone', 390, 844, true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const r = (result[name] = {});
    // the hero against q4, at scroll 0, same server
    const q = await ctx.newPage(); await q.goto(base + '/variants/q4.html', { waitUntil: 'domcontentloaded', timeout: 20000 }); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(1500);
    const qr = await rects(q); await q.close();
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('response', (res) => { if (res.status() >= 400) errs.push(res.status() + ' ' + res.url()); });
    await p.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    const pr = await rects(p);
    r.heroDiff = HERO.filter((s) => JSON.stringify(qr[s]) !== JSON.stringify(pr[s])).map((s) => ({ s, q4: qr[s], page: pr[s] }));
    r.before = await p.evaluate(() => ({ rv: document.querySelectorAll('.rv').length, shown: document.querySelectorAll('.rv.in').length, sw: document.documentElement.scrollWidth, iw: innerWidth }));
    // scroll through in viewport steps, then back to the top
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += Math.round(h * 0.6)) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(900);
    r.after = await p.evaluate(() => ({ shown: document.querySelectorAll('.rv.in').length, hidden: [...document.querySelectorAll('.rv:not(.in)')].map((e) => e.className), koiIdleAtBottom: !!window.__koiIdle,
      sections: ['.nav', 'main.hero', '#numbers', '#use-cases', '#method', '#benchmark', '#quick-start', '#paper', 'footer.foot'].map((s) => { const e = document.querySelector(s); return [s, !!e && e.getBoundingClientRect().height > 0]; }),
      sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight,
      wide: [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5) && getComputedStyle(e).position !== 'fixed'; }).slice(0, 8).map((e) => e.tagName + '.' + e.className),
      figs: [...document.querySelectorAll('canvas[data-fig]')].map((c) => [c.dataset.fig, c.width]),
      // html and body hide horizontal overflow (q4), so scrollWidth stays at innerWidth even when content is cut: read each block's own overflow too
      clipped: [...document.querySelectorAll('main.hero *, .below *')].filter((e) => { const cs = getComputedStyle(e); return cs.display !== 'inline' && e.scrollWidth > e.clientWidth + 1 && cs.overflowX === 'visible' && e.clientWidth > 0; }).map((e) => `${e.tagName}.${e.className} ${e.scrollWidth}>${e.clientWidth}`) }));
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
    r.koiIdleAtTop = await p.evaluate(() => !!window.__koiIdle);
    r.noOverflow = r.before.sw <= r.before.iw && r.after.sw <= r.after.iw;
    r.noClipped = r.after.clipped.length === 0;
    await p.screenshot({ path: path.join(out, name + '.png'), fullPage: true, timeout: 30000 });
    r.shot = path.join(out, name + '.png'); r.errors = errs;
    if (!r.noOverflow || !r.noClipped || r.heroDiff.length || r.after.hidden.length || errs.length || r.after.sections.some(([, ok]) => !ok)) fail = true;
    await ctx.close();
  }
} finally { await browser.close(); }
result.pass = !fail; done(fail ? 1 : 0);
