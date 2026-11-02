// /paper/: the title, the claim, the numbers, the method in one formula, the limits, the citation.
// Sources: the DA README at 9b4243d0 ("## Three instruments", "## What it measured", "## The paper"), which quotes the paper v3
// section by section, and the abstract lines already quoted on the home page (paper@1c557a1 v3/sections/00-abstract.tex).
// The paper repository is not on this machine: the PDF, the authors and Figure 1 wait for it (marked below).
import { DA, GITHUB, esc } from '../scripts/layout.mjs';

export const route = 'paper/index.html';
export const active = 'Paper';
export const title = 'Paper · Differential Attestation';
export const description = 'Accepting agent-written changes from recordings, proofs and declared relations, never from the producer\'s account.';

const TITLE = "Differential Attestation: Accepting Agent-Written Changes from Recordings, Proofs and Declared Relations, Never from the Producer's Account";
const BIB = `@misc{differential-attestation-2026,
  title  = {${TITLE}},
  year   = {2026},
  note   = {Draft of 26 October 2026},
  url    = {https://provedreview.ai/paper/}
}`;

export async function body() {
  return `<article class="paper-page">
<header class="paper-head">
  <span class="eyebrow">The paper</span>
  <!-- src: paper@1c557a1 v3/main.tex:20 \\title; DA README "## The paper": "draft of 26 October 2026" -->
  <h1>${esc(TITLE)}</h1>
  <p class="meta"><span>Draft of 26 October 2026</span></p>
  <!-- PDF: public/paper/differential-attestation.pdf = paper repository v3/main.pdf (commit a78f4ef, 31 Oct 2026, tectonic build). Authors and Figure 1 [pending source]: the PDF ships under /paper/ once it is vendored -->
  <div class="btns"><a class="btn p" href="/public/paper/differential-attestation.pdf" download="differential-attestation.pdf" type="application/pdf">Download the PDF</a><a class="btn" href="#cite">Cite</a><a class="btn" href="${DA}">The DA repository →</a><a class="btn" href="${GITHUB}">lean on GitHub</a></div>
</header>

<section class="paper-sec" id="claim">
  <h2>The claim</h2>
  <!-- src: paper@1c557a1 v3/sections/00-abstract.tex (quoted on the home page) -->
  <p class="big">An acceptance gate that reads neither the change text nor any statement by its producer.</p>
  <!-- src: DA README "## The paper" from paper v3 sections/01-intro.tex (917, 13, ten) -->
  <p>One repository: agents merged 917 changes in 13 days. A reviewer reads about ten a day. The gate runs both versions and refuses on evidence.</p>
</section>

<section class="paper-sec" id="numbers">
  <h2>On 43 defects that escaped human review</h2>
  <!-- src: DA README "### On defects that escaped human review", from paper v3 sections/00-abstract.tex and sections/numbers.tex (\\daall 40, \\dacleanall 6, \\artunion 40 of 43) -->
  <div class="rim tbl-wrap"><table class="tbl">
    <thead><tr><th>Who decides</th><th>Defects caught, of 43</th><th>Clean changes refused, of 43</th></tr></thead>
    <tbody>
      <tr><td class="en">Strongest model reader</td><td><span class="num">10</span></td><td><span class="num">22</span></td></tr>
      <tr><td class="en">Recordings</td><td><span class="num">22</span></td><td><span class="num">4</span></td></tr>
      <tr><td class="en">Recordings + proof</td><td><span class="num">31</span></td><td></td></tr>
      <tr class="ours"><td class="en">Recordings + proof + relations<small>differential attestation</small></td><td><span class="num">40</span></td><td><span class="num">6</span></td></tr>
    </tbody>
  </table>
  <p class="caveat">Six repositories we operate. Each defect passed review and was repaired later, paired with a clean change of similar size. A catch counts only when the refusal lands on what the repair fixed, a rule set before the run.</p></div>
  <!-- src: DA README, from paper v3 sections/01-intro.tex and sections/05-limitations.tex -->
  <p>Two readers from different vendors missed the same defects. Most escaped defects were not in the text a reader receives: a request a provider rejects, a cache key missing an input, a job moved to a runner too small for it.</p>
</section>

<section class="paper-sec" id="method">
  <h2>Three instruments</h2>
  <!-- src: DA README "## Three instruments", from paper v3 sections/03-method.tex "The six checks" -->
  <div class="inst">
    <div><h3>Recording</h3><p>The system runs under a fixed set of stimuli before and after the change. Any difference outside the scope the requester selected is refused at its location. It certifies only the stimuli it ran.</p></div>
    <div><h3>Proof</h3><p>For every function the change was not meant to touch, lean proves the new version equal to the old one for every input, or returns an input on which they differ.</p></div>
    <div><h3>Relation</h3><p>For every file that is not a function, a predicate derived from an authoritative file or declared outside the change compares the two versions. The change cannot switch it off.</p></div>
  </div>
  <!-- src: lean@dbe9a32 README.md "## How it works": "outside the scope, f_parent(x) == f_candidate(x) for every input and every world" -->
  <figure class="formula" aria-label="For every input x outside the scope and every world w, f parent of x and w equals f candidate of x and w">
    <div class="eq"><span><i>∀ x</i> ∉ <i>scope</i>, <i>∀ w</i> :</span> <span><i>f</i><sub>parent</sub>(<i>x</i>, <i>w</i>) = <i>f</i><sub>candidate</sub>(<i>x</i>, <i>w</i>)</span></div>
    <figcaption>One lemma per changed function. Dafny and Z3 decide it. Two reads of a clock are never equal by accident: every effect is a step of an explicit world <i>w</i>.</figcaption>
  </figure>
  <!-- src: DA README "## Three instruments", last line -->
  <p>A verdict is <b>PASS</b> (only the asked change), <b>REFUSE</b> (the location, the input or the artifact, both outcomes, the lines) or <b>ASK</b> (what could not be decided, by name).</p>
</section>

<section class="paper-sec" id="reach">
  <h2>Soundness and reach</h2>
  <!-- src: paper@1c557a1 v3/sections/00-abstract.tex (quoted on the home page) -->
  <div class="facts">
    <div><b>120 <small>of 143</small></b><span>planted mutations separated by an input lean found. None proved equal.</span></div>
    <div><b>53% <small>of 39,775</small></b><span>functions in the proof subset, across 36 repositories, written before the subset existed.</span></div>
  </div>
</section>

<section class="paper-sec" id="limits">
  <h2>Limits</h2>
  <!-- src: DA README, from paper v3 sections/05-limitations.tex; "four bounds" from sections/03-method.tex -->
  <ul class="limits">
    <li>The paper states four bounds on what a gate can observe and a proof can decide, and reports every run, failures included.</li>
    <li>The repositories are private. The numbers and their hashes are published in the paper.</li>
    <li>One team designed and judged the experiments.</li>
    <li>Only defects repaired with a note enter the corpus.</li>
    <li>Only the requester says what was meant to change. A wrong edit releases a wrong outcome.</li>
  </ul>
</section>

<section class="paper-sec" id="cite">
  <h2>Cite</h2>
  <figure class="code" data-copy="${esc(BIB)}"><figcaption><span class="lang">bibtex</span><span class="note">draft of 26 October 2026</span></figcaption><pre class="shiki"><code>${esc(BIB)}</code></pre></figure>
  <p class="aside">The benchmark numbers on this site carry their own conditions on <a href="/benchmark/">the benchmark page</a>.</p>
</section>
</article>`;
}
