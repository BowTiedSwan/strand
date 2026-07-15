import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import matter from "gray-matter";
import { validatePostFile } from "@strand-cms/core";
import type { Ctx } from "./context";
import { postFile } from "./content";
import {
  git, currentBranch, branchExists, hasRemote, hasGh, compareUrl,
} from "./git";

export interface PublishArgs {
  slug: string;
  branch?: string;
  prTitle?: string;
  prBody?: string;
  autoMerge: boolean;
}

/**
 * Publish a post according to the site's publication policy
 * (strand.json `publishMode`, set by the human at scaffold time):
 *
 *   review (default) — move the change onto a branch, commit, push, open a
 *   PR against the base branch. Merging is the act of publishing.
 *   direct — commit on the base branch and push. Agent output goes live.
 *
 * In BOTH modes the post's frontmatter is forced to status:published before
 * committing: anything this function touches is intended to be live once it
 * reaches the base branch. A merged-but-draft post is an invisible article —
 * the exact failure this design exists to prevent. Not-ready work simply
 * isn't passed to publish_post.
 *
 * Hard rules: never force-push; in review mode never commit to the base
 * branch. Push/PR degrade gracefully to a local branch + compare URL when no
 * remote or `gh` is present.
 */
export function publishPost(ctx: Ctx, args: PublishArgs) {
  const file = postFile(ctx, args.slug);
  if (!existsSync(file)) throw new Error(`No such post: ${args.slug} (create it first).`);

  // Gate on validation — never publish a failing post.
  const v = validatePostFile(file);
  if (!v.ok) {
    return { ok: false, reason: "validation_failed", errors: v.errors };
  }

  const notes: string[] = [];

  // Publishing means live: force status regardless of what the writer left.
  const parsed = matter(readFileSync(file, "utf8"));
  if (parsed.data.status !== "published") {
    parsed.data.status = "published";
    writeFileSync(file, matter.stringify(parsed.content, parsed.data));
    notes.push("frontmatter status forced to published (publishing means live).");
  }

  const fm = parsed.data as { title?: string };
  const base = ctx.baseBranch;

  // ── direct mode: commit on the base branch and push ──
  if (ctx.publishMode === "direct") {
    if (currentBranch(ctx.cwd) !== base) git(ctx.cwd, ["checkout", base]);
    git(ctx.cwd, ["add", relative(ctx.cwd, file)]);
    try { git(ctx.cwd, ["add", "content/authors"]); } catch { /* no author changes */ }
    let committed = false;
    if (git(ctx.cwd, ["status", "--porcelain"]).length) {
      git(ctx.cwd, ["commit", "-m", `post: ${fm.title ?? args.slug}`]);
      committed = true;
    } else {
      notes.push("Nothing to commit (post already committed).");
    }
    if (hasRemote(ctx.cwd)) git(ctx.cwd, ["push", "origin", base]); // never --force
    else notes.push("No git remote — committed locally; push to deploy.");
    notes.push("publishMode=direct (strand.json): committed to the base branch, no PR.");
    return { ok: true, branch: base, base, committed, pr: null, autoMerge: false, notes };
  }

  // ── review mode (default): branch, commit, push, PR ──
  const branch = args.branch ?? `post/${args.slug}`;
  if (branch === base) throw new Error(`Refusing to publish onto the base branch (${base}) — publishMode is "review".`);

  const start = currentBranch(ctx.cwd);

  // Create or switch to the branch (carries the uncommitted post change with it).
  if (branchExists(ctx.cwd, branch)) git(ctx.cwd, ["checkout", branch]);
  else git(ctx.cwd, ["checkout", "-b", branch]);

  // Stage the post (and any author changes) and commit.
  git(ctx.cwd, ["add", relative(ctx.cwd, file)]);
  try { git(ctx.cwd, ["add", "content/authors"]); } catch { /* no author changes */ }

  let committed = false;
  const status = git(ctx.cwd, ["status", "--porcelain"]);
  if (status.length) {
    git(ctx.cwd, ["commit", "-m", `post: ${fm.title ?? args.slug}`]);
    committed = true;
  } else {
    notes.push("Nothing to commit (post already committed).");
  }

  // Push + PR, or degrade to a local branch + compare URL.
  let pr: string | null = null;
  if (hasRemote(ctx.cwd)) {
    git(ctx.cwd, ["push", "-u", "origin", branch]); // never --force
    if (hasGh()) {
      const out = execFileSync(
        "gh",
        [
          "pr", "create",
          "--base", base,
          "--head", branch,
          "--title", args.prTitle ?? (fm.title ?? args.slug),
          "--body", args.prBody ?? `Publishes \`${args.slug}\`. Validated. Auto-merge: ${args.autoMerge}.`,
        ],
        { cwd: ctx.cwd, encoding: "utf8" },
      ).trim();
      pr = out;
      if (args.autoMerge) {
        try { execFileSync("gh", ["pr", "merge", "--auto", "--squash", branch], { cwd: ctx.cwd, stdio: "ignore" }); notes.push("Auto-merge requested (honored only if the repo allows it)."); }
        catch { notes.push("Auto-merge not enabled on this repo."); }
      }
    } else {
      pr = compareUrl(ctx.cwd, base, branch);
      notes.push("`gh` not found — open the PR via the compare URL.");
    }
  } else {
    notes.push(`No git remote — committed locally on \`${branch}\`. Push and open a PR manually.`);
  }

  // Return to the starting branch so the working tree is left clean.
  git(ctx.cwd, ["checkout", start]);

  return { ok: true, branch, base, committed, pr, autoMerge: args.autoMerge, notes };
}
