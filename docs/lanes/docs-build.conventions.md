# Docs pages: how a page is written (lane docs-build)

One page is one Markdown file, `content/docs/<section>/<slug>.md`. The slug is the file name and the URL: `/docs/<section>/<slug>/`.

## Front matter (all four keys required)

```
---
title: Verdicts
order: 2
lede: One sentence under the title. It is also the page's search snippet and the landing line.
sources: lean:README.md, lean:docs/how-it-works.md
---
```

- `order` is the page's place in its section (1, 2, 3 …), unique in the section.
- `sources` lists the vendored files the page is written from, as `<repo>:<path>`: `lean:` is lean at v0.1.3 (`content/lean/`), `da:` is differential attestation at 25b7ab2 (`content/da/`). Only files listed in `content/PINS.json` count. The first source is the one the page's `src` line names.
- No H1 in the body. Start with prose or an H2.

## Body

- H2 (`##`) for the page's parts, H3 (`###`) under them. A page with 3 or more H2s gets the right-hand contents. Heading anchors are the heading lower-cased, backticks dropped, every other run of non-alphanumerics one hyphen: `## Lane A: proofs` → `#lane-a-proofs`; an id that would start with a digit gets an `n` in front (`## 8. A component` → `#n8-a-component`).
- Fenced code with one of: `bash` (a command the reader copies; it gets the copy button), `ts`, `tsx`, `js`, `json`, `python` (source), `text` (what a run prints: an output block). **Every non-blank line of every code block must be verbatim in one of the page's `sources`** (substring of one source line, leading spaces aside). Copy commands and outputs; never write, shorten inside a line, or join lines. Dropping whole lines is fine. `node scripts/docs-sources.mjs` checks this and names each miss.
- A note: a blockquote that starts `**Note.**`, e.g. `> **Note.** A newer lean can word a line differently.`
- Inline code that is exactly a verdict (`WITNESS`, `PASS-proved`, `PASS-decided`, `PASS-bounded`, `ASK`, `REFUSE`, `NEW`, `PASS`, `IN-SCOPE`, and `ASK:<reason>`) is coloured by the build.
- Tables: GitHub Markdown tables.
- Links between docs pages: absolute, `/docs/<section>/<slug>/` or `/docs/<section>/<slug>/#anchor`. Links to a source file: `https://github.com/NexusGPT/lean/blob/v0.1.3/<path>` or `https://github.com/NexusGPT/differential-attestation/blob/25b7ab20c945270c28251d48851e6d844565fc56/<path>`. Other site pages: `/quick-start/`, `/benchmark/`, `/paper/`.

## Voice (the owner's rules)

- Short declaratives. One fact per sentence where it reads well. Present tense.
- No litotes ("not unlike", "not bad", "no small"). No marketing adjectives. No useless prose: no "In this page we will", no summary paragraph at the end.
- No em dash and no en dash anywhere, code blocks included (`–` `—`). Use a colon, a comma, a full stop or parentheses. Ranges: "R1 to R11".
- Every claim comes from a source file. A claim you cannot source is left out. Numbers are copied exactly with their qualifier ("40 of 43", "mean of three rounds").
- lean is lower case. DA is "differential attestation" or "DA".

## The six sections and their pages

| section | pages (slug: title) |
|---|---|
| getting-started | install: Install · first-run: First run · certificate: Read the certificate |
| lean | how-it-works: How it works · verdicts: Verdicts · writing-provable-code: Writing provable code · known-values: Known values · pull-requests: Pull requests and CI · front-end: Front end · editor-and-agents: Editor and agents · around-lean: Around lean · limits: Limits and refusals · assurance: Assurance |
| differential-attestation | method: The method · run-record: Run record · predicate-registry: Predicate registry · preview: Preview · pixel-diff-lane: Pixel-diff lane · producer-tools: Producer tools · sandbox-allow-list: Sandbox allow-list · assurance-case: Assurance case · ocr-advice: OCR advice · benchmark-funnel: Benchmark funnel |
| benchmark | da-bench: DA-Bench · run-and-score: Run and score · project-benchmark: The four lanes |
| reference | cli: CLI · record: Record shape · environment: Environment variables · exit-codes: Exit codes |
| faq | faq: FAQ |

Link targets in that table exist; link to them freely.
