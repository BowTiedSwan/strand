/**
 * CLIENT-SAFE. This module is pure (zod + string helpers only — no node:fs,
 * no node:path, no gray-matter). It is safe to import from `"use client"`
 * components via `@strand-cms/core/schema` (postPath, tagPath, authorPath,
 * SiteConfig, RoutesConfig, …). Keep it that way: never add a Node-only
 * import here.
 */
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

/* ==================================================== Topics policy */

/**
 * Mechanical defense against thin-tag-page sprawl.
 *
 * Every tag an agent mints auto-generates a tag/topic page. Left unchecked,
 * a programmatic publication accumulates one-post tag pages faster than
 * articles. Field data (Nuclear News Network, July 2026): 74 of ~115 tags
 * had exactly one post; the thin pages outranked the site's own explainers
 * for their queries at positions 50–90 with zero CTR, and two-thirds of
 * sitemap URLs were boilerplate lists. Prose "don't mint tags" rules drift —
 * the policy is mechanical, like SourcePolicy.
 *
 * A tag page is INDEXABLE when any of:
 *   - it appears in `pillars` (curated sections with hand-written SEO copy),
 *   - it has a `cornerstones` entry (the page routes intent to a reference
 *     article via a "Start here" link the theme renders),
 *   - it has >= `indexMinPosts` posts (a genuine archive).
 * Everything else should render `noindex,follow` and stays out of the
 * sitemap — buildSitemap applies the sitemap half automatically when
 * `site.topics` is set; themes apply the robots half via indexableTag().
 *
 * Declared but empty (`topics: {}`) still means "policy on" with defaults.
 * Omitted entirely means legacy behavior: every tag page indexed.
 */
export const TopicsPolicy = z.object({
  /** Curated section/pillar slugs — always indexable. */
  pillars: z.array(z.string()).default([]),
  /** tag slug → slug of the evergreen article that owns the tag's search intent. */
  cornerstones: z.record(z.string()).default({}),
  /** Post count at which a plain tag page graduates into a genuine archive. */
  indexMinPosts: z.number().int().min(1).default(4),
  /**
   * Known near-duplicate tags → canonical slug (null = drop the tag).
   * Duplicate tags split one topic's ranking signals across two thin pages
   * (e.g. `usa` vs `us`). checkTagPolicy() reports uses of aliased tags.
   */
  aliases: z.record(z.string().nullable()).default({}),
});
export type TopicsPolicy = z.infer<typeof TopicsPolicy>;

/* ====================================================== Site config */

export const SiteConfig = z.object({
  name: z.string(),
  // Canonical https origin only (no path/query/hash/trailing slash).
  // Must be the primary host crawlers should use — see seo/crawl-surface.ts.
  url: z
    .string()
    .url()
    .refine(
      (u) => {
        if (u.endsWith("/")) return false;
        try {
          const p = new URL(u);
          return (
            p.protocol === "https:" &&
            p.pathname === "/" &&
            p.search === "" &&
            p.hash === ""
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "site.url must be an https origin with no path, query, hash, or trailing slash (e.g. https://www.example.com)",
      },
    ),
  /**
   * Site-wide meta description / Open Graph fallback.
   * Bing SEO/GEO hard window is 25–160 chars; keep this in range.
   */
  description: z.string().min(25).max(160),
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
  /** Thin-tag-page policy (see TopicsPolicy above). Omit for legacy behavior. */
  topics: TopicsPolicy.optional(),
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

/* ============================================== Topics policy helpers */

/**
 * True when the tag's page should be indexed and sitemapped under `policy`.
 * `policy` undefined = no policy declared = legacy behavior (everything
 * indexed). Themes call this from the tag page's generateMetadata to emit
 * `noindex,follow` for tags it rejects; buildSitemap calls it to keep those
 * pages out of the sitemap (a sitemapped noindex URL is a mixed signal that
 * wastes crawl budget).
 */
export function indexableTag(
  tag: string,
  postCount: number,
  policy: TopicsPolicy | undefined,
): boolean {
  if (!policy) return true;
  return (
    policy.pillars.includes(tag) ||
    tag in policy.cornerstones ||
    postCount >= policy.indexMinPosts
  );
}

/**
 * Mechanical tag hygiene, mirror of checkSourcePolicy: one warning string
 * per non-canonical tag; empty array = clean. Call from the site's
 * validator. Report these as warnings, not errors, unless the archive has
 * been migrated — hard-failing legacy posts breaks CI on day one (learned
 * the pleasant way: the first site to adopt this had six legacy posts
 * carrying aliased tags).
 */
export function checkTagPolicy(
  tags: readonly string[] | undefined,
  policy: TopicsPolicy | undefined,
): string[] {
  if (!policy) return [];
  const warnings: string[] = [];
  for (const t of tags ?? []) {
    if (!(t in policy.aliases)) continue;
    const canonical = policy.aliases[t];
    warnings.push(
      canonical
        ? `tags: "${t}" is non-canonical — use "${canonical}" (site.topics.aliases)`
        : `tags: "${t}" is a catch-all with no canonical replacement — drop it (site.topics.aliases)`,
    );
  }
  return warnings;
}
