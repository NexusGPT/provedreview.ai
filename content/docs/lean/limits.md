---
title: Limits and refusals
order: 9
lede: What lean refuses, in three kinds (by design, backlog, environment), when it says ASK, and what it leaves to others, with a run for each.
sources: lean:docs/limits.md, lean:README.md
---

Every refusal is a named rule with a fixture the suite checks, and lane B still runs the function. The lint tells you which kind you hit and what to write instead ([Writing provable code](/docs/lean/writing-provable-code/)). Runs below use `--no-project --n 30 --dafny-seconds 30` unless they say otherwise. The `#` lines are read from the certificate.

## Three kinds of refusal

| kind | what | the reader's expectation |
|---|---|---|
| **by design** | a change through an alias of a parameter; a prototype write; `===` on two objects; `eval` and `new Function`; `super` as a value; a loop with no measure (`ASK`); a changed signature without a declared adapter (`ASK:interface`) | stays refused: no value model keeps the meaning, and a wrong proof would be worse than an `ASK` |
| **backlog** | a value whose type nothing checked (`as T` from `any`) in a slot its reading does not reach; a strict-mode error no edit fixes; type forms with no reading yet; a field read after a call on an object the reading cannot name; some `Promise` constructor shapes; a callback handed to an outside call that writes a local | each has a planned reading, written in its design note under `langs/ts/design/`; the lint names the construct and the rewrite today |
| **environment** | a module the checkout cannot resolve; a dependency not installed | the census counts these apart from the subset; installing the project removes them |

The census counts the three kinds over a repository:

```bash
node langs/ts/census.mjs <repo>
```

## When lean says ASK

lean says `ASK` rather than guess. Today it asks on:

- a `while` loop with no measure it can derive
- a loop reshaped into a different loop when its body does more than guard and push
- a result that may share an input (`ASK:identity`)
- a suspended render
- two asynchronous schedules racing beyond the explored bound
- a changed signature without a declared adapter (`ASK:interface`)
- a difference that passes only through a module lean cannot load

Lane B's bound is real: a frozen world, generated inputs, click sequences to a stated depth. Its word is `PASS-bounded`, and it stays that word.

## A loop with no measure

The lint admits a loop whose end it cannot show. The translator reads the loop as one opaque step named by its text. The same loop on both sides is the same step. A changed loop is two different steps, so lane A asks and lane B bounds. A proof that cannot show a loop ends would be a false proof. To get a proof, write a counted `for` or an index walk, or put a `// @decreases` hint before the loop.

`halvings` counts how many times `n` halves before it reaches 1. `halvings.next.ts` rewrites the loop's text (`m >= 2` for `m > 1`, `steps = steps + 1`). `halvings.tidy.ts` leaves the loop alone and changes only the return.

```text
$ node langs/ts/check.mjs --parent docs/examples/limits/halvings.ts --candidate docs/examples/limits/halvings.next.ts --unit halvings --no-project --n 30 --dafny-seconds 30
PASS-bounded -> halvings.json      # lanes.A: ASK:unproved, Equal_halvings: false; lane B: no difference in 30 inputs
$ node langs/ts/check.mjs --parent docs/examples/limits/halvings.ts --candidate docs/examples/limits/halvings.tidy.ts --unit halvings --no-project --n 30 --dafny-seconds 30
PASS-proved -> halvings-tidy.json  # the loop is the same text: Equal_halvings: true; Dafny: 1 verified, 0 errors
```

## A changed signature

A different signature is a different function until you state the mapping. Without it lean answers `ASK:interface`, even when lane B sees the two sides differ on raw inputs, because that comparison is not a behaviour change. With the mapping declared, as a `// lean-adapter` comment on the candidate or as an `adapters` entry in the scope file, lean proves the candidate on the adapted inputs equal to the parent on the original ones.

The candidate, with its adapter comment:

```ts
// lean-adapter {"from": ["x"], "to": ["x"], "map": ["Some(x)"]}
export function pad(x: number | null): number {
  if (x === null) return 0;
  return x + 1;
}
```

The parent is `export function pad(x: number): number {` returning `x + 1`.

