import { loadPosts, buildRss } from "@strand-cms/core";
import { POSTS, site, routes } from "@/lib/strand";
export function GET() {
  return new Response(buildRss(loadPosts(POSTS), site, routes), {
    headers: { "content-type": "application/rss+xml" },
  });
}
