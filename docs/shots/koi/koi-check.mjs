// Headless checks of the koi hero (engine.js), and its screenshots and frame strip.
// node docs/shots/koi/koi-check.mjs [base] [--no-shots]   (Playwright from ~/.nexus-tools, or PW=<path to playwright>)
// Each check prints PASS or FAIL with its numbers; the summary goes to docs/shots/koi/results.json.
import { createRequire } from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW || path.join(os.homedir(), '.nexus-tools/node_modules/playwright'));
const base = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://127.0.0.1:8768';
const shots = !process.argv.includes('--no-shots'); const out = path.join(path.dirname(new URL(import.meta.url).pathname));
const SEEDS = [1, 2, 3]; const VIEWS = [[1440, 900], [390, 844]];
const results = {}; let fail = false;
const verdict = (name, ok, data) => { results[name] = { ok, ...data }; if (!ok) fail = true; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify(data)}`); };
// headless Chromium paces animation frames to its compositor; without these two flags it runs at about 7 frames a second here
const browser = await pw.chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
const open = async (w, h, q = '', opts = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ...opts }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`${base}/${q}`, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__koi && window.__koi.ready, null, { timeout: 20000 }); return { p, ctx, errs }; };
// stop the live loop so the fast-forward owns the simulation (the guard is the engine's own: the hero leaves the screen)
const holdLoop = (p) => p.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); return new Promise((r) => setTimeout(r, 300)); });
try {
  // 1. exclusion: 60 simulated seconds, every step rasterised, every lit photo sample tested against the headline ellipse
  for (const [w, h] of VIEWS) {
    const per = [];
    for (const seed of SEEDS) { const { p, ctx } = await open(w, h, `?koiseed=${seed}`); await holdLoop(p); const r = await p.evaluate(() => __koi.sim(60)); per.push({ seed, minE2: +r.minE.toFixed(3) }); await ctx.close(); }
    verdict(`exclusion ${w}x${h}`, per.every((x) => x.minE2 >= 1), { steps: 3600, seeds: per, rule: 'min over all lit body samples of ((x-cx)/rx)^2+((y-cy)/ry)^2 >= 1' });
  }
  // 2. pace: each koi's circuits of its patrol ring over 400 simulated seconds
  for (const [w, h] of VIEWS) {
    const per = [];
    for (const seed of SEEDS) { const { p, ctx } = await open(w, h, `?koiseed=${seed}`); await holdLoop(p); const r = await p.evaluate(() => __koi.sim(400));
      for (const k of r.koi) per.push({ seed, koi: k.id, circuits: k.laps.map((t, i) => +(t - (i ? k.laps[i - 1] : 0)).toFixed(1)) }); await ctx.close(); }
    const all = per.flatMap((x) => x.circuits); verdict(`pace ${w}x${h}`, per.every((x) => x.circuits.length >= 2) && all.every((c) => c >= 120 && c <= 180), { band: [120, 180], min: Math.min(...all), max: Math.max(...all), n: all.length, per });
  }
  // 3. budget: 600 live frames at 1440x900, performance.now around each frame (the fixed steps and the draw)
  { const { p, ctx } = await open(1440, 900, '?koiseed=1'); await p.waitForTimeout(1000); await p.evaluate(() => __koi.resetFrameMs());
    await p.waitForFunction(() => __koi.frameMs().n >= 600, null, { timeout: 120000, polling: 500 }); const r = await p.evaluate(() => __koi.frameMs());
    verdict('budget 1440x900', r.avg < 4, { frames: r.n, avgMs: +r.avg.toFixed(3), limitMs: 4 }); await ctx.close(); }
  // 4. guards
  { const { p, ctx, errs } = await open(1440, 900, '?koiseed=1'); await p.waitForTimeout(800);
    const live = await p.evaluate(() => ({ idle: window.__koiIdle, running: __koi.running }));
    // hidden tab: the page reports hidden and fires visibilitychange (headless has no real background tab)
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    const f0 = await p.evaluate(() => __koi.frames); await p.waitForTimeout(1000); const hidden = await p.evaluate(() => ({ idle: window.__koiIdle, running: __koi.running, frames: __koi.frames }));
    await p.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(600);
    const back = await p.evaluate(() => ({ idle: window.__koiIdle, running: __koi.running, frames: __koi.frames }));
    verdict('guard hidden tab', live.idle === false && live.running && hidden.idle === true && !hidden.running && hidden.frames === f0 && back.idle === false && back.frames > hidden.frames, { live, hidden: { ...hidden, framesWhileHidden: hidden.frames - f0 }, back });
    // scrolled past the hero: the same guard through the IntersectionObserver
    await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600); const below = await p.evaluate(() => ({ idle: window.__koiIdle, running: __koi.running }));
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600); const top = await p.evaluate(() => ({ idle: window.__koiIdle, running: __koi.running }));
    verdict('guard hero off screen', below.idle && !below.running && !top.idle && top.running, { below, top });
    // resize: the ellipse is measured again from [data-koi-avoid]
    const a0 = await p.evaluate(() => __koi.layout().avoid); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800);
    const a1 = await p.evaluate(() => __koi.layout().avoid); const want = await p.evaluate(() => { const r = document.querySelector('[data-koi-avoid]').getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + scrollY + r.height / 2, rx: r.width / Math.SQRT2, ry: r.height / Math.SQRT2 }; });
    const same = ['cx', 'cy', 'rx', 'ry'].every((k) => Math.abs(a1[k] - want[k]) < 0.5);
    verdict('guard resize re-measures', same && Math.abs(a1.rx - a0.rx) > 1, { at1440: a0, at390: a1, fromDom: want });
    verdict('no page errors', errs.length === 0, { errs }); await ctx.close(); }
  { const { p, ctx } = await open(1440, 900, '', { reducedMotion: 'reduce' }); await p.waitForTimeout(2000);
    const a = await p.evaluate(() => ({ frames: __koi.frames, running: __koi.running, img: document.getElementById('ascii').toDataURL() })); await p.waitForTimeout(1000);
    const b = await p.evaluate(() => ({ frames: __koi.frames, running: __koi.running, img: document.getElementById('ascii').toDataURL(), lit: __koi.layout().koi.length }));
    verdict('guard reduced motion still after 2 s', !a.running && a.frames === b.frames && a.img === b.img && a.frames > 0, { framesAt2s: a.frames, framesAt3s: b.frames, running: b.running, sameCanvas: a.img === b.img });
    if (shots) await p.screenshot({ path: path.join(out, 'reduced-1440.png') }); await ctx.close(); }
  // 5. screenshots at 0, 5, 20 and 60 simulated seconds, and a 10-second frame strip every 0.5 s
  if (shots) {
    await Promise.all(VIEWS.map(async ([w, h]) => { const { p, ctx } = await open(w, h, '?koiseed=1'); await p.evaluate(() => document.fonts.ready);
      for (const t of [0, 5, 20, 60]) { await p.waitForFunction((t) => __koi.time >= t, t, { timeout: 180000, polling: 16 }); await p.screenshot({ path: path.join(out, `koi-${w}-${String(t).padStart(2, '0')}s.png`) }); }
      await ctx.close(); }));
    for (const [w, h] of VIEWS) {
      const { p, ctx } = await open(w, h, '?koiseed=1'); await p.waitForFunction(() => __koi.time >= 20, null, { timeout: 60000, polling: 16 });
      // the loop is held and the simulation advanced 0.5 s between frames, every step drawn, so the screenshot time does not count
      const frames = []; await p.evaluate(() => __koi.hold(true));
      for (let i = 0; i < 20; i++) { if (i) await p.evaluate(() => __koi.advance(0.5)); frames.push({ t: await p.evaluate(() => __koi.time.toFixed(2)), b64: (await p.screenshot()).toString('base64') }); }
      // compose the strip in a page canvas: 5 by 4, each frame scaled down, its simulated time in the corner
      const sc = w > 700 ? 0.25 : 0.4, fw = Math.round(w * sc), fh = Math.round(h * sc);
      const png = await p.evaluate(async ({ frames, fw, fh }) => { const c = document.createElement('canvas'); c.width = fw * 5; c.height = fh * 4; const g = c.getContext('2d'); g.font = '12px monospace';
        for (let i = 0; i < frames.length; i++) { const im = new Image(); im.src = 'data:image/png;base64,' + frames[i].b64; await im.decode(); const x = (i % 5) * fw, y = Math.floor(i / 5) * fh; g.drawImage(im, x, y, fw, fh); g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(x, y, 64, 16); g.fillStyle = '#fc6'; g.fillText(`t=${frames[i].t}`, x + 3, y + 12); g.strokeStyle = '#333'; g.strokeRect(x + 0.5, y + 0.5, fw - 1, fh - 1); }
        return c.toDataURL('image/png').slice(22); }, { frames, fw, fh });
      fs.writeFileSync(path.join(out, `strip-${w}.png`), Buffer.from(png, 'base64')); await ctx.close();
    }
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1) + '\n');
console.log(fail ? 'FAIL' : 'PASS'); process.exit(fail ? 1 : 0);
