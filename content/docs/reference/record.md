---
title: Record shape
order: 2
lede: The fields of check.mjs's out file and of a certificate, as far as the sources show them, and the shape of DA's run record.
sources: lean:docs/ASSURANCE.md, lean:README.md, lean:docs/how-it-works.md, lean:docs/pull-requests.md, lean:CHANGELOG.md, da:README.md, da:docs/architecture/run-record.md
---
The sources name fields; they do not print a full schema. This page lists the fields the sources name and nothing else.

## The out file of check.mjs

`--out` names the file. The jq line from the README reads these paths:

```bash
jq -c '.witness | {input, floor: .args[3], parent: .parent.outcome.returned.posted, candidate: .candidate.outcome.returned.posted}' ledger.json
```

| path | what it holds |
|---|---|
| `.witness.input` | the input that separates the versions |
| `.witness.args` | the drawn arguments |
| `.witness.parent.outcome` | the parent's outcome: `returned` or `threw` |
| `.witness.candidate.outcome` | the candidate's outcome |
| `.witness.where.lines` | the file, the lines and the text of the statement on each side that produced the first differing effect or the return |

Lane B compares four things after each call: the outcome (the value returned or the value thrown), the object graph reachable from the arguments and the receiver, the ordered trace of effects with their answers, and the pending work (promises unsettled, timers armed, jobs queued).

## The certificate

| part | what it holds |
|---|---|
| the tool name | the name of the tool |
| input files | each file's path and the first 16 hex digits of its SHA-256 |
| the unit | the function checked |
| `lanes.B` | the verdict, reason and bound (inputs run, seed, time limit, fake policy), and `witnesses`: each witness's input, its drawn arguments and the source lines on each side |
| `lanes.A` | the lemma results, the Dafny summary line, the SHA-256 prefixes of the theorem and the prelude, the output of `dafny --version`, the time limit and the temporary folder |
| `timing` | the wall-clock seconds of each lane that ran |
| `tools` | `node`, `dafny`, `z3`, `z3Path`, `z3Source` |
| sandbox rows | one row for every name the sandbox allow and deny list refused |

A `lanes.A` entry reads like this in the README's runs: `lanes.A: ASK, translate: outside the subset (unsupported-syntax)`, `lanes.A: Equal_confirm: true; Dafny: 1 verified, 0 errors`.

### lanes.B.witnesses

A DA report row shows the path `certificate.lanes.B.witnesses[0]`. Its content in the immich example:

```text
input   { id: "-1", recipientID: "vdiyf", notify: true, force: true, delay: 1, source: "copy" }
parent  notification.service.ts:324   recipientIds.includes(user.id)
cand.   notification.service.ts:343   return JobStatus.SUCCESS;
```

### timing

The keys are `B`, `correspondence`, `doubles`, `translate`, `theorem` and `dafny`. A lane that did not run has no key. No verdict reads `timing`.

### tools

| key | value |
|---|---|
| `node` | `process.version`; recorded on every certificate |
| `dafny` | the text of `dafny --version`; recorded once lane A has run Dafny |
| `z3` | the text of `z3 --version`, run on the one Z3 lean looks up; null when none answers, with the reason in `z3Source` |
| `z3Path` | that executable |
| `z3Source` | which lookup found it: `LEAN_Z3`, the Z3 bundled in a `z3/bin` folder beside the dafny executable, or the `z3` on PATH |

### Sandbox rows

lean reads the project's allow and deny list, `.gate/sandbox.json` at the parent commit, and applies it to lane B's sandbox. Every refused name is a certificate row. With `LEAN_NET=deny`, the unit's record names every network attempt it refused.

## The pull-request report

`pr.mjs` writes a report with one row per changed function. The `coverage` column holds one of:

| value | meaning |
|---|---|
| `checked` | a verdict exists |
| `refused:<rule>` | the lint's first rule; lane B's verdict is kept in the row |
| `failed:loader`, `failed:timeout`, `failed:translation-defect`, `failed:harness` | no usable verdict |
| `skipped:binary`, `skipped:secret-path` | never read |
| `skipped:budget` | a budget stopped the run before this function |

The report carries a run identity: the two commits, the function set, lean's own commit, the library and advice tables and the Dafny version. Each function has a key over its two texts, its same-file callees, the file outside its functions, the files it imports and the tsconfig. A reused row is marked `reused`. A stopped run carries `stop: { reason, reached, total }`.

Files it writes: `.lean/cache/<key>.json` for each checked row, and `.lean/runs/<identity>.refusals.json` for the refusals, whole or not at all.

## DA's run record

`gate/record.mjs` keeps one append-only JSON Lines file per run identity, `gate/runs/<identity>.jsonl`. Every line is one JSON object:

| field | value |
|---|---|
| `ts` | the ISO time of the append |
| `run` | `<identity>-<n>`: n counts the run ids already in the file, plus one |
| `identity` | a plain token; a gate run uses a 64-digit sha256 |
| `kind` | `intake`, `check`, `verdict`, `broker` or `reuse`; any other kind is refused |
| the payload | any other keys; a payload that sets `ts`, `run`, `identity` or `kind` is refused |

The detail, with the writers, the readers and a worked example, is in [Run record](/docs/differential-attestation/run-record/).
