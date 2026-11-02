# Architecture of the gate, as built on 2026-10-31

Seven pages, one per piece of the plan `research/open-code-review/PLAN-gate-from-ocr.md`. Each page says what the piece is,
what one row or object of it holds, who writes it and who reads it, where its tests are, one worked example from a
committed fixture, and every gap between the plan and the code. Where the plan and the code disagree, the page says what
the code does and names the gap.

| page | plan piece | lives in |
|---|---|---|
| [The gate run record](run-record.md) | B1 | `gate/record.mjs` |
| [The predicate registry](predicate-registry.md) | B2, B3 | `artifact-lane/registry/system.json`, `artifact-lane/predicates.py` |
| [The preview](preview.md) | B4 | `gate/preview.mjs` |
| [The assurance case](assurance-case.md) | B5 | `lean/docs/ASSURANCE.md` |
| [The producer tools](producer-tools.md) | C1 to C6 | `gate/mcp.mjs`, `gate/loop-demo.mjs`, `gate/PRODUCER-PLAN.md`, `gate/witnesses.mjs` |
| [OCR's mechanical rules as advice](ocr-advice.md) | A5 | `lean/langs/ts/lint/advice.mjs` |
| [The benchmark funnel](benchmark-funnel.md) | D | `benchmark/README.md`, `benchmark/score.py` |

## How a cited path reads

Every path in backticks names a file in one of five repositories. The prefix says which, and the commit it was read at.

| prefix | repository | commit read |
|---|---|---|
| none (`benchmark/`, `research/`, `docs/`) | this repository (differential attestation) | the head of the branch this page is on |
| `gate/` | the gate, the `gate` submodule of this repository (NexusGPT/da-gate, pinned at `c2acf33` since DA 0e1eed1; before tonight a nested repository with no remote) | `c2acf33` |
| `lean/` | lean, the gitlink `lean` of this repository | `5f96f554` |
| `artifact-lane/` | the artifact lane (`/Users/assem/nexus/nexus-organisation/work/unreviewable-throughput/legit/round7/artifact-lane`) | `9ec5065` |
| `paper/` | the paper's repository (`/Users/assem/nexus/nexus-organisation/work/unreviewable-throughput/paper`); the paper is `v3/`, and `v3/figs` is a symbolic link to `../v2/figs`, so Figure 1's script is tracked as `paper/v2/figs/fig1c.py` | `2ae48d2` |

`lane/da-architecture-result.md` holds the script that checks every cited path at those commits.

## The pieces in one picture

A producer edits a draft. Before it submits, it reads the preview. It calls lean on one unit, the predicates on one path,
and the witness library on its files, through the tools. It submits. The submit runs the same pieces again in full and
appends every step to the run record. The predicate registry says which predicates a touched file meets. The advice
entries ride on lean's refusals and witnesses. The assurance case says what holds while lean runs the producer's code.
The benchmark measures lean on frozen populations, stage by stage, with its own denominator at each stage.
