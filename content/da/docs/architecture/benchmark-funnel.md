# The benchmark funnel (plan D)

## What it is

`benchmark/README.md` is the source. The benchmark is the measurement contract of "An Honest Benchmark for Change-Checker
Trust and Coverage", section 7, version 1. It answers "where does DA plus lean stand?" with a vector of counts and
denominators and a non-compensating proof-soundness eligibility rule, and it never collapses to one accuracy number. One
command runs lean's `pr.mjs` over frozen manifests and then the scorer:

```
python3 -I benchmark/run.py --lean <lean git checkout> --manifest <m> ... --jobs 4
python3 -I benchmark/score.py --manifest <m> --results <run dir> --require-eligible
```

## The populations

| lane | manifest | records (`benchmark/manifests/MANIFEST-HASHES.json`) | truth |
|---|---|---|---|
| 1, public defects | `benchmark/manifests/lane1-public-defects.v1.json` | 496: all 453 BugsJS bugs and our 43 defects | DIFF by reproducing test, or by documented fix only |
| 2, clean | `benchmark/manifests/lane2-clean.v1.json` | 120 behaviour-preserving refactors | EQ by a mechanically checked transformation |
| 3, generated stress v1 | `benchmark/manifests/lane3-generated-stress.v1.json` | 141 planted mutations | lean's own witnesses (producer evidence) |
| 3, generated stress v2 | `benchmark/manifests/lane3-generated-stress.v2.json` | 980 mutants of the outside generator | DIFF only when a witness is independently confirmed |
| 4, held out | the seal `benchmark/manifests/lane4-held-out.v1.seal.json` | 85 | sealed |

A manifest whose records hash differs from the registry is refused.

## The outside mutant generator

`benchmark/build/STRYKER-V2.md` and `benchmark/build/stryker/generate.mjs`. The adapter parses the parent files with
TypeScript only to locate the named function declarations (parameter defaults included), then calls StrykerJS's
unmodified instrumenter, `@stryker-mutator/instrumenter@9.6.1` (Apache-2.0, pinned by
`benchmark/build/stryker/package-lock.json`), with its complete default operator set. No test runner, no lean mutation
code, no type checking, no model and no outcome-based selection is used. Every unique resulting file is one mutant. The
candidate population: 980 unique mutants, 981 upstream applications, 55 parent units. Each mutant starts UNRESOLVED;
the union of independently confirmed witnesses of two pinned lean heads becomes DIFF, and the rest stays UNRESOLVED.

## The composed entry

