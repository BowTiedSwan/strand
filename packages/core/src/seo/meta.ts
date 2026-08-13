import type { Post } from "../loader";
import {
  type SiteConfig,
  type RoutesConfig,
  postUrl,
} from "../schema";
import { metaDescription } from "./description";

/**
 * Crawler directives emitted on every article route (head-tag audit,
 * 2026-07-19): allow full snippets, large image previews, and unlimited
 * video previews so AI search engines and Google can quote the article
 * at length instead of truncating it.
 */
export interface RobotsDirectives {
  index: boolean;
  follow: boolean;
  "max-snippet"?: number;
  "max-image-preview"?: "none" | "standard" | "large";
  "max-video-preview"?: number;
}

const FULL_PREVIEW: RobotsDirectives = {
  index: true,
  follow: true,
  "max-snippet": -1,
  "max-image-preview": "large",
  "max-video-preview": -1,
};

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
  /** Per-article keywords from frontmatter — overrides any site-generic list. */
  keywords?: string[];
  alternates: { canonical: string };
  /** `googleBot` mirrors the directives so <meta name="googlebot"> is emitted too. */
  robots: RobotsDirectives & { googleBot?: RobotsDirectives };
  /**
   * AI-search hint tags: `ai-content-type` (guide | comparison | roundup |
   * news | explainer) and `ai-topic` (lowercase primary keyword).
   */
  other?: Record<string, string>;
  openGraph: {
    type: "article";
    title: string;
    description: string;
    url: string;
    images?: string[];
    publishedTime: string;
    /** Always emitted: `updatedAt` when set, else `publishedAt`. */
    modifiedTime: string;
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

  const ai: Record<string, string> = {};
  if (fm.contentType) ai["ai-content-type"] = fm.contentType;
  if (fm.primaryKeyword) ai["ai-topic"] = fm.primaryKeyword.toLowerCase();
  // Runtime safety net: schema already enforces 50–160 on authored posts,
  // but clamp before emit so themes never ship an overlong SERP snippet.
  const description = metaDescription(fm.description);

  return {
    title: { absolute: title },
    description,
    keywords: fm.keywords,
    alternates: { canonical: url },
    robots: fm.noindex
      ? { index: false, follow: false }
      : { ...FULL_PREVIEW, googleBot: { ...FULL_PREVIEW } },
    other: Object.keys(ai).length > 0 ? ai : undefined,
    openGraph: {
      type: "article",
      title: ogTitle,
      description,
      url,
      images,
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt ?? fm.publishedAt,
      authors: [fm.author],
      tags: fm.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      site: site.social?.twitterHandle,
      images,
    },
  };
}
