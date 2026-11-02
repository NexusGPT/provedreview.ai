---
title: OCR advice
order: 9
lede: Open Code Review's mechanical rules, brought into lean as advice entries. Each carries a label that says what applying the rewrite costs.
sources: da:docs/architecture/ocr-advice.md
---
Plan A5. Open Code Review's TypeScript checklist names rules a machine can check. Plan A5 brings them into lean as advice entries: the rewrite lean suggests to a person or a coding agent, each with a label that says what applying it costs. The labels and their meaning are defined in `lean/langs/ts/design/advice-labels.md`. This page links that list and does not copy it.

## Where they live in lean

- The entries: `lean/langs/ts/lint/advice.mjs`, one object per rule, `{label, precondition?, text}`. lean's commit `fa06d039` (2026-10-27, "Mechanical advice preserves the proof gate") added the OCR entries.
- The rules that fire them: `lean/langs/ts/lint/lint.mjs`. They come in two kinds.
- The fixtures: `lean/langs/ts/tests/fixtures/advice/<rule>_<label>.ts`, first line `// expect: <rule> <label>`.

The two kinds of rule:

- **Refusal rules with advice.** `var`, `loose-equality`, `dynamic-eval` (`eval`, `Function`) and `prototype` (prototype writes) are lint refusals. A refusal carries its entry's advice. `loose-equality` is decided at the site (`eqeqeqSite`): `proved` for operands of one primitive type, else `conditional`.
- **Advisory notes.** `nested-ternary`, `inner-html` (a non-literal into `innerHTML` or `outerHTML`, and `document.write`) and `promise-all-order` (a for-of loop awaiting one call per element) are notes, never refusals. They are emitted only with `--advice` and carry `advisory: true`. The code says so at the branch: "Optional mechanical advice never enters the proof gate. The editor and --advice ask for it."

## What an entry and a finding hold

A finding of `lint.mjs --json` holds `file`, `line`, `col`, `endLine`, `endCol`, `rule`, `msg`, `unit`, `text`, `label`, `labelDecided`, `precondition` when conditional, `advice` (the entry's text after the label in brackets, for example `[proved]` or `[conditional: <precondition>]`), and `advisory: true` for a note.

## Who writes and who reads

lean's lanes write the entries and the rules. The producer reads the advice, and the person who decides a `migration`. The gate surfaces advice in four places.

| gate path | what reaches the producer |
|---|---|
| `gate.preview` `refusals` (`refusalsOf` in `gate/preview.mjs`) | for each lint refusal on a changed unit: `file`, `unit`, `line`, `col`, `rule`, `msg`, and `advice` when present |
| `gate.check_unit` on a WITNESS (`gate/mcp.mjs`) | `advice` from the witness's `where.advice`, beside the source lines |
| `gate.submit` refusals | the same `advice` field on each unit refusal |
| `gate/advisory.mjs` | lean's `pr.mjs` report, byte for byte, in the pull-request comment |

See [Preview](/docs/differential-attestation/preview/) and [Producer tools](/docs/differential-attestation/producer-tools/).

## Tests

`lean/langs/ts/tests/run.mjs`, section "advice labels": for each fixture under `lean/langs/ts/tests/fixtures/advice/`, lint runs with `--json --advice` and must exit 1, find the rule, give every finding of that rule the expected label, start its advice with the bracketed label, and give a precondition when conditional.

## Worked example: two committed fixtures, read on 2026-10-31 at lean `5f96f554`

`lean/langs/ts/tests/fixtures/advice/loose_equality_proved.ts`:

```ts
// expect: loose-equality proved
export function sameKind<T extends number>(a: T, b: T): boolean {
  return a == b;
}
```

`node langs/ts/lint/lint.mjs <that file> --json` gives one finding: rule `loose-equality`, unit `sameKind`, text `a == b`, `label: "proved"`, `labelDecided: true`, advice "[proved] Replace `==` with `===` and `!=` with `!==` when both operands have the same primitive type. ...". It is a refusal, so a gate preview of a draft holding it would show it.

`lean/langs/ts/tests/fixtures/advice/nested_ternary_proved.ts` (`n > 0 ? (second ? 1 : 2) : (n === 0 ? 3 : 4)`): the same command without `--advice` gives `[]`. With `--advice` it gives two `nested-ternary` findings, `advisory: true`, `label: "proved"`, `labelDecided: false`. The gate runs lint without `--advice`, so a producer using the gate never sees these two.

## Gaps between plan and code

1. **No sort document.** Plan A5 records each OCR item with its bin (a lint rule, a predicate, prose) and its reason in `langs/ts/design/ocr-rules-sort.md`. That file exists neither at lean `5f96f554` nor at lean master `9b2c6733`, and no design document of lean at `5f96f554` names OCR. Which OCR items became predicates and which stayed prose is written nowhere.
2. **The gate drops the advisory notes.** `refusalsOf` in `gate/preview.mjs` calls `lint.mjs --changed ... --json` without `--advice`. The three OCR notes (`nested-ternary`, `inner-html`, `promise-all-order`) reach the editor and `--advice` callers only.
3. **The gate drops the label fields.** `refusalsOf` copies `advice` and leaves out `label`, `labelDecided` and `precondition`. The label survives only as the bracket at the start of the advice string.
4. **The label list is behind the entries.** The per-rule table of `lean/langs/ts/design/advice-labels.md` does not list `nested-ternary` (labelled `proved` in `advice.mjs`), `inner-html` or `promise-all-order`, and its section "Why proved is sound" covers three site rules and not `nested-ternary`.
5. **Proof pairs.** Plan A5 asks, for each proved rewrite, a pair whose rewrite is `PASS-proved` and whose wrong rewrite is a `WITNESS`. The fixtures test labels. `advice-labels.md` names one pair (`tests/pairs/operands_coercion`, for `loose-equality`).
