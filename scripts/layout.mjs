// The shell every page shares: head, nav, footer. One place for the nav links (DATA-MAP row nav-link).
export const NAV = [
  ['Benchmark', '/benchmark/'],
  ['Quick start', '/quick-start/'],
  ['Docs', '/docs/'],
  ['Paper', '/paper/'],
];
export const GITHUB = 'https://github.com/NexusGPT/lean';
export const DA = 'https://github.com/NexusGPT/differential-attestation';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MARK = '<span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>';

// what every page loads after styles.css: the icon, the two text faces preloaded, the shell's stylesheet
export const assets = () => `
<link rel="icon" href="/public/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/public/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/public/fonts/inter-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">`;

export function head({ title, description }) {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta name="theme-color" content="#07080b">
<link rel="stylesheet" href="/styles.css">${assets()}
<script>document.documentElement.classList.add("js")</script>`;
}

export function nav(active) {
  const links = NAV.map(([label, href]) => `<a href="${href}"${label === active ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<header class="nav" id="top"><a class="logo" href="/" aria-label="provedreview, home">${MARK}provedreview</a><nav class="links" aria-label="Site">${links}</nav><div class="nav-r"><a class="btn" href="${GITHUB}">GitHub</a></div></header>`;
}

// `line` is the footer's sentence; the home passes its own (scripts/build.mjs), every other page keeps this one
export function footer(line = 'Differential attestation is built by Nexus. lean is the checker inside it.') {
  return `<footer class="foot" data-pagefind-ignore>
  <div class="wm">
    <a class="logo" href="/">${MARK}provedreview</a>
    <span>${esc(line)}</span>
  </div>
  <nav class="fl" aria-label="Footer">${NAV.map(([l, h]) => `<a href="${h}">${l.toLowerCase()}</a>`).join('')}<a href="${GITHUB}">lean</a><a href="${DA}">differential-attestation</a><a href="https://gpt.nexus">Nexus</a></nav>
</footer>`;
}

// An inner page: the shell around one body. `index` false keeps a page out of the search index.
export function page({ title, description, active, body, index = true, scripts = '' }) {
  return `<!doctype html><html lang="en"><head>${head({ title, description })}</head><body class="inner">
${nav(active)}
<div class="sheet">
<main id="main"${index ? ' data-pagefind-body' : ''}>
${body}
</main>
${footer()}
</div>
<script src="/site.js"></script>${scripts}
</body></html>
`;
}
