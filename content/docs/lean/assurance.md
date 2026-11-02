---
title: Assurance
order: 10
lede: What the code under test can reach, what the certificate holds and never holds, and the check behind each line.
sources: lean:docs/ASSURANCE.md, lean:README.md
---

Each line of the assurance case names the check that enforces it. `node scripts/assurance-check.mjs` finds every named check, runs it and exits 1 when one is missing or red. A line marked "no check" states a limit, not a guarantee.

```bash
node scripts/assurance-check.mjs
```

## The execution lane's sandbox

Each version runs in its own `node:vm` context built by `sandbox()` in `langs/ts/exec/run.mjs`, against recording fakes in `langs/ts/exec/fake.mjs`.

- **The network.** `fetch` is a fake. A call is recorded with its arguments and sends nothing.
- **Imports.** Every package and every Node built-in (`fs`, `child_process`, `http`), so every import but a file of the package, is a fake module. `react` and its JSX runtime are lean's models. A call on a fake is recorded. No file is written, no process starts.
- **The host's environment.** `process` is a fake, so `process.env` answers fakes, never the host's variables.
- **The clock and randomness.** `Date`, `performance.now` and `process.hrtime` answer seeded, advancing instants and are recorded. `Math.random` draws from the seed.
- **Answers.** A fake answers from the seed and the request's path, so both versions see the same answers. A call into the world faults on a seeded draw of about one in twelve. More than 20000 requests stop the run as a budget. A synchronous call runs under the vm's timeout.
- **No silent exit.** A run never ends without a verdict: a drained event loop or a budget stop is `ASK` with exit 2.

### The limit: not a jail

`node:vm` is not a security boundary, and there is no check for it. The globals hand the context the host's `Object`, and `Object.constructor('return process')()` reaches the host's real `process` (probe of 2026-10-28, `typeof ... .pid` answered `number`). lean's vm context records and fakes the world. It does not contain hostile unit code, which can reach the host process. Containment is the gate's kernel profile and proxy.

