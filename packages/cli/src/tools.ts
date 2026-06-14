/**
 * Wisp MCP tool surface — Zod inputs + tool definitions.
 * `zodToJsonSchema` produces the JSON Schema the MCP protocol expects.
 *
 * Safety posture (enforced by the handlers):
 *   • Writes go through pull requests. publish_post NEVER pushes main / force-pushes.
 *   • No delete tool exists; unpublish = noindex + draft via update_post.
 *   • validate_post / list / get / search / get_analytics are side-effect free.
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const ListPosts = z.object({
  status: z.enum(["draft", "scheduled", "published", "any"]).default("any"),
  tag: z.string().optional(),
  author: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const GetPost = z.object({ slug: z.string() });

export const SearchContent = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(50).default(10),
});

// Permissive frontmatter at the tool boundary: these tools accept a *candidate*
// (possibly invalid) and run the real PostFrontmatter check inside the handler,
// returning field-level errors so an agent can self-correct instead of crashing.
const Candidate = z.record(z.unknown());

export const ValidatePost = z.object({
  slug: z.string().optional(),
  frontmatter: Candidate.optional(),
  body: z.string().optional(),
});

export const CreateDraft = z.object({
  frontmatter: Candidate,
  body: z.string().min(1),
});

export const UpdatePost = z.object({
  slug: z.string(),
  frontmatter: Candidate.optional(),
  body: z.string().optional(),
});

export const PublishPost = z.object({
  slug: z.string(),
  branch: z.string().optional(),
  prTitle: z.string().optional(),
  prBody: z.string().optional(),
  autoMerge: z.boolean().default(false),
});

export const GetAnalytics = z.object({
  slug: z.string().optional(),
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
  metrics: z
    .array(z.enum(["pageviews", "visitors", "referrers", "ai_referrers"]))
    .default(["pageviews", "visitors", "ai_referrers"]),
});

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  mutates: boolean;
}

export const TOOLS: ToolDef[] = [
  { name: "list_posts", description: "List posts with optional status/tag/author filters.", inputSchema: ListPosts, mutates: false },
  { name: "get_post", description: "Read one post's frontmatter and MDX body by slug.", inputSchema: GetPost, mutates: false },
  { name: "search_content", description: "Full-text search across posts; used to find internal-link targets.", inputSchema: SearchContent, mutates: false },
  { name: "validate_post", description: "Validate a post (on-disk by slug, or an inline candidate) against the frontmatter schema. Returns field-level errors.", inputSchema: ValidatePost, mutates: false },
  { name: "create_draft", description: "Create a new draft MDX file at content/posts/<slug>.mdx. Validates first; does not publish.", inputSchema: CreateDraft, mutates: true },
  { name: "update_post", description: "Update a post's frontmatter and/or body. Validates first; does not publish.", inputSchema: UpdatePost, mutates: true },
  { name: "publish_post", description: "Branch, commit, and open a PR for a post. Never pushes to main or force-pushes. Auto-merge only if the repo permits.", inputSchema: PublishPost, mutates: true },
  { name: "get_analytics", description: "Read analytics for a post or the whole site from the configured adapter, including AI/LLM referrers. Read-only.", inputSchema: GetAnalytics, mutates: false },
];

export function toolListPayload() {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    // No name arg + $refStrategy:none → inline { type:"object", ... } as MCP requires.
    inputSchema: zodToJsonSchema(t.inputSchema, { $refStrategy: "none" }),
    annotations: { readOnlyHint: !t.mutates },
  }));
}
