// The Benchmark page's views, from board B "instrument" (docs/design-rounds/benchmark/r2/b/index.html).
// One source for both sides: scripts/build-benchmark.mjs runs it in node:vm to write the static page,
// and inlines the same text into the page, where scripts/bench/client.js redraws with it on sort, filter and expand.
// A classic script on purpose (no import, no export): it defines benchView and benchErrorHtml and nothing else.

function benchErrorHtml() {
  return '<div class="err"><span class="code">data error</span><p>data/leaderboard.json did not load. No row is shown without it.<small>F1, precision and recall are never estimated or cached on this page.</small></p><span class="acts"><button type="button" class="btn m" data-retry>Retry</button><a class="btn m" href="leaderboard.json">Open the data file</a></span></div>';
}

function benchView(DATA, opt) {
  // opt: { logs: { <row id>: [{ name, href }] }, paper: href }
  const ROWS = DATA.rows;
  const OWN = 'Measured by us';
  const kind = r => r.measured_by === OWN ? 'own' : 'pub';
  const SCALE = Math.ceil(Math.max(...ROWS.flatMap(r => [r.f1, r.precision, r.recall])) / 10) * 10;
  const STEP = (100 * 10 / SCALE) + '%';
  const SYSTEMS = [...new Set(ROWS.map(r => r.system))];
  const BYS = [...new Set(ROWS.map(r => r.measured_by))];
  const own = ROWS.filter(r => kind(r) === 'own'), pub = ROWS.filter(r => kind(r) === 'pub');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sec = s => { if (!s) return null; const m = /^(?:(\d+)m)?(?:(\d+)s)?$/.exec(s); return m ? (+m[1] || 0) * 60 + (+m[2] || 0) : null; };
  const tok = s => s == null ? null : parseFloat(String(s).replace(/,/g, ''));
  const decs = v => (String(v).split('.')[1] || '').length;
  const fmt = v => v.toFixed(Math.max(1, decs(v)));
  const dec = v => { const [i, f] = fmt(v).split('.'); return `<span class="i">${i}</span>.<span class="f">${f}</span>`; };
  const thou = n => n.toLocaleString('en-US');
  const KEYS = {
    system:      { get: r => (r.system + ' ' + r.model).toLowerCase(), first: 'asc', short: 'name', label: 'System · model' },
    measured_by: { get: r => r.measured_by, first: 'asc', short: 'run', label: 'Measured by' },
    f1:          { get: r => r.f1, first: 'desc', short: 'F1', label: 'F1' },
    precision:   { get: r => r.precision, first: 'desc', short: 'precision', label: 'Precision' },
    recall:      { get: r => r.recall, first: 'desc', short: 'recall', label: 'Recall' },
    avg_time:    { get: r => sec(r.avg_time), first: 'asc', short: 'time', label: 'Time per PR' },
    avg_tokens:  { get: r => tok(r.avg_tokens), first: 'asc', short: 'tokens', label: 'Tokens per PR' },
    instances:   { get: r => r.instances, first: 'desc', short: 'instances', label: 'Instances' },
  };
  const MARK = '<span class="mark">' + '<i></i>'.repeat(9) + '</span>';
  const paper = (opt && opt.paper) || '#method';
  const logsOf = id => (opt && opt.logs && opt.logs[id]) || [];

  const newState = () => ({ sys: new Set(), by: new Set(), sort: { key: 'f1', dir: 'desc' }, open: new Set(), sheet: false });

  function gauge(v, cls) {
    if (v == null) return '<span class="g none">—</span>';
    const pct = Math.min(100, v / SCALE * 100);
    const mark = cls.startsWith('bar-k') ? `width:${pct}%` : `left:${pct}%`;
    return `<span class="g ${cls}"><b class="gv">${dec(v)}</b><span class="gt"><i style="${mark}"></i></span></span>`;
  }
  function scaleHead(label) {
    return `<span class="hs"><span class="hl">${label}</span><span class="g"><b class="gv" aria-hidden="true">${dec(88.88)}</b><span class="gt sc"><em>0</em><em>${SCALE / 2}</em><em>${SCALE}</em></span></span></span>`;
  }

  function view(st) {
    const rows = ROWS.map((r, i) => ({ r, i })).filter(({ r }) =>
      (!st.sys.size || st.sys.has(r.system)) && (!st.by.size || st.by.has(r.measured_by)));
    const K = KEYS[st.sort.key], dir = st.sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const x = K.get(a.r), y = K.get(b.r);
      if (x == null && y == null) return a.i - b.i;
      if (x == null) return 1; if (y == null) return -1;
      if (x < y) return -dir; if (x > y) return dir; return a.i - b.i;
    });
    // competition rank on the active key: equal values share a position
    let last, lastPos = 0;
    rows.forEach((o, n) => {
      const v = K.get(o.r);
      if (v == null) { o.pos = null; return; }
      if (n === 0 || v !== last) lastPos = n + 1;
      o.pos = lastPos; last = v;
    });
    return rows;
  }

  function cite(r) {
    return `${r.system} · ${r.model}: F1 ${fmt(r.f1)} %, precision ${fmt(r.precision)} %, recall ${fmt(r.recall)} %; AACR-Bench, ${r.instances} instances; judge ${r.judge}${r.rounds ? ', ' + r.rounds + ' rounds' : ''}; ${r.measured_by.toLowerCase()}; read ${r.read}.`;
  }

  function detail(r, open) {
    const k = kind(r);
    const un = k === 'own' && DATA.unscored ? DATA.unscored : null;
    const total = un ? un.of : r.instances;
    const files = logsOf(r.id);
    const logs = r.judge_logs === 'available'
      ? (files.length
        ? files.map(f => `<a href="${esc(f.href)}" download>${esc(f.name)}</a>`).join('<br>')
        : `<span class="off">${r.rounds ? r.rounds + ' rounds, ' : ''}kept in the DA repository</span><small>not copied to this site yet</small>`)
      : `<span class="off">${esc(r.judge_logs)}</span><small>the source publishes scores, not verdicts</small>`;
    const c = cite(r);
    const ro = (lab, v, cls, frac) => `<div><div class="k">${lab}<span>0 – ${SCALE} %</span></div>${gauge(v, cls)}${frac ? `<div class="frac">${esc(frac)}</div>` : ''}</div>`;
    const src = /^https?:/.test(r.source) ? `<a href="${esc(r.source.split(' ')[0])}">${esc(r.source)}</a>` : esc(r.source);
    return `<div class="det" id="det-${esc(r.id)}"${open ? '' : ' inert'}><div><div class="dbox">
    <div class="ro">${ro('F1', r.f1, 'bar-k', '')}${ro('Precision', r.precision, 'ndl', r.precision_fraction ? r.precision_fraction + ' comments matched' : '')}${ro('Recall', r.recall, 'ndl', r.recall_fraction ? r.recall_fraction + ' notes matched' : '')}</div>
    <dl class="spec">
      <div class="w2"><dt>Version</dt><dd>${esc(r.version)}</dd></div>
      <div><dt>Measured by</dt><dd><i class="sw ${k}"></i> ${esc(r.measured_by)}</dd></div>
      <div><dt>Instances</dt><dd>${r.instances} of ${total} scored${un ? `<small>${un.count} unscored: ${esc(un.reason)}</small>` : ''}</dd></div>
      <div><dt>Notes · comments</dt><dd>${thou(r.notes)} human notes<small>${thou(r.comments)} tool comments</small></dd></div>
      <div><dt>Judge</dt><dd>${esc(r.judge)}${r.rounds ? `<small>${r.rounds} rounds, mean reported</small>` : ''}</dd></div>
      <div class="w2"><dt>Source</dt><dd>${src}<small>read ${esc(r.read)}</small></dd></div>
      <div><dt>Time · tokens per PR</dt><dd>${r.avg_time ? esc(r.avg_time) + ' · ' + esc(r.avg_tokens) : '—'}<small>${r.avg_tokens_in_out ? 'in / out ' + esc(r.avg_tokens_in_out) : 'no figure in the source'}</small></dd></div>
      <div class="w2"><dt>Judge logs</dt><dd>${logs}</dd></div>
      <div><dt>Model · vendor</dt><dd>${esc(r.model)}<small>${esc(r.vendor)}</small></dd></div>
    </dl>
    <div class="cite"><code>${esc(c)}</code><button type="button" class="btn m" data-copy="${esc(c)}">Copy</button><a class="pp" href="${esc(paper)}">The paper →</a></div>
  </div></div></div>`;
  }

  function rowHtml(o, st) {
    const r = o.r, k = kind(r), open = st.open.has(r.id);
    const pos = o.pos == null ? '—' : String(o.pos).padStart(2, '0');
    const tag = k === 'own' ? 'by us' : 'by Open Code Review';
    const n = (key, v) => `<span class="r n${v ? '' : ' none'}" data-k="${key}">${v ? esc(v) : '—'}</span><!--/${key}-->`;
    return `<div class="tr ${k}${open ? ' open' : ''}" data-id="${esc(r.id)}">
    <button type="button" class="row" aria-expanded="${open}" aria-controls="det-${esc(r.id)}">
      <span class="rail"></span><span class="pos">${pos}</span>
      <span class="sys"><b>${esc(r.system)}</b><small>${esc(r.model)} <i>· ${esc(r.vendor)}</i></small><span class="tag"><i class="sw ${k}"></i>${tag}</span></span>
      <span class="by"><i class="sw ${k}"></i>${esc(r.measured_by)}</span>
      <span class="f1c" data-k="f1">${gauge(r.f1, 'bar-k f1')}</span><!--/f1-->
      <span class="pc" data-k="precision">${gauge(r.precision, 'ndl')}</span><!--/precision-->
      <span class="rc" data-k="recall">${gauge(r.recall, 'ndl')}</span><!--/recall-->
      ${n('avg_time', r.avg_time)}
      ${n('avg_tokens', r.avg_tokens)}
      <span class="r n" data-k="instances">${r.instances}</span><!--/instances-->
      <span class="chev"><i>›</i></span>
    </button>${detail(r, open)}</div>`;
  }

  function headHtml(st) {
    const s = st.sort;
    const ar = key => s.key === key ? `<span class="ar" aria-hidden="true">${s.dir === 'desc' ? '▼' : '▲'}</span>` : '';
    const lab = key => KEYS[key].label + (s.key === key ? `, sorted ${s.dir === 'desc' ? 'descending' : 'ascending'}` : '');
    const th = (key, cls, inner) => `<button type="button" class="th${cls ? ' ' + cls : ''}${s.key === key ? ' on' : ''}" data-sort="${key}" aria-label="${lab(key)}">${inner}</button>`;
    const by = s.key === 'f1' ? '' : `<small>by ${KEYS[s.key].short}</small>`;
    return `<div class="thr">
    <span class="rail"></span><span class="pos posh">#${by}</span>
    ${th('system', 'sysh', 'System · model' + ar('system'))}
    ${th('measured_by', '', 'Measured by' + ar('measured_by'))}
    ${th('f1', 'f1c', scaleHead('F1' + ar('f1')))}
    ${th('precision', 'pc', scaleHead('Precision' + ar('precision')))}
    ${th('recall', 'rc', scaleHead('Recall' + ar('recall')))}
    ${th('avg_time', 'r', 'Time/PR' + ar('avg_time'))}
    ${th('avg_tokens', 'r', 'Tokens/PR' + ar('avg_tokens'))}
    ${th('instances', 'r', 'Inst.' + ar('instances'))}
    <span class="chev"></span></div>`;
  }

  const BONES = [182, 214, 166, 236, 198, 150, 224, 176, 206, 160];
  function bodyHtml(st, state) {
    if (state === 'loading') {
      const sk = BONES.map(w => `<div class="tr"><div class="row"><span class="rail"></span><span class="pos">··</span><span class="sys"><span class="bone" style="width:${w}px"></span></span><span class="by"><span class="bone" style="width:120px"></span></span>${['f1c|bar-k f1', 'pc|ndl', 'rc|ndl'].map(x => { const [c, g] = x.split('|'); return `<span class="${c}"><span class="g ${g}"><b class="gv"><span class="i">··</span>.<span class="f">··</span></b><span class="gt"></span></span></span>`; }).join('')}<span class="r n">··</span><span class="r n">··</span><span class="r n">··</span><span class="chev"></span></div></div>`).join('');
      return `<div class="sk">${sk}</div>`;
    }
    if (state === 'error') return benchErrorHtml();
    const rows = view(st);
    if (!rows.length) {
      const f = [...(st.sys.size ? ['System: ' + [...st.sys].join(', ')] : []), ...(st.by.size ? ['Measured by: ' + [...st.by].join(', ')] : [])].join(' · ');
      return `<div class="empty"><span>No row matches <b>${esc(f)}</b>.</span><button type="button" class="btn m" data-reset>Reset filters</button></div>`;
    }
    return rows.map(x => rowHtml(x, st)).join('') + '<!--/rows-->';
  }

  function chips(st, inert) {
    const n = v => ROWS.filter(r => r.measured_by === v).length;
    const dis = inert ? ' disabled' : '';
    const sys = SYSTEMS.map(v => `<button type="button" class="chip" data-f="sys" data-v="${esc(v)}" aria-pressed="${st.sys.has(v)}"${dis}>${esc(v)}</button>`).join('');
    const by = BYS.map(v => `<button type="button" class="chip" data-f="by" data-v="${esc(v)}" aria-pressed="${st.by.has(v)}"${dis}><i class="sw ${v === OWN ? 'own' : 'pub'}"></i>${esc(v)} <u>${n(v)}</u></button>`).join('');
    return `<span class="grp"><em>System</em>${sys}</span><span class="grp"><em>Measured by</em>${by}</span>`;
  }

  function barHtml(st, state) {
    const inert = state === 'loading' || state === 'error';
    const dis = inert ? ' disabled' : '';
    const cnt = state === 'loading' ? '<u>reading rows…</u>' : state === 'error' ? '<u>no rows</u>' : `${view(st).length} <u>of ${ROWS.length} rows</u>`;
    const active = st.sys.size + st.by.size;
    const opts = Object.entries(KEYS).map(([k, v]) => `<option value="${k}"${st.sort.key === k ? ' selected' : ''}>Sort: ${v.short}</option>`).join('');
    return `<div class="bar${st.sheet ? ' sheet-on' : ''}">
    <button type="button" class="btn m fbtn" data-sheet aria-expanded="${st.sheet}" aria-controls="filters"${dis}>Filters${active ? ' (' + active + ')' : ''}</button>
    <span class="fgs" id="filters">${chips(st, inert)}${active ? '<button type="button" class="reset" data-reset>Reset filters</button>' : ''}</span>
    <span class="cnt" aria-live="polite">${cnt}</span>
    <a class="btn m dlb" href="#dl">Downloads ↓</a>
    <select class="sortsel" data-sortsel aria-label="Sort rows"${dis}>${opts}</select>
  </div>`;
  }

  function tfootHtml(state) {
    if (state === 'error') return '';
    return `<span>scale 0 – ${SCALE} % on F1, precision, recall</span><span>— no figure in the source</span><span>published rows read ${esc(pub[0].read)}</span><span>our rows: ${esc(own[0].version.split(' (')[0])}</span><a href="#method">Method ↓</a>`;
  }

  function pheadHtml() {
    return `<div class="phead"><div><h1>Benchmark</h1><div class="scope">${esc(DATA.benchmark)}</div></div>
    <div class="caveat"><span><i class="sw own"></i><span><b>Measured by us</b> · ${own.length} rows, one judge run, ${own[0].instances} instances</span></span><span><i class="sw pub"></i><span><b>Published by Open Code Review</b> · ${pub.length} rows, their run, ${pub[0].instances} instances. The two runs were not judged together.</span></span></div></div>`;
  }

  function afterHtml() {
    const e = DATA.escaped_defects, u = DATA.unscored;
    const strip = (label, v, of, c) => `<div class="strip"><span>${label}</span><span class="cells" style="--of:${of};--c:${c}">${Array.from({ length: of }, (_, i) => `<i${i < v ? ' class="on"' : ''}></i>`).join('')}</span><span class="n mono">${v} <u>/ ${of}</u></span></div>`;
    const logs = own.map(r => {
      const files = logsOf(r.id);
      const what = `${r.rounds} round files · every judge verdict per comment · ${esc(r.version.split(' (')[0])}`;
      const act = files.length ? `<a href="${esc(files[0].href)}" download>↓ ${files.length} files</a>` : '<span class="off">not copied to this site yet</span>';
      return `<div class="dlr"><i class="sw own"></i><span class="nm">${esc(r.system)} · ${esc(r.model.split(' ')[0])}</span><span class="what">${what}</span>${act}</div>`;
    }).join('');
    return `<section class="sec rv" id="method"><span class="eyebrow">Method</span><h2>How each row was measured</h2>
    <div class="mgrid">
      <div class="mc"><span class="id">M1</span><h3>The benchmark</h3><dl><dt>Set</dt><dd>${esc(DATA.benchmark)}</dd><dt>Instance</dt><dd>one pull request and its human review notes</dd></dl></div>
      <div class="mc"><span class="id">M2</span><h3>The official pipeline</h3><dl><dt>Input</dt><dd>each entry reviews every pull request of the set</dd><dt>Output</dt><dd>its review comments, which the judge scores</dd></dl></div>
      <div class="mc"><span class="id">M3</span><h3>The judge</h3><dl><dt>Match</dt><dd>${esc(DATA.columns.precision)} · ${esc(DATA.columns.recall)}</dd><dd class="math">F<sub>1</sub> = 2 P R / (P + R)</dd><dt>Our rows</dt><dd>${esc(own[0].judge)}, ${own[0].rounds} rounds, mean reported</dd><dt>Published rows</dt><dd>judge not published</dd></dl></div>
      <div class="mc"><span class="id">M4</span><h3>How our rows were measured</h3><dl>${own.map(r => `<dt>${esc(r.system)}</dt><dd>${esc(r.model)} · ${esc(r.version)}</dd>`).join('')}<dt>Same for both</dt><dd>${own[0].instances} instances, ${thou(own[0].notes)} notes, one judge run</dd></dl></div>
      <div class="mc"><span class="id">M5</span><h3>The ${u.count} unscored instances</h3><dl><dt>Count</dt><dd>${u.count} of ${u.of}</dd><dt>Cause</dt><dd>${esc(u.reason)}</dd><dt>Source</dt><dd>${esc(u.source)}</dd></dl></div>
    </div>
  </section>
  <section class="sec rv" id="escaped"><span class="eyebrow">Escaped defects</span><h2>On ${e.of} defects that escaped human review</h2>
    <div class="esc">
      <div><h3>Caught</h3><p class="hint">one cell per defect · more is better</p>
        ${strip('Recordings + proof', e.recordings_and_proof, e.of, 'var(--cream)')}${strip('Recordings', e.recordings, e.of, 'var(--steel)')}${strip('Strongest reader', e.strongest_reader, e.of, 'var(--mut)')}</div>
      <div><h3>Clean changes refused</h3><p class="hint">one cell per clean change · fewer is better</p>
        ${strip('Recordings', e.clean_refused_recordings, e.of, 'var(--wit)')}${strip('Strongest reader', e.clean_refused_reader, e.of, 'var(--wit)')}</div>
    </div>
    <p class="srcl">source: ${esc(e.source)} · <a href="${esc(paper)}">The paper →</a></p>
  </section>
  <section class="sec rv" id="dl"><span class="eyebrow">Downloads</span><h2>Judge logs and data</h2>
    <div class="dl">${logs}
      <div class="dlr"><i class="sw none"></i><span class="nm">leaderboard.json</span><span class="what">all ${ROWS.length} rows, both runs, every field on this page</span><a href="leaderboard.json" download>↓ json</a></div>
      <div class="dlr"><i class="sw pub"></i><span class="nm">Published rows</span><span class="what">judge logs not published by Open Code Review · source open-codereview.ai, read ${esc(pub[0].read)}</span><a href="https://open-codereview.ai/">source ↗</a></div>
    </div>
  </section>`;
  }

  return { ROWS, OWN, SCALE, STEP, KEYS, MARK, kind, newState, view, headHtml, bodyHtml, barHtml, tfootHtml, pheadHtml, afterHtml };
}
