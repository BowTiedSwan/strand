import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";
import {
  PostFrontmatter,
  loadPosts,
  loadPost,
  validatePostFile,
  validateFrontmatter,
} from "@strand-cms/core";
import type { Ctx } from "./context";

export function postFile(ctx: Ctx, slug: string): string {
  return join(ctx.postsDir, `${slug}.mdx`);
}

/* --------------------------------------------------------------- reads */

export function listPosts(
  ctx: Ctx,
  args: { status: string; tag?: string; author?: string; limit: number },
) {
  let posts = loadPosts(ctx.postsDir, { includeUnpublished: true });
  if (args.status !== "any") posts = posts.filter((p) => p.frontmatter.status === args.status);
  if (args.tag) posts = posts.filter((p) => p.frontmatter.tags.includes(args.tag!));
  if (args.author) posts = posts.filter((p) => p.frontmatter.author === args.author);
  return {
    count: posts.length,
    posts: posts.slice(0, args.limit).map((p) => ({
      slug: p.slug,
      title: p.frontmatter.title,
      status: p.frontmatter.status,
      publishedAt: p.frontmatter.publishedAt,
      author: p.frontmatter.author,
      tags: p.frontmatter.tags,
    })),
  };
}

export function getPost(ctx: Ctx, args: { slug: string }) {
  const p = loadPost(ctx.postsDir, args.slug, { includeUnpublished: true });
  if (!p) throw new Error(`No such post: ${args.slug}`);
  return {
    slug: p.slug,
    frontmatter: p.frontmatter,
    body: p.body,
    readingTimeMinutes: p.readingTimeMinutes,
  };
}

export function searchContent(ctx: Ctx, args: { query: string; limit: number }) {
  const q = args.query.toLowerCase();
  const hits = loadPosts(ctx.postsDir, { includeUnpublished: true })
    .filter((p) => {
      const hay = [
        p.frontmatter.title,
        p.frontmatter.description,
        p.frontmatter.tags.join(" "),
        p.body,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .slice(0, args.limit)
    .map((p) => ({ slug: p.slug, title: p.frontmatter.title, description: p.frontmatter.description }));
  return { count: hits.length, hits };
}

export function validatePost(
  ctx: Ctx,
  args: { slug?: string; frontmatter?: unknown; body?: string },
) {
  if (args.slug) return validatePostFile(postFile(ctx, args.slug));
  if (args.frontmatter) return validateFrontmatter(args.frontmatter);
  throw new Error("validate_post requires either `slug` or `frontmatter`.");
}

/* -------------------------------------------------------------- writes */

export function createDraft(ctx: Ctx, args: { frontmatter: unknown; body: string }) {
  const parsed = PostFrontmatter.safeParse(args.frontmatter);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({ path: i.path.join(".") || "(root)", message: i.message })),
    };
  }
  const fm = parsed.data;
  const file = postFile(ctx, fm.slug);
  if (existsSync(file)) throw new Error(`Post already exists: ${fm.slug} (use update_post).`);
  mkdirSync(ctx.postsDir, { recursive: true });
  writeFileSync(file, matter.stringify(args.body, fm));
  return { ok: true, slug: fm.slug, file: relative(ctx.cwd, file), status: fm.status, committed: false };
}

export function updatePost(
  ctx: Ctx,
  args: { slug: string; frontmatter?: Record<string, unknown>; body?: string },
) {
  const file = postFile(ctx, args.slug);
  if (!existsSync(file)) throw new Error(`No such post: ${args.slug}`);
  const cur = matter(readFileSync(file, "utf8"));
  const parsed = PostFrontmatter.safeParse({ ...cur.data, ...(args.frontmatter ?? {}) });
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({ path: i.path.join(".") || "(root)", message: i.message })),
    };
  }
  writeFileSync(file, matter.stringify(args.body ?? cur.content, parsed.data));
  return { ok: true, slug: args.slug, file: relative(ctx.cwd, file), updated: true, committed: false };
}
