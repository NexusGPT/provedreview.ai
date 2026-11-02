---
title: Verdicts
order: 2
lede: Five verdicts in a fixed order, from WITNESS to ASK, and two outside it. Each names what backs it.
sources: lean:README.md, lean:docs/how-it-works.md, lean:docs/limits.md, lean:langs/ts/README.md
---

`check.mjs` reports the strongest verdict the evidence supports: `WITNESS`, then `PASS-proved`, then `PASS-decided`, then `PASS-bounded`, then `ASK`. A bounded pass never becomes a proof. Two more verdicts sit outside the order: `REFUSE` and `NEW`.

| verdict | what it means | what backs it |
|---|---|---|
| `WITNESS` | the two versions behave differently, and here is the input or the click sequence | both observations, side by side, replayable |
| `PASS-proved` | equal on every input, every world and every fuel, outside the declared scope | a theorem checked by [Dafny](https://dafny.org) and Z3: its hash, the prover version, each lemma |
| `PASS-decided` | a component whose state and props are finite by its types: equal on every click order, explored to the end | the state pairs visited, the prop assignments, the handlers fired |
| `PASS-bounded` | no difference found on *n* generated inputs and click sequences under a frozen world | *n*, the seed, the fake policy, the sequence depth, the time limit |
| `ASK` | undecided, and exactly why | the construct, the lemma that did not close, the timeout, the changed interface |
| `REFUSE` | a construct with no faithful reading (named), or a local import that cannot load | the rule, or the loader error |
| `NEW` | a unit with no parent, loaded and run on drawn inputs | inputs, seed, fakes, faults, trace shapes; no equality claim |

`check.mjs` exits 0 on every verdict and 2 when a run ends with no verdict.

## WITNESS

A difference, with its input. A function outside the proof subset still gets this answer: the lint names the construct and lane A says `ASK`, but lane B runs both versions. Here the candidate also adds one to the caller's first positive row and takes it off the result, so the return value never changes:

```text
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/alias_result/parent.ts --candidate langs/ts/tests/pairs/alias_result/candidate.ts --unit bump --no-project
WITNESS -> bump.json   # the lint refuses line 59 (alias-mutation); input 5: both return 1, the first row is { n: 1 } against { n: 2 }
```

A `WITNESS` carries the source line of the first difference on each side, with the advised rewrite.

## PASS-proved

A theorem. This refactor of a function is proved equal for every input and every world:

```text
$ node langs/ts/check.mjs --parent lean/booking.ts --candidate lean/booking.next.ts --unit confirm
PASS-proved -> lean-booking.json     # lanes.A: Equal_confirm: true; Dafny: 1 verified, 0 errors
```

## PASS-decided

A component whose state is finite by its types, explored to the end. It is as final as a proof for that component.

```text
PASS-decided -> toggle.json   # every click order from every prop assignment, decided: 8 state pairs over 2 assignment(s)
```

A sibling `Mutant` that pins the state to `true` instead of toggling it is a `WITNESS` after two clicks. See [the finite lane](/docs/lean/how-it-works/#the-finite-lane).

## PASS-bounded

No difference in the inputs the bound states. Lane B's bound is real: a frozen world, generated inputs, click sequences to a stated depth. The word stays `PASS-bounded`. This is the answer when lane A could not read the function:

```text
$ node langs/ts/check.mjs --parent usual/booking.ts --candidate usual/booking.next.ts --unit confirm
PASS-bounded -> usual-booking.json   # lanes.A: ASK, translate: outside the subset (unsupported-syntax)
```

It is also the answer when lane A asked and lane B found nothing:

```text
PASS-bounded -> halvings.json      # lanes.A: ASK:unproved, Equal_halvings: false; lane B: no difference in 30 inputs
```

## ASK

Undecided, with the reason named. lean says `ASK` rather than guess. The reason follows the colon:

```text
ASK -> shift.json                  # lanes.A: ASK:interface, no adapter declared; the reason names both ways to declare one
```

Two reasons have their own names: `ASK:interface` (a changed signature without a declared adapter) and `ASK:identity` (a result that may share an input). The full list of when lean asks is on [Limits and refusals](/docs/lean/limits/#when-lean-says-ask).

## REFUSE

A construct with no faithful reading, named by its rule, or a local import that cannot load. Lane B still runs the function. Only a repository-owned local link failure is `REFUSE` with kind `load`. Evaluation failures are `ASK` with their environment class, and test modules are `ASK` before loading. In a pull-request row a refusal shows as `refused:<rule>` in the coverage column ([Pull requests and CI](/docs/lean/pull-requests/#every-changed-function-has-a-row)).

## NEW

A function with no parent. lean loads it and runs it on drawn inputs. It records bounded observations and faults and never claims equality.

```bash
node langs/ts/check.mjs --candidate file.ts --unit f
```

## In a pull request

A function declared in scope reports `IN-SCOPE` with its lane B result. It is information, not a finding, and it never blocks. Scope is optional and declared, never inferred. Without it every difference is a `WITNESS`. See [Pull requests and CI](/docs/lean/pull-requests/).

Why each verdict is built the way it is: [How it works](/docs/lean/how-it-works/).
