---
title: Around lean
order: 8
lede: lean answers one question. This page covers the layer above it: the ledger both lanes share, the four worlds it threads, and what differential attestation adds.
sources: lean:docs/around-lean.md, lean:README.md
---

lean answers one question: do two versions of a function behave the same outside a declared scope? This page is the layer above it. It covers lean's state, the parts of a program it threads one contract at a time, the gate that would use it as one check among six, and the coding agent's loop as a research setting. The design source is [research-integration.md](https://github.com/NexusGPT/lean/blob/v0.1.3/langs/ts/design/research-integration.md), sections 1, 2 and 11.

## Differential attestation

The pipelines around lean live in one repository, **differential attestation** (DA): [github.com/NexusGPT/differential-attestation](https://github.com/NexusGPT/differential-attestation). Each is a row with its own parameters and its own report:

- **Screen analysis.** Two builds rendered on the same screens under one pinned browser, compared by pixels (per-channel and pixel-count tolerances, masks, regions), by layout boxes and by the accessibility tree. lean names the state where two renders differ. DA judges what is shown.
- **Open code review.** A diff read against its stated scope, with the readers' findings kept apart from lean's verdicts.
- **The gate.** One pull-request check that assembles lean's table with the other rows. Advisory first.
- **The benchmark.** The gate measured on real repositories, with the numbers from committed runs.
- **Containment.** Hostile code is the gate's problem, not the checker's.

lean plugs in through its certificate: one JSON per function with the verdict, what backs it, and the seconds each lane took. Any other check of that kind couples with lean the same way. DA is documented in [The method](/docs/differential-attestation/method/).

## What settles a claim

A claim about a change is settled only by a check that can fail, and every check states what it covered.

- **A proof** (lane A): a theorem Dafny and Z3 checked, for every input and every world. It settles the claim.
- **A decided state space** (the finite lane): every click order from every prop value, explored to the end. It settles the claim for that component.
- **A witness** (lane B): an input on which the two versions differ, replayable. It settles the claim the other way.
- **A bounded run** (lane B): no difference within a stated bound. It does not settle the claim, and the verdict says so (`PASS-bounded`).
- **`ASK`**: nothing above holds, and the reason is named.

No model takes part. A producer's description of its own change never enters a verdict.

## One state object: the ledger

Both lanes read and write one state object, the ledger. Each component is a part of the world a function can touch:

| component | holds |
|---|---|
| heap | records, arrays, dictionaries, Map, Set and Date cells, class instances |
| cells | module variables and the variables a closure captures |
| callables | a function value: its code identity and the cells it captured |
| pending | timers, intervals, promise reactions, events |
| clock | the instant a read returns |
| library | every built-in call as a transition on the ledger |

### Obligations

For each function the translator lists the ledger components it touches. A function is provable when every one of them has a transition model. A touched component with no model is an obligation: lean says `ASK:obligation` and names it, and lane B still runs. `REFUSE` stays for what no model can carry: interception, code built from strings, a prototype changed after it escaped. The state-completeness audit that writes these obligations is built.

## The four worlds

Four parts of real programs are worlds lean must thread before it can judge them. The remedy each time is one testable contract, its bound or layer in the certificate, and `unknown` where it does not apply.

| world | what it adds | the contract | the boundary in the certificate |
|---|---|---|---|
| framework | decorators and their metadata are shared state | a decorator table keyed by package and export, each row with a fixture run against the framework; a metadata cell | only listed exports are modelled; an unknown decorator stays `ASK:interface` |
| concurrency | a second call can arrive while the first waits | scheduled promises, two callers on one receiver, only the orders that swap two dependent accesses | complete only within the declared bound: live calls, preemptions, the event model |
| front end | "the same screen" depends on a layer | the tree to a depth with context, then styles under a pinned Tailwind configuration, layout apart | each layer its own verdict; an unread style is `unknown`, never equal |
| refactors | a change spans several functions | relational summaries of changed callees, used at the call sites; an explicit adapter for a changed signature | a caller's proof rests on its callees' proved relations, named in the certificate |

Each row has a first version with a pair test today. Layout, pixels and accessibility stay outside any equality verdict.

## The gate around lean

A change to a system also touches what is not a function: a cache key that omits an input, a file missing from an asset list, a partial locale. The gate is the planned acceptance procedure around lean:

1. The requester states the scope and the wanted outcome on real screens of the old build.
2. The producer, a person or an agent, writes the candidate.
3. The gate builds it with a fixed recipe and records it twice under fixed stimuli, every effect through a proxy.
4. Six checks run, and lean is one of them (C4b: every function outside the scope).
5. A pass seals a read-only image with a one-use token. A refusal names its location and its witness. A difference inside the scope that is not the wanted outcome goes back to the requester as two renders to pick from.

Picking between two renders is the only human judgment in it. Planned with it: an append-only record per run, predicates per kind of artifact (a key added to one locale exists in its siblings), a preview of what the gate will check on a draft, and an assurance case naming the test behind each guarantee. A release broker and an effect proxy come only if the gate ships as a product.

The DA pages for these: [Run record](/docs/differential-attestation/run-record/), [Predicate registry](/docs/differential-attestation/predicate-registry/), [Preview](/docs/differential-attestation/preview/), [Assurance case](/docs/differential-attestation/assurance-case/).

## The coding agent's loop as a research setting

An agent that writes code needs a judge that is not itself. The planned setting:

- the gate as five tools with fixed input and output schemas: `preview`, `check_unit`, `check_artifact`, `witnesses`, `submit`
- a reference loop with guards: rounds per function, a time budget per request, a named stop
- every claim the agent records about behaviour runs through `check_unit` before it may submit
- refusals as structured records
- a witness library: an input that once revealed a defect is replayed on every later run

The result to publish is a measured difference between the loop with the gate and without it.

Built today: the lint's work list (`--agent`), `check.mjs` per function, and a `WITNESS` that carries the source line on each side with the advised rewrite. See [Editor and agents](/docs/lean/editor-and-agents/#a-work-list-for-a-coding-agent).

## Other languages

The core (the theorem, the checker, the certificate, the conformance suite) is language-agnostic. Each language adds a lint, a translator and an execution harness under `langs/`. TypeScript is first. Python is at its second milestone: the lint names the rewrite, lane B runs in the TypeScript record shape, and five pairs exist. A language merges when it passes the conformance suite:

```bash
python3 -I conformance/run.py
```
