// /404.html: GitHub Pages serves it for any path with no file. The path is filled in by site.js; without a script the line still reads.
export const route = '404.html';
export const active = '';
export const title = 'No page here · provedreview';
export const description = 'No page at this address.';
export const index = false;

export async function body() {
  return `<div class="page-head nf">
  <span class="eyebrow">404</span>
  <h1>No page at <code class="nf-path">this address</code>.</h1>
  <p class="lede">The site has five pages.</p>
</div>
<div class="next nf-links">
  <a class="rim" href="/"><b>Home</b><span>The claim and the numbers.</span></a>
  <a class="rim" href="/benchmark/"><b>Benchmark</b><span>Every row on AACR-Bench.</span></a>
  <a class="rim" href="/quick-start/"><b>Quick start</b><span>From a clone to a first verdict.</span></a>
  <a class="rim" href="/docs/"><b>Docs</b><span>lean and differential attestation, in full.</span></a>
  <a class="rim" href="/paper/"><b>Paper</b><span>The method and every run.</span></a>
</div>`;
}
