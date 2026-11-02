# Docs, rung 2 (style), C: paper margin

Mode: blind. I never opened the running site, a screenshot of it, or the r2/a and r2/b folders. The images I looked at are headless renders of this board, in `shots/`.

**Thesis.** The reading column is the page. Everything around it is margin: the rail recedes, and the contents and side notes sit in the right margin as marginalia.

**Axis.** Where the emphasis sits:
- Headings and margin notes are set in Source Serif 4. Body text is Inter at 17 px on a 720 px measure.
- The rail is grey 3 at 13 px. Only the open section is bright, and the current page is cream with a 2 px bar.
- The contents is a numbered list of serif italic marginalia, with the section in view in cream.
- Code blocks are one panel: no gutter, no line numbers, two tones (command, flags), the copy control always visible. Output blocks get a WITNESS-tinted edge.
- The shared nav, colour steps and mono labels come from benchmark look B. The cream / steel / witness-orange accents carry across as well, so the two pages read as one site.

**Layout A, as realised.** At 1440 the columns are: rail 280 | column (64 px in, 720 measure) | margin 300 (240 of text). On scroll the margin contents shrinks to a one-line running head (the current §), so it never covers a pull note. At 390 the rail becomes "☰ <section>", the contents a dropdown and search a full sheet. Margin notes fall into the column as indented italic notes. Designed for 1440 first; the phone is the adaptation.

## Frames (`index.html`, shots in `shots/`)
- 1440 page at rest: Getting started › Quick start, full length, 900 px fold (`d-rest.png`).
- 1440 long page with the margin contents: Reference › CLI reference, "Flags" in view (`d-long.png`).
- 1440 search open: "predicate registry" (`d-search.png`), plus no results (`d-empty.png`).
- 1440 docs landing: six sections, one line each (`d-landing.png`).
- 390: page at rest (`p-rest.png`), menu open (`p-menu.png`), search open (`p-search.png`), contents open (`p-toc.png`).

## Content
The Quick start page is set from lean README "## Three runs" and "## Using it" at `fe06326`, as quoted in JOURNEYS J1.2 to J1.5 and SECTIONS §5. It has 3 code blocks plus 1 output block, 1 table and 1 note. I could not read the DA README (`raw.githubusercontent.com` answered 404 and `gh` has no credentials), so I took the PRD's fallback.

Some text is a stand-in until its source exists:
- Rail page names other than Quick start, Verdicts, Predicate registry, Preview and CLI reference.
- The one-line scope of `pr.mjs`, `exec/run.mjs`, `lint.mjs` and `bin/lean`.
- The meaning of `--no-project`.
- The search snippets.

## Worse at
**The rail.** Scanning the rail to find a page is slower. Five of six sections sit in grey 3 (#767b8b, 4.7:1 on the ground, chosen to stay at AA; B's #5d6272 is 3.2:1). A reader reads them on purpose, not at a glance, so jumping across sections leans on search more than on lane A's or B's rail.

**The margin.** It is empty on pages with few notes: a 300 px column of nothing beside short pages, and on the landing. Pull notes also only align with their paragraph on desktop. On the phone every margin note falls into the column, so the phone page is longer than it is on any other axis, and the notes interrupt the steps they annotate.

**Serif headings.** They read as "paper" and set the docs apart from the benchmark page's sans heads. The two pages share a nav and colours but not a heading face. Source Serif 4 roman adds a font file: about 40 to 60 KB for the 600 weight, inside the 600 KB budget.

**Code density.** Calm code with no line numbers cannot be cited by line in an issue.

## Lock amendment (one)
**Source Serif 4, roman 600, for docs headings (H1 to H3), prev/next titles, search-hit titles and landing section names. Italic stays for margin notes and the contents.**
- The lock today: Source Serif 4 italics for the paper and the math only.
- Cost: serif no longer means "from the paper" alone. Docs and benchmark head their pages in different faces. One more font weight ships.
- Without the amendment: headings fall back to Inter 600 and the axis loses half its identity. The margin italics stay inside the lock as they are.

Not an amendment, recorded for the lead:
- Grey 3 = `#767b8b` is a new named step between B's `--mut` and `--dim`. The lock names no grey steps.
- The lock's 80 px section padding is not applied between docs headings. H2 spacing is 56 px above, inside "comfortable". r1/a flagged the same.

## Motion (calm)
- **Enters:** nothing on page load. No reveal on docs pages.
- **Transitions:** the search panel fades in at 120 ms. The phone sheet slides up at 180 ms. The margin contents swaps to its running head with a 150 ms fade.
- **Responds:** rail entries, contents and hits brighten one step on hover. Copy reads "copied" for 1.5 s.
- **Holds still:** the rail, the column, code blocks and tables.
- Reduced motion turns all of these off.

## Data that must exist
- Per page: section, order, title, the H2/H3 list with stable anchors (for the contents and the § numbers), source file and pinned commit.
- Per page: **margin notes as authored data**, e.g. a `:::margin` block in the vendored markdown, or a sidecar. Upstream READMEs carry none, so without them the margin holds only the contents.
- Per section: a one-line description and a page count (for the landing).
- The vendored page list (`scripts/vendor.mjs`) to replace the stand-in rail names.
- A Pagefind index with title, section label and snippet per hit.
- Per output block: its verdict label (WITNESS, PASS-decided…) for the caption.

## Killed
- **Footnotes at the foot of each section instead of margin notes.** They are the more classic paper device, and they work identically on the phone. But they push the asides out of view, which is the opposite of this axis. They are also prose-heavy, against "no useless prose".
- **Serif body (Source Serif 4 for running text).** It is the purest "paper", but it breaks the lock's Inter-for-text twice: a second amendment, and a docs page that no longer sits beside the benchmark page as one site.
- **Contents as numbered anchors in the margin beside each H2, with no list.** It is elegant on desktop, but there is no overview of the page and nothing to collapse to on the phone.
