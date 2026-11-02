# Benchmark · style round 2 · lane B · "instrument"

Board: `index.html` in this folder (badge **b**). It opens from a file URL with no external requests. Each frame is live: sort, filter, expand and copy work in it. Blind round: no current screen, no other lane's folder and no screenshot was opened. The tokens and the nav markup come from `styles.css` and `index.html`, as the brief allows.

**Thesis.** The table reads like a measuring instrument. Rows are dense, and every percentage sits on a graduated track on one shared scale. The run that produced a row is a rail at the row's left edge.

**Named axis.** The numeric treatment and the structural measured-by device.
- F1, precision and recall share one scale, 0 to 40 %. The scale's top is computed from the data: the largest value, rounded up to the next 10. Graduations mark every 10.
- F1 is a filled bar. Precision and recall are needles. The number sits left of its track, decimal-aligned, in JetBrains Mono at the precision its source gives (25.1 stays 25.1, 14.13 stays 14.13).
- Measured by is a 6 px rail: solid cream for "Measured by us", dashed steel for "Published by Open Code Review". Adjacent rows of one run join into one continuous segment, so at rest the two runs read as two blocks. When a sort interleaves them, the rail visibly breaks. The same glyph appears in the measured-by cell (with the full words), on the filter chips, in the head caveat, through an expanded row's detail, and on the phone as a tag under the system name. Shape carries the difference before colour does, and the words carry it before both, so no legend is needed.
- Rows are 38 px on desktop. All 16 rows, the head, the bar and the table head sit above the 900 px fold at 1440 (the dashed line on the board).

## What it is worse at

It is the busiest of the possible readings. Every row carries three tracks of ink, so a reader who wants one number, or a lead glancing for "who is first", must look past graduations, needles and a rail to find it. A quieter treatment gives that number alone. The shared 0 to 40 scale is honest only while all three metrics stay in one range. A future row at 70 % precision would recompute the scale to 0 to 70 and compress every other bar toward the left. The tracks also make small gaps look large: 21.3 and 21.2 read as equal, but 17.9 against 20.4 looks like a step that one judge run may not support. On the phone, only F1 keeps its gauge without a sideways swipe. Rows grow to 56 px for the thumb, so the phone shows about nine rows per screen, not sixteen. The dashed rail is a fine pattern; at small sizes or on low-contrast displays it can read as a dim solid line, and then the measured-by words carry the distinction alone.

## Lock amendment (one): position on lane A's head padding

**Taken, and used.** The page head drops from the lock's 80 px section padding to 24 px above and 20 px below. With 38 px rows, that puts all sixteen rows above the 900 px fold, not only ten. **Cost:** the top of this page breaks the section rhythm every other page keeps and reads denser than Home and Paper. Below the table, the method, escaped-defects and downloads sections return to the lock's 80 px (48 px on the phone). Row density is not a second amendment: the lock defines "comfortable" by section padding, and the table rows are not sections.

## Motion (calm, as the lock asks)

- **What enters:** nothing in the table. The rows, numbers and gauges are present at first paint. No bar grows in and no number counts up, because a value that animates in is a value shown before it is true. The sections below the table reveal on scroll, as on Home (14 px rise, 0.8 s).
- **What transitions:** on sort, rows reorder at once (J2.2, under 100 ms); the arrow moves to the new header, the # column renumbers and its header names the key ("# by recall"); no row flies. On filter, rows leave and return at once; the rail segments rejoin; the count updates. On expand, the detail opens under its row over 180 ms (height and opacity, ease) and the chevron turns 90°. Collapse runs the same way back.
- **What responds:** row hover lifts the row by 3 % white and brightens its needles to full white. Press deepens the row to 6 %. Hovering a chip or a header lightens its text. A pressed chip takes a light border and fill. "Copy" reads "Copied" for 1.4 s.
- **What stays still:** the rail, the scale graduations, the nav, the page head and the table head (sticky under the nav on scroll). Loading: the skeleton pulses once every 2.4 s, the home kicker's rhythm. Under `prefers-reduced-motion`, the expand is instant and nothing pulses.

## States on the board

Loaded (desktop and phone), row expanded (DA + lean: readout on the shared scale with the published fractions where they exist, version, instances with the 12 unscored and their cause, notes and comments, judge and rounds, source and read date, time and tokens with in/out, judge-log files, model and vendor, cite line with Copy, "The paper →"), empty filter result (System: Codex with Measured by: Measured by us, "Reset filters"), loading (tracks drawn, values absent), error (data file failed, Retry, the file named).

## Data that must exist

- Every row as in `data/leaderboard.json` today; the board reads all 16 and hardcodes none.
- `avg_time` / `avg_tokens` are null on our two rows. The board shows "—" with the foot "— no figure in the source". If the DA run did record time or tokens, the build should carry them. If it did not, a reason string per row would replace the bare dash.
- The judge-log file names. `docs/DATA-MAP.md` says `dist/benchmark/logs/<entry>/<round>.json`. `docs/JOURNEYS.md` J2.5 says one `judge.jsonl` per entry (composed and floor, 2,241 lines). The board follows DATA-MAP (three round files per entry). One of the two documents must change.
- `unscored` is page-level, and the board applies it to both "Measured by us" rows (184 of 196). If the two entries differ in unscored instances, the field must move into each row.
- Precision and recall fractions exist only for the published rows. Our rows would gain the same readout line from the metrics files (matched comments / comments, matched notes / notes).
- Error state: the DATA-MAP inlines the data into the built page, and J2.2 fails the build on an invalid file. So the error frame only appears if the page ever fetches the file instead. It is drawn because the brief asks for it.

## Findings for the lead

- `docs/surfaces/benchmark.md` is named by the brief and by the `docs/lane-dag.json` roots, but it does not exist on this branch or any other. So the `picked-layout:` line quoting the owner, and lane A's amendment as recorded there, could not be read. This lane took "layout A is picked" from the brief, and the amendment from `r1/a/NOTES.md`.
- The lock in `docs/DESIGN.md` names the ground as `#0a0b0f`; `styles.css` uses `#07080b`. The board uses the lock's value.
- The dispatch says to commit on the lane branch and send a report to the group, while the brief says "no git commit (the lead commits)" and "do not also send it". The dispatch, being the later and more specific instruction, was followed.

## Killed option

Ranking the two runs on two separate scales: our rows judged against each other on one track, the published rows on another, with a split rail. It makes the "not judged together" caveat physical. But it stops being one scoreboard sortable by one column, which the objective and the picked layout require. It also duplicates the killed "split table" of layout round 1. A second kill: sparkline-style per-round dots for our rows (three rounds). Only two rows have rounds, so the device would be decoration on 14 of 16 rows.