Plan D2 runs Open Code Review's prompts and six tools as a Nexus agent inside a workflow, routes TypeScript and
JavaScript comments to `gate.check_unit`, and applies C4's filter. The pieces:
`research/open-code-review/D2-D3-PLAN.md` (the plan), `research/open-code-review/OCR/d2/` (reader, gate call, filter,
fallback routing, harness), `research/open-code-review/OCR/d2/filter/RULE.md` (drop a comment only when its unit is
PASS-proved or PASS-decided and it alleges a behaviour change), `research/open-code-review/d3/harness/composed.py` (one
instance at a time, results in the pipeline's `ocr` shape) and the result `research/open-code-review/d3/RESULT.md`.

From `research/open-code-review/d3/RESULT.md` (AACR-Bench's official pipeline, 3 rounds, judge `claude-opus-5-5`):

| entry | precision, mean of 3 | recall, mean of 3 | F1, mean of 3 | instances scored |
|---|---|---|---|---|
| OCR floor (`claude-opus-4-6`) | 27.75 % | 30.40 % | 29.02 % | 185 of 196 |
| composed (d2-reader + gate + C4) | 34.09 % | 29.47 % | 31.61 % | 184 of 196 |

Its gate rows: 1,059 reader comments, 296 routed to the gate path, 127 gate calls, C4 input, kept and dropped
296, 296 and 0, 104 kept with a witness attached.

## The funnel, with a denominator per stage

`funnel` in `benchmark/score.py` (board row `c43a2c4a`) counts each stage over the population that reached it:
registered changes; hunks; enumerated units; listed changes; ledger rows; eligibility (over listed units); rule
admission (over eligible units); translation (over admitted units); decision (over translated units); decided changes;
correctness (over decided changes). Each stage prints what stopped there, by class. `benchmark/README.md`, "Coverage
frames", adds eight dimensions, each with numerator, denominator, residue, source, frame and label.

## The sealed held-out lane and its keeper

`benchmark/manifests/lane4-held-out.v1.seal.json` holds the count (85), the records' sha256, the cut-off
(`2026-10-26T07:52:33Z`, "the newest commit any lean lane has read"), the location `benchmark/held-out/manifests/` and
the access rule: "the lead and every lean lane do not open benchmark/held-out/**; run.py reads it and score.py
--aggregate-only releases the vector without case ids". `.gitignore` keeps `benchmark/held-out/` out of git. Its
custodian, per the seal: "interim: lane benchmark-v1 (built it; prints aggregates only). Permanent custodian: to be named
by the owner". This page did not open the held-out folder.

## Who writes and who reads

The builders under `benchmark/build/` write the manifests and `benchmark/build/freeze.py` alone writes the hash registry.
`benchmark/run.py` writes the run folder; `benchmark/score.py` writes `vector.json` and `table.md`. The replayer under
`benchmark/replay/` writes `benchmark/replays/<run>/`. The owner reads `table.md` and `vector.json`.

## Tests

`benchmark/tests/test_score.py` (a planted false proof makes the version INELIGIBLE; test 10, the funnel: every stage its
own denominator, every listed unit classified once), `benchmark/tests/test_run.py`, `benchmark/tests/test_ledger.py`,
`benchmark/tests/test_compare.py`, `benchmark/tests/test_compare_ledger.py`, `benchmark/build/stryker/generate.test.mjs`,
`benchmark/build/test_lane3_v2_stryker.py`, `research/open-code-review/OCR/d2/filter/tests/test_filter.py`,
`research/open-code-review/d3/harness/tests/`.

## Worked example: the funnel of the outside generator's population

`benchmark/runs/lane3v2-final-v2-fea80f8/table.md`: lean `fea80f8`, manifest `lane3-generated-stress.v2.json`, proof
eligibility NO-PROOF-OUTPUTS.

| stage | counted in | passed | stopped here |
|---|---|---|---|
| registered changes | change | 980 | |
| hunks | hunk | not recorded by lean at this head | |
| enumerated units | unit | not recorded by lean at this head | |
| listed changes | change | 980/980 | |
| eligibility | listed unit | 707/980 | missing dependency 273 |
| rule admission | eligible unit | 325/707 | primary rule: `ts-strict` 182, `type-assertion` 115, `number-special` 24, `spread` 23, `receiver-mutation` 21, `implicit-this` 16, `unsupported-member` 1; refused but lane B witnessed: 233 |
| translation | admitted unit | 323/325 | unsupported 2; lane B WITNESS without translation: 272 |
| decision | translated unit | 273/323 | WITNESS 272, PASS-bounded 43, ASK 7, PASS-proved 1 |
| decided changes | change | 677/980 | WITNESS 676, BOUNDED 264, ASK 39, PROVED 1 |
| correctness | decided change | 33/677 | label unresolved 644 |

Each unit stage counts over the units that passed the stage before it (980, 707, 325, 323). The change stages count over
the 980 registered changes, and correctness over the 677 decided ones.

## Gaps between plan and code

1. **The README lags the manifests.** `benchmark/README.md` gives lane 3 as "the 143 planted mutations"; the registry
   holds 141 records for v1. The README lists neither the v2 manifest, nor the outside generator, nor the composed
   entry, nor the funnel by its stages (it calls "the existing listed-unit funnel" a conditional diagnostic).
2. **Two stages have no count.** Hunks and enumerated units read "not recorded by lean at this head" (lean board row
   `4ddbd302`): lean reports changed functions, not the hunks it read or every unit it enumerated.
3. **Correctness rests on 33 labels.** On the v2 population 644 of 677 decided changes carry an unresolved label.
   `benchmark/build/STRYKER-V2.md` says the DIFF discovery depends on the inputs the two checkers find and "is not an
   independent estimate of the total semantically different population".
4. **The composed entry's floor uses another model.** Plan D's floor is "OCR's published number with the same model,
   re-run by us once". The floor reader ran `claude-opus-4-6`; the composed reader ran `claude-opus-5-5` with a
   `claude-opus-4-8` filter (`research/open-code-review/d3/RESULT.md`, "Tokens and dollars"). Plan D3 says "all 200 pull
   requests"; the converted file holds 196 instances and 184 were scored.
5. **The filter dropped nothing.** C4 dropped 0 of the 296 gate-path comments on the full run.
6. **The keeper is named two ways.** The seal names an interim custodian (lane benchmark-v1) and leaves the permanent one
   to the owner. This repository's `README.md` says "The owner is the custodian". The seal was not updated.
7. **No committed coverage frames.** The README says each scoring command writes `coverage-vector.md` and a
   `coverage_vector` key in `vector.json`. None of the eleven committed `benchmark/runs/*/vector.json` carries the key,
   and no run folder holds a `coverage-vector.md`.
8. **A generator note points elsewhere.** `benchmark/build/STRYKER-V2.md` says its paths are relative to the lane worktree
   `/Users/assem/nexus/nexus-organisation/work/lean-lanes/mutant-generator-W/benchmark/build`, not to this repository.
