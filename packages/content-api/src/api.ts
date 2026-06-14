import {
  loadPosts, loadPost, loadAuthors, loadAuthor, renderPostMarkdown,
  buildLlmsTxt, buildLlmsFullTxt, buildRss, sitemapXml,
  postUrl, type Post, type Author, type SiteConfig, type RoutesConfig,
} from "@wisp/core";
import type { PostSummaryDTO, PostDTO, AuthorDTO, TagDTO } from "./types";

export interface ContentApiConfig {
  postsDir: string;
  authorsDir: string;
  site: SiteConfig;
  routes: RoutesConfig;
  /** Path prefix the API is mounted under, e.g. "/api". Default "". */
  basePath?: string;
  /** Expose drafts/scheduled-not-due posts. Default false. */
  includeUnpublished?: boolean;
}

/* ----------------------------------------------------- DTO mappers */

function toSummary(p: Post, c: ContentApiConfig): PostSummaryDTO {
  return {
    slug: p.slug,
    title: p.frontmatter.title,
    description: p.frontmatter.description,
    publishedAt: p.frontmatter.publishedAt,
    updatedAt: p.frontmatter.updatedAt,
    author: p.frontmatter.author,
    tags: p.frontmatter.tags,
    type: p.frontmatter.type,
    readingTimeMinutes: p.readingTimeMinutes,
    url: postUrl(c.site, c.routes, p.slug),
  };
}

function toFull(p: Post, c: ContentApiConfig): PostDTO {
  return {
    ...toSummary(p, c),
    summary: p.frontmatter.summary,
    faq: p.frontmatter.faq,
    sources: p.frontmatter.sources,
    body: p.body,
  };
}

function toAuthor(a: Author): AuthorDTO {
  return {
    id: a.frontmatter.id,
    name: a.frontmatter.name,
    bio: a.frontmatter.bio,
    avatar: a.frontmatter.avatar,
    sameAs: a.frontmatter.sameAs,
  };
}

/* --------------------------------------- typed query layer (no HTTP) */

export interface PostQuery {
  status?: "draft" | "scheduled" | "published";
  tag?: string;
  author?: string;
  limit?: number;
  offset?: number;
}

/** Build the typed query layer — import these directly for build-time/static use. */
export function createContent(c: ContentApiConfig) {
  const opts = { includeUnpublished: c.includeUnpublished ?? false };

  function getPosts(q: PostQuery = {}): { count: number; posts: PostSummaryDTO[] } {
    let posts = loadPosts(c.postsDir, opts);
    if (q.status) posts = posts.filter((p) => p.frontmatter.status === q.status);
    if (q.tag) posts = posts.filter((p) => p.frontmatter.tags.includes(q.tag!));
    if (q.author) posts = posts.filter((p) => p.frontmatter.author === q.author);
    const total = posts.length;
    const start = q.offset ?? 0;
    const end = q.limit != null ? start + q.limit : undefined;
    return { count: total, posts: posts.slice(start, end).map((p) => toSummary(p, c)) };
  }

  function getPost(slug: string): PostDTO | null {
    const p = loadPost(c.postsDir, slug, opts);
    return p ? toFull(p, c) : null;
  }

  function getPostMarkdown(slug: string): string | null {
    const p = loadPost(c.postsDir, slug, opts);
    if (!p) return null;
    return renderPostMarkdown(p, loadAuthor(c.authorsDir, p.frontmatter.author), c.site, c.routes);
  }

  function getTags(): TagDTO[] {
    const counts = new Map<string, number>();
    for (const p of loadPosts(c.postsDir, opts))
      for (const t of p.frontmatter.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  }

  function getAuthors(): AuthorDTO[] {
    return loadAuthors(c.authorsDir).map(toAuthor);
  }

  function getAuthor(id: string): AuthorDTO | null {
    const a = loadAuthor(c.authorsDir, id);
    return a ? toAuthor(a) : null;
  }

  function search(query: string, limit = 10): { count: number; hits: PostSummaryDTO[] } {
    const ql = query.toLowerCase();
    const hits = loadPosts(c.postsDir, opts)
      .filter((p) =>
        [p.frontmatter.title, p.frontmatter.description, p.frontmatter.tags.join(" "), p.body]
          .join(" ").toLowerCase().includes(ql),
      )
      .slice(0, limit)
      .map((p) => toSummary(p, c));
    return { count: hits.length, hits };
  }

  return { getPosts, getPost, getPostMarkdown, getTags, getAuthors, getAuthor, search };
}

/* ---------------------------------------------- HTTP (Web standard) */

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
  });
