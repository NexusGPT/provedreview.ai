# Lane site-build: result

Branch `lane/site-build`, from master 28bec52. Not pushed.

## What is built

- **Shell.** `scripts/layout.mjs` holds the one nav (Benchmark, Quick start, Docs, Paper, GitHub → lean; the current page is marked) and the one footer for every page. The nav is sticky on inner pages. On a phone it becomes a second row of links, with no script. The dark lock comes from `styles.css`; `site.css` adds the shell, the inner pages and the faces. Inter (300 to 600), JetBrains Mono (400, 500) and Source Serif 4 italic are self-hosted under `public/fonts/` (from @fontsource, OFL licences beside them). Google Fonts is gone.
- **Pipeline.** `npm run build` writes `dist/` (six pages plus the Pagefind index over five; the 404 is excluded). `npm run preview` serves `dist/` on 127.0.0.1:8769 the way Pages does (a missing path gets 404.html). `npm test` runs 20 tests. `SITE_BASE=/<repo>/` prefixes every root path, including the engine's `/public/` strings and the CSS `url()`, for the plain Pages URL. `.github/workflows/pages.yml` builds, checks and deploys on push to main. `docs/DEPLOY.md` has the owner steps and the DNS records. Pins: marked 18.1.2, shiki 4.6.0, pagefind 1.6.0, html-validate 11.18.0, @fontsource 5.3.x.
- **Home.** `index.html` keeps every section. The nav and footer are the shared ones (build markers). The benchmark table is a three-row teaser generated from `data/leaderboard.json`, highest F1 first (31.61, 29.02, 25.10), with "Every row, with its conditions →". The quick start ends with "The full quick start →" and "Docs". The paper block leads to /paper/. The hero buttons go to /quick-start/. The kicker reads lean 0.1.3 to match the pin. The koi engine is untouched.
- **Quick start.** Seven steps: install, first run, read the verdict, decide a component, gate a pull request, every command, next. There is a sticky step index on desktop. Every command and output is read at build time from lean's README at v0.1.3 `dbe9a32` (`content/lean/README.md`, `content/PINS.json`, `scripts/vendor.mjs`). A test checks every copyable line against that README. Code is highlighted by shiki with a theme drawn from the lock, and every command has a copy control.
- **Paper.** The title in Source Serif 4 italic, the claim, the 43-defect table, the three instruments, the lemma as a formula, soundness and reach, the limits, and a BibTeX block. Every line is sourced in a comment (the DA README at 9b4243d0 quoting the paper v3, and the abstract lines already on the home page).
- **Benchmark and Docs.** The shell, a page head and "Layout and style under review".
- **404.** "No page at /the/path." in the shell, with all five pages linked.

## Checks (all green)

- Tests: `npm test`, 20 of 20. They were seen red first (17 of 17 before any code). They cover the build from a clean copy (`npm ci --offline`), the routes, `build --check`, Pagefind, links, HTML validity, the shared nav and footer, self-hosted fonts, the quick start against the README, the home teasers, no em or en dashes in visible text, the placeholders, the 404, and SITE_BASE. The checker tests show `links.mjs` and `validate.mjs` turn red on a broken link, a missing anchor, a duplicate id and an unclosed element.
- Screenshots: `node scripts/shots.mjs` checked 12 views (6 pages at 1440 and 390) with no horizontal scroll, no clipped block, no failed request and no script error. The 404 answers 404. Shots are in `docs/shots/site-build/`; I read them back.

## Open, for the lead

1. **Paper sources.** The paper repository is not on this VM, so there is no PDF, no authors and no Figure 1. The BibTeX has no author field. I asked on the channel.
2. **Docs CLI link.** The quick start links /docs/ instead of /docs/reference/cli/ until the docs lane builds that page. Its "Every command" step carries the README table meanwhile.
3. **Preview change.** The lead's preview on 8767 serves the repository root. The raw `index.html` now holds build markers, so preview `dist/` instead (`npm run build && npm run preview`).
4. **DNS addresses.** The DNS addresses in DEPLOY.md were written without network. Check them on GitHub's page.
5. **Old checker.** `scripts/check.mjs` (the old q4 hero comparison) still targets `.nav .btn.p`, which the shared nav no longer has. I left it alone.
6. **Commit trailer.** The lane brief sets the trailer to "Claude Fable 5.1". This lane ran on Claude Opus 5.5, and BUILD-MODE says no Fable in any lane. I used the brief's line as instructed; the lead can amend it.
