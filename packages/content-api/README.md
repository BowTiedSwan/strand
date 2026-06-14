# @wisp/content-api

The headless layer for Wisp. Same MDX-in-Git content as the default theme, exposed three ways:

1. **A typed query layer** — `createContent(config)` returns `getPosts`, `getPost`,
   `getTags`, `getAuthors`, `search`, etc. Import it directly in any Node/Bun frontend
   for build-time/static use, no HTTP.
2. **A framework-agnostic JSON API** — `createContentApi(config).handle(request)` takes a
   Web `Request` and returns a `Response`. Mounts unchanged in Hono, Next, or `Bun.serve`.
3. **A typed client + a static snapshot** — `createWispClient(baseUrl)` for consumers, and
   `buildSnapshot(config)` to bake the whole publication into one JSON file.

## Endpoints

```
GET /posts?status=&tag=&author=&limit=&offset=   → { count, posts[] }
GET /posts/:slug                                  → PostDTO | 404
GET /posts/:slug.md                               → text/markdown   (clean .md for AI crawlers)
GET /tags                                         → { tags: [{ tag, count }] }
GET /authors        ·  GET /authors/:id
GET /search?q=&limit=                             → { count, hits[] }
GET /llms.txt · /llms-full.txt · /feed.xml · /sitemap.xml
```

All JSON responses send `access-control-allow-origin: *` so browser frontends can read them.

## Mount it

```ts
import { createContentApi } from "@wisp/content-api";
import { site, routes, POSTS, AUTHORS } from "./lib/wisp";

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
import { createWispClient } from "@wisp/content-api";

const wisp = createWispClient("https://yoursite.com/api");
const { posts } = await wisp.posts({ tag: "geo", limit: 10 });
const post = await wisp.post("agent-first-publishing");
```

## Static snapshot

```ts
import { writeSnapshot } from "@wisp/content-api";
writeSnapshot(config, "public/content.json"); // import at build time, no server needed
```

The query layer is fully typed end to end — `PostSummaryDTO`, `PostDTO`, `AuthorDTO`,
`TagDTO`, and `Snapshot` are exported for consumers.
