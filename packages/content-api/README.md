# @strand/content-api

The headless layer for Strand. Same MDX-in-Git content as the default theme, exposed three ways:

1. **A typed query layer** — `createContent(config)` returns `getPosts`, `getPost`,
   `getTags`, `getAuthors`, `search`, etc. Import it directly in any Node/Bun frontend
   for build-time/static use, no HTTP.
2. **A framework-agnostic JSON API** — `createContentApi(config).handle(request)` takes a
   Web `Request` and returns a `Response`. Mounts unchanged in Hono, Next, or `Bun.serve`.
3. **A typed client + a static snapshot** — `createStrandClient(baseUrl)` for consumers, and
   `buildSnapshot(config)` to bake the whole publication into one JSON file.

## Rendering & SEO — read this before mounting the live API

Keep the **indexed surface static.** The article HTML, JSON-LD, `sitemap.xml`, `llms.txt`, and
the per-post `.md` are what Google and AI engines read — they should come from **static
generation** (the default `@strand/next` theme emits them at build, rebuilt on merge) or
server-side rendering, never client-side fetches of this API. SEO/GEO needs the content in the
server's HTML response; what breaks it is client-side-only rendering, not "a server existing."

`handle()` is a **data channel, not that indexed surface.** It returns JSON for programmatic
consumers — a separate app frontend, a mobile app, on-site search, integrations. A crawler
pointed at your site never hits it. For a static headless frontend, prefer `buildSnapshot()`
(one JSON file at build) over calling the live API from the browser.

The artifact routes below (`/llms.txt`, `/sitemap.xml`, `/posts/:slug.md`) are a convenience
for non-Next/headless hosts. If you serve them from `handle()`, **cache them** — they're
deterministic from the MDX, so a crawler sees something effectively static either way.

## Endpoints

```
GET /posts?status=&tag=&author=&limit=&offset=   → { count, posts[] }
GET /posts/:slug                                  → PostDTO | 404
GET /posts/:slug.md                               → text/markdown   (clean .md for AI ingestion — keep static/cached)
GET /tags                                         → { tags: [{ tag, count }] }
GET /authors        ·  GET /authors/:id
GET /search?q=&limit=                             → { count, hits[] }
GET /llms.txt · /llms-full.txt · /feed.xml · /sitemap.xml
```

All JSON responses send `access-control-allow-origin: *` so browser frontends can read them.

## Mount it

```ts
import { createContentApi } from "@strand/content-api";
import { site, routes, POSTS, AUTHORS } from "./lib/strand";

const api = createContentApi({ postsDir: POSTS, authorsDir: AUTHORS, site, routes, basePath: "/api" });

// Hono
app.all("/api/*", (c) => api.handle(c.req.raw));

// Next.js route handler — app/api/[...path]/route.ts
export const GET = (req: Request) => api.handle(req);

// Bun
Bun.serve({ fetch: (req) => api.handle(req) });
```

## Consume it

```ts
import { createStrandClient } from "@strand/content-api";

const strand = createStrandClient("https://yoursite.com/api");
const { posts } = await strand.posts({ tag: "geo", limit: 10 });
const post = await strand.post("agent-first-publishing");
```

## Static snapshot

```ts
import { writeSnapshot } from "@strand/content-api";
writeSnapshot(config, "public/content.json"); // import at build time, no server needed
```

The query layer is fully typed end to end — `PostSummaryDTO`, `PostDTO`, `AuthorDTO`,
`TagDTO`, and `Snapshot` are exported for consumers.
