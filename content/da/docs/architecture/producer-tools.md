# The producer tools (plans C1 to C6)

The producer is the coding agent that writes the change. It stays outside the gate: nothing it says enters a verdict.
This page covers the six pieces it works with.

## C1. The gate as tools with a fixed contract

`gate/mcp.mjs` serves the tools over the Model Context Protocol on stdio (`node gate/mcp.mjs serve`) and runs each one as a
CLI subcommand (`node gate/mcp.mjs <tool> --json '<input>'`). `node gate/mcp.mjs list` prints, at `c2acf33`:

| tool | schema | answer |
|---|---|---|
| `gate.preview` | `gate/schemas/preview.v1.json` | the [preview](preview.md) object |
| `gate.check_unit` | `gate/schemas/check_unit.v1.json` | `{file, unit, verdict, reason, input?, lines?, advice?, certificate}` from lean's `check.mjs`, parent = the file at the base, candidate = the worktree file |
| `gate.check_artifact` | `gate/schemas/check_artifact.v2.json` | `{path, kind, results}`, every row `predicates.py` prints ([registry](predicate-registry.md)) |
| `gate.witnesses` | `gate/schemas/witnesses.v1.json` | the stored witnesses touching the files, without their file texts |
| `gate.submit` | `gate/schemas/submit.v3.json` | `{record, identity, verdict: PASS or REFUSE or ASK, refusals, asks, new, removed?, witnesses}` |
| `gate.check_render` | `gate/schemas/check_render.v1.json` | the rendering check's verdict (plan B6) |

Each schema has `$defs/input` and `$defs/output`. `gate/schemas/VERSIONS.json` lists `{tool, version, file, sha256}`;
the newest version per tool is served. An input outside its schema is refused before any tool runs. The gate's verdict
enum is `PASS | REFUSE | ASK`; lean's words (`WITNESS`, `PASS-proved`, `PASS-decided`, `PASS-bounded`, `ASK`, `REFUSE`,
`NEW`) stay inside `check_unit.verdict`. Every tool reads the containment profile first.

## C2. The reference loop

`gate/loop-demo.mjs run` is a scripted producer with no model. For each planted mutation of the soundness battery the
mutant is the draft; it calls `gate.check_unit`, and on a WITNESS restores the parent's text at the witness lines (the
battery's repair) and checks again. Its stops, each named in the row: `PASS`, `StopNoWitness`, `StopNoSite`, `StopNoFix`,
`StopMaxRounds` (default 5 rounds), `StopBudget` (default 900 s), `StopToolError`. `--unguarded` removes every stop but
PASS (the red run). It writes `gate/loop/<name>.json` and one change-round series per attempt in the
[run record](run-record.md).

The latest run, `gate/loop/v7-143-5f96f554.json` on lean `5f96f554`, as `gate/lane/gate-drift-result.md` reports it:
99 of 143 PASS within 5 rounds, 38 `StopNoWitness`, 4 `StopNoFix`, 2 `StopNoSite`.

## C3. The plan in the gate's words

`gate/PRODUCER-PLAN.md` is for the producer only; the gate never reads it. Before the first edit, one row per risk point:
location, nature, impact, the check that sees it, the relation that check relies on, and what to do when no check sees
it. The four checks a producer can name are C4b (`gate.check_unit`), C5b (`gate.check_artifact`), C1 (`gate.preview`
siblings) and C6 (`gate.witnesses`). A risk no check sees is a relation to declare in `.gate/project.json` (read from
the parent) or a stimulus to ask the requester for. Section 6 is a prompt fragment under 1,500 characters.

## C4. The one-sided self-check of behavioural claims

`node gate/loop-demo.mjs claims --worktree <dir> --claims <claims.json>` runs every behavioural claim through
`gate.check_unit` on its unit. WITNESS refutes the claim with its input, PASS-proved confirms it, PASS-bounded keeps it with
its bound, ASK keeps it open. A behavioural claim that names no unit cannot be checked, and the loop refuses to submit while
one remains. The loop refuses, not the gate. A readability claim is never checked and never blocks.

## C5. Refusals as structured data, and the posting rules

- `gate.submit` returns each refusal as a record `{tool, file, unit, verdict, input?, inputIndex?, lines?, advice?,
  reason}` for a unit, or the predicate row with its `path` for an artifact, and appends them in the `verdict` record.
- Lean's `pr.mjs` writes `<runs-dir>/<identity>.refusals.json`, whole or not at all. Lean's `lean/langs/ts/ci/comment.mjs
  --inline` posts one review comment per record, skips a record whose line range meets an existing comment on the same
  file at intersection over union 0.6 or more (`--iou`), and sends at most 50 requests per batch (`--batch`).
