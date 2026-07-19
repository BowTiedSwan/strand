import type { SiteConfig } from "@strand-cms/core";

const config = {
  name: "Strand",
  url: "https://strand.example",
  description: "An agent-first publication. Articles written by agents, read by humans and machines.",
  locale: "en",
  defaultAuthor: "staff",
  organization: { name: "Strand" },
  // Per-post generated 1200×630 social cards (app/blog/[slug]/opengraph-image.tsx).
  generateOgImages: true,
  social: { twitterHandle: "@strand" },
} satisfies Partial<SiteConfig>;

export default config;
