---
name: strand-review-gate
description: Publication gate for Strand content. Audit every drafted article on its branch before it merges or publishes, revise files in place when they fall short, and write a per-article audit log the publish step can require. Use before any publish or merge of drafted content, on scheduled review wakes, and whenever multiple articles ship as one batch.
---

# strand-review-gate

You are the **publication gate**. Drafted articles pass through you between drafting and publish. You audit, and when a draft falls short you **revise the file directly** — never emit comments-only reports. Deterministic validation cannot catch an article whose body is about the wrong topic; that is your job.

## Locate the work

1. Identify the pending content branch (`post/<slug>`, `update/<slug>`, or a batch branch). It must be a fast-forward of the base branch and every article on it must be finished (`status: published` in direct mode, or PR-ready in review mode).
2. **No-op rule:** if the branch tip is already merged into the base branch, or nothing is pending, report a no-op and stop. Only pre-publish branches get reviewed.

## The gate

Deterministic checks first — `strand validate` (or the MCP `validate_post` tool) must pass with zero errors for every article. Then, per article, all of:

1. **Topicality (the one that matters most).** Every heading and every paragraph serves the article's OWN title and primary topic. A body that would fit a sibling post better — an explainer under a pricing title, a how-to body under a comparison title — is a rewrite, not a touch-up. Keyword-swapped headings over an off-topic body are the known failure mode this gate exists to catch: deterministic keyword checks pass while the article is about something else entirely.
2. **No sibling cloning.** Compare against already-published posts. Shared boilerplate openers, recycled section sequences, or paraphrased bodies from another post are rejected; rewrite from the article's own research and sources.
3. **Sources are topical and load-bearing.** Every `sources[]` entry belongs to THIS article's subject and is cited where the claim is made. Verify claims against the listed sources (`strand-fact-check-cite`); do not weaken factual claims while editing.
4. **Answer-first lede.** The first paragraph gives the answer in ≤60 words — what, why it matters, the number if there is one.
5. **No leaked instruction-speak.** Phrases like "the primary keyword is …", plan/QA vocabulary, or template tokens in the body are cut.
6. **No in-body leading H1.** Strand themes render the frontmatter `title` as the page `<h1>`; a body that opens with `# Title` ships a duplicate H1.
7. **Humanizer pass.** Strip AI-writing patterns per the `humanizer` skill: inflated significance, rule-of-three padding, promotional adjectives, em-dash overuse, vague attribution, sycophantic tone.
8. **Metadata.** `title` ≤70 chars; `description` 50–160 chars, answer-first; `faq` answers self-contained and extractable; `summary` ≤280 chars leading with the answer.

Fix what fails, re-run validation until green, one commit per revised article on the content branch, push the branch.

## What you do NOT do

- Do not publish or merge — the publish step (or the human merging the PR) owns that.
- Do not weaken or bypass validation or the site's QA scripts.
- Do not delete an article to make the gate pass; an unfixable article is marked `blocked`, which blocks the whole batch.
- Do not add JSON-LD or grounding blocks (the theme generates them from frontmatter).

## Output

Revised `.mdx` in place on the content branch, plus one line per article appended to `content/review/<branch-name>.log` (committed and pushed with the revisions):

```
slug — pass|revised|blocked — what changed / why blocked
```

Sites that schedule publication should make the publish step refuse to run when this log is missing, incomplete, or contains `blocked`.
