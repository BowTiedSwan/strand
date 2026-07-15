import { loadPosts, loadAuthors, buildLlmsFullTxt } from "@strand-cms/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";
export function GET() {
  return new Response(buildLlmsFullTxt(loadPosts(POSTS), loadAuthors(AUTHORS), site, routes), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
