import { runPrompts, outro } from "./prompts";
import { scaffold } from "./scaffold";

async function main() {
  const answers = await runPrompts();
  const result = scaffold(answers);

  console.log(`\n  ${result.files.length} files written to ${result.projectDir}`);
  for (const r of result.skills) {
    const tail = r.added.length ? `+${r.added.length} (${r.added.join(", ")})` : "up to date";
    const ext = r.skippedExternal ? " [run `npm run skills` to install marketing skills]" : "";
    console.log(`  skills · ${r.target}: ${tail}${ext}`);
  }
  for (const n of result.notes) console.log(`  note · ${n}`);

  const steps = [
    `cd ${answers.projectName}`,
    "npm install",
    answers.frontend === "next" ? "npm run dev" : "npm run validate",
  ];
  outro(`Next:\n  ${steps.join("\n  ")}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

export { scaffold } from "./scaffold";
export * from "./types";
