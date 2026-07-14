import type { Post } from "../loader";
import {
  type SiteConfig,
  type RoutesConfig,
  postUrl,
} from "../schema";

export interface PageMetadata {
  /**
   * Emitted as `{ absolute }` so a theme layout's `title.template`
   * (e.g. `%s | Site Name`) can never double-brand an article page.
   * Article titles are SEO policy, not layout decoration: if a site wants
   * a suffix, it declares `titleSuffix` in SiteConfig and gets it on every
   * post deterministically — instead of inheriting whatever template the
   * layout happens to wrap around the route.
   */
  title: { absolute: string };
  description: string;
  alternates: { canonical: string };
  robots?: { index: boolean; follow: boolean };
  openGraph: {
    type: "article";
    title: string;
    description: string;
    url: string;
    images?: string[];
    publishedTime: string;
    modifiedTime?: string;
    authors: string[];
    tags: string[];
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    site?: string;
    images?: string[];
  };
}

/**
 * Build a Next.js-compatible Metadata object for a post.
 * Drop straight into `generateMetadata` in app/blog/[slug]/page.tsx.
 */
export function buildMetadata(
  post: Post,
  site: SiteConfig,
  routes: RoutesConfig,
): PageMetadata {
  const fm = post.frontmatter;
  const url = fm.canonicalUrl ?? postUrl(site, routes, fm.slug);
  const title = site.titleSuffix ? `${fm.title}${site.titleSuffix}` : fm.title;
  const ogTitle = fm.og?.title ?? fm.title;
  const image = fm.og?.image ?? fm.featureImage?.src ?? site.defaultOgImage;
  const images = image ? [new URL(image, site.url).toString()] : undefined;

  return {
    title: { absolute: title },
    description: fm.description,
    alternates: { canonical: url },
    robots: fm.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: ogTitle,
      description: fm.description,
      url,
      images,
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt,
      authors: [fm.author],
      tags: fm.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: fm.description,
      site: site.social?.twitterHandle,
      images,
    },
  };
}
