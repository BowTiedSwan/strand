import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import matter from "gray-matter";
import { validatePostFile } from "@strand/core";
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
 * Move the post's working-tree change onto a branch, commit, push, and open a PR.
 * Hard rules: never commit to the base branch, never force-push. Push/PR degrade
 * gracefully to a local branch + compare URL when no remote or `gh` is present.
 */
export function publishPost(ctx: Ctx, args: PublishArgs) {
  const file = postFile(ctx, args.slug);
  if (!existsSync(file)) throw new Error(`No such post: ${args.slug} (create it first).`);

  // Gate on validation — never publish a failing post.
  const v = validatePostFile(file);
  if (!v.ok) {
    return { ok: false, reason: "validation_failed", errors: v.errors };
  }

  const fm = matter(readFileSync(file, "utf8")).data as { title?: string };
  const base = ctx.baseBranch;
  const branch = args.branch ?? `post/${args.slug}`;
  if (branch === base) throw new Error(`Refusing to publish onto the base branch (${base}).`);

  const notes: string[] = [];
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
