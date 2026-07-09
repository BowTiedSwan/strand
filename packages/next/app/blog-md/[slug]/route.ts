import type { NextRequest } from "next/server";
import { loadPost, loadAuthor, loadPosts, renderPostMarkdown } from "@strand/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";

export const dynamic = "force-static";

export function generateStaticParams() {
  return loadPosts(POSTS).map((post) => ({ slug: post.slug }));
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug?: string }> },
) {
  const { slug } = (await ctx.params) ?? {};

  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const post = loadPost(POSTS, slug, {});
  if (!post) return new Response("Not found", { status: 404 });

  const author = loadAuthor(AUTHORS, post.frontmatter.author);

  return new Response(renderPostMarkdown(post, author, site, routes), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
