---
title: Predicate registry
order: 3
lede: The registry says which predicates a changed file must meet, keyed by the file's artifact kind. The project layer is read from the parent commit.
sources: da:docs/architecture/predicate-registry.md
---
Plans B2 and B3. The registry says which predicates of the artifact lane a changed file must meet, keyed by the file's artifact kind. It lives in the artifact lane, a repository of its own outside the differential-attestation repository.

- The system layer `artifact-lane/registry/system.json`: 26 entries.
- The project layer `.gate/project.json` of the repository under review, read from the PARENT commit (the base), never from the candidate. `artifact-lane/registry/project.json` is the empty default (`[]`).
- The predicates, one Python function each, in `artifact-lane/predicates.py`.

## The merge rule

The rule is written in `artifact-lane/predicates.py` at the head of its "B2" block and implemented by `merge_registry` and `classify`.

- A project entry with a system entry's pattern replaces that entry's predicate list (and its kind when it gives one).
- A project entry with a new pattern goes before every system entry.
- A path's kind is the first matching entry's kind. Its predicates are the union, in order, of every matching entry's.
- An entry with `mode` matches only a path with that git mode at the head (`120000`, a symbolic link).
- A pattern is a glob on the whole path (`**` crosses folders, `*` and `?` stay in one, `{a,b}` is a choice), or a regular expression after the prefix `re:`.

## What an entry and a row hold

An entry is `{pattern, kind, predicates: [function names], mode?, declared?}`. A predicate name may use dashes. It is read as the function's name with underscores. `declared` fills a predicate's declared table for a repository the module's own tables do not name (`runner_floor`, `sql_view_invariants`).

A result row is `{path, kind, predicate, verdict: PASS | REFUSE | ASK, counterexample?, proof?, reason?}`. `gate.check_artifact` answers `{path, kind, results: [...]}` and keeps every field of every row (`artifactAnswer` in `gate/mcp.mjs`).

```bash
python3 -I artifact-lane/predicates.py --registry ... --repo <repo> --base <ref> --head <ref> --json
```

## The sibling relations (B3)

Three predicates declare that one fact held in two places agrees.

| predicate | relation | registered on kinds |
|---|---|---|
| `locale_siblings` | every key added to one locale exists in every sibling locale | `locale` (two patterns) |
| `config_reader` | a key read by code exists in the configuration the build ships | `configuration`, and also `module-wiring`, `js-source`, `python-source` |
| `declaration_implementation` | a declared signature matches its implementation | `declaration`, and also `js-source`, `python-source` |

The [preview](/docs/differential-attestation/preview/) lists a sibling relation for an entry whose kind is `locale`, `configuration` or `declaration` and which carries one of the three (`isSiblingEntry` in `gate/preview.mjs`), with every path of the draft the entry's pattern matches.

## Who writes it and who reads it

- The artifact lane writes the system layer (commit `9ec5065`).
- The repository's owner writes the project layer, at the parent. A producer cannot switch a predicate off: a candidate that edits `.gate/project.json` changes nothing until that commit is the base.
- `gate.check_artifact` and `gate.submit` run `predicates.py` over the registry (`predicateRows` in `gate/mcp.mjs`). A submit runs it once over the whole change.
- `gate/preview.mjs` reads both layers itself (`registryOf`, `classify`) to list predicates and sibling relations. It runs no predicate.
- `gate/witnesses.mjs` replays an artifact witness through the predicate that refused it.

## Tests

- `artifact-lane/test_registry.py`: for every predicate a fixture pair `artifact-lane/fixtures/<predicate>/` with `parent/` and `candidate/` (and an optional `base/`). The parent must PASS and the candidate must give the verdict `fixture.json` expects. A predicate without a pair fails. Then the merge rules, a design-set kinds snapshot (`artifact-lane/registry/design-set-kinds.json`: 43 repairs, 427 artifacts mapped), and `locale_siblings` on the real commits of nexus-2808, which must refuse.
- `gate/tests/preview.test.mjs` and `gate/tests/contract.test.mjs` cover the registry in the gate.

Run on 2026-10-31 at `9ec5065`, `python3 -I test_registry.py` printed `PASS: 14 predicates, 0 failing []`.

## Worked example: the locale-complete fixture

`artifact-lane/fixtures/locale_complete/fixture.json`: predicate `locale_complete`, source `nexus-2808`, "every key of the source locale exists in every target locale (counted against the parent's own gap)", expect parent PASS, candidate REFUSE.

| file under `web/src/i18n/locales/` | parent | candidate |
|---|---|---|
| `en/default.json` | `tabs.general.title`, `tabs.scope.title` | the same, plus `tabs.assumptions.intro` and `tabs.policies.title` |
| `fr/default.json` | `tabs.general.title`, `tabs.scope.title` | unchanged |
| `de/default.json` | `tabs.general.title`, `tabs.scope.title` | unchanged |

The path `web/src/i18n/locales/en/default.json` matches the system entry `re:(locales?|i18n|translations?|lang|langs|messages)/.*\.json$`: kind `locale`, predicates `locale_complete` and `locale_siblings`. The registry test's line for it, run on 2026-10-31:

```text
ok   locale_complete              parent=PASS (want PASS)  candidate=REFUSE (want REFUSE)  kind=locale
     parent: 1 locale file(s): no key added to the source is missing from a target
     candidate: de/default.json lacks 2 keys this change added to web/src/i18n/locales/en/default.json (e.g. tabs.assumptions.intro); 0 were missing before; ...
```

## Gaps between plan and code

1. **Kind names.** Plan B2 lists a kind `cache-config`. `system.json` has none. `cache_key_inputs` is registered on the `workflow` kind.
2. **The count moved.** Plan B2 assigns "the eleven predicates of Appendix D". The registry holds 14 predicate functions, each with a fixture pair.
3. **OCR's predicate items.** The registry has `runner_floor` on workflows. It has no `pom.xml` kind, no workflow permission predicate, and `package.json` carries `base_preserved` only. The sort that would say which OCR item went where (plan A5's `ocr-rules-sort.md`) does not exist ([OCR advice](/docs/differential-attestation/ocr-advice/)).
4. **Kinds with no predicate.** Eight kinds list no predicate (`container-build`, `ignore-file`, `stylesheet`, `markup`, `media`, `log`, `archive`, `other`). `gate.submit` gives a changed file of such a kind an intake row `skipped:unregistered` and never an ASK. `gate/PRODUCER-PLAN.md` section 1 still says such a path answers ASK "no predicate covers this artifact".
5. **Sibling relations on source kinds.** `config_reader` and `declaration_implementation` run on source kinds too. The preview lists them as sibling relations only on the `configuration` and `declaration` kinds.
6. **Two readers of one rule.** The merge and glob rules are implemented twice, in Python (`predicates.py`) and in JavaScript (`gate/preview.mjs`). Each has its own test. No test compares the two on one input.
7. **Outside this repository.** The registry and its fixtures live in the artifact lane's repository, which the differential-attestation repository neither tracks nor pins. The gate finds it through `AL` or a default absolute path (`gate/mcp.mjs`).

Related: [Run record](/docs/differential-attestation/run-record/), [Producer tools](/docs/differential-attestation/producer-tools/).
