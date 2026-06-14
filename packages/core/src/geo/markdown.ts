import type { Post, Author } from "../loader";
import { type SiteConfig, type RoutesConfig, postUrl } from "../schema";

/**
 * Strip MDX down to clean, portable Markdown.
 *
 * AI crawlers ingest source text far better than hydrated React DOM, so every
 * page is also served as `.md` (or via `Accept: text/markdown`). MDX is already
 * Markdown-plus-JSX, so we mostly need to drop the JSX/import machinery.
 *
 * This is a lightweight, dependency-free pass — good enough for extraction.
 * For full fidelity, compile MDX and serialize; this preserves prose, headings,
 * lists, code fences, blockquotes, links, and images.
 */
export function mdxToMarkdown(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const line of lines) {
    const fence = /^\s*```/.test(line);
    if (fence) inFence = !inFence;
    if (inFence || fence) {
      out.push(line);
      continue;
    }
    // Drop ESM import/export lines (MDX machinery).
    if (/^\s*(import|export)\s/.test(line)) continue;
    // Drop lines that are only a JSX tag (e.g. <Callout> ... </Callout>, <Image .../>).
    if (/^\s*<\/?[A-Z][\w.]*[^>]*\/?>\s*$/.test(line)) continue;
    // Strip inline JSX tags but keep their text content.
    out.push(line.replace(/<\/?[A-Za-z][\w.]*[^>]*>/g, ""));
  }

  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Full Markdown document for a single post's `.md` endpoint: a clean header,
 * the TL;DR, the body, the FAQ, and a sources list. Self-contained and citable.
 */
export function renderPostMarkdown(
  post: Post,
  author: Author | undefined,
  site: SiteConfig,
  routes: RoutesConfig,
): string {
  const fm = post.frontmatter;
  const url = postUrl(site, routes, fm.slug);
  const parts: string[] = [];

  parts.push(`# ${fm.title}`, "");
  const meta = [
    author ? `By ${author.frontmatter.name}` : `By ${fm.author}`,
    new Date(fm.publishedAt).toISOString().slice(0, 10),
    `${post.readingTimeMinutes} min read`,
  ];
  parts.push(`*${meta.join(" · ")}*`, "");
  parts.push(`Canonical: ${url}`, "");

  if (fm.summary) parts.push(`> **Summary:** ${fm.summary}`, "");

  parts.push(mdxToMarkdown(post.body), "");

  if (fm.faq.length) {
    parts.push("## FAQ", "");
    for (const f of fm.faq) parts.push(`**${f.q}**`, "", f.a, "");
  }

  if (fm.sources.length) {
    parts.push("## Sources", "");
    for (const s of fm.sources) {
      const pub = s.publisher ? ` — ${s.publisher}` : "";
      parts.push(`- [${s.title}](${s.url})${pub}`);
    }
    parts.push("");
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
