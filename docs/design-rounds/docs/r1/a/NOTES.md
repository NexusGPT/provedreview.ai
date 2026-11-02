# Docs, rung 1 (layout), A: rail

Mode: blind. I never opened `index.html`, `styles.css`, a screenshot, or another lane's folder. The only image I looked at is a headless render of this board, written to `/tmp`.

**Thesis.** The rail is the map. Every section and every page stays in view on desktop, so a reader always knows where the page sits and what else is there, with no click.

**Axis.** A fixed left sidebar of sections and pages (280 px, all six groups open), a wide reading column (720 px measure), and an in-page table of contents on the right (240 px) for pages with 3 or more H2s.

**The movie.** A developer clicks "the CLI reference" on Quick start. The CLI page opens with "CLI reference" marked in the Reference group, and the table of contents lists the commands. They click "--seed" in the table of contents, copy a command with the always-visible copy control, and read on. They type into the rail's search field. The results panel opens over the column, and Enter opens the top hit. At the page end, Next opens the following page in rail order. The wordmark goes Home.

## Frames (in `index.html`)
- 1440: a long page at rest, with the first screen marked.
- 1440: search open, including the empty state.
- 1440: the /docs/ landing.
- 390: page at rest; menu open; search open.

## Worse at
The rail permanently spends 280 px, and the table of contents another 240, on chrome that flanks the text on both sides. This is the least focused reading of the three axes. It is crowded between about 1024 and 1280 px, where the table of contents has to drop, and the reading column then sits off-centre. With about 30 entries all open, the rail is taller than one screen. The nine Differential attestation pages and FAQ sit below the fold of the rail on a 900 px window, so a reader on a Getting started page scrolls the rail to see them. Section switching is a scroll, not a click (Lane B's top sections do it in one click). On the phone the rail's whole value, seeing where you are, sits behind the Menu button. What is left is a one-line section label in the docs bar. Search sits inside the rail, not in a dominant spot; the `/` key and the phone's Search button carry it.

## Lock amendment
None. One flag for the style rung (not an amendment): the lock's density line ("section padding 80px desktop, 48px phone") is a landing-page measure. Read literally it would apply between docs headings, so the style rung needs a docs-scale spacing inside "comfortable".

## Data that must exist
- Per page: section, order within the section, title, and the H2/H3 list with stable anchor ids. These drive the rail, prev/next across section borders, and the table of contents. DATA-MAP `docs-page` holds title, section and prev/next, but not the heading list or the order key.
- Per page: the source file path and the pinned commit, for the source line under the title. DATA-MAP holds a pin per content set, not per page.
- Per section: a one-line description, for the /docs/ landing blocks.
- The table-of-contents threshold (3 or more H2s) as a build rule.
- The Pagefind index with title, section label and snippet per hit (`search-index`).

## Killed
- **Collapsible rail, current section open only.** It was shorter and calmer, but it hides about 25 of the 30 pages at any moment. That breaks the axis's point and makes "every page reachable from the sidebar" (PRD criterion 3, J3.7) a two-click affair.
- **Table of contents nested in the rail under the current entry** (a two-column variant). It frees 240 px for the column, but the table of contents then scrolls with a 30-entry rail and goes out of view on long pages. It also merges into Lane C's territory (one column plus a drawer) and stops being a real alternative.
