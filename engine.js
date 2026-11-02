// The koi hero. The koi are the owner's photo (public/koi-body.png and its two pectoral fins), bent along a spine and
// read into the ASCII tile grid. How they move and how the loop runs follow ascii-sharks (github.com/stackedlol/ascii-sharks,
// MIT, see NOTICES): summed steering intents with a rate-capped heading, a follow-the-leader spine, a travelling wave added
// at draw time, fins that bank into turns, a fixed-step loop that pauses off screen and settles to a still under reduced motion.
(() => {
  const cv = document.getElementById('ascii'); if (!cv) return;
  const ctx = cv.getContext('2d'); const gcv = document.getElementById('glow'), gctx = gcv.getContext('2d');
  const fcv = document.getElementById('far'), fcx = fcv.getContext('2d'); const ncv = document.getElementById('near'), ncx = ncv.getContext('2d');
  const hero = document.querySelector('main.hero'); const avoidEl = document.querySelector('[data-koi-avoid]') || hero;
  const RAMP = " .`':;-,~=+oxt%SXO8#@";
  const STEP = 1 / 60, MAX_STEPS = 4;
  const PERIOD = 150; // one patrol circuit in seconds: docs/DESIGN.md, "the koi orbit about 2.5 minutes"
  const N = 16, MAX_BEND = 0.16, TURN_CAP = 0.6; // spine nodes, bend per joint (rad), lazy turn cap (rad/s)
  const SIZES = [1, 0.84, 0.7], RINGS = [1, 0.74, 0.5]; // body sizes; each koi's ring as a share of the patrol
  const WAVE_AMP = 0.04, WAVE_LAG = 4.8, WAVE_POW = 1.8; // travelling wave: amplitude (of L) at the tail, phase lag head to tail, growth
  const WIDE = 1.25; // the photo is drawn this much wider across the body than along it: a slender photo koi reads as a line at cell size
  const STEER_MARGIN = 0.42; const AHEAD = [0, 0.35, 0.7]; // the steering ellipse is the headline ellipse grown by this many body lengths
  const LMIN = 100; const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const angleDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  const mq = matchMedia('(prefers-reduced-motion: reduce)'); let reduce = mq.matches;
  // seeded, so a test run and the reduced-motion still are the same every load
  const qs = new URLSearchParams(location.search);
  const seed = qs.has('koiseed') ? (+qs.get('koiseed') >>> 0) || 1 : reduce ? 1 : ((Math.random() * 4294967296) >>> 0) || 1;
  let rstate = seed; const rng = () => { rstate = (rstate + 0x6D2B79F5) >>> 0; let t = rstate; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // ---- the photo: body with the fins cut out, and the two pectoral fins, each as a few mip levels of raw pixels ----
  const IMGS = ['koi-body', 'koi-fin-pecU', 'koi-fin-pecL']; const imgs = {}; let meta = null, sprite = null;
  const mipChain = (src) => { const out = []; let w = src.width, h = src.height, prev = src; for (let i = 0; i < 6 && w >= 12; i++) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(prev, 0, 0, w, h); out.push({ w, h, d: g.getImageData(0, 0, w, h).data, s: w / src.width }); prev = c; w = Math.round(w / 2); h = Math.round(h / 2); } return out; };
  function buildSprite() {
    const b = imgs['koi-body']; const w0 = b.width, h0 = b.height; const c = document.createElement('canvas'); c.width = w0; c.height = h0; const g = c.getContext('2d');
    g.drawImage(b, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(imgs['koi-fin-pecU'], 0, 0); g.drawImage(imgs['koi-fin-pecL'], 0, 0);
    const fins = ['pecU', 'pecL'].map((k) => ({ hx: meta.fins[k].hinge[0], hy: meta.fins[k].hinge[1], side: meta.fins[k].side, mips: mipChain(imgs[`koi-fin-${k}`]) }));
    sprite = { w0, h0, body: mipChain(c), fins };
  }
  {
    let pending = IMGS.length + 1; const done = () => { if (--pending === 0) { buildSprite(); onLayout(); } };
    fetch('/public/koi-straight.json').then((r) => r.json()).then((j) => { meta = j; done(); });
    for (const n of IMGS) { const im = new Image(); im.onload = done; im.src = `/public/${n}.png`; imgs[n] = im; }
  }

  // ---- layout: canvases, the cell grid, the headline ellipse and the patrol, all measured on resize ----
  let W = 0, H = 0, dpr = 1, cell = 14, cols = 0, rows = 0, fcell = 9, font = '', fontFar = '', Lb = 300;
  let lit = null, seeds = null, buf = null, glowImg = null; const off = document.createElement('canvas'), octx = off.getContext('2d'); const gridCv = document.createElement('canvas');
  const avoid = { cx: 0, cy: 0, rx: 1, ry: 1 }, steerE = { rx: 1, ry: 1 }, patrol = { cx: 0, cy: 0, a: 1, b: 1, per: 1 };
  function measure() {
    const r = avoidEl.getBoundingClientRect(); const y = r.top + scrollY; // at the top of the page, where the hero is read
    // the ellipse through the corners of the copy block, with the block's own aspect
    avoid.cx = r.left + r.width / 2; avoid.cy = y + r.height / 2; avoid.rx = Math.max(1, r.width / Math.SQRT2); avoid.ry = Math.max(1, r.height / Math.SQRT2);
    // body length from the viewport, then shrunk until the free water holds a patrol at least 0.65 body lengths across its short radius
    Lb = clamp(Math.min(W, H) * 0.4, LMIN, 400);
    for (let it = 0; it < 4; it++) { fitPatrol(); const need = Math.min(patrol.a, patrol.b) / 0.65; if (need >= Lb || Lb <= LMIN) break; Lb = Math.max(LMIN, need, Lb * 0.7); }
    fitPatrol();
  }
  function fitPatrol() {
    const m = STEER_MARGIN * Lb; steerE.rx = avoid.rx + m; steerE.ry = avoid.ry + m;
    // the patrol: the largest ellipse in the free water (inside the viewport, clear of the steering ellipse), found by a coarse
    // search over centres and aspects, so any layout gets a circuit that never has to cross the text
    const inset = 0.15 * Lb, clear = 0.15 * Lb;
    const fits = (cx, cy, a, asp) => { const b = a * asp; if (cx - a < inset || cx + a > W - inset || cy - b < inset || cy + b > H - inset) return false;
      for (let q = 0; q < 48; q++) { const th = q / 48 * Math.PI * 2, x = cx + a * Math.cos(th), y2 = cy + b * Math.sin(th); const ex = (x - avoid.cx) / (steerE.rx + clear), ey = (y2 - avoid.cy) / (steerE.ry + clear); if (ex * ex + ey * ey < 1) return false; } return true; };
    let best = 0; patrol.cx = W / 2; patrol.cy = H / 2; patrol.a = patrol.b = 0.5 * Lb;
    for (const asp of [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2]) for (let j = 0; j <= 16; j++) for (let i = 0; i <= 24; i++) { const cx = W * i / 24, cy = H * j / 16; if (!fits(cx, cy, 1, asp)) continue;
      let lo = 1, hi = Math.max(W, H) / 2; for (let it = 0; it < 14; it++) { const mid = (lo + hi) / 2; if (fits(cx, cy, mid, asp)) lo = mid; else hi = mid; }
      const area = lo * lo * asp; if (area > best * 1.02) { best = area; patrol.cx = cx; patrol.cy = cy; patrol.a = lo; patrol.b = lo * asp; } }
    patrol.a = Math.max(0.5 * Lb, patrol.a); patrol.b = Math.max(0.5 * Lb, patrol.b);
    const { a, b } = patrol, hh = ((a - b) / (a + b)) ** 2; patrol.omega = Math.PI * 2 / PERIOD; patrol.per = Math.PI * (a + b) * (1 + 3 * hh / (10 + Math.sqrt(4 - 3 * hh)));
  }
  function sizeCanvases() {
    W = innerWidth; H = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [cv, fcv, ncv]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); fcx.setTransform(dpr, 0, 0, dpr, 0, 0); ncx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = W > 700 ? 14 : 11; fcell = Math.max(7, Math.round(cell * 0.62)); font = `500 ${cell * 0.82}px "JetBrains Mono", ui-monospace, monospace`; fontFar = `500 ${fcell * 0.82}px "JetBrains Mono", ui-monospace, monospace`;
    const nc = Math.floor(W / cell), nr = Math.floor(H / cell);
    if (nc !== cols || nr !== rows || !buf) { cols = nc; rows = nr; lit = new Float32Array(cols * rows); seeds = new Float32Array(cols * rows); for (let i = 0; i < seeds.length; i++) seeds[i] = rng(); buf = new Float32Array(cols * rows * 4); cand = new Uint16Array(cols * rows); candList = new Int32Array(cols * rows); cellKey = new Int16Array(cols * rows); cellGlyph = new Int16Array(cols * rows); cellChar = new Uint8Array(cols * rows); litList = new Int32Array(cols * rows); order = new Int32Array(cols * rows); off.width = cols; off.height = rows; glowImg = octx.createImageData(cols, rows); }
    gcv.width = Math.max(1, Math.floor(W / 4)); gcv.height = Math.max(1, Math.floor(H / 4));
    // the faint cell grid is painted once and blitted every frame
    gridCv.width = cv.width; gridCv.height = cv.height; const g = gridCv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.strokeStyle = 'rgba(159,179,200,.055)'; g.lineWidth = 1; g.beginPath();
    for (let c = 0; c <= cols; c++) { g.moveTo(c * cell + 0.5, 0); g.lineTo(c * cell + 0.5, rows * cell); } for (let r = 0; r <= rows; r++) { g.moveTo(0, r * cell + 0.5); g.lineTo(cols * cell, r * cell + 0.5); } g.stroke();
  }

  // ---- the koi: a heading and a speed, a sim spine behind the head, and the render spine with the wave on it ----
  const koi = [];
  function spawn() {
    koi.length = 0;
    for (let id = 0; id < SIZES.length; id++) {
      const k = { id, size: SIZES[id], dir: id % 2 ? -1 : 1, nodes: new Float32Array(N * 2), rs: new Float32Array(N * 2), arc: new Float32Array(N), seg: new Float32Array(N * 3), fin: new Float32Array(16),
        heading: 0, speed: 0, cruise: 1, turn: 0, phase: rng() * Math.PI * 2, wander: (rng() - 0.5) * 0.6, breathe: rng() * 6.28, ring: RINGS[id] * (0.88 + 0.06 * rng()), L: 1, dim: 1 - (1 - SIZES[id]) * 1.2, prog: 0, t0: 0, lapLast: 0, ffSpeed: 0, cruiseRef: 1, laps: [], minE: Infinity, runMinE: Infinity };
      koi.push(k);
    }
    fitKoi(true);
  }
  // lengths and speeds from the viewport; on the first layout each koi starts on the patrol, clear of the steering ellipse
  function fitKoi(fresh) {
    for (const k of koi) {
      const L = Lb * k.size; const ratio = k.L ? L / k.L : 1; k.L = L;
      k.cruiseRef = patrol.per * k.ring / PERIOD; k.cruise = k.cruiseRef * (0.8 + 0.25 * k.size); // speed from length around the speed the koi's ring needs
      if (fresh) {
        let th = k.id * Math.PI * 2 / koi.length + (rng() - 0.5) * 0.8, x = 0, y = 0, h = 0;
        for (let tries = 0; tries < 64; tries++, th += 0.2) {
          x = patrol.cx + patrol.a * k.ring * Math.cos(th); y = patrol.cy + patrol.b * k.ring * Math.sin(th); h = Math.atan2(patrol.b * Math.cos(th) * k.dir, -patrol.a * Math.sin(th) * k.dir);
          let ok = true; for (let i = 0; i < N && ok; i++) { const px = x - Math.cos(h) * L * i / (N - 1), py = y - Math.sin(h) * L * i / (N - 1); const ex = (px - avoid.cx) / steerE.rx, ey = (py - avoid.cy) / steerE.ry; if (ex * ex + ey * ey < 1) ok = false; }
          if (ok) break;
        }
        k.heading = h; k.speed = k.cruise; k.prog = 0; k.t0 = time; k.lapLast = Math.atan2((y - patrol.cy) / patrol.b, (x - patrol.cx) / patrol.a);
        for (let i = 0; i < N; i++) { k.nodes[i * 2] = x - Math.cos(h) * L * i / (N - 1); k.nodes[i * 2 + 1] = y - Math.sin(h) * L * i / (N - 1); }
      } else if (ratio !== 1) {
        const hx = clamp(k.nodes[0], 0, W), hy = clamp(k.nodes[1], 0, H); const dx = hx - k.nodes[0], dy = hy - k.nodes[1];
        for (let i = 0; i < N; i++) { k.nodes[i * 2] = hx + (k.nodes[i * 2] + dx - hx) * ratio; k.nodes[i * 2 + 1] = hy + (k.nodes[i * 2 + 1] + dy - hy) * ratio; }
      }
    }
    koi.sort((p, q) => p.size - q.size); // smaller, farther koi draw first
  }

  let time = 0;
  function steer(k, dt) {
    const L = k.L, n = k.nodes, hx = n[0], hy = n[1];
    let dx = Math.cos(k.heading), dy = Math.sin(k.heading); // momentum
    // wander: a bounded random walk on the steering angle
    k.wander = clamp(k.wander + (rng() - 0.5) * dt * 2.4, -1, 1); dx += Math.cos(k.heading + k.wander) * 0.35; dy += Math.sin(k.heading + k.wander) * 0.35;
    // patrol: a lazy circuit of the free water on the koi's own ring, tangent plus a pull back to the ring;
    // the ring breathes over about two minutes
    { const br = k.ring * (1 + 0.06 * Math.sin(time * 0.05 + k.breathe)); const nx = (hx - patrol.cx) / (patrol.a * br), ny = (hy - patrol.cy) / (patrol.b * br); const r = Math.hypot(nx, ny) || 1e-6;
      let tx = -patrol.a * ny * k.dir, ty = patrol.b * nx * k.dir; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      k.ffSpeed = patrol.omega * br * tl / r; // the speed that takes PERIOD for a circuit of this ring, at this point on it
      let ox = nx / patrol.a, oy = ny / patrol.b; const ol = Math.hypot(ox, oy) || 1; ox /= ol; oy /= ol; const radial = clamp((1 - r) * 1.5, -1.5, 1) * 0.9; const along = clamp(1.8 - r, 0.25, 1); // well off the ring, the way back wins over the way round
      dx += (tx * along + ox * radial) * 0.8; dy += (ty * along + oy * radial) * 0.8;
      // laps: the head's angle around the patrol centre, unwrapped
      const a = Math.atan2(ny, nx); k.prog += angleDiff(k.lapLast, a) * k.dir; k.lapLast = a; if (k.prog >= Math.PI * 2 * (k.laps.length + 1)) k.laps.push(time); }
    // no separation rule (ascii-sharks has one): each koi keeps its own ring, and where two cross the smaller passes beneath;
    // pushing them apart made the koi on the counter-turning ring spin in circles
    // keep the headline clear: a soft elliptical no-swim zone, tested at the head and a little ahead of it
    let danger = 0;
    for (let ai = 0; ai < AHEAD.length; ai++) { const ahead = AHEAD[ai]; const px = hx + Math.cos(k.heading) * L * ahead, py = hy + Math.sin(k.heading) * L * ahead; const ex = (px - avoid.cx) / steerE.rx, ey = (py - avoid.cy) / steerE.ry; const e2 = ex * ex + ey * ey;
      if (e2 < 1) { const e = Math.sqrt(e2) || 1e-3; let gx = ex / steerE.rx, gy = ey / steerE.ry; const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl; const w = (1 - e) * 8 + 1; dx += gx * w; dy += gy * w; danger = Math.max(danger, 1 - e); } }
    // near the text the koi stops wandering, so the push wins
    if (danger > 0) k.wander *= 1 - Math.min(1, dt * 2);
    // turn back once the head nears the frame, toward the patrol centre
    { const over = Math.max(-hx, hx - W, -hy, hy - H); if (over > -L * 0.1) { const w = clamp((over + L * 0.1) / (L * 0.35), 0, 1) * 3.5; const tx = patrol.cx - hx, ty = patrol.cy - hy; const d = Math.hypot(tx, ty) || 1; dx += tx / d * w; dy += ty / d * w; } }
    const desired = Math.atan2(dy, dx);
    // a koi can't pivot on the spot: the turning circle is a fraction of the body, the rate is capped low; tighter near the text
    const agility = Math.min(TURN_CAP, k.speed / (L * (danger > 0 ? 0.12 : 0.22)));
    const maxTurn = agility * dt; let turned = clamp(angleDiff(k.heading, desired), -maxTurn, maxTurn);
    k.heading += turned;
    // the wall: at the steering ellipse the head may not swim inward, it slides along; the body follows the head's path, and
    // the margin covers the chord a body length cuts on the ellipse's tightest curve, the wave and the fins
    { const ex = (hx - avoid.cx) / steerE.rx, ey = (hy - avoid.cy) / steerE.ry; if (ex * ex + ey * ey < 1) { let gx = ex / steerE.rx, gy = ey / steerE.ry; const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
      const cx = Math.cos(k.heading), cy = Math.sin(k.heading), into = cx * gx + cy * gy; if (into < 0) { const before = k.heading; k.heading = Math.atan2(cy - into * gy, cx - into * gx); turned += angleDiff(before, k.heading); } } }
    k.turn += (turned / dt - k.turn) * Math.min(1, dt * 3);
    // pace: a phase lock on the patrol; a koi behind its schedule (one circuit per PERIOD) swims a little faster, one ahead slower,
    // so detours never add up
    const pace = clamp(1 + 1.2 * (patrol.omega * (time - k.t0) - k.prog) / (Math.PI * 2), 0.8, 1.3);
    k.speed += (k.ffSpeed * (k.cruise / k.cruiseRef) * pace - k.speed) * Math.min(1, dt * 1.1);
    k.phase += dt * Math.PI * 2 * (0.16 + 3.2 * k.speed / L); // the tail beat quickens with speed
    n[0] += Math.cos(k.heading) * k.speed * dt; n[1] += Math.sin(k.heading) * k.speed * dt;
    // follow-the-leader spine with a bend limit per joint: a C at most, never folded
    const seg = L / (N - 1); let prev = k.heading + Math.PI;
    for (let i = 1; i < N; i++) { const px = n[(i - 1) * 2], py = n[(i - 1) * 2 + 1]; let a = Math.atan2(n[i * 2 + 1] - py, n[i * 2] - px); a = prev + clamp(angleDiff(prev, a), -MAX_BEND, MAX_BEND); n[i * 2] = px + Math.cos(a) * seg; n[i * 2 + 1] = py + Math.sin(a) * seg; prev = a; }
  }
  const plankton = []; for (let i = 0; i < 40; i++) plankton.push({ u: rng(), v: rng(), sp: 0.003 + rng() * 0.008, ph: rng() * 7, z: rng() });
  function step(dt) {
    time += dt; for (const k of koi) steer(k, dt);
    for (const p of plankton) { if (p.z > 0.5) continue; p.v -= p.sp * dt; if (p.v < -0.02) { p.v = 1.02; p.u = rng(); } }
  }

  // ---- rasteriser: every cell near a koi is sampled five times against the bent photo; the result is an RGBA cell buffer ----
  const SUB = [0, 0, -0.25, -0.25, 0.25, -0.25, -0.25, 0.25, 0.25, 0.25];
  let pr = 0, pg = 0, pb = 0, pa = 0; // scratch for one photo sample
  const fetchPx = (m, x, y) => { const ix = x | 0, iy = y | 0; if (x < 0 || y < 0 || ix >= m.w || iy >= m.h) { pa = 0; return; } const i = (iy * m.w + ix) * 4; pa = m.d[i + 3] / 255; pr = m.d[i]; pg = m.d[i + 1]; pb = m.d[i + 2]; };
  let worldMinE = Infinity, candGen = 0, cand = null, candList = null;
  function rasterKoi(k) {
    const L = k.L, n = k.nodes, rs = k.rs, arc = k.arc, sg = k.seg, fin = k.fin, sp = sprite;
    // the travelling wave on a copy of the spine: growing toward the tail, lagging head to tail, scaled by speed
    const swim = clamp(k.speed / k.cruise, 0.6, 1.4);
    for (let i = 0; i < N; i++) { const s = i / (N - 1), a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); let tx = n[a * 2] - n[b * 2], ty = n[a * 2 + 1] - n[b * 2 + 1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const off = L * WAVE_AMP * (0.1 + 0.9 * Math.pow(s, WAVE_POW)) * swim * Math.sin(k.phase - s * WAVE_LAG); rs[i * 2] = n[i * 2] - ty * off; rs[i * 2 + 1] = n[i * 2 + 1] + tx * off; }
    arc[0] = 0; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < N - 1; i++) { const dx = rs[i * 2 + 2] - rs[i * 2], dy = rs[i * 2 + 3] - rs[i * 2 + 1]; const l2 = dx * dx + dy * dy || 1e-6, l = Math.sqrt(l2); sg[i * 3] = dx; sg[i * 3 + 1] = dy; sg[i * 3 + 2] = l2; arc[i + 1] = arc[i] + l; }
    for (let i = 0; i < N; i++) { const x = rs[i * 2], y = rs[i * 2 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const total = arc[N - 1] || 1, k0 = sp.w0 / total; // sprite pixels per screen pixel
    // fins: each hangs on its hinge in the frame of the spine there; it spreads on the outside of a turn and folds on the inside
    const bank = clamp(k.turn * 1.4, -0.35, 0.35);
    for (let f = 0; f < 2; f++) { const F = sp.fins[f]; const u = 1 - F.hx / sp.w0; const at = u * total; let i = 0; while (i < N - 2 && arc[i + 1] < at) i++; const g = clamp((at - arc[i]) / ((arc[i + 1] - arc[i]) || 1), 0, 1);
      const qx = rs[i * 2] + sg[i * 3] * g, qy = rs[i * 2 + 1] + sg[i * 3 + 1] * g; const sl = Math.sqrt(sg[i * 3 + 2]); const tx = -sg[i * 3] / sl, ty = -sg[i * 3 + 1] / sl; // toward the head
      const nx = -ty, ny = tx; const lat = (F.hy - sp.h0 / 2) / k0 * WIDE; const outside = -F.side * bank; const flap = 0.07 * Math.sin(k.phase * 0.5 + f * 1.3);
      const th = -F.side * (outside * 0.55 + flap); const sc = 1 + outside * 0.7;
      fin[f * 8] = qx + nx * lat; fin[f * 8 + 1] = qy + ny * lat; fin[f * 8 + 2] = tx; fin[f * 8 + 3] = ty; fin[f * 8 + 4] = Math.cos(th); fin[f * 8 + 5] = Math.sin(th); fin[f * 8 + 6] = 1 / sc; }
    // which mip: about two sprite pixels between samples
    const spacing = k0 * cell * 0.5; let lv = 0; while (lv < sp.body.length - 1 && spacing / 2 ** (lv + 1) >= 1.5) lv++;
    const mb = sp.body[lv], mU = sp.fins[0].mips[Math.min(lv, sp.fins[0].mips.length - 1)], mL = sp.fins[1].mips[Math.min(lv, sp.fins[1].mips.length - 1)];
    // candidate cells: each segment stamps its box grown by the fin reach, so a diagonal koi does not scan its whole bounding box
    const reach = L * 0.27 * WIDE; candGen = (candGen + 1) & 0xffff || 1; let nc = 0;
    for (let i = 0; i < N - 1; i++) { const ax = rs[i * 2], ay = rs[i * 2 + 1], bx = rs[i * 2 + 2], by = rs[i * 2 + 3];
      const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach) / cell)), c1 = Math.min(cols - 1, Math.floor((Math.max(ax, bx) + reach) / cell)), r0 = Math.max(0, Math.floor((Math.min(ay, by) - reach) / cell)), r1 = Math.min(rows - 1, Math.floor((Math.max(ay, by) + reach) / cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const ci = r * cols + c; if (cand[ci] !== candGen) { cand[ci] = candGen; candList[nc++] = ci; } } }
    for (let ci = 0; ci < nc; ci++) {
      const cidx = candList[ci], r = (cidx / cols) | 0, c = cidx - r * cols;
      let sa = 0, sr = 0, sgc = 0, sb = 0, b0 = 0;
      for (let q = 0; q < 5; q++) {
        const px = (c + 0.5 + SUB[q * 2]) * cell, py = (r + 0.5 + SUB[q * 2 + 1]) * cell;
        // nearest segment of the render spine gives the arc position s and the signed offset v; the later samples of a cell
        // only look around the segment the first one found
        let best = Infinity, bi = 0, bt = 0; const i0 = q ? Math.max(0, b0 - 2) : 0, i1 = q ? Math.min(N - 2, b0 + 2) : N - 2;
        for (let i = i0; i <= i1; i++) { const ax = px - rs[i * 2], ay = py - rs[i * 2 + 1]; const t = (ax * sg[i * 3] + ay * sg[i * 3 + 1]) / sg[i * 3 + 2]; const tc = t < 0 ? 0 : t > 1 ? 1 : t; const ex = ax - sg[i * 3] * tc, ey = ay - sg[i * 3 + 1] * tc; const d = ex * ex + ey * ey; if (d < best) { best = d; bi = i; bt = t; } }
        if (q === 0) { if (best > reach * reach + cell * cell) break; b0 = bi; }
        const tcl = bt < 0 ? (bi === 0 ? bt : 0) : bt > 1 ? (bi === N - 2 ? bt : 1) : bt; const tq = bt < 0 ? 0 : bt > 1 ? 1 : bt;
        const sl = Math.sqrt(sg[bi * 3 + 2]); const s = (arc[bi] + tcl * sl) / total;
        const v = ((px - rs[bi * 2] - sg[bi * 3] * tq) * sg[bi * 3 + 1] - (py - rs[bi * 2 + 1] - sg[bi * 3 + 1] * tq) * sg[bi * 3]) / sl;
        // body over fins
        fetchPx(mb, (1 - s) * mb.w, mb.h / 2 + v * k0 / WIDE * mb.s); let a = pa, cr = pr * pa, cg = pg * pa, cb = pb * pa;
        if (a < 0.98) for (let f = 0; f < 2; f++) { const o = f * 8, hx = px - fin[o], hy = py - fin[o + 1]; const lu = (hx * fin[o + 2] + hy * fin[o + 3]) * k0, lv2 = (-hx * fin[o + 3] + hy * fin[o + 2]) * k0 / WIDE;
          const fu = (lu * fin[o + 4] + lv2 * fin[o + 5]) * fin[o + 6], fv = (-lu * fin[o + 5] + lv2 * fin[o + 4]) * fin[o + 6]; const m = f ? mL : mU, F = sp.fins[f];
          fetchPx(m, (F.hx + fu) * m.s, (F.hy + fv) * m.s); if (pa > 0) { const w = pa * (1 - a); cr += pr * w; cg += pg * w; cb += pb * w; a += w; } }
        if (a > 0) { sa += a; sr += cr; sgc += cg; sb += cb; if (a > 0.1) { const ex = (px - avoid.cx) / avoid.rx, ey = (py - avoid.cy) / avoid.ry; const e2 = ex * ex + ey * ey; if (e2 < k.minE) k.minE = e2; } }
      }
      if (sa <= 0) continue;
      // composite over the cell: dimmer for the smaller, farther koi
      const A = sa / 5 * k.dim, i4 = cidx * 4, da = buf[i4 + 3] * (1 - A), oa = A + da; const inv = 1 / sa;
      buf[i4] = (sr * inv * A + buf[i4] * da) / oa; buf[i4 + 1] = (sgc * inv * A + buf[i4 + 1] * da) / oa; buf[i4 + 2] = (sb * inv * A + buf[i4 + 2] * da) / oa; buf[i4 + 3] = oa;
    }
  }
  function raster() { buf.fill(0); for (const k of koi) { k.minE = Infinity; rasterKoi(k); if (k.minE < k.runMinE) k.runMinE = k.minE; if (k.minE < worldMinE) worldMinE = k.minE; } }

  // ---- tiles: squares light fast and fade slow, glyph by brightness, red channel = orange; colour strings built once ----
  const Q = 64; const table = (rgb) => { const t = []; for (let i = 0; i <= Q; i++) t.push(`rgba(${rgb},${(i / Q).toFixed(3)})`); return t; };
  const FILLS = [table('159,179,200'), table('240,138,96')]; // block: steel, orange
  const GLYPHS = [table('255,150,96'), table('214,118,74'), table('245,241,232'), table('204,214,226'), FILLS[0]]; // glyph: bright orange, orange, cream, pale, steel
  const NEAR = table('214,224,236'), FAR = table('204,214,226');
  const qa = (a) => (a <= 0 ? 0 : a >= 1 ? Q : (a * Q + 0.5) | 0);
  const mouse = { x: -9999, y: -9999 };
  let cellKey = null, cellGlyph = null, cellChar = null, litList = null, order = null; const counts = new Int32Array(GLYPHS.length * (Q + 1) + 1);
  // a counting sort of the lit cells by colour key, so each colour sets fillStyle once (ascii-sharks buckets its dots the same way)
  function bucket(keys, n, nk) { counts.fill(0, 0, nk + 1); for (let j = 0; j < n; j++) { const k = keys[litList[j]]; if (k >= 0) counts[k + 1]++; } for (let k = 0; k < nk; k++) counts[k + 1] += counts[k]; let m = 0; for (let j = 0; j < n; j++) { const k = keys[litList[j]]; if (k >= 0) { order[counts[k]++] = litList[j]; m++; } } return m; }
  function tiles(t, appear) {
    const g = ctx, cs = cell; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(gridCv, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    let n = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, i4 = i * 4; const A = buf[i4 + 3], R = buf[i4], G = buf[i4 + 1], B = buf[i4 + 2]; const prev = lit[i]; if (A === 0 && prev === 0 && seeds[i] <= 0.9985) continue;
      const Y = (0.3 * R + 0.59 * G + 0.11 * B) / 255; const target = Math.min(1, A * (0.8 + 0.35 * Y)); const seed = seeds[i];
      const red = A > 0.15 && R > 120 && R > G * 1.25 && R > B * 1.5; const nv = target > prev ? prev + (target - prev) * 0.5 : prev * 0.91; lit[i] = nv < 0.012 ? 0 : nv; const v0 = lit[i];
      if (v0 < 0.05) { if (seed > 0.9985) { g.fillStyle = FILLS[0][qa(0.16 + 0.12 * Math.sin(t + seed * 50))]; g.fillRect(c * cs + cs * 0.2, r * cs + cs * 0.5, cs * 0.6, 1); } continue; }
      const x = c * cs, y = r * cs; const mx = mouse.x - x - cs / 2, my = mouse.y - y - cs / 2; const dm2 = mx * mx + my * my; const boost = dm2 < 12100 ? (1 - Math.sqrt(dm2) / 110) * 0.4 : 0;
      const twk = Math.sin(t * (1.5 + seed * 2.5) + seed * 60) * 0.08; const v = Math.max(0.02, Math.min(1, v0 + boost + twk));
      const tick = Math.floor(t * (0.8 + seed * 1.6) + seed * 97); const jit = ((tick * 7919 + Math.floor(seed * 1e4)) % 5) - 2;
      cellChar[i] = Math.max(0, Math.min(RAMP.length - 1, Math.floor(v * (RAMP.length - 1)) + (Math.abs(jit) === 2 ? 0 : jit)));
      cellKey[i] = red ? (Q + 1) + qa((0.12 + v * 0.34) * appear) : qa((0.06 + v * 0.3) * appear);
      cellGlyph[i] = v > 0.12 ? (red ? (v > 0.55 ? 0 : 1) : v > 0.8 ? 2 : v > 0.45 ? 3 : 4) * (Q + 1) + qa((0.3 + v * 0.7) * appear) : -1;
      litList[n++] = i;
    }
    let m = bucket(cellKey, n, 2 * (Q + 1)), key = -1;
    for (let j = 0; j < m; j++) { const i = order[j], k = cellKey[i]; if (k !== key) { key = k; g.fillStyle = FILLS[(k / (Q + 1)) | 0][k % (Q + 1)]; } const r = (i / cols) | 0, c = i - r * cols; g.fillRect(c * cs + 1, r * cs + 1, cs - 1, cs - 1); }
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    m = bucket(cellGlyph, n, GLYPHS.length * (Q + 1)); key = -1;
    for (let j = 0; j < m; j++) { const i = order[j], k = cellGlyph[i]; if (k !== key) { key = k; g.fillStyle = GLYPHS[(k / (Q + 1)) | 0][k % (Q + 1)]; } const r = (i / cols) | 0, c = i - r * cols; g.fillText(RAMP[cellChar[i]], c * cs + cs / 2, r * cs + cs / 2 + 0.5); }
  }
  function draw() {
    const t = time; const appear = reduce ? 1 : clamp((t - 0.3) / 1.6, 0, 1);
    raster(); tiles(t, appear);
    // the glow: the koi's cells, blurred by CSS and tinted
    const d = glowImg.data; for (let i = 0, j = 0; i < d.length; i += 4, j += 4) { d[i] = buf[j]; d[i + 1] = buf[j + 1]; d[i + 2] = buf[j + 2]; d[i + 3] = buf[j + 3] * 255; } octx.putImageData(glowImg, 0, 0);
    gctx.globalCompositeOperation = 'source-over'; gctx.clearRect(0, 0, gcv.width, gcv.height); gctx.imageSmoothingEnabled = true; gctx.drawImage(off, 0, 0, gcv.width, gcv.height); gctx.globalCompositeOperation = 'source-in'; gctx.fillStyle = 'rgba(135,160,205,0.9)'; gctx.fillRect(0, 0, gcv.width, gcv.height);
    // far motes on the fine grid, near motes drifting up; no parallax (docs/DESIGN.md)
    fcx.clearRect(0, 0, W, H); fcx.font = fontFar; fcx.textAlign = 'center'; fcx.textBaseline = 'middle';
    for (const p of plankton) { if (p.z > 0.5) continue; const x = Math.floor((p.u * W + Math.sin(t + p.ph) * 6) / fcell) * fcell, y = Math.floor(p.v * H / fcell) * fcell; const a = (0.3 + 0.25 * Math.sin(t * 1.1 + p.ph) ** 2) * appear; fcx.fillStyle = FAR[qa(a * 0.5)]; fcx.fillRect(x + 1, y + 1, fcell - 1, fcell - 1); fcx.fillStyle = FAR[qa(a)]; fcx.fillText('.', x + fcell / 2, y + fcell / 2); }
    ncx.clearRect(0, 0, W, H);
    for (const p of plankton) { if (p.z <= 0.5) continue; const x = p.u * W + Math.sin(t * 0.7 + p.ph) * 9, y = ((p.v + t * p.sp * 0.5) % 1.04 - 0.02) * H; ncx.fillStyle = NEAR[qa((0.25 + 0.35 * Math.sin(t * 1.3 + p.ph) ** 2) * appear)]; ncx.fillRect(Math.round(x), Math.round(H - y), cell * 0.8, cell * 0.8); }
  }

  // ---- the loop: fixed steps from an accumulator, one draw per animation frame; idle off screen, still under reduced motion ----
  let raf = 0, last = 0, acc = 0, frames = 0, stillFrames = 0, heroOn = true, ready = false, held = false; const FT = new Float32Array(600); let ftN = 0;
  const idle = () => document.hidden || !heroOn;
  const want = () => ready && !held && !idle() && !(reduce && stillFrames >= 30);
  function schedule() { window.__koiIdle = idle(); if (!want()) { if (raf) cancelAnimationFrame(raf); raf = 0; return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0; const t0 = performance.now();
    if (!reduce) { acc += Math.min(0.1, Math.max(0, now - last) / 1000); let s = 0; while (acc >= STEP && s < MAX_STEPS) { step(STEP); acc -= STEP; s++; } if (s === MAX_STEPS) acc = 0; }
    last = now; draw(); frames++; if (reduce) stillFrames++;
    FT[ftN % FT.length] = performance.now() - t0; ftN++;
    if (want()) raf = requestAnimationFrame(frame); else schedule();
  }
  function onLayout() {
    sizeCanvases(); measure(); if (!sprite) return;
    if (!ready) { spawn(); ready = true; if (reduce) for (let i = 0; i < 240; i++) step(STEP); } else fitKoi(false);
    stillFrames = 0; acc = 0; schedule();
  }
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => onLayout()); ro.observe(document.documentElement); if (avoidEl !== hero) ro.observe(avoidEl); } else addEventListener('resize', onLayout);
  if ('IntersectionObserver' in window && hero) new IntersectionObserver((es) => { heroOn = es[es.length - 1].isIntersecting; schedule(); }).observe(hero);
  document.addEventListener('visibilitychange', schedule);
  mq.addEventListener?.('change', () => { reduce = mq.matches; stillFrames = 0; schedule(); });
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true }); document.documentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
  sizeCanvases(); measure(); window.__koiIdle = idle();

  // a small handle for the headless checks: the seed, the measured ellipses, a fast-forward that rasterises every step, frame times
  window.__koi = {
    seed, get ready() { return ready; }, get running() { return !!raf; }, get frames() { return frames; }, get time() { return time; },
    layout: () => ({ W, H, cell, Lb, avoid: { ...avoid }, steer: { ...steerE }, patrol: { ...patrol }, koi: koi.map((k) => ({ id: k.id, size: k.size, ring: k.ring, L: k.L, cruise: k.cruise, dim: k.dim, dir: k.dir })) }),
    sim(seconds) { worldMinE = Infinity; for (const k of koi) k.runMinE = Infinity; const n = Math.round(seconds / STEP); for (let i = 0; i < n; i++) { step(STEP); raster(); } return { minE: worldMinE, time, koi: koi.map((k) => ({ id: k.id, minE: k.runMinE, head: [Math.round(k.nodes[0]), Math.round(k.nodes[1])], laps: k.laps.slice() })) }; },
    frameMs() { const n = Math.min(ftN, FT.length); let s = 0; for (let i = 0; i < n; i++) s += FT[i]; return { n, avg: n ? s / n : 0 }; },
    resetFrameMs() { ftN = 0; },
    // hold the loop and advance by fixed steps, drawing each one as the loop would (for the frame strip)
    hold(on) { held = !!on; schedule(); }, advance(seconds) { const n = Math.round(seconds / STEP); for (let i = 0; i < n; i++) { step(STEP); draw(); frames++; } return time; },
  };
})();
