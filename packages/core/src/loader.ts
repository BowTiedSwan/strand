import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import {
  PostFrontmatter,
  AuthorFrontmatter,
  type PostFrontmatter as PostFM,
  type AuthorFrontmatter as AuthorFM,
} from "./schema";

export interface Post {
  frontmatter: PostFM;
  body: string;
  slug: string;
  filePath: string;
  readingTimeMinutes: number;
}

export interface Author {
  frontmatter: AuthorFM;
  body: string;
  filePath: string;
}

export interface ValidationResult {
  ok: boolean;
  filePath?: string;
  errors: { path: string; message: string }[];
}

const WORDS_PER_MIN = 200;

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MIN));
}

function mdxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => join(dir, f));
}

function zodErrors(e: import("zod").ZodError): ValidationResult["errors"] {
  return e.issues.map((i) => ({
    path: i.path.join(".") || "(root)",
    message: i.message,
  }));
}

/* ------------------------------------------------------- validation */

/** Validate an already-parsed frontmatter object. Used by `wisp validate` and the MCP validate_post tool. */
export function validateFrontmatter(data: unknown): ValidationResult {
  const parsed = PostFrontmatter.safeParse(data);
  if (parsed.success) return { ok: true, errors: [] };
  return { ok: false, errors: zodErrors(parsed.error) };
}

/** Validate a post file on disk. Also checks that filename matches the slug. */
export function validatePostFile(filePath: string): ValidationResult {
  const raw = readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  const result = validateFrontmatter(data);
  result.filePath = filePath;
  if (result.ok) {
    const fileSlug = basename(filePath).replace(/\.mdx?$/, "");
    if ((data as PostFM).slug !== fileSlug) {
      return {
        ok: false,
        filePath,
        errors: [
          {
            path: "slug",
            message: `slug "${(data as PostFM).slug}" must match filename "${fileSlug}"`,
          },
        ],
      };
    }
  }
  return result;
}

/* ----------------------------------------------------------- status */

/** A post is live if it's published, or scheduled with a publish time in the past. */
export function isLive(fm: PostFM, now: Date = new Date()): boolean {
  if (fm.noindex) return false;
  if (fm.status === "published") return true;
  if (fm.status === "scheduled") return new Date(fm.publishedAt) <= now;
  return false;
}

/* ----------------------------------------------------------- loaders */

export function loadAuthors(authorsDir: string): Author[] {
  return mdxFiles(authorsDir).map((filePath) => {
    const { data, content } = matter(readFileSync(filePath, "utf8"));
    const fm = AuthorFrontmatter.parse({
      id: data.id ?? basename(filePath).replace(/\.mdx?$/, ""),
      ...data,
    });
    return { frontmatter: fm, body: content, filePath };
  });
}

export function loadAuthor(authorsDir: string, id: string): Author | undefined {
  return loadAuthors(authorsDir).find((a) => a.frontmatter.id === id);
}

export interface LoadPostsOptions {
  /** Include drafts and not-yet-due scheduled posts (e.g. for previews). Default false. */
  includeUnpublished?: boolean;
  now?: Date;
}

export function loadPosts(postsDir: string, opts: LoadPostsOptions = {}): Post[] {
  const now = opts.now ?? new Date();
  const posts: Post[] = [];
  for (const filePath of mdxFiles(postsDir)) {
    const { data, content } = matter(readFileSync(filePath, "utf8"));
    const fm = PostFrontmatter.parse(data); // throws on invalid — CI should catch first
    if (!opts.includeUnpublished && !isLive(fm, now)) continue;
    posts.push({
      frontmatter: fm,
      body: content,
      slug: fm.slug,
      filePath,
      readingTimeMinutes: readingTime(content),
    });
  }
  // Newest first.
  posts.sort(
    (a, b) =>
      new Date(b.frontmatter.publishedAt).getTime() -
      new Date(a.frontmatter.publishedAt).getTime(),
  );
  return posts;
}

export function loadPost(
  postsDir: string,
  slug: string,
  opts: LoadPostsOptions = { includeUnpublished: true },
): Post | undefined {
  return loadPosts(postsDir, opts).find((p) => p.slug === slug);
}
