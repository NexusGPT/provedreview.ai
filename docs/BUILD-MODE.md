# BUILD-MODE: provedreview.ai site

| row | value |
|---|---|
| build-started | 2026-10-31 10:5x (the owner's "Sign off, build from this PRD (Recommended)") |
| seed | the one-page landing of this repository (docs/CONTRACT.md, index.html), KEPT; the home page is not redesigned |
| Archetype | 3, a human-facing static site (five pages, GitHub Pages) |
| ENGINE / SOLO | ENGINE: design rounds through app-redesigner lanes, build lanes one per page, the lead judges and merges |
| Authority | the owner's standing rule 2026-10-27 "Lanes on everything, I only merge"; today 12:0x "run as much as possible on the VM and make sure you retrieve what has been achieved by it"; the architect ran in journey mode (site-journeys); no solo go was given or taken |
| Lanes + models | design lanes: app-redesigner on Opus 5.5 (bench-r1-a/b/c done; bench-r2 style and docs-r1 layout next, on the VM); build lanes: one per page (home, benchmark, quick-start, docs, paper) plus the build script and the data file as roots, Opus 5.5 on the VM; judging: the lead and the owner's render review; no Fable in any lane |
| Preview owner | the local server at http://127.0.0.1:8767/ serving this repository (owner-truth); lanes serve nothing to the owner |
| Repo git-init'd | yes (this repository, commits since 2026-10-30); the deploy repository under NexusGPT is created at the deploy row |
| Units + artifacts | units: 5 pages + the build script + the data file + the search index = 8; files one lane can own end to end: index.html (home), benchmark/, quick-start/, docs/ (shell + content), paper/, scripts/build.mjs, data/leaderboard.json, scripts/search; 8 of 8, no split needed |
| Test engine | hand-written Playwright journeys (J1, J2, J3), headless; the link checker; the leaderboard schema check |
| Contract deltas | none since the PRD sign-off; J2.4 stays "expand in place" (layout A picked) |
| Fates | reviewers and assessors: run at wave close on the integration repo (not dropped); app-taste: once after convergence |
