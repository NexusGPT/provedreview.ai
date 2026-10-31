# Benchmark, layout rung, lane C (id 1c): method first

Mode: blind. I did not open index.html, styles.css, any screenshot of the site, or the other lanes' folders. My inputs were the brief, PRD, JOURNEYS, DATA-MAP, SUBSCREEN-OBJECTIVES and DESIGN.

## Thesis

The page states how the numbers were made before it shows them. The two measurement regimes ("Measured by us", "Published by Open Code Review") are cards at the top. The caveat is one statement under them. The table follows as the evidence. A regime card's "show these rows" control sets the table's "Measured by" chip, so the conditions and the filter are one control family.

## Named axis

What leads the page: the conditions and the caveat, not the ranking.

## Zones, top to bottom (desktop)

1. Shared nav (home lane).
2. Page head: title, scope line, jump links ("the table ↓", "full method ↓", "downloads ↓").
3. Conditions band. Three cards: "What is scored" with the metric key, then one card per regime.
4. Caveat strip, with the bridge pair beside it. The bridge pair is the one system measured both ways, its two F1 values side by side.
5. Filter bar: System chips, Measured by chips, row count "N of M rows", Reset filters.
6. Table. Rank, system + model, the regime tag, F1 as the default sort, precision, recall, time per PR, tokens per PR, instances, version, judge + rounds, source, expand.
7. Row detail in place under its row. It shows who and what, coverage, judge, and source, in the order of the regime cards. It ends with "judge logs ↓" (our rows only), "the paper →" and a link back to its regime card.
8. Escaped defects: two counts over the same defect set, same scale, side by side.
9. Full method: benchmark, judge, how our rows were measured, the pipeline figure, the unscored instances.
10. Downloads: judge logs, leaderboard data, "the paper →".
11. Shared footer (home lane).

Phone (390): one column. The caveat moves above the regime cards. Each regime card collapses to one summary line. The chips scroll sideways. The table scrolls sideways inside its frame, with a sticky first cell (rank, system, model, regime tag). The row detail opens full width, outside the sideways scroll. The method becomes an accordion.

Rank choice: rank numbers, no medals. The rank is the position in the current sort and filter. The regime tag sits next to it, so no rank reads without its regime.

## What it is WORSE at

This layout is worse at the engineering lead's one-glance ranking and at the brief's density goal. Measured on the board at 1:1, the table header starts at 616 px on a 1440 by 900 screen, so only 5 of 16 rows are fully visible, against the goal of 10. On the phone, the first screen holds the caveat and the regime summaries, and the table begins at its bottom edge. A reader who came only for "who is first" scrolls past three cards and a caveat each visit. The "the table ↓" jump link softens this; it does not remove it. The conditions are also stated twice: once per regime in the cards, once per row in the detail. A future row whose conditions differ from its regime card weakens the cards. A third regime, for example a Haiku run under a different judge, needs a fourth card, and the band stops fitting one row at 1440.

## Lock amendment

None. The lock's dark ground, the three typefaces and calm motion carry this layout. The regime tag must read apart from the rest of the row. That is a style-rung question inside the lock (the mono label face, or the orange spark accent on our rows), not an amendment.

## Data that must exist

- **Per-regime summary fields.** Instances scored of total, judge model, rounds, version, source and read date, the same for every row of a regime, or the card states the range. For the Open Code Review regime, the judge as they publish it; if they do not publish it, the record carries an explicit "not published" value, never an empty field.
- **A bridge key.** A field linking our re-measure of Open Code Review (29.02 F1) to their published row (25.10 F1). Without it the bridge pair cannot be built, and the zone is dropped.
- **Time and tokens per PR on published rows, or an explicit "not published".** The columns exist on every row.
- **The unscored list.** The 12 unscored instances, each with its reason, for the full-method zone and the coverage group of the detail.
- **The escaped-defects record.** The two counts (31 and 10), the shared denominator (43), the definition of an escaped defect, and its source.
- **Metric definitions.** One line per column, in the column order, for the metric key.

## Links (journey step, control, position)

- In from Home: shared nav "Benchmark" and the teaser "every row →" land at the page head.
- J2.2 sort: any column header of the table; F1 is the default.
- J2.3 filter: the chips in the filter bar, or "show these rows" on a regime card.
- J2.4 expand: the row or its expand control, rightmost cell; the detail opens under the row; a second click closes it.
- J2.5 download: "judge logs ↓" in the row detail, bottom left; the same files in Downloads.
- J2.6 out to Paper: "the paper →" in the row detail and in Downloads; shared nav "Paper".
- Out to Home: shared nav wordmark.

## Killed option

**Method as a rail beside the table.** The conditions sit in a fixed left column and the table on the right. I killed it for two reasons. It turns into lane B's persistent detail pane with general text in place of the selected row. It also takes width from a 13-column table at 1440. A second candidate was a one-time explainer the reader dismisses before the table appears. I killed it because it hides the caveat after the first visit, which breaks the contract ("the ranking never hides it").

## Findings for the lead

1. **The brief contradicts this axis on method placement.** The surface contract says "Below the table, the same page carries: the method section…", and axis C says the conditions lead. I split the method. The conditions, the caveat and the unscored count lead as cards. The long method (pipeline figure, judge, unscored list) stays below the table, reached by "full method ↓". If the owner picks 1c, the contract line needs this split recorded.
2. **The design-system canon did not resolve.** The canon file under the app-builder skill references is absent in this repo. The brief names the lock file as the only visual input, so the layout rests on DESIGN.md alone.
