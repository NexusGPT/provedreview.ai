---
title: Run and score
order: 2
lede: The DA-Bench commands, how the scorer counts and matches, and the published AACR-Bench result with its caveats.
sources: da:research/open-code-review/d3/bench/README.md, da:README.md, da:research/open-code-review/d3/RESULT.md
---

## Run it

Every command runs from `research/open-code-review/d3` of the differential-attestation repository. Build the sites and mutants for each split, then the instances:

```bash
cd research/open-code-review/d3
LEAN=/root/lean-v014 python3 -I bench/build.py sites --split dev --jobs 4      # checkouts; writes sites/ and edits/
LEAN=/root/lean-v014 python3 -I bench/build.py sites --split test --jobs 4
python3 -I bench/escape_credit.py                                              # git blame for E's (d): escape_credit.json
python3 -I bench/build.py instances                                            # instances/, splits/, dataset/, build.json
```

Run the entry on the dev slice. The key and endpoint of the judge are for N only:

```bash
source /root/aacr/env.sh                                                       # the judge's key and endpoint, for N only
python3 -I bench/run.py --entry da-attest --split dev --instances 30 \
    --pipeline /root/da-run/research/open-code-review/aacr/pipeline/evaluation --judge-model claude-haiku-5-5 \
    [--compare-dir <ocr run>/ocr --compare-metrics <its rounds>]                # N beside OCR on the same instances
```

Score the test split at a release candidate. At most three release candidates score it:

```bash
python3 -I bench/run.py --entry da-attest --split test --release-candidate <rc>  # at most three (A29)
```

Score a run directory:

```bash
python3 -I bench/score.py --entry-dir <run>/a/<entry> --split dev --instances-file <run>/instances.txt \
    --metrics <round 1>,<round 2> --compare-b <run>/b/<entry>
```

The scorer and the escape-credit stage have tests, each with a `--break` run:

```bash
cd harness && python3 -I -m unittest discover -s tests -p "test_bench.py" && python3 -I tests/test_bench.py --break
python3 -I bench/tests/test_escape_credit.py && python3 -I bench/tests/test_escape_credit.py --break   # from d3/
```

A mutant without materialised records, or materialised from another version of its instance, is left out of a run and counted. It is never scored as a miss.

### The hard set

```bash
python3 -I bench/build.py instances --hard
python3 -I bench/hard_check.py --ids bench/hard/selected-dev.txt --lean <lean> --out <file.jsonl>
```

`bench/hard_check.py` is the loop: it runs `check.mjs` on the mutated unit alone with any lean, in minutes. The record level needs records that `materialise.py` made with lean v0.1.4.

### The loops

`fast_m.py` measures M with lean on the mutated unit, in minutes. It is the loop, not the checkpoint: a number is quoted from `run.py` over `materialise.py`'s records.

```bash
python3 -I bench/tests/test_fast_m.py && python3 -I bench/tests/test_fast_m.py --break
```

`hour.py` measures one lean tree on the 30-PR dev slice's 75 mutants in one command.

```bash
python3 -I bench/hour.py --lean <lean tree> --name <new name> --records-from <run name>    # a DA change: no lean run
python3 -I bench/tests/test_hour.py && python3 -I bench/tests/test_hour.py --break
```

The first line scores an earlier run's records again with the tree's DA code, with no lean run. `hour.md` opens with the line the owner reads: `<lean head> M rendered X of 75 (Y %), record Z of 75, completed C of 75, wall W min`.

## Recount the AACR table

The AACR-Bench table is recounted from the committed records with no model call:

```bash
python3 research/open-code-review/d3/harness/tables.py <floor dir> <composed dir> <floor judge.jsonl> <composed judge.jsonl> --out tables.json
```

## How the scorer counts

A result file is `<run>/<entry>/<id>.json` with `review.comments`: `path`, `start_line`, `end_line`, `content`, optionally `lines` and `record_id`. A comment without text is not a comment.

A comment's lines are its `lines` field, the first 3 integers. A comment with no `lines` has its anchor lines, `start_line` and `end_line`. The lines between start and end are never read.

### Matching

- N: the judge's verdicts, `file_semantic_match` per note and `hit_new_gt` per comment, as the AACR pipeline counts them.
- M and E: a comment on the item's path, one of whose lines `x` satisfies `a - 5 <= x <= b + 5` for the item's span `[a, b]`. An escape matches any of its spans.
- A comment is a hit when it matches an item that no earlier comment of its instance matched. This is the judge's rule for N, applied to M and E.

### Components

N and E judge the PR instances' comments. M judges the mutant instances' new comments in the unit.

- Precision per component is its hits over the comments it judges. Recall is matched items over items.
- Pooled precision is the comments that hit N, M or E over all judged comments. Pooled recall is matched N and M items over N and M items. E's items join when the window has run.
- The judge runs twice. Each round is reported, and the band (max minus min).

### Determinism

Two runs. An instance whose comment sets differ and whose records hold a row with coverage `...:timeout` is a timeout-class flip, reported apart. Determinism is byte-equal instances of the rest. The header prints the budgets the records were made under.

### Evidence rate and cost

The evidence rate is the comments whose `record_id` names a record in the result's `da.records` that carries evidence, over all comments. Cost per instance is the tokens the results record.

### M at the record level

