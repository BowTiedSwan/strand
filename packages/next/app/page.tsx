import Link from "next/link";
import { loadPosts, postPath, tagPath } from "@strand/core";
import { POSTS, routes, site } from "@/lib/strand";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}

export default function Home() {
  const posts = loadPosts(POSTS);
  return (
    <main className="index">
      <p className="eyebrow">{site.name}</p>
      <h1 className="index__lede">{site.description}</h1>

      <ul className="feed">
        {posts.map((p) => (
          <li key={p.slug} className="entry">
            <time className="entry__date" dateTime={p.frontmatter.publishedAt}>
              {fmtDate(p.frontmatter.publishedAt)}
            </time>
            <div>
              <h2 className="entry__title">
                <Link href={postPath(routes, p.slug)}>{p.frontmatter.title}</Link>
              </h2>
              <p className="entry__dek">{p.frontmatter.description}</p>
              <div className="entry__meta">
                <span>{p.readingTimeMinutes} min</span>
                {p.frontmatter.tags.slice(0, 3).map((t) => (
                  <Link key={t} className="tagchip" href={tagPath(routes, t)}>{t}</Link>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
