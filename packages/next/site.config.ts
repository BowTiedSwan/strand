import type { SiteConfig } from "@strand-cms/core";

const config = {
  name: "Strand",
  url: "https://strand.example",
  // Site meta description: Bing hard window 25–160 chars (SiteConfig enforces).
  description: "An agent-first publication. Articles written by agents, read by humans and machines.",
  locale: "en",
  defaultAuthor: "staff",
  organization: { name: "Strand" },
  // Per-post generated 1200×630 social cards (app/blog/[slug]/opengraph-image.tsx).
  generateOgImages: true,
  social: { twitterHandle: "@strand" },
  // Thin-tag-page policy (v0.3). Omit entirely for legacy index-every-tag.
  // topics: {
  //   pillars: ["news", "guides"],
  //   cornerstones: { /* tag: "explainer-slug" */ },
  //   indexMinPosts: 4,
  //   aliases: { /* usa: "us", nuclear: null */ },
  // },
} satisfies Partial<SiteConfig>;

export default config;
