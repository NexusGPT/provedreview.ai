# The page, section by section

Sources, each pinned to the commit that holds it:

- **lean** `github.com/NexusGPT/lean`, `README.md` at `fe06326`; `CHANGELOG.md` and `langs/ts/tests/pairs/readme_ledger/candidate.ts` at `d0d88fc`.
- **paper** (local repo `unreviewable-throughput/paper`) at `1c557a1`: `v3/sections/00-abstract.tex`, `v3/sections/numbers.tex`, `v3/main.tex`.
- **DA** `github.com/NexusGPT/differential-attestation` at `77b43b0`: `legit/round7/lean-v3/research/open-code-review/d3/RESULT.md`.

Every number in `index.html` carries an HTML comment naming its file and the line or heading it comes from.

## Nav and hero

`variants/q4.html`, kept as the owner picked it: same markup, same CSS rules, now in `styles.css` above the line that opens the sections' rules. Only `href` attributes were added to its anchors (and `id="top"` on the nav), so the links lead somewhere. The headless check compares ten hero boxes against q4 at 1440 and 390 and finds them equal. The koi engine is `engine.js` at the root, copied from `variants/engine.js` (the variants still load their own copy). It keeps the `/public/` paths and every motion parameter. One guard was added: while the hero is off screen the page sets `window.__koiIdle`, the engine stops drawing, and its clock holds, so the swim resumes where it stopped. The hero numbers: the kicker's `0.1.1` is lean's `CHANGELOG.md:5`; the certificate's 17, -1, 1, 0 and the replay flags are README "## Three runs"; the stats row is the same as the counters below. The certificate's `candidate.ts:42` has no source: the slip sits at `candidate.ts:15` in the pair. It is marked `[pending source]` in a comment and left for the lead, since the hero is decided.

## 1. Counters

Five figures in a band under the hero, each with a mono label and one line. AACR-Bench F1 31.6 against 29.0: DA RESULT.md "## Same instances", mean of 3 (31.61 and 29.02). Escaped defects caught 2.2x, 22 against 10 of 43: abstract ("caught 22 of 43, 2.2 times the reader"; the reader "10 of 43"). Planted mutations 120 of 143, none proved equal: abstract. Functions in reach 53 percent of 39,775, 36 repositories: abstract. 917 agent changes in 13 days, about ten a day for a reviewer: abstract.

## 2. Use cases

Three cards. Agent-heavy repositories: 917 in 13 days (abstract), and the WITNESS that carries the source line and the advised rewrite (README "### 5. A coding agent's loop"). Platform teams: one comment per pull request updated on every push, then `--block witness`; the command is the README "## Using it" row for the comment and gate. Researchers: every judge verdict and both judge logs (RESULT.md "Files:"), the conformance suite command (README "## Using it", "## Contributing"), Python at its second milestone with five pairs (README "## What is built and what is planned"). Figure: a branch graph, the candidate commit in orange.

## 3. Core features

Six cards: the three instruments and lean's verdicts, plus the screen row. Recording: the abstract's definition; 22 of 43 caught, 4 of 43 clean changes refused (abstract). Proof: `statement` proved (`Equal_statement: true`, 5 verified, 0 errors) and `Toggle` decided (8 state pairs over 2 assignments), README "## Three runs". Relation: the abstract's definition; with the artifact lane 40 of 43 (`\artunion` in `numbers.tex:12`). WITNESS: the ledger slip and its output, README "## Three runs". PASS-bounded and ASK: `usual/booking.ts`, README "## Writing code lean can prove", and the order rule from "## The verdicts". Screen row: README "## What couples with lean" and the `Search` witness from "### 4. The front end". Figure: a balance.

## 4. Open benchmark

The table: our row first, then Open Code Review; precision, recall, F1 as the mean of three judge rounds over the 184 instances both entries scored (RESULT.md "## Same instances": 34.09, 29.47, 31.61 against 27.72, 30.43, 29.02). Comments are the generated counts of the same-instance rows (1,059 against 1,426). Deltas are ours minus the floor: +6.37, -0.96, +2.59, -367. The caveat: reader models from "## Tokens and dollars" (ours claude-opus-5-5 with a claude-opus-4-8 filter, the floor claude-opus-4-6); 12 of 196 unscored, 11 because GitHub no longer serves the commit and 1 reader failure ("## Instances not scored"). "A same-model run is scheduled" comes from the brief; no committed file states it. The bars: reader 10, recordings 22, recordings plus proof 31, of 43 (abstract), with the clean-change refusals 22 and 4, and 144 defects in six repositories (abstract). Figure: a dial.

## 5. Quick start

Three steps, commands and outputs verbatim from README "## Three runs": clone; the ledger check with its `jq` line and `{"input":17,"floor":-1,"parent":1,"candidate":0}`; the Toggle decision with `PASS-decided -> toggle.json`. The lede is README "## Using it" (lane B needs only Node; without Dafny lane A reports ASK). The image line `docker build -t lean:local .` is README "## What is built and what is planned". Figure: a terminal.

## 6. The paper

The title from `v3/main.tex:20`, one sentence from the abstract, and two buttons: the DA repository and lean on GitHub. Figure: a page.

## 7. Footer

The wordmark, "Differential attestation and lean are built by Nexus.", and links to lean, differential-attestation, the benchmark, the paper and Nexus.

## Reveal and checks

Sections fade up when they cross 92 percent of the viewport height, checked on scroll, resize and by an IntersectionObserver, so a jump (an anchor, a capture) reveals what it lands on. With no script, everything shows. Reduced motion keeps the fade only. `node scripts/check.mjs` (Playwright from `~/.nexus-tools`) loads the page at 1440x900 and 390x844, compares the hero boxes with q4, scrolls through, checks that every `.rv` is revealed, that `scrollWidth <= innerWidth`, that no block's content is wider than its box (html and body hide horizontal overflow, so `scrollWidth` alone cannot see a clipped line), and writes `docs/shots/desktop.png` and `docs/shots/phone.png`.

## The phone hero (second commit, separable)

In q4 the phone block `@media (max-width:960px){…}` comes before the unconditional rules it was meant to override (`.hero h1{font-size:64px}`, `.sub`, `.cert`, `.cert pre`, `.stats`, `#scrim2`). Same specificity, later rule wins, so on a phone the headline stayed at 64 px and "Deterministic" ran 30 px past its column (`h1` scrollWidth 380 against 350). It was cut at the screen edge and hidden from `scrollWidth` by `overflow-x:hidden`. The second commit moves that block below those rules, unchanged. It is a reorder: no value changes. The phone hero then renders as q4's own phone rules say (36 px headline, full-width certificate, vertical scrim). Its boxes at 390 now differ from q4's, so the check's hero-equality line is red at 390 on purpose. At 1440 the hero still matches q4 box for box. The first commit keeps q4 exactly, with the clipped headline.