```text
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/adapters/parent.ts --candidate langs/ts/tests/pairs/adapters/candidate.ts --unit pad --no-project --n 30 --dafny-seconds 30
PASS-proved -> pad.json            # the adapter is in the certificate; Equal_pad: true; Dafny: 13 verified, 0 errors
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/adapters/parent.ts --candidate langs/ts/tests/pairs/adapters/candidate.ts --unit shift --no-project --n 30 --dafny-seconds 30
ASK -> shift.json                  # lanes.A: ASK:interface, no adapter declared; the reason names both ways to declare one
```

## A call into code outside the repository

A call into code lean does not read is one unknown, the same on both sides. A standard-library member is read exactly, from a table validated by run. Any other call (a package, an injected service, a module outside the repository) is a step of the world, the same for the same arguments in the parent and in the candidate.

A proof therefore holds modulo the outside: if the outside answers alike when asked alike, the two versions are equal. Moving, adding or dropping such a call changes the sequence of steps, so it is never proved equal.

```text
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/heap5_outside/parent.ts --candidate langs/ts/tests/pairs/heap5_outside/candidate.ts --unit cost --no-project --n 30 --dafny-seconds 30
PASS-proved -> cost.json           # price() is called once, in the same place; Equal_cost: true; Dafny: 26 verified, 0 errors
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/heap5_outside/parent.ts --candidate langs/ts/tests/pairs/heap5_outside/candidate.ts --unit order --no-project --n 30 --dafny-seconds 30
PASS-bounded -> order.json         # save() moved before price(); lanes.A: ASK:unproved, the outside may answer differently
```

### The one case that is ASK

`ASK` is for one case only. The two versions differ, and the only trace of the difference passes through a module lean could not load. lean never ran that module's code, so it cannot say that a call differs from the inlined body of that call. A difference anywhere else (the returned value, a thrown error, a call to a module that loaded, the heap) stays a `WITNESS`.

In the `bench_drops` pair, `report` calls a helper of a module that reads a browser global when it loads, and the candidate inlines the helper's body. This run uses the pair's own `tsconfig.json`, so it has no `--no-project`:

```text
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/bench_drops/parent.tsx --candidate langs/ts/tests/pairs/bench_drops/candidate.tsx --unit report --n 30 --dafny-seconds 30
ASK -> report.json                 # lane B: unloadable module settings.ts: Cannot read properties of undefined (reading 'getItem'); the difference passes through it
```

## A prototype write

`d[k] = v` with `k` possibly `"__proto__"`, `Object.create` and `setPrototypeOf` are refused by the rule `prototype`. A `__proto__` write can change the behaviour of any object, so a proof would need the whole prototype chain as state. Write a `Map`, or `{ ...d, [k]: v }`, which makes an own key. Lane B still runs such a function: in the `proto_write` pair, `mark` is a `WITNESS` on the key `"__proto__"`.

## An orchestration around a model call

The code around a model call is lean's object: retries, routing, parsing the reply, error handling, timers. The reply is an outside call, so both versions must make the same call with the same arguments, or lean witnesses the difference. lean does not judge what a model says.

In `docs/examples/limits/`, `retry.next.ts` loops `i <= tries` where `retry.ts` looped `i < tries`: one call to the model more than the caller allowed. `label`, which parses the reply, is untouched.

```text
$ node langs/ts/check.mjs --parent docs/examples/limits/retry.ts --candidate docs/examples/limits/retry.next.ts --unit askUntilOk --no-project --n 30 --dafny-seconds 30
WITNESS -> retry.json              # input 0, tries is 0: the parent never calls model.complete, the candidate calls it once
$ node langs/ts/check.mjs --parent docs/examples/limits/retry.ts --candidate docs/examples/limits/retry.next.ts --unit label --no-project --n 30 --dafny-seconds 30
PASS-proved -> label.json          # Equal_label_: true; Dafny: 15 verified, 0 errors
```

## What lean leaves to others

- **Pixels.** Pixels, layout and the accessibility tree are differential attestation's screen-analysis row. lean names the state where two renders differ.
- **Containment.** lean's sandbox is not a jail. Containment of hostile code is the gate's, in differential attestation. The measured boundary is on [Assurance](/docs/lean/assurance/#the-execution-lanes-sandbox).

See [Verdicts](/docs/lean/verdicts/) for what each answer means.
