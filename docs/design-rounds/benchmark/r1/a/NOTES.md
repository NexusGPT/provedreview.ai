# Benchmark · layout round 1 · lane A · "scoreboard first"

Board: `index.html` in this folder (badge **A**). Blind round: no current screen, stylesheet or screenshot opened.

**Thesis.** The table is the page. One thin control bar sits above it; the method, the escaped-defects block and the downloads sit below it.

**Named axis.** What is dominant: the leaderboard owns the first viewport, header, controls and the first ten rows above the 900 px fold. Everything else is reached by scrolling past the rows.

**Choices this layout makes.**
- Position numbers, no medals. The # header names the active sort ("# by Recall"), so a position is never read as the F1 rank.
- One interleaved ranking across both measurers. The Measured-by column sits right after the system name, and a one-sentence caveat line sits above the controls.
- Rows expand in place, several at once. The detail band carries a cite line with one copy control and the "The paper →" link.
- Phone: the position, system and model, and F1 columns stay fixed. The other columns scroll sideways inside the frame. The Measured-by value also rides as a tag under the system name.

## What it is worse at

The caveat is one sentence and one column, so a lead scanning the ranking can still read sixteen interleaved rows as one contest, even though two separate judge runs produced them. The other two directions put that separation in front of the eye. Comparing the conditions of two rows means two expansions and vertical travel between them, because no pane holds a selected row still. The method sits below every row, so a reader who wants "how was this measured" before trusting a number scrolls past the whole table first. That distance grows with each new run that lands. On the phone, precision, recall, time and tokens hide behind a sideways swipe.

## Lock amendment (one)

The page head of the benchmark page drops the lock's 80 px desktop section padding to about 24 px above and below the title strip and the control bar. This puts the first ten rows above the fold at 1440 by 900. **Cost:** this page's top breaks the uniform section rhythm every other page keeps, and it reads denser than Home and Paper. Below the table, the lock's 80 px padding returns.

## Data that must exist

- Every row: system name, model name, Measured-by value, F1, precision, recall, instances scored, version, judge model, rounds, source URL, read date.
- Time per PR and tokens per PR on every row, or an explicit "not published" sentinel where the source gives none. A blank cell would read as zero.
- Our rows: instances total and the unscored count with causes, notes count, reader model and filter model, run date, judge-log file paths per round.
- Published rows: a flag that their logs are not published, so the detail band says so.
- Page level: the date the published rows were read and the build pin of our rows, for the table foot.
- The escaped-defects counts for both systems and their source.
- A pre-formatted cite string per row, or the fields to build it.

## Links

| Journey step | Control on the board | Position |
|---|---|---|
| J2.1 → J2.2 in | nav "Benchmark"; Home teaser "every row →" | page top, where the table starts |
| J2.2 sort | F1 header, default sort, direction shown | table head, fourth column |
| J2.3 filter | "Measured by" chips, row count, "Reset filters" | control bar above the table |
| J2.4 expand | whole row, chevron at the right edge | each row |
| J2.4 → J2.5 out | "Downloads" box in the row detail; "Download all judge logs" in the control bar; Downloads section | detail band bottom right; bar right end; page bottom |
| J2.5 → J2.6 out | "The paper →" in the row detail; nav "Paper" | detail band bottom right; page top |
| out to Home | wordmark and nav | page top |

## Killed option

A "split table": our rows in one block, Open Code Review's rows in a second block, each ranked alone. It kills the caveat problem but stops being one scoreboard: the reader can no longer sort all rows by one column, which the objective names ("every published and measured row on one table"). It also drifts toward lane C's method-first separation, so it would not give the owner a distinct choice.

## Manifest line

The lane's dispatch owns only `index.html` and `NOTES.md`, so this line lives here for the caller to collate:

```json
{ "id": "a", "rung": "layout", "title": "Scoreboard first", "axis": "dominant zone: the leaderboard owns the first viewport; controls in one thin bar; method, escaped defects and downloads below", "entry": "docs/design-rounds/benchmark/r1/a/index.html", "worse_at": "two-run separation rests on one caveat line and one column; comparing two rows' conditions needs two expansions; method sits below every row; phone hides P, R, time, tokens behind a swipe", "links": ["nav Benchmark / teaser every row -> page top", "F1 header sort", "Measured-by chips in control bar", "row expand (whole row, chevron)", "row detail Downloads -> judge logs", "row detail The paper -> Paper", "wordmark/nav -> Home"] }
```
