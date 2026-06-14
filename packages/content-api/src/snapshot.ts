import { writeFileSync } from "node:fs";
import { createContent, type ContentApiConfig } from "./api";
import type { Snapshot } from "./types";

/**
 * Build a single static JSON snapshot of the whole publication. A fully static
 * external frontend can import this at build time instead of calling the API.
 */
export function buildSnapshot(c: ContentApiConfig): Snapshot {
  const q = createContent(c);
  const slugs = q.getPosts({}).posts.map((p) => p.slug);
  return {
    generatedAt: new Date().toISOString(),
    site: { name: c.site.name, url: c.site.url },
    posts: slugs.map((s) => q.getPost(s)!),
    authors: q.getAuthors(),
    tags: q.getTags(),
  };
}

export function writeSnapshot(c: ContentApiConfig, outPath: string): Snapshot {
  const snap = buildSnapshot(c);
  writeFileSync(outPath, JSON.stringify(snap, null, 2));
  return snap;
}
