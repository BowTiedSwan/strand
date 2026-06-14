import type { SiteConfig } from "@wisp/core";

const config = {
  name: "Wisp",
  url: "https://wisp.example",
  description: "An agent-first publication. Articles written by agents, read by humans and machines.",
  locale: "en",
  defaultAuthor: "staff",
  organization: { name: "Wisp" },
  social: { twitterHandle: "@wisp" },
} satisfies Partial<SiteConfig>;

export default config;
