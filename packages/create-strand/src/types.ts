export type Frontend = "next" | "headless" | "astro";
export type Analytics = "plausible" | "umami" | "ga4" | "posthog" | "none";
export type Subscriptions = "none" | "buttondown" | "convertkit" | "resend";
export type AgentMode = "cli" | "mcp" | "both";
/**
 * Publication policy, decided by the human at scaffold time and never by an
 * agent at publish time. "review": every post ships as a PR against the base
 * branch; merging is the act of publishing. "direct": publish_post commits to
 * the base branch and pushes — agent output goes live without review.
 */
export type PublishMode = "review" | "direct";
export type SkillSet = "core" | "core+media" | "custom";
export type ProfileChoice = "dist" | "local" | "no";
export type DeployTarget = "vercel" | "cloudflare" | "netlify" | "self-host";

export interface Answers {
  projectName: string;
  frontend: Frontend;
  analytics: Analytics;
  personas: "single" | "multiple";
  subscriptions: Subscriptions;
  agentMode: AgentMode;
  publishMode: PublishMode;
  skillSet: SkillSet;
  customSkills: string[];
  profile: ProfileChoice;
  cron: boolean;
  deployTarget: DeployTarget;
  gitInit: boolean;
}

export interface ScaffoldOptions {
  /** Write files but skip network/external installs (skills, hermes) and git. */
  dryRun?: boolean;
  /** Target parent directory. The project is created at <cwd>/<projectName>. */
  cwd?: string;
}
