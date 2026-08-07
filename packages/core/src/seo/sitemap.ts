import type { Post } from "../loader";
import {
  type SiteConfig,
  type RoutesConfig,
  postUrl,
  tagPath,
  indexableTag,
} from "../schema";
import { isCrawlSurfacePath } from "./crawl-surface";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ----------------------------------------------------------- sitemap */

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
}

/**
 * Percent-encode "&" in sitemap URLs. Next.js serializes
 * `MetadataRoute.Sitemap` to XML WITHOUT escaping <loc>, so one raw "&"
 * in any URL invalidates the whole sitemap for Google's strict parser.
 * %26 is the same URL, valid in both the XML and the raw-string path
 * (sitemapXml's esc() finds no "&" left to double-escape).
 */
const xmlSafeUrl = (url: string): string => url.replace(/&/g, "%26");

/** Returns entries compatible with Next.js `app/sitemap.ts` (MetadataRoute.Sitemap). */
export function buildSitemap(
  posts: Post[],
  site: SiteConfig,
  routes: RoutesConfig,
): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { url: site.url, lastModified: new Date().toISOString(), changeFrequency: "daily", priority: 1 },
  ];
  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    if (p.frontmatter.noindex) continue;
    entries.push({
      url: xmlSafeUrl(postUrl(site, routes, p.slug)),
      lastModified: p.frontmatter.updatedAt ?? p.frontmatter.publishedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    p.frontmatter.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
  }
  for (const [t, count] of tagCounts) {
    // Topics policy: tag pages the theme renders noindex must not be
    // sitemapped (mixed signal, wasted crawl budget). No site.topics
    // declared → indexableTag passes everything → legacy behavior.
    if (!indexableTag(t, count, site.topics)) continue;
    entries.push({
      url: xmlSafeUrl(new URL(tagPath(routes, t), site.url).toString()),
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }
  for (const e of entries) {
    // Soft 404 / sitemap pollution: never list robots.txt, feeds, etc.
    if (isCrawlSurfacePath(new URL(e.url).pathname)) {
      throw new Error(
        `Sitemap must not include crawl-surface URL: ${e.url}. See CRAWL_SURFACE_PATHS.`,
      );
    }
  }
  return entries;
}

/** Same data as raw XML, for non-Next hosts. */
export function sitemapXml(posts: Post[], site: SiteConfig, routes: RoutesConfig): string {
  const urls = buildSitemap(posts, site, routes)
    .map(
      (e) =>
        `  <url><loc>${esc(e.url)}</loc><lastmod>${esc(e.lastModified)}</lastmod></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/* --------------------------------------------------------------- RSS */

export function buildRss(posts: Post[], site: SiteConfig, routes: RoutesConfig): string {
  const items = posts
    .filter((p) => !p.frontmatter.noindex)
    .slice(0, 50)
    .map((p) => {
      const url = postUrl(site, routes, p.slug);
      return [
        "    <item>",
        `      <title>${esc(p.frontmatter.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <pubDate>${new Date(p.frontmatter.publishedAt).toUTCString()}</pubDate>`,
        `      <description>${esc(p.frontmatter.description)}</description>`,
        ...p.frontmatter.tags.map((t) => `      <category>${esc(t)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${esc(site.name)}</title>`,
    `    <link>${esc(site.url)}</link>`,
    `    <description>${esc(site.description)}</description>`,
    `    <language>${esc(site.locale)}</language>`,
    `    <atom:link href="${esc(site.url)}/feed.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/* ------------------------------------------------------------ robots */

/**
 * robots.txt — allows crawlers (incl. AI) and advertises the XML sitemap.
 * Keep this plain text, short, and identical on every hostname. Never host-
 * redirect `/robots.txt` (Bing Soft 404).
 */
export function buildRobots(site: SiteConfig): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${site.url}/sitemap.xml`,
    `# GEO: ${site.url}/llms.txt`,
    "",
  ].join("\n");
}

/** Shape for Next.js `app/robots.ts` (`MetadataRoute.Robots`). */
export function robotsMetadata(site: SiteConfig): {
  rules: Array<{ userAgent: string; allow: string }>;
  sitemap: string;
} {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
