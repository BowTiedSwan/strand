# Strand CMS

> **Working name** — a lighter, smaller thing than a Ghost. Find-and-replace freely.

An **agent-first, minimal, open-source publishing system** for programmatic blogs and
news sites. Articles are **MDX files in Git**, written and optimized by agents, rendered
by a deployable frontend with **SEO and AI-search (GEO) built into the core**. No
database, no CMS UI, no human-editor bloat.

Ghost gave humans a beautiful editor and a database. Strand gives agents a strict schema, a
Git repo, and a set of skills — and keeps only the SEO/structured-data core that actually
earns traffic.

## Why

Everything an editor does — drafting, SEO, structured data, scheduling, publishing — an
agent can now do against a well-defined contract. So Strand throws out the database, the
WYSIWYG editor, members/subscriptions, newsletters, theme marketplaces, and roles, and
keeps the ~15% of a CMS that matters: a validated content schema and a publishing-quality
core. Then it pushes that core further than Ghost ever did, toward **AI search engines**.

See [`DESIGN.md`](./DESIGN.md) for the full architecture, the keep/cut analysis, and diagrams.

## What's in the box

| Package | What it is | Status |
|---|---|---|
| [`packages/core`](./packages/core) | `@strand/core` — content schema (Zod), MDX loader, and the SEO/GEO generators (sitemap, JSON-LD, RSS, robots, `llms.txt`, the `.md` endpoint) | ✅ built + verified |
| [`packages/create-strand`](./packages/create-strand) | The `npm create strand` interactive scaffolder | ✅ built + verified |
| [`packages/cli`](./packages/cli) | `@strand/cli` — the `strand` bin: the **MCP server** (real git + filesystem ops) and `strand validate` | ✅ built + verified |
| [`skills/`](./skills) | Three native skills (`strand-publish`, `strand-content-schema`, `strand-fact-check-cite`) + the skill install/dedup resolver | ✅ |
| [`profile-dist/`](./profile-dist) | A reference Hermes editor profile distribution (SOUL + config + cron) | ✅ |
| [`packages/next`](./packages/next) | `@strand/next` — the default theme: a Next.js publication with the **strand rail**, MDX rendering, and all SEO/GEO routes | ✅ built + verified |
| [`packages/content-api`](./packages/content-api) | `@strand/content-api` — typed query layer + framework-agnostic JSON API (Hono/Next/Bun) + typed client + static snapshot | ✅ built + verified |

Every code package typechecks under `strict` + `noUncheckedIndexedAccess` and has been
exercised against real inputs (MDX fixtures, a temp git repo, and a live MCP stdio session).

## Quickstart

```bash
npm create strand@latest
```

The scaffolder asks for: frontend (Next.js / headless / Astro), analytics (cookieless
Plausible by default), author personas, an optional subscriptions adapter, agent
integration mode, which marketing skills to install, and — for MCP/Both — whether to
provision a dedicated Hermes editor profile. AI-search optimization is always on.

It writes a ready-to-run project: the content schema, sample content, the frontend with
all SEO/GEO routes wired, CI frontmatter validation, a pre-commit hook, the chosen
adapters, the skill set (installing only what's missing), and the editor profile.

## The agent model

Strand is driven three ways, chosen at scaffold time:

- **Skills + CLI** — marketing skills + native skills installed into your terminal coding
  agent. Human-in-the-loop.
- **Skills + MCP** — the `strand mcp` server exposes structured tools (`create_draft`,
  `validate_post`, `publish_post`, `get_analytics`, …) to any MCP client. Headless.
- **Both** — and this unlocks a dedicated **Hermes editor profile**: a separate agent
  (its own SOUL, skills, cron, MCP connection) that owns the publication and operates
  inside the blog repo via `terminal.cwd`. Emitted as a reproducible profile distribution.

Skills come from the [coreyhaines31/marketingskills](https://www.skills.sh/coreyhaines31/marketingskills)
pack (tiered into mandatory / optional / subscription-gated) plus three native skills for
Strand's own mechanics. The publishing core: `programmatic-seo`, `ai-seo`, `schema-markup`,
`site-architecture`, `seo-audit`, `content-strategy`, `copywriting`, `copy-editing`,
`analytics-tracking`, plus `strand-content-schema`, `strand-fact-check-cite`, `strand-publish`.

## What every site emits automatically

Classic SEO: `sitemap.xml`, `robots.txt`, `feed.xml`, per-page canonical, OpenGraph +
Twitter cards, and JSON-LD (`Article`/`NewsArticle`/`BlogPosting`).

GEO, for ChatGPT / Perplexity / Claude / AI Overviews — always on: `llms.txt` +
`llms-full.txt`, a content-negotiated **`.md` version of every page** (clean source, not
hydrated DOM), `FAQPage`/`speakable` schema, author-entity E-E-A-T markup, and visible
cited sources.

This indexed surface is **emitted statically at build** (rebuilt on merge), which is what
SEO/GEO needs — content in the server's HTML, not assembled client-side. The headless
`@strand/content-api` is a **separate JSON data channel** for app/programmatic consumers, not
the crawlable surface; keep article pages and these artifacts static (or cached). See
[`packages/content-api`](./packages/content-api) for the details.

## Develop

```bash
npm install            # workspace install (links @strand/core locally)
npm run -ws typecheck  # typecheck every package
```

Requires Node 20+. The repo is an npm workspace.

## Safety model

Publishing is **PR-only**. The `publish_post` tool refuses to commit to the base branch,
never force-pushes, and only auto-merges when the repo itself allows it. The content
schema is enforced in CI and a pre-commit hook, so a malformed post cannot merge. The
editor agent is instructed never to fabricate sources.

## Building & publishing

The publishable packages (`@strand/core`, `@strand/cli`, `@strand/content-api`, `create-strand`)
build with **tsup** to `dist/*.js` + `.d.ts`, with `exports` pointed at the built output —
so they run under plain `node` (and `npx`) on a clean machine, not just via tsx/bundlers.

```bash
npm run -ws build        # build every package
```

Each carries a `prepublishOnly` build hook; `create-strand` bundles the native skills into its
own tarball at build time. `@strand/next` is a private app, built with `next build`.

## Deploy

Scaffolded sites ship a deploy-on-merge GitHub Actions workflow for the chosen target —
Vercel, Cloudflare Pages, Netlify, or self-host — that **gates every deploy on content
validation** and reships the SEO/GEO artifacts on each build. Connecting the repo in the
provider dashboard is the zero-config alternative.

## Status

Early but substantial. The design plus five code packages are real and tested: `@strand/core`,
`create-strand`, `@strand/cli` (MCP server), `@strand/next` (default theme), and `@strand/content-api`
(headless) — all building to `dist` and verified under plain `node`. The managed cloud tier is
the next build. See [`DESIGN.md` §10](./DESIGN.md) for the roadmap.

## License

MIT.
