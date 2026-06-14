import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolListPayload } from "./tools";
import { dispatch } from "./handlers";
import { loadCtx } from "./context";

export async function startServer(cwd: string = process.cwd()): Promise<void> {
  const ctx = loadCtx(cwd);
  const server = new Server(
    { name: "wisp", version: "0.0.1" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolListPayload(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      const result = await dispatch(ctx, name, args ?? {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }],
        isError: true,
      };
    }
  });

  await server.connect(new StdioServerTransport());
  // Diagnostics go to stderr so they never corrupt the stdio JSON-RPC stream.
  console.error(`wisp MCP server ready (cwd: ${ctx.cwd}, analytics: ${ctx.analytics.provider})`);
}
