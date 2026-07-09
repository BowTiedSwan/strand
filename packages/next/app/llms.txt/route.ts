import { loadPosts, buildLlmsTxt } from "@strand/core";
import { POSTS, site, routes } from "@/lib/strand";
export function GET() {
  return new Response(buildLlmsTxt(loadPosts(POSTS), site, routes), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
