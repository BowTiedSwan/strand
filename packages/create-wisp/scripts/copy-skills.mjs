// Bundle the native skills into the package so they ship in the npm tarball.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const repoSkills = join(here, "..", "..", "..", "skills");
const dest = join(here, "..", "skills");
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const s of ["wisp-publish", "wisp-content-schema", "wisp-fact-check-cite"]) {
  cpSync(join(repoSkills, s), join(dest, s), { recursive: true });
}
console.log("copied native skills -> packages/create-wisp/skills");
