---
title: Pull requests and CI
order: 5
lede: A pull request becomes one table, one row per changed function, posted as one comment and optionally a blocking check.
sources: lean:docs/pull-requests.md, lean:README.md
---

Every output below is a real run on the booking example, commit `85136f1`: one asked rule (percent promotions capped at half the unit price), one slip (`>=` became `>` in the free-delivery test), two refactors that keep behaviour.

## The table

```bash
node langs/ts/pr.mjs --repo . --base 85136f1~1 --head 85136f1 --scope unitDiscount
```

> 4 changed function(s); 5 unchanged caller(s) checked through lane B, 2 with a WITNESS through a changed callee: **1 in scope · 3 WITNESS · 1 PASS-proved · 0 PASS-decided · 1 PASS-bounded · 0 ASK · 0 REFUSE · 0 NEW**

| file | function | verdict | coverage | lane B | lane A | note |
|---|---|---|---|---|---|---|
| examples/booking/pricing.ts | `unitDiscount` (35-46) | **IN-SCOPE** | checked | PASS-bounded |  | declared in scope but no difference found within the bound |
| examples/booking/pricing.ts | `deliveryFee` (57-60) | **WITNESS** | checked | WITNESS |  | input 11: outcome; examples/booking/pricing.ts:59 |
| examples/booking/pricing.ts | `formatCents` (101-109) | **PASS-proved** | checked | PASS-bounded | PASS-proved |  |
| examples/booking/service.ts | `cleanCart` (26-36) | **PASS-bounded** | checked | PASS-bounded | ASK:identity |  |
| examples/booking/pricing.ts | `quoteShop` (62-74) | **WITNESS** | checked | WITNESS |  | input 0: through deliveryFee (changed; its own row is WITNESS), unitDiscount (changed; its own row is IN-SCOPE); this function's text is unchanged; examples/booking/pricing.ts:73 |
| examples/booking/pricing.ts | `quoteAll` (76-83) | **WITNESS** | checked | WITNESS |  | input 52: through deliveryFee (changed; its own row is WITNESS), unitDiscount (changed; its own row is IN-SCOPE); this function's text is unchanged; examples/booking/pricing.ts:82 |

Reviewers read the declared scope and the asks, not the diff. The slip nobody asked for is a `WITNESS` at `pricing.ts:59`, and so are the two callers whose text never changed. A test suite passes this pull request unless a test sits exactly on the threshold.

A function nobody touched is still in the table when a function it calls changed, with the callee named. A `WITNESS` names the statement on each side that produced the first differing effect or the return (`witness.where.lines`, with the file, the lines and the text). It carries the lint's advice when its table has an entry at that statement.

**Scope is optional and declared, never inferred.** Without it every difference is a `WITNESS`. With it, a function named as meant to change reports `IN-SCOPE` with its lane B result: information rather than a finding. The producer of a change is never consulted.

## Every changed function has a row

The `coverage` column says what lean did with the function:

| coverage | meaning |
|---|---|
| `checked` | a verdict exists |
| `refused:<rule>` | the lint's first rule; lane B's verdict is kept in the row |
| `failed:loader`, `failed:timeout`, `failed:translation-defect`, `failed:harness` | no usable verdict |
| `skipped:binary`, `skipped:secret-path` | never read (`.env`, keys, certificates) |

A JavaScript file is read unit by unit like a TypeScript file. A unit whose parameters carry no declared type is `refused:untyped-js`. The intake is one pure function, `selectUnits`, used by the run and by `--preview`, which prints the intake table and runs no lane:

```text
$ node langs/ts/pr.mjs --repo . --base 85136f1~1 --head 85136f1 --preview
| file | unit | coverage | decision | reason |
|---|---|---|---|---|
| `examples/booking/pricing.ts` | unitDiscount | pending | check | selected for checking |
| `examples/booking/pricing.ts` | deliveryFee | pending | check | selected for checking |
| `examples/booking/pricing.ts` | formatCents | pending | check | selected for checking |
| `examples/booking/service.ts` | cleanCart | pending | check | selected for checking |
```

## A run stops by name, never by a kill

`--time-budget <seconds>` and `--unit-budget <n>` bound the whole run. The spending order is fixed and written into the report: changed functions, then unchanged callers of changed callees. A function not reached gets `skipped:budget` with its position. The report carries `stop: { reason, reached, total }`. The comment's block rule treats a stop as not green.

```text
$ node langs/ts/pr.mjs --repo . --base 85136f1~1 --head 85136f1 --scope unitDiscount --unit-budget 2
# lean report: 85136f1~1 → 85136f1; stopped: unit-budget after 2 of 9 units
| examples/booking/pricing.ts | `formatCents` (101-109) | **** | skipped:budget |  |  | stop at unit 3 of 9 |
```

## A push re-checks only what changed

The report carries a run identity: the two commits, the function set, lean's own commit, the library and advice tables, the Dafny version. Each function carries a key over its two texts, its same-file callees, the file outside its functions, the files it imports and the tsconfig. A certificate under the cache directory is reused when the key matches, with the row marked `reused`. `--fresh` reads no cache.

On the booking pull request, the second run reuses all six rows:

```text
$ node langs/ts/pr.mjs --repo . --base 85136f1~1 --head 85136f1 --scope unitDiscount --cache-dir <dir> --out pr.md   (twice)
first run:   6 function(s) -> pr.md    real 23.72 s
second run:  6 function(s) -> pr.md    real 7.79 s; 6 rows reused; the same identity 8ec314c5…
```

The key stops at one import level and does not see module initialization order.

## Options

```text
node langs/ts/pr.mjs --repo <checkout> --base <ref> [--head <ref>] [--scope f,Class.m] [--preview] [--time-budget <s>] [--unit-budget <n>] [--out report.md]
```

`bin/lean` wraps `check`, `lint`, `pr` and `census` as one entry point. Every argument is passed through and the exit code is the script's.

## In CI

`langs/ts/ci/comment.mjs` posts the table as one comment, updated on every push. The reusable workflow `.github/workflows/lean-pr.yml` runs it from a caller of a few lines, pinned by commit.

```text
node langs/ts/ci/comment.mjs --repo <checkout> --base <sha> --head <sha> [--post] [--block none|witness|ask]
```

- `--block none` only comments.
- `--block witness` fails the check on any `WITNESS` row.
- `--block ask` fails on `WITNESS` or `ASK`.
- A row declared `IN-SCOPE` never blocks.
- Each blocking row is annotated at its file and line.

Every refusal of a run is also a JSON record in `.lean/runs/<identity>.refusals.json`. `--inline` posts each as a review comment at its lines, skipping a range that already carries one.

### The order that works

1. A shadow run on the last few dozen merged pull requests, nothing blocking. Read three things: the share of `ASK` and the rules behind it; whether a `WITNESS` lands on a slip that reached production; how often the changed function was the one meant to change.
2. A comment on new pull requests.
3. The editor rule on new code ([Editor and agents](/docs/lean/editor-and-agents/)).
4. `WITNESS` blocking last.

The verdicts in the table are explained on [Verdicts](/docs/lean/verdicts/). If your data admits only some values of a type, see [Known values](/docs/lean/known-values/), which also adds a `Values:` line to the report.
