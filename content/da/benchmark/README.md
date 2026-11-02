# DA plus lean benchmark, v1

The measurement contract of "An Honest Benchmark for Change-Checker Trust and Coverage", section 7, version 1.
It answers "where does DA plus lean stand?" with a vector of counts and denominators, plus a non-compensating
proof-soundness eligibility rule. It never collapses to one accuracy number.

## Files

| path | what |
|---|---|
| `schema/change-record.v1.schema.json` | the change record: repository, before and after commits, lockfiles, runtime image, changed functions, intended change, truth (EQ, DIFF, UNRESOLVED) under a named observation model with graded evidence, authorization (requested, unintended, unresolved), eligibility, licence |
| `schema/observation-models.v1.json` | what each truth label observes and excludes |
| `manifests/lane1-public-defects.v1.json` | lane 1: all 453 BugsJS bugs (DIFF by reproducing test) and our 43 defects (DIFF by documented fix only) |
| `manifests/lane2-clean.v1.json` | lane 2: 120 behaviour-preserving refactors (EQ by a mechanically checked transformation), BugsJS JS and nexus TS |
| `manifests/lane3-generated-stress.v1.json` | lane 3: the 141 planted mutations (the manifest count; 143 were generated, two fell to selection), generator and selection frozen, classes kept apart |
| `manifests/lane4-held-out.v1.seal.json` | lane 4: the seal only; the cohort sits in `held-out/` (custodian folder, see its README) |
| `manifests/MANIFEST-HASHES.json` | the frozen registry: a manifest whose records hash differs is refused |
| `build/*.py` | the builders, one per lane, and `freeze.py` |
| `run.py` | one command: lean `pr.mjs` over manifests, then the scorer |
| `score.py` | the result vector and the eligibility rule |
| `tests/test_score.py` | goes red when a false proof is planted in a result file, and on the replay columns (test 8) |
| `replay/` | the independent witness replayer (plain Node, no lean code) and its README |
| `replays/<run>/` | the replay file of a run: `replay.json`, `replay.md` |
| `patches/` | the frozen patch of every synthetic after-commit (lanes 2 and 3) |

## Commands

```
python3 -I run.py --lean <lean git checkout> --manifest manifests/lane1-public-defects.v1.json --manifest manifests/lane2-clean.v1.json --slice 20 --jobs 4
python3 -I score.py --manifest <m> --results <run dir> --require-eligible
python3 -I tests/test_score.py
python3 -I build/freeze.py
```

## Rules the scorer applies

- The unit is a change. A change is judged by every changed-function row lean reports (function-level truth: the named function's row).
- WITNESS if any row witnesses; PROVED if every row is PASS-proved or PASS-decided; BOUNDED if every row is a pass and one is bounded; ASK otherwise; OUTSIDE-COVERAGE if lean lists no row; CRASH and NOT-RUN stay in every population denominator.
- A false proof is PROVED on a DIFF case. Confirmed when the DIFF label rests on independent executable evidence; suspected otherwise.
- Eligibility: any confirmed false proof makes the version INELIGIBLE; a suspected one makes it PENDING; ELIGIBLE states how many proof outputs it rests on.
- Witness recall and precision after independent replay come from `replays/<run>/replay.json` (`replay/README.md`): recall is confirmed DIFF cases over DIFF cases, precision is confirmed cases over claimed WITNESS cases, beside the producer's claimed counts. A WITNESS case is confirmed when any of its scored WITNESS rows is, refuted when all are, not-replayed when a row has no replay row. Without a replay file both read n/a.

## Known limits of v1

- Lean's own witnesses still label the planted mutants (producer evidence): the replayer reports on witnesses, it does not relabel a manifest.
- Runs use clones without installed dependencies; an import lean cannot resolve becomes an ASK.
- The BugsJS reproducing tests are imported as published, not re-executed here.
- The clean-lane justification uses the same TypeScript parser as lean (a common-mode dependency, named in each record).

## Coverage frames

Each scoring command writes `coverage-vector.md` beside the run results (override with `--coverage <path>`),
and retains the same data under `coverage_vector` in `vector.json`. It prints eight dimensions: file capture,
syntax listing, change routing, terminal accounting, admissibility, model fidelity, witness reproducibility,
and decision. Each measure names its numerator, denominator, residue, source, frame and label. Admissibility
keeps language, environment and policy apart; it needs an independently accounted syntax frame.

The census measure is **admissibility among currently listed units**. It does not establish that all units
were listed. The existing listed-unit funnel remains a conditional diagnostic, not an independent syntax census.

Decision prints **answered** (PROVED or WITNESS) and **correct** (PROVED on EQ or claimed WITNESS on DIFF)
over the same complete supplied frozen manifests, before run selection. Missing or unselected changes remain
in the residue; BOUNDED never counts as an answer. Correct is label-consistency after adjudications, not a
claim that every witness replays. Witness reproducibility separately counts independently confirmed cases
among all claimed WITNESS cases in the run. Existing result/comparison groups retain their selected-group
frames and print both answer and correct-decision rates; `decision_coverage` retains its existing JSON meaning.

Labels are `exact` within a named finite frame, `estimated` under stated assumptions, `unbounded` with explicit
limits, or `not measured`. Missing-source cells print `not measured` with the responsible board row in place
of every number: file/hunk/unit frames `4ddbd302`, syntax listing `aeda6f55`, terminal accounting `af675970`,
model/runtime audit `24a0a9a9`; missing replay input is tracked by scorer row `9fea0ed4`.
Unlabelled figures, unsourced measured figures, and numeric missing-source cells fail rendering.
