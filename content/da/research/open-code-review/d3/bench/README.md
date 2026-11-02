# DA-Bench v1

An AACR-shaped benchmark whose truth is human notes plus injected regressions plus escapes. No model in any path that
finds or writes a finding or a comment; the AACR judge (a model) matches comments to human notes only.

## The definition (verbatim from `briefs/da-v4/w5-benchmark.md`, 2026-11-01)

### Instances

- Source: the 13 repositories' calibration corpus (`research/open-code-review/d3/calib/manifest.jsonl`, 447 PRs with 748 human comments) plus merged PRs without comments from the same fetch (for injected regressions only).
- Split: `sha1(head) mod 3`: 0 → test, else dev. The 44 AACR instances are a third set, never used for tables, rules, fakes, transforms or thresholds; they are scored at release candidates only.
- Instance file: `bench/instances/<id>.json` with `{id, repo, base, head, kind: "pr" | "mutant", parent_of?: <pr id>, truth: [...]}`.

### Truth items

- N (human notes): `{kind: "note", path, line, body, family}`; `family` from the review-issue registry's family layer, assigned once by a labeller run before any benchmark run and frozen (a model is used for this analysis label only; it is never in the finding path). Match: the AACR judge as `pilot.judge` runs it (file-level semantic match, Haiku, two rounds, the band reported).
- M (injected regressions): for each dev/test PR, up to three mutants from `lean/langs/ts/exec/mutate.mjs` on units the PR changed, and one on an unchanged caller that reaches a changed callee; each mutant is its own instance whose candidate is the PR head plus the edit. Truth: `{kind: "mutant", path, line_from, line_to, mutation: operator-flip | boundary-shift | string-change | dropped-branch | swapped-arguments | dropped-effect | changed-return}`. Match: a comment on that path whose span is within 5 lines of the edit. The mutation kinds and the 5-line rule are fixed here, before any run.
- E (escapes): `research/open-code-review/d3/harness/escapes.py` over the corpus: a later commit within 180 days whose message matches fix|bug|regress|revert and changes the same unit. Truth: `{kind: "escape", path, unit, lines, commit}`. Match: a comment on that path within 5 lines of the repair's changed lines.

### Score

- Per entry (ocr, da-attest, and later the composed entry): precision = hit comments / comments; recall = matched truth items / truth items; F1; each also per component N, M, E; determinism (two runs, byte-equal comment sets); evidence rate; comments per instance; cost per instance.
- The headline is F1 on the test split over N ∪ M ∪ E. The N component is reported beside OCR's N component so the human-note ceiling stays visible.
- Target: F1 ≥ 80 on test. Recall on M is the coverage number: a planted change in a unit lean cannot read is a miss.

### Anti-overfitting

- Tables (fire, phrasing), fakes, rows, transforms and thresholds are built on dev only; every change to one is logged with its dev delta in `bench/LOG.md`.
- Test is scored at most once per release candidate; the 44 likewise.
- The mutation operators are lean's own, unchanged by this program; DA's classes are not edited to match a mutation kind.

## Amendments (2026-11-01, from the plan review; they bind over the text above where they differ)

- A22: the report leads with three numbers, never one: N F1 beside OCR's N F1 on the same instances, with the N ceiling
  (below); M recall by mutation kind at the record level (a WITNESS on the mutated unit, before the fire table: the
  coverage number) and the rendered level (after the comment engine); E recall on PR-written lines with the window
  coverage per repository. A pooled F1 is a fourth line, labelled pooled.
- A23: a mutant instance is scored on M only, over the comments on the mutated file within the mutated unit's span;
  comments elsewhere in it are neither hits nor misses. The PR instance carries N and E.
- A24: M and E match on a comment's `lines` (its record lines, at most 3) within 5; the span is not used.
- A25: a mutant inherits its parent PR's split; E's repairs exclude the 44 heads (`heldout_check.excluded_shas()`); the
  corpus is 10 repositories with rows (cherry-studio, ragflow and waveterm keep 0 after the filters); the per-repository
  dev/test counts are in `build.json`.
