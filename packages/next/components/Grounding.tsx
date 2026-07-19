/**
 * Verbatim grounding paragraph — the first element of the article body.
 * AI search engines quote the opening of body text, so the frontmatter
 * `summary` is rendered here verbatim (no label, no aside) where extraction
 * pipelines see it as the article's own first paragraph.
 */
export default function Grounding({ text }: { text: string }) {
  return <p className="grounding">{text}</p>;
}
