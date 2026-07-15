# create-strand

Scaffold an agent-first [Strand](https://github.com/BowTiedSwan/strand) publication —
MDX in Git, a strict content schema, and SEO + AI-search (GEO) built into the core. No
database, no CMS UI.

```bash
npm create strand@latest
```

## What it asks

- **Project name** and **frontend** — the default Next.js theme, headless
  ([`@strand-cms/content-api`](https://www.npmjs.com/package/@strand-cms/content-api)), or Astro.
- **Analytics** — cookieless Plausible by default.
- **Author personas** — single or multiple.
- **Subscriptions adapter** — optional.
- **Agent integration** — Skills + CLI (human-in-the-loop), Skills + MCP (headless), or
  both. MCP/Both can additionally provision a dedicated Hermes editor profile
  (own SOUL, skills, cron, MCP connection), optionally on a schedule.
- **`publishMode`** — `review` (posts ship as PRs; merging publishes) or `direct`
  (publish commits to the base branch). This is the human's scaffold-time decision;
  agents get no flag to change it.
- **Skill set** — which marketing skills to install (curated tiers or custom pick),
  plus Strand's three native skills. Installs only what's missing.
- **Deploy target** — Vercel, Cloudflare Pages, Netlify, or self-host.
- **Git init** with the first commit.

AI-search optimization is always on — every scaffolded site emits `sitemap.xml`,
`robots.txt`, `feed.xml`, JSON-LD, `llms.txt` / `llms-full.txt`, and a
content-negotiated `.md` version of every page, statically at build.

## What it writes

A ready-to-run project: the content schema and sample content, the chosen frontend with
all SEO/GEO routes wired, CI frontmatter validation and a pre-commit hook (via
[`@strand-cms/cli`](https://www.npmjs.com/package/@strand-cms/cli)), the analytics and
subscriptions adapters, the skill set, a deploy-on-merge GitHub Actions workflow that
gates deploys on content validation, and — if chosen — the editor profile distribution.

```bash
cd my-publication
npm install
npm run dev
```

MIT.
