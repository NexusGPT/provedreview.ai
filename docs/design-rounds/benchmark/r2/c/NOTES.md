# Benchmark · style round 2 · lane C · "editorial" (badge **2c**)

Board: `index.html` in this folder, one self-contained file that opens from a file URL. It has the desktop frame (1440, loaded, the 900 px fold marked), the phone frame (390, loaded), and four smaller frames: row expanded, empty filter result, loading, error. The phone row-expanded state is also included. Every frame is live: the headers sort, the chips filter, and a row click expands. All 16 rows of `data/leaderboard.json` are inlined and rendered. Blind round: no current screen, no other lane's folder opened.

## Axis

The page is set like a printed results table in a paper:
- **Source Serif 4** carries the page head ("Benchmark" at 60 px, cream), the section heads and the method prose.
- **The caveat is a pull line** with a cream left rule beside the title: "Two judge runs, one table. Our 2 rows: 184 instances, our judge. Open Code Review's 14: 200 instances, their judge."
- **The table is ruled like print:** a cream rule under the header, hairlines between rows and a cream rule over the foot note. There are no fills, bars or boxes.
- **Numbers are JetBrains Mono, tabular.** F1 is the largest numeral, and on our rows it is cream.
- **The two measurers read apart by typeface, without a legend:**
  - "*Measured by us*" is serif italic in cream.
  - "PUBLISHED BY OPEN CODE REVIEW" is mono capitals in steel.
  - The words name the source, and the filter chips use the same two treatments, so the bar teaches the table.

## What it is worse at

- **Comparing sizes.** There are no bars or ticks in the table, so judging a gap (DA + lean's 31.61 against 25.10, or Claude Code's 7.23 precision against 28.90 recall) means reading digits. The instrument direction shows that gap without reading.
- **No slack above the fold.** The serif head costs about 230 px. Ten rows fit above the 900 px fold at the lock's 80 px padding with nothing to spare: one more line in the pull line or the scope line pushes row 10 under the fold.
- **The repeated capitals.** Fourteen repeats of "PUBLISHED BY OPEN CODE REVIEW" make a loud, repetitive column. The distinction works because the column is loud.
- **The first phone screen.** The serif title, the pull line and the stacked chips push the table to about 650 px, so a 390 × 844 phone shows the head and only the first one or two rows before scrolling.
- **Thin serif.** Serif italic at 15 px on #0a0b0f renders thin on low-DPI Windows screens.

## Lock amendment

**None. I decline lane A's head-padding amendment because it is not needed here.** The head keeps the lock's 80 px top padding on desktop and 48 px on the phone, and ten rows still sit above the 900 px fold. Two things make that fit:
- the pull line sits beside the title instead of under it;
- rows run at about 50 px, with the model on a second mono line.

The cost of keeping the lock: there is no slack (see above).

## Motion (calm)

- **Enters:** nothing animates on load. The table is present at first paint. The loading state is a hairline skeleton with a slow 1.6 s shimmer.
- **Sort, filter, expand:**
  - Sort and filter re-set the rows at once (no row travel), and the sorted header turns cream with its ▲/▼.
  - Expand opens the detail under its row with a 220 ms fade and a 4 px drop, while the chevron turns 90°. A second click closes it at once.
- **Hover and press:** a row lifts to a 2 % white wash and a chip's border brightens, both in 160 ms. On press, the wash rises to 4 % and the chip moves down 1 px.
- **Stays still:** the nav, the head, the pull line, the rules, the method, the escaped-defects figure and the footer. There is no scroll reveal on this page; it is a reference page.

## Data that must exist

- **`vendor` has two meanings.** For `pub-*` rows it is the model's vendor (Anthropic for Claude-4.6-Opus). For `ocr-floor-opus46` it is the system's vendor (Alibaba, on a claude-opus-4-6 model). For `da-lean-opus` it is "Nexus". The board renders the field as given; the data file must pick one meaning.
- **Our two rows have `avg_time` and `avg_tokens` set to null with no reason.** The board shows "—", and the foot note says "not in the source". A reason field ("not recorded by the run" or "not measured") would let the cell say why.
- **The instance counts don't add up.** `unscored.of` is 196, while the benchmark is 200 pull requests and our rows show 184 instances. The 4 pull requests outside the 196 have no stated cause, so the method text says "12 of 196" without explaining the missing 4.
- **The judge-log files need entries in the data:** name, path, size, line count and rounds for each.
  - J2.5 gives 2,241 lines for the composed log. The floor log has no count.
  - The "all judge logs" zip in the bar is assumed, not sourced.
- **Escaped defects need the definition of "clean refused"** and the paper version and link for the source line. The board labels its two figures "Defects caught, of 43" and "Clean changes refused, of 43".
- **The method's "official pipeline" needs an owner and a link** (whose pipeline, which commit).

## Killed option

Footnote marks: our rows carry a dagger (†) after the system name, and a printed foot note explains it. This is the most "printed" device, but it needs a legend to read, and the brief requires the two measurers to read apart without one. Separately ruled blocks for the two measurers were also rejected: a block per measurer breaks the one-table sort that layout A was picked for.
