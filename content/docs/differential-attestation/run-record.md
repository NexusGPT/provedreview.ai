---
title: Run record
order: 2
lede: One append-only JSON Lines file per run identity. Every step of a gate run is appended and nothing is rewritten.
sources: da:docs/architecture/run-record.md
---
Plan B1. `gate/record.mjs` keeps one append-only JSON Lines file per run identity, `gate/runs/<identity>.jsonl`. The contract is in `gate/CONTRACT.md`, section "record.mjs (B1)".

The file is opened with flag `'a'` (`O_APPEND`) for every line, so a write lands at the end and an open never truncates. A second run with the same identity adds lines under a new run id. Nothing in the module reads a model, a producer's words or a reader's opinion.

## What a row holds

Every line is one JSON object.

| field | value |
|---|---|
| `ts` | the ISO time of the append |
| `run` | `<identity>-<n>`: n counts the run ids already in the file, plus one |
| `identity` | a plain token (letters, digits, dot, dash, underscore; no `..`); a gate run uses a 64-digit sha256 |
| `kind` | `intake`, `check`, `verdict`, `broker` or `reuse`; any other kind is refused |
| the payload | any other keys; a payload that sets `ts`, `run`, `identity` or `kind` is refused |

`gate.submit` writes three kinds (`gate/mcp.mjs`, function `submit`).

- `intake`: `{tool: "gate.preview", input: {worktree, base}, intake, preview}`. The intake is the preview's rows, plus the rows of untracked code files, plus a `skipped:unregistered` row for each changed file no predicate covers.
- `check`: `{tool, input, output}`, one per tool call, in call order. A `gate.witnesses` row comes first when a stored witness touches a changed path. Then one `gate.check_unit` row per checked unit in intake order. Then one `gate.check_artifact` row per touched artifact.
- `verdict`: `{verdict, refusals, asks, new, removed?, witnesses}` plus the change-round fields, `terminal: true`, appended with `fsync`.

The change-round fields come from `changeRoundFields` in `gate/record.mjs`: `seriesVersion: 1`, `event: "round"`, `corpusRun`, `gateVersion`, `change`, `round`, the aggregate `verdict` and `units: [{file, unit, verdict}]`. Only round 0 carries `firstVerdict`, a snapshot of the aggregate and per-unit verdicts.

`appendChangeRound` refuses a round out of sequence, a round after a stop, and a change whose `corpusRun`, `gateVersion` or `change` differs from round 0. `gateVersion()` is the gate's git HEAD plus a sha256 over its top-level `.mjs` files, `schemas/` and `render/`. `brokerFields(anchor)` reads the release broker's anchor of experiment M35 version 4. With no anchor both hashes are null and a `reason` says why.

## Who writes it and who reads it

| writer | what it appends |
|---|---|
| `gate.submit` (`gate/mcp.mjs`) | `intake`, the `check` rows, one `verdict` with round 0 |
| the reference loop (`gate/loop-demo.mjs`) | one `verdict` row with `event: "round"` per check, then one with `event: "stop"` (the stop, and `escaped` when a PASS leaves the planted edit in the draft) |
| the CLI | `node gate/record.mjs append --identity <id> --kind <kind> --json '<payload>'` |

```bash
node gate/record.mjs read --identity <id>
```

| reader | what it reads |
|---|---|
| `readRecords` and `node gate/record.mjs read --identity <id>` | the parsed lines |
| `gate/first-pass-series.mjs` | record files and loop documents; prints one series per gate version and corpus run: first-pass passed, repaired by round, refused, escaped, and incomplete attempts apart |
| `gate/advisory.mjs` | `gateVersion()` for the comment header (`gate/docs/advisory.md`) |

The paper describes the record in its method section: "each step appends to one run record that is never rewritten". Figure 1 draws a "Run record" box under the release broker: "Every step appended; never rewritten."

## Worked example: a submit on the fixture repository

The fixture is `gate/fixtures/repo-source/` (`parent/` and `candidate/`), built into a git repository by `gate/fixtures/build-repo.mjs`. In `src/ledger.ts`, `balance` becomes a `reduce` (a refactor) and `fee` charges 0.02 instead of 0.01 above 100 (a behaviour change). `locales/en.json` gains `ledger.fee` and `locales/fr.json` does not.

The contract test submits that worktree with base `parent` and asserts what the record holds.

- The submit answers `REFUSE`, with a `gate.check_unit` refusal on `fee` whose verdict is `WITNESS`, and none on `balance`.
- The answer's `record` is `<identity>-1`, and the lines of that run read `intake`, then `check` rows, then `verdict`.
- The `gate.check_unit` rows are `balance` then `fee`. The nested callback `balance/entries.reduce()#0` has no check row of its own, and its round entry carries `"covered-by": "balance"`.
- `.github/workflows/ci.yml`, `locales/en.json` and `package.json` each get a `gate.check_artifact` row, after the last unit row. With the registry present, `locales/en.json` is a `REFUSE`.
- The last line has `round: 0`, `firstVerdict.verdict: "REFUSE"`, `fee` at `WITNESS` in `firstVerdict.units`, and a `gateVersion` containing `sha256:`.
- A second submit in the same process answers `<identity>-2`.

## Tests

- `gate/tests/record.test.mjs`: append-only (a second process appends as run 2; the first run's bytes are unchanged and the file grows), bad kinds, unsafe identities and reserved keys refused, broker fields from the anchor, and R9 (no `anthropic`, `openai` or `fetch(` in any gate module).
- `gate/tests/contract.test.mjs`, test "gate.submit: the full run is recorded".
- `gate/tests/first-pass-record.test.mjs`: the first verdict is durable before the loop's repair runs.
- `gate/tests/first-pass-series.test.mjs`: the series reader refuses a missing first verdict, duplicate rounds and a change counted twice.

## Gaps between plan and code

1. **Six fixed check rows.** Plan B1 says `check` holds C1 to C6 in order. The code writes one `check` row per tool call. The six names `lint`, `lane B`, `lane A`, `predicates`, `siblings`, `witnesses` exist only in the helper `oneRun` of `gate/tests/record.test.mjs`.
2. **No broker and no reuse rows from a run.** `gate.submit` writes neither. Only `gate/tests/record.test.mjs` writes them. The M35 anchor names an image hash and no token hash, so `tokenHash` is null with the reason "the anchor carries no token_sha256".
3. **The identity does not hash the draft.** The preview's identity is lean's `runIdentity` with `head: "WORKTREE"` as a literal. Two drafts of the same units on the same base share one record file, and their runs differ by run id only.
4. **No committed record.** `gate/.gitignore` ignores `runs/*.jsonl`. No run record is in any repository. The example rests on the committed test and fixture.
5. **The paper reads no record file.** No row of the paper's register names a `runs/*.jsonl` file. `gate/first-pass-series.mjs` is the reader that would turn records into the paper's counts, and no register row cites it.

Related: [Preview](/docs/differential-attestation/preview/), [Producer tools](/docs/differential-attestation/producer-tools/).
