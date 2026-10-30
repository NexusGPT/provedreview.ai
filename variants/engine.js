
(() => {
  const cv = document.getElementById('ascii'); const ctx = cv.getContext('2d'); const gcv = document.getElementById('glow'); const gctx = gcv.getContext('2d');
  const RAMP = " .`':;-,~=+oxt%SXO8#@"; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, dpr, cols, rows, cell = 14, t0 = performance.now(), mouse = { x: -9999, y: -9999 }, seeds, lit;
  const off = document.createElement('canvas'), octx = off.getContext('2d', { willReadFrequently: true });
  function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); gcv.width = Math.floor(W / 4); gcv.height = Math.floor(H / 4); cell = W > 700 ? 14 : 11; cols = Math.floor(W / cell); rows = Math.floor(H / cell); off.width = cols; off.height = rows; seeds = new Float32Array(cols * rows); lit = new Float32Array(cols * rows); for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random(); }
  const soft = (x, y, r, a) => { const g = octx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); octx.fillStyle = g; octx.beginPath(); octx.arc(x, y, r, 0, 7); octx.fill(); };
  // ---- the koi are the owner's photo, cut out. Each is sliced along its length and swum with a travelling wave ----
  const farOff = document.createElement('canvas'), fctx = farOff.getContext('2d', { willReadFrequently: true });
  const fcv = document.getElementById('far'), fcx = fcv.getContext('2d'); const ncv = document.getElementById('near'), ncx = ncv.getContext('2d');
  const world = document.createElement('canvas'), wctx = world.getContext('2d'); const farWorld = document.createElement('canvas'), fwctx = farWorld.getContext('2d');
  let fcols, frows, fcell, flit, fseeds; const WS = 0.5; // the world canvases run at half page resolution
  const sizeLayers = () => { fcell = Math.max(7, Math.round(cell * 0.62)); fcols = Math.floor(W / fcell); frows = Math.floor(H / fcell); farOff.width = fcols; farOff.height = frows; fcv.width = W * dpr; fcv.height = H * dpr; fcx.setTransform(dpr, 0, 0, dpr, 0, 0); ncv.width = W * dpr; ncv.height = H * dpr; ncx.setTransform(dpr, 0, 0, dpr, 0, 0); flit = new Float32Array(fcols * frows); fseeds = new Float32Array(fcols * frows); for (let i = 0; i < fseeds.length; i++) fseeds[i] = Math.random(); world.width = Math.floor(W * WS); world.height = Math.floor(H * WS); farWorld.width = world.width; farWorld.height = world.height; };
  // ---- a koi built from scratch: a chain of joints behind the head, a body from the photo's width profile, fins on joints ----
  const sprites = {}; let ready = 0; const NEED_ALL = 1; { const im = new Image(); im.onload = () => { ready++; }; im.src = '/public/koi-c.png'; sprites['koi-c'] = im; }
  // half width over the body length, u = 0 at the nose, 1 at the end of the caudal fin; measured on the photo and smoothed
  const BODY_END = 0.72;
  const HW = [[0, .045], [.04, .062], [.12, .082], [.22, .09], [.34, .084], [.46, .07], [.58, .052], [.66, .032], [.72, .014], [.80, .03], [.90, .062], [1.0, .105]];
  const halfWidth = (u) => { for (let i = 1; i < HW.length; i++) if (u <= HW[i][0]) { const [u0, w0] = HW[i - 1], [u1, w1] = HW[i]; const f = (u - u0) / (u1 - u0); return (w0 + (w1 - w0) * (0.5 - 0.5 * Math.cos(Math.PI * f))); } return HW[HW.length - 1][1]; };
  const lerpAng = (a, b, f) => { let d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * f; };
  const clampAng = (a, ref, lim) => { const d = Math.atan2(Math.sin(a - ref), Math.cos(a - ref)); return ref + Math.max(-lim, Math.min(lim, d)); };
  class Koi {
    constructor(o) { Object.assign(this, { N: 30, phase: 0, candidate: false }, o); this.joints = []; this.ang = []; this.inited = false; }
    update(t, hx, hy, hdir) {
      const L = this.L, N = this.N, d = L / N;
      if (!this.inited) { for (let i = 0; i <= N; i++) { this.joints.push([hx - Math.cos(hdir) * d * i, hy - Math.sin(hdir) * d * i]); this.ang.push(hdir); } this.inited = true; }
      this.joints[0] = [hx, hy]; this.ang[0] = hdir;
      const kick = 0.5 + 0.5 * Math.sin(t * 0.75 + this.phase);
      for (let i = 1; i <= N; i++) {
        const u = i / N; const p = this.joints[i], q = this.joints[i - 1];
        // where the joint already trails, the muscle wave it wants, and the bend a spine allows
        const follow = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const amp = (0.012 + 0.11 * u * u) * (0.8 + 0.5 * kick); const want = this.ang[i - 1] + Math.sin(t * 0.75 + this.phase - u * 4.6) * amp * 4;
        let a = lerpAng(follow, want, 0.22); a = clampAng(a, this.ang[i - 1], u > BODY_END ? 0.22 : 0.10);
        this.ang[i] = a; this.joints[i] = [q[0] - Math.cos(a) * d, q[1] - Math.sin(a) * d];
      }
      this.kick = kick;
    }
    // a point at (u, v): u along the spine, v across it in half-widths
    at(u, v) { const f = u * this.N; const i = Math.min(this.N - 1, Math.floor(f)); const g = f - i; const p = this.joints[i], q = this.joints[i + 1]; const a = lerpAng(this.ang[i], this.ang[i + 1], g); const x = p[0] + (q[0] - p[0]) * g, y = p[1] + (q[1] - p[1]) * g; const w = halfWidth(u) * this.L; return [x - Math.sin(a) * w * v, y + Math.cos(a) * w * v, a]; }
    draw(c, t, flare) {
      const L = this.L; const poly = (pts, fill) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); };
      const edge = (u0, u1, v, n) => { const o = []; for (let i = 0; i <= n; i++) { const u = u0 + (u1 - u0) * i / n; o.push(this.at(u, v)); } return o; };
      // the caudal fin: a translucent fan from the peduncle, forked at the end, flowing with the chain
      { const top = edge(BODY_END, 1.0, 1, 10), bot = edge(BODY_END, 1.0, -1, 10).reverse(); const tip = this.at(1.0, 0); const notch = this.at(0.92, 0);
        const fan = top.concat([[tip[0] - Math.cos(tip[2]) * 0.02 * L, tip[1] - Math.sin(tip[2]) * 0.02 * L], notch], bot); poly(fan, 'rgba(255,255,255,.64)');
        // rays
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = L * 0.004; for (const v of [-0.7, -0.35, 0, 0.35, 0.7]) { const r = edge(BODY_END, 0.98, v, 6); c.beginPath(); r.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } }
      // paired fins: pectoral behind the head, pelvic at mid body; leaves on their joints that beat, out of phase
      const leaf = (u, len, wid, spread, ph, alpha) => { for (const side of [-1, 1]) { const [bx, by, a] = this.at(u, 0.85 * side); const b = Math.sin(t * 0.6 + this.phase + ph + (side > 0 ? 0.7 : 0)); const flap = (b > 0 ? Math.pow(b, 0.7) * 0.55 : b * 0.22) * side; const ang = a + Math.PI - side * (Math.PI / 2 - spread) + flap;
        c.save(); c.translate(bx, by); c.rotate(ang); c.fillStyle = `rgba(255,255,255,${alpha})`; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -wid * side * 0.9, len, -wid * side * 0.1); c.quadraticCurveTo(len * 0.55, wid * side * 0.35, 0, 0); c.fill(); c.restore(); } };
      leaf(0.20, L * 0.24, L * 0.10, 0.5, 0, 0.62); leaf(0.50, L * 0.13, L * 0.055, 0.7, 1.6, 0.52);
      // the body: edges from the nose cap to the peduncle, a brighter core, the dorsal ridge
      { const top = edge(0.01, BODY_END, 1, 36), bot = edge(0.01, BODY_END, -1, 36).reverse(); const nose = this.at(0, 0); const cap = []; for (let i = 0; i <= 8; i++) { const a = nose[2] + Math.PI / 2 - Math.PI * i / 8; const r = halfWidth(0.01) * L; cap.push([nose[0] + Math.cos(a) * r, nose[1] + Math.sin(a) * r]); }
        poly(bot.concat(cap, top), 'rgba(255,255,255,.95)');
        const ct = edge(0.02, BODY_END - 0.02, 0.45, 30), cb = edge(0.02, BODY_END - 0.02, -0.45, 30).reverse(); poly(ct.concat(cb), 'rgba(255,255,255,.8)');
        c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = L * 0.006; const dr = edge(0.30, 0.64, 0, 10); c.beginPath(); dr.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
      // kohaku: orange patches in body coordinates, so they ride the bend; the candidate's saddle pulses with the flare
      const patch = (u0, u1, v0, v1, red) => { const pts = []; const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, ru = (u1 - u0) / 2, rv = (v1 - v0) / 2; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; const p = this.at(Math.max(0, Math.min(BODY_END, uc + Math.cos(a) * ru)), Math.max(-1, Math.min(1, vc + Math.sin(a) * rv))); pts.push(p); } poly(pts, red ? `rgba(255,0,0,${0.88 + 0.12 * flare})` : 'rgba(255,255,255,1)'); };
      patch(0.02, 0.15, -0.9, 0.55, true); patch(0.28, 0.50, -1, 0.25, true); patch(0.40, 0.58, 0.15, 1, this.candidate ? true : true); patch(0.60, 0.70, -0.8, 0.5, true);
      // eyes
      c.fillStyle = 'rgba(0,0,0,1)'; for (const side of [-1, 1]) { const [ex, ey] = this.at(0.07, 0.6 * side); c.beginPath(); c.arc(ex, ey, L * 0.012, 0, 7); c.fill(); }
    }
  }
  function swim(c, im, x, y, len, heading, t, phase, kick, mirror) {
    const K = 30; const sw = im.width / K; const scale = len / im.width; const h = im.height * scale;
    c.save(); c.translate(x, y); c.rotate(heading); if (mirror) c.scale(1, -1);
    for (let j = 0; j < K; j++) { const u = 1 - (j + 0.5) / K; const dy = Math.sin(t * 0.75 + phase - u * 5) * len * (0.01 + 0.09 * u * u) * (0.7 + 0.5 * kick); c.drawImage(im, j * sw, 0, sw + 1, im.height, -len / 2 + j * sw * scale, -h / 2 + dy, sw * scale + 0.8, h); }
    c.restore();
  }
  // the two koi circle the copy half a turn apart; the head leads along the orbit, the chain does the rest
  const KOI = [ { phase: 0.0, len: 0.50, rx: 0.30, ry: 0.33, dy: 0.04, speed: 0.042, candidate: false }, { phase: Math.PI, len: 0.47, rx: 0.30, ry: 0.33, dy: 0.04, speed: 0.042, candidate: true } ];
  const FAR = [ { sprite: 'koi-c', phase: 2.2, len: 0.30, rx: 0.46, ry: 0.28, dy: -0.06, speed: -0.03, mirror: true } ];
  const fish = new Map();
  function placeKoi(c, cw, ch, f, t, flare) {
    const th = t * f.speed + f.phase; const a = cw * f.rx, b = ch * f.ry, cx = cw / 2, cy = ch * (0.5 + f.dy);
    const x = cx + a * Math.cos(th), y = cy + b * Math.sin(th); const dir = Math.sign(f.speed) || 1;
    const heading = Math.atan2(b * Math.cos(th) * dir, -a * Math.sin(th) * dir);
    if (f.sprite) { const kick = 0.5 + 0.5 * Math.sin(t * 2.4 + f.phase); swim(c, sprites[f.sprite], x, y, ch * f.len, heading, t, f.phase, kick, f.mirror); return; }
    let k = fish.get(f); if (!k || k.L !== ch * f.len) { k = new Koi({ L: ch * f.len, phase: f.phase, candidate: f.candidate }); fish.set(f, k); }
    k.update(t, x, y, heading); k.draw(c, t, flare);
  }
  const plankton = Array.from({ length: 40 }, () => ({ u: Math.random(), v: Math.random(), sp: 0.003 + Math.random() * 0.008, ph: Math.random() * 7, z: Math.random() }));
  function drawWorld(t) {
    const ph = (t % 7); const flare = ph < 1.6 ? Math.sin(Math.PI * ph / 1.6) : 0;
    wctx.clearRect(0, 0, world.width, world.height); for (const f of KOI) placeKoi(wctx, world.width, world.height, f, t, flare);
    fwctx.clearRect(0, 0, farWorld.width, farWorld.height); for (const f of FAR) placeKoi(fwctx, farWorld.width, farWorld.height, f, t, 0);
    fwctx.fillStyle = 'rgba(255,255,255,.5)'; for (const p of plankton) { if (p.z > 0.5) continue; p.v -= p.sp * 0.016; if (p.v < -0.02) { p.v = 1.02; p.u = Math.random(); } fwctx.fillRect(p.u * farWorld.width + Math.sin(t + p.ph) * 3, p.v * farWorld.height, 3, 3); }
    octx.clearRect(0, 0, cols, rows); octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high'; octx.drawImage(world, 0, 0, cols, rows);
    fctx.clearRect(0, 0, fcols, frows); fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = 'high'; fctx.drawImage(farWorld, 0, 0, fcols, frows);
    return [octx.getImageData(0, 0, cols, rows).data, fctx.getImageData(0, 0, fcols, frows).data];
  }
  // one tile pass over a luminance buffer: squares light fast and fade slow; glyph by brightness; red channel = orange
  function tiles(g, lum, cw, ch, cs, litArr, seedArr, appear, t, strength, withGrid) {
    if (withGrid) { g.strokeStyle = 'rgba(159,179,200,.055)'; g.lineWidth = 1; g.beginPath(); for (let c = 0; c <= cw; c++) { g.moveTo(c * cs + 0.5, 0); g.lineTo(c * cs + 0.5, ch * cs); } for (let r = 0; r <= ch; r++) { g.moveTo(0, r * cs + 0.5); g.lineTo(cw * cs, r * cs + 0.5); } g.stroke(); }
    g.font = `500 ${cs * 0.82}px "JetBrains Mono", ui-monospace, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let r = 0; r < ch; r++) for (let c = 0; c < cw; c++) {
      const i = r * cw + c; const A = lum[i * 4 + 3] / 255; const R = lum[i * 4], G = lum[i * 4 + 1], B = lum[i * 4 + 2]; const Y = (0.3 * R + 0.59 * G + 0.11 * B) / 255; const target = Math.min(1, A * (0.8 + 0.35 * Y)); const seed = seedArr[i]; const red = A > 0.15 && R > 120 && R > G * 1.25 && R > B * 1.5;
      const prev = litArr[i]; const nv = target > prev ? prev + (target - prev) * 0.5 : prev * 0.91; litArr[i] = nv < 0.012 ? 0 : nv; const v0 = litArr[i];
      if (v0 < 0.05) { if (withGrid && seed > 0.9985) { g.fillStyle = `rgba(159,179,200,${0.16 + 0.12 * Math.sin(t + seed * 50)})`; g.fillRect(c * cs + cs * .2, r * cs + cs * .5, cs * .6, 1); } continue; }
      const x = c * cs, y = r * cs; const dm = Math.hypot(mouse.x - x - cs / 2, mouse.y - y - cs / 2); const boost = dm < 110 ? (1 - dm / 110) * 0.4 : 0;
      const twk = Math.sin(t * (1.5 + seed * 2.5) + seed * 60) * 0.08; const v = Math.max(0.02, Math.min(1, v0 + boost + twk)) * strength;
      const tick = Math.floor(t * (0.8 + seed * 1.6) + seed * 97); const jit = ((tick * 7919 + Math.floor(seed * 1e4)) % 5) - 2;
      const idx = Math.max(0, Math.min(RAMP.length - 1, Math.floor(v * (RAMP.length - 1)) + (Math.abs(jit) === 2 ? 0 : jit))); const glyph = RAMP[idx];
      const col = red ? (v > 0.55 ? '255,150,96' : '214,118,74') : v > 0.8 ? '245,241,232' : v > 0.45 ? '204,214,226' : '159,179,200';
      g.fillStyle = red ? `rgba(240,138,96,${(0.12 + v * 0.34) * appear})` : `rgba(159,179,200,${(0.06 + v * 0.3) * appear})`; g.fillRect(x + 1, y + 1, cs - 1, cs - 1);
      if (v > 0.12) { g.fillStyle = `rgba(${col},${(0.3 + v * 0.7) * appear})`; g.fillText(glyph, x + cs / 2, y + cs / 2 + 0.5); }
    }
  }
  const glassCv = document.getElementById('glass'), glx = glassCv.getContext('2d');
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function glass(t) {
    const el = document.getElementById('plate'); if (!el) return; const b = el.getBoundingClientRect(); const x = b.left, y = b.top, w = b.width, h = b.height, r = 24;
    if (glassCv.width !== W * dpr) { glassCv.width = W * dpr; glassCv.height = H * dpr; } glx.setTransform(dpr, 0, 0, dpr, 0, 0); glx.clearRect(0, 0, W, H);
    // shadow under the plate
    glx.save(); glx.shadowColor = 'rgba(0,0,0,.55)'; glx.shadowBlur = 60; glx.shadowOffsetY = 18; roundRect(glx, x, y, w, h, r); glx.fillStyle = 'rgba(10,12,16,.5)'; glx.fill(); glx.restore();
    // the scene through the glass: blurred and saturated, drawn from the tile canvases
    glx.save(); roundRect(glx, x, y, w, h, r); glx.clip();
    glx.filter = 'blur(12px) saturate(1.6) brightness(1.3)'; glx.drawImage(fcv, 0, 0, W, H); glx.drawImage(cv, 0, 0, W, H); glx.filter = 'none';
    // refraction at the rim: the scene re-drawn scaled about the plate centre inside an inner band, in three steps
    const cx = x + w / 2, cy = y + h / 2;
    for (const [band, sc, al] of [[26, 1.035, .55], [16, 1.07, .45], [7, 1.12, .4]]) {
      glx.save(); roundRect(glx, x, y, w, h, r); roundRect(glx, x + band, y + band, w - 2 * band, h - 2 * band, Math.max(2, r - band)); glx.clip('evenodd');
      glx.globalAlpha = al; glx.filter = 'blur(6px) saturate(1.6)'; glx.translate(cx, cy); glx.scale(sc, sc); glx.translate(-cx, -cy); glx.drawImage(cv, 0, 0, W, H); glx.restore();
    }
    // tint for legibility, then the light: a specular sweep along the top and a thin rim brighter on the lit side
    glx.fillStyle = 'rgba(9,10,14,.30)'; glx.fillRect(x, y, w, h);
    const sp = glx.createLinearGradient(x, y, x, y + 90); sp.addColorStop(0, 'rgba(255,255,255,.10)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); glx.fillStyle = sp; glx.fillRect(x, y, w, 90);
    const sweep = glx.createLinearGradient(x, y, x + w, y + h); const ph = (Math.sin(t * 0.25) + 1) / 2; sweep.addColorStop(Math.max(0, ph - 0.12), 'rgba(255,255,255,0)'); sweep.addColorStop(ph, 'rgba(255,255,255,.06)'); sweep.addColorStop(Math.min(1, ph + 0.12), 'rgba(255,255,255,0)'); glx.fillStyle = sweep; glx.fillRect(x, y, w, h);
    glx.restore();
    const rim = glx.createLinearGradient(x, y, x + w, y + h); rim.addColorStop(0, 'rgba(255,255,255,.55)'); rim.addColorStop(0.35, 'rgba(255,255,255,.14)'); rim.addColorStop(0.7, 'rgba(255,255,255,.08)'); rim.addColorStop(1, 'rgba(255,255,255,.3)');
    roundRect(glx, x + 0.5, y + 0.5, w - 1, h - 1, r); glx.strokeStyle = rim; glx.lineWidth = 1; glx.stroke();
    roundRect(glx, x + 1.5, y + 1.5, w - 3, h - 3, r - 1); glx.strokeStyle = 'rgba(0,0,0,.35)'; glx.lineWidth = 1; glx.stroke();
  }
  function frame(now) {
    if (ready < NEED_ALL) { t0 = now; requestAnimationFrame(frame); return; }
    const t = (now - t0) / 1000; const [lum, flum] = drawWorld(t);
    gctx.clearRect(0, 0, gcv.width, gcv.height); gctx.globalCompositeOperation = 'source-over'; gctx.imageSmoothingEnabled = true; gctx.drawImage(off, 0, 0, gcv.width, gcv.height); gctx.globalCompositeOperation = 'source-in'; gctx.fillStyle = 'rgba(135,160,205,0.9)'; gctx.fillRect(0, 0, gcv.width, gcv.height);
    const appear = reduce ? 1 : Math.min(1, Math.max(0, (t - 0.3) / 1.6));
    fcx.clearRect(0, 0, W, H); tiles(fcx, flum, fcols, frows, fcell, flit, fseeds, appear, t, 0.75, false);
    ctx.clearRect(0, 0, W, H); tiles(ctx, lum, cols, rows, cell, lit, seeds, appear, t, 1, true);
    // the near layer: a few bright squares drifting up, with parallax to the pointer
    ncx.clearRect(0, 0, W, H); const px = mouse.x > 0 ? (mouse.x / W - 0.5) * 24 : 0, py = mouse.y > 0 ? (mouse.y / H - 0.5) * 16 : 0;
    for (const p of plankton) { if (p.z <= 0.5) continue; const x = p.u * W + Math.sin(t * 0.7 + p.ph) * 9 - px * (p.z), y = ((p.v + t * p.sp * 0.5) % 1.04 - 0.02) * H - py * p.z; const al = 0.25 + 0.35 * Math.sin(t * 1.3 + p.ph) ** 2; ncx.fillStyle = `rgba(214,224,236,${al * appear})`; ncx.fillRect(Math.round(x), Math.round(H - y), cell * 0.8, cell * 0.8); }
    glass(t);
    requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { size(); sizeLayers(); }); addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }); addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
  size(); sizeLayers(); requestAnimationFrame(frame);
})();
