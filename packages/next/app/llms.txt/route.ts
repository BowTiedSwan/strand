import { loadPosts, buildLlmsTxt } from "@wisp/core";
import { POSTS, site, routes } from "@/lib/wisp";
export function GET() {
  return new Response(buildLlmsTxt(loadPosts(POSTS), site, routes), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
