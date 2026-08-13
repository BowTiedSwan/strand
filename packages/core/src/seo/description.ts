/**
 * Meta-description budget shared by schema validation and runtime emitters.
 *
 * Bing Webmaster SEO/GEO flags descriptions outside 25–160 characters.
 * Google typically shows ~150–160. Authored post frontmatter keeps a higher
 * quality floor (50) via PostFrontmatter; site/tag/dynamic templates use the
 * Bing hard window and should pass through `metaDescription()` before emit.
 */
export const META_DESCRIPTION_MIN = 25;
export const META_DESCRIPTION_MAX = 160;
/** Authored post frontmatter floor (stricter than Bing's hard minimum). */
export const POST_DESCRIPTION_MIN = 50;

/** Collapse whitespace and clamp to maxLen on a word boundary. */
export function metaDescription(
  text: string,
  maxLen = META_DESCRIPTION_MAX,
): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.slice(0, maxLen - 1);
  const bounded = cut.includes(" ") ? cut.replace(/\s+\S*$/, "") : cut;
  return `${bounded.replace(/[\s,;:.]+$/, "")}…`;
}
