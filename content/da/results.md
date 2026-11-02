# lean v3 results on the corpus

Built 2026-10-26 02:26 UTC from results/*.json by harness/results.py.

## Changed units of the defects (parent vs defect commit)

- units with a lane result: 475; with a verdict other than ASK: 31 (6 percent). Line: pass at 60, kill under 30.
- final verdicts: {'WITNESS': 16, 'ASK': 444, 'PASS-bounded': 15}
- lane A: entered the subset 63, translated on both sides 0, PASS-proved 0, ASK:unproved 0, ASK:interface 0
- lane B: WITNESS 16, PASS-bounded 15, ASK 19

| class | units | WITNESS | PASS-proved | PASS-bounded | ASK |
|---|---|---|---|---|---|
| pure | 204 | 11 | 0 | 10 | 183 |
| effect | 139 | 5 | 0 | 1 | 133 |
| nested | 132 | 0 | 0 | 4 | 128 |

- defect-changed units PROVED equal (to inspect by hand; a changed function proved equal is a false PASS unless the change kept behaviour): 0

## Planted changes (soundness)

- planted: 0; lane B witnessed: 0 (0 percent; line: 80); lane A FALSE PASS: 0 (line: 0)

## Clean pairs (untouched functions, expected PASS)

- checked: 88; PASS: 81 (92 percent; line: pass at 95, kill under 80); verdicts {'PASS-bounded': 52, 'PASS-proved': 29, 'ASK': 7}; lane B {'PASS-bounded': 80, 'ASK': 8}; lane A {'ASK': 54, 'PASS-proved': 29, 'ASK:translation-defect': 5}

## Why the ASKs (top reasons, a unit may count twice)

- 198 A: translate: 
- 28 A: unsupported-syntax
- 23 A: async
- 19 A: function-value
- 19 A: ts-strict
- 15 A: optional-chain
- 12 A: param-mutation
- 9 B: file absent on a side
- 8 A: uninitialised
- 6 A: bare-return
- 6 A: division
- 6 A: callback-form
- 6 A: unsupported-call
- 5 A: translate:  callback; the order of its world transitions is n
- 4 A: destructuring
- 3 B: input 0: parent budget: more than 20000 environmen
- 3 A: spread
- 3 A: dynamic-key
- 3 A: index-assign
- 3 A: translate: ber | false | true | string[] | number[] is not tr
- 2 A: translate: ted-call  method .toString() on number is outside 
- 2 A: translate: ervice.ts:195:5  param-mutation  map mutation on a
- 2 A: translate: ue | Record<string, unknown> | unknown[] is not tr
- 2 A: nested-function
- 2 B: parent: load failed: await is only valid in async 
