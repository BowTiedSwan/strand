export type Frontend = "next" | "headless" | "astro";
export type Analytics = "plausible" | "umami" | "ga4" | "posthog" | "none";
export type Subscriptions = "none" | "buttondown" | "convertkit" | "resend";
export type AgentMode = "cli" | "mcp" | "both";
export type SkillSet = "core" | "core+media" | "custom";
export type ProfileChoice = "dist" | "local" | "no";

export interface Answers {
  projectName: string;
  frontend: Frontend;
  analytics: Analytics;
  personas: "single" | "multiple";
  subscriptions: Subscriptions;
  agentMode: AgentMode;
  skillSet: SkillSet;
  customSkills: string[];
  profile: ProfileChoice;
  cron: boolean;
  gitInit: boolean;
}

export interface ScaffoldOptions {
  /** Write files but skip network/external installs (skills, hermes) and git. */
  dryRun?: boolean;
  /** Target parent directory. The project is created at <cwd>/<projectName>. */
  cwd?: string;
}
