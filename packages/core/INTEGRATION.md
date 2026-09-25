# Wiring `@strand-cms/core` into Next.js (App Router)

`@strand-cms/core` is framework-agnostic — it reads MDX and returns data + strings.
These are the thin App Router files that turn it into a running site. Assumes
`content/posts` and `content/authors` at the repo root and a `site.config.ts` /
`routes.config.ts` exporting parsed `SiteConfig` / `RoutesConfig`.

Verified: the package typechecks (`tsc --noEmit`) and the loader + every generator
run against real MDX (see the smoke test in the build notes).

## Client vs server — never import the barrel from `"use client"`

`@strand-cms/core` (the barrel) re-exports `./loader`, which uses `node:fs` /
`node:path` / `gray-matter`. A `"use client"` component that imports it forces
Turbopack to bundle `node:fs` for the browser and the app fails at runtime.

- Client-safe: `@strand-cms/core/schema` (`postPath`, `tagPath`, `authorPath`,
  `SiteConfig`, `RoutesConfig` — pure `zod`, no `fs`).
- Server-only: the barrel and `@strand-cms/core/server` (`loadPosts`,
  `loadPost`, `loadAuthors`, `validatePostFile`).
- Pattern: build `{ href, label }` link lists in a Server Component (e.g.
  `app/layout.tsx`) and pass them as props into client nav components, which
  should only use `next/link` + local state.

## Shared config — `lib/strand.ts`

```ts
import { SiteConfig, RoutesConfig } from "@strand-cms/core";
import { join } from "node:path";

export const site = SiteConfig.parse((await import("@/site.config")).default);
export const routes = RoutesConfig.parse((await import("@/routes.config")).default);
export const POSTS = join(process.cwd(), "content/posts");
export const AUTHORS = join(process.cwd(), "content/authors");
```

