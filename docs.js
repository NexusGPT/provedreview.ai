// The docs pages' behaviour: the copy control, the phone menu, search (Pagefind, loaded on first use), the contents spark.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const base = new URL('.', document.currentScript.src).pathname; // the site root, SITE_BASE included

  // the sticky offsets follow the shared nav's real height (it wraps to two rows on the phone)
  const navh = () => document.documentElement.style.setProperty('--navh', ($('header.nav')?.offsetHeight || 61) + 'px');
  navh(); addEventListener('resize', navh);

  // copy: always visible, "✓ copied" in place for 1.6 s
  for (const fig of $$('.cb[data-code]')) {
    const b = $('.cp', fig);
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(fig.dataset.code); b.textContent = '✓ copied'; b.classList.add('ok'); }
      catch { const r = document.createRange(); r.selectNodeContents($('.cbody', fig)); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'selected'; }
      clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = 'copy'; b.classList.remove('ok'); }, 1600);
    });
  }

  // the phone menu: the rail as a sheet, opened at the current entry; picking a page closes it
  const mb = $('#mb'), rail = $('#rail');
  const menu = (open) => {
    body.classList.toggle('menu', open); mb?.setAttribute('aria-expanded', String(open));
    const g = $('.gl', mb); if (g) g.textContent = open ? '✕' : '☰';
    if (open) $('.tree li.cur', rail)?.scrollIntoView({ block: 'center' });
  };
  mb?.addEventListener('click', () => menu(!body.classList.contains('menu')));
  rail?.addEventListener('click', (e) => { if (e.target.closest('.tree a')) menu(false); });

  // search: the rail's field on the desktop, the bar's field on the phone; results over the column
  const res = $('#res'), scrim = $('#scrim'), hits = $('#hits'), empty = $('#rempty');
  const fields = [$('#dq'), $('#dq2')].filter(Boolean);
  let pf, seq = 0, sel = -1, timer;
  const load = async () => {
    if (!pf) { pf = await import(base + 'pagefind/pagefind.js'); await pf.options({ baseUrl: base }); pf.init(); }
    return pf;
  };
  const close = () => { res.hidden = true; scrim.hidden = true; sel = -1; };
  const mark = (i) => { const as = $$('.hit', hits); sel = Math.max(0, Math.min(i, as.length - 1)); as.forEach((a, j) => a.classList.toggle('sel', j === sel)); as[sel]?.scrollIntoView({ block: 'nearest' }); };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function run(q) {
    const n = ++seq;
    if (!q.trim()) { close(); return; }
    const p = await load();
    const r = await p.search(q, { filters: { area: 'docs' } });
    const data = await Promise.all(r.results.slice(0, 8).map((x) => x.data()));
    if (n !== seq) return;
    res.hidden = false; scrim.hidden = false;
    $('#rq').textContent = `"${q}"`; $('#rqe').textContent = q;
    $('#rcount').innerHTML = `<b>${r.results.length}</b> result${r.results.length === 1 ? '' : 's'}`;
    empty.hidden = data.length > 0;
    hits.innerHTML = data.map((d) => {
      const path = new URL(d.url, location.origin).pathname.slice(base.length).replace(/^docs\/|\/$/g, '').split('/');
      const where = path.length > 1 ? `<span>${esc(path[0])}/</span>${esc(path[1])}` : '<span>docs/</span>';
      return `<a class="hit" href="${esc(d.url)}"><div class="hp">${where}</div><b>${esc(d.meta.title || '')}</b><p>${d.excerpt}</p></a>`;
    }).join('');
    if (data.length) mark(0);
  }
  for (const f of fields) {
    f.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => run(f.value), 120); });
    f.addEventListener('focus', () => { load(); if (f.value.trim()) run(f.value); });
    f.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(sel + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(sel - 1); }
      else if (e.key === 'Enter') { const a = $$('.hit', hits)[sel]; if (a) location.href = a.href; }
      else if (e.key === 'Escape') { f.value = ''; close(); f.blur(); phoneSearch(false); }
    });
  }
  scrim?.addEventListener('click', () => { close(); phoneSearch(false); });
  $('#rclear')?.addEventListener('click', () => { for (const f of fields) f.value = ''; close(); (phone() ? $('#dq2') : $('#dq'))?.focus(); });
  const phone = () => getComputedStyle($('#dbar')).display !== 'none';
  const phoneSearch = (on) => {
    body.classList.toggle('srch', on); if (on) { menu(false); $('#dq2').focus(); }
    else { const f = $('#dq2'); if (f) f.value = ''; close(); }
  };
  $('#sb')?.addEventListener('click', () => phoneSearch(true));
  $('#cn')?.addEventListener('click', () => phoneSearch(false));
  addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    e.preventDefault();
    if (phone()) phoneSearch(true); else $('#dq')?.focus();
  });

  // the contents: the spark on the heading in view, the path above it, no animation so it never lags the scroll
  const toc = $$('.dtoc .tt a');
  if (toc.length) {
    const heads = toc.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const spot = () => {
      const y = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navh')) || 61) + 40;
      let i = 0;
      heads.forEach((h, j) => { if (h.getBoundingClientRect().top <= y) i = j; });
      toc.forEach((a, j) => { a.classList.toggle('cur', j === i); a.classList.toggle('path', j < i); });
    };
    addEventListener('scroll', spot, { passive: true }); spot();
  }
})();
