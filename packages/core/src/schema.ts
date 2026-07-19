import { z } from "zod";

/* ============================================================ Posts */

export const PostFrontmatter = z.object({
  // — Identity & SEO core —
  title: z.string().min(1).max(70),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(50).max(160),
  publishedAt: z.string().datetime(),
  // Accepts a full ISO datetime or a bare date (e.g. "2026-07-27").
  // Drives <meta property="article:modified_time"> and the visible "Updated" date.
  updatedAt: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
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

  // — AI-search targeting (head-tag audit, 2026-07-19) —
  /** Article shape hint for AI engines → <meta name="ai-content-type">. */
  contentType: z
    .enum(["guide", "comparison", "roundup", "news", "explainer"])
    .optional(),
  /** Primary keyword, lowercased on emit → <meta name="ai-topic">. */
  primaryKeyword: z.string().min(1).optional(),
  /** Per-article meta keywords; 5–8 when present. */
  keywords: z.array(z.string().min(1)).min(5).max(8).optional(),
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
  /**
   * Optional suffix appended to every post <title> (e.g. " | Acme News").
   * Off by default: buildMetadata emits titles as `{ absolute }`, so no
   * layout `title.template` can double-brand an article. Opt in here if
   * the publication's SEO policy wants the suffix.
   */
  titleSuffix: z.string().optional(),
  defaultAuthor: z.string(),
  defaultOgImage: z.string().optional(),
  /**
   * Opt-in: reference the theme's generated per-post 1200×630 social card
   * when a post has no explicit image. Off by default — a post with no
   * image source still publishes, just without og:image / twitter:image.
   */
  generateOgImages: z.boolean().default(false),
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
  // Encode: a raw "&" or space in a tag would otherwise flow into hrefs
  // and sitemap <loc> values and break strict XML parsers (Google).
  return routes.tag.replace("{tag}", encodeURIComponent(tag));
}
export function authorPath(routes: RoutesConfig, author: string): string {
  return routes.author.replace("{author}", author);
}

/* ==================================================== Source policy */

/**
 * Mechanical enforcement of editorial sourcing rules.
 *
 * Prose rules in agent briefs drift — an agent will eventually cite a
 * social post as a source no matter what the brief says. A source policy
 * turns the rule into a validation error at the schema gate, which is the
 * only place the rule reliably holds. Sites declare policies per content
 * type (or per anything) and call checkSourcePolicy from their validator.
 *
 * Example (a news site where X posts are citable only in social-velocity
 * coverage):
 *
 *   const NEWS_POLICY = { denyDomains: ["x.com", "twitter.com"] };
 *   if (contentType !== "PULSE")
 *     errors.push(...checkSourcePolicy(fm.sources, NEWS_POLICY));
 */
export const SourcePolicy = z.object({
  /** If set, every source hostname must match one of these domains. */
  allowDomains: z.array(z.string()).optional(),
  /** Source hostnames matching any of these domains are rejected. */
  denyDomains: z.array(z.string()).optional(),
});
export type SourcePolicy = z.infer<typeof SourcePolicy>;

const domainMatches = (host: string, domain: string): boolean =>
  host === domain || host.endsWith("." + domain);

/** Returns one error string per violating source; empty array = clean. */
export function checkSourcePolicy(
  sources: ReadonlyArray<{ url: string }> | undefined,
  policy: SourcePolicy,
): string[] {
  const errors: string[] = [];
  for (const s of sources ?? []) {
    let host: string;
    try {
      host = new URL(s.url).hostname.replace(/^www\./, "");
    } catch {
      continue; // malformed URLs are the frontmatter schema's problem
    }
    if (policy.denyDomains?.some((d) => domainMatches(host, d))) {
      errors.push(
        `sources: ${s.url} — ${host} is on this content type's deny list; cite the primary document or trade coverage`,
      );
    }
    if (policy.allowDomains?.length && !policy.allowDomains.some((d) => domainMatches(host, d))) {
      errors.push(`sources: ${s.url} — ${host} is not on this content type's allow list`);
    }
  }
  return errors;
}
