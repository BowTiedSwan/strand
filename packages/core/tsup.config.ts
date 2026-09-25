import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts", "src/schema.ts", "src/loader.ts", "src/server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
});
