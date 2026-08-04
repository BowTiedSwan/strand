/**
 * Crawl-surface hard rules.
 *
 * Search engines (especially Bing) fetch `/robots.txt` on every hostname that
 * receives traffic. Platform-level "redirect all apex → www" rules also
 * redirect `/robots.txt`, which Bing reports as Soft 404 and can break
 * sitemap discovery ("Discovery: Sitemap").
 *
 * HARD RULE: these paths MUST return HTTP 200 with the correct body/content-type
 * on every hostname that resolves to the deployment. Host canonicalization
 * (apex ↔ www) must exempt them.
 */

export const CRAWL_SURFACE_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
  "/feed.xml",
] as const;

export type CrawlSurfacePath = (typeof CRAWL_SURFACE_PATHS)[number];

/** True when `pathname` is a crawl-surface file that must never host-redirect. */
export function isCrawlSurfacePath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return (CRAWL_SURFACE_PATHS as readonly string[]).includes(path);
}

/** Hostname of the canonical `site.url` origin (no port). */
export function canonicalHost(siteUrl: string): string {
  return new URL(siteUrl).host;
}

/**
 * Absolute redirect URL when the request host is not the canonical host.
 * Returns `null` when no redirect should happen — including crawl-surface
 * paths, which must stay on the requested host with HTTP 200.
 */
export function hostCanonicalRedirectUrl(
  siteUrl: string,
  requestHost: string,
  pathname: string,
  search = "",
): string | null {
  const canonical = canonicalHost(siteUrl).toLowerCase();
  const host = (requestHost.split(":")[0] ?? "").toLowerCase();
  if (!host || host === canonical) return null;
  if (isCrawlSurfacePath(pathname)) return null;
  return new URL(pathname + search, siteUrl).toString();
}

/**
 * Zod-friendly check: `site.url` must be an https origin with no path, query,
 * hash, or trailing slash — e.g. `https://www.example.com`.
 */
export function isCanonicalSiteUrl(url: string): boolean {
  if (url.endsWith("/")) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === "https:" &&
    parsed.pathname === "/" &&
    parsed.search === "" &&
    parsed.hash === "" &&
    !!parsed.host
  );
}

export const CANONICAL_SITE_URL_MESSAGE =
  "site.url must be an https origin with no path, query, hash, or trailing slash (e.g. https://www.example.com). Use the non-redirecting primary host; never platform-redirect /robots.txt across hosts.";
