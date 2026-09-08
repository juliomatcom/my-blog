# my blog

[![CI / Deploy](https://github.com/juliomatcom/my-blog/actions/workflows/deploy.yml/badge.svg)](https://github.com/juliomatcom/my-blog/actions/workflows/deploy.yml)

Statically generated personal blog. Next.js (App Router) + TypeScript, exported to plain
HTML and deployed to GitHub Pages at **depre.net**.

## Writing

Posts are markdown files in `content/blog/`. The filename is the URL slug and must contain
the publish date: `my-post-title-YYYY-MM-DD.md`. The first line (`# Title`) is the post
title. No frontmatter needed.

Add or edit a `.md` file, push to `main`, and CI rebuilds and redeploys the static site.

## Local development

- `npm i`
- `npm run dev` — dev server at http://localhost:3000 (hot reload for posts too)
- `npm run build` — production build; static site is emitted to `out/`
  (includes `feed/rss.xml`, `feed/atom.xml`, and redirect stubs for old URLs)
- `npm test` — core tests (post parsing, feed generation)
- `npm run lint` / `npm run format` — ESLint / Prettier

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`):

1. On every push/PR to `main`: `lint`, `format:check`, `test`, `build` must pass.
2. On `main` only: the `out/` directory is published to GitHub Pages.

One-time setup: repo **Settings → Pages → Source = GitHub Actions**, and point the
`depre.net` DNS at GitHub Pages (`public/CNAME` already declares the domain).

## License

Dual-licensed — see [LICENSE](LICENSE):

- **Source code** (`src/`, `scripts/`, config): MIT.
- **Blog content** (`content/`, `public/images/`): © Julio Cesar Martin, all
  rights reserved. Not licensed for reuse.
