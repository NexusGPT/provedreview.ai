---
title: How it works
order: 1
lede: lean reads the old and new version of a function, then decides by proof, by exhaustive exploration or by execution that they behave the same outside a declared scope, and says which.
sources: lean:docs/how-it-works.md, lean:README.md
---

lean is a differential equivalence checker. You give it the old and the new version of a function and the scope of what was meant to change. It reports the strongest verdict the evidence supports ([verdicts](/docs/lean/verdicts/)). Two lanes work on every function, and a third rung exists for components with a finite state.

## What lean checks

The lint comes first. It decides what has a reading. A function is inside the subset when every construct in it has a meaning as mathematics. The lint names the first construct that does not, with its line, its rule and what to write instead. A function outside the subset still runs in lane B. Only the proof is withheld.

### What it reads

lean reads TypeScript as written: records, arrays, tuples, strings, Map and Set, optionals and unions, generics; loops, `switch`, labelled `break`, recursion, generators; `try`/`catch`/`finally`; `async`/`await`, `.then` chains, `Promise.all`; classes; callbacks; timers on a virtual clock; dynamic `import()`; React components with hooks, effects, context and Tailwind classes.

Each construct gets one of five readings:

| reading | meaning |
|---|---|
| exact | a Dafny value of the same meaning |
| transition | a step of an explicit world |
| uninterpreted | the same unknown on both sides |
| opaque | one transition named by the block's text |
| refused | named, with what to write instead |

The area table (values, numbers, control, operators, effects, exceptions, async, classes, functions as values, references, the library, objects and keys, React, time, modules) is in [how-it-works.md](https://github.com/NexusGPT/lean/blob/v0.1.3/docs/how-it-works.md#what-it-reads). Every construct, with its reading and an example, is in [subset.md](https://github.com/NexusGPT/lean/blob/v0.1.3/langs/ts/subset.md). What stays refused, and why, is on [Limits and refusals](/docs/lean/limits/).

### What "equal" means

Two versions are equal outside the scope when, for every input outside it and every world, four observations are identical up to a renaming of fresh objects:

1. the outcome (the value returned or the value thrown)
2. the object graph reachable from the arguments and the receiver
3. the ordered trace of effects with their answers
4. the pending work (promises unsettled, timers armed, jobs queued)

The one axiom: an effect is a transition of a world. It is stated, not hidden. The hole most equivalence tools fall into, `readClock() === readClock()` proved equal to `true`, is closed by construction, since two reads of the clock are two transitions. The full statement is [SEMANTICS.md](https://github.com/NexusGPT/lean/blob/v0.1.3/langs/ts/SEMANTICS.md).

## Lane A: proofs

The translator turns both sides into Dafny.

- A pure function becomes a function.
- A loop becomes a recursive helper with its termination measure.
- An effectful call takes the world and returns the next one.
- A parameter the function changes is returned beside the result.
- Plain records and arrays live in a heap the function threads.
- A component is a function of its props and its hook slots.

`spec/theorem.py` writes one lemma per changed function: outside the scope, `f_parent(x) == f_candidate(x)` for every input, every world and every fuel. Dafny and Z3 decide it. Code whose text is identical on both sides is aliased, not proved.

## Lane B: execution

Both versions load in one process, each in its own sandbox, against the same fakes: every import that leaves the package, every global that reaches outside, every field of a receiver.

Inputs come from the parameter types and from the values the code compares against. Boundary values come first. Recursive shapes are unfolded. Objects are sometimes shared between positions. If your data admits only some values of a type, tell lean with [known values](/docs/lean/known-values/).

A fake records what is asked of it and answers from the seed and the path, the same on both sides. Two runs disagree only where the code disagrees. After each call lane B compares the four observations above. A synchronous loop that never ends is a timeout under a watchdog, never a hang. A difference is a `WITNESS`, with the input.

Lane B needs only Node. Without Dafny and Python, lane A reports `ASK`.

## The finite lane

When a component's hook slots and props are finite by their types, `exec/finite.mjs` steps the parent and the candidate together through every click order from every prop assignment. Effects and timers run inside each step. The exploration goes to the end of the state space. `check.mjs` reports the strongest rung that holds.

```text
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/finite_components/parent.tsx --candidate langs/ts/tests/pairs/finite_components/candidate.tsx --unit Toggle --no-project --n 60 --out toggle.json
PASS-decided -> toggle.json   # every click order from every prop assignment, decided: 8 state pairs over 2 assignment(s)
```

A `PASS-decided` is as final as a proof for that component. More on components: [Front end](/docs/lean/front-end/).

## How a caller of a changed function is judged

A function whose own text is unchanged can still behave differently, because a function it calls changed.

- In lane A, a changed function that calls other changed functions is proved through their proved relations. A recursive cycle is proved by induction on its fuel. The certificate names the callees' relations.
- In lane B, the caller runs against the changed callee like any other function.

In the ledger example of the README, `Ledger.post` has a harmless refactor as its own text. It calls the changed `applyAll`, so its verdict is a `WITNESS`: `posted: 2` against `posted: 1`, and the receiver's `count` differs (2 against 1).

In a pull request an unchanged caller gets its own row, with the callee named ([Pull requests and CI](/docs/lean/pull-requests/)):

```text
5 unchanged caller(s) checked through lane B, 2 with a WITNESS through a changed callee
```

## The certificate

A certificate travels with every verdict. It holds:

- the unit and the hash of each side
- lane B's bound: inputs, seed, time limit, the fake policy, the observation layer
- lane A's lemmas, with the theorem's hash and the prover version
- the library records the run checked
- for a `WITNESS`, the input and both observations side by side

What the certificate holds and never holds is on [Assurance](/docs/lean/assurance/).
