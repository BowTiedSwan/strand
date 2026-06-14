import type { Post } from "../loader";
import {
  type SiteConfig,
  type RoutesConfig,
  postUrl,
  tagPath,
} from "../schema";

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

/** Returns entries compatible with Next.js `app/sitemap.ts` (MetadataRoute.Sitemap). */
export function buildSitemap(
  posts: Post[],
  site: SiteConfig,
  routes: RoutesConfig,
): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { url: site.url, lastModified: new Date().toISOString(), changeFrequency: "daily", priority: 1 },
  ];
  const tags = new Set<string>();
  for (const p of posts) {
    if (p.frontmatter.noindex) continue;
    entries.push({
      url: postUrl(site, routes, p.slug),
      lastModified: p.frontmatter.updatedAt ?? p.frontmatter.publishedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    p.frontmatter.tags.forEach((t) => tags.add(t));
  }
  for (const t of tags) {
    entries.push({
      url: new URL(tagPath(routes, t), site.url).toString(),
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
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

/** robots.txt — allows crawlers (incl. AI) and advertises sitemap + llms.txt. */
export function buildRobots(site: SiteConfig): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${site.url}/sitemap.xml`,
    "",
  ].join("\n");
}
