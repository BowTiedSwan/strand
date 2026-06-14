import { loadPosts, loadAuthors, buildLlmsFullTxt } from "@wisp/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/wisp";
export function GET() {
  return new Response(buildLlmsFullTxt(loadPosts(POSTS), loadAuthors(AUTHORS), site, routes), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