- The gate's own comment, `gate/advisory.mjs`, assembles one Markdown comment and posts it only on NexusGPT/lean and
  NexusGPT/differential-attestation pull requests; every other URL exits 2 before `gh` runs (`gate/docs/advisory.md`).

## C6. The witness library

`gate/witnesses.mjs`. A refusal is kept as a pending refusal keyed by its lineage (worktree, base, file, unit or
predicate). When a later submit of the same lineage passes that check, or the file is back at its base text, the refusal
becomes `gate/witnesses/<id>.json` `{id, files, unit?, check, stimulus, effect, commits: {refused, fixed}, created}`.
Before judging, a submit runs each relevant witness's planted test (the stored refused candidate against its stored
parent must still refuse, else the run aborts with `C6: planted witness <id> no longer refuses`), then replays its
stimulus on the candidate: a candidate whose observation equals the refused one's and differs from the parent's is
refused naming the witness. A replay that cannot run is `inconclusive`, never a refusal.

## Who writes and who reads

The producer calls the tools and writes `claims.json` and its plan. The gate writes the answers, the run record and the
witness files. The requester reads ASKs. `gate.submit` is the only judge.

## Tests

`gate/tests/contract.test.mjs` (schemas against `VERSIONS.json`, the MCP `tools/list`, each tool on the fixture, the
submit record, four intake decisions, R9), `gate/tests/loop.test.mjs`, `gate/tests/loop-indices.test.mjs`,
`gate/tests/claims.test.mjs`, `gate/tests/witnesses.test.mjs` (nine tests), `gate/tests/advisory.test.mjs`,
`gate/tests/first-pass-record.test.mjs`; lean's `lean/langs/ts/tests/run.mjs` for `pr.mjs` and `ci/comment.mjs`.

## Worked example: the claims fixture

`gate/fixtures/claims/` holds `parent/` and `candidate/` of one TypeScript project (`src/pricing.ts`), `claims.json`
and `expected.json`. `gate/fixtures/claims/README.md` records the verdicts with lean at `b1ea2ca` (n 30, Dafny 30 s):

| claim (unit) | what changed | `gate.check_unit` | claim state |
|---|---|---|---|
| `fee` | rate 0.01 became 0.02 above 100 | WITNESS | refuted, with the input |
| `double` | `x * 2` became `x + x` | PASS-proved | confirmed |
| `initials` | map and join became a for-of loop | PASS-bounded (lane A: ASK:unproved) | bounded |
| `greet` | a defaulted second parameter | ASK (parameter count 1 became 2) | open |
| no unit | "the change does not alter the checkout total" | none can run | unchecked |
| `initials`, readability | | not checked | does not block |

`expected.json`: `submit: "refused"` with the claims as written, `submitAfterRelabel: "allowed"` once the claim with no
unit is relabelled.

## Gaps between plan and code

1. **Six tools, not five.** Plan C1 and `gate/CONTRACT.md` name five tools. The code serves six (`gate.check_render`
   joined with plan B6). The contract test's title still says "the five tools" and asserts the six of `TOOLS`.
   `paper/v3/tables/register.tex` line 84 says "tools: 5" and "contract test 10 of 10 pass".
2. **The loop is below its floor.** Plan C2's test asks PASS within 5 rounds on 120 of the 143. The latest run reaches 99
   of 143, and `gate/tests/loop.test.mjs`'s run-file test is red. `gate/lane/gate-drift-result.md` traces 17 of the 19
   rows lost against the earlier run to lean's lane B CPU-time bound.
3. **No agent run.** Plan C2's second half (a coding agent with and without the tools on 10 corpus defects) and C3's
   measure (plan on, plan off) are written in `gate/PRODUCER-PLAN.md` section 5 and marked "NOT RUN".
4. **The refusals file.** Plan C5 puts it at `runs/<identity>.refusals.json` under the gate. Lean writes it into the runs
   folder it is given; the gate gives lean a temporary runs folder and removes it after each call, and the submit runs
   `pr.mjs` only as `--preview`. No refusals file outlives a gate call. The gate's refusals live in the `verdict` record.
5. **The posting rules sit in lean.** The intersection-over-union rule and the batches are in lean's `ci/comment.mjs`.
   The gate's `advisory.mjs` posts one comment with no overlap rule.
6. **No witness is committed.** `gate/witnesses/` holds `replay.mjs` only; `witnesses/pending/` is ignored by
   `gate/.gitignore`. The register lists the witness library as "in progress".
7. **The producer plan's tool list.** `gate/PRODUCER-PLAN.md` names five tools, and its C5b row says a kind with no
   predicate answers ASK; the submit answers `skipped:unregistered` ([registry](predicate-registry.md), gap 4).
