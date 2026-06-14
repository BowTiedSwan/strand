import type { Post, Author } from "../loader";
import { type SiteConfig, type RoutesConfig, postUrl } from "../schema";
import { renderPostMarkdown } from "./markdown";

/**
 * llms.txt — a curated, link-first index of the site for LLM crawlers,
 * following the llmstxt.org convention: an H1, a blockquote summary, then
 * sectioned lists of `[title](url): note` links.
 */
export function buildLlmsTxt(
  posts: Post[],
  site: SiteConfig,
  routes: RoutesConfig,
): string {
  const live = posts.filter((p) => !p.frontmatter.noindex);
  const lines: string[] = [];

  lines.push(`# ${site.name}`, "");
  lines.push(`> ${site.description}`, "");
  lines.push(
    `This file helps AI search engines and assistants understand and cite ${site.name}. ` +
      `A clean Markdown version of any article is available by appending \`.md\` to its URL.`,
    "",
  );

  lines.push("## Articles", "");
  for (const p of live) {
    const url = postUrl(site, routes, p.slug);
    const note = p.frontmatter.summary ?? p.frontmatter.description;
    lines.push(`- [${p.frontmatter.title}](${url}): ${note}`);
  }
  lines.push("");

  const tags = [...new Set(live.flatMap((p) => p.frontmatter.tags))].sort();
  if (tags.length) {
    lines.push("## Topics", "");
    lines.push(tags.join(", "), "");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/**
 * llms-full.txt — the entire corpus as one clean Markdown document, so an
 * assistant can ingest the whole publication in a single fetch.
 */
export function buildLlmsFullTxt(
  posts: Post[],
  authors: Author[],
  site: SiteConfig,
  routes: RoutesConfig,
): string {
  const byId = new Map(authors.map((a) => [a.frontmatter.id, a]));
  const live = posts.filter((p) => !p.frontmatter.noindex);

  const head = [`# ${site.name} — full content`, "", `> ${site.description}`, ""].join("\n");
  const docs = live.map((p) =>
    renderPostMarkdown(p, byId.get(p.frontmatter.author), site, routes),
  );

  return [head, ...docs].join("\n\n---\n\n").trim() + "\n";
}
