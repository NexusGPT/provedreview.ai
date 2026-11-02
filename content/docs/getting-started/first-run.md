---
title: First run
order: 2
lede: Three real runs from the README, then one pull request. Each command and its output is copied from the source.
sources: lean:README.md, lean:docs/pull-requests.md
---
## A slip the tests missed

A ledger function whose candidate rejects an event that lands exactly on the floor (`<=` where the parent had `<`). From the root of the clone ([Install](/docs/getting-started/install/)):

```bash
node langs/ts/check.mjs --parent langs/ts/tests/pairs/readme_ledger/parent.ts --candidate langs/ts/tests/pairs/readme_ledger/candidate.ts --unit applyAll --no-project --n 60 --seed 3 --out ledger.json
jq -c '.witness | {input, floor: .args[3], parent: .parent.outcome.returned.posted, candidate: .candidate.outcome.returned.posted}' ledger.json
```

```text
{"input":17,"floor":-1,"parent":1,"candidate":0}
```

The verdict is `WITNESS`. lean drew the input itself: a floor of -1 and a debit of 1 from a new account, which lands exactly on it. The parent posts it and notifies the port once. The candidate posts nothing. The jq line reads the witness out of `ledger.json`; [Read the certificate](/docs/getting-started/certificate/) explains the fields.

## A refactor proved for every input

In the same file, `statement` turned a loop with `continue` into a `filter` and a `map`. Lane A proves the two equal for every input and every world: `Equal_statement: true`, `5 verified, 0 errors`. The verdict is `PASS-proved`.

The other functions of that file give the other verdicts a real commit mixes:

| function | verdict | what the certificate says |
|---|---|---|
| `applyAll` | **WITNESS** | input 12: `posted: 2` against `posted: 0`; the parent calls `notify` twice, the candidate never |
| `statement` | **PASS-proved** | the loop with `continue` became a `filter` and a `map`: `Equal_statement: true`, `5 verified, 0 errors` |
| `rollback` | **WITNESS** | input 0: the parent `threw: Error "unknown account "`, the candidate `returned: 994` |
| `Ledger.reset` | **PASS-proved** | the old count read through a local: `Equal_ledger_reset: true`, `1 verified, 0 errors` |

Each function ran with `--no-project --n 60 --seed 3 --dafny-seconds 30`. The full table has six rows and is in the [README](https://github.com/NexusGPT/lean/blob/v0.1.3/README.md#1-one-function-in-a-service-the-back-end).

## A component decided to the end of its state space

A toggle with a boolean prop. Lane A cannot read a handler with a branch inside, so lane B explores every click order from every prop assignment, to the end, and decides.

```text
$ node langs/ts/check.mjs --parent langs/ts/tests/pairs/finite_components/parent.tsx --candidate langs/ts/tests/pairs/finite_components/candidate.tsx --unit Toggle --no-project --n 60 --out toggle.json
PASS-decided -> toggle.json   # every click order from every prop assignment, decided: 8 state pairs over 2 assignment(s)
```

A `PASS-decided` is as final as a proof for that component. A sibling `Mutant` that pins the state to `true` instead of toggling it is a `WITNESS` after two clicks.

## What each verdict means

| verdict | meaning |
|---|---|
| `WITNESS` | the two versions behave differently, and the certificate holds the input or the click sequence |
| `PASS-proved` | equal on every input, every world and every fuel, outside the declared scope |
| `PASS-decided` | a component finite by its types: equal on every click order, explored to the end |
| `PASS-bounded` | no difference found on *n* generated inputs and click sequences under a frozen world |
| `ASK` | undecided, and the certificate says why |

`check.mjs` reports the strongest verdict the evidence supports. A bounded pass never becomes a proof. `REFUSE` and `NEW` sit outside that order.

## Next: one pull request

`pr.mjs` checks every changed function of a pull request and the unchanged callers of the changed ones, and prints one table. [`examples/booking/`](https://github.com/NexusGPT/lean/blob/v0.1.3/examples/booking/) is a pricing core and a quote service. Commit `85136f1` changed it the way a real pull request does: one asked rule (percent promotions capped at half the unit price), one slip while there (`>=` became `>` in the free-delivery test), two refactors.

```bash
node langs/ts/pr.mjs --repo . --base 85136f1~1 --head 85136f1 --scope unitDiscount     # from the repository root
```

The summary line:

> 4 changed function(s); 5 unchanged caller(s) checked through lane B, 2 with a WITNESS through a changed callee: **1 in scope · 3 WITNESS · 1 PASS-proved · 0 PASS-decided · 1 PASS-bounded · 0 ASK · 0 REFUSE · 0 NEW**

The asked rule is reported `IN-SCOPE`. The slip nobody asked for is a `WITNESS` at `pricing.ts:59`, and so are the two callers whose text never changed. A test suite passes this pull request unless a test sits exactly on the threshold. Intake, budgets and reuse: [Pull requests and CI](/docs/lean/pull-requests/).
