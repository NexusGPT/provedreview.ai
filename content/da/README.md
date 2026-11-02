<p align="center">
  <img src="docs/readme/attestation.svg" alt="Differential attestation: the parent and the candidate go through three instruments (recording, proof, relation) and come out as one attestation: PASS, REFUSE with its input and line, or ASK" width="100%">
</p>

<p align="center">
  <a href="#a-real-pull-request">Example</a> · <a href="#three-instruments">Instruments</a> · <a href="#what-it-measured">Benchmark</a> · <a href="#what-it-is-not">What it is not</a> · <a href="#run-it">Run it</a> · <a href="#how-lean-fits">lean</a> · <a href="#repository-map">Map</a>
</p>

---

**Deterministic code review. A proof that the change did only what you asked. Or the input that breaks it, with the line to fix.**

Differential attestation (DA) accepts or refuses a change to a program from evidence about the two versions, the one before and the one after. The evidence comes from three instruments: recordings of the running system, proofs over its functions, and relations declared between its other files. No model takes part in a verdict and the author's account of the change is never an input; a model may only word a finding that an instrument already produced.

Same change, same verdict, every time.

## A real pull request

[immich-app/immich#17879](https://github.com/immich-app/immich/pull/17879) is a public pull request from the AACR-Bench review benchmark. It reworks how album-update notifications are queued. DA ran on it with no model and no human input, from the merge base to the head: <!-- source: research/open-code-review/aacr/data/ts-js-prs.json (id immich-app__immich-17879: merge_base d0014bdf, head b7a12558) -->

```
d0014bdf → b7a12558
5 changed function(s): 4 WITNESS · 0 PASS-proved · 1 PASS-bounded · 0 ASK
```
<!-- source: research/open-code-review/baseline/immich-app__immich-17879.md, lines 1 and 5 -->

One row is the one a reviewer needs:

| file | function | verdict | note |
|---|---|---|---|
| `server/src/services/notification.service.ts` | `NotificationService.handleAlbumUpdate` | **WITNESS** | input 6: outcome; `notification.service.ts:343` |
<!-- source: research/open-code-review/baseline/immich-app__immich-17879.md, the handleAlbumUpdate row -->

The certificate behind that row names the input it drew and the two lines where the versions part:

```
input   { id: "-1", recipientID: "vdiyf", notify: true, force: true, delay: 1, source: "copy" }
parent  notification.service.ts:324   recipientIds.includes(user.id)
cand.   notification.service.ts:343   return JobStatus.SUCCESS;
```
<!-- source: research/open-code-review/baseline/immich-app__immich-17879.json, row NotificationService.handleAlbumUpdate, certificate.lanes.B.witnesses[0] -->

The parent decides, at line 324, whether the recipient belongs to the album. The candidate reaches `return JobStatus.SUCCESS` for the same job without that decision. The benchmark's verified reviewer note on these lines says the same thing in words: <!-- source: research/open-code-review/aacr/data/aacr_bench.jsonl, immich-app__immich@b7a1255, reference comment at notification.service.ts:309-312 -->

> The previous logic that verified recipients were actually part of the album has been removed. Consider adding validation to ensure the recipientID belongs to this album before sending notifications.

**Impact.** A human reviewer wrote that note after reading the diff. DA produced the same finding as an input you can replay and two source lines, with no reader at all. The finding is checkable: run the two versions on that input and watch them end differently. <!-- source: research/open-code-review/baseline/GT-READING.md, immich-app/immich#17879 G6: covered by R4 -->

## Three instruments

Each instrument compares the two versions and refuses on evidence. Each one covers a gap of the others.

**Recording.** The system runs under a fixed set of stimuli before and after the change: pages, responses, rows, messages, outbound requests. Any difference outside the scope the requester selected is refused at its location. The difference inside the scope must equal an edit the requester made on a real recording of the old version, and when it does not, the requester sees both renders and picks. It catches what no text shows: a file left out of the build, a sibling not updated, a page that renders differently. It certifies only the stimuli it ran. <!-- source: paper v3 sections/03-method.tex, "The six checks"; the paper is outside this repository, see the last section -->

**Proof.** For every function the change was not meant to touch, a differential equivalence checker, [lean](https://github.com/NexusGPT/lean), proves the new version equal to the old one for every input, or returns an input on which they differ. The immich row above is this instrument. It decides only inside a stated subset of the language; outside it, it still runs both versions and says how far it looked.

**Relation.** For every file that is not a function (build and pipeline configuration, locale files, schemas, documents), a predicate compares the two versions. The predicate is derived from an authoritative file or declared outside the change, so the change cannot switch it off. On the same benchmark run it refused a pull request that added `translation.settings.defaultaides` to `en-us.json` and not to `zh-cn.json`, the key mismatch two verified reviewer notes name. It knows only the relations someone derived or declared. <!-- source: research/open-code-review/baseline/TABLE.md, "Covered", CherryHQ__cherry-studio-5540 G0 and G3 by AL locale_siblings -->

A verdict is **PASS** (only the asked change), **REFUSE** (the location, the input or the artifact, both outcomes, the lines) or **ASK** (what could not be decided, by name).

## What it measured

### On defects that escaped human review

Six repositories we operate, defects that passed review and were repaired later, each paired with a clean change of similar size. The same 43 defects and 43 clean changes, under one pre-registered counting rule: a catch counts only when the refusal lands on what the repair fixed. <!-- source: paper v3 sections/04-results.tex, "Experimental setup" -->

| | defects caught, of 43 | clean changes refused, of 43 |
|---|---|---|
| strongest model reader | 10 | 22 |
| recordings | 22 | 4 |
| recordings + proof | 31 | |
| recordings + proof + relations (DA) | 40 | 6 |
<!-- source: paper v3 sections/00-abstract.tex (10, 22, 22, 4, 31, 40 of 43) and sections/numbers.tex (\daall 40, \dacleanall 6, \artunion 40 of 43) -->

Two readers from different vendors missed the same defects. Most escaped defects were not in the text a reader receives: a request a provider rejects, a cache key missing an input, a job moved to a runner too small for it. <!-- source: paper v3 sections/01-intro.tex -->

Caveats: the repositories are private (the numbers and their hashes are published in the paper); one team designed and judged the experiments; only defects repaired with a note enter the corpus. <!-- source: paper v3 sections/05-limitations.tex -->

### On a public review benchmark

[AACR-Bench](research/open-code-review/d3/RESULT.md) scores review comments against verified reference notes, with a model judge. The official pipeline ran unchanged, three judge rounds, judge claude-opus-5-5. DA entered as a composed entry: a model reader writes comments, the gate and lean check the ones on TypeScript and JavaScript code. Both entries counted over the 184 instances both scored, mean of three rounds: <!-- source: research/open-code-review/d3/RESULT.md, "Same instances" -->

| entry | precision | recall | F1 | comments |
|---|---|---|---|---|
| DA composed (reader + gate + lean) | 34.09 % | 29.47 % | **31.61 %** | 1,059 |
| Open Code Review, the published reader | 27.72 % | 30.43 % | 29.02 % | 1,426 |
<!-- source: research/open-code-review/d3/RESULT.md, "Same instances" (mean of 3) and "Scores" (1,059 generated; 1,426 on the 184 common instances) -->

Read it with three caveats:

- **The readers ran on different models.** Ours on claude-opus-5-5 with a claude-opus-4-8 filter, the floor on claude-opus-4-6. <!-- source: research/open-code-review/d3/RESULT.md, "Tokens and dollars" -->
- **This entry checks the reader's comments; it does not yet run the instruments first.** A filter raises precision and cannot raise recall. 12 of 196 instances are unscored: 11 commits GitHub no longer serves, 1 reader failure. <!-- source: plans/2026-10-30-instruments-first/PLAN.md, "What is wrong today"; research/open-code-review/d3/RESULT.md, "Instances not scored" -->
- **The ceiling is behaviour.** Six readers classed every reference note the entry missed, over all 184 instances. 403 of 997 are behaviour (278 inside one function, 125 that need a run); catching all of them takes recall from 29.5 % to 58.0 %. The 363 surface notes (naming, wording, docs) are a reader's job, and no instrument is tuned for them. <!-- source: research/open-code-review/d3/read/COLLATE.md (403 of 997, 278, 125, 363); research/open-code-review/d3/read/IMPROVEMENTS.md, "What this says about the bar" (58.0 %) -->

With no model at all, lean and the relation predicates on the benchmark's 41 TypeScript and JavaScript pull requests exhibit the named defect for 8 of 413 verified notes, and show the mechanism for 26 more; the immich example above is one of the 8. <!-- source: research/open-code-review/baseline/TABLE.md, "The two numbers" -->

The structure being built now runs the instruments first: lean on every changed unit, the repository's own tests recorded at both commits in every language, and the reader only explains each finding. Plan: [`plans/2026-10-30-instruments-first/PLAN.md`](plans/2026-10-30-instruments-first/PLAN.md).

### The project's own benchmark

[`benchmark/`](benchmark/README.md) measures DA plus lean as a vector of counts, never one accuracy number, over four lanes: <!-- source: benchmark/manifests/*.json, field count -->

1. Public defects: 496 cases, the 453 BugsJS bugs and 43 of ours, every one labelled DIFF.
2. Clean changes: 120 behaviour-preserving refactors, labelled EQ by a mechanically checked transformation.
3. Generated stress: 141 planted mutations from a frozen generator.
4. Held-out: 85 real pull requests merged after 2026-10-26 07:52 UTC. Only [the seal](benchmark/manifests/lane4-held-out.v1.seal.json) is in git; the cases stay with a custodian and only the scorer reads them. <!-- source: benchmark/manifests/lane1-public-defects.v1.json (count 496), lane2-clean.v1.json (120), lane3-generated-stress.v1.json (141), lane4-held-out.v1.seal.json (count 85, cutoff 2026-10-26T07:52:33Z); benchmark/README.md (453 BugsJS, 43 ours) -->

On the planted mutations of the soundness battery, lean found a separating input for 120 of 143 and proved none of them equal. Its proof subset admits 53 percent of 39,775 functions written before the subset existed. <!-- source: soundness-v7.md lines 3 and 4 (143, 120); harness/regress-floors.json R6 (plan_percent 53, plan_units 39775) -->

## What it is not

- **Not a linter.** A linter flags patterns in one version. DA compares two versions and refuses on a difference it can show.
- **Not an opinion.** No verdict comes from a model or a reviewer. A PASS-bounded says how far it looked and never becomes a proof.
- **Not a style guide.** Naming, wording and documentation remarks stay with a human or a reader.
- **Not an intent reader.** Only the requester says what was meant to change, by selecting a scope and editing a real recording. A wrong edit releases a wrong outcome. <!-- source: paper v3 sections/05-limitations.tex -->

## Run it

The proof instrument needs Node 24; Python 3 and Dafny 4 add the proof lane, and without them lean answers ASK there. <!-- source: lean's README at the pinned submodule commit, "Using it" -->

```bash
git clone https://github.com/NexusGPT/differential-attestation && cd differential-attestation
git submodule update --init lean            # the checker, pinned to the admitted lean master

# one pull request: every changed function and its callers, one table
node lean/langs/ts/pr.mjs --repo <checkout> --base <base sha> --head <head sha> --scope <function,Class.method>

# the regression table that admits a lean head (rows R1 to R11 against their floors)
harness/regress.sh "$PWD/lean"

# the benchmark: run, then score
python3 -I benchmark/run.py --lean lean --manifest benchmark/manifests/lane2-clean.v1.json --slice 20 --jobs 4
python3 -I benchmark/score.py --manifest benchmark/manifests/lane2-clean.v1.json --results <run dir> --require-eligible

# recount the AACR-Bench table from the committed records (no model call)
python3 research/open-code-review/d3/harness/tables.py <floor dir> <composed dir> <floor judge.jsonl> <composed judge.jsonl> --out tables.json
```

To replay the immich example, check out `immich-app/immich` and run `pr.mjs` with `--base d0014bdf --head b7a12558`; the committed report is [`baseline/immich-app__immich-17879.md`](research/open-code-review/baseline/immich-app__immich-17879.md). A newer lean can word a line differently; the verdict and the input are what the certificate fixes.

## How lean fits

lean is one instrument of DA: the proof. It takes two versions of one function and returns a theorem, a decided state space, a bounded run or a separating input, with a certificate anyone can re-run. Code written inside lean's subset gets the strongest answer, because the next change to it is a theorem rather than a test: in lean's own example, a loop rewritten as a `filter` and a `map` is proved equal for every input, and a `<=` written for `<` comes back as the input that lands on the floor. How lean works, its verdicts and how to write code it can prove: [github.com/NexusGPT/lean](https://github.com/NexusGPT/lean). DA pins it as the [`lean`](lean) submodule and adds what one function cannot see: recordings, relations, the gate that joins them, and the benchmark.

A lean head reaches lean's `master` only with every row of the regression table at or above its floor. The rows and floors are [`harness/regress.sh`](harness/regress.sh) and [`harness/regress-floors.json`](harness/regress-floors.json); a floor moves only with a written reason. Each work lane leaves one report in [`harness/lanes/`](harness/lanes/). <!-- source: harness/regress.sh (ROWS R1 to R11) -->

## Repository map

| path | what |
|---|---|
| [`lean`](lean) | the checker, a submodule pinned to the admitted lean master |
| [`harness/`](harness/) | the regression table, census and proof-hunt tools, one report per work lane in `lanes/` |
| [`benchmark/`](benchmark/README.md) | the DA plus lean benchmark: manifests, schema, `run.py`, `score.py`, `compare.py`, the witness replayer |
| [`research/open-code-review/`](research/open-code-review/) | the AACR-Bench runs: the no-model baseline, the composed entry ([`d3/`](research/open-code-review/d3/RESULT.md)) and the miss read |
| [`census/`](census/) | reach of the proof subset per repository and lean head |
| [`results/`](results/), `results-*/` | concept instances and design-defect trees per lean head |
| [`corpus.json`](corpus.json), [`corpus.md`](corpus.md) | the defect corpus the regression rows run on |
| [`plans/`](plans/), [`lane/`](lane/) | the plans and the lane results |

## The paper

*Differential Attestation: Accepting Agent-Written Changes from Recordings, Proofs and Declared Relations, Never from the Producer's Account*, draft of 26 October 2026. It holds the method, the four bounds <!-- source: paper v3 sections/03-method.tex, "Four bounds" --> on what a gate can observe and a proof can decide, and every run, failures included. It motivates the work with one repository where agents merged 917 changes in 13 days, against about ten a day for one reviewer. <!-- source: paper v3 main.tex (title, date) and sections/01-intro.tex (917, 13, ten) --> The paper is not in this repository yet.
