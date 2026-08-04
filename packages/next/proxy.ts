import { NextRequest, NextResponse } from "next/server";
import { hostCanonicalRedirectUrl } from "@strand-cms/core";
import { site } from "@/lib/strand";

/**
 * HARD RULE: never host-redirect crawl-surface paths (/robots.txt, /sitemap.xml,
 * /llms.txt, /llms-full.txt, /feed.xml). Platform "redirect to primary domain"
 * toggles Soft-404 Bing on /robots.txt — canonicalize hosts here instead.
 */
export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/blog\/([^/]+)\.md$/);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/blog-md/${match[1]}`;
    return NextResponse.rewrite(url);
  }

  const redirectTo = hostCanonicalRedirectUrl(
    site.url,
    request.headers.get("host") ?? "",
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (redirectTo) return NextResponse.redirect(redirectTo, 308);

  return NextResponse.next();
}
