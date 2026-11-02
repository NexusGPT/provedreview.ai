# Deploy: provedreview.ai on GitHub Pages

The site is static. `npm run build` writes `dist/`; `.github/workflows/pages.yml` builds, checks (pages, links, HTML, `npm test`) and deploys it on every push to `main`.

## Local

```bash
npm ci
npm run build        # dist/: six pages, the Pagefind index
npm run preview      # http://127.0.0.1:8769/, as Pages serves it (404.html for a missing path)
npm test             # the build from a clean copy, links, HTML validity, the quick start against lean's README
npm run shots        # headless Chromium, every page at 1440 and 390, into docs/shots/site-build/ (PW=<playwright path>)
```

The quick start reads lean's README at the pin in `content/PINS.json`. To move the pin: edit the commit and tag there, run `node scripts/vendor.mjs` (with `LEAN_GIT=<a lean clone>`), rebuild, run `npm test`.

## The repository (owner steps, once)

1. Create the repository under NexusGPT and push `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Until the domain is attached, the site lives at `https://nexusgpt.github.io/<repository>/`. Set the repository variable `SITE_BASE` to `/<repository>/` (Settings → Secrets and variables → Actions → Variables) so every path carries the prefix. Remove it once the domain is attached.

## The custom domain provedreview.ai (owner steps)

1. At the DNS provider of provedreview.ai, add:

| type | name | value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | nexusgpt.github.io |

2. Settings → Pages → Custom domain: `provedreview.ai`, save. With the Actions source, the setting holds the domain; no `CNAME` file is needed in `dist/`.
3. Verify the domain for the NexusGPT organisation (Organisation settings → Pages → Add a domain: GitHub gives one TXT record `_github-pages-challenge-nexusgpt`). This stops another account from claiming it.
4. When the certificate is issued (minutes to a day), tick **Enforce HTTPS**.
5. Delete the `SITE_BASE` variable, push once. Smoke: `curl -sI https://provedreview.ai/` answers 200, `curl -s https://provedreview.ai/quick-start/ | grep v0.1.3`.

The A and AAAA values are GitHub's published Pages addresses (docs.github.com, "Managing a custom domain for your GitHub Pages site"), written from memory on 2026-11-02 with no network. Check them on that page before entering them.
