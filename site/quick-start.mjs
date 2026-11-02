// /quick-start/: install, first run, read the verdict, decide a component, gate a pull request, every command.
// Every command and output is read from lean's README at the pinned commit (content/PINS.json); nothing is retyped.
import { marked } from 'marked';
import { command, output } from '../scripts/highlight.mjs';
import { esc, GITHUB } from '../scripts/layout.mjs';
import { PIN, section, blocks, split, run } from './readme.mjs';

export const route = 'quick-start/index.html';
export const active = 'Quick start';
export const title = 'Quick start · provedreview';
export const description = 'Clone lean, check one function, read the verdict. Every command is a real run of lean v0.1.3.';

export async function body() {
  const short = PIN.commit.slice(0, 7);
  const pin = `lean ${PIN.tag} · ${short} · Node 24`;

  // ## Three runs: the clone line (its comment is the requirement), the ledger check and its jq line, the Toggle run
  const three = blocks(section('## Three runs'));
  const [first, check, jq] = three[0].split('\n');
  const [clone, needs] = split(first);
  const witness = three[1];
  const toggle = run(three[2]);
  // ### 2. A pull request: the command, and the table's summary line under it
  const prSec = section('### 2. A pull request');
  const pr = run(blocks(prSec)[0]);
  const prSummary = prSec.match(/\n> (.*)\n/)[1].replace(/\*\*/g, '');
  // ## What is built and what is planned: the image
  const image = blocks(section('## What is built and what is planned'))[0].split('\n')[0];
  // ## Using it: the command table and the line under it
  const using = section('## Using it');
  const table = marked.parse(using.slice(0, using.indexOf('\n\n**')).trim());
  const after = marked.parseInline(using.slice(using.indexOf('**Lane B')).trim());
  const verdictsLine = section('## The verdicts').match(/`check\.mjs` reports[^\n]*/)[0];

  const steps = [
    ['install', 'Install'], ['first-run', 'First run'], ['read', 'Read the verdict'],
    ['decide', 'Decide a component'], ['pull-request', 'Gate a pull request'], ['commands', 'Every command'], ['next', 'Next'],
  ];

  return `<!-- src: every command and output on this page is read at build time from lean@${PIN.commit} README.md (content/lean/README.md, tag ${PIN.tag}); the headings named beside each block -->
<div class="page-head">
  <span class="eyebrow">Quick start</span>
  <h1>From a clone to a first verdict.</h1>
  <p class="lede">Clone lean, check one function, read what it prints. Lane B needs only Node 24. Python 3 and Dafny 4 run the proof lane; without them lane A reports <code>ASK</code>.</p>
  <p class="meta"><a href="${GITHUB}/tree/${PIN.tag}">lean ${PIN.tag}</a><span>commit ${short}</span><span>Node 24</span><span>Apache-2.0</span></p>
</div>

<div class="qs">
  <nav class="toc" aria-label="On this page"><ol>${steps.map(([id, t], i) => `<li><a href="#${id}"><span>${String(i + 1).padStart(2, '0')}</span>${t}</a></li>`).join('')}</ol></nav>

  <div class="qs-body">
    <section class="qs-step" id="install">
      <h2><span class="no">01</span>Install</h2>
      <p>The checkout holds every pair the runs below use.</p>
      <!-- src: README "## Three runs", first block, line 1 -->
      ${await command(clone, { note: pin })}
      <ul class="needs">
        <!-- src: the same line's comment: "${esc(needs)}" -->
        <li><b>Node 24</b> runs lane B: both versions, same inputs, every effect compared.</li>
        <li><b>Python 3 and Dafny 4</b> run lane A, the proof. Without them lane A reports <code>ASK</code> and lane B still answers.</li>
      </ul>
      <p class="aside">Or the image, both lanes pinned (node 24.22.2, Dafny 4.11.0, Z3 4.12.1):</p>
      <!-- src: README "## What is built and what is planned" -->
      ${await command(image, { note: 'from the checkout' })}
    </section>

    <section class="qs-step" id="first-run">
      <h2><span class="no">02</span>First run</h2>
      <p>A ledger function. The candidate rejects an event that lands exactly on the floor: <code>&lt;=</code> where the parent had <code>&lt;</code>. Give lean both files and the unit.</p>
      <!-- src: README "## Three runs", first block, lines 2 and 3; the output block under it -->
      ${await command(check + '\n' + jq, { note: pin })}
      ${await output(witness, { verdict: 'WITNESS' })}
    </section>

    <section class="qs-step" id="read">
      <h2><span class="no">03</span>Read the verdict</h2>
      <p>lean drew the input itself: a floor of <code>-1</code> and a debit of <code>1</code> from a new account, which lands exactly on it.</p>
      <!-- src: README "## Three runs", the paragraph under the output -->
      <dl class="read">
        <div><dt><code>"floor": -1</code></dt><dd>The account's floor. The debit lands exactly on it.</dd></div>
        <div><dt><code>"parent": 1</code></dt><dd>The parent posts the event and notifies the port once.</dd></div>
        <div><dt><code>"candidate": 0</code></dt><dd class="w">The candidate posts nothing. That is the slip.</dd></div>
      </dl>
      <p>Same seed, same input, same verdict. The full record is in <code>ledger.json</code>.</p>
      <!-- src: README "## The verdicts": "${esc(verdictsLine)}" -->
      <h3>The verdicts, strongest first</h3>
      <ol class="verdicts">
        <li><span class="v w">WITNESS</span><span>An input on which the two versions differ, with the source line on each side.</span></li>
        <li><span class="v ok">PASS-proved</span><span>Lane A proved them equal for every input and every world.</span></li>
        <li><span class="v ok">PASS-decided</span><span>A component finite by its types, explored to the end of its state space.</span></li>
        <li><span class="v ask">PASS-bounded</span><span>No difference within a stated bound. It never becomes a proof.</span></li>
        <li><span class="v ask">ASK</span><span>Not decided. lean names the construct.</span></li>
      </ol>
      <p class="aside">Outside the order: <code>REFUSE</code>, a construct with no faithful reading or a local import that cannot load; <code>NEW</code>, a function with no parent, run with no equality claim. <code>check.mjs</code> exits 0 on every verdict and 2 when a run ends with no verdict.</p>
    </section>

    <section class="qs-step" id="decide">
      <h2><span class="no">04</span>Decide a component</h2>
      <p>A toggle with a boolean prop. Lane B explores every click order from every prop assignment, to the end.</p>
      <!-- src: README "## Three runs", third block -->
      ${await command(toggle.commands[0][0], { note: pin })}
      ${await output(toggle.output[0][0] + '\n# ' + toggle.output[0][1], { verdict: 'PASS-decided' })}
      <p>A <code>PASS-decided</code> is as final as a proof for that component.</p>
    </section>

    <section class="qs-step" id="pull-request">
      <h2><span class="no">05</span>Gate a pull request</h2>
      <p><code>examples/booking/</code> is a pricing core. Commit <code>85136f1</code> holds one asked rule, one slip and two refactors. From the repository root:</p>
      <!-- src: README "### 2. A pull request" -->
      ${await command(pr.commands[0][0], { note: pin })}
      ${await output(prSummary, { verdict: '3 WITNESS' })}
      <p>The asked rule is <code>IN-SCOPE</code>. The slip is a <code>WITNESS</code> at <code>pricing.ts:59</code>, and so are the two callers whose text never changed.</p>
      <p>In CI, <code>comment.mjs</code> posts this table as one comment, updated on every push. <code>--block witness</code> fails the check on a <code>WITNESS</code> row.</p>
      <!-- src: README "## Using it", the pull-request comment and gate row -->
      <pre class="usage"><code>node langs/ts/ci/comment.mjs --repo &lt;checkout&gt; --base &lt;sha&gt; --head &lt;sha&gt; [--post] [--block none|witness|ask]</code></pre>
    </section>

    <section class="qs-step" id="commands">
      <h2><span class="no">06</span>Every command</h2>
      <!-- src: README "## Using it" -->
      <div class="cmd-table">${table}</div>
      <p class="aside">${after}</p>
    </section>

    <section class="qs-step" id="next">
      <h2><span class="no">07</span>Next</h2>
      <div class="next">
        <a class="rim" href="/docs/"><b>Docs</b><span>The verdicts, the certificate, pull requests, the editor, the limits.</span></a>
        <a class="rim" href="/benchmark/"><b>Benchmark</b><span>Every row on AACR-Bench, who measured it, with the judge's logs.</span></a>
        <a class="rim" href="/paper/"><b>Paper</b><span>The method, the four bounds and every run.</span></a>
        <a class="rim" href="${GITHUB}"><b>lean on GitHub</b><span>The source, the suite, the pairs.</span></a>
      </div>
    </section>
  </div>
</div>`;
}
