/**
 * Guard: `@strand-cms/core/schema` must stay client-safe (no node:fs).
 * Fails the build if the schema bundle ever pulls in the filesystem loader,
 * which would reintroduce the "use client imports barrel → Turbopack bundles
 * node:fs → runtime failure" break. Run as part of `npm run build`.
 *
 * It follows schema.js's own chunk imports, so loader-only chunks that tsup
 * emits for the barrel/server entries don't trip it.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const schemaPath = join(root, "schema.js");
if (!existsSync(schemaPath)) {
  console.error("check-client-safe: dist/schema.js missing — run tsup first.");
  process.exit(1);
}
const schemaSrc = readFileSync(schemaPath, "utf8");
// Follow schema.js's relative chunk imports (./chunk-*.js).
const files = new Set(["schema.js"]);
for (const m of schemaSrc.matchAll(/from\s+["'](\.\/chunk-[^"']+\.js)["']/g)) {
  files.add(m[1].slice(2));
}
const banned = ["node:fs", 'from "fs"', "from 'fs'", "readFileSync", "readdirSync", "gray-matter"];
let bad = 0;
for (const f of files) {
  const p = join(root, f);
  if (!existsSync(p)) {
    bad++;
    console.error(`check-client-safe: expected bundle file missing: dist/${f}`);
    continue;
  }
  const src = readFileSync(p, "utf8");
  for (const token of banned) {
    if (src.includes(token)) {
      bad++;
      console.error(`check-client-safe: BANNED token "${token}" found in dist/${f}`);
    }
  }
}
if (bad) {
  console.error(
    "\ncheck-client-safe: @strand-cms/core/schema is no longer client-safe. " +
      "Keep schema.ts free of node:fs / gray-matter imports.",
  );
  process.exit(1);
}
console.log(`check-client-safe: OK (${[...files].join(", ")} contain no fs/gray-matter).`);
