# Wisp

> **Working name** — a lighter, smaller thing than a Ghost. Find-and-replace freely.

An **agent-first, minimal, open-source publishing system** for programmatic blogs and
news sites. Articles are **MDX files in Git**, written and optimized by agents, rendered
by a deployable frontend with **SEO and AI-search (GEO) built into the core**. No
database, no CMS UI, no human-editor bloat.

Ghost gave humans a beautiful editor and a database. Wisp gives agents a strict schema, a
Git repo, and a set of skills — and keeps only the SEO/structured-data core that actually
earns traffic.

## Why

Everything an editor does — drafting, SEO, structured data, scheduling, publishing — an
agent can now do against a well-defined contract. So Wisp throws out the database, the
WYSIWYG editor, members/subscriptions, newsletters, theme marketplaces, and roles, and
keeps the ~15% of a CMS that matters: a validated content schema and a publishing-quality
core. Then it pushes that core further than Ghost ever did, toward **AI search engines**.

See [`DESIGN.md`](./DESIGN.md) for the full architecture, the keep/cut analysis, and diagrams.

## What's in the box

| Package | What it is | Status |
|---|---|---|
| [`packages/core`](./packages/core) | `@wisp/core` — content schema (Zod), MDX loader, and the SEO/GEO generators (sitemap, JSON-LD, RSS, robots, `llms.txt`, the `.md` endpoint) | ✅ built + verified |
| [`packages/create-wisp`](./packages/create-wisp) | The `npm create wisp` interactive scaffolder | ✅ built + verified |
| [`packages/cli`](./packages/cli) | `@wisp/cli` — the `wisp` bin: the **MCP server** (real git + filesystem ops) and `wisp validate` | ✅ built + verified |
| [`skills/`](./skills) | Three native skills (`wisp-publish`, `wisp-content-schema`, `wisp-fact-check-cite`) + the skill install/dedup resolver | ✅ |
| [`profile-dist/`](./profile-dist) | A reference Hermes editor profile distribution (SOUL + config + cron) | ✅ |
| `packages/next` | Default Next.js theme + adapters | ⬜ planned |
| `packages/content-api` | Headless typed content package + JSON API | ⬜ planned |

Every code package typechecks under `strict` + `noUncheckedIndexedAccess` and has been
exercised against real inputs (MDX fixtures, a temp git repo, and a live MCP stdio session).

## Quickstart

```bash
npm create wisp@latest
```

The scaffolder asks for: frontend (Next.js / headless / Astro), analytics (cookieless
Plausible by default), author personas, an optional subscriptions adapter, agent
integration mode, which marketing skills to install, and — for MCP/Both — whether to
provision a dedicated Hermes editor profile. AI-search optimization is always on.

It writes a ready-to-run project: the content schema, sample content, the frontend with
all SEO/GEO routes wired, CI frontmatter validation, a pre-commit hook, the chosen
adapters, the skill set (installing only what's missing), and the editor profile.

## The agent model

Wisp is driven three ways, chosen at scaffold time:

- **Skills + CLI** — marketing skills + native skills installed into your terminal coding
  agent. Human-in-the-loop.
- **Skills + MCP** — the `wisp mcp` server exposes structured tools (`create_draft`,
  `validate_post`, `publish_post`, `get_analytics`, …) to any MCP client. Headless.
- **Both** — and this unlocks a dedicated **Hermes editor profile**: a separate agent
  (its own SOUL, skills, cron, MCP connection) that owns the publication and operates
  inside the blog repo via `terminal.cwd`. Emitted as a reproducible profile distribution.

Skills come from the [coreyhaines31/marketingskills](https://www.skills.sh/coreyhaines31/marketingskills)
pack (tiered into mandatory / optional / subscription-gated) plus three native skills for
Wisp's own mechanics. The publishing core: `programmatic-seo`, `ai-seo`, `schema-markup`,
`site-architecture`, `seo-audit`, `content-strategy`, `copywriting`, `copy-editing`,
`analytics-tracking`, plus `wisp-content-schema`, `wisp-fact-check-cite`, `wisp-publish`.

## What every site emits automatically

Classic SEO: `sitemap.xml`, `robots.txt`, `feed.xml`, per-page canonical, OpenGraph +
Twitter cards, and JSON-LD (`Article`/`NewsArticle`/`BlogPosting`).

GEO, for ChatGPT / Perplexity / Claude / AI Overviews — always on: `llms.txt` +
`llms-full.txt`, a content-negotiated **`.md` version of every page** (clean source, not
hydrated DOM), `FAQPage`/`speakable` schema, author-entity E-E-A-T markup, and visible
cited sources.

## Develop

```bash
npm install            # workspace install (links @wisp/core locally)
npm run -ws typecheck  # typecheck every package
```

Requires Node 20+. The repo is an npm workspace.

## Safety model

Publishing is **PR-only**. The `publish_post` tool refuses to commit to the base branch,
never force-pushes, and only auto-merges when the repo itself allows it. The content
schema is enforced in CI and a pre-commit hook, so a malformed post cannot merge. The
editor agent is instructed never to fabricate sources.

## Known packaging step

`@wisp/core` and `@wisp/cli` currently resolve `.ts` source (great for tsx / Next /
bundlers). Before publishing to npm, add a `tsc`/`tsup` build emitting `dist/*.js` and
repoint each package's `exports` — that's the one step between this repo and
`npx`-runnable on a clean machine.

## Status

Early. The design and the three core code packages are real and tested; the default
theme, the headless content API, and deploy-on-merge are the next builds. See
[`DESIGN.md` §10](./DESIGN.md) for the roadmap.

## License

MIT.
