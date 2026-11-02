# Deploy: GitHub Pages for provedreview.ai

The site is static files built by `npm run build` into `dist/` (the PRD's technology choices). GitHub Actions builds and deploys on every push to `main` (`.github/workflows/pages.yml`: checkout, Node 24, `npm ci`, `npm run build`, `npm test`, upload `dist/`, deploy to Pages).

## One-time setup (owner steps)

1. Create the repository under the NexusGPT organisation (for example `NexusGPT/provedreview-site`), push this repository's `main` to it. The site's links point to `github.com/NexusGPT/differential-attestation`: flip that repository to public before launch (owner card, 2026-10-31: "Make the DA repository public before launch (Recommended)").
2. In the repository settings, Pages: Source = GitHub Actions. The first push to `main` runs the workflow; the Pages URL is `https://nexusgpt.github.io/<repo>/` until the custom domain is set.
3. Custom domain: in Pages settings enter `provedreview.ai`, tick "Enforce HTTPS" once the certificate is issued. A `CNAME` file holding `provedreview.ai` is written into `dist/` by the build so the setting survives deploys.

## DNS records to set at the registrar (source: GitHub Docs, "Managing a custom domain for your GitHub Pages site")

| Host | Type | Value |
|---|---|---|
| `@` (apex) | A | 185.199.108.153 |
| `@` | A | 185.199.109.153 |
| `@` | A | 185.199.110.153 |
| `@` | A | 185.199.111.153 |
| `@` | AAAA | 2606:50c0:8000::153 |
| `@` | AAAA | 2606:50c0:8001::153 |
| `@` | AAAA | 2606:50c0:8002::153 |
| `@` | AAAA | 2606:50c0:8003::153 |
| `www` | CNAME | `nexusgpt.github.io` |

Verify after propagation: `dig provedreview.ai +noall +answer` lists the four A records; `curl -sI https://provedreview.ai | head -1` answers 200 once "Enforce HTTPS" is on.

## Rollback

Pages serves the last successful deployment; a bad build fails the workflow and leaves the previous site up. To roll back a deployed change, revert the commit on `main` and push.
