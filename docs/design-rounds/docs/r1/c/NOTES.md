# 1c · Docs layout, rung 1, Lane C: "reader first"

Mode: blind, inception. Not opened: `index.html`, `styles.css`, any screenshot, any other lane's folder.

**Thesis.** The docs page is one reading column. The page tree sits in a drawer on every viewport. A sticky docs bar holds the Contents button, a breadcrumb and a search field that stays on screen. The page's own table of contents is a strip under the title.

**Named axis.** What is dominant: the page being read, not the tree around it.

**The movie (J3.2 to J3.6).** The reader gets to /docs/ from nav "Docs" or the 404 page. The landing lists all six sections with every page, flat in the column. They open Verdicts. At rest they see the docs bar (Contents · Docs / Concepts / Verdicts · search), the title and a one-line summary, then the on-this-page strip. As they scroll, the docs bar and the strip stick and the current heading gets marked. They type "predicate registry" into the field, which they can reach from anywhere on the page. A results panel drops under the field and they press Enter on the top hit. The new page opens, and the breadcrumb now reads Docs / Differential attestation / Predicate registry. At the page end they click "Next →" and the next page opens in sidebar order. At any point Contents opens the drawer with all six sections expanded, scrolled to the current page and with it marked. A second click or Esc closes the drawer, and the page keeps its scroll position.

**States drawn.** At both 1440 and 390: the page at rest, the drawer open, search open (with its empty state), and the docs landing.

**Phone trade.** The design targets 1440 and is adapted for 390. On the phone the docs bar takes two rows at rest (Contents and breadcrumb, then search). Once the reader scrolls it collapses to one row (Contents · page title · search icon), so the bar and the "On this page ▾" control together hold about 100 px of sticky height. The drawer and the search results each fill the screen. Code blocks and tables scroll sideways inside their own frames, so the page itself never scrolls sideways.

## Worse at

Browsing. The reader never sees the page tree beside the page, so finding out what else is in a section costs a click on desktop just as on the phone. Siblings are found through the drawer, prev and next, or search, never by glancing left. A reader who wanders the docs to learn their shape (a researcher surveying the nine or ten architecture pages, for example) does more opening and closing than with a fixed rail. At 1440 about half the width is empty margin, so a wide screen gains nothing over a laptop. J3.3 and J1.5 name a "sidebar entry highlighted". In this layout that highlight exists only inside the open drawer, and the breadcrumb answers "where am I" instead. The J3.7 test, which opens every page from the sidebar, needs one extra click per page. Long pages with many headings push the on-this-page strip into a "more ▾" overflow, which is weaker than a full right-hand list.

## Lock amendment

None. The lock (docs/DESIGN.md) fixes colour, type, density and motion. This layout uses none of those, and comfortable density holds in a single column.

## Data that must exist

- Each page's section and its order within the section. This is the sidebar order, which also drives prev, next and the drawer (open question 9: the PRD's six sections).
- A section label and a page title for every page, for the breadcrumb and the search hits. The section crumb needs a target: the section's block on the landing (`/docs/#<section>`) or a section index page.
- Each page's h2 list with stable ids, read at build. The strip needs a cut-off for "long page"; I used 3 or more h2 headings on the board.
- A one-line summary per page, for the title block and the landing lists. Vendored markdown has no such field, so it is either the first paragraph or a front-matter line added at vendoring.
- Each page's source repository, file path and pinned commit, for the source line.
- A section field in the Pagefind index (a filter or meta attribute), so each hit can show its section.
- Prev and next across a section boundary, labelled with the destination's section.

## Killed

One option was killed: a drawer-only layout with no persistent search field, where search is an icon that opens a full-screen overlay on every viewport. It was cleaner, but it moved J3.4's primary interaction behind a control too. With the tree already behind one, the reader would have no way into other pages that stays visible on screen. Keeping the field visible is what makes the drawer acceptable.

## Findings for the coordinator

- The brief says "no git commit", but the dispatch tells me to commit on this branch. I followed the dispatch.
- The brief says not to send the report with SendMessage, but the dispatch asks for an agentconnect report. I followed the dispatch.
- Page count: the brief says about 30 pages and nine DA architecture pages. J3 says 19 pages (9 lean docs, 10 DA architecture). The layout works at either count. The drawer's length and the landing grid are the only parts it changes.
- The brief points to "the Docs sections" in docs/PRD.md, but the PRD has no such sections. The six section names come from JOURNEYS open question 9.
- The doctrine asks each lane for 2 to 3 alternatives. This dispatch sets one per lane (three lanes make the slate), so this lane delivers one, plus the killed option above.