const text = (body: string, type: string) =>
  new Response(body, { headers: { "content-type": type, "access-control-allow-origin": "*" } });

/**
 * Framework-agnostic content API. `handle(request)` returns a Response for any
 * matched route, or a 404 Response for unmatched paths under basePath.
 *
 * Mount anywhere that speaks the Web Fetch API:
 *   Hono:  app.all("/api/*", (c) => api.handle(c.req.raw))
 *   Next:  export const GET = (req: Request) => api.handle(req)
 *   Bun:   Bun.serve({ fetch: (req) => api.handle(req) })
 */
export function createContentApi(c: ContentApiConfig) {
  const q = createContent(c);
  const base = (c.basePath ?? "").replace(/\/$/, "");

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname;
    if (base && path.startsWith(base)) path = path.slice(base.length);
    path = path.replace(/\/$/, "") || "/";
    const sp = url.searchParams;

    if (path === "/posts") {
      return json(q.getPosts({
        status: (sp.get("status") as PostQuery["status"]) ?? undefined,
        tag: sp.get("tag") ?? undefined,
        author: sp.get("author") ?? undefined,
        limit: sp.has("limit") ? Number(sp.get("limit")) : undefined,
        offset: sp.has("offset") ? Number(sp.get("offset")) : undefined,
      }));
    }

    const mdMatch = path.match(/^\/posts\/([^/]+)\.md$/);
    if (mdMatch) {
      const md = q.getPostMarkdown(mdMatch[1]!);
      return md ? text(md, "text/markdown; charset=utf-8") : json({ error: "not_found" }, 404);
    }
    const postMatch = path.match(/^\/posts\/([^/]+)$/);
    if (postMatch) {
      const post = q.getPost(postMatch[1]!);
      return post ? json(post) : json({ error: "not_found" }, 404);
    }

    if (path === "/tags") return json({ tags: q.getTags() });
    if (path === "/authors") return json({ authors: q.getAuthors() });
    const authorMatch = path.match(/^\/authors\/([^/]+)$/);
    if (authorMatch) {
      const a = q.getAuthor(authorMatch[1]!);
      return a ? json(a) : json({ error: "not_found" }, 404);
    }

    if (path === "/search") {
      const query = sp.get("q") ?? "";
      if (query.length < 2) return json({ error: "query_too_short" }, 400);
      return json(q.search(query, sp.has("limit") ? Number(sp.get("limit")) : 10));
    }

    // Convenience: serve the SEO/GEO artifacts from the same mount.
    const all = loadPosts(c.postsDir, { includeUnpublished: c.includeUnpublished ?? false });
    if (path === "/llms.txt") return text(buildLlmsTxt(all, c.site, c.routes), "text/plain; charset=utf-8");
    if (path === "/llms-full.txt") return text(buildLlmsFullTxt(all, loadAuthors(c.authorsDir), c.site, c.routes), "text/plain; charset=utf-8");
    if (path === "/feed.xml") return text(buildRss(all, c.site, c.routes), "application/rss+xml");
    if (path === "/sitemap.xml") return text(sitemapXml(all, c.site, c.routes), "application/xml");

    return json({ error: "not_found", path }, 404);
  }

  return { handle, query: q };
}
