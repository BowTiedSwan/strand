import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Ctx {
  cwd: string;
  postsDir: string;
  authorsDir: string;
  baseBranch: string;
  analytics: { provider: string; domain?: string };
}

/**
 * Resolve context from the blog repo the server runs in (terminal.cwd).
 * Provider comes from wisp.json; secrets/domain come from env so they never
 * live in the repo.
 */
export function loadCtx(cwd: string = process.cwd()): Ctx {
  let provider = process.env.WISP_ANALYTICS ?? "none";
  const wj = join(cwd, "wisp.json");
  if (existsSync(wj)) {
    try {
      const j = JSON.parse(readFileSync(wj, "utf8")) as { analytics?: string };
      if (j.analytics) provider = j.analytics;
    } catch {
      /* ignore malformed wisp.json */
    }
  }
  return {
    cwd,
    postsDir: join(cwd, "content/posts"),
    authorsDir: join(cwd, "content/authors"),
    baseBranch: process.env.WISP_BASE_BRANCH ?? "main",
    analytics: { provider, domain: process.env.WISP_ANALYTICS_DOMAIN },
  };
}
