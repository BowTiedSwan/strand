# Wiring `@wisp/core` into Next.js (App Router)

`@wisp/core` is framework-agnostic — it reads MDX and returns data + strings.
These are the thin App Router files that turn it into a running site. Assumes
`content/posts` and `content/authors` at the repo root and a `site.config.ts` /
`routes.config.ts` exporting parsed `SiteConfig` / `RoutesConfig`.

Verified: the package typechecks (`tsc --noEmit`) and the loader + every generator
run against real MDX (see the smoke test in the build notes).

## Shared config — `lib/wisp.ts`

```ts
import { SiteConfig, RoutesConfig } from "@wisp/core";
import { join } from "node:path";

export const site = SiteConfig.parse((await import("@/site.config")).default);
export const routes = RoutesConfig.parse((await import("@/routes.config")).default);
export const POSTS = join(process.cwd(), "content/posts");
export const AUTHORS = join(process.cwd(), "content/authors");
```

## `app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { loadPosts, buildSitemap } from "@wisp/core";
import { POSTS, site, routes } from "@/lib/wisp";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(loadPosts(POSTS), site, routes).map((e) => ({
    url: e.url,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
```

## `app/robots.ts`

```ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/wisp";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
```

## `app/feed.xml/route.ts`

```ts
import { loadPosts, buildRss } from "@wisp/core";
import { POSTS, site, routes } from "@/lib/wisp";

export function GET() {
  const xml = buildRss(loadPosts(POSTS), site, routes);
  return new Response(xml, { headers: { "content-type": "application/rss+xml" } });
}
```

## `app/llms.txt/route.ts` (and `llms-full.txt`)

```ts
import { loadPosts, loadAuthors, buildLlmsTxt, buildLlmsFullTxt } from "@wisp/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/wisp";

export function GET() {
  const body = buildLlmsTxt(loadPosts(POSTS), site, routes);
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
// app/llms-full.txt/route.ts → buildLlmsFullTxt(loadPosts(POSTS), loadAuthors(AUTHORS), site, routes)
```

## The article page — `app/blog/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { loadPost, loadAuthor, buildMetadata, postGraph } from "@wisp/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/wisp";
// import your MDX renderer (next-mdx-remote / @next/mdx) for post.body

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = loadPost(POSTS, params.slug, {});
  return post ? buildMetadata(post, site, routes) : {};
}

export default function Page({ params }: { params: { slug: string } }) {
  const post = loadPost(POSTS, params.slug, {});
  if (!post) notFound();
  const author = loadAuthor(AUTHORS, post.frontmatter.author);
  const graph = postGraph(post, author, site, routes);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <h1>{post.frontmatter.title}</h1>
      {post.frontmatter.summary && (
        <p className="post-summary">{post.frontmatter.summary}</p>
      )}
      {/* <MDX source={post.body} /> */}
    </article>
  );
}
```

## The content-negotiated `.md` endpoint — `app/blog/[slug].md/route.ts`

```ts
import { loadPost, loadAuthor, renderPostMarkdown } from "@wisp/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/wisp";

export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = loadPost(POSTS, params.slug, {});
  if (!post) return new Response("Not found", { status: 404 });
  const author = loadAuthor(AUTHORS, post.frontmatter.author);
  const md = renderPostMarkdown(post, author, site, routes);
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
```

(For true `Accept: text/markdown` content negotiation on the same URL, do the
same check in middleware and rewrite to this handler when the header is present.)

## Headless mode

Skip the page components. Ship `lib/wisp.ts` + `loadPosts`/`loadPost` as a typed
content package, or expose a JSON route (`app/api/posts/route.ts` returning
`loadPosts(POSTS)`) for an external React/Astro frontend to consume.
