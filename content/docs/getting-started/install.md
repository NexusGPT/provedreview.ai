---
title: Install
order: 1
lede: Clone lean, or build the container image that holds both lanes. Lane B needs only Node.
sources: lean:README.md, lean:langs/ts/README.md, da:README.md
---
## What you need

Lane B needs only Node, version 24 or later. Dafny and Python are for the proof lane. Without them lane A reports `ASK`.

| tool | version | for |
|---|---|---|
| node | 24 or later | lane B |
| python3 | 3 | the proof lane |
| dafny | 4 or later | the proof lane |

The TypeScript compiler is vendored in `vendor/typescript` (version 5.9.3, Apache-2.0, licence included), so there is no install step for it.

> **Note.** Lane B forks its worker with Node's `--permission`, which node 20 rejects.

## Clone lean

```bash
git clone https://github.com/NexusGPT/lean && cd lean
```

Run every command in these docs from the repository root. The three runs in [First run](/docs/getting-started/first-run/) start here.

## The container image

The image has both lanes and nothing to install: node 24.22.2, python3, Dafny 4.11.0 and the Z3 4.12.1 its release bundles, all pinned in the [`Dockerfile`](https://github.com/NexusGPT/lean/blob/v0.1.3/Dockerfile). It is 873 MB on disk and 216 MB to download.

```bash
docker build -t lean:local .
docker run --rm -v "$PWD:/work" -w /work lean:local check --parent old.ts --candidate new.ts --unit f --no-project
docker run --rm lean:local node langs/ts/tests/run.mjs --pair readme_ledger     # any other command runs inside the checkout
```

The first `docker run` mounts the current folder at `/work` and passes `check` to lean. The second runs any other command inside the checkout.

## Differential attestation

DA pins lean as a submodule. Clone DA, then fetch the checker:

```bash
git clone https://github.com/NexusGPT/differential-attestation && cd differential-attestation
git submodule update --init lean            # the checker, pinned to the admitted lean master
```

The proof instrument in DA needs Node 24. Python 3 and Dafny 4 add the proof lane, and without them lean answers `ASK` there.
