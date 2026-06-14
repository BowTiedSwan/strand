import type { Post, Author } from "../loader";
import {
  type SiteConfig,
  type RoutesConfig,
  postUrl,
  authorPath,
} from "../schema";

type Json = Record<string, unknown>;

function abs(site: SiteConfig, path?: string): string | undefined {
  if (!path) return undefined;
  return new URL(path, site.url).toString();
}

/** Author as a schema.org Person, with sameAs for E-E-A-T entity linking. */
function personNode(
  author: Author | undefined,
  authorId: string,
  site: SiteConfig,
  routes: RoutesConfig,
): Json {
  const id = abs(site, authorPath(routes, authorId));
  if (!author) return { "@type": "Person", "@id": id, name: authorId };
  const fm = author.frontmatter;
  return {
    "@type": "Person",
    "@id": id,
    name: fm.name,
    description: fm.bio,
    image: abs(site, fm.avatar),
    sameAs: fm.sameAs.length ? fm.sameAs : undefined,
  };
}

/** The main Article / NewsArticle / BlogPosting node. */
export function articleJsonLd(
  post: Post,
  author: Author | undefined,
  site: SiteConfig,
  routes: RoutesConfig,
): Json {
  const fm = post.frontmatter;
  const url = postUrl(site, routes, fm.slug);
  const node: Json = {
    "@type": fm.type,
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: fm.title,
    description: fm.description,
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt ?? fm.publishedAt,
    author: personNode(author, fm.author, site, routes),
    keywords: fm.tags.length ? fm.tags.join(", ") : undefined,
    image: abs(site, fm.featureImage?.src ?? site.defaultOgImage),
    publisher: site.organization
      ? {
          "@type": "Organization",
          name: site.organization.name,
          logo: site.organization.logo
            ? { "@type": "ImageObject", url: abs(site, site.organization.logo) }
            : undefined,
        }
      : undefined,
    // GEO: speakable points AI/voice surfaces at the TL;DR + headline.
    speakable: fm.summary
      ? { "@type": "SpeakableSpecification", cssSelector: [".post-summary", "h1"] }
      : undefined,
    // GEO: cited sources become verifiable provenance.
    citation: fm.sources.length
      ? fm.sources.map((s) => ({
          "@type": "CreativeWork",
          name: s.title,
          url: s.url,
          publisher: s.publisher,
        }))
      : undefined,
  };
  return node;
}

/** FAQPage node from the faq[] frontmatter — frequently surfaced verbatim by AI search. */
export function faqJsonLd(post: Post, site: SiteConfig, routes: RoutesConfig): Json | undefined {
  const fm = post.frontmatter;
  if (!fm.faq.length) return undefined;
  return {
    "@type": "FAQPage",
    "@id": `${postUrl(site, routes, fm.slug)}#faq`,
    mainEntity: fm.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(post: Post, site: SiteConfig, routes: RoutesConfig): Json {
  const url = postUrl(site, routes, post.frontmatter.slug);
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: site.url },
      { "@type": "ListItem", position: 2, name: post.frontmatter.title, item: url },
    ],
  };
}

export function websiteJsonLd(site: SiteConfig): Json {
  return {
    "@type": "WebSite",
    "@id": `${site.url}#website`,
    name: site.name,
    description: site.description,
    url: site.url,
    inLanguage: site.locale,
  };
}

/**
 * Assemble the full @graph for a post page. Render inside a single
 * <script type="application/ld+json"> tag.
 */
export function postGraph(
  post: Post,
  author: Author | undefined,
  site: SiteConfig,
  routes: RoutesConfig,
): Json {
  const graph = [
    websiteJsonLd(site),
    articleJsonLd(post, author, site, routes),
    breadcrumbJsonLd(post, site, routes),
    faqJsonLd(post, site, routes),
  ].filter(Boolean);
  return { "@context": "https://schema.org", "@graph": graph };
}
