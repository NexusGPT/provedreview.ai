---
title: DA-Bench
order: 1
lede: DA-Bench v1 is an AACR-shaped benchmark whose truth is human notes, injected regressions and escapes, with no model in the path that finds or writes a finding.
sources: da:research/open-code-review/d3/bench/README.md
---

DA-Bench is an AACR-shaped benchmark. Its truth is human notes plus injected regressions plus escapes. No model sits in any path that finds or writes a finding or a comment. The AACR judge, which is a model, matches comments to human notes only.

The definition was fixed before any run. A change to it is a `LOG.md` entry.

## Instances and split

The source is the calibration corpus of 13 repositories: 447 PRs with 748 human comments. After the filters the corpus is 10 repositories with rows. cherry-studio, ragflow and waveterm keep 0.

The split is `sha1(head) mod 3`. A result of 0 is test, anything else is dev.

The 44 AACR instances are a third set. They are never used for tables, rules, fakes, transforms or thresholds. They are scored at release candidates only.

An instance is a pull request or a mutant. A PR instance is `<owner>__<repo>#<pr>`. A mutant is `<pr id>~m1` to `~m3` (changed units) or `<pr id>~c1` (the caller). A mutant inherits its parent PR's split.

## The truth items

Three kinds of truth item, each with its own matching rule.

| item | what it is | match |
|---|---|---|
| N, human notes | a reviewer's note with its path, line and body | the AACR judge, as `pilot.judge` runs it: file-level semantic match, two rounds, the band reported |
| M, injected regressions | a mutant of the PR head: one edit by an operator of lean's `lean/langs/ts/exec/mutate.mjs` | a comment on the path whose lines are within 5 lines of the edit |
| E, escapes | a later commit within 180 days whose message matches fix, bug, regress or revert and changes the same unit | a comment on the path within 5 lines of the repair's changed lines |

### N: human notes

A comment enters N only when it has validity label 1. The label says the note names a concrete problem in the changed code that the author should act on. The validity labelling was validated at kappa 0.605 on 40 (the lead's hand labels, 34 of 40 agree). Notes before and after: dev 499 to 318, test 249 to 168.

A note is `in_ceiling` when its file is a source file that the PR modified. An entry that compares a parent with its candidate cannot reach a note on a new file or on a doc, config or test file. The share of notes in the ceiling is printed beside N.

### M: injected regressions

For each dev or test PR, up to three mutants on units the PR changed, and one on an unchanged caller that reaches a changed callee. Each mutant is its own instance. Its candidate is the PR head plus the edit.

The mutation kinds are fixed: `operator-flip`, `boundary-shift`, `string-change`, `dropped-branch`, `swapped-arguments`, `dropped-effect`, `changed-return`.

The changed units come from the diff, never from lean's verdicts. A PR whose lean run failed keeps its mutants, so M is not planted only where lean already read.

A mutant instance is scored on M only, over the comments on the mutated file within the mutated unit's span. Comments elsewhere in it are neither hits nor misses. Only the comments the parent's run did not make count on a mutant.

### E: escapes

E is restricted to repairs of lines the PR wrote, in source code, once per file, credited to one PR. On the 447 PRs, 1,974 rows were mined and 198 items are kept (dev 116, test 82). A hand check of 30 kept items found 9 regression repairs of the PR's own lines (30.0 %, Wilson 95 % 16.7 % to 47.9 %).

E is reported with its window coverage per repository. It stays out of the pooled line until the window has run.

## The slice

The scorer and the runner are first proven on a 30-PR dev slice with its mutants. The full dev set is a release-candidate measurement.

The hour bench measures one lean tree on that slice's 75 mutants in one command. They come from 23 of the slice's 30 PRs. The number it prints is `run.py`'s, over records the command made.

## The hard set

M-hard is a labelled subset of M, not a fourth truth. M's first kinds are one-token edits that a model reviewer reads off the diff: OCR (Haiku) found 36 of 39 on dev. M-hard plants changes that look plausible and that an execution separates. Each kind stands for a shape that real later fixes repair.

The truth item and the match rule are M's: a new comment in the unit within 5 lines. Only the distribution of the planted edits differs. The set has its own folder, `bench/hard/`. It is reported on its own line and never pooled with M. A kind is never removed because OCR catches it.

| kind | the edit |
|---|---|
| `callback-effect` | a call statement inside a callback removed |
| `effect-after-exit` | a call statement after an early exit removed |
| `dropped-cleanup` | a call or write statement in a catch or finally block removed |
| `deep-boundary` | a comparison flipped at least 15 lines below the unit's first line, in a unit of at least 25 lines, outside a loop's condition |
| `loop-bound` | the comparison of a loop's condition flipped where the loop writes state declared outside it |
| `option-variant` | a string literal passed to a call, where the expected type is a union of string literals, becomes the union's next member |
| `numeric-conversion` | conversions such as `Number` and `parseFloat`, or `Math.floor` and `trunc`, swapped |
| `changed-default` | the literal default of a parameter or a destructured binding changed |
| `swapped-effects` | two adjacent effect statements of one block that name a common identifier, swapped |

Per PR, the first accepted site of each hard kind not yet taken, until three kinds are taken. There is no caller mutant. Ids are `<pr id>~h1` to `~h3`.

The selected set takes, per kind, the first 12 dev mutants by sha1(id), at most 108.

## What a model may and may not do

- No model finds or writes a finding or a comment on the DA side.
- The AACR judge is a model. It matches comments to human notes. It does nothing else.
- A model is used for the family label of a note. That label is an analysis label. It is assigned once before any benchmark run and frozen. It is never in the finding path.
- The mutation operators are lean's own, unchanged by this program. DA's classes are not edited to match a mutation kind.
- Tables (fire, phrasing), fakes, rows, transforms and thresholds are built on dev only. Every change to one is logged with its dev delta in `bench/LOG.md`.
- Test is scored at most once per release candidate. The 44 likewise. At most three release candidates score the test split.

## Score

Per entry: precision is hit comments over comments. Recall is matched truth items over truth items. Also F1, each per component N, M and E, determinism, evidence rate, comments per instance and cost per instance.

The report leads with three numbers, never one:

- N F1 beside OCR's N F1 on the same instances, with the N ceiling.
- M recall by mutation kind, at the record level (a `WITNESS` on the mutated unit, before the fire table: the coverage number) and at the rendered level (after the comment engine).
- E recall on PR-written lines, with the window coverage per repository.

A pooled F1 is a fourth line, labelled pooled. The target is F1 of at least 80 on test. A planted change in a unit lean cannot read is a miss.

Commands and the scorer: [Run and score](/docs/benchmark/run-and-score/). The project's other benchmark: [The four lanes](/docs/benchmark/project-benchmark/).
