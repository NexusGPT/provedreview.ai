---
title: CLI
order: 1
lede: Every entry point and flag the lean and DA sources name. Run lean commands from the repository root.
sources: lean:README.md, lean:langs/ts/README.md, lean:docs/limits.md, da:docs/architecture/producer-tools.md, lean:docs/pull-requests.md, lean:docs/ASSURANCE.md, lean:docs/editor-and-agents.md, lean:docs/front-end.md, lean:CHANGELOG.md, da:README.md, da:docs/architecture/run-record.md
---
## Summary

| to do | command |
|---|---|
| one function, both lanes, one verdict with its certificate | `node langs/ts/check.mjs --parent old.ts --candidate new.ts --unit applyDiscount` |
| a whole pull request, one table | `node langs/ts/pr.mjs --repo <checkout> --base <ref>` |
| lane B alone, in seconds | `node langs/ts/exec/run.mjs --parent old.ts --candidate new.ts --unit f` |
| the lint | `node langs/ts/lint/lint.mjs file.ts` |
| the lint, in the editor | rule `lean/provable` |
| the pull-request comment and gate | `node langs/ts/ci/comment.mjs --repo <checkout> --base <sha> --head <sha>` |
| one entry point | `bin/lean check \| lint \| pr \| census …` |
| the suites | `node langs/ts/tests/run.mjs` and `python3 -I conformance/run.py` |

## check.mjs

One function, both lanes, one verdict with its certificate.

```bash
node langs/ts/check.mjs --parent old.ts --candidate new.ts --unit applyDiscount
```

| flag | what it does |
|---|---|
| `--parent <file>` | the old version |
| `--candidate <file>` | the new version |
| `--unit <name>` | the function to check; `--unit Class.method` for a method |
| `--scope scope.json` | the scope file: what was meant to change. An `adapters` entry declares a signature mapping |
| `--n <count>` | the number of generated inputs |
| `--seed <seed>` | the seed lane B draws from |
| `--dafny-seconds <seconds>` | the time limit for lane A |
| `--deep[=k]` | render same-package children to depth *k* (`--deep=k`) |
| `--out verdict.json` | the file the certificate is written to |
| `--no-project` | check without the project's `tsconfig.json` |
| `--project` | named as an option `check.mjs` reads; the source gives no more |

The run prints the verdict and the out file:

```text
PASS-decided -> toggle.json   # every click order from every prop assignment, decided: 8 state pairs over 2 assignment(s)
```

Options other than the files, the unit, the scope file, `--project` and the numeric ones reach neither the verdict nor the certificate.

### Candidate only

```bash
node langs/ts/check.mjs --candidate file.ts --unit f
```

This loads and runs a new unit alone. The verdict is `NEW`, which records bounded observations and faults and never claims equality. `lint/lint.mjs` accepts the same form for execution admission.

### Adapters

A changed signature needs a declared mapping, or lean answers `ASK:interface`. Declare it as a `// lean-adapter` comment on the candidate or as an `adapters` entry in the scope file:

```ts
// lean-adapter {"from": ["x"], "to": ["x"], "map": ["Some(x)"]}
```

## pr.mjs

A whole pull request, one table.

```bash
node langs/ts/pr.mjs --repo <checkout> --base <ref> [--head <ref>] [--scope f,Class.m] [--preview] [--time-budget <s>] [--unit-budget <n>] [--out report.md]
```

| flag | what it does |
|---|---|
| `--repo <checkout>` | the repository |
| `--base <ref>` | the base commit |
| `--head <ref>` | the head commit; optional |
| `--scope f,Class.m` | the functions meant to change. A named function reports `IN-SCOPE`. Scope is optional and declared, never inferred |
| `--preview` | prints the intake table and runs no lane |
| `--time-budget <seconds>` | bounds the whole run; a function not reached gets `skipped:budget` |
| `--unit-budget <n>` | bounds the whole run to *n* units |
| `--out report.md` | the file the report is written to |
| `--cache-dir <dir>` | the directory certificates are cached and reused from |
| `--fresh` | reads no cache |

A run writes each checked row to `.lean/cache/<key>.json`, and every refusal to `.lean/runs/<identity>.refusals.json`. The report carries `stop: { reason, reached, total }` when a budget ends the run. Intake, budgets and reuse: [Pull requests and CI](/docs/lean/pull-requests/).

## exec/run.mjs

Lane B alone, in seconds.

```bash
node langs/ts/exec/run.mjs --parent old.ts --candidate new.ts --unit f
```

## lint/lint.mjs

The lint, in the terminal or an agent's loop.

```bash
node langs/ts/lint/lint.mjs file.ts [--json | --agent] [--any-type] [--advice]
```

```bash
node langs/ts/lint/lint.mjs <file.ts> [--changed ranges.json]
```

