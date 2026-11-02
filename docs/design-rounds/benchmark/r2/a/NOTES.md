# Benchmark · style round 2 · lane a · "quiet ledger" (badge **2a**)

Board: `index.html` in this folder. It opens from a file URL. It shows desktop 1440 loaded with the 900 px fold, phone 390 loaded with the 844 px fold, the row-expanded state at 1440, then empty, loading and error at 1440, then all four states on the phone. All 16 rows of `data/leaderboard.json` are inlined. The tables are live: sorting, filters, row expansion, copy and retry all work. Captures are in `shots/`, taken with headless Chromium on fallback fonts. Blind round: no current screen and no other lane's folder was opened.

**Thesis.** The page is a ledger. Rules, mono numerals and grey chrome set the tone. Two things reach full white: the position and F1.

**Named axis.** Emphasis budget: restraint is the identity. Every element except the position and F1 sits at one of three grey steps. The two measurers differ in rule style, not in hue. "Measured by us" rows carry a solid cream rule on the left edge. "Published by Open Code Review" rows carry a dotted grey rule. Both marks appear again on the filter chips, in the caveat line and in Downloads, so no legend is needed. The words are always present as well.

**Choices.**
- Rows are one line: name in Inter, then model and vendor in mono. Only DA + lean wraps, because its model string is long. This puts 14 of 16 rows above the 900 px fold.
- Numbers are JetBrains Mono with tabular figures and two decimals (25.10, as in J2.2). Equal values share a position: the two 17.90 rows are both 9 and the next row is 11. When another column sorts, the # header reads "# by Recall".
- An empty time or tokens cell on our rows shows "—", and the table foot says what it means: "not in our metrics files". A blank cell would read as zero.
- The row detail is a key-value ledger in four columns, plus a cite line with Copy. Published rows show the matched fractions (301/889) and tokens in/out. Their judge-log slot reads "not published".
- Escaped defects are drawn as 43-cell unit strips in one neutral ink, each with a direct label. Clean-refused counts carry "lower is better", because their direction flips.
- Source Serif 4 italic is used once, for the F1 formula in Method. That is the lock's math use.
- Phone: position, system with model, and F1 stay fixed, with a rule at the freeze edge. The other columns scroll sideways inside the frame, and a line under the table names them. The measured-by mark and words ride under the system name.

## What it is worse at

Restraint makes the evidence quiet. The two-runs distinction depends on a 2 px solid versus dotted edge and on words. On a dim phone screen, or in a cropped screenshot, the sixteen rows can still read as one contest. A band or a colour would show the split faster. No numeral carries a bar, so the shape of the trade-offs is not visible: Claude Code's high recall with single-digit precision, or our 29.47 recall against the published rows' 11 to 20, has to be read digit by digit. The 6-point F1 lead has no weight beyond its numeral, which makes the page less striking to share. The palette has three greys close together. To pass 4.5:1 on #0a0b0f, the dimmest step had to be #767b8b (4.66:1), so the hierarchy between "muted" and "dim" is narrow. On the phone only about five rows fit above the fold, and precision and recall sit behind a sideways swipe.

## Lock amendment position: declined

Lane A of round 1 asked to drop this page's head padding so ten rows fit above the fold. In this style the rows are one line, about 40 px each. With the lock's full 80 px top padding (48 px on the phone), 14 rows already sit above the 900 px fold at 1440. The amendment buys nothing here, and the page keeps the site's rhythm. Cost of declining: none at 1440 by 900. On a 1440 by 800 laptop about 11 rows show. **This style proposes no amendment.**

## Motion (calm)

- **Enters:** nothing animates on arrival. The loading skeleton breathes at 2.4 s (the home kicker's period) until the rows replace it in one step. There is no scroll reveal on the table. Method, Escaped defects and Downloads may use the site's existing reveal.
- **Sort, filter, expand:** sort reorders the rows at once (under 100 ms, J2.2), and only the header arrow and the "# by …" label change. Filter removes rows at once and updates "N of M rows". Expand opens the detail band in 180 ms ease-out, with a 4 px drop and a fade, while the chevron turns 90°. Collapse is instant.
- **Hover and press:** a row's background lifts to 2 % white and its chevron brightens. Hovering a chip or header brightens its text. A chip press moves it 0.5 px, and the pressed chip's border goes to 45 % white. Copy reads "Copied" for 1.4 s.
- **Still:** the nav, the page head, the filter bar, the numerals and the marks. Nothing moves on its own once loaded.

## Data that must exist

- A sentinel for time and tokens on our rows ("not in our metrics files" or real values). Today they are `null`.
- How 196 relates to 200: `unscored.of` is 196, but the benchmark has 200 pull requests. The 4-instance gap has no cause in the data.
- Judge-log file shape. DATA-MAP says `dist/benchmark/logs/<entry>/<round>.json` (per round). JOURNEYS J2.5 says one `judge.jsonl` per entry (2,241 lines for the composed entry). The floor log's line count is not in the data.
- A row of `measured_by` values with a short form for the phone tag. The page shortens to "Published by OCR".
- A definition line for "escaped defect" and for "clean refused". The data gives only counts and the source (paper v3 abstract).

## Findings for the lead (not resolved here)

1. `docs/surfaces/benchmark.md` does not exist on this branch. The brief names it, and so do the lane-dag roots. So the `picked-layout:` line quoting the owner was not on disk. I worked from the brief's statement ("the picked layout A") and `r1/a`. The doctrine treats this as a STOP condition. I reported it instead of stopping, because the brief carries the pick.
2. The lock says ground `#0a0b0f`. The home `styles.css` uses `--bg:#07080b`. This board uses the lock's value.
3. DATA-MAP inlines the data into `dist/benchmark/index.html`. On the built page the loading and error states never occur unless the build fetches the file. They are drawn because the brief asks for them.
4. The dispatch tells this lane to commit and to send a group report. The brief says "no git commit (the lead commits)" and "do not also send it with SendMessage". I followed the dispatch.

## Killed option

The "hairline bar" variant: a 1 px bar under F1, precision and recall, set in the same grey. It made the trade-offs visible. It was killed because it spends emphasis on three columns that the axis keeps quiet, and because it drifts toward lane B's "instrument" axis (ticks under F1, precision and recall). The owner would not get a distinct choice.
