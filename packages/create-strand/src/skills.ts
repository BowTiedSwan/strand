/**
 * Skill tiers + install for the scaffolder.
 *
 * NOTE: the tier arrays here are the canonical source and must stay in sync with
 * the standalone reference resolver at `skills/resolve-skills.ts`.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Answers } from "./types";

const PACK = "coreyhaines31/marketingskills";

export const MARKETING = {
  mandatory: [
    "copywriting", "copy-editing", "content-strategy", "programmatic-seo",
    "seo-audit", "ai-seo", "schema-markup", "site-architecture", "analytics-tracking",
  ],
  distributionMedia: [
    "social-content", "image", "video", "directory-submissions",
    "customer-research", "marketing-psychology",
    "competitor-alternatives", "competitor-profiling",
  ],
  subscriptionGated: [
    "email-sequence", "cold-email", "lead-magnets", "free-tool-strategy",
    "page-cro", "form-cro", "popup-cro", "signup-flow-cro",
    "onboarding-cro", "ab-test-setup", "referral-program",
  ],
} as const;

export const NATIVE = [
  "strand-publish",
  "strand-content-schema",
  "strand-fact-check-cite",
  "strand-review-gate",
  "humanizer",
] as const;

export type Target =
  | { kind: "skills.sh"; dir: string }
  | { kind: "hermes"; profile: string };

/** Resolve the desired skill set from the user's answers. */
export function desiredSkills(a: Answers): string[] {
  let marketing: string[] =
    a.skillSet === "custom"
      ? a.customSkills.length ? a.customSkills : [...MARKETING.mandatory]
      : a.skillSet === "core+media"
        ? [...MARKETING.mandatory, ...MARKETING.distributionMedia]
        : [...MARKETING.mandatory];
  if (a.subscriptions !== "none") marketing = [...marketing, ...MARKETING.subscriptionGated];
  return Array.from(new Set([...marketing, ...NATIVE]));
}

/** Which targets to sync skills into, given the agent mode + profile choice. */
export function targetsFor(a: Answers, projectDir: string): Target[] {
  const targets: Target[] = [];
  if (a.agentMode === "cli" || a.agentMode === "both") {
    targets.push({ kind: "skills.sh", dir: join(projectDir, ".claude", "skills") });
  }
  if ((a.agentMode === "mcp" || a.agentMode === "both") && a.profile !== "no") {
    targets.push({ kind: "hermes", profile: `${a.projectName}-editor` });
  }
  return targets;
}

function targetDir(t: Target): string {
  return t.kind === "hermes"
    ? join(homedir(), ".hermes", "profiles", t.profile, "skills")
    : t.dir;
}

/**
 * Hermes targets also resolve skills from bundled category dirs
 * (skills/<category>/<slug>/SKILL.md), and Hermes >= 0.20 refuses ambiguous
 * names — a top-level copy shadowing a bundled skill makes it unresolvable
 * (cron reports it "not found"). Categorized skills therefore count as
 * installed and are never re-installed top-level.
 */
function installed(t: Target): Set<string> {
  const dir = targetDir(t);
  if (!existsSync(dir)) return new Set();
  const names = new Set<string>();
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    if (existsSync(join(dir, e.name, "SKILL.md"))) {
      names.add(e.name);
      continue;
    }
    if (t.kind !== "hermes") continue;
    for (const c of readdirSync(join(dir, e.name), { withFileTypes: true })) {
      if (c.isDirectory() && existsSync(join(dir, e.name, c.name, "SKILL.md"))) names.add(c.name);
    }
  }
  return names;
}

const isNative = (n: string) => (NATIVE as readonly string[]).includes(n);

export interface SkillReport {
  target: string;
  present: string[];
  added: string[];
  skippedExternal: boolean;
}

/**
 * Diff desired vs installed and install only the gap. In dryRun, native skills
 * are still copied (local, safe) but `npx skills add` is skipped and reported.
 */
export function syncSkills(
  a: Answers,
  projectDir: string,
  nativeSrc: string,
  dryRun = false,
): SkillReport[] {
  const want = desiredSkills(a);
  return targetsFor(a, projectDir).map((t) => {
    const dir = targetDir(t);
    mkdirSync(dir, { recursive: true });
    const have = installed(t);
    const gap = want.filter((s) => !have.has(s));
    let skippedExternal = false;
    for (const name of gap) {
      if (isNative(name)) {
        const from = join(nativeSrc, name);
        if (existsSync(from)) cpSync(from, join(dir, name), { recursive: true });
      } else if (!dryRun) {
        try {
          execSync(`npx --yes skills add ${PACK}/${name} --dir ${dir}`, { stdio: "inherit" });
        } catch {
          execSync(`npx --yes skills add ${PACK} --dir ${dir}`, { stdio: "inherit" });
        }
      } else {
        skippedExternal = true;
      }
    }
    return {
      target: t.kind === "hermes" ? `hermes:${t.profile}` : `cli:${t.dir}`,
      present: want.filter((s) => have.has(s)),
      added: gap,
      skippedExternal,
    };
  });
}
