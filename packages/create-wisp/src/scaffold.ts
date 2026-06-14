import { mkdirSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import type { Answers, ScaffoldOptions } from "./types";
import { syncSkills, type SkillReport } from "./skills";
import * as t from "./templates";

function write(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export interface ScaffoldResult {
  projectDir: string;
  files: string[];
  skills: SkillReport[];
  profileDir?: string;
  notes: string[];
}

export function scaffold(a: Answers, opts: ScaffoldOptions = {}): ScaffoldResult {
  const cwd = opts.cwd ?? process.cwd();
  const dir = join(cwd, a.projectName);
  const files: string[] = [];
  const notes: string[] = [];
  const w = (rel: string, content: string) => {
    write(join(dir, rel), content);
    files.push(rel);
  };

  if (existsSync(dir) && !opts.dryRun) {
    throw new Error(`Directory already exists: ${dir}`);
  }

  /* ---- root ---- */
  w(".gitignore", t.gitignore());
  w("package.json", t.projectPackageJson(a));
  w("tsconfig.json", t.tsconfig());
  w("site.config.ts", t.siteConfig(a));
  w("routes.config.ts", t.routesConfig());
  w("lib/wisp.ts", t.libWisp());
  w("scripts/validate.mjs", t.validateScript());
  w(".github/workflows/validate.yml", t.ciWorkflow());
  const deploy = t.deployWorkflow(a);
  if (deploy) w(".github/workflows/deploy.yml", deploy);
  w("README.md", t.readme(a));
  w("wisp.json", t.wispJson(a));

  /* ---- content ---- */
  const author = t.sampleAuthor(a);
  w(`content/authors/${author.file}`, author.body);
  const post = t.samplePost(a);
  w(`content/posts/${post.file}`, post.body);

  /* ---- frontend ---- */
  if (a.frontend === "next") {
    w("next.config.mjs", t.nextConfig());
    w("app/layout.tsx", t.appLayout(a));
    w("app/page.tsx", t.appIndex());
    w("app/blog/[slug]/page.tsx", t.appBlogSlugPage());
    w("app/blog/[slug].md/route.ts", t.appBlogSlugMd());
    w("app/sitemap.ts", t.appSitemap());
    w("app/robots.ts", t.appRobots());
    w("app/feed.xml/route.ts", t.appFeed());
    w("app/llms.txt/route.ts", t.appLlms());
    w("app/llms-full.txt/route.ts", t.appLlmsFull());
    const analytics = t.analyticsComponent(a);
    if (analytics) w("components/Analytics.tsx", analytics);
  } else if (a.frontend === "headless") {
    notes.push(
      "Headless mode: no app/ scaffolded. Import loadPosts/loadPost from @wisp/core in your " +
        "own frontend, or expose content via a JSON route. lib/wisp.ts is ready to use.",
    );
  } else if (a.frontend === "astro") {
    notes.push(
      "Astro selected: config + content + validation are scaffolded; wire @wisp/core into your " +
        "Astro pages (the generators are framework-agnostic — see @wisp/core/INTEGRATION.md).",
    );
  }

  /* ---- subscriptions ---- */
  const sub = t.subscribeLib(a);
  if (sub) w("lib/subscribe.ts", sub);

  /* ---- git hook ---- */
  w(".husky/pre-commit", t.preCommitHook());
  if (!opts.dryRun) {
    try { chmodSync(join(dir, ".husky/pre-commit"), 0o755); } catch { /* noop */ }
  }

  /* ---- Hermes editor profile ---- */
  let profileDir: string | undefined;
  if (a.profile !== "no") {
    profileDir = join(dir, `${a.projectName}-editor`);
    write(join(profileDir, "SOUL.md"), t.soulMd(a));
    write(join(profileDir, "config.yaml"), t.profileConfigYaml(a));
    write(join(profileDir, "README.md"), t.profileReadme(a));
    files.push(`${a.projectName}-editor/SOUL.md`, `${a.projectName}-editor/config.yaml`, `${a.projectName}-editor/README.md`);
    if (a.profile === "dist") {
      notes.push(
        `Hermes editor emitted as a profile distribution at ./${a.projectName}-editor — ` +
          `push it as its own git repo and install with: hermes profile install <repo> --alias`,
      );
    } else {
      notes.push(
        `Hermes editor files written to ./${a.projectName}-editor — copy SOUL.md + config.yaml ` +
          `into ~/.hermes/profiles/${a.projectName}-editor/ (set terminal.cwd to this repo).`,
      );
    }
  }

  /* ---- skills (native copied; marketing via npx, skipped in dry-run) ---- */
  // Resolve the native skills dir across layouts: bundled in the published
  // package (<pkg>/skills, reached as ../skills from dist/ or src/) or the
  // monorepo source of truth (repo/skills, ../../../skills in dev).
  const nativeSrc = [
    join(import.meta.dirname, "..", "skills"),
    join(import.meta.dirname, "..", "..", "skills"),
    join(import.meta.dirname, "..", "..", "..", "skills"),
  ].find((p) => existsSync(join(p, "wisp-publish"))) ?? join(import.meta.dirname, "..", "skills");
  const skills = syncSkills(a, dir, nativeSrc, opts.dryRun);

  /* ---- git init ---- */
  if (a.gitInit && !opts.dryRun) {
    try {
      execSync("git init -q", { cwd: dir });
      execSync("git add -A", { cwd: dir });
      execSync('git commit -q -m "chore: scaffold Wisp site"', { cwd: dir });
    } catch { notes.push("git init skipped (git not available or commit failed)."); }
  }

  return { projectDir: dir, files, skills, profileDir, notes };
}
