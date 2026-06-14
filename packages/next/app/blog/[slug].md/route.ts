import { loadPost, loadAuthor, renderPostMarkdown } from "@wisp/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/wisp";

export function generateStaticParams() { return []; }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  if (!post) return new Response("Not found", { status: 404 });
  const author = loadAuthor(AUTHORS, post.frontmatter.author);
  return new Response(renderPostMarkdown(post, author, site, routes), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
