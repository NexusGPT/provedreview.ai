---
title: The four lanes
order: 3
lede: The project's own benchmark measures DA plus lean as a vector of counts over four lanes, never as one accuracy number.
sources: da:benchmark/README.md, da:README.md, da:docs/architecture/benchmark-funnel.md
---

The benchmark is the measurement contract of "An Honest Benchmark for Change-Checker Trust and Coverage", section 7, version 1. It answers "where does DA plus lean stand?" with a vector of counts and denominators, plus a non-compensating proof-soundness eligibility rule. It never collapses to one accuracy number. It is separate from [DA-Bench](/docs/benchmark/da-bench/).

## The four lanes

| lane | what | truth |
|---|---|---|
| 1, public defects | 496 cases: all 453 BugsJS bugs and 43 of ours | DIFF by reproducing test (BugsJS), DIFF by documented fix only (ours) |
| 2, clean | 120 behaviour-preserving refactors, BugsJS JS and nexus TS | EQ by a mechanically checked transformation |
| 3, generated stress | 141 planted mutations (the manifest count; 143 were generated, two fell to selection), generator and selection frozen, classes kept apart | lean's own witnesses (producer evidence) |
| 4, held out | 85 real pull requests merged after 2026-10-26 07:52 UTC | sealed |

A manifest whose records hash differs from the registry in `manifests/MANIFEST-HASHES.json` is refused.

Lane 3 has a second manifest, v2: 980 mutants of an outside generator (StrykerJS's instrumenter, no model, no lean mutation code, no outcome-based selection). Each mutant starts UNRESOLVED. It becomes DIFF only when a witness is independently confirmed.

## The held-out seal

Lane 4 is the seal only: `manifests/lane4-held-out.v1.seal.json`. Only the seal is in git. The cases stay with a custodian and only the scorer reads them. The lead and every lean lane do not open `benchmark/held-out/**`. `run.py` reads it, and `score.py --aggregate-only` releases the vector without case ids.

## Run and score

One command runs lean's `pr.mjs` over the manifests, then the scorer:

```bash
python3 -I run.py --lean <lean git checkout> --manifest manifests/lane1-public-defects.v1.json --manifest manifests/lane2-clean.v1.json --slice 20 --jobs 4
python3 -I score.py --manifest <m> --results <run dir> --require-eligible
python3 -I tests/test_score.py
python3 -I build/freeze.py
```

From the repository root, the same pair for one lane:

```bash
python3 -I benchmark/run.py --lean lean --manifest benchmark/manifests/lane2-clean.v1.json --slice 20 --jobs 4
python3 -I benchmark/score.py --manifest benchmark/manifests/lane2-clean.v1.json --results <run dir> --require-eligible
```

`run.py` writes the run folder. `score.py` writes `vector.json` and `table.md`. `tests/test_score.py` goes red when a false proof is planted in a result file. `build/freeze.py` alone writes the hash registry.

## Rules the scorer applies

- The unit is a change. A change is judged by every changed-function row lean reports.
- WITNESS if any row witnesses. PROVED if every row is PASS-proved or PASS-decided. BOUNDED if every row is a pass and one is bounded. ASK otherwise. OUTSIDE-COVERAGE if lean lists no row. CRASH and NOT-RUN stay in every population denominator.
- A false proof is PROVED on a DIFF case. It is confirmed when the DIFF label rests on independent executable evidence, suspected otherwise.
- Any confirmed false proof makes the version INELIGIBLE. A suspected one makes it PENDING. ELIGIBLE states how many proof outputs it rests on.

## The vector of counts

Each scoring command writes `coverage-vector.md` beside the run results and keeps the same data under `coverage_vector` in `vector.json`. It prints eight dimensions: file capture, syntax listing, change routing, terminal accounting, admissibility, model fidelity, witness reproducibility and decision. Each measure names its numerator, denominator, residue, source, frame and label.

Decision prints **answered** (PROVED or WITNESS) and **correct** (PROVED on EQ or claimed WITNESS on DIFF) over the same complete frozen manifests, before run selection. BOUNDED never counts as an answer.

Labels are `exact` within a named finite frame, `estimated` under stated assumptions, `unbounded` with explicit limits, or `not measured`. Unlabelled figures and unsourced measured figures fail rendering.

### The funnel

`funnel` in `benchmark/score.py` counts each stage over the population that reached it: registered changes; hunks; enumerated units; listed changes; ledger rows; eligibility; rule admission; translation; decision; decided changes; correctness. Each stage prints what stopped there, by class. See [Benchmark funnel](/docs/differential-attestation/benchmark-funnel/).

## Known limits of v1

- Lean's own witnesses still label the planted mutants (producer evidence). The replayer reports on witnesses and does not relabel a manifest.
- Runs use clones without installed dependencies. An import lean cannot resolve becomes an ASK.
- The BugsJS reproducing tests are imported as published, not re-executed here.
- The clean-lane justification uses the same TypeScript parser as lean, a common-mode dependency named in each record.
