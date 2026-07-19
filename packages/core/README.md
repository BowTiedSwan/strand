# @strand-cms/core

The core of [Strand](https://github.com/BowTiedSwan/strand), an agent-first publishing
system: the validated content schema, the MDX-in-Git loader, and the SEO/GEO generators
every Strand site emits. No database, no CMS UI — posts are MDX files with strict
frontmatter, and everything here is a pure function over them.

```bash
npm install @strand-cms/core
```

## Schema (`@strand-cms/core/schema`)

Zod schemas that define the content contract agents write against:

- `PostFrontmatter` — the post contract: slug, title, description, status
  (`draft`/`scheduled`/`published`), tags, authors, SEO fields, cited sources, FAQ,
  and AI-search targeting: `contentType` (`guide`/`comparison`/`roundup`/`news`/
  `explainer`), `primaryKeyword`, and per-article `keywords` (5–8).
- `AuthorFrontmatter` — author entities for E-E-A-T markup.
- `SiteConfig` / `RoutesConfig` — site identity and URL layout, with `postPath`,
  `postUrl`, `tagPath`, `authorPath` helpers, and the opt-in `generateOgImages`
  flag for theme-generated per-post social cards (off by default — a post with
  no image source still publishes, just without `og:image`).
- `SourcePolicy` + `checkSourcePolicy(sources, policy)` — mechanical enforcement of
  editorial sourcing rules; returns one error string per violating source.

Each schema is exported as both the Zod value and the inferred TypeScript type.

## Loader

Filesystem in, typed content out:

```ts
import { loadPosts, loadPost, loadAuthors, isLive } from "@strand-cms/core";

const posts = loadPosts("content/posts");            // live posts, newest first
const post  = loadPost("content/posts", "my-slug");  // one post, drafts included
```

- `loadPosts(dir, opts)` / `loadPost(dir, slug)` — parse + validate MDX files; each
  `Post` carries frontmatter, body, and computed reading time.
- `loadAuthors(dir)` / `loadAuthor(dir, id)` — author files.
- `isLive(frontmatter)` — published, or scheduled with a publish time in the past.
- `validateFrontmatter(data)` / `validatePostFile(path)` — field-level
  `ValidationResult`s; these back `strand validate` and the MCP `validate_post` tool.

## SEO generators

```ts
import { buildMetadata, postGraph, sitemapXml, buildRss, buildRobots } from "@strand-cms/core";
```

- `buildMetadata(post, site, routes)` — title, description, canonical, per-article
  keywords, full `robots`/`googlebot` preview directives (`max-snippet:-1,
  max-image-preview:large, max-video-preview:-1`), `ai-content-type` / `ai-topic`
  hint tags, `article:modified_time` (from `updatedAt`, falling back to
  `publishedAt`), and OpenGraph + Twitter cards as framework-agnostic `PageMetadata`.
- `articleJsonLd` / `faqJsonLd` / `breadcrumbJsonLd` / `websiteJsonLd` / `postGraph` —
  JSON-LD (`Article`/`NewsArticle`/`BlogPosting`, `FAQPage`, breadcrumbs) ready to embed.
- `sitemapXml`, `buildRss`, `buildRobots` — the classic crawl surface.

## GEO generators (AI search)

For ChatGPT / Perplexity / Claude / AI Overviews:

- `buildLlmsTxt` / `buildLlmsFullTxt` — the `llms.txt` index and full-content variant.
- `mdxToMarkdown(body)` — strip MDX to clean markdown (source text, not hydrated DOM).
- `renderPostMarkdown(post, …)` — the content-negotiated `.md` version of a post page.

All generators are deterministic over the MDX, so their output belongs in the **static
build** — emit at build time, rebuild on merge.

## Used by

[`@strand-cms/cli`](https://www.npmjs.com/package/@strand-cms/cli) (MCP server +
validation), [`@strand-cms/content-api`](https://www.npmjs.com/package/@strand-cms/content-api)
(headless JSON layer), and the default Next.js theme scaffolded by
[`create-strand`](https://www.npmjs.com/package/create-strand).

MIT.
