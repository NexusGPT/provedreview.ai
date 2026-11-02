---
title: Exit codes
order: 4
lede: Every exit code the sources state, by command.
sources: lean:README.md, lean:langs/ts/README.md, lean:docs/ASSURANCE.md, lean:docs/pull-requests.md, lean:CHANGELOG.md, da:docs/architecture/producer-tools.md
---
| command | code | meaning |
|---|---|---|
| `check.mjs` | 0 | any verdict |
| `check.mjs` | 2 | the run ends with no verdict |
| `lint.mjs` | 0 | every checked function is inside the subset |
| `lint.mjs` | 1 | findings |
| `census.mjs` | non-zero | the walk is incomplete |
| `bin/lean` | the script's | every argument is passed through |
| `ci/comment.mjs --block` | fails the check | see below |
| `tests/run.mjs` | 0 | every row passes |
| `scripts/assurance-check.mjs` | 1 | a named check is missing or red |
| the gate's comment (`gate/advisory.mjs`) | 2 | a URL outside NexusGPT/lean and NexusGPT/differential-attestation, before `gh` runs |

## check.mjs

`check.mjs` exits 0 on every verdict: `WITNESS`, `PASS-proved`, `PASS-decided`, `PASS-bounded`, `ASK`, `REFUSE` and `NEW` alike. It exits 2 when a run ends with no verdict. A run never ends without a verdict: a drained event loop or a budget stop is `ASK` with exit 2.

## lint.mjs

Exit 0 when every checked function is inside the subset. Otherwise it prints one line per violation (`file:line:col  rule  message`) and exits 1. The escapes under `fixtures/escapes/ts` exit 1 with the rule named on the first line.

```text
usual/booking.ts:4:3  unsupported-syntax  only assignments, ++/--, calls, and await may stand as statements
```

## census.mjs

The census exits non-zero when its walk is incomplete. Since v0.1.3 it also counts unresolved-type stops as environment.

## bin/lean

`bin/lean` passes every argument through, and the exit code is the script's.

## ci/comment.mjs

The block flag decides whether the check fails:

| flag | fails the check on |
|---|---|
| `--block none` | nothing; it only comments |
| `--block witness` | any `WITNESS` row |
| `--block ask` | `WITNESS` or `ASK` |

A row declared `IN-SCOPE` never blocks. The block rule treats a run stopped by a budget as not green. The sources state no numeric code for a failed check.

## Suites

`node langs/ts/tests/run.mjs` prints one table and exits 0 only when every row passes. `node scripts/assurance-check.mjs` finds every named check, runs it and exits 1 when one is missing or red.
