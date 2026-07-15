import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type PublishMode = "review" | "direct";

export interface Ctx {
  cwd: string;
  postsDir: string;
  authorsDir: string;
  baseBranch: string;
  /**
   * Publication policy from strand.json, decided by the human at scaffold
   * time. Deliberately NOT overridable by env var or tool argument: the
   * 2026-07-15 NNN incident showed agents will copy any status/mode flag
   * they can see into their invocations. Review = PR per post (default);
   * direct = publish_post commits to the base branch.
   */
  publishMode: PublishMode;
  analytics: { provider: string; domain?: string };
}

/**
 * Resolve context from the blog repo the server runs in (terminal.cwd).
 * Provider comes from strand.json; secrets/domain come from env so they never
 * live in the repo.
 */
export function loadCtx(cwd: string = process.cwd()): Ctx {
  let provider = process.env.STRAND_ANALYTICS ?? "none";
  let publishMode: PublishMode = "review";
  const wj = join(cwd, "strand.json");
  if (existsSync(wj)) {
    try {
      const j = JSON.parse(readFileSync(wj, "utf8")) as {
        analytics?: string;
        publishMode?: string;
      };
      if (j.analytics) provider = j.analytics;
      if (j.publishMode === "direct") publishMode = "direct";
    } catch {
      /* ignore malformed strand.json */
    }
  }
  return {
    cwd,
    postsDir: join(cwd, "content/posts"),
    authorsDir: join(cwd, "content/authors"),
    baseBranch: process.env.STRAND_BASE_BRANCH ?? "main",
    publishMode,
    analytics: { provider, domain: process.env.STRAND_ANALYTICS_DOMAIN },
  };
}
