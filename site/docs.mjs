// /docs/: the shell only. The docs layout and style rounds pick the body; the vendored pages land under /docs/ after.
export const route = 'docs/index.html';
export const active = 'Docs';
export const title = 'Docs · provedreview';
export const description = 'lean and differential attestation: the verdicts, the certificate, pull requests, the editor, the architecture.';

export async function body() {
  return `<div class="page-head">
  <span class="eyebrow">Docs</span>
  <h1>lean and differential attestation, in full.</h1>
  <p class="lede">Every page of lean's docs and every DA architecture page, with a sidebar and search.</p>
</div>
<div class="review rim"><span class="eyebrow">In review</span><p>Layout and style under review. Until the pick, start with the <a href="/quick-start/">quick start</a> or <a href="https://github.com/NexusGPT/lean/tree/v0.1.3/docs">lean's docs on GitHub</a>.</p></div>`;
}
