# D3: AACR-Bench, OCR floor against the composed entry

The official AACR-Bench pipeline (evaluation/pipeline.py, unchanged) through harness/run_pipeline.py, eval stage, 3 rounds, judge claude-opus-5-5. Floor: OCR on claude-opus-4-6, 185 of 196 instances scored. Composed: d2-reader + gate + C4, 184 of 196 instances scored. Every number below is computed by harness/tables.py from the pipeline's metrics files and the judge log; the judge is the only model call.

Files: floor/ and composed/ hold the per-instance results, the per-round metrics files (metrics_ocr_*_round_<n>.json, with every judge verdict and reason per comment), metrics_ocr_average.json and judge.jsonl. tables.json is tables.py's output.

## Scores

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

## Same instances

Both entries re-counted over the 184 instances both were scored on, from the per-instance records of the same metrics files.

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

Scored by the floor only: gofr-dev__gofr@c1a26ad. Scored by the composed entry only: none.

## Gate rows beside the composed entry

| gate row | value |
|---|---|
| composed instances with a result | 184 |
| reader comments (before routing) | 1059 |
| comments routed to the plain path | 763 |
| comments routed to the gate path (TypeScript, JavaScript) | 296 |
| instances with at least one gate-path comment | 40 |
| instances carrying gate verdicts | 37 |
| gate calls (distinct changed units) | 127 |
| gate CPU seconds (sum over calls) | 1075.3 |
| gate verdicts over comment-unit pairs | ASK 44, NEW 33, PASS-bounded 27, REFUSE 5, WITNESS 104 |
| gate-path comment status | no-unit 81, unchanged-unit 3, unit 212 |
| C4 input / kept / dropped | 296 / 296 / 0 |
| C4 kept with a witness attached | 104 |
| final comments scored | 1059 |

## Tokens and dollars

| pass | instances | tokens in | tokens out | USD | USD per instance | price source |
|---|---|---|---|---|---|---|
| floor reader (OCR, claude-opus-4-6) | 185 | 305,226,550 | 3,459,923 | 420.74 | 2.27 | OCR counters x list price |
| composed reader (Nexus, claude-opus-5-5 + claude-opus-4-8 filter) | 184 | 94,178,023 | 2,130,773 | 411.45 | 2.24 | Nexus tracing costUsd |
| floor judge round 1 (claude-opus-5-5) | 924 calls, 0 errors | 915,940 | 156,536 | 6.79 | | prompt/completion tokens x list price |
| floor judge round 2 (claude-opus-5-5) | 924 calls, 0 errors | 915,940 | 156,820 | 6.80 | | prompt/completion tokens x list price |
| floor judge round 3 (claude-opus-5-5) | 924 calls, 0 errors | 915,940 | 157,609 | 6.82 | | prompt/completion tokens x list price |
| composed judge round 1 (claude-opus-5-5) | 747 calls, 0 errors | 739,143 | 142,080 | 5.80 | | prompt/completion tokens x list price |
| composed judge round 2 (claude-opus-5-5) | 747 calls, 0 errors | 739,143 | 142,643 | 5.81 | | prompt/completion tokens x list price |
| composed judge round 3 (claude-opus-5-5) | 747 calls, 0 errors | 739,143 | 140,589 | 5.77 | | prompt/completion tokens x list price |

## Instances not scored

- ClickHouse__ClickHouse@cc96255: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- ClickHouse__ClickHouse@fd6ba0c: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- astral-sh__uv@ed57db2: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- comfyanonymous__ComfyUI@4936d01: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- comfyanonymous__ComfyUI@cfc3122: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- gofr-dev__gofr@c1a26ad: composed only: the reader failed; a code_search returned 2 MB and the agent turn errored (the floor scored it)
- keycloak__keycloak@1463502: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- keycloak__keycloak@21d4538: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- keycloak__keycloak@2373a48: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- keycloak__keycloak@460f800: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- keycloak__keycloak@79dbba9: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")
- nodejs__node@b225544: both passes: GitHub no longer serves the commit (git fetch answers "not our ref")

## Deviations from the official pipeline

- Checkout adapter, both passes (run_pipeline.py item 1, composed.py step 1): one blobless checkout per instance, deepened until the merge base resolves, removed after the review; same commits and files, only clone depth and folder name differ. Reason: free disk does not hold 50 full clones.
- Judge adapter (run_pipeline.py item 2): temperature and top_p are removed from every judge call, because Anthropic's OpenAI-compatible endpoint rejects them on claude-opus-5-5 and judge.py scores such an error as no match. Same prompt, model, max_tokens and parsing. 429 and 5xx are retried by the SDK, max_retries 8.
- Judge counter (run_pipeline.py item 3): every judge call appends one line to judge.jsonl; the judge cost below is read from it.
- Round reset (run_pipeline.py item 4): judge.py's semaphore and HTTP client are rebuilt inside each of the 3 rounds.
- JUDGE_CONCURRENCY is 8 on both passes (judge.py default 3); it changes call parallelism, not the calls.
- The composed entry is not one of the pipeline's reviewers: composed.py writes its results in the ocr result shape and the unchanged evaluate.py scores them with --reviewer ocr --results-dir.
- The composed set is a merge of five runs of the same entry (this lane's own run and four copies c2 to c5, lane d3-copies): 184 of 196 instances, 5 duplicates dropped with the first writer kept (composed/summary_merge_manifest.json). The copies' stored agent prompt differs from the source in one tab header line (NEXUS+API against NEXUS); the system prompt the model is served has the same sha256 on a copy and on the source.
- Judge timeouts: on the composed pass 5 of 2,241 judge calls hung until the SDK's default 600 s timeout and then succeeded on the SDK's retry (judge.jsonl rows with wall_s over 590); the floor pass had none. A retried call returns the same verdict format and is counted once; the timed-out attempts report no tokens.
- The floor was scored on 185 instances and the composed entry on 184, so the main table compares different instance sets; the same-instance table compares them over the common set.
