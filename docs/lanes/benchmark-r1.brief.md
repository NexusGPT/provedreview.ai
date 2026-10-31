# Lane brief: benchmark page, rung 1 (LAYOUT), inception round

You design the LAYOUT of one page of a static site, as labelled boxes: zones only, no data, no styling, no colour, no type choices. Three lanes run this brief at once, each on its own axis (named below); you are one of them and never see the others' work. The owner picks one layout; a later rung dresses it.

Owner's words, verbatim (the site): "open-codereview.ai is multiple separate pages, the whole benchmark is like a nice leaderboard on its own session"; "have a CLEAR and NICE quick starr page, have full docs"; "AACR-bench no need to re-run what has been done in Open Code Review, just reuse them"; on the look (30 Oct): "I want something original. WIth a tone of voice closer to open-codereview. No useless prose. No litotes. ANd its own visual identity". The owner's standing rule for lanes: "make sure you are not overfitting (NEVER) your solutions". Never write `2>/dev/null` in a command; use `2>&1`.

Read first, in full: `docs/PRD.md`, `docs/JOURNEYS.md` (J2 and the screen links), `docs/DATA-MAP.md` (leaderboard-row, judge-log), `docs/SUBSCREEN-OBJECTIVES.md` (the benchmark row: the job-shape and the decision), `docs/DESIGN.md` (the lock: dark ground, Inter, JetBrains Mono, Source Serif 4, calm motion). Do not open `index.html`, `styles.css`, or any screenshot: this is the first design of this page and the current home page must not anchor you; the lock file is the only visual input.

The objective (owner-approved): a researcher or an evaluating engineering lead scans and compares every published and measured row on one table, filtered by system and by who measured, then reads one row's measurement conditions; decision: does the claim hold and can I cite this number with its conditions. Primary interactions: sort a column, toggle a filter, expand a row, download the judge logs.

The surface contract:
- Metric semantics: one row = one benchmark entry (a system such as "DA + lean", "Open Code Review", "Claude Code", "Codex", run with one model). Columns: F1, precision, recall (percent, the judge's matching over the 1,505 human notes), average time per PR, average tokens per PR, instances scored, who measured it ("Measured by us" or "Published by Open Code Review"), version, judge model and rounds, source link and read date. F1 is the default sort. Rows measured by us and rows published by Open Code Review were not judged in one run; the "measured by" value and the detail make that visible; the ranking never hides it.
- Identity rules: the system name and the model name are both shown on every row; no vendor logos; medals or rank numbers are a choice you make and name.
- Interaction contract: click a column header to sort; filter chips for system and for measured-by; a row expands in place to its measurement conditions (instances, notes, judge, rounds, version, date, source, the download of the judge logs for our rows); no hover-only information.
- Navigation contract: in from Home (nav "Benchmark", the teaser "every row →"); out to Paper (from the row detail), to the judge-log download, to Home through the nav. The shared nav sits on every page (Benchmark · Quick start · Docs · Paper · GitHub).
- Audience matrix: researchers (want conditions and downloads), engineering leads (want the ranking and the caveat in one glance), both on desktop first.
- Density: comfortable; the whole table visible without a page scroll on a 1440 by 900 desktop for the first ten rows is a goal, not a rule.
- Below the table, the same page carries: the method section (the benchmark, the pipeline, the judge, how our rows were measured, the 12 unscored instances), the escaped-defects block (31 of 43 against 10 of 43), and the downloads.
Real context: the first rows are "DA + lean, 31.61 F1, 184 instances, judge claude-opus-5-5, three rounds" and "Claude-4.6-Opus through Open Code Review v1.3.1, 25.10 F1, 200 PRs, 1,505 notes"; 16 rows in all today (14 published, 2 ours), more to come as Haiku runs land.

Your axis (one per lane; the dispatch names yours):
- Lane A, "scoreboard first": the table is the page; controls in a thin bar; everything else below.
- Lane B, "dossier": a persistent detail pane beside a compact list; the selected row's conditions always visible.
- Lane C, "method first": the measurement conditions and caveat block lead; the table follows as evidence.

Deliver: `docs/design-rounds/benchmark/r1/<lane>/index.html`, one self-contained HTML file (no external requests), showing the layout at the desktop viewport (1440 wide) and, below it, the phone adaptation (390 wide), each as labelled boxes (a box per zone with its name and one line of what it holds; grey outlines only; no data, no colour, no fonts beyond the browser default). Plus `docs/design-rounds/benchmark/r1/<lane>/NOTES.md`: what your layout is WORSE at (one paragraph), the one lock amendment you would ask for with its cost (or "none"), and the data that must exist for it to work. Report after the first alternative is on disk; corrections may be in flight.

Owns: `docs/design-rounds/benchmark/r1/<lane>/` only.
Must not touch: any other file of the repository; no git commit (the lead commits); no server start; no screenshot of the current site.
Writes to: the folder above.
Done when: index.html and NOTES.md exist there, the page opens from a file URL with both viewports visible, and your final reply names the axis, the file path and the WORSE-at paragraph. Your final reply is your report; do not also send it with SendMessage.
