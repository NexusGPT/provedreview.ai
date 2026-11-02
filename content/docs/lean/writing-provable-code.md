---
title: Writing provable code
order: 3
lede: A function owns what it creates, and everything else flows through its arguments, its result and the world. Code written that way gets a theorem on its next change.
sources: lean:docs/writing-provable-code.md, lean:README.md
---

The rule in one line: **a function owns what it creates, and everything else flows through its arguments, its result, and the world.** Code written that way gets more than a test. The next change to it is a theorem.

The proof lane reads a function as mathematics. Every value is a mathematical value. The function is a map from its arguments and the state of the world to a result and the next state of the world. Two versions are equal when that map is the same for every argument and every world. Dafny over Z3 decides that statement.

So the habits below are not taste. Each one removes a thing that has no place in that reading. lean names the habit it needs (`ASK: <rule>`) instead of guessing. Everything else is translated as it is.

## The habits at a glance

| you write | lean says | write instead | what it buys |
|---|---|---|---|
| `const t = user.tags; t.push(x)` | `alias-mutation` | `user.tags.push(x)`: change it through the parameter, which becomes an output | a candidate that appends twice or to the wrong record returns a different `user'`, for every input |
| `a === b` on two objects | `reference-equality` | compare the fields you mean | a value equality the verifier decides |
| `while (i > 0) { … }` with no measure | opaque block | `// @decreases i` above the loop | a change inside the loop is proved or refuted, never silently equal |
| `this.client.state.n += 1` through a class instance | `receiver-mutation` | keep receiver paths as data records: `this.stats = { ...stats, n: stats.n + 1 }` | each read and write is a transition the proof sees |
| `Object.assign(user, patch)` | `assign-target` | `{ ...user, ...patch }` | the target's new value is in the model |
| `on && change(xs)` | `conditional-effect` | `if (on) change(xs)` | a branch returns its world and value only when selected |
| `d[k] = v` on a dictionary, a run-time key, an object value | `prototype` | `d = { ...d, [k]: v }`, or a `Map` | a key named `__proto__` cannot replace the object's prototype behind the proof's back |

## 1. Change what you were handed through its own name

An argument is a value. A function that assigns a field, a slot or the contents of a parameter is read as a function that also returns the parameter's new value. `addTag(user, t)` becomes `(result, user')`, and a caller that passed a name takes the new value back into that name.

Two parameters are two objects. A local that is another name for a parameter's object (`const u = user`, `const t = user.tags`) may not be changed. The model has one value per name, so a change through the alias would not reach the parameter. The lint says `alias-mutation` with the line. Change the parameter itself, or copy first.

```ts
user.tags.push(t);
```

`user.tags.push(t)` and `user.tags = [...user.tags, t]` are proved equal: the same new value.

## 2. Let state come out of loops, not out of callbacks

A loop body becomes a recursive helper over the variables it changes. A callback becomes a lambda: a value with no access to the variables around it. `prices.forEach(p => { total += p })` asks the lambda to change `total`. The lambda cannot do that in the model. Write the loop, or fold with `reduce`.

```ts
for (const p of prices) total += p;
// or: const total = prices.reduce((a, p) => a + p, 0);
```

The two are proved equal to each other. A candidate that starts the sum at the first price instead of zero, or skips the last element (`i < n - 1`), is caught for every list.

## 3. Say what you compare

`a === b` on two objects compares addresses. A value model has no addresses, and an invented one would prove the wrong thing. Compare the fields you mean.

```ts
if (a.id === b.id) ...
```

Equality of two strings, two numbers, two literals, or a value and `null` is a value comparison already.

## 4. Say what kind of number you mean

JavaScript has one number type and `/` is real division: `7 / 2` is `3.5`. The translator renders numbers as integers (or as reals with `--real`). `Math.floor(n / 2)` and `Math.trunc(n / 2)` are integer division in both readings. `n * 0.5` says a real is meant. `%`, `+`, `-`, `*`, comparisons, `Math.min`, `Math.max` and `Math.abs` are exact. Any other `Math` call is an uninterpreted function of its arguments, the same on both sides.

```ts
const half = Math.floor(n / 2);
```

## 5. Keep receiver paths as data records

A field any method changes lives in the world. Each read and write is a transition. `this.stats.n += 1` reads `stats`, rebuilds its record with the new `n`, and writes it back. A class instance, optional path or opaque handle still gets `receiver-mutation`.

```ts
bump() { this.stats.n += 1; }
bump() { const stats = this.stats; this.stats = { ...stats, n: stats.n + 1 }; }
```

Those two lines are the same field read and write, the second made explicit. A class getter is a unit such as `Counter.get_total`. A setter is `Counter.set_total`.

## 6. Give a `while` loop its bound

A `for` loop over a range or a list carries its own termination. A `while` loop runs until a condition fails, and the verifier needs to know what shrinks on each pass. `// @decreases i` is that one fact.

