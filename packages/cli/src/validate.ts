import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validatePostFile } from "@wisp/core";

/** `wisp validate [dir]` — validate every post's frontmatter; exit 1 on any failure. */
export function validateCli(dir?: string): void {
  const postsDir = dir ?? join(process.cwd(), "content/posts");
  if (!existsSync(postsDir)) {
    console.error(`No posts directory at ${postsDir}`);
    process.exit(1);
  }
  let bad = 0;
  for (const f of readdirSync(postsDir).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))) {
    const r = validatePostFile(join(postsDir, f));
    if (r.ok) {
      console.log(`\u2713 ${f}`);
      continue;
    }
    bad++;
    console.error(`\u2717 ${f}`);
    for (const e of r.errors) console.error(`   ${e.path}: ${e.message}`);
  }
  if (bad) {
    console.error(`\n${bad} invalid post(s).`);
    process.exit(1);
  }
  console.log("\nAll posts valid.");
}
