---
title: Assurance case
order: 8
lede: What holds while lean runs the producer's code. Each line names the check that enforces it, and a line marked no check states a limit.
sources: da:docs/architecture/assurance-case.md
---
Plan B5. The assurance case is `lean/docs/ASSURANCE.md`, in lean's repository. It states what the code under test reaches, what lean records and never records, and the gate's attacks. Each line names the check that enforces it, written `check: <name>`.

`lean/scripts/assurance-check.mjs` reads the document, finds each named check (a `node:test` name in `lean/langs/ts/tests/assurance/`, or a named row of `lean/langs/ts/tests/run.mjs` whose command is a standalone script), runs it, and exits 1 when one is missing or red. A line marked "no check" states a limit, not a guarantee.

The gate's own half is `gate/docs/containment.md` with `gate/containment.mjs`: the profile every gate path that runs a unit's code runs lean under. lean's own copy of the document is on [Assurance](/docs/lean/assurance/).

## The security properties

| section of `lean/docs/ASSURANCE.md` | what it states |
|---|---|
| 1. The execution lane's sandbox | each version runs in its own `node:vm` context against recording fakes: `fetch` is a fake and sends nothing; every package and Node built-in import is a fake module; `process` is a fake; the clock and `Math.random` are seeded; a run never ends without a verdict. Limit, no check: `node:vm` is not a security boundary; `Object.constructor('return process')()` reaches the host's real `process` |
| 2. The loader's path validation | see below |
| 3. What lean records, and what it never records | the certificate holds input file hashes, the bound, the theorem hash and the Dafny version; it never holds the producer's words, the host's environment variables or real network answers; `pr.mjs` skips a secret-named file by its name before reading it |
| 4. The toolchain | the TypeScript compiler and fast-check are vendored; the run identity hashes lean's commit, its tables and the Dafny version; the certificate's `tools` record holds the node, Dafny and Z3 version texts. Limit, no check: lean does not hash those binaries |
| 5. The broker, outside lean | the read-only image (M35, version 4) and the one-use token (M26), prototypes outside the repository, no check here |
| 6. The paper's attacks, with their counts | see below |

The gate adds the containment profile. `GATE_CONTAINMENT` unset is `deny` (lean's `LEAN_NET=deny`). `open` is the switch. Any other value, or a `LEAN_NET` that disagrees, is an error before lean runs. Under `deny`, a lean without `langs/ts/exec/net-deny.mjs` never runs lane B: the unit is `ASK` naming the missing mode. What held is recorded as `containment = {profile, leanNet, lean, held, denied, attempts}`.

## The loader's path validation

The package root is the nearest folder above the file holding a `package.json`. A module is inside the root only when its real path (`fs.realpathSync`) equals the root's real path, or starts with it followed by a path separator. A module that is not inside is the environment's fake module.

Five checks name the cases:

- a relative import that leaves the root;
- a sibling folder sharing the root's name prefix;
- a symbolic link inside the root pointing outside it;
- a relative `.json` outside the root (never read);
- a `paths` alias resolving outside the root.

A sixth: an asset import is a fake module, never read.

## The three attacks, with their counts

Quoted in `lean/docs/ASSURANCE.md` section 6 from the paper (`paper/v3/sections/04-results.tex`, label `sec:mediation`).

1. The effect proxy with a one-use token "stopped 20 of 20 planted effects and 10 of 10 routes around it; a kernel sandbox alone let 12 of 20 through".
2. The first release broker "refused 10 of 10 alterations planted by its builder". An independent attacker then passed 8 of 10. A second passed 8 of 10 against the repaired version. A third passed 6 of 10 against a version that seals the build into a read-only image with a pinned toolchain and refuses all 30 earlier alterations.
3. "Every successful alteration used a resource the gate shared with the producer." The register row of the third attack lists the six misses: a same-user signing key, a use-time replay, a volume stacked on the mount point, a template clone written after its digest, a same-user toolchain tree, a port squat.

The document adds: "These counts measure the prototypes, not this repository."

## Who writes it and who reads it

lean's lane `assurance` wrote it. The plan names its reader: a customer's security team. `lean/scripts/assurance-check.mjs` reads it on every run of that script. The gate lane D5 wrote the containment profile.

## Tests

- `lean/langs/ts/tests/assurance/sandbox.test.mjs` and `lean/langs/ts/tests/assurance/certificate.test.mjs`, run by `node lean/scripts/assurance-check.mjs`.
- `gate/tests/containment.test.mjs`, seven tests: the profile values, a planted socket refused through `gate.check_unit` and `gate.submit`, the open profile, a bad value, a lean without the mode, the preview's lane B, and the two children.

```bash
node lean/scripts/assurance-check.mjs
```

## Worked example: a sibling folder that shares the root's name prefix

The fixture is the tree written in the committed test "loader: a sibling folder that shares the root's name prefix is outside the root and is a recording fake" (`lean/langs/ts/tests/assurance/sandbox.test.mjs`).

```text
pkg-evil/y.ts   export const loaded = 'outside';
pkg/in.ts       export const loaded = 'inside';
pkg/a.ts        import * as o from '../pkg-evil/y';
                import * as i from './in';
                export function f() { return [o.loaded, i.loaded]; }
```

The root is `pkg`. The path `pkg-evil/y.ts` starts with the string `pkg` and is outside the root, because the test compares the root followed by a path separator. The test asserts that `o.loaded` is a fake and that `i.loaded` is `'inside'`. Run on 2026-10-31 at lean `5f96f554` with `node --test --test-name-pattern=loader`, the six loader tests passed (6 pass, 0 fail).

## Gaps between plan and code

1. **The section number.** The brief, the plan and `lean/docs/ASSURANCE.md` say the attacks are in Section 4.6. In the built paper Section 4.6 is "The producer's loop". The attacks are in Section 4.8, "Mediation, release, intent".
2. **The toolchain is named, not hashed.** Plan B5 says "the toolchain pinned by hash". lean records the node, Dafny and Z3 versions as text and hashes none of the binaries (no check). Hashing of binaries exists only in the M35 instrument, outside lean.
3. **The broker has no check here.** Plan B5 lists the broker's read-only image and one-use token. Both are prototypes outside lean with no check. In the M26 prototype the token binds a channel and a scope, not `h(I)`.
4. **Lines without a check.** Plan B5 asks for a test name per line. Four places state a limit or a prototype with no check: `node:vm` is not a security boundary (section 1), the binaries are not hashed (section 4), the M35 instrument (section 4), the broker (section 5).
5. **What the gate's profile leaves open.** `gate/CONTRACT.md` quotes lean's measurement: the worker's readable `process.env` and the parentless-unit child stay open until lean's follow-up lane lands. The replay and states children share that gap.
6. **The paper does not cite it.** Plan F11 cites the assurance case from the method's release paragraph. No section of `paper/v3/sections/` contains the word "assurance".
7. **The Go broker attack re-run.** Plan E re-runs the three attacks against a Go broker. Phase E is not built.
