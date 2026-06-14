import { startServer } from "./server";
import { validateCli } from "./validate";

const cmd = process.argv[2];

async function main() {
  switch (cmd) {
    case "mcp":
      await startServer();
      break;
    case "validate":
      validateCli(process.argv[3]);
      break;
    default:
      console.log("Usage: wisp <command>\n\n  mcp        start the Wisp MCP server (stdio)\n  validate   validate post frontmatter in content/posts");
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