- A26: the clause "plus merged PRs without comments" is dropped (the manifest holds only PRs with comments).
- A27: E is restricted to repairs on PR-written lines, reported with its window coverage per repository, and kept out of
  the pooled line until the window has run.
- A28: a run pins the budgets its records were made under and reports timeout-class flips apart from determinism.
- A29: at most three release candidates score the test split.
- A30: the scorer and the runner are first proven on a 30-PR dev slice with its mutants; the full dev set is a
  release-candidate measurement.

## How the definition is made concrete (fixed before any run; a change is a `LOG.md` entry)

**Ids.** A PR instance is `<owner>__<repo>#<pr>` (the calibration records' key); a mutant is `<pr id>~m1` .. `~m3` (changed
units) or `<pr id>~c1` (the caller).

**Instance fields.** `{id, repo, pr, split, kind, base, head, commit, merge_base, truth}`; a PR instance also has
`mutants` (its mutant ids; `null` until its sites are chosen) and `escapes` (`null` until `bench/escapes.json` exists,
then `{status, reason, window: {days, elapsed_days, full}, dropped}`); a mutant also has `parent_of` and `edit`
(`{path, unit, role, lean_kind, mutation, site, start, end, was, text, lean_was, lean_text, line_from, line_to,
orig_line_from, orig_line_to, line_delta, unit_from, unit_to, file_sha256, patch}`).
`head` is the manifest's PR head (the split hashes it); `commit` is the commit the PR's comments sit on and the records
were computed at (`run_records.commit_of`, the lean file's `head_commit`; 24 of 447 differ from `head`). A note's
`line` is the span `line_from`..`line_to` (GitHub's `start_line`..`line`); it also carries `comment_id`.

**Mutants: the fixed rule.**
1. The changed units come from the diff, never from lean's verdicts: every declared unit (lean's `units.mjs`, syntax
   only) of a JS or TS file (`.ts .tsx .mts .cts .js .jsx .mjs .cjs`) whose kind is `source` (`findings.file_kind`:
   not a test, mock or generated file), added or modified between the merge base and `commit`, that a hunk of that diff
   meets on the commit's side. A PR whose lean run failed keeps its mutants (M must not be planted only where lean
   already read). The callers: the rows of the PR's lean file (`calib/records/lean/<id>.json`) that lean marks `caller`
   (lean's call graph), with no ledger row, no `covered-by`, no removed unit, never the module unit, under the same
   file filters, less any changed unit; a PR whose lean run failed has no caller mutant. Both in source order: by path,
   then the unit's first line, then its name.
2. The sites: lean's own (`exec/mutate.mjs` `sitesOf`, imported unchanged by `bench/sites.mjs`, because the CLI's `--list`
   prints no offsets), in source order. lean's kinds map to the plan's: operator → operator-flip, boundary →
   boundary-shift, string → string-change, dropped-else and negated-if → dropped-branch, swapped-args →
   swapped-arguments, dropped-effect, changed-return.
3. Changed units: walking the units, and each unit's sites, in source order, take the first site of each plan kind not
   yet taken whose mutant mutate.mjs accepts (it parses and adds no type error, mutate.mjs's own test, with the
   project's tsconfig), until three kinds are taken. A site mutate.mjs refuses is skipped and named in `tried`.
4. The caller: walking the callers in source order, the first site (any kind) whose mutant is accepted; one caller.
5. The edit is applied exactly (the mutant of that site, never the next site's) and changes only `[start, end)` (a
   site whose mutant changes text elsewhere is refused); `was` and `text` are the file's own text there and its
   replacement (UTF-16 offsets, as lean counts), so `before[:start] + text + before[end:]` is the mutant; lean's
   renderings (swapped arguments joined on one line, cut at 60 characters) are kept as `lean_was` and `lean_text`. Its
   patch, `edits/<id>.patch`, is a unified diff from the repository root that `git apply --check` accepts on a checkout
   of `commit`. `unit_from`..`unit_to` is the mutated unit's span in the candidate (`units.mjs` on the mutant's text; a
   site whose unit units.mjs does not name once is refused). A sites doc carries `version` (2); a doc of another version
   is chosen again.
