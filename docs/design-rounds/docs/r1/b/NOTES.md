# Docs, rung 1 (layout), B: top sections

Mode: blind. I opened no screenshot, no `index.html`, no `styles.css`, and no other docs lane's folder. Inputs read: docs/PRD.md, docs/JOURNEYS.md, docs/DATA-MAP.md, docs/SUBSCREEN-OBJECTIVES.md, docs/DESIGN.md and the brief.

**Thesis.** The docs read as six sections. The reader picks a section from a tab bar under the site nav, picks a page from a short left list, and reads in one wide column. Search sits in the same bar on every docs page.

**Axis.** Navigation is horizontal: sections in a second nav bar, and the left list holds only the current section. The in-page table of contents sits inside that list, nested under the open page, so the reading column has no right rail.

**The movie (J3.2 to J3.6).** The reader arrives at /docs/ from the nav. No tab is marked, and the landing lists all six sections with every page title. They click "Verdicts", which opens under Concepts: the Concepts tab is marked, the left list shows the Concepts pages with Verdicts marked, and its headings are nested under it. They type "predicate registry" into the search field in the bar. Results drop over the column, each hit labelled with its section. They open the top hit: the tab switches to Differential attestation and the list shows the nine DA pages. At the end of the page, "Next →" names the next page and, at a section boundary, the next section. On the phone the tabs become a strip that scrolls inside itself, and the page list becomes a "section · page ▾" menu.

**Worse at.** B never shows the whole tree on a docs page. The left list shows one section, so a reader who does not know which section holds a page has to guess a tab or search. Only the /docs/ landing lists every page, which meets J3.2's "the sidebar lists every page" only on that page. Two stacked bars (site nav and section nav) take vertical space on every page. On the phone the section strip plus the pages menu bar take about two rows more than a single menu would, and the strip hides tabs 4 to 6 off-screen until scrolled. The six labels differ in length ("Differential attestation" against "FAQ"), and the sections differ in size (nine DA pages against one FAQ page), so the bar looks uneven and the FAQ list holds one entry. The in-page table of contents shares a 240 px list with the page titles, so a long page with many headings makes the list tall and wraps its headings.

**Lock amendment.** None. The second nav bar adds an element to the shared shell, which the home lane owns. It needs that lane's agreement but changes no lock value.

**Data that must exist.**
- A section for every docs page, from the six in the PRD (Getting started, Concepts, Guides, Reference, Differential attestation, FAQ), plus the page order within each section. Prev and next follow that order across section boundaries.
- A short tab label per section that fits one row at 1440. "Differential attestation" may need a short form ("DA") at 390.
- The h2 list per page, with a rule for "long page" (proposed: three or more h2s) that decides whether "On this page" shows.
- Per page: the source file path and pinned commit for the source line. Per search hit: its section name.
- A /docs/ landing page that lists every section with every page title.

**Killed options (inside this axis).**
- A third bar with the page list as horizontal pills under the section tabs. Killed: it stacks three bars above the text, and long page titles ("Writing provable code", the DA architecture titles) wrap or truncate in pills.
- The table of contents as a right-hand column. Killed: it splits the "one wide reading column" this axis promises, and it turns B into a rail layout with tabs on top.

**Brief contradictions, reported and not resolved silently.** The round brief says "no git commit" and "do not also send it with SendMessage". The dispatch wrapper says to commit on lane/docs-r1-b and send a six-line report to the agentconnect group. I followed the dispatch: I committed this folder only, did not push, and sent the report.
