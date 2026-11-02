---
title: FAQ
order: 1
lede: Short answers to what developers and researchers ask first, each linked to the page that holds the detail.
sources: da:README.md, lean:README.md, lean:docs/limits.md, lean:docs/ASSURANCE.md, da:research/open-code-review/d3/RESULT.md, da:benchmark/README.md
---

## Does a model decide a verdict?

No. No model takes part in a verdict, and the author's account of the change is never an input. A model may only word a finding that an instrument already produced. Same change, same verdict, every time. See [Verdicts](/docs/lean/verdicts/).

## What does PASS-bounded cover?

Lane B's bound: a frozen world, generated inputs, click sequences to a stated depth. A `PASS-bounded` says how far it looked and never becomes a proof. See [Verdicts](/docs/lean/verdicts/).

## What happens outside the proof subset?

The lint names the construct and lane A says `ASK`. Lane B still runs both versions, so the answer is a `WITNESS` or a `PASS-bounded`, never silence. Some constructs stay refused by design, for example a prototype write or `eval`. See [Limits and refusals](/docs/lean/limits/).

## Which languages does it read?

TypeScript is the first language, and the core is language-agnostic. Python is the second language: the lint names the rewrite and lane B runs in the TypeScript record shape. DA's gate routes TypeScript and JavaScript comments to lean. See [How it works](/docs/lean/how-it-works/).

## What does lean need installed?

Lane B needs only Node, version 24 or newer. Python 3 and Dafny 4 or newer add the proof lane. Without them lane A reports `ASK`. A container image has both lanes and nothing to install. See [Install](/docs/getting-started/install/).

## Is the sandbox a jail?

No. The sandbox fakes the world, but it is a Node `vm` context, and code that leaves it reaches the worker process. That process denies file writes, child processes, native addons, worker threads and file reads outside the given trees. The network and the environment variables stay open unless `LEAN_NET=deny` closes the network. Containment of hostile code is the gate's. See [Assurance](/docs/lean/assurance/).

## Does lean judge pixels or layout?

No. Pixels, layout and the accessibility tree are DA's screen-analysis row. lean names the state where two renders differ. See [Pixel-diff lane](/docs/differential-attestation/pixel-diff-lane/).

## Is there one accuracy number for the project benchmark?

No. The benchmark reports a vector of counts and denominators over four lanes, plus a proof-soundness eligibility rule that does not compensate. See [The four lanes](/docs/benchmark/project-benchmark/).

## How were the AACR-Bench numbers measured?

The official AACR-Bench pipeline ran unchanged, 3 rounds, with claude-opus-5-5 as judge. The judge is the only model call. Every number is computed by `harness/tables.py` from the pipeline's metrics files and the judge log. The composed entry reached F1 31.61 % against 29.02 % for the OCR floor, mean of 3 rounds, with the caveats listed on the page. See [Run and score](/docs/benchmark/run-and-score/).

## Does DA-Bench use a model to find or write findings?

No. No model sits in any path that finds or writes a finding or a comment. The AACR judge matches comments to human notes only. See [DA-Bench](/docs/benchmark/da-bench/).

## Can I see the held-out benchmark lane?

No. Only the seal is in git. The cases stay with a custodian and only the scorer reads them. See [The four lanes](/docs/benchmark/project-benchmark/).

## Can I check the numbers on the 43 escaped defects?

Not from the repositories. They are private. The numbers and their hashes are published in the paper. One team designed and judged the experiments, and only defects repaired with a note enter the corpus. See [the paper](/paper/).
