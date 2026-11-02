// /benchmark/: the page scripts/build-benchmark.mjs builds into benchmark/index.html (look B, picked by the owner), served whole; `body` below is the
// placeholder the build falls back to only when that file is missing.
import fs from 'node:fs';
export async function raw() {
  const built = new URL('../benchmark/index.html', import.meta.url);
  if (!fs.existsSync(built)) return null;
  return fs.readFileSync(built, 'utf8');
}
export const route = 'benchmark/index.html';
export const active = 'Benchmark';
export const title = 'Benchmark · provedreview';
export const description = 'AACR-Bench: every row, who measured it, on which version, over how many instances, with which judge.';

export async function body({ rows }) {
  return `<div class="page-head">
  <span class="eyebrow">Benchmark</span>
  <h1>AACR-Bench, every row.</h1>
  <p class="lede">${rows.length} rows: ours and Open Code Review's published entries. Each row says who measured it, on which version, over how many instances, with which judge.</p>
</div>
<div class="review rim"><span class="eyebrow">In review</span><p>Layout and style under review. The owner picks the board; the table lands here.</p></div>`;
}
