/**
 * resolve-skills.ts — Wisp skill installer / dedup resolver.
 *
 * Two skill ecosystems with different storage locations:
 *   • skills.sh (Vercel)  → installed via `npx skills add <repo>/<skill>`
 *                           into the coding agent's skills dir (e.g. .claude/skills/).
 *                           Path for "Skills + CLI" mode.
 *   • Hermes              → per-profile under ~/.hermes/profiles/<name>/skills/.
 *                           Each installed skill auto-registers as a slash command.
 *                           Path when provisioning a Hermes editor profile.
 *
 * The resolver enumerates what is already present in the relevant target(s),
 * diffs against the required set, installs only the gap, and reports
 * present-vs-added — never blind reinstall.
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, cpSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const PACK = "coreyhaines31/marketingskills";

/** Marketing skills, tiered. Native skills ship inside this repo (see ./). */
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
  // Only meaningful once the subscriptions/forms adapter is enabled.
  subscriptionGated: [
    "email-sequence", "cold-email", "lead-magnets", "free-tool-strategy",
    "page-cro", "form-cro", "popup-cro", "signup-flow-cro",
    "onboarding-cro", "ab-test-setup", "referral-program",
  ],
} as const;

/** Native skills bundled in this package (copied, not fetched from skills.sh). */
export const NATIVE = ["wisp-publish", "wisp-content-schema", "wisp-fact-check-cite"] as const;
const NATIVE_SRC = join(import.meta.dirname, "."); // skills/<name>/SKILL.md

export type Mode = "core" | "core+media" | "custom";
export type Target =
  | { kind: "skills.sh"; dir: string }              // e.g. <project>/.claude/skills
  | { kind: "hermes"; profile: string };            // ~/.hermes/profiles/<profile>/skills

export interface Plan {
  subscriptions: boolean;     // subscriptions adapter enabled?
  mode: Mode;
  customMarketing?: string[]; // when mode === "custom"
}

/** Build the desired skill set from the install plan. */
export function desiredSkills(plan: Plan): string[] {
  const m = MARKETING;
  let marketing: string[] =
    plan.mode === "custom" ? (plan.customMarketing ?? [...m.mandatory])
    : plan.mode === "core+media" ? [...m.mandatory, ...m.distributionMedia]
    : [...m.mandatory];
  if (plan.subscriptions) marketing = [...marketing, ...m.subscriptionGated];
  return Array.from(new Set([...marketing, ...NATIVE]));
}

/** What is already installed in a target. */
function installed(target: Target): Set<string> {
  const dir = target.kind === "hermes"
    ? join(homedir(), ".hermes", "profiles", target.profile, "skills")
    : target.dir;
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name),
  );
}

function isNative(name: string): boolean {
  return (NATIVE as readonly string[]).includes(name);
}

/** Install one skill into a target (only called for missing skills). */
function install(name: string, target: Target) {
  if (isNative(name)) {
    const dest = target.kind === "hermes"
      ? join(homedir(), ".hermes", "profiles", target.profile, "skills", name)
      : join(target.dir, name);
    cpSync(join(NATIVE_SRC, name), dest, { recursive: true });
    return;
  }
  // skills.sh marketing skill. Per-skill add; fall back to whole pack on failure.
  try {
    execSync(`npx --yes skills add ${PACK}/${name}`, { stdio: "inherit" });
  } catch {
    execSync(`npx --yes skills add ${PACK}`, { stdio: "inherit" });
  }
}

export interface ResolveReport {
  target: string;
  present: string[];
  added: string[];
}

/** Resolve one target: diff, install the gap, report. Idempotent. */
export function resolveTarget(plan: Plan, target: Target): ResolveReport {
  const want = desiredSkills(plan);
  const have = installed(target);
  const present = want.filter((s) => have.has(s));
  const gap = want.filter((s) => !have.has(s));
  for (const name of gap) install(name, target);
  return {
    target: target.kind === "hermes" ? `hermes:${target.profile}` : `skills.sh:${target.dir}`,
    present,
    added: gap,
  };
}

/** "Both" mode resolves across every target. */
export function resolveAll(plan: Plan, targets: Target[]): ResolveReport[] {
  const reports = targets.map((t) => resolveTarget(plan, t));
  for (const r of reports) {
    const tail = r.added.length ? `+${r.added.length} new (${r.added.join(", ")})` : "up to date";
    console.log(`Skills synced: ${r.target} — ${tail}`);
  }
  return reports;
}
