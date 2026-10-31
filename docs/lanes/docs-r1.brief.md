# Lane brief: docs pages, rung 1 (LAYOUT), inception round

You design the LAYOUT of the documentation section of a static site, as labelled boxes: zones only, no data, no styling. Three lanes run this brief at once, each on its own axis; you never see the others' work. The owner picks one layout; a later rung dresses it.

Owner's words, verbatim: "have full docs"; "a CLEAR and NICE quick starr page"; on the look (30 Oct): "a tone of voice closer to open-codereview. No useless prose. No litotes. ANd its own visual identity"; "make sure you are not overfitting (NEVER) your solutions". Never write `2>/dev/null`; use `2>&1`.

Read first, in full: `docs/PRD.md` (the Docs sections: Getting started, Concepts, Guides, Reference, Differential attestation, FAQ), `docs/JOURNEYS.md` (J3.1 to J3.7 and J1.4), `docs/DATA-MAP.md` (docs-page, search-index, nav-link), `docs/SUBSCREEN-OBJECTIVES.md` (the docs row), `docs/DESIGN.md` (the lock). Do not open `index.html`, `styles.css` or any screenshot: this is the first design of this section.

The objective (owner-approved): a developer adopting lean, or a researcher, finds the one page that answers a question and reads it without leaving the section; decision: how do I use lean here. Primary interactions: the sidebar, search, prev and next, copy a command. Desktop primary (1440), phone secondary (390): on the phone the sidebar collapses to a menu.

The surface contract: the docs hold about 30 pages in six sections (lean's docs: how it works, verdicts, writing provable code, pull requests, editor and agents, front end, known values, limits, around lean, assurance; the CLI reference; the certificate; .gate/sandbox.json; the nine DA architecture pages; FAQ). A page is prose with headings, code blocks with a copy control, tables, an occasional figure. Navigation: the shared site nav on top (Benchmark · Quick start · Docs · Paper · GitHub); a section sidebar; an in-page table of contents for long pages; search (Pagefind) reachable from every docs page; prev and next at the page end; a link to the page's source commit. Links in: nav "Docs" from any page; Quick start's "the CLI reference". Links out: Home (nav), Quick start (the install link), GitHub. Audience: developers first; density comfortable; no hover-only information.

Your axis (one per lane; the dispatch names yours):
- Lane A, "rail": a fixed left sidebar of sections and pages, a wide reading column, an in-page table of contents on the right for long pages.
- Lane B, "top sections": the six sections as a horizontal second nav under the site nav, the page list for the current section as a slim left list, one wide reading column, search in the second nav.
- Lane C, "reader first": a single reading column with the sidebar collapsed into a drawer on every viewport, a persistent search field and a breadcrumb at the top, the table of contents as a sticky strip under the title.

Deliver: `docs/design-rounds/docs/r1/<lane>/index.html`, one self-contained HTML file showing the layout at 1440 and, below it, at 390, each as labelled boxes (a box per zone with its name and one line of what it holds; grey outlines only; no data, no colour, no fonts beyond the browser default); `docs/design-rounds/docs/r1/<lane>/NOTES.md` (the worse-at paragraph; one lock amendment with its cost, or "none"; the data that must exist); `docs/design-rounds/docs/r1/<lane>/alternatives.json` ([{id, rung: "layout", title, axis, entry: "index.html", worse_at}]). Report after the first alternative is on disk.

Owns: `docs/design-rounds/docs/r1/<lane>/` only.
Must not touch: any other file; no git commit; no server start; no screenshot of the current site; no network.
Writes to: the folder above.
Done when: the three files exist, the page opens from a file URL with both viewports visible, and your final reply names the axis, the file path and the worse-at paragraph. Your final reply is your report; do not also send it with SendMessage.
