# Lane bench-build: result

Branch `lane/bench-build`, from master e6a9af1. The page: `benchmark/index.html`, built from board B "instrument" (docs/design-rounds/benchmark/r2/b/) on layout A, with every row of `data/leaderboard.json`.

## What was built

| file | role |
|---|---|
| `scripts/build-benchmark.mjs` | `node scripts/build-benchmark.mjs` writes `benchmark/index.html` and copies the data to `benchmark/leaderboard.json` (the download). `--check` writes nothing and exits 1 when the committed page is stale. `--data` / `--out` point it at other files. It holds the contract: a row missing a shown field (id, system, model, vendor, measured_by, version, judge, source, read, judge_logs, f1, precision, recall, instances, notes, comments), a duplicate id, a bad read date or a metric outside 0 to 100 fails the build and writes nothing. |
| `scripts/bench/view.js` | The board's view code, one source for both sides: the build runs it in `node:vm` to write the static rows, and inlines the same text for the browser. |
| `scripts/bench/client.js` | Sort, filter, expand and copy in the browser. State lives in the URL (`?system=…&by=…&sort=recall&dir=asc&open=da-lean-opus`), so a researcher can cite a link to an open row (J2.4). |
| `scripts/bench/page.css` | The board's CSS. Its `.d` frame rules are the defaults; its `.p` rules sit under `@media (max-width:760px)`. |
| `scripts/bench/shell.mjs` | Nav and footer. **The swap point**: the site-build lane's shell has not landed on master (`lane/site-build` has no commits past master), so this is the board's own nav, the Home markup. Replace `nav()`, `footer()` and `SHELL_CSS` with the shell's exports; the page uses nothing else from this file. |
| `scripts/benchmark.test.mjs` | `node --test scripts/benchmark.test.mjs`, 13 tests. Tools come from `~/.nexus-tools/node_modules` (the path `scripts/check.mjs` already uses), or from `PW=` / `HV=`. |

The page ships with no JavaScript required: all 16 rows are in the static HTML. JS adds sort, filter, expand and copy. The page is 118.8 KB; the PRD budget is 600 KB. Nothing is fetched: no font, image, stylesheet or script URL.

**The five states.**
- **Loaded:** the default; all 16 rows fit above the 900 px fold at 1440.
- **Row expanded:** click a row or use `?open=<id>`. It shows the readout on the shared scale, version, instances (184 of 196, with the 12 unscored and their cause), notes and comments, judge and rounds, source and read date, time and tokens, judge logs, model and vendor, a cite line with Copy, and "The paper →".
- **Empty:** a filter combination that matches nothing (System: Codex + Measured by us), with "Reset filters".
- **Loading and error:** shown on demand with `?state=loading` and `?state=error`. Because the data is inlined, neither happens on its own, with one exception: if the inlined JSON fails to parse, the error state shows for real. The tests check that case by corrupting the payload in flight.

## Tests (red first)

- 92cad4d committed the tests red: 12 of 12 failed because the builder did not exist.
- Now 13 of 13 pass. The added test covers 1024 and 800 px, after a page overflow I found between 761 and 1329 px; it is fixed.
- A mutation check: changing one precision value in the page turns both the `values` and the `current` tests red.

| test | checks |
|---|---|
| current | `--check`: the committed page equals what the data builds |
| count | 16 `.tr` rows, the ids equal the data's ids, each once |
| values | per row: f1, precision, recall at the source's precision, instances, time, tokens, system, model, vendor, measured_by, version, judge, source, read, notes, comments, rounds, fractions, in/out tokens, the unscored line; the escaped-defect counts |
| contract | data with `pub-02.source` removed: the build exits 1 and writes nothing |
| no external request | the markup has no external src, link, url() or @import; in the browser, every request goes to the local origin |
| HTML validity | html-validate 11.18 `html-validate:standard`, 0 messages |
| links | every href in the markup: anchors resolve to ids; relative paths resolve to a file, or to a listed pending route; no root-absolute links |
| 1440 | loaded; sort by F1, precision and recall (both ways) and by measured-by; filter by system; the URL reflects state; expand and collapse; empty and reset; 16 rows above the fold; no page overflow |
| deep link | `?by=Published…&sort=recall&open=pub-12` opens that row, first |
| loading / error | skeleton shows no digits, controls are inert; the error names the file; Retry reloads to 16 rows; the real error comes from corrupted inline JSON |
| no JS | 16 rows |
| 390 | no page overflow; F1 stays on screen; the filters sheet; the sort select; a tapped row's detail fits inside the screen |
| mid widths | 1024 and 800: the table scrolls in its own box, the page does not |

**Screenshots** (taken by the tests, each read back by me): `docs/shots/bench-build/`
- desktop: `desktop-loaded.png` (full page), `desktop-expanded.png`, `desktop-empty.png`, `desktop-loading.png`, `desktop-error.png`
- phone: `phone-loaded.png` (full page), `phone-filters.png`, `phone-expanded.png`

Reading the shots found two bugs, both fixed and both now guarded by a test. The method cards' `.m` class collided with `.btn.m` and pushed the button labels off-centre. A screenshot taken during the scroll reveal left two sections blank.

## Departures from the board, with reason

- The rows and column headers are real `<button>`s (the board used spans with `role=button`). A closed detail is `inert`, so its links cannot be reached with Tab.
- Headings are h1 → h2 → h3 (the board started at h2), for document order.
- "Download all judge logs ↓" became "Downloads ↓", because no log file is on the site yet.
- The phone "Menu" is a working `<details>` menu (on the board it was a dead button).
- All links are relative (`../paper/`), so the page works under a GitHub Pages project path and at the root.

## For the lead

1. **Judge logs are not on the site.** The DA checkout has them: `research/open-code-review/d3/{composed,floor}/judge.jsonl`, and three `metrics_ocr_*_round_N.json` per entry. Copying them is `scripts/leaderboard.mjs`'s job (DATA-MAP), and it depends on the DA repo going public. Until then, the page says "3 rounds, kept in the DA repository · not copied to this site yet". It links the files on its own once `benchmark/logs/<id>/round-<n>.json` exist, which is the DATA-MAP layout. JOURNEYS J2.5 names one `judge.jsonl` per entry instead; one of the two documents must change (board NOTES flagged this too).
2. **Pending routes.** `../quick-start/`, `../docs/` and `../paper/` are listed in the test's `PENDING` map, with their owning lanes. Remove each entry when its page lands, and the link test then requires the file.
3. **Our two rows' source** is a path in the DA repository, shown as text, not a link. Once the repository is public, a URL in `source` becomes a link automatically.
4. **The DA + lean version** carries no DA commit hash. JOURNEYS Q7 asks for "the DA commit and the lean version"; this is a data gap in `leaderboard.json`.
5. **Commit trailer.** The brief asked for `Co-Authored-By: Claude Fable 5.1`. This lane ran on Claude Opus 5.5, so the commits name the model that wrote them. Amend if you want the brief's line.
6. **The background ground** is the lock's `#0a0b0f`, as on the board. Home's `styles.css` uses `#07080b`.
7. The site-wide `scripts/links.mjs` and `npm test` wiring from the PRD test plan are not in this lane. The link check here covers this page only.
