# Benchmark · rung 1 LAYOUT · B: dossier

Mode: blind, inception. I opened no `index.html`, no `styles.css`, no screenshot of the site and no file of lanes A or C. Inputs: the lane brief, PRD, JOURNEYS (J2 + screen links), DATA-MAP, SUBSCREEN-OBJECTIVES, DESIGN.

- **Name + thesis.** Dossier: a compact ranked list with a persistent detail pane beside it. One row is always selected, and its measurement conditions are always on screen.
- **Named axis.** What is dominant: one row's conditions, held next to the ranking. The ranking is never shown without one row's conditions.
- **Board.** `index.html` in this folder. It shows desktop 1440 wide (primary) with the 900 px fold, and phone 390 wide below it. It is badged "B".
- **Rank rule (my choice).** Rank numbers follow the current sort. No medals, because rows from two judge runs are not one contest.

## What this layout is WORSE at

The list gets about 60% of the width, so it is the least scannable of the three directions across rows. Text columns lose room: system and model names truncate sooner, and version, judge, rounds, source and read date are not columns. A researcher who wants to compare the judge or the version across all 16 rows must click through them one at a time. The pane is never empty, so the page opens on one row. Under the default F1 sort that row is ours, which can read as a spotlight on our own claim. The persistent pane exists on desktop only. At 390 px it becomes the in-place expansion the contract already asks for, so on the phone this direction gives nothing over a plain table. The sticky pane also ends where the list ends, so the method section cannot sit beside it.

## Lock amendment

- **To the visual lock (`docs/DESIGN.md`): none.** The two-column region fits the lock's dark ground, type and density as they stand.
- **To the interaction contract (a finding, not a silent change).** The brief says "a row expands in place", and J2.4 says "the detail opens under its row; a second click closes it". On desktop this axis selects the row into the pane instead. Cost: J2.4's "visible result" cell and its test J2#4 change to "the selected row is marked and the pane shows its conditions". The owner re-signs that one step. On the phone the contract stands as written.

## Data that must exist

- **A stable row id** per leaderboard-row, for the selection in the URL so a link opens the same row.
- **A judge-run id** per row, for the comparability line ("judged in the same run as …"). DATA-MAP holds no such field.
- **An unscored reason** per row, for "184 of 196, 12 unscored: why". DATA-MAP holds instances but not the total or the reason.
- **The filter model** for our rows (claude-opus-4-8 in J2.4). DATA-MAP lists "model" and "judge" only.
- **A log-availability flag + log paths** per row, so published rows say "logs not published" in place of a download.
- **A null value** for time and tokens on rows whose publisher gave none. The list and the pane show it as "not published", never as zero.
- **The citation fields** (system, model, F1, measured by, version, instances, judge, rounds, read date), all already in the row except the total and the unscored reason.

## Links

| Journey step | Control on the board |
|---|---|
| J2.1 → J2.2 in | Nav "Benchmark"; Home teaser "every row →" lands with the top row selected |
| J2.2 | List header "F1" and every number header, top of the list |
| J2.3 | Filter bar chips "Measured by" and "System", above the list |
| J2.4 | Click a list line: desktop fills the pane at right; phone opens it under the row |
| J2.5 out | Pane "Judge logs", bottom of the pane; again in Downloads |
| J2.6 out | Pane "The paper →", bottom right of the pane; nav "Paper" |
| to Home | Nav wordmark; footer |

## Killed

- **Bottom drawer** (list above, conditions in a drawer below). Killed: the drawer pushes the list under ten rows at 900 px and competes with the method section for the same space.
- **Pane on the left** of the list. Killed: the reading order then puts conditions before the ranking, which is lane C's axis ("method first"), not a dossier.
