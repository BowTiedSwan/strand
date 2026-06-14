import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  loadPosts, loadPost, loadAuthor, buildMetadata, postGraph, tagPath, authorPath,
} from "@wisp/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/wisp";
import { mdxComponents } from "@/components/mdx-components";
import WispRail from "@/components/WispRail";
import Summary from "@/components/Summary";
import Faq from "@/components/Faq";
import Sources from "@/components/Sources";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return loadPosts(POSTS).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  return post ? buildMetadata(post, site, routes) : {};
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
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
          <span>{post.readingTimeMinutes} min read</span>
          {fm.sources.length > 0 && <span>{fm.sources.length} sources</span>}
        </div>
      </header>

      {fm.summary && <Summary text={fm.summary} />}

      <div className="article__body">
        <WispRail anchors={anchors} />
        <article className="prose">
          <MDXRemote source={post.body} components={mdxComponents} />
          <Faq items={fm.faq} />
          <Sources items={fm.sources} />
        </article>
      </div>
    </main>
  );
}
