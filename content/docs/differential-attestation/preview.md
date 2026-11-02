---
title: Preview
order: 4
lede: The preview tells a producer what the gate will check on its draft, before it submits. It runs lean's lane B, bounded, and lists the rest.
sources: da:docs/architecture/preview.md
---
Plan B4. `gate/preview.mjs` tells a producer, before it submits, what the gate will check on its draft. It takes a candidate worktree and a base ref and prints one JSON object. The same function answers the tool `gate.preview` (`gate/mcp.mjs`, function `preview`).

```bash
node gate/preview.mjs <candidate-worktree> [--base <ref>] [--out <json>] [--n 30] [--no-lanes] [--no-project]
```

It reads the producer's files and nothing the producer wrote about them. It writes nothing under `gate/runs/`. The only files it creates are lean's base-side sibling of a changed file (`.lean_base_<pid>_<name>`, beside it, while lane B runs) and a temporary folder. Both are removed before it returns. No model is called.

## What the object holds

| field | source | runs a check? |
|---|---|---|
| `identity` | lean's `runIdentity` over the intake's unit rows, head `WORKTREE` | no |
| `intake` | `pr.mjs --preview`: lean's own `selectUnits` rows (`check`, `refused`, `failed`, `skipped`, `removed`) and its change-ledger rows (`artifact`, `unassigned`) | lean's selection only |
| `touched` | `git diff --name-only` against the base, plus untracked files | no |
| `scope` | `S` and the shape of `Σ` from `.gate/reference.json` at the base; else `sigma: null` with a reason | no |
| `refusals` | lean's lint (`lint.mjs --changed <ranges> --json`) on the changed units | yes: the subset rule |
| `predicates` | the registry's kind and predicate names for each touched path | no: listed, not run |
| `siblings` | each sibling relation the draft touches, with every path of the relation | no: listed |
| `witnesses` | the stored witnesses whose files the draft touches | no: listed, not replayed |
| `verdicts` | lean's lane B (`exec/run.mjs`) on each changed unit, bound `n = 30`, seed 1, 180 s per unit, under the containment profile | yes: lane B, bounded |

## How it differs from the verdict

| | preview | `gate.submit` |
|---|---|---|
| lean | lane B only, bounded | `check.mjs`: lane B (`n = 30`) and lane A (Dafny, 30 s) per unit |
| predicates | names | `predicates.py` run; PASS, REFUSE or ASK per row |
| witnesses | the list | C6: the planted check of each relevant witness, then its replay on the candidate |
| intake | lean's rows | lean's rows, plus untracked code files and `skipped:unregistered` rows |
| answer | facts per field, no gate verdict | one of `PASS`, `REFUSE`, `ASK` |
| record | none | appended to `gate/runs/<identity>.jsonl` ([run record](/docs/differential-attestation/run-record/)) |

## Who writes it and who reads it

The gate writes it on request. The producer reads it, through `gate.preview` or the CLI. `gate.submit` calls the same function with `lanes: false` and keeps its rows as the start of the intake.

## Tests

`gate/tests/preview.test.mjs`, six tests: the preview's intake equals the run's (lean's `pr.mjs` with `--unit-budget 0`, so no lane starts, and the same identity); the preview writes nothing under `runs/` and leaves the worktree as it found it; the lane B verdicts of the fixture; no registry; a registry with a project layer; witnesses. Also `gate/tests/contract.test.mjs` and `gate/tests/containment.test.mjs` (the preview's lane-B pass runs under the profile and names the attempt).

## Worked example: the fixture repository

The fixture is `gate/fixtures/repo-source/`, built by `gate/fixtures/build-repo.mjs`, previewed with base `parent`. The assertions of `gate/tests/preview.test.mjs`:

- The intake's unit rows are `balance`, `balance/entries.reduce()#0` (covered by `balance`) and `fee`. The ledger rows are `.github/workflows/ci.yml`, `locales/en.json` and `package.json` twice, each with verdict `ASK`.
- `verdicts` holds two rows, `balance` and `fee`. Lane B runs `balance` once and never its nested callback alone.
- `fee` is `WITNESS` with `witness.args` `[101]`. Its parent side is named `<base sha>:src/ledger.ts` and its candidate side `src/ledger.ts`. `balance` is `PASS-bounded`.
- `refusals` is `[]`, `scope.sigma` is null, and `scope.reason` says there is no `.gate/reference.json`.
- With a registry, `locales/en.json` is kind `locale` with `locale_siblings`, and `siblings` is one relation: `{relation: "locale", pattern: "locales/*.json", predicates: ["locale_siblings"], touched: ["locales/en.json"], paths: ["locales/en.json", "locales/fr.json"]}` (a registry the test writes itself).

## Figure 1's preview arrow

The paper's Figure 1 draws a dashed orange path from the "Intake" box beside the producer to the top of the "Six checks" box, labelled "preview, before the build". It matches the code in two ways: the preview starts from the draft, before any build (the code builds nothing), and it calls the same selection as the run.

It does not match in three. The arrow lands on all six checks and points one way. The code runs two of them in part (the subset rule, and lane B of C4b), names C5b's predicates and C6's witnesses without running them, and never reaches C2, C3 or C4a. Its answer goes back to the producer, and no arrow draws that return.

## Gaps between plan and code

1. **The intakes can differ.** Plan B4 and the paper say what will be checked and what was checked "cannot disagree". The test proves equality with lean's run. `gate.submit` adds rows the preview never shows: an untracked code file (intake decision 2) and a changed file no predicate covers, `skipped:unregistered` (decision 1). The preview names untracked files in `touched.note` only.
2. **Listed, not run.** A producer sees `locale_siblings` named for `locales/en.json`. Its REFUSE arrives only from `gate.check_artifact` or the submit. The same holds for the witnesses.
3. **Lane A absent.** A preview `PASS-bounded` can become `PASS-proved` or an ASK in the submit. The preview cannot say which.
4. **No advice notes.** The lint runs without `--advice`, so OCR's advisory notes never reach the preview, and the refusals keep the `advice` string and drop `label`, `labelDecided` and `precondition` ([OCR advice](/docs/differential-attestation/ocr-advice/)).
5. **Siblings name a different check.** `gate/PRODUCER-PLAN.md` calls `gate.preview` siblings "C1, a sibling: a generated part edited by hand" (a generator relation). The code's siblings are registry entries of kinds `locale`, `configuration` and `declaration`, the relations Figure 1 calls C5 ("one fact in two places agrees").
6. **The improvement measure is not taken.** Plan B4 measures, on the 43 design-set repairs replayed as drafts, how many eventual REFUSE reasons the preview already shows. A search finds only the plan's own line.

Related: [Predicate registry](/docs/differential-attestation/predicate-registry/), [Producer tools](/docs/differential-attestation/producer-tools/).
