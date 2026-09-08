# AGENTS.md

Guidance for AI coding agents (and humans) working in this repo.

## What this is

Julio Cesar Martin's personal blog — a statically generated **Next.js 14 (App
Router) + TypeScript** site, exported to plain HTML and deployed to **GitHub
Pages** at **depre.net**. It is a personal-brand blog: SEO and shareability
matter on every page.

## Golden rules

- **`main` is protected. Never commit or push to `main` directly.** Always
  branch, push the branch, and open a PR. CI must be green before merge.
- Keep the site a pure static export — no server, no runtime env vars, no
  API routes, nothing that needs a Node server at request time.
- No secrets in the repo. Everything here is public.
- Match the existing code style; run `npm run format` and `npm run lint`
  before committing.

## Layout

| Path                           | What                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/blog/*.md`            | The posts. Filename = URL slug and **must** contain the publish date: `my-title-YYYY-MM-DD.md`. First line `# Title` is the title. No frontmatter.                                 |
| `src/app/`                     | App Router pages: `page.tsx` (home + post list), `blog/[slug]/page.tsx` (post), `layout.tsx` (shell + global metadata), `sitemap.ts`, `robots.ts`, `manifest.ts`, `not-found.tsx`. |
| `src/components/`              | React components (`Nav`, `Footer`, `SpaceBackground`, page-transition helpers).                                                                                                    |
| `src/lib/`                     | `posts.ts` (markdown discovery + metadata helpers), `markdown.ts` (remark → HTML), `site.ts` (canonical URL, author, SEO constants).                                               |
| `scripts/`                     | `generate-feeds.ts` / `generate-redirects.ts` run in `postbuild` to emit `out/feed/*.xml` and legacy-URL redirect stubs.                                                           |
| `public/`                      | Static assets, `CNAME`, `.nojekyll`, post images under `public/images/`.                                                                                                           |
| `.github/workflows/deploy.yml` | CI: lint + format:check + test + build on every PR; deploy `out/` to Pages on `main`.                                                                                              |

## Commands

```bash
npm i
npm run dev           # localhost:3000, hot reload (posts too)
npm run build         # static export to out/  (runs feeds + redirects after)
npm test              # jest — post parsing + feed generation
npm run lint          # next lint
npm run format        # prettier --write .
npm run format:check  # prettier --check .  (CI gate)
```

## Writing / editing a post

1. Add or edit a `.md` file in `content/blog/` (slug carries the date).
2. First image in the post (`![alt](/images/x.png)`) becomes its OG/Twitter
   card image — put images in `public/images/` and give them real `alt` text.
3. Optional: add `<!-- description: ... -->` anywhere in the markdown to set
   the meta description / feed summary explicitly; otherwise a first-paragraph
   heuristic is used.
4. Branch → PR. Merge to `main` triggers rebuild + redeploy.

## SEO expectations (don't regress these)

Every page ships: a unique `<title>` and meta description, canonical URL,
Open Graph + Twitter card tags, and JSON-LD (`Person` + `WebSite` site-wide,
`BlogPosting` + `BreadcrumbList` on posts, `Blog` on the home page). The build
emits `sitemap.xml` and `robots.txt`. Post pages use a real `<article>` and
the markdown's `# ` heading as the single `<h1>`; the home page's `<h1>` is
the author name. If you add a route, add it to the sitemap and give it full
metadata.
