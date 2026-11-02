# Docs, rung 2 (style), A: reference shelf

Board: `index.html` in this folder (badge **A**). It opens from a file URL and makes no external requests (checked headless: 0 requests). Shots: `shots/f1.png` to `shots/f7.png`, rendered in headless Chromium at true width. Mode: blind. I did not open any current docs screen, any other lane's folder (`r2/b`, `r2/c`) or any screenshot of the app. I read only the inputs the dispatch names: the lock, the picked rail board `r1/a`, and the picked benchmark look `benchmark/r2/b` (for the nav, tokens and type steps).

**Thesis.** The docs read as a bound reference. Sections are numbered 01 to 06 in mono small caps, each over a hairline spine. Pages are a quiet Inter list on that spine. The open page is a cream rule laid on the spine. The page is set like a printed reference: Source Serif 4 heads, Inter body at 17 px with 1.6 line height, code in shiki-style blocks on #111318, and contents ruled in hairlines with the heading in view on the same cream rule.

**Axis.** Typographic register. The benchmark page is an instrument (dense, graduated, mono). The docs are a printed reference (serif heads, long measure, quiet chrome). Both sit on one ground with one nav, one token set and one "current" device: cream marks "here" or "ours" on both pages.

**Real content.** The loaded page is Getting started › Run it. It is written from the DA README section "Run it" and the immich example that section points to, at differential-attestation@9b4243d (local clone, read 2026-11-02). It has six H2s and one H3, five command blocks, two output blocks, two tables (requirements; the immich verdict row), two notes and prev/next. The rail lists 33 real pages: lean `docs/*.md` (9 files), DA `docs/architecture/*.md` (10 files), and the rest from the two READMEs. Search hits use real text from `predicate-registry.md`, `README.md`, `run-record.md` (DA architecture) and `around-lean.md` (lean).

## Frames
1440: page at rest (full length, fold at 900) · long page scrolled, with the contents tracking "Check one pull request" · search open ("predicate registry", 4 hits, J3.4) · search with no results · docs landing (six sections, one line each, page counts, first pages). 390: page at rest (full length, fold at 844) · menu open (sheet, 44 px entries) · search open.

## Worse at
- **Two heading voices.** The benchmark page heads in Inter 500. These docs head in Source Serif 4 semibold, so moving from Benchmark to Docs changes voice at the title. That is the axis, and it is also a seam.
- **Long pages get longer.** A 17 px body with 1.6 leading and 60 px before each H2 makes this page about 3,500 px at 1440 and about 4,100 px at 390. That is the least dense reading of the three, and the worst for scanning a reference page for one flag. The contents column and search carry that job; the page itself does not.
- **The rail is taller than the screen.** With 33 entries at 1440 × 900, everything from "Sandbox list" onward sits below the rail's fold. On a 1280 px laptop the three-column grid leaves the 720 measure about 40 px of air.
- **Faint section heads.** The quiet list reads as a list, not as buttons. The section heads in 10.5 px mono small caps are the faintest element that carries structure, and on a low-contrast panel the steel heads fade toward the dim numbers.
- **Two menu buttons on the phone.** The site's Menu sits in the nav and the docs menu sits in the docs bar, which the reader must tell apart. The rail's whole value (where am I) is one line in the docs bar.
- **Serif fallback.** Without the real Source Serif 4 file, the fallback serif (Georgia, Liberation Serif) reads bookish and heavy, as in these shots. The look depends on shipping the font.

## Lock amendment (one)
**Source Serif 4 upright (600) for the docs heads:** page title, H2, H3, the landing's section names, search hit titles and prev/next titles. The lock limits Source Serif 4 to italics for the paper and the math.
**Cost:**
- One more font file (the 600 roman cut, about 40 to 60 KB woff2) on every docs page.
- The serif stops meaning "the paper" alone.
- The site gains a second heading voice beside the benchmark's Inter 500.

Without the amendment this axis falls back to italic serif heads, which read as the paper's voice on every docs page. That would be worse.

Not an amendment, an interpretation inside "comfortable": the lock's 80 / 48 px section padding is a landing measure, as `r1/a/NOTES.md` flagged. The docs use 56 px above the title and 60 px (48 on the phone) before each H2.

## Motion (calm)
- **Enters:** nothing. The page is present at first paint, with no reveal on scroll inside docs text.
- **Transitions:**
  - The search panel fades in over 120 ms.
  - The phone menu sheet slides 16 px and fades over 180 ms.
  - On scroll, the cream rule in the contents moves to the heading in view with no animation.
- **Responds:** rail entries, contents entries and hits lighten to full white on hover. "Copy" reads "Copied" for 1.4 s.
- **Stays still:** the nav, the rail and the contents column.
- **Reduced motion:** everything is instant.

## Data that must exist
- **Per page:** section, order in the section, title, and the H2/H3 list with stable anchors. These drive the rail, the contents, prev/next across section borders and the 3-H2 contents threshold. DATA-MAP `docs-page` has no heading list and no order key.
- **Per page:** the source file and the section of that file, plus the pinned commit, for the source line ("README.md, “Run it” · differential-attestation@9b4243d"). Pages built from a README section need a vendor rule: one H2 of a README becomes one page.
- **Per section:** a number (01 to 06), a one-line description and a page count, for the rail heads and the landing.
- **The search index:** title, section label and a snippet with match offsets per hit (Pagefind).
- **The requirement table:** Node 24, Python 3 and Dafny 4, as the DA README states them. If the docs should show the pinned patch versions, the build must read them from lean's Dockerfile.

## Findings for the lead
1. **Section list mismatch.** The dispatch's six sections (Getting started, Lean, Differential attestation, The benchmark, Reference, FAQ) differ from JOURNEYS open question 9 and the `r1/a` board (Getting started, Concepts, Guides, Reference, Differential attestation, FAQ). The board follows the dispatch.
2. **No Quick start section.** The dispatch asks for "the Quick start section's first page", but none of the six sections is Quick start. The board renders Getting started › Run it.
3. **Briefs conflict.** The appended round brief is the benchmark one ("no git commit", "do not also send"). The dispatch says to commit and send, and the dispatch was followed.
4. **Commit attribution.** The dispatch's attribution line names Claude Fable 5.1. This lane ran on Claude Opus 5.5.

## Killed
- **Book-style running heads.** A mono running head on every page ("§ 01 · Getting started · p. 1 of 4") and a page-number footer: more shelf, but it repeats the section label and the rail, which is useless prose in chrome.
- **Serif body.** Source Serif 4 for the body as well as the heads: the most "printed" option, but it cuts against Inter for text in the lock and would need a second amendment. It also makes inline code and prose fight at 17 px.
- **Cream-filled current entry** (a chip, not a rule): it reads louder than the page title and breaks the quiet list.
