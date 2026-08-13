import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPosts, postPath, indexableTag, metaDescription } from "@strand-cms/core";
import { POSTS, routes, site } from "@/lib/strand";

export function generateStaticParams() {
  const tags = new Set<string>();
  loadPosts(POSTS).forEach((p) => p.frontmatter.tags.forEach((t) => tags.add(t)));
  return [...tags].map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const url = new URL(`/tag/${encodeURIComponent(tag)}`, site.url).href;
  // Topics policy: thin tag pages (not a pillar, no cornerstone, below the
  // post-count floor) render noindex,follow — they still navigate and pass
  // link equity, but stop intercepting queries their articles should own.
  // No site.topics declared → everything stays indexed (legacy behavior).
  const count = loadPosts(POSTS).filter((p) => p.frontmatter.tags.includes(tag)).length;
  const index = indexableTag(tag, count, site.topics);
  return {
    title: `#${tag}`,
    description: metaDescription(`Posts tagged ${tag} on ${site.name}.`),
    alternates: { canonical: url },
    robots: index ? undefined : { index: false, follow: true },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const all = loadPosts(POSTS);
  const posts = all.filter((p) => p.frontmatter.tags.includes(tag));
  if (!posts.length) notFound();

  // Topics policy: when the tag has a designated cornerstone, surface it
  // first — the hub-and-spoke link that routes readers, crawlers and AI
  // engines to the reference article instead of a bare headline list.
  const cornerstoneSlug = site.topics?.cornerstones?.[tag];
  const cornerstone = cornerstoneSlug ? all.find((p) => p.slug === cornerstoneSlug) : undefined;

  return (
    <main>
      <div className="collection__head">
        <p className="eyebrow">Topic</p>
        <h1 className="collection__title">#{tag}</h1>
        {cornerstone && (
          <p className="collection__bio">
            <strong>Start here:</strong>{" "}
            <Link href={postPath(routes, cornerstone.slug)}>{cornerstone.frontmatter.title}</Link>
          </p>
        )}
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
