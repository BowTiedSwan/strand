import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/bin.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  target: "es2022",
  banner: { js: "#!/usr/bin/env node" },
  external: ["@modelcontextprotocol/sdk", "@strand-cms/core", "gray-matter", "zod", "zod-to-json-schema"],
});
