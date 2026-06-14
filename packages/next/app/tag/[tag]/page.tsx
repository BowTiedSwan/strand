import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPosts, postPath } from "@wisp/core";
import { POSTS, routes } from "@/lib/wisp";

export function generateStaticParams() {
  const tags = new Set<string>();
  loadPosts(POSTS).forEach((p) => p.frontmatter.tags.forEach((t) => tags.add(t)));
  return [...tags].map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = loadPosts(POSTS).filter((p) => p.frontmatter.tags.includes(tag));
  if (!posts.length) notFound();
  return (
    <main>
      <div className="collection__head">
        <p className="eyebrow">Topic</p>
        <h1 className="collection__title">#{tag}</h1>
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
