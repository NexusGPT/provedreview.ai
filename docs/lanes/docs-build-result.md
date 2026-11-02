# Lane docs-build: result (2026-11-02)

Branch `lane/docs-build`, not pushed. Commits: `228cd76` (merge of `lane/site-build`), `a0d6ded` (content and renderer), `b3d69ad` (shots and fixes), plus this note.

## What is built

- **31 pages in six sections**, Markdown under `content/docs/<section>/<page>.md`, front matter `title, order, lede, sources`:
  - Getting started (3): install, first run, the certificate.
  - Lean (10): one page per lean `docs/` file, plus Verdicts. Lane A and lane B are H2s of How it works.
  - Differential attestation (10): The method, plus one page per DA architecture page.
  - The benchmark (3): DA-Bench (instances, truth, slice, hard set), Run and score, The four lanes.
  - Reference (4): CLI, record shape, environment variables, exit codes.
  - FAQ (1).
- **Why 31 and not 15 to 25:** PRD criterion 3 requires every lean `docs/` page and every DA architecture page in the sidebar. That is 19 pages before Getting started, the benchmark, the reference and the FAQ. The picked board showed 32.
- **The sources are vendored at their pins**, listed in `content/PINS.json` and copied by `scripts/vendor.mjs`. The vendor script gained a `da` clone entry.
  - lean is at v0.1.3 `dbe9a32`, the quick start's pin.
  - DA is at `25b7ab2`.
- **Every code line is checked verbatim** against the page's own sources by `scripts/docs-sources.mjs`: 106 blocks, 0 problems.
  - Each block's caption shows its source line range, linked to GitHub at the pin.
- **Rendering:** `site/docs.mjs` renders the pages with marked and shiki. It plugs into `build.mjs` through `routes()` and `pages()`; that is a three-line hook.
  - The look comes from `docs.css` and the behaviour from `docs.js`.
  - The rail has all six sections open and search in its head.
  - The right contents appear on pages with 3 or more H2s.
  - Prev and next walk the rail order.
  - On the phone, a bar holds the menu and search.
  - Code blocks have a gutter, a source line and "copy" that turns to "✓ copied". Output blocks are dashed with `›`.
  - Headings carry a hanging `#` that turns orange when the heading is the target. The spark marks the active path.
- **Search** is Pagefind, filtered to `area:docs`, with ↑↓, Enter and Esc keys, `/` to focus, and an empty state with clear.

## Tests (red first: the build failed with no docs.css; three failures fixed after)

- **`scripts/docs.test.mjs`, 13 tests:**
  - Sourcing.
  - Six sections.
  - Every file renders through shiki.
  - The rail lists every page on every page, with one current.
  - Prev and next order.
  - The contents rule and its ids.
  - Code gutter, copy and source range.
  - The landing.
  - No em or en dash.
  - Links (2,409 internal links, 0 broken).
  - HTML validity.
  - The index.
  - Search in a browser: the top hit per section, "predicate registry" giving "Predicate registry", and the empty state.
- **`npm test`:** 33 of 33. The site-build docs-placeholder test is narrowed to the benchmark page.
- **`scripts/docs-shots.mjs`:** 13 frames under `docs/shots/docs-build/`, all clean. I read them back.

## Decisions for the lead

1. **Merge:** I merged `lane/site-build` into this branch so the docs drop into the real pipeline. The `docs/DEPLOY.md` and `.github/workflows/pages.yml` add/add conflicts with master are taken from site-build.
2. **URLs:** the pages live at `/docs/<section>/<slug>/`, so Predicate registry is `/docs/differential-attestation/predicate-registry/` and Verdicts is `/docs/lean/verdicts/`. JOURNEYS J3 named `/docs/verdicts/` and `/docs/architecture/predicate-registry/`. The journey steps go by link text, which matches.
3. **Sticky bug in the shared shell:** `styles.css` sets `overflow-x:hidden` on html and body, which breaks `position:sticky`. The docs pages override it with `overflow-x:clip`. The quick start's sticky contents and the sticky nav are probably broken the same way. That file belongs to site-build.
4. **Commit attribution:** commits use the repository author `lead` and the trailer the brief asked for ("Claude Fable 5.1"). This lane ran on Claude Opus 5.5.

## Left out, with no source in the named files

- **The break registry:** it is only in lean lane notes after v0.1.4.
- **"Cause lines", "oracles", "rules" as parts of the method:** they are only in DA lane notes.
- **The `compare.py` usage line.**
- **Whether the DA repository is public.**
- **Some environment variables:** `NODE_OPTIONS`, `HOME` and `XDG_CACHE_HOME`, which lean v0.1.3 does not name.
- **Some exit codes:** the `--block` exit code and `exec/run.mjs`'s exit code.
- **Conflicting claims, both versions dropped:** lean's CI workflow status and its number reading. In each case two sources disagree.
