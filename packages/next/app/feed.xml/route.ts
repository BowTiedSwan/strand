import { loadPosts, buildRss } from "@wisp/core";
import { POSTS, site, routes } from "@/lib/wisp";
export function GET() {
  return new Response(buildRss(loadPosts(POSTS), site, routes), {
    headers: { "content-type": "application/rss+xml" },
  });
}