```ts
// @decreases i
while (i > 0) { i -= 1; }
```

Without it the loop becomes an opaque block: one uninterpreted transition named by the loop's text. The same text on both sides is the same block, so the function around it can still be proved. A change inside the loop is never proved equal and never proved different. It is left to lane B. A loop that keeps something true across passes can state it with `// @invariant`.

## 7. Reach the world through calls

An imported function, a method of an injected service, a clock, `Math.random`, `fetch`: each is a transition of the world, named by what was called and with what. The same call in the same world answers the same. Two calls are two transitions. A candidate that makes a call the parent did not make, or makes it with another argument or in another order, is not equal.

Outside the subset is code that changes the world without a call: writing to a module-level variable, `process.env` assignment, `eval`, the prototype chain, `super`.

## 8. A component returns a tree

JSX is read as a value. A handler attribute is an opaque function value keyed by its text, so a rewired handler is a different value. Hooks are calls into the world at the top of the render. A component is a function from props and world to a tree. Two versions are equal when the trees are equal for every props value and every world.

A refactor from `cond ? <A/> : null` to `cond && <A/>` is proved equal. A candidate that drops the empty-state paragraph, renders the wrong field, moves a button or wires another handler produces a different tree, and lane B shows the props on which the trees differ. Pixels, CSS and layout are not judged. See [Front end](/docs/lean/front-end/).

## Two habits, run

The lint still asks for two habits that README shows with runs. First, write an effect under a condition as a branch, not an expression:

```ts
if (late) b.notes.push("late arrival");
```

```text
$ node langs/ts/lint/lint.mjs usual/booking.ts --advice
usual/booking.ts:4:3  unsupported-syntax  only assignments, ++/--, calls, and await may stand as statements
$ node langs/ts/check.mjs --parent usual/booking.ts --candidate usual/booking.next.ts --unit confirm
PASS-bounded -> usual-booking.json   # lanes.A: ASK, translate: outside the subset (unsupported-syntax)
$ node langs/ts/lint/lint.mjs lean/booking.ts --advice
lean/booking.ts: inside the subset
$ node langs/ts/check.mjs --parent lean/booking.ts --candidate lean/booking.next.ts --unit confirm
PASS-proved -> lean-booking.json     # lanes.A: Equal_confirm: true; Dafny: 1 verified, 0 errors
```

The branch returns its world only when taken, so moving a line above the note is a theorem and nobody re-reads it.

Second, build a dictionary as a value, not by writing keys into it:

```ts
let byId: Record<string, Account> = {};
for (const a of accounts) byId = { ...byId, [a.id]: a };
```

```text
$ node langs/ts/check.mjs --parent lean/ledger.ts --candidate lean/ledger.next.ts --unit index
PASS-proved -> lean-ledger.json      # lanes.A: Equal_index: true; Dafny: 13 verified, 0 errors
```

An account whose id is `__proto__` can no longer replace the dictionary's prototype, and the loop rewritten as `forEach` is proved equal.

## In the editor

lean ships an ESLint plugin, `langs/ts/eslint`, with one rule, `lean/provable`. It runs lean's own lint on the file inside its project. What the editor underlines is exactly what the proof lane will refuse: the line, the rule and what to write instead.

```js
import lean from 'lean/langs/ts/eslint/index.mjs';
import tsparser from '@typescript-eslint/parser';
export default [{ ...lean.configs.recommended, languageOptions: { parser: tsparser } }];
```

```text
  31:10  warning  lean cannot prove this (division): `/` on numbers is real division; write Math.floor(a / b) for integer division
```

More on the lint: [Editor and agents](/docs/lean/editor-and-agents/).

## What you can still do

Write TypeScript the way your team writes it. A function outside the subset is not blocked. It gets lane B, a bounded verdict, and the exact reason the proof lane stopped. You decide what to tighten. Code written with the lint on is inside the subset from the first line.

Everything else is yours: `async`/`await`, `try`/`catch`, `switch`, destructuring with defaults, optional chaining, template strings, `Set`, `Map`, generics, recursion, early returns, callbacks to array methods, local lambdas, JSX. When a rule fires on your code, [Limits and refusals](/docs/lean/limits/) says whether it is by design, on the backlog or a matter of environment.
