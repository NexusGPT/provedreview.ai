---
title: Read the certificate
order: 3
lede: Every verdict carries a certificate. It holds the hashes of both sides and either the theorem and prover version or the inputs, the seed and the bound.
sources: lean:README.md, lean:docs/how-it-works.md, lean:docs/ASSURANCE.md, lean:docs/pull-requests.md, da:README.md
---
## What a verdict carries

Every verdict carries the hashes of both sides, the theorem and the prover version, or the inputs, the seed and the bound. No verdict comes from a model's opinion, and there is no `assume` anywhere a proof can see.

The certificate holds:

- the unit and the hash of each side;
- lane B's bound: inputs, seed, time limit, the fake policy, the observation layer;
- lane A's lemmas, with the theorem's hash and the prover version;
- the library records the run checked;
- for a `WITNESS`, the input and both observations side by side.

What backs each verdict:

| verdict | what backs it |
|---|---|
| `WITNESS` | both observations, side by side, replayable |
| `PASS-proved` | a theorem checked by Dafny and Z3: its hash, the prover version, each lemma |
| `PASS-decided` | the state pairs visited, the prop assignments, the handlers fired |
| `PASS-bounded` | *n*, the seed, the fake policy, the sequence depth, the time limit |
| `ASK` | the construct, the lemma that did not close, the timeout, the changed interface |

## Read the out file

`check.mjs` writes the certificate to the file named by `--out`. The jq line from [First run](/docs/getting-started/first-run/) reads a witness out of it:

```bash
jq -c '.witness | {input, floor: .args[3], parent: .parent.outcome.returned.posted, candidate: .candidate.outcome.returned.posted}' ledger.json
```

```text
{"input":17,"floor":-1,"parent":1,"candidate":0}
```

The fields the jq line uses:

| field | what it holds |
|---|---|
| `.witness.input` | the drawn input, numbered as in the table's `input 12` |
| `.witness.args` | the drawn arguments; `args[3]` is the `floor` parameter of `applyAll` |
| `.witness.parent.outcome.returned` | what the parent returned, here the `Summary` with `posted` |
| `.witness.candidate.outcome.returned` | what the candidate returned |

A witness thrown instead of returned reads `threw` in place of `returned`, as in the `rollback` row of [First run](/docs/getting-started/first-run/).

In a pull-request run, a `WITNESS` row names the statement on each side that produced the first differing effect or the return: `witness.where.lines`, with the file, the lines and the text. It carries the lint's advice when the advice table has an entry at that statement. The DA record of the immich example reads the same data at `certificate.lanes.B.witnesses[0]`: the input it drew, and the two source lines where the versions part.

```text
input   { id: "-1", recipientID: "vdiyf", notify: true, force: true, delay: 1, source: "copy" }
parent  notification.service.ts:324   recipientIds.includes(user.id)
cand.   notification.service.ts:343   return JobStatus.SUCCESS;
```

A proof leaves its mark in `lanes.A`. A passing proof shows `Equal_<unit>: true` and the Dafny summary, as in `Equal_statement: true`, `5 verified, 0 errors`. A lane that did not decide shows `ASK` with a reason, as in `ASK:identity` or `ASK:interface`. The full shape is in [Record shape](/docs/reference/record/).

## What the certificate holds, and never holds

Held:

- each input file's path and the first 16 hex digits of its SHA-256;
- the unit;
- lane B's verdict, reason and bound (inputs run, seed, time limit, fake policy), with each witness's input, its drawn arguments and the source lines on each side;
- lane A's lemma results, the Dafny summary line, the SHA-256 prefixes of the theorem and the prelude, the output of `dafny --version`, the time limit and the temporary folder;
- `timing`: the wall-clock seconds of each lane that ran. No verdict reads it;
- `tools`: `node` on every certificate; `dafny` and `z3` once lane A has run Dafny;
- the generated inputs and the values the unit passes to a fake, and the source text of the lines a witness names.

Never held:

- the producer's words. `check.mjs` reads only the two files, the unit, the scope file, `--project` and its numeric options. The one text it reads from the candidate besides code is a `// lean-adapter` comment;
- the host's environment variables;
- real network answers.

> **Note.** A secret written literally in the source file can appear in a witness.

lean records the node, Dafny and Z3 versions as text. It does not hash those binaries.

Each line of this account names a check in [`docs/ASSURANCE.md`](https://github.com/NexusGPT/lean/blob/v0.1.3/docs/ASSURANCE.md). `node scripts/assurance-check.mjs` finds every named check, runs it and exits 1 when one is missing or red. More: [Assurance](/docs/lean/assurance/).

## Re-run it

The certificate records the bound and the seed, and a fake answers from the seed and the request's path. Same change, same verdict. For the ledger, that command is the one in [First run](/docs/getting-started/first-run/), with `--seed 3`. A `WITNESS` is replayable: run the two versions on its input and watch them end differently.

For a pull request, a certificate under the cache directory is reused when the key over its texts, callees, imports and tsconfig matches. `--fresh` reads no cache.