A mutant is covered at the record level when the lean records hold a row with verdict `WITNESS` on the edit's path and unit. The report also counts how many of those the parent PR's records already had.

## The published AACR-Bench result

The official AACR-Bench pipeline ran unchanged, through `harness/run_pipeline.py`, eval stage, 3 rounds, judge claude-opus-5-5. The floor is OCR on claude-opus-4-6, 185 of 196 instances scored. The composed entry is d2-reader + gate + C4, 184 of 196 instances scored. Every number is computed by `harness/tables.py` from the pipeline's metrics files and the judge log. The judge is the only model call.

| entry | round | precision | recall | F1 | matched comments / generated | matched references / expected | instances scored |
|---|---|---|---|---|---|---|---|
| OCR floor (claude-opus-4-6) | 1 | 27.87 % | 30.44 % | 29.10 % | 398 / 1428 | 432 / 1419 | 185 |
| OCR floor (claude-opus-4-6) | 2 | 27.73 % | 30.37 % | 28.99 % | 396 / 1428 | 431 / 1419 | 185 |
| OCR floor (claude-opus-4-6) | 3 | 27.66 % | 30.37 % | 28.95 % | 395 / 1428 | 431 / 1419 | 185 |
| OCR floor (claude-opus-4-6) | mean of 3 | 27.75 % | 30.40 % | 29.02 % | | | |
| composed (d2-reader + gate + C4) | 1 | 34.28 % | 29.49 % | 31.70 % | 363 / 1059 | 417 / 1414 | 184 |
| composed (d2-reader + gate + C4) | 2 | 33.99 % | 29.56 % | 31.62 % | 360 / 1059 | 418 / 1414 | 184 |
| composed (d2-reader + gate + C4) | 3 | 33.99 % | 29.35 % | 31.50 % | 360 / 1059 | 415 / 1414 | 184 |
| composed (d2-reader + gate + C4) | mean of 3 | 34.09 % | 29.47 % | 31.61 % | | | |

Both entries re-counted over the 184 instances both were scored on, from the per-instance records of the same metrics files:

| round | entry | precision | recall | F1 | matched comments / generated | matched references / expected |
|---|---|---|---|---|---|---|
| 1 | floor | 27.84 % | 30.48 % | 29.10 % | 397 / 1426 | 431 / 1414 |
| 1 | composed | 34.28 % | 29.49 % | 31.70 % | 363 / 1059 | 417 / 1414 |
| 2 | floor | 27.70 % | 30.41 % | 28.99 % | 395 / 1426 | 430 / 1414 |
| 2 | composed | 33.99 % | 29.56 % | 31.62 % | 360 / 1059 | 418 / 1414 |
| 3 | floor | 27.63 % | 30.41 % | 28.95 % | 394 / 1426 | 430 / 1414 |
| 3 | composed | 33.99 % | 29.35 % | 31.50 % | 360 / 1059 | 415 / 1414 |
| mean of 3 | floor | 27.72 % | 30.43 % | 29.02 % | | |
| mean of 3 | composed | 34.09 % | 29.47 % | 31.61 % | | |

### Caveats

- **The readers ran on different models.** The composed reader ran on claude-opus-5-5 with a claude-opus-4-8 filter, the floor on claude-opus-4-6.
- **This entry checks the reader's comments; it does not yet run the instruments first.** A filter raises precision and cannot raise recall. 12 of 196 instances are unscored: 11 commits GitHub no longer serves, 1 reader failure.
- **The ceiling is behaviour.** Six readers classed every reference note the entry missed, over all 184 instances. 403 of 997 are behaviour (278 inside one function, 125 that need a run); catching all of them takes recall from 29.5 % to 58.0 %. The 363 surface notes (naming, wording, docs) are a reader's job, and no instrument is tuned for them.
- The floor was scored on 185 instances and the composed entry on 184, so the main table compares different instance sets. The same-instance table compares them over the common set.
- Scored by the floor only: gofr-dev__gofr@c1a26ad. Scored by the composed entry only: none.
- Checkout adapter, both passes: one blobless checkout per instance, deepened until the merge base resolves, removed after the review. Same commits and files, only clone depth and folder name differ.
- Judge adapter: temperature and top_p are removed from every judge call, because Anthropic's OpenAI-compatible endpoint rejects them on claude-opus-5-5 and `judge.py` scores such an error as no match. Same prompt, model, max_tokens and parsing.
- `JUDGE_CONCURRENCY` is 8 on both passes (`judge.py` default 3). It changes call parallelism, not the calls.
- The composed entry is not one of the pipeline's reviewers: `composed.py` writes its results in the ocr result shape and the unchanged `evaluate.py` scores them with `--reviewer ocr --results-dir`.
- The composed set is a merge of five runs of the same entry: 184 of 196 instances, 5 duplicates dropped with the first writer kept.
- Judge timeouts: on the composed pass 5 of 2,241 judge calls hung until the SDK's default 600 s timeout and then succeeded on the SDK's retry. The floor pass had none.

The full per-instance results, the gate rows, tokens and dollars: [`RESULT.md`](https://github.com/NexusGPT/differential-attestation/blob/25b7ab20c945270c28251d48851e6d844565fc56/research/open-code-review/d3/RESULT.md). The full leaderboard is on the [benchmark page](/benchmark/).
