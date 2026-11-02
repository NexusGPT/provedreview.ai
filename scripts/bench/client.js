// The Benchmark page in the browser: reads the inlined data, keeps sort, filter and open rows in the URL,
// redraws with benchView (scripts/bench/view.js). The static page already holds the loaded state; this only reacts.
// ?state=loading and ?state=error show those two states on demand (the data is inlined, so neither occurs on its own
// unless the inlined data fails to parse, which shows the error state for real).
(() => {
  document.documentElement.classList.add('js');
  const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  let DATA = null, OPT = {};
  try {
    DATA = JSON.parse($('#lb-data').textContent);
    OPT = JSON.parse($('#lb-opt').textContent);
    if (!DATA || !Array.isArray(DATA.rows) || !DATA.rows.length) throw new Error('no rows');
  } catch (e) { DATA = null; }

  const retry = () => { location.href = location.pathname; };
  document.addEventListener('click', ev => { if (ev.target.closest('[data-retry]')) retry(); });

  // the sections below the table rise in once, as on Home
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv').forEach(s => io.observe(s));
  } else document.querySelectorAll('.rv').forEach(s => s.classList.add('in'));

  if (!DATA) {
    // no view without data: the static head stays, every control goes inert, the body names the file
    $('.tbl').innerHTML = $('.tbl .thr').outerHTML + benchErrorHtml();
    document.querySelectorAll('.bar button, .bar select').forEach(b => { b.disabled = true; });
    $('.bar .cnt').innerHTML = '<u>no rows</u>';
    $('.tfoot').innerHTML = '';
    return;
  }

  const V = benchView(DATA, OPT);
  const st = V.newState();
  const forced = ['loading', 'error'].includes(q.get('state')) ? q.get('state') : null;
  const has = new Set(V.ROWS.map(r => r.id));
  q.getAll('system').forEach(v => { if (V.ROWS.some(r => r.system === v)) st.sys.add(v); });
  q.getAll('by').forEach(v => { if (V.ROWS.some(r => r.measured_by === v)) st.by.add(v); });
  if (V.KEYS[q.get('sort')]) st.sort = { key: q.get('sort'), dir: q.get('dir') === 'asc' || q.get('dir') === 'desc' ? q.get('dir') : V.KEYS[q.get('sort')].first };
  (q.get('open') || '').split(',').forEach(id => { if (has.has(id)) st.open.add(id); });

  const sync = () => {
    if (forced) return;
    const p = new URLSearchParams();
    st.sys.forEach(v => p.append('system', v));
    st.by.forEach(v => p.append('by', v));
    if (st.sort.key !== 'f1' || st.sort.dir !== 'desc') { p.set('sort', st.sort.key); if (st.sort.dir !== V.KEYS[st.sort.key].first) p.set('dir', st.sort.dir); }
    if (st.open.size) p.set('open', [...st.open].join(','));
    const s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  };
  const draw = () => {
    $('.barh').innerHTML = V.barHtml(st, forced);
    $('.tbl').innerHTML = V.headHtml(st) + V.bodyHtml(st, forced);
    $('.tfoot').innerHTML = V.tfootHtml(forced);
    sync();
  };
  if (forced || q.toString()) draw();

  const toggle = id => {
    const tr = document.querySelector(`.tr[data-id="${CSS.escape(id)}"]`);
    if (!tr) return;
    const on = !st.open.has(id);
    on ? st.open.add(id) : st.open.delete(id);
    tr.classList.toggle('open', on);
    tr.querySelector('.row').setAttribute('aria-expanded', on);
    tr.querySelector('.det').inert = !on;
    sync();
  };

  document.addEventListener('click', ev => {
    const t = ev.target;
    if (!t.closest('main')) return;
    const cp = t.closest('[data-copy]');
    if (cp) { if (navigator.clipboard) navigator.clipboard.writeText(cp.dataset.copy).catch(() => {}); cp.textContent = 'Copied'; setTimeout(() => { cp.textContent = 'Copy'; }, 1400); return; }
    const h = t.closest('[data-sort]');
    if (h) { const k = h.dataset.sort; st.sort = st.sort.key === k ? { key: k, dir: st.sort.dir === 'desc' ? 'asc' : 'desc' } : { key: k, dir: V.KEYS[k].first }; draw(); return; }
    const ch = t.closest('.chip');
    if (ch && !ch.disabled) { const set = st[ch.dataset.f], v = ch.dataset.v; set.has(v) ? set.delete(v) : set.add(v); draw(); return; }
    if (t.closest('[data-reset]')) { st.sys.clear(); st.by.clear(); draw(); return; }
    if (t.closest('[data-sheet]')) { st.sheet = !st.sheet; draw(); return; }
    const row = t.closest('.tr[data-id] > .row');
    if (row) toggle(row.parentElement.dataset.id);
  });
  document.addEventListener('change', ev => {
    if (ev.target.matches('[data-sortsel]')) { const k = ev.target.value; st.sort = { key: k, dir: V.KEYS[k].first }; draw(); }
  });
})();
