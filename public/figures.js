// One small static figure per section, lit in the hero's squares: the engine's tile pass (engine.js `tiles`) without time,
// pointer or fade. Same glyph ramp, same steel and orange, same 1 px inset fill; a shape is drawn into a cell-sized buffer,
// and each lit cell becomes a square. Low density: only cells whose coverage passes a seeded threshold light.
(() => {
  const RAMP = " .`':;-,~=+oxt%SXO8#@";
  // a seeded hash per cell, so a figure is the same on every load
  const seed = (c, r, k) => { let h = (c * 374761393 + r * 668265263 + k * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  // shapes are drawn in a 0..1 box; white is steel, red (#ff0000) is the orange witness channel, green is the proof channel
  const SHAPES = {
    // use cases: a branch graph, the candidate commit in orange
    branch(g, w, h) {
      g.lineWidth = h * 0.07; g.strokeStyle = '#fff'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(w * 0.06, h * 0.72); g.lineTo(w * 0.94, h * 0.72); g.stroke();
      g.beginPath(); g.moveTo(w * 0.30, h * 0.72); g.bezierCurveTo(w * 0.42, h * 0.72, w * 0.40, h * 0.26, w * 0.54, h * 0.26); g.lineTo(w * 0.74, h * 0.26); g.stroke();
      const dot = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(w * x, h * y, h * r, 0, 7); g.fill(); };
      dot(0.12, 0.72, 0.11, '#fff'); dot(0.30, 0.72, 0.11, '#fff'); dot(0.62, 0.72, 0.11, '#fff'); dot(0.88, 0.72, 0.11, '#fff'); dot(0.54, 0.26, 0.11, '#fff'); dot(0.76, 0.26, 0.13, '#ff0000');
    },
    // core features: a balance, parent and candidate level
    scale(g, w, h) {
      g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = h * 0.06; g.lineCap = 'round';
      g.beginPath(); g.moveTo(w * 0.5, h * 0.14); g.lineTo(w * 0.5, h * 0.86); g.stroke();
      g.beginPath(); g.moveTo(w * 0.36, h * 0.88); g.lineTo(w * 0.64, h * 0.88); g.stroke();
      g.beginPath(); g.moveTo(w * 0.16, h * 0.24); g.lineTo(w * 0.84, h * 0.24); g.stroke();
      for (const x of [0.16, 0.84]) { g.lineWidth = h * 0.035; g.beginPath(); g.moveTo(w * x, h * 0.24); g.lineTo(w * (x - 0.1), h * 0.58); g.moveTo(w * x, h * 0.24); g.lineTo(w * (x + 0.1), h * 0.58); g.stroke();
        g.beginPath(); g.ellipse(w * x, h * 0.6, w * 0.12, h * 0.07, 0, 0, Math.PI); g.fill(); }
      g.beginPath(); g.arc(w * 0.5, h * 0.14, h * 0.07, 0, 7); g.fill();
    },
    // open benchmark: a dial with its needle
    dial(g, w, h) {
      g.strokeStyle = '#fff'; g.lineWidth = h * 0.06; const cx = w * 0.5, cy = h * 0.82, r = h * 0.62;
      g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.stroke();
      for (let i = 0; i <= 8; i++) { const a = Math.PI + Math.PI * i / 8; g.lineWidth = h * 0.04; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); g.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92); g.stroke(); }
      g.strokeStyle = '#ff0000'; g.lineWidth = h * 0.07; const a = Math.PI * 1.7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, h * 0.08, 0, 7); g.fill();
    },
    // quick start: a terminal with its prompt
    term(g, w, h) {
      g.strokeStyle = '#fff'; g.lineWidth = h * 0.06; g.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
      g.fillStyle = '#fff'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.12);
      g.lineWidth = h * 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * 0.2, h * 0.38); g.lineTo(w * 0.3, h * 0.5); g.lineTo(w * 0.2, h * 0.62); g.stroke();
      g.fillStyle = '#ff0000'; g.fillRect(w * 0.36, h * 0.58, w * 0.12, h * 0.07);
    },
    // the paper: a page with a folded corner and its lines
    page(g, w, h) {
      g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = h * 0.05;
      const x0 = w * 0.3, x1 = w * 0.7, y0 = h * 0.08, y1 = h * 0.92, f = h * 0.18;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - f, y0); g.lineTo(x1, y0 + f); g.lineTo(x1, y1); g.lineTo(x0, y1); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(x1 - f, y0); g.lineTo(x1 - f, y0 + f); g.lineTo(x1, y0 + f); g.fill();
      g.lineWidth = h * 0.035; for (let i = 0; i < 6; i++) { const y = h * (0.36 + i * 0.09); g.beginPath(); g.moveTo(x0 + w * 0.05, y); g.lineTo(x1 - w * (i % 3 === 2 ? 0.14 : 0.05), y); g.stroke(); }
    },
  };
  function draw(cv) {
    const shape = SHAPES[cv.dataset.fig]; if (!shape) return;
    const cs = 14, dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const cols = Math.floor(W / cs), rows = Math.floor(H / cs);
    cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // the shape at 4x the cell grid, averaged down to one value per cell
    const S = 4, off = document.createElement('canvas'); off.width = cols * S; off.height = rows * S; const o = off.getContext('2d', { willReadFrequently: true });
    shape(o, off.width, off.height); const px = o.getImageData(0, 0, off.width, off.height).data;
    const ox = Math.floor((W - cols * cs) / 2), oy = Math.floor((H - rows * cs) / 2);
    g.font = `500 ${cs * 0.82}px "JetBrains Mono", ui-monospace, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let A = 0, R = 0, G = 0, B = 0;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = ((r * S + y) * off.width + c * S + x) * 4; const a = px[i + 3] / 255; A += a; R += px[i] * a; G += px[i + 1] * a; B += px[i + 2] * a; }
      const n = S * S; const cov = A / n; if (cov < 0.14) continue; R /= A; G /= A; B /= A;
      const k = seed(c, r, 7); if (k > 0.6 + cov * 0.6) continue; // the low density: strokes only, and a seeded few of their faintest cells stay dark
      const red = R > 120 && R > G * 1.25 && R > B * 1.5; const Y = (0.3 * R + 0.59 * G + 0.11 * B) / 255; const v = Math.min(1, cov * (0.8 + 0.35 * Y)) * (0.75 + 0.25 * k);
      const x = ox + c * cs, y = oy + r * cs;
      g.fillStyle = red ? `rgba(240,138,96,${0.12 + v * 0.34})` : `rgba(159,179,200,${0.06 + v * 0.3})`; g.fillRect(x + 1, y + 1, cs - 1, cs - 1);
      const glyph = RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(v * (RAMP.length - 1))))];
      const col = red ? (v > 0.55 ? '255,150,96' : '214,118,74') : v > 0.8 ? '245,241,232' : v > 0.45 ? '204,214,226' : '159,179,200';
      if (v > 0.12) { g.fillStyle = `rgba(${col},${0.3 + v * 0.7})`; g.fillText(glyph, x + cs / 2, y + cs / 2 + 0.5); }
    }
  }
  const all = () => document.querySelectorAll('canvas[data-fig]').forEach(draw);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(all);
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(all, 150); });
})();
