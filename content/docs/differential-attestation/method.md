---
title: The method
order: 1
lede: Differential attestation accepts or refuses a change from evidence about two versions, the parent and the candidate. No model takes part in a verdict.
sources: da:README.md, da:docs/architecture/README.md, lean:docs/around-lean.md
---
Differential attestation (DA) accepts or refuses a change to a program from evidence about the two versions: the parent (the version before) and the candidate (the version after). The evidence comes from three instruments: recordings of the running system, proofs over its functions, and relations declared between its other files.

No model takes part in a verdict. The author's account of the change is never an input. A model may only word a finding that an instrument already produced. The same change gets the same verdict, every time.

## Three instruments

Each instrument compares the two versions and refuses on evidence. Each covers a gap of the others.

| instrument | what it does | what it catches | what it certifies only |
|---|---|---|---|
| Recording | Runs the system under a fixed set of stimuli before and after the change: pages, responses, rows, messages, outbound requests. A difference outside the scope the requester selected is refused at its location. | What no text shows: a file left out of the build, a sibling not updated, a page that renders differently. | The stimuli it ran. |
| Proof | For every function the change was not meant to touch, [lean](/docs/lean/how-it-works/) proves the new version equal to the old one for every input, or returns an input on which they differ. | A function whose behaviour changed, with the input that shows it. | Equality inside a stated subset of the language. Outside it, lean still runs both versions and says how far it looked. |
| Relation | For every file that is not a function (build and pipeline configuration, locale files, schemas, documents), a predicate compares the two versions. The predicate is derived from an authoritative file or declared outside the change, so the change cannot switch it off. | A key added to one locale and not to its sibling. | The relations someone derived or declared. |

A difference inside the scope must equal an edit the requester made on a real recording of the old version. When it does not, the requester sees both renders and picks. Picking between two renders is the only human judgment in the planned gate.

## Verdicts

A verdict is `PASS` (only the asked change), `REFUSE` (the location, the input or the artifact, both outcomes, the lines) or `ASK` (what could not be decided, by name).

lean has its own words inside the proof instrument. They are explained on [Verdicts](/docs/lean/verdicts/). The gate's verdict is one of `PASS`, `REFUSE`, `ASK`.

## A real pull request

[immich-app/immich#17879](https://github.com/immich-app/immich/pull/17879) is a public pull request from the AACR-Bench review benchmark. It reworks how album-update notifications are queued. DA ran on it with no model and no human input, from the merge base to the head:

```text
d0014bdf → b7a12558
5 changed function(s): 4 WITNESS · 0 PASS-proved · 1 PASS-bounded · 0 ASK
```

One row is the one a reviewer needs.

| file | function | verdict | note |
|---|---|---|---|
| `server/src/services/notification.service.ts` | `NotificationService.handleAlbumUpdate` | `WITNESS` | input 6: outcome; `notification.service.ts:343` |

The certificate behind that row names the input it drew and the two lines where the versions part:

```text
input   { id: "-1", recipientID: "vdiyf", notify: true, force: true, delay: 1, source: "copy" }
parent  notification.service.ts:324   recipientIds.includes(user.id)
cand.   notification.service.ts:343   return JobStatus.SUCCESS;
```

The parent decides, at line 324, whether the recipient belongs to the album. The candidate reaches `return JobStatus.SUCCESS` for the same job without that decision. The benchmark's verified reviewer note on these lines says the same thing in words:

> The previous logic that verified recipients were actually part of the album has been removed. Consider adding validation to ensure the recipientID belongs to this album before sending notifications.

A human reviewer wrote that note after reading the diff. DA produced the same finding as an input you can replay and two source lines, with no reader at all. You can check it: run the two versions on that input and watch them end differently.

## What DA is not

- **Not a linter.** A linter flags patterns in one version. DA compares two versions and refuses on a difference it can show.
- **Not an opinion.** No verdict comes from a model or a reviewer. A `PASS-bounded` says how far it looked and never becomes a proof.
- **Not a style guide.** Naming, wording and documentation remarks stay with a human or a reader.
- **Not an intent reader.** Only the requester says what was meant to change, by selecting a scope and editing a real recording. A wrong edit releases a wrong outcome.

## How lean fits

lean is one instrument of DA: the proof. It takes two versions of one function and returns a theorem, a decided state space, a bounded run or a separating input, with a certificate anyone can re-run. DA pins it as the `lean` submodule and adds what one function cannot see: recordings, relations, the gate that joins them, and the benchmark.

lean plugs in through its certificate: one JSON per function with the verdict, what backs it, and the seconds each lane took. In the planned gate, six checks run and lean is one of them (C4b: every function outside the scope). More on [Around lean](/docs/lean/around-lean/).

## Architecture map

The gate is built from pieces. Each page below says what the piece is, who writes and reads it, and where the plan and the code disagree.

- [Run record](/docs/differential-attestation/run-record/): the append-only JSON Lines file of every step of a run (B1).
- [Predicate registry](/docs/differential-attestation/predicate-registry/): which predicates a changed file must meet, by artifact kind (B2, B3).
- [Preview](/docs/differential-attestation/preview/): what the gate will check on a draft, before it is submitted (B4).
- [Pixel-diff lane](/docs/differential-attestation/pixel-diff-lane/): two builds of a front end compared on pixels, layout boxes and the accessibility tree.
- [Producer tools](/docs/differential-attestation/producer-tools/): the gate as tools for the coding agent that writes the change (C1 to C6).
- [Sandbox allow-list](/docs/differential-attestation/sandbox-allow-list/): what a build may install, per project.
- [Assurance case](/docs/differential-attestation/assurance-case/): what holds while lean runs the producer's code (B5).
- [OCR advice](/docs/differential-attestation/ocr-advice/): Open Code Review's mechanical rules as labelled advice (A5).
- [Benchmark funnel](/docs/differential-attestation/benchmark-funnel/): the benchmark, stage by stage, with a denominator at each stage (D).

For the numbers behind the method, see [/benchmark/](/benchmark/) and [/paper/](/paper/).
