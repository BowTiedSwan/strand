---
name: strand-publish
description: Commit, schedule, and publish a finished article to a Strand blog. Use this whenever an article draft is ready to go live, needs to be committed to the content repo, scheduled for a future date, or published — or whenever the user says "publish", "ship the post", "push the article", or "open a PR for this post". Always publishes via a pull request and never pushes directly to main. Use this even if the user only says "it's done" about an article they were working on.
---

# strand-publish

Operates Strand's Git-based publishing workflow. The content repo is the source of truth; every article change is a commit on a branch and a pull request. **Never push to `main` directly, never force-push, never rewrite published history.**

## Preconditions (check before publishing)

1. The post file lives at `content/posts/<slug>.mdx`.
2. Frontmatter validates against the schema. Run `strand validate <slug>` (or the MCP `validate_post` tool). If it fails, fix it with the `strand-content-schema` skill first — do **not** publish a failing post.
3. For factual or news content, `sources[]` is populated and claims are cited (use `strand-fact-check-cite`).

## Workflow

1. **Set status.**
   - Going live now → `status: published`, `publishedAt` = now (ISO 8601).
   - Future date → `status: scheduled`, `publishedAt` = the target datetime. Do not flip it to `published`; the scheduled CI run / editor cron does that at the right time.
   - Still iterating → leave `status: draft` and stop here.
2. **Branch.** `post/<slug>` (new) or `update/<slug>` (edit to a live post). One post per branch.
3. **Commit.** Stage only the post file and any author/asset files it introduces. Message: `post: <title>` or `update(<slug>): <what changed>`.
4. **Open a PR.** Title = the article title; body = a 2–3 line summary, the target publish date, and the validation result. Use the MCP `publish_post` tool if available (it wraps branch + commit + PR), otherwise `gh pr create`.
5. **Let CI run.** CI re-validates frontmatter, checks internal links, and lints JSON-LD. If CI is red, fix on the same branch — never merge red.
6. **Merge per repo policy.** Auto-merge if the repo enables it; otherwise leave for human review. Merging `main` triggers the build, which regenerates `sitemap.xml`, JSON-LD, `rss.xml`, `llms.txt`, and the `.md` endpoints.

## Rollback

Reverting a published post = a normal `git revert` of the merge commit via a new PR. Never delete history. To unpublish without deleting, set `noindex: true` and `status: draft` in a follow-up PR.

## Hard rules

- PR-only. No direct `main` writes, no force-push.
- Never publish a post that fails `validate`.
- Never invent a `publishedAt` in the past to backdate a brand-new article.
- Asset binaries go through the storage adapter, not committed as large blobs, unless the repo is configured for in-repo assets.
