// The page's nav and footer: board B's own (the Home markup), as the brief asks while the site-build lane's shell
// has not landed on master. SWAP POINT: when that shell lands, replace the bodies of nav() and footer() (and
// SHELL_CSS) with its exports; the page calls nothing else from here. Links are relative so the site works
// under a path (GitHub Pages project URL) and at the root (provedreview.ai).

export const MARK = '<span class="mark">' + '<i></i>'.repeat(9) + '</span>';
const GITHUB = 'https://github.com/NexusGPT/lean'; // docs/JOURNEYS.md, open question 5: the nav's GitHub button opens lean

// base: the path from the page to the site root ('../' for /benchmark/); cur: the page's own nav label
export function nav({ base, cur }) {
  const items = [['Benchmark', 'benchmark/'], ['Quick start', 'quick-start/'], ['Docs', 'docs/'], ['Paper', 'paper/']];
  const a = ([label, href]) => label === cur ? `<a class="cur" href="./" aria-current="page">${label}</a>` : `<a href="${base}${href}">${label}</a>`;
  return `<header class="nav" id="top"><a class="logo" href="${base}">${MARK}provedreview</a>
  <nav class="links" aria-label="Site">${items.map(a).join('')}<a class="btn" href="${GITHUB}">GitHub</a></nav>
  <details class="menu"><summary class="btn">Menu</summary><nav aria-label="Site, menu">${items.map(a).join('')}<a href="${GITHUB}">GitHub</a></nav></details>
</header>`;
}

export function footer({ base }) {
  return `<footer class="foot"><div class="wrap fw"><div class="wm"><a class="logo" href="${base}">${MARK}provedreview</a><span>Differential attestation is built by Nexus. lean is the checker inside it.</span></div>
  <nav class="fl" aria-label="Footer"><a href="https://github.com/NexusGPT/lean">lean</a><a href="https://github.com/NexusGPT/differential-attestation">differential-attestation</a><a href="./">benchmark</a><a href="${base}paper/">paper</a><a href="https://gpt.nexus">Nexus</a></nav></div></footer>`;
}

export const SHELL_CSS = `
.nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;font-size:14px;border-bottom:1px solid var(--line);position:relative;z-index:5}
.logo{font-weight:600;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.logo .mark{display:grid;grid-template-columns:repeat(3,7px);gap:1px}.logo .mark i{display:block;width:7px;height:7px;background:var(--steel);border-radius:1px;opacity:.9}.logo .mark i:nth-child(2),.logo .mark i:nth-child(4),.logo .mark i:nth-child(9){opacity:.35}
.links{display:flex;gap:28px;color:var(--mut);align-items:center}.links a:hover{color:var(--fg)}
.links a.cur{color:var(--fg);position:relative}.links a.cur::after{content:"";position:absolute;left:0;right:0;bottom:-21px;height:2px;background:var(--fg)}
.menu{display:none;position:relative}
.menu summary{list-style:none}.menu summary::-webkit-details-marker{display:none}
.menu nav{position:absolute;right:0;top:calc(100% + 8px);display:flex;flex-direction:column;min-width:180px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:6px;font-size:14px}
.menu nav a{padding:10px 12px;border-radius:5px;color:var(--mut)}.menu nav a:hover,.menu nav a.cur{color:var(--fg);background:rgba(255,255,255,.04)}
.foot{border-top:1px solid var(--line);font-size:13.5px;color:var(--mut)}
.foot .fw{padding-top:40px;padding-bottom:56px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}
.foot .wm{display:flex;flex-direction:column;gap:10px}
.foot .fl{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:12px}
.foot .fl a:hover{color:var(--fg)}
@media (max-width:760px){.nav{padding:14px 16px}.links{display:none}.menu{display:block}}
`;