Measured on Node 24 ([sandbox-boundary.md](https://github.com/NexusGPT/lean/blob/v0.1.3/langs/ts/design/sandbox-boundary.md)), the worker process denies file writes, child processes, native addons, worker threads and file reads outside the given trees. The network and the environment variables stay open: a probe connected to a local listener and read 32 variables. `LEAN_NET=deny` closes the network at the process's own bindings, and the unit's record names every attempt it refused. A unit with no parent runs without the permission model today.

## The loader's path validation

The package root is the nearest folder above the file holding a `package.json`. A module is inside the root only when its real path (`fs.realpathSync`) equals the root's real path or starts with it followed by a path separator. One that is not inside is the environment's fake module, the same fake as a package. lean has no separate refusal verdict for an outside module.

- A relative import is compiled and loaded only when it is inside the root.
- A sibling folder whose name starts with the root's name (`pkg-evil` beside `pkg`) is outside the root.
- A symbolic link inside the root that points to a file outside it is outside the root, since its real path is tested. A link that stays inside the root loads.
- A relative `.json` import is read only when it is inside the root. Outside, it is a fake and the file is never read.
- An alias from the project's `paths` is loaded only when it is inside the root.
- A relative asset import (`.css`, images, fonts, `.md`, `.html`, `.wasm`) is a fake module and is never read.

## What lean records, and what it never records

The certificate of `langs/ts/check.mjs` holds:

- the tool name
- each input file's path and the first 16 hex digits of its SHA-256
- the unit
- lane B's verdict, reason and bound (inputs run, seed, time limit, fake policy), with each witness's input, its drawn arguments and the source lines on each side
- lane A's lemma results, the Dafny summary line, the SHA-256 prefixes of the theorem and the prelude, the output of `dafny --version`, the time limit and the temporary folder

Also held is `timing`: the wall-clock seconds of each lane that ran (`B`, `correspondence`, `doubles`, `translate`, `theorem`, `dafny`). A lane that did not run has no key. No verdict reads it.

Never held:

- **The producer's words.** `check.mjs` reads only the two files, the unit, the scope file, `--project` and its numeric options. Any other text given beside them reaches neither the verdict nor the certificate. The one text it reads from the candidate besides code is a `// lean-adapter` comment, an input map the proof then states as its claim, named in the certificate.
- **The host's environment variables and real network answers.**

Held when the unit hands them to the outside: the generated inputs and the values the unit passes to a fake, and the source text of the lines a witness names. A secret written literally in the source file can therefore appear in a witness.

The pull-request run (`langs/ts/pr.mjs`) skips a changed file whose name is a secret's (`.env*`, `id_rsa*`, `.pem`, `.key`, `.p12`, `.pfx`, `.jks`) by its name, before reading anything else of it. `pr.mjs` writes each checked row with its key and context to `.lean/cache/<key>.json`. Every run but a preview carries a run identity ([Pull requests and CI](/docs/lean/pull-requests/)).

## The toolchain

- The TypeScript compiler and fast-check are vendored under `langs/ts/vendor`, pinned by lean's commit.
- The run identity hashes lean's commit, the hashes of the library and advice tables and the Dafny version string. A change to any of them is a new identity.
- The certificate's `tools` record holds `node` (`process.version`), `dafny` (the text of `dafny --version`) and `z3` (the text of `z3 --version`). `node` is recorded on every certificate. `dafny` and `z3` are recorded once lane A has run Dafny.
- The Z3 is the one `solve/z3.mjs` looks up: `LEAN_Z3`, else the Z3 bundled in a `z3/bin` folder beside the dafny executable, else the `z3` on PATH. `z3Path` is that executable, `z3Source` names which, and `z3` is null with the reason in `z3Source` when none answers.

Limit, no check: lean records these versions as text and does not hash the `dafny`, Z3 or `node` binaries.

## The broker, outside lean

lean does not ship the broker. The paper's design: on `PASS` a broker seals a read-only image I and mints a one-use token bound to h(I), and production runs I only. Its prototypes live outside this repository, with no check here.

- **Read-only image (M35, version 4).** The accepted build is sealed into a read-only disk image. The gate hashes the image and its subtrees against a signed reference and serves from the read-only mount, so a write fails.
- **One-use token (M26).** A token is an HMAC over its id, channel, scope and expiry, bound to one channel and one scope string, and consumed by the first verifier that accepts it. In that prototype the token binds a channel and a scope, not h(I). The binding to the image hash is the paper's design and is not in the prototype code.

## The paper's attacks, with their counts

Quoted from the paper's Section 4.6:

- The effect proxy with a one-use token "stopped 20 of 20 planted effects and 10 of 10 routes around it; a kernel sandbox alone let 12 of 20 through".
- The first release broker "refused 10 of 10 alterations planted by its builder". "An independent attacker then passed 8 of 10"; "a second passed 8 of 10 against the repaired version"; "a third passed 6 of 10 against a version that seals the build into a read-only image with a pinned toolchain and refuses all 30 earlier alterations".
- "Every successful alteration used a resource the gate shared with the producer." The register's row for the third attack lists the six misses: a same-user signing key, a use-time replay, a volume stacked on the mount point, a template clone written after its digest, a same-user toolchain tree, a port squat.

These counts measure the prototypes, not this repository. The paper is at [/paper/](/paper/). The assurance case of the gate itself is on [Assurance case](/docs/differential-attestation/assurance-case/).

## What lean is not

- **Not a jail.** See above. Containment of hostile code is the gate's, in differential attestation.
- **Not a pixel judge.** Pixels, layout and the accessibility tree are DA's screen-analysis row.
- **Not a judge of what a model says.** The code around the call is lean's object. The reply is an outside call, so a different call is a `WITNESS` ([Limits and refusals](/docs/lean/limits/#an-orchestration-around-a-model-call)).
