# @wisp/next — default theme

The reference Wisp theme: a Next.js App Router publication that reads MDX from
`content/` via `@wisp/core` and ships SEO + AI-search (GEO) out of the box.

## Design

The theme's thesis is **structure made visible** — Wisp content is uniquely structured
(every post has a TL;DR, an FAQ, and cited sources), so the theme makes that structure
the design. The signature element is the **wisp rail**: a luminous line beside each
article that tracks reading progress and lights up structural anchors. Type is Fraunces
(display) + Newsreader (body) + IBM Plex Mono (metadata); the accent is a single
luminous teal used with restraint. Light/dark, keyboard focus, and reduced motion are
all handled.

## Routes

```
/                       index (post feed)
/blog/[slug]            article — summary, MDX prose, FAQ, sources, JSON-LD, wisp rail
/blog/[slug].md         clean Markdown rendering for AI crawlers
/tag/[tag]              topic collection
/author/[author]        author page (with E-E-A-T entity markup in JSON-LD)
/sitemap.xml /robots.txt /feed.xml /llms.txt /llms-full.txt
```

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run validate # check post frontmatter
npm run build
```

## Customize

Edit `app/globals.css` (all design tokens live at the top), `site.config.ts`, and
`routes.config.ts`. Add MDX components in `components/mdx-components.tsx`. Swap the
analytics snippet in `components/Analytics.tsx`. Content lives in `content/posts` and
`content/authors`.
