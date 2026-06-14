import type { PostSummaryDTO, PostDTO, AuthorDTO, TagDTO } from "./types";
import type { PostQuery } from "./api";

/**
 * Typed client for the Wisp content API. Drop into any external frontend
 * (React-bits, Astro, a mobile app) that consumes the JSON endpoints.
 *
 *   const wisp = createWispClient("https://site.com/api");
 *   const { posts } = await wisp.posts({ tag: "geo", limit: 10 });
 */
export function createWispClient(baseUrl: string, fetchImpl: typeof fetch = fetch) {
  const base = baseUrl.replace(/\/$/, "");
  const get = async <T>(path: string): Promise<T> => {
    const r = await fetchImpl(base + path);
    if (!r.ok) throw new Error(`Wisp API ${r.status}: ${path}`);
    return (await r.json()) as T;
  };
  const qs = (q: Record<string, unknown>) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v != null) s.set(k, String(v));
    const str = s.toString();
    return str ? `?${str}` : "";
  };

  return {
    posts: (q: PostQuery = {}) =>
      get<{ count: number; posts: PostSummaryDTO[] }>(`/posts${qs(q as Record<string, unknown>)}`),
    post: (slug: string) => get<PostDTO>(`/posts/${slug}`),
    postMarkdown: async (slug: string) => {
      const r = await fetchImpl(`${base}/posts/${slug}.md`);
      if (!r.ok) throw new Error(`Wisp API ${r.status}`);
      return r.text();
    },
    tags: () => get<{ tags: TagDTO[] }>("/tags"),
    authors: () => get<{ authors: AuthorDTO[] }>("/authors"),
    author: (id: string) => get<AuthorDTO>(`/authors/${id}`),
    search: (q: string, limit = 10) =>
      get<{ count: number; hits: PostSummaryDTO[] }>(`/search${qs({ q, limit })}`),
  };
}

export type WispClient = ReturnType<typeof createWispClient>;
