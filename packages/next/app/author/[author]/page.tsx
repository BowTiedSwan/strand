import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPosts, loadAuthors, loadAuthor, postPath, metaDescription } from "@strand-cms/core";
import { POSTS, AUTHORS, routes, site } from "@/lib/strand";

export function generateStaticParams() {
  return loadAuthors(AUTHORS).map((a) => ({ author: a.frontmatter.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ author: string }> }): Promise<Metadata> {
  const { author } = await params;
  const a = loadAuthor(AUTHORS, author);
  if (!a) return {};
  const url = new URL(`/author/${encodeURIComponent(author)}`, site.url).href;
  return {
    title: a.frontmatter.name,
    description: metaDescription(
      a.frontmatter.bio ?? `Articles by ${a.frontmatter.name} on ${site.name}.`,
    ),
    alternates: { canonical: url },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ author: string }> }) {
  const { author } = await params;
  const a = loadAuthor(AUTHORS, author);
  if (!a) notFound();
  const posts = loadPosts(POSTS).filter((p) => p.frontmatter.author === author);
  return (
    <main>
      <div className="collection__head">
        <p className="eyebrow">Author</p>
        <h1 className="collection__title">{a.frontmatter.name}</h1>
        {a.frontmatter.bio && <p className="entry__dek">{a.frontmatter.bio}</p>}
      </div>
      <ul className="feed">
        {posts.map((p) => (
          <li key={p.slug} className="entry">
            <time className="entry__date" dateTime={p.frontmatter.publishedAt}>
              {new Date(p.frontmatter.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </time>
            <div>
              <h2 className="entry__title"><Link href={postPath(routes, p.slug)}>{p.frontmatter.title}</Link></h2>
              <p className="entry__dek">{p.frontmatter.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