| flag | what it does |
|---|---|
| `--json` | carries each finding's `label`, `precondition` and `advice` as fields |
| `--agent` | prints the findings as a work list an agent acts on item by item |
| `--any-type` | names every `any` at its declaration with the type its uses need |
| `--advice` | carries the mechanical rules of code review, and the rewrite labelled `[proved]`, `[conditional: <precondition>]` or `[migration]` |
| `--changed ranges.json` | checks only the functions that overlap the given line ranges |

The ranges file is JSON: `[[3, 9], [20, 31]]` or `{"ranges": [{"start": 3, "end": 9}]}`, lines 1-based and inclusive.

```text
$ node langs/ts/lint/lint.mjs docs/examples/limits/quote.ts --any-type
docs/examples/limits/quote.ts:2:23  any-type  `plan` is any (written); its uses say { seats: number; tier: string }
```

A finding is one line: `file:line:col  rule  message`.

## The ESLint rule

The plugin ships the lint as one rule, `lean/provable`. Import it from the checkout:

```js
import lean from 'lean/langs/ts/eslint/index.mjs'
```

The editor rule takes the options `anyType` (the editor form of `--any-type`) and `advisory` (the editor form of `--advice`, on by default there).

## ci/comment.mjs

Posts the pull-request table as one comment, updated on every push.

```bash
node langs/ts/ci/comment.mjs --repo <checkout> --base <sha> --head <sha> [--post] [--block none|witness|ask]
```

| flag | what it does |
|---|---|
| `--post` | posts the comment |
| `--block none` | only comments |
| `--block witness` | fails the check on any `WITNESS` row |
| `--block ask` | fails on `WITNESS` or `ASK` |
| `--inline` | posts each refusal record as a review comment at its lines, skipping a range that already carries one |
| `--iou` | the intersection over union at which an existing comment on the same file causes a record to be skipped (0.6 or more) |
| `--batch` | the batch size for requests; at most 50 requests per batch |

A row declared `IN-SCOPE` never blocks. Each blocking row is annotated at its file and line. The reusable workflow is `.github/workflows/lean-pr.yml`.

## bin/lean

One entry point for `check`, `lint`, `pr` and `census`. Every argument is passed through, and the exit code is the script's.

## census.mjs

Counts the reach of the proof subset over a repository.

```bash
node langs/ts/census.mjs <repo>
```

`--report` writes where the subset stops, grouped by rule and then by directory with one example line each. The census counts three kinds of refusal apart: by design, backlog and environment.

## convert.mjs

```bash
node langs/ts/convert.mjs <folder>
```

Applies the lint's rewrites itself and keeps a file only when `pr.mjs` finds no WITNESS on a function it changed.

## translate.mjs

The translator from TypeScript to Dafny. Nothing here proves a change by itself.

```bash
node langs/ts/translate/translate.mjs <file.ts> --fn <name> --out <file.dfy> [--real] [--ensures E]... [--requires E]... [--invariant [N:]E]...
node langs/ts/translate/translate.mjs <file.ts> --core --out <file.dfy> [--suffix parent|candidate] [--real]
```

| flag | what it does |
|---|---|
| `--fn <name>` | the proof shape: writes the function and the same-file functions it calls |
| `--core` | writes every top-level function as a pure Dafny `function` named `<snake_case>` plus `_<suffix>` |
| `--out <file.dfy>` | the Dafny file |
| `--real` | reads `number` as `real`; the default is `int` |
| `--ensures E` | adds the theorem; `result` names the returned value |
| `--requires E` | adds a precondition to the theorem |
| `--invariant [N:]E` | adds a loop invariant to every loop, or to loop `N` with `N:expr` |
| `--suffix parent\|candidate` | the suffix of `--core` function names |

## The suites

```bash
node langs/ts/tests/run.mjs
python3 -I conformance/run.py
node scripts/assurance-check.mjs
```

`node langs/ts/tests/run.mjs` prints one table and exits 0 only when every row passes. `--pair readme_ledger` runs one pair. `python3 -I conformance/run.py ts` runs the TypeScript rows. `node scripts/assurance-check.mjs` runs every check [ASSURANCE.md](https://github.com/NexusGPT/lean/blob/v0.1.3/docs/ASSURANCE.md) names.

## Differential attestation

DA's commands from its README:

```bash
node lean/langs/ts/pr.mjs --repo <checkout> --base <base sha> --head <head sha> --scope <function,Class.method>
harness/regress.sh "$PWD/lean"
python3 -I benchmark/run.py --lean lean --manifest benchmark/manifests/lane2-clean.v1.json --slice 20 --jobs 4
python3 -I benchmark/score.py --manifest benchmark/manifests/lane2-clean.v1.json --results <run dir> --require-eligible
```

`harness/regress.sh` is the regression table that admits a lean head, rows R1 to R11 against their floors. The benchmark runs, then scores.

The run record has a CLI:

```bash
node gate/record.mjs append --identity <id> --kind <kind> --json '<payload>'
node gate/record.mjs read --identity <id>
```

`append` writes one row. `read` prints the parsed lines. See [Record shape](/docs/reference/record/).
