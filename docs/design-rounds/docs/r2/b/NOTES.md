# Docs, rung 2 (style) on layout A "rail", B: terminal manual

Mode: blind. I did not open the home page as a screen, any screenshot of the site, or another lane's folder (docs/r2/a, docs/r2/c). For tokens and the shared nav I read `styles.css` (line 2 only, the variables) and the picked benchmark board `docs/design-rounds/benchmark/r2/b/index.html` (the nav, type steps and colour steps), as the dispatch named. The only images I looked at are my own headless renders.

**Thesis.** The docs read like a well-made man page. All navigation is mono, set as a tree. Code is the largest object on the page, and the orange spark traces where you are.

**Axis.** Mono-led:
- The rail and the right contents are set in JetBrains Mono 13 px with tree glyphs (`├─ └─ │ ┬ ▾`).
- The reading column is Inter 16 px, set tight (line-height 1.55, −0.006em). The lede is 18 px.
- Code blocks are 48 px wider than the prose on the left, where the line gutter hangs, so the code's first character aligns with the prose edge. They are 64 px wider on the right.
- Each code block has a header bar (language, source lines, copy control). The copy control is always visible and reads "✓ copied" in place.
- Output blocks are dashed, with `›` in place of line numbers.
- Every H2 hangs a mono `#` in the gutter, and every H3 a `##`. The hash turns orange when its heading is the target.
- The active path is in the spark (#f0a08c, the lock's `--wit`): the open section's `▾`, the current rail entry (bar, glyph and ◆), the headings above it in the contents, and the breadcrumb leaf.

**Loaded page.** Getting started / Run it, written from `NexusGPT/differential-attestation` README.md "## Run it" at 9b4243d. I read it from the local mirror `/root/da-master`; the GitHub raw URL returned 404, since the repo is not public yet. The page carries 4 command blocks plus 1 output block, 2 tables (requirements; the immich row), 1 note, and the PASS / REFUSE / ASK list.

The rail lists 32 pages. They are the real files of lean `docs/` (b5c0745) and DA `docs/architecture/` (9b4243d), under the dispatch's six sections. The page titles in Getting started, The benchmark, Reference and FAQ are my proposals.

## Frames (in `index.html`, badge B on each)
1440: page at rest (first screen, the rail cut with a `-- more --` pager line) · long page with the right contents (arrived by a contents entry: target hash, "✓ copied") · search open ("predicate registry", J3.4, plus the empty result) · docs landing (six sections as directory listings, one line each).
390: page at rest (full length) · menu open · search open.

## Worse at
- **Mono navigation is slower to scan.** It is about 20 % wider than Inter, so the rail fits fewer characters. Long DA titles are near the 280 px edge, and a 30-character title will truncate. The contents column already wraps "Check one pull request".
- **The rail is long.** At 32 entries × 26 px it runs about 1,200 px. On a 900 px window, The benchmark, Reference and FAQ sit below the fold, and the `-- more --` line admits it rather than fixing it.
- **Code dominates.** It reads well on command pages like this one, but on prose-heavy pages (Assurance case, How it works) the hanging gutter and wide blocks make the column edge jump.
- **Long command lines scroll sideways inside the block** and are clipped with a fade. On the phone, most of every command is off-screen until scrolled: the `pr.mjs` line shows about 40 of its 110 characters.
- **The spark colour is also the WITNESS / REFUSE colour.** On a verdicts page, "you are here" and "this change was refused" share one hue.
- **The style is not the instrument look's own density.** It sits beside benchmark B through the shared nav, mono labels and colour steps. It does not carry B's 14 px grid ground, so the two pages share a family, not a texture.
- **The phone adapts the layout; it is not designed for the phone.** The requirements table wraps "if missing" into three lines, and the table with the immich row scrolls sideways.

## Lock amendment (one)
**Navigation text is set in JetBrains Mono on the docs pages.** This covers the rail, the contents, the breadcrumb, prev / next labels and the search hit paths. The lock gives mono to "labels and code"; this widens "labels" to all docs navigation. Page titles, headings and body stay Inter.

Cost:
- The docs rail no longer matches the site nav, which stays Inter.
- Navigation is about 20 % wider and slower to scan (see Worse at).
- The two type families now meet at the column edge on every docs page.

Not an amendment, a decision inside "comfortable": the 80 / 48 px section padding is not applied between docs headings. H2 gets 52 px above it (40 on the phone) and H3 gets 36 px. The r1 notes flagged this.

## Motion (calm)
- **Enters:** nothing on page load. Docs pages do not use the home page's scroll reveals.
- **Transitions:**
  - The search panel fades in over 120 ms.
  - The phone menu sheet slides down 160 ms.
  - The contents spark moves to the heading in view with no animation, so it never lags the scroll.
- **Responds:**
  - Hover lights a rail entry's glyph and text to `--fg`, and shows a heading's `#` at full steel.
  - The copy control switches to "✓ copied" for 1.6 s.
- **Stays still:** the rail, the contents and the code gutter.

## Data that must exist
- **Per page:** section, order, title, the H2 / H3 list with stable ids. These drive the tree, prev / next and the contents.
- **Per page:** the source repo, file, section anchor, pinned commit and pin date, for the `src` line.
- **Per code block:** its source line range in the upstream file (`README.md:122–123`) and its language. Output blocks need an `output` flag and their provenance line (the PR and its base and head).
- **Per section:** a one-line description, plus page count for the landing.
- **The search index:** title, section slug, page slug and snippet with match offsets.
- **Titles that are not yet files:** the sections Getting started, The benchmark, Reference and FAQ need real pages behind these names. Today they are README sections, so the vendor script has to split READMEs into pages.

## Killed
- **Man-page pure: everything mono, the body included.** It was the most consistent take on the axis. I killed it because a 720 px measure of mono body is about 80 characters of slower reading, and it breaks the lock's "Inter for text" outright: that would be a second amendment.
- **Collapsed tree (`▸` sections closed except the current one).** It made the rail shorter and more terminal-like. I killed it because layout A's rule is all six sections open, and closing them hides most of the pages (J3.7).
- **Line numbers on output blocks.** Numbers suggest the output is source you can cite by line. The `›` gutter says "printed", not "written".

## Shots
Headless Chromium (headless shell 1248), one PNG per frame, in `shots/`: 1440-page-at-rest, 1440-long-page, 1440-search-open, 1440-landing, 390-page-at-rest, 390-menu-open, 390-search-open. Every frame checked: no element past its frame's right edge (code and tables scroll inside themselves).
