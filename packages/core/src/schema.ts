import { z } from "zod";

/* ============================================================ Posts */

export const PostFrontmatter = z.object({
  // — Identity & SEO core —
  title: z.string().min(1).max(70),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(50).max(160),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  author: z.string(), // → content/authors/<id>.mdx
  tags: z.array(z.string()).default([]),
  canonicalUrl: z.string().url().optional(),
  featureImage: z
    .object({ src: z.string(), alt: z.string().min(1) })
    .optional(),
  og: z
    .object({ title: z.string().optional(), image: z.string().optional() })
    .optional(),
  noindex: z.boolean().default(false),

  // — Structured-data type (drives JSON-LD) —
  type: z.enum(["BlogPosting", "NewsArticle", "Article"]).default("BlogPosting"),

  // — GEO / AI-search (always emitted) —
  summary: z.string().max(280).optional(),
  faq: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .default([]),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        publisher: z.string().optional(),
      }),
    )
    .default([]),
});
export type PostFrontmatter = z.infer<typeof PostFrontmatter>;

/* ========================================================== Authors */

export const AuthorFrontmatter = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  // sameAs powers author-entity E-E-A-T markup (LinkedIn, X, ORCID, etc.)
  sameAs: z.array(z.string().url()).default([]),
});
export type AuthorFrontmatter = z.infer<typeof AuthorFrontmatter>;

/* ====================================================== Site config */

export const SiteConfig = z.object({
  name: z.string(),
  url: z.string().url(), // canonical origin, no trailing slash
  description: z.string(),
  locale: z.string().default("en"),
  defaultAuthor: z.string(),
  defaultOgImage: z.string().optional(),
  organization: z
    .object({
      name: z.string(),
      logo: z.string().optional(),
    })
    .optional(),
  social: z
    .object({
      x: z.string().optional(),
      twitterHandle: z.string().optional(), // for twitter:site, with @
    })
    .partial()
    .optional(),
});
export type SiteConfig = z.infer<typeof SiteConfig>;

/* ==================================================== Routes config */

export const RoutesConfig = z.object({
  // Use {slug}, {tag}, {author} tokens.
  post: z.string().default("/blog/{slug}"),
  tag: z.string().default("/tag/{tag}"),
  author: z.string().default("/author/{author}"),
});
export type RoutesConfig = z.infer<typeof RoutesConfig>;

/* ===================================================== URL helpers */

export function postPath(routes: RoutesConfig, slug: string): string {
  return routes.post.replace("{slug}", slug);
}
export function postUrl(site: SiteConfig, routes: RoutesConfig, slug: string): string {
  return new URL(postPath(routes, slug), site.url).toString();
}
export function tagPath(routes: RoutesConfig, tag: string): string {
  return routes.tag.replace("{tag}", tag);
}
export function authorPath(routes: RoutesConfig, author: string): string {
  return routes.author.replace("{author}", author);
}
