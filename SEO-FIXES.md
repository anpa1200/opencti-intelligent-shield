# SEO fixes

Prepared locally on 2026-08-14. These changes are not committed, pushed, or deployed.

## Issue 4 — Docusaurus metadata

- `docs-site/docusaurus.config.js` centralizes the browser-title suffix through the site title `1200km`, keeps the existing project article cover as the default social card, enables Git-backed update times, and emits the exact site name.
- `docs-site/src/pages/index.js` gives the custom landing page a dedicated 157-character value description with matching Open Graph and Twitter metadata.
- `docs-site/src/theme/DocItem/Metadata/index.js` supplies exact title, description, social, image, and modified-time parity for the documentation route.
- `docs-site/scripts/generate-seo-descriptions.mjs` stores the reviewed, page-specific value statement grounded in the Markdown source and enforces 140–160 characters, uniqueness, and title exclusion on regeneration.
- `docs-site/src/generated/seo-descriptions.json` contains the generated documentation description.
- `docs-site/scripts/check-seo.mjs` validates every built route and fails on metadata regressions.
- `docs-site/package.json` regenerates descriptions before each build and exposes `check:seo` and `validate`.

## Issue 7 — HexStrike destination labels

- `docs-site/docusaurus.config.js` labels each `0x4m4/hexstrike-ai` navigation link as “HexStrike AI (upstream project).” No owner/fork destination occurs in this repository.

## Issue 8 — discovery and lastmod

- `.github/workflows/deploy-docs.yml` checks out full Git history so deployment builds can derive real update dates.
- `docs-site/docusaurus.config.js` enables Git-backed document dates and fills the custom landing-page sitemap date from its source-file history.

## Issue 9 — structured data

- `docs-site/src/theme/DocItem/Metadata/index.js` emits valid absolute-URL `BreadcrumbList` JSON-LD on the documentation route.
- `docs-site/src/pages/index.js` emits the landing-page `BreadcrumbList`.
- `docs-site/scripts/check-seo.mjs` parses every JSON-LD block, validates breadcrumb order and absolute URLs, and rejects missing metadata.

## Validation

- `npm run build` from `docs-site/` — passed.
- `npm run check:seo` from `docs-site/` — passed: 2 routes, 2 unique descriptions, 2/2 sitemap `lastmod` values.
- Canonical URLs remain under `https://1200km.com/opencti-intelligent-shield/`.
- Every built title contains exactly one ` | 1200km` suffix; Open Graph and Twitter titles, descriptions, and images match.
- The non-root documentation route exposes a Git-derived `article:modified_time`.
- The generated documentation description was editorially reviewed and contains no clipped source sentence or generic filler tail.
- `git diff --check` — passed.

## Deploy and human follow-ups

- Commit and deploy this repository before treating the production metadata or sitemap as updated.
- After deployment, merge the sub-site sitemap into the main sitemap index and submit it to Google Search Console and Bing Webmaster Tools.
- Request indexing for the project landing page after the production build is live.
- No `article:published_time` was invented: the documentation framework exposes reliable last-update history but not a trustworthy creation date for every source page.

## Complete touched-file manifest

- `.github/workflows/deploy-docs.yml`
- `SEO-FIXES.md`
- `docs-site/docusaurus.config.js`
- `docs-site/package.json`
- `docs-site/scripts/check-seo.mjs`
- `docs-site/scripts/generate-seo-descriptions.mjs`
- `docs-site/src/generated/seo-descriptions.json`
- `docs-site/src/pages/index.js`
- `docs-site/src/theme/DocItem/Metadata/index.js`
