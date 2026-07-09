---
name: strand-content-schema
description: Write or repair the frontmatter of a Strand article so it validates and is correctly structured for SEO and AI-search. Use this whenever creating a new Strand post, editing an existing post's frontmatter, or before publishing — and whenever a validation error mentions frontmatter, schema, slug, meta description, or required fields. Use it even when the user just asks to "write an article for the blog", because the frontmatter contract must be satisfied for the post to publish at all.
---

# strand-content-schema

Every Strand post is an MDX file at `content/posts/<slug>.mdx` whose YAML frontmatter must satisfy `PostFrontmatter` (defined in `packages/core/schema.ts`). A post that does not validate cannot be committed or merged. Write frontmatter to pass on the first try, then self-check with `strand validate <slug>` or the MCP `validate_post` tool.

## Required vs optional fields

**Required:** `title`, `slug`, `description`, `publishedAt`, `author`.
**Defaulted (safe to omit):** `status` (`draft`), `tags` (`[]`), `type` (`BlogPosting`), `noindex` (`false`), `faq` (`[]`), `sources` (`[]`).
**Optional:** `updatedAt`, `canonicalUrl`, `featureImage`, `og`, `summary`.

## Rules that commonly trip validation

- `title` ≤ 70 characters (SEO title length). Write for the SERP, not just the page.
- `description` 50–160 characters. This is the meta description — make it a real summary with the primary keyword, not filler.
- `slug` is kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`. No spaces, capitals, underscores, or trailing hyphens. It must match the filename.
- `publishedAt` / `updatedAt` are ISO 8601 datetimes.
- `author` must reference an existing `content/authors/<id>.mdx`. Create the author file if the persona is new.
- `featureImage.alt` is required when `featureImage` is present (accessibility + image SEO).

## Get the GEO fields right (they are why this project exists)

- `summary` — a ≤280-char TL;DR. It powers `speakable` schema and is the snippet AI search engines extract. Lead with the answer.
- `type` — use `NewsArticle` for time-sensitive news, `BlogPosting` otherwise. This drives the JSON-LD type.
- `faq` — 2–5 genuine question/answer pairs that match how people actually query. Emitted as `FAQPage` schema and frequently surfaced verbatim by AI search.
- `sources` — every external factual claim should map to an entry here (see `strand-fact-check-cite`). Cited posts are trusted more by both Google and LLMs.

## Example

```yaml
---
title: "Bulgaria's 2026 EV Charging Grid: What Changed"
slug: bulgaria-2026-ev-charging-grid
description: "A plain-language look at Bulgaria's 2026 EV charging expansion: new fast-charger counts, grid funding, and what it means for drivers."
publishedAt: "2026-06-05T08:00:00Z"
author: maria-petrova
type: NewsArticle
tags: [bulgaria, ev, infrastructure]
summary: "Bulgaria added X fast chargers in 2026 under EU grid funding, concentrated on the A1/A2 corridors; rural coverage still lags."
faq:
  - q: "How many public EV chargers does Bulgaria have in 2026?"
    a: "Roughly N, up from M in 2025, with most growth on motorway corridors."
sources:
  - title: "Ministry of Energy 2026 infrastructure report"
    url: "https://example.gov.bg/report-2026"
    publisher: "Ministry of Energy"
---
```

After writing frontmatter, always run validation and fix any reported field before handing off to `strand-publish`.
