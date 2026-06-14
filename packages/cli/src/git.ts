import { execFileSync } from "node:child_process";

export function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

export function currentBranch(cwd: string): string {
  return git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
}

export function branchExists(cwd: string, name: string): boolean {
  try {
    git(cwd, ["rev-parse", "--verify", "--quiet", `refs/heads/${name}`]);
    return true;
  } catch {
    return false;
  }
}

export function hasRemote(cwd: string): boolean {
  try {
    return git(cwd, ["remote"]).length > 0;
  } catch {
    return false;
  }
}

export function remoteUrl(cwd: string): string {
  try {
    return git(cwd, ["remote", "get-url", "origin"]);
  } catch {
    return "";
  }
}

/** GitHub compare URL fallback when `gh` is unavailable. */
export function compareUrl(cwd: string, base: string, head: string): string | null {
  let url = remoteUrl(cwd);
  if (!url) return null;
  url = url.replace(/\.git$/, "").replace(/^git@github\.com:/, "https://github.com/");
  return `${url}/compare/${base}...${head}?expand=1`;
}

export function hasGh(): boolean {
  try {
    execFileSync("gh", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
