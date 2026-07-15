import {
  intro, outro, text, select, confirm, multiselect, isCancel, cancel,
} from "@clack/prompts";
import type {
  Answers, Frontend, Analytics, Subscriptions, AgentMode, PublishMode, SkillSet, ProfileChoice, DeployTarget,
} from "./types";
import { MARKETING } from "./skills";

function bail<T>(v: T | symbol): T {
  if (isCancel(v)) {
    cancel("Cancelled.");
    process.exit(0);
  }
  return v as T;
}

export async function runPrompts(): Promise<Answers> {
  intro("create-strand — an agent-first publishing system");

  const projectName = bail(
    await text({
      message: "Project name",
      placeholder: "my-news-site",
      validate: (v) =>
        /^[a-z0-9][a-z0-9-]*$/.test(v) ? undefined : "lowercase letters, numbers, and hyphens",
    }),
  ) as string;

  const frontend = bail(
    await select({
      message: "Frontend",
      options: [
        { value: "next", label: "Next.js (App Router)", hint: "default" },
        { value: "headless", label: "Headless (content package only)" },
        { value: "astro", label: "Astro" },
      ],
      initialValue: "next" as Frontend,
    }),
  ) as Frontend;

  const analytics = bail(
    await select({
      message: "Analytics",
      options: [
        { value: "plausible", label: "Plausible", hint: "cookieless, default" },
        { value: "umami", label: "Umami", hint: "cookieless" },
        { value: "ga4", label: "Google Analytics 4" },
        { value: "posthog", label: "PostHog" },
        { value: "none", label: "None" },
      ],
      initialValue: "plausible" as Analytics,
    }),
  ) as Analytics;

  const personas = bail(
    await select({
      message: "Author personas",
      options: [
        { value: "single", label: "Single house byline" },
        { value: "multiple", label: "Multiple named personas" },
      ],
      initialValue: "single" as "single" | "multiple",
    }),
  ) as "single" | "multiple";

  const subscriptions = bail(
    await select({
      message: "Subscriptions adapter",
      options: [
        { value: "none", label: "None" },
        { value: "buttondown", label: "Buttondown" },
        { value: "convertkit", label: "ConvertKit" },
        { value: "resend", label: "Resend" },
      ],
      initialValue: "none" as Subscriptions,
    }),
  ) as Subscriptions;

  const agentMode = bail(
    await select({
      message: "Agent integration",
      options: [
        { value: "cli", label: "Skills + CLI", hint: "human-in-the-loop" },
        { value: "mcp", label: "Skills + MCP", hint: "headless / programmatic" },
        { value: "both", label: "Both" },
      ],
      initialValue: "both" as AgentMode,
    }),
  ) as AgentMode;

  const publishMode = bail(
    await select({
      message: "Publishing policy (this is yours, not the agent's — it has no flag to override it)",
      options: [
        { value: "review", label: "Review — every post is a PR; merging publishes", hint: "default" },
        { value: "direct", label: "Direct — agent posts go live on the base branch" },
      ],
      initialValue: "review" as PublishMode,
    }),
  ) as PublishMode;

  const skillSet = bail(
    await select({
      message: "Install marketing skills",
      options: [
        { value: "core", label: "Recommended core (9)" },
        { value: "core+media", label: "Core + distribution & media" },
        { value: "custom", label: "Custom select" },
      ],
      initialValue: "core" as SkillSet,
    }),
  ) as SkillSet;

  let customSkills: string[] = [];
  if (skillSet === "custom") {
    const all = [...MARKETING.mandatory, ...MARKETING.distributionMedia, ...MARKETING.subscriptionGated];
    customSkills = bail(
      await multiselect({
        message: "Select skills (space to toggle)",
        options: all.map((s) => ({ value: s, label: s })),
        initialValues: [...MARKETING.mandatory] as string[],
        required: false,
      }),
    ) as string[];
  }

  let profile: ProfileChoice = "no";
  let cron = false;
  if (agentMode === "mcp" || agentMode === "both") {
    profile = bail(
      await select({
        message: "Provision a dedicated Hermes editor profile?",
        options: [
          { value: "dist", label: "Yes — as a profile distribution repo", hint: "reproducible" },
          { value: "local", label: "Yes — local profile" },
          { value: "no", label: "No" },
        ],
        initialValue: "dist" as ProfileChoice,
      }),
    ) as ProfileChoice;
    if (profile !== "no") {
      cron = bail(
        await confirm({ message: "Enable a scheduled drafting cron in the profile?", initialValue: false }),
      ) as boolean;
    }
  }

  const deployTarget = bail(
    await select({
      message: "Deploy target",
      options: [
        { value: "vercel", label: "Vercel", hint: "default" },
        { value: "cloudflare", label: "Cloudflare Pages" },
        { value: "netlify", label: "Netlify" },
        { value: "self-host", label: "Self-host (build artifact + rsync)" },
      ],
      initialValue: "vercel" as DeployTarget,
    }),
  ) as DeployTarget;

  const gitInit = bail(
    await confirm({ message: "Initialize a git repo with the first commit?", initialValue: true }),
  ) as boolean;

  return {
    projectName, frontend, analytics, personas, subscriptions,
    agentMode, publishMode, skillSet, customSkills, profile, cron, deployTarget, gitInit,
  };
}

export { outro };