## `app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { loadPosts, buildSitemap } from "@strand-cms/core";
import { POSTS, site, routes } from "@/lib/strand";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(loadPosts(POSTS), site, routes).map((e) => ({
    url: e.url,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
```

## Topics policy — stopping thin tag-page sprawl (v0.3.0)

Every tag mints a `/tag/` page, and on an agent-written site tags multiply
faster than articles (field data: 74 of ~115 tags with exactly one post after
two months; the thin pages intercepted explainer-intent queries at positions
50–90 with zero CTR). Declare a policy in `site.config.ts`:

```ts
const config = {
  // ...
  topics: {
    pillars: ["news", "guides"],               // curated sections: always indexed
    cornerstones: {                            // tag → the article that owns its intent
      natrium: "natrium-reactor-explained",
    },
    indexMinPosts: 4,                          // plain tags graduate at 4 posts
    aliases: { usa: "us", nuclear: null },     // duplicate tags → canonical (null = drop)
  },
} satisfies Partial<SiteConfig>;
```

With `site.topics` set, `buildSitemap` automatically drops non-qualifying tag
URLs. Wire the matching robots signal in the tag page (the shipped template
does this):

```ts
import { indexableTag } from "@strand-cms/core";

// in generateMetadata:
const count = loadPosts(POSTS).filter((p) => p.frontmatter.tags.includes(tag)).length;
robots: indexableTag(tag, count, site.topics) ? undefined : { index: false, follow: true },
```

Render the cornerstone as a "Start here" link at the top of the tag page
(`site.topics?.cornerstones?.[tag]`), and call `checkTagPolicy(fm.tags,
site.topics)` from your validator — report the results as warnings until the
archive's aliased tags are migrated, then promote to errors. Omit `site.topics`
entirely to keep the legacy index-every-tag behavior.

## `app/robots.ts`

```ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/strand";

export default function robots(): MetadataRoute.Robots {
  // Prefer robotsMetadata(site) from @strand-cms/core so sitemap URL stays in sync.
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
```


## HARD RULE — crawl surface must not host-redirect

`/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, and `/feed.xml` must
return **HTTP 200** with the correct content-type on **every hostname** that
resolves to the deployment (apex and `www`).

Do **not** enable a platform "Redirect all traffic to Primary Domain" toggle
(Vercel Domains → Redirect to www/apex). That 308s `/robots.txt` on the non-
primary host. Bing reports that as **Soft 404** (often with Discovery: Sitemap)
and historically does not follow `robots.txt` redirects the way it follows page
redirects.

Canonicalize hosts in Next.js `proxy.ts` instead, exempting crawl-surface paths
via `hostCanonicalRedirectUrl` / `isCrawlSurfacePath` from `@strand-cms/core`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { hostCanonicalRedirectUrl } from "@strand-cms/core";
import { site } from "@/lib/strand";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const redirectTo = hostCanonicalRedirectUrl(
    site.url,
    host,
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (redirectTo) return NextResponse.redirect(redirectTo, 308);
  return NextResponse.next();
}
```

`site.url` must be the canonical https origin (no trailing slash), matching the
host you verify in Search Console / Bing Webmaster Tools.

## `app/feed.xml/route.ts`

```ts
import { loadPosts, buildRss } from "@strand-cms/core";
import { POSTS, site, routes } from "@/lib/strand";

export function GET() {
  const xml = buildRss(loadPosts(POSTS), site, routes);
  return new Response(xml, { headers: { "content-type": "application/rss+xml" } });
}
```

## `app/llms.txt/route.ts` (and `llms-full.txt`)

```ts
import { loadPosts, loadAuthors, buildLlmsTxt, buildLlmsFullTxt } from "@strand-cms/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";

export function GET() {
  const body = buildLlmsTxt(loadPosts(POSTS), site, routes);
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
// app/llms-full.txt/route.ts → buildLlmsFullTxt(loadPosts(POSTS), loadAuthors(AUTHORS), site, routes)
```

## The article page — `app/blog/[slug]/page.tsx`

Wire `next-mdx-remote` with **`remark-gfm`**. Base MDX does not parse GitHub-flavored
pipe tables; without the plugin they render as literal `|` text (see `@strand-cms/next`
and the NNN theme for the same fix).

```tsx
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { loadPost, loadAuthor, buildMetadata, postGraph } from "@strand-cms/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";
import { mdxComponents } from "@/components/mdx-components";

const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = loadPost(POSTS, params.slug, {});
  return post ? buildMetadata(post, site, routes) : {};
}

// For site/layout/tag metadata that is not a post, clamp with metaDescription()
// so Bing's 25–160 SEO/GEO window is never exceeded:
//   import { metaDescription } from "@strand-cms/core";
//   description: metaDescription(site.description)

export default function Page({ params }: { params: { slug: string } }) {
  const post = loadPost(POSTS, params.slug, {});
  if (!post) notFound();
  const author = loadAuthor(AUTHORS, post.frontmatter.author);
  const graph = postGraph(post, author, site, routes);

  return (
    <article className="prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <h1>{post.frontmatter.title}</h1>
      {post.frontmatter.summary && (
        <p className="grounding">{post.frontmatter.summary}</p>
      )}
      <MDXRemote source={post.body} components={mdxComponents} options={mdxOptions} />
    </article>
  );
}
```

## The content-negotiated `.md` endpoint

Use an internal route handler at `app/blog-md/[slug]/route.ts`, then rewrite the
public crawl URL `/blog/<slug>.md` to that handler.

Do not use `app/blog/[slug].md/route.ts`: Next's App Router type generation and
runtime matching treat suffixed dynamic segments inconsistently. The separate
`blog-md` route avoids colliding with `app/blog/[slug]/page.tsx` and keeps the
public `.md` URL stable through the rewrite.

```js
// next.config.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: { root },
  async rewrites() {
    return [{ source: "/blog/:slug.md", destination: "/blog-md/:slug" }];
  },
};
export default nextConfig;
```

```ts
import type { NextRequest } from "next/server";
import { loadPost, loadAuthor, loadPosts, renderPostMarkdown } from "@strand-cms/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";

export const dynamic = "force-static";

export function generateStaticParams() {
  return loadPosts(POSTS).map((post) => ({ slug: post.slug }));
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug?: string }> },
) {
  const { slug } = (await ctx.params) ?? {};

  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const post = loadPost(POSTS, slug, {});
  if (!post) return new Response("Not found", { status: 404 });
  const author = loadAuthor(AUTHORS, post.frontmatter.author);
  const md = renderPostMarkdown(post, author, site, routes);
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
```

(For true `Accept: text/markdown` content negotiation on the same URL, do the
same check in middleware and rewrite to this handler when the header is present.)

## Headless mode

Skip the page components. Ship `lib/strand.ts` + `loadPosts`/`loadPost` as a typed
content package, or expose a JSON route (`app/api/posts/route.ts` returning
`loadPosts(POSTS)`) for an external React/Astro frontend to consume.
