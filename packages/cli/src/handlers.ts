import { TOOLS } from "./tools";
import type { Ctx } from "./context";
import {
  listPosts, getPost, searchContent, validatePost, createDraft, updatePost,
} from "./content";
import { publishPost } from "./publish";
import { getAnalytics } from "./analytics";

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/** Validate raw args against the tool's Zod schema, then run the implementation. */
export async function dispatch(ctx: Ctx, name: string, rawArgs: unknown): Promise<unknown> {
  const tool = BY_NAME.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const args = tool.inputSchema.parse(rawArgs ?? {});

  switch (name) {
    case "list_posts": return listPosts(ctx, args);
    case "get_post": return getPost(ctx, args);
    case "search_content": return searchContent(ctx, args);
    case "validate_post": return validatePost(ctx, args);
    case "create_draft": return createDraft(ctx, args);
    case "update_post": return updatePost(ctx, args);
    case "publish_post": return publishPost(ctx, args);
    case "get_analytics": return getAnalytics(ctx, args);
    default: throw new Error(`No implementation for tool: ${name}`);
  }
}
