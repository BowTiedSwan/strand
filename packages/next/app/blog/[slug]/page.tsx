import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  loadPosts, loadPost, loadAuthor, buildMetadata, postGraph, postPath, tagPath, authorPath,
} from "@strand-cms/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";
import { mdxComponents } from "@/components/mdx-components";
import StrandRail from "@/components/StrandRail";
import Grounding from "@/components/Grounding";
import Faq from "@/components/Faq";
import Sources from "@/components/Sources";

// GFM (pipe tables, strikethrough, autolinks) isn't part of base MDX — without
// this plugin, markdown tables in article bodies render as literal `|` text.
const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return loadPosts(POSTS).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  if (!post) return {};
  const meta = buildMetadata(post, site, routes);
  // Per-post 1200×630 card rendered by ./opengraph-image.tsx — opt-in via
  // site.generateOgImages. A post with no image source still publishes,
  // just without og:image / twitter:image.
  if (!meta.openGraph.images && site.generateOgImages) {
    const img = new URL(`${postPath(routes, slug)}/opengraph-image`, site.url).toString();
    meta.openGraph.images = [img];
    meta.twitter.images = [img];
  }
  return meta;
}

function fmtDate(iso: string) {
  // timeZone UTC so a bare-date updatedAt ("2026-07-27") never shifts a day.
  return new Date(iso).toLocaleDateString("en", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  if (!post) notFound();
  const fm = post.frontmatter;
  const author = loadAuthor(AUTHORS, fm.author);
  const graph = postGraph(post, author, site, routes);

  // Evenly-spaced rail nodes, one per section heading — a hint at the article's structure.
  const sectionCount = (post.body.match(/^##\s/gm) ?? []).length;
  const anchors = Array.from({ length: sectionCount }, (_, i) =>
    sectionCount > 1 ? 0.15 + (i / (sectionCount - 1)) * 0.7 : 0.5,
  );

  return (
    <main className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <header className="article__head">
        <div className="article__kicker">
          <span className="eyebrow">{fm.type === "NewsArticle" ? "News" : "Article"}</span>
          {fm.tags[0] && <Link className="tagchip" href={tagPath(routes, fm.tags[0])}>{fm.tags[0]}</Link>}
        </div>
        <h1 className="article__title">{fm.title}</h1>
        <div className="byline">
          <span>
            By{" "}
            <Link href={authorPath(routes, fm.author)}>
              <strong>{author?.frontmatter.name ?? fm.author}</strong>
            </Link>
          </span>
          <span>{fmtDate(fm.publishedAt)}</span>
          {fm.updatedAt && <span>Updated {fmtDate(fm.updatedAt)}</span>}
          <span>{post.readingTimeMinutes} min read</span>
          {fm.sources.length > 0 && <span>{fm.sources.length} sources</span>}
        </div>
      </header>

      <div className="article__body">
        <StrandRail anchors={anchors} />
        <article className="prose">
          {fm.summary && <Grounding text={fm.summary} />}
          <MDXRemote source={post.body} components={mdxComponents} options={mdxOptions} />
          <Faq items={fm.faq} />
          <Sources items={fm.sources} />
        </article>
      </div>
    </main>
  );
}
