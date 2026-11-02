---
title: Editor and agents
order: 7
lede: The lint is the program that admits a function to the proof lane, so the editor and a coding agent see exactly what the proof will refuse, with the rewrite.
sources: lean:docs/editor-and-agents.md, lean:README.md
---

The lint is the same program that admits a function to the proof lane. What the editor underlines is exactly what the proof will refuse: the line, the rule, what to write instead. Each rewrite carries a label:

- `[proved]`: the rewrite is a theorem.
- `[conditional: <precondition>]`: a theorem under a stated precondition.
- `[migration]`: a change of meaning you make on purpose.

Every output below is a real run on the file shown.

```ts
// quote.ts
export type Line = { sku: string; qty: number; price: number };

export function quote(lines: Line[], plan: any): number {
  let total = 0;
  for (const l of lines) total += l.qty * l.price;
  const seats = plan.seats;
  return plan.tier === "pro" ? total - seats : total;
}

export function rate(nights: number): string {
  return nights > 7 ? "weekly" : nights > 1 ? "nightly" : "single";
}
```

```text
$ node langs/ts/lint/lint.mjs quote.ts
quote.ts: inside the subset
```

## Types for every `any`

`--any-type` on the command line, and the `anyType` option of the editor rule, name every `any` at its declaration with the type its uses and its same-file callers need. A declaration can be a parameter, a local, a field, a bound name or a field of an interface. The type is offered as an annotation to accept or not.

A proposed type is a claim about intent, never proved. It is labelled `conditional` on its evidence, `migration` when the evidence conflicts, or `flag-only` when there is none. `any` inside a type (`any[]`, `Record<string, any>`) is not reported yet.

```text
$ node langs/ts/lint/lint.mjs quote.ts --any-type
quote.ts:3:38  any-type  `plan` is any (written); its uses say { seats: number; tier: string }
quote.ts:6:9  any-type  `seats` is any (inferred); its uses say number
2 violation(s)
```

## The rules a reviewer would otherwise type

`--advice` on the command line, `advisory` in the editor rule (on by default there), carries the mechanical rules of code review:

- a nested ternary to nested `if` (`proved`, with the pair that proves it)
- `innerHTML` or `document.write` with a non-literal to a `textContent` write (`migration`)
- `Promise.all` over independent awaits in a loop (`conditional` on the calls commuting in the world)
- `var` to `let` (`conditional` on no use before the declaration)

An advisory finding never refuses a function.

```text
$ node langs/ts/lint/lint.mjs quote.ts --advice
quote.ts:11:10  nested-ternary  a branch contains another conditional expression; nested if statements preserve its evaluation order
1 violation(s)
```

## The editor rule

The ESLint plugin, `langs/ts/eslint`, ships one rule, `lean/provable`, with the same findings. A rewrite that keeps your meaning is offered as a suggestion where one exists (`===` for `==`, `let` for `var`, `Math.floor` around a division). No finding is an autofix.

```js
// eslint.config.mjs
import lean from 'lean/langs/ts/eslint/index.mjs';
import tsparser from '@typescript-eslint/parser';
export default [{ ...lean.configs.recommended, languageOptions: { parser: tsparser } }];
```

To apply the rewrites in bulk, `node langs/ts/convert.mjs <folder>` applies them itself and keeps a file only when `pr.mjs` finds no `WITNESS` on a function it changed.

## A work list for a coding agent

An agent that writes code needs a judge that is not itself. `--agent` prints the findings as a work list an agent acts on item by item, in the order that pays. `--json` carries each finding's `label`, `precondition` and `advice` as fields. A `WITNESS` carries the source line of the first difference with the advised rewrite, so the agent fixes against an input it can replay. Its own account of the change never enters the verdict.

```text
$ node langs/ts/lint/lint.mjs usual/cart.ts --agent
# lean: what keeps usual/cart.ts from being proved

2 finding(s) in 1 place(s). Each item is one construct the proof lane refuses; fix the item, rerun `node langs/ts/lint/lint.mjs usual/cart.ts --agent`, and the function is provable when its list is empty.

## addLine

- [ ] line 6, `alias-mutation`: `t` is another name for a value this function was handed; change it through that name, or copy it first
      code: `t.net`
- [ ] line 7, `alias-mutation`: […]

## Order

1. Mutations first (`param-mutation`, `closure-mutation`, `receiver-mutation`, `property-assign`, `index-assign`): they change the shape of the function.
2. Then equality and arithmetic (`reference-equality`, `division`, `loose-equality`): local rewrites.
3. Then anything the project cannot resolve (`ts-strict`, `unresolved-module`, `global-read`): types the proof needs.
4. Rerun `node langs/ts/check.mjs --parent <old> --candidate <new> --unit <name>` and read the verdict, not the lint, as the result.
```

`[…]` marks text cut from this page. The run prints it in full.

Built today for an agent: the lint's work list, `check.mjs` per function, and a `WITNESS` with the source line on each side. The planned agent setting is on [Around lean](/docs/lean/around-lean/#the-coding-agents-loop-as-a-research-setting).

## Where the subset stops in a repository

`census.mjs` counts, over a whole repository, which code is inside the subset and which gets only lane B with the rule that stopped the proof lane. `--report` writes where the subset stops, grouped by rule and then by directory with one example line each, so an owner sees which habit pays first.

Habits and rewrites in detail: [Writing provable code](/docs/lean/writing-provable-code/).