6. Truth lines are the candidate's: `line_from` is the edit's first line, `line_to` adds the newlines the edit inserts
   (a removal is the one line where the text was). `orig_line_*` and `line_delta` place it in the parent.

**Escapes.** `bench/escapes.json` (w5b, `escapes_corpus.py`): keyed `<owner>/<repo>#<pr>`, a value per PR `{status,
escapes, window, ...}` (a bare row list, `escapes.py`'s own shape, is read as status ok with no window). A mined row is a
candidate: one later fix|bug|regress|revert commit meeting one touched unit. An E item is one repair of lines the PR
wrote, in source code, once per file, credited to one PR (w8m, 2026-11-01). `build.py` (`escape_truth`) applies these
filters in order. Each one is named and counted in the instance's `escapes.dropped`, in `build.json`
(`counts.<split>.escape_filters`, also per repository) and in `bench/escape_truth.md`:
1. Per row, `repair-not-on-pr-lines` (a): no line the repair changes was last written by the PR, by git blame on the
   repaired version (`pr_lines`). Then `unit-gone-at-head` (no `lines_at_head`) and `repair-is-a-held-out-head`
   (one of the 44 heads).
2. Per row, `unit-is-test-code` (b): the unit is a test construct (a segment of its name opens `describe(`, `it(`,
   `test(`, or `test.describe(` and the like), or its file is a test file (a `test`, `tests` or `__tests__` folder, or
   `.test.` or `.spec.` in the file name).
3. `repeat-of-one-repair-in-the-file` (c): the rows one repair commit makes in one file of one PR (nested units and
   sibling units) fold into one item; the count is the rows folded. The item's `unit` is the smallest one that encloses
   every repaired line: the deepest row whose repaired lines cover all of them, else `(file)`. `units` lists every
   unit. Each repaired line is placed at the head by the smallest unit that holds it, and `lines` is the result.
   `lines_changed` holds the same lines on the repaired version.
4. `repair-credited-to-another-pr` (d): a repair commit left in two or more PRs is credited to one PR, the latest to
   land (`merged_at`, then the PR number) of the PRs whose written lines it repairs. Blame decides
   (`bench/escape_credit.json`, written by `escape_credit.py`, the only stage here that needs the network): each repaired
   line is blamed on `R^`, and its last writer goes to the credited PR that owns it, the earliest to land when several
   do. A PR owns a commit when the commit is its merge commit, a commit that merge commit merged, one of its own commits
   (merge base..head), or carries the same patch as one of them (a rebase merge). With no record for exactly those PRs,
   or when blame finds no owner, every PR that kept the row counts. The decision counts are `build.json`'s
   `escape_credit`. The count is items removed.

Counts on the 447 PRs (2026-11-01): 1,974 rows mined; (a) removes 1,201 (unit-gone-at-head 0, held-out head 0),
(b) 389, (c) folds 154, (d) removes 32 items (17 commits: blame decided 16; for 1, blame found no owner); 198 items are
kept (dev 116, test 82). Per repository: `bench/escape_truth.md`. A hand check of 30 kept items (`bench/handcheck-w8m/`)
found 9 regression repairs of the PR's own lines (30.0 %, Wilson 95 % 16.7 % to 47.9 %).

An escape's `lines` are matched by the 5-line rule. A PR's window is full when `elapsed_days >= days`. Until
`escapes.json` exists every PR instance has `escapes: null` and E is empty.

**The N truth.** N holds valid issues as labelled by prompt `ad1711e8c961dd86bf1eb84266c6e09a5ad62638cff0b3864494d6243683d5f3`
(`labels/validity.py`, AACR's `label`: the note names a concrete problem in the changed code that the author should
act on), validated kappa 0.605 on 40 (the lead's hand labels, 34 of 40 agree; `labels/README.md`). A manifest comment
enters N only with validity label 1 (`bench/labels/validity-{dev,test}.jsonl`), and the note carries its AACR
`category`; a label 0 is counted in the instance's `notes_dropped` and in `build.json` (`notes_dropped` by
`not-an-issue:<kind>`, `notes_before_validity`); a comment with no validity label, a label that is not 0 or 1, or
labels made with two prompts stop the build. Dev 499 → 318 notes, test 249 → 168.

**The N ceiling.** A note is `in_ceiling` when its file is a source file (as in rule 1) that the PR modified (GitHub's
file status from the cache, `/root/da-calib/gh/<repo>/pulls-<n>-files.json`, is not `added`). The share of notes in
the ceiling is printed beside N: an entry that compares a parent with its candidate cannot reach a note on a new file or
on a doc, config or test file.

**Families.** `bench/labels/*.json[l]` (w5d), rows `{comment_id, family}`; until then every note has `family: null`.

**What a comment is.** A result file is pilot-shaped: `<run>/<entry>/<id>.json` with `review.comments` `[{path,
start_line, end_line, content, lines?, record_id?}]`; a comment without text is not a comment (as the judge reads it).
Its lines (A24) are its `lines` field, the first 3 integers; a comment with no `lines` (an entry that writes none, e.g.
OCR) has its anchor lines, `start_line` and `end_line`. The lines between start and end are never read.

**Matching.** N: the judge's verdicts (`file_semantic_match` per note, `hit_new_gt` per comment), as the AACR pipeline
counts them. M and E: a comment on the item's path one of whose lines `x` satisfies `a - 5 <= x <= b + 5` for the
item's span `[a, b]` (an escape: any of its spans). A comment is a hit when it matches an item no earlier comment of
its instance matched (the judge's rule for N, applied to M and E). On a mutant instance only the comments on the mutated
file with a line in `unit_from`..`unit_to` are judged (A23).

**The mutant's comments.** A mutant instance's candidate is the parent's commit plus one edit, so most of an entry's
comments on it are its comments on the parent. Only the comments the parent's run did not make count on a mutant: each
parent comment (moved by `line_delta` when it lies below the edit in the edited file) takes out one equal mutant comment
(path, lines, text). Without a parent result every mutant comment counts.

**Components.** N and E judge the PR instances' comments; M judges the mutant instances' new comments in the unit.
Precision per component = its hits / the comments it judges; recall = matched items / items. **Pooled** (A27): precision
= comments that hit N, M or E / all judged comments (a caught escape is a correct comment whatever the window); recall =
matched N and M items / N and M items (E's items join when the window has run, a LOG entry). The judge runs twice; each
round is reported, and the band (max - min).

**M at the record level.** A mutant is covered at the record level when the lean records it was run on
(`<mat>/<id>/lean/<id>.json`) hold a row with verdict WITNESS on the edit's path and unit; the report also counts how
many of those the parent PR's records already had (the PR changed the unit too).

**Determinism (A28).** Two runs; an instance whose comment sets differ and whose records hold a row with coverage
`...:timeout` is a timeout-class flip, reported apart; determinism is byte-equal instances of the rest. The header
prints the budgets the records were made under (lean's `budgets`: dafny seconds, n, seed, unit seconds).

**Evidence rate.** Comments whose `record_id` names a record in the result's `da.records` carrying evidence, of all
comments. **Cost per instance.** The tokens the results record (`review.summary`).

## M-hard: the hard set (lane w8q, 2026-11-01; fixed before any run on it)

**Why.** M's first kinds are one-token edits a model reviewer reads off the diff (OCR, Haiku: 36 of 39 on dev). M-hard
plants changes a reader sees as plausible and an execution separates, each from a shape that real later fixes repair
(lane w8l, `escape_shapes.md`: the kinds present in 1,305 distinct repairs of 1,974 escapes). Its difficulty is
reported as OCR's measured recall on it, per kind; a kind is never removed because OCR catches it.

**A labelled subset of M, not a fourth truth.** The truth item is M's (`{kind: "mutant", path, line_from, line_to,
mutation, unit, unit_from, unit_to}`), matched by M's rule (a new comment in the unit within 5 lines); only the
distribution of the planted edits differs. It is built into its own folder, `bench/hard/` (sites, edits, instances,
splits, dataset, build.json), so M's instances and numbers are unchanged, and it is reported on its own line, never
pooled with M.

**The kinds** (lean's `exec/mutate-hard.mjs`, lane w8q, listed by `mutate.mjs --hard` after every first-kind site;
`mutation` is the kind's own name):

| kind | the edit | the repair shape it stands for (w8l, distinct repairs present) |
|---|---|---|
| callback-effect | a call statement inside a callback (a function passed as an argument) removed | call-added 465 |
| effect-after-exit | a call statement after an early exit (an if without else that returns, throws, breaks, continues) removed | early-exit-added 52, early-exit-removed 30, call-added |
| dropped-cleanup | a call or write statement in a catch or finally block removed | error-handling-removed 7, error-handling-added 19 |
| deep-boundary | `< <= > >=` flipped at least 15 lines below the unit's first line, in a unit of at least 25 lines, outside a loop's condition | condition-changed 126 |
| loop-bound | the `< <= > >=` of a loop's condition flipped where the loop writes state declared outside it | loop-bound-changed 3, condition-changed |
| option-variant | a string literal passed to a call (an argument, or a property of an object argument) whose expected type is a union of string literals becomes the union's next member | argument-changed 278, property-changed 203 |
| numeric-conversion | `Number` <-> `parseFloat`, `parseInt(x, r)` -> `Number(x)`, `Math.floor/ceil/round` <-> `trunc`, `isNaN/isFinite` <-> `Number.isNaN/isFinite`, `a \|\| <number>` -> `a ?? <number>` | call-changed 176, reference-changed 217 |
| changed-default | the literal default of a parameter or a destructured binding: n -> n + 1, true <-> false, s -> s + "x" | value-changed 108, constant-changed 160 |
| swapped-effects | two adjacent effect statements (call, await, write) of one block that name a common identifier, swapped | ordering-changed 41, await-added/removed 24 |

**The rule.** As M's rule 1 to 6, except: the sites are `mutate.mjs --hard`'s hard kinds of lean `lane/w8q-hard-set`
(`build.py sites --kinds ... --mutate-lean <that checkout>`), the units, their spans and lean's callers from `LEAN`
(the records' lean, v0.1.4, so the unit names are the ones its records carry); per PR, over the changed units and their
sites in source order, the first accepted site of each hard kind not yet taken, until three kinds are taken; a site
whose edit (path, start, end, text) is one already chosen is passed over; no caller mutant. Ids `<pr id>~h1` .. `~h3`.
**The selected set** (`bench/hard/selected-dev.txt`, `build.py instances --hard`): per kind, the first 12 dev mutants by
sha1(id) (at most 108; a mutant's records re-run lean over its whole PR, a median 620 s and a mean 1,900 s on w5c's 80,
so the set is sized to the minimum of 100 the lane's brief sets, not to the 200 OCR's cost would allow).

**The three columns** (`bench/hard_table.py`): lean's record level (a WITNESS on the mutated path and unit in the
records `materialise.py` made with lean v0.1.4), DA's rendered level (da-attest through `run.py`, M's rule), OCR's
recall (`ocr_entry.py` on the mutants, the parents' results w5e's run made, scored by `score.py`, M's rule). The loop,
not the record level: `bench/hard_check.py` runs `check.mjs` on the mutated unit alone with any lean, in minutes.

```
cd research/open-code-review/d3
LEAN=/root/lean-v014 python3 -I bench/build.py sites --split dev --kinds callback-effect,effect-after-exit,dropped-cleanup,deep-boundary,loop-bound,option-variant,numeric-conversion,changed-default,swapped-effects --mutate-lean <lean lane/w8q-hard-set>
python3 -I bench/build.py instances --hard
LEAN=/root/lean-v014 python3 -I bench/materialise.py --instances bench/hard/instances --out /root/da-bench/w8q/instances --only <selected> --jobs 4 --load-max 64
python3 -I bench/run.py --entry da-attest --split dev --instances-dir bench/hard/instances --mutants-file bench/hard/selected-dev.txt --mat /root/da-bench/w8q/instances --no-judge --out <run>
python3 -I bench/hard_check.py --ids bench/hard/selected-dev.txt --lean <lean> --out <file.jsonl>
```

## Commands

```
cd research/open-code-review/d3
LEAN=/root/lean-v014 python3 -I bench/build.py sites --split dev --jobs 4      # checkouts; writes sites/ and edits/
LEAN=/root/lean-v014 python3 -I bench/build.py sites --split test --jobs 4
python3 -I bench/escape_credit.py                                              # git blame for E's (d): escape_credit.json
python3 -I bench/build.py instances                                            # instances/, splits/, dataset/, build.json
source /root/aacr/env.sh                                                       # the judge's key and endpoint, for N only
python3 -I bench/run.py --entry da-attest --split dev --instances 30 \
    --pipeline /root/da-run/research/open-code-review/aacr/pipeline/evaluation --judge-model claude-haiku-5-5 \
    [--compare-dir <ocr run>/ocr --compare-metrics <its rounds>]                # N beside OCR on the same instances
python3 -I bench/run.py --entry da-attest --split test --release-candidate <rc>  # at most three (A29)
python3 -I bench/score.py --entry-dir <run>/a/<entry> --split dev --instances-file <run>/instances.txt \
    --metrics <round 1>,<round 2> --compare-b <run>/b/<entry>
cd harness && python3 -I -m unittest discover -s tests -p "test_bench.py" && python3 -I tests/test_bench.py --break
python3 -I bench/tests/test_escape_credit.py && python3 -I bench/tests/test_escape_credit.py --break   # from d3/
```

Materialised mutants (w5c): `<mat>/<mutant id>/{lean,rules,oracles}/<mutant id>.json` and `<mat>/<mutant id>/<mutant
id>.json` (default `/root/da-bench/instances`, `--mat`). A mutant without them, or materialised from another version of
its instance (`instance_sha256`), is left out of a run and counted, never scored as a miss.

`BENCH_PR_RECORDS=<dir>` points `run.py` at PR records made with another lean checkout (`calib/run_records.py --manifest <slice manifest> --out <dir>` with that `LEAN`), so a lane's effect is measured with the same lean on the PR instances and on the mutants; the frozen records stay `calib/records`.
## The fast path: M with lean on the mutated unit (`fast_m.py`, lane w7b)
**What it is for.** The loop: a change to lean or to DA, then M on the slice in minutes, not the hours a full
materialisation takes (a mutant's full records re-run lean over the whole pull request: 47,755 s of lean on the 58
slice mutants' sides alone). Per mutant it runs two sides with one `--units` list (the truth unit; for a caller mutant
also the PR's changed units of the caller's file): lean on merge base -> the PR commit and on merge base -> the mutant
commit (`instruments_lean.run_instance(..., units=...)`, pr.mjs `--units`), the rule differential and the oracles as
`materialise.py` runs them (its checkout, edit, mutant commit and truth check are `materialise.one_instance`'s own),
`da_attest` on both, then `score.tally`'s M on the pair, and the reason of each miss: `no witness` (lean holds no
WITNESS on the unit), `silent` (the unit's witness records rendered no comment in the unit, with render's reasons),
`witness not new` (every in-unit comment equals one of the PR side's), `witness far from the edit` (new, none within 5
lines), `no records` (the mutant side failed).
**What it is not.** Not the checkpoint. Its PR side is the PR restricted to the mutant's units, not the PR instance
the full run scores, so its comments differ from a full run's; its numbers are the loop's, and a number is quoted from
`run.py` over `materialise.py`'s records. A lean without `--units` (v0.1.4 and before) checks every changed unit: the
records then name the units checked outside the list (`units_ignored`) and the report says the sides ran over the whole
pull request.
```
cd research/open-code-review/d3
LEAN=/root/lean-v014 python3 -I bench/fast_m.py --out <dir> [--mat /root/da-bench/fast-w7b] \
    (--split dev --instances 30 | --only <id,id> | --instances-file ids.txt) [--jobs 4] [--load-max 64] \
    [--lean <lean checkout>] [--compare <a run.py run folder>] [--redo]
python3 -I bench/tests/test_fast_m.py && python3 -I bench/tests/test_fast_m.py --break
```
Its records: `<mat>/pr/<pr id>@<units hash>/` and `<mat>/mutant/<mutant id>/` (`{lean,rules,oracles}/<id>.json`), the
entry's results `<mat>/results/<mutant id>/da-attest/`. A side made with the same units, the same lean head and (a
mutant) the same instance is reused; `--redo` runs it again.
## The hour bench (`hour.py`, lane w9d)

**What it is for.** The loop: one lean tree measured on the 30-PR dev slice's 75 mutants in one command, often enough
to hill-climb on (the owner: a benchmark every hour). It makes the records the full run reads (materialise.py's sides,
unchanged steps) for the 75 mutants and their 23 parent PRs, both with the SAME lean tree, then runs the entry and the
scorers. The number it prints is run.py's, over records this command made.

```
cd research/open-code-review/d3
python3 -I bench/hour.py --lean <lean tree> [--lean-head <commit>] --name <run name> [--set quick|slice|dev] [--jobs 24] [--units auto|off]
                         [--side-files units|all] [--lean-timeout 600] [--giant-timeout 1800] [--cap 600]
                         [--oracles reuse|run] [--cause on|off] [--floor-gb 15] [--load-max 64] [--compare <earlier run name>]
python3 -I bench/hour.py --lean <lean tree> --name <new name> --records-from <run name>    # a DA change: no lean run
python3 -I bench/tests/test_hour.py && python3 -I bench/tests/test_hour.py --break
```

**The lean tree.** Pinned at the start: a `git clone --shared` of `--lean` at its head (or `--lean-head <commit>`)
under the run's work folder, every lean process and the cause stage run from it, and nothing is written to the lean
repository. A tree with changes git does not hold is refused. lead-v4 moved twice under the sides of
`lead-v4-6694e5a7-1` (6694e5a7 -> 8844df7d -> 2df7b01b): without the pin one number held three lean heads. `hour.md`
says when the source tree moved during a run; the run measured its clone throughout.

**The set.** `--set slice` (the default): the ids of `/root/runs/slice-mutants.txt` (75) and their parents, each of which
must be in `/root/runs/slice-manifest.jsonl` (23 of its 30 PRs have mutants); `--set quick`: `/root/runs/quick-mutants.txt`
(20); `--set dev`: every mutant of the dev split (169 on 51 parents, the parents taken from the dev PR instances);
`--mutants <file>` any list. run.py scores exactly these and their parents (`--instances-file`).

**The sides.** One per parent and one per mutant, `--jobs` at once (24); the giants first (`--big` and their mutants,
lean killed at `--giant-timeout`, 1800 s: at 600 s every one of them was), then the longest first (each side's wall in the
newest earlier run over the same mutants, any lean; else the frozen whole-PR lean wall of its parent, `calib/records/lean`;
a parent before its mutants on a tie). A side whose checkout failed (GitHub refusing an anonymous fetch while 24 run;
already retried in place) runs once more after the pool drains. A mutant side is `materialise.one_instance`, a
parent side `run_records.steps` on merge base -> the PR commit, each with its own checkout:
- `--units auto`: lean (`pr.mjs --units`) checks the mutant's units (`fast_m.units_of`: the truth unit; a caller mutant
  also the PR's changed units of its file), the parent the union of its mutants' lists. A lean without the flag checks
  every changed unit; the records name those units (`units_ignored`) and `hour.md` counts the sides.
- `--side-files units` (the default with `--units auto`): the rule differential and the oracles read only the changed
  files of the side's units. A mutant is scored on the comments in its unit (A23), new against its parent's on the same
  file, so a hit on another file is never judged; `all` reads every changed file, as materialise.py does.
- Heaps: each lean process gets `--max-old-space-size` of the free RAM (MemAvailable at the start) divided by `--jobs`,
  never under 3 GB, at least 12 GB for `--big` (cline#13799, n8n#41881, n8n#42117) and their mutants;
  `LEAN_WORKER_HEAP_MB` is 6144 unless set.
- Work: every checkout and record is made under `/root/ramwork/hour-bench.work/<name>/` (a tmpfs); the records are
  copied to `/root/da-bench/hour/<name>/records/` when the sides end and the work folder is removed. The oracles'
  worktrees are made under `/root/da-installs/hour-work/<name>/`, the install cache's filesystem: a cached install is
  hard-linked into the side's tree, and a hard link never crosses into the tmpfs (`cp -al`: Invalid cross-device link;
  the bench refuses to start when the two differ). A side starts when each of its folders has `--floor-gb` (15) free,
  else it waits up to 600 s and is refused, named in `hour.md`; the same floor is every checkout's own wait.
- A mutant's oracles run the PR commit as the parent side (materialise.Bound): a test the PR left passing that the edit
  fails is an ORACLE record. On the merge base a test the PR added fails already, so the parent-pass rule hid it.
- `--oracles reuse` (the default): an oracle side's result depends on the oracle code (oracles.py, build_sandbox.py,
  test_detect.py), the two commits, the files and the cap, never on lean; a side whose inputs are unchanged takes its
  result from `/root/da-bench/hour/.persist/oracles/`, and every result with no timeout is kept there. `run` always runs.
- Timeouts: lean is killed at `--lean-timeout` (600 s); pr.mjs stops itself at `instruments_lean.time_budget` of it
  (300 s) and its worker at the budget plus one unit's bound (about 510 s). A side is a **timeout row** when lean was
  killed, stopped at its budget, or holds a row of coverage `...:timeout` (score.has_timeout's rule); a mutant counts as
  completed only when its side and its parent's are both ok. A timeout is named in `hour.md` by kind (killed at the
  cap, stopped at the budget, a unit lean could not finish), never a silent miss.
- Priority and load: the bench renices itself to -5 and starts when the one-minute load is at or below `--load-max`
  (64); after the start it does not wait on the load (its own sides raise it). SIGTERM to `<out>/<name>/pid` stops it and
  kills its whole process tree and anything working under its work folder.

**After the records.** The cause stage first: `cause_records.py` (lane w8a: lean's witnesses pinned to their cause
lines) on every instance of the set, `--parallel 8`; lean's runs are cached by content in `.persist/cause/runs` and a
finished instance by its inputs (the stage's code, the lean head, the budgets, the commits, the rows it reads; not the
lean file's wall times) in `.persist/cause/instances`, so an unchanged instance needs no checkout; an instance the stage
could not write keeps its own records, named; `hour.md` gives its wall and how many ran, were reused or had no witness
(`--cause off` skips it). Then `run.py --entry da-attest --no-judge --no-record` (the entry twice, a and b: determinism)
with `BENCH_PR_RECORDS` on the parents' cause records and `--mat` on the mutants'; `score.py`; `ledger.py --ids --records`
on the set (the cause of every miss; a mutant with no lean file is `instance-failed/no-record`); `impact_table.py` when the tree has it (lane w9c), else the same columns from run.py's score
(completed of 75, M record, M rendered, precision, comments, timeout rows, failed parents). The ledger's totals are
checked equal to the table's. `--records-from <run>` runs none of the sides: that run's records are scored again with
this tree's DA code (a DA change measured in about a minute). `--compare <run>` puts an earlier run's comment set beside this one (per instance,
score.determinism) and, under the line, both runs' M record and M rendered on the mutants completed in BOTH (the
intersection rule: a mutant one run could not finish says nothing about its lean), beside the raw numbers.

**Output.** `/root/da-bench/hour/<name>/{records, run, score.md, ledger, impact, logs, hour.md, hour.json}`. `hour.md`
opens with the line the owner reads: `<lean head> M rendered X of 75 (Y %), record Z of 75, completed C of 75, wall W min`
(wall: the command's, less the wait for the load bar). A lean tree whose head moved during the run is flagged on that line.
