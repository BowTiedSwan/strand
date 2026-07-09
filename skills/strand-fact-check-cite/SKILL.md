---
name: strand-fact-check-cite
description: Verify factual claims in a Strand article, attach real sources, and populate the sources[] frontmatter and inline citations. Use this whenever drafting or editing factual, news, statistical, or "X vs Y" content — and whenever an article makes claims about numbers, dates, events, people, prices, laws, or studies. Use it before publishing any NewsArticle. Trust signals from real citations are a core ranking factor for both Google and AI search engines, so do not skip this for factual posts even if the user did not explicitly ask for fact-checking.
---

# strand-fact-check-cite

Programmatic blogs lose to fabrication. This skill makes every factual claim in a Strand post traceable to a real source, which is both an ethics floor and a ranking advantage — Google's E-E-A-T and LLM search engines both up-weight cited, verifiable content.

## Process

1. **Extract claims.** List every checkable assertion: numbers, dates, named events, quotes, prices, legal/regulatory statements, study findings. Opinion and analysis don't need sourcing; facts do.
2. **Verify against primary sources.** Use web search/fetch. Prefer the origin — government sites, company filings/blogs, peer-reviewed papers, official statistics — over aggregators. If two reputable sources conflict, say so in the text and cite both.
3. **Cite inline.** Attach each verified claim to a source at the point it's made (a linked reference or footnote, per the theme's citation component). Reword source material — never paste source sentences verbatim.
4. **Populate `sources[]`.** Every inline citation maps to a `sources[]` entry in frontmatter (`title`, `url`, optional `publisher`). The renderer emits these as visible references and as `citation`/`isBasedOn` JSON-LD.
5. **Flag the unverifiable.** If a claim can't be sourced, either cut it, soften it to attributed reporting ("according to …"), or mark it for human review. Do not publish an unsourced hard fact as established truth.

## Rules

- **Never invent a source, URL, statistic, date, or quote.** A plausible-looking fake citation is the worst possible failure for this project.
- A live URL you actually retrieved beats a half-remembered citation every time — fetch it.
- Quotes are last resort and kept short; paraphrase and attribute instead.
- For `NewsArticle` posts, sourcing is mandatory before `strand-publish` runs.
- Prefer dated sources for time-sensitive claims, and note "as of <date>" when a figure can change.

## Output

A draft whose factual claims are each cited inline, a complete `sources[]` frontmatter block, and a short note to the editor/human listing any claims that could not be verified and how they were handled (cut, softened, or flagged).
