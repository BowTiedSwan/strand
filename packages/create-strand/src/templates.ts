import type { Answers } from "./types";

const persona = (a: Answers) => (a.personas === "multiple" ? "maria-petrova" : "staff");

/* --------------------------------------------------------- root files */

export function gitignore(): string {
  return ["node_modules", ".next", "out", ".env", ".env.local", ".DS_Store", ""].join("\n");
}

export function projectPackageJson(a: Answers): string {
  const deps: Record<string, string> = { "@strand/core": "^0.0.1" };
  if (a.frontend === "next") {
    Object.assign(deps, {
      next: "^16.2.9", react: "^19.2.7", "react-dom": "^19.2.7",
      "@next/mdx": "^16.2.9", "@mdx-js/loader": "^3.0.0", "@mdx-js/react": "^3.0.0",
    });
  }
  if (a.subscriptions === "resend") deps["resend"] = "^4.0.0";

  const scripts: Record<string, string> = {
    validate: "node scripts/validate.mjs",
  };
  if (a.frontend === "next") Object.assign(scripts, { dev: "next dev", build: "next build", start: "next start" });

  return JSON.stringify(
    {
      name: a.projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts,
      dependencies: deps,
      overrides: a.frontend === "next" ? { postcss: "^8.5.16" } : undefined,
      devDependencies: {
        "@types/node": "^22.0.0",
        "@types/react": "^19.2.17",
        "@types/react-dom": "^19.2.3",
        typescript: "^6.0.3",
      },
    },
    null,
    2,
  ) + "\n";
}

export function tsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext",
        moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true,
        esModuleInterop: true, paths: { "@/*": ["./*"] }, plugins: [{ name: "next" }],
      },
      include: ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  ) + "\n";
}

export function nextConfig(): string {
  return `import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createMDX from "@next/mdx";

const root = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX({});
/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: { root },
  async rewrites() {
    return [{ source: "/blog/:slug.md", destination: "/blog-md/:slug" }];
  },
};
export default withMDX(nextConfig);
`;
}

export function siteConfig(a: Answers): string {
  return `import type { SiteConfig } from "@strand/core";

const config = {
  name: "${a.projectName}",
  url: "https://example.com",        // ← set your production origin (no trailing slash)
  description: "A programmatic publication built with Strand.",
  locale: "en",
  // Post <title>s are emitted absolute (no layout template applies). To brand
  // them, opt in explicitly: titleSuffix: " · ${a.projectName}",
  defaultAuthor: "${persona(a)}",
  organization: { name: "${a.projectName}" },
} satisfies Partial<SiteConfig>;

export default config;
`;
}

export function routesConfig(): string {
  return `import type { RoutesConfig } from "@strand/core";

const routes = {
  post: "/blog/{slug}",
  tag: "/tag/{tag}",
  author: "/author/{author}",
} satisfies Partial<RoutesConfig>;

export default routes;
`;
}

export function libStrand(): string {
  return `import { SiteConfig, RoutesConfig } from "@strand/core";
import { join } from "node:path";
import siteCfg from "@/site.config";
import routesCfg from "@/routes.config";

export const site = SiteConfig.parse(siteCfg);
export const routes = RoutesConfig.parse(routesCfg);
export const POSTS = join(process.cwd(), "content/posts");
export const AUTHORS = join(process.cwd(), "content/authors");
`;
}

/* ----------------------------------------------------------- content */

export function sampleAuthor(a: Answers): { file: string; body: string } {
  const id = persona(a);
  const name = a.personas === "multiple" ? "Maria Petrova" : "Editorial Staff";
  return {
    file: `${id}.mdx`,
    body: `---
id: ${id}
name: ${name}
bio: Writes for ${a.projectName}.
sameAs: []
---

${name} writes for ${a.projectName}.
`,
  };
}

export function samplePost(a: Answers): { file: string; body: string } {
  const today = new Date().toISOString();
  return {
    file: "hello-world.mdx",
    body: `---
title: "Hello, world — your first Strand post"
slug: hello-world
description: "A starter post showing the frontmatter contract, SEO fields, and the AI-search (GEO) fields Strand emits automatically."
publishedAt: "${today}"
status: published
author: ${persona(a)}
type: BlogPosting
tags: [meta, getting-started]
summary: "This starter post demonstrates Strand's schema: title, description, summary (TL;DR), FAQ, and sources — all of which feed SEO and AI-search output."
faq:
  - q: "What is Strand?"
    a: "An agent-first publishing system: articles are MDX in Git, written by agents, with SEO and AI-search built in."
sources: []
---

Welcome to your new Strand site. Replace this post with your own — or let an agent write it.

The frontmatter above is validated on commit. The \`summary\`, \`faq\`, and \`sources\`
fields are what make your content legible to AI search engines.
`,
  };
}

/* -------------------------------------------------- Next.js app dir */

export function appLayout(a: Answers): string {
  const analyticsImport = a.analytics === "none" ? "" : `import Analytics from "@/components/Analytics";\n`;
  const analyticsTag = a.analytics === "none" ? "" : "        <Analytics />\n";
  return `${analyticsImport}export const metadata = { title: "${a.projectName}" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
${analyticsTag}        {children}
      </body>
    </html>
  );
}
`;
}

export function appIndex(): string {
  return `import Link from "next/link";
import { loadPosts } from "@strand/core";
import { POSTS, routes } from "@/lib/strand";
import { postPath } from "@strand/core";

export default function Home() {
  const posts = loadPosts(POSTS);
  return (
    <main>
      <h1>Latest</h1>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={postPath(routes, p.slug)}>{p.frontmatter.title}</Link>
            <p>{p.frontmatter.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;
}

export function appBlogSlugPage(): string {
  return `import { notFound } from "next/navigation";
import { loadPost, loadAuthor, buildMetadata, postGraph } from "@strand/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  return post ? buildMetadata(post, site, routes) : {};
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  if (!post) notFound();
  const author = loadAuthor(AUTHORS, post.frontmatter.author);
  const graph = postGraph(post, author, site, routes);

  return (
    <article>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <h1>{post.frontmatter.title}</h1>
      {post.frontmatter.summary && <p className="post-summary">{post.frontmatter.summary}</p>}
      {/* Render post.body with your MDX renderer of choice (next-mdx-remote, @next/mdx). */}
      <pre>{post.body}</pre>
    </article>
  );
}
`;
}

export function appBlogSlugMd(): string {
  return `import type { NextRequest } from "next/server";
import { loadPost, loadAuthor, loadPosts, renderPostMarkdown } from "@strand/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";

export const dynamic = "force-static";

export function generateStaticParams() {
  return loadPosts(POSTS).map((post) => ({ slug: post.slug }));
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug?: string }> },
) {
  const { slug } = (await ctx.params) ?? {};

  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const post = loadPost(POSTS, slug, {});
  if (!post) return new Response("Not found", { status: 404 });

  const author = loadAuthor(AUTHORS, post.frontmatter.author);

  return new Response(renderPostMarkdown(post, author, site, routes), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
`;
}

export function appSitemap(): string {
  return `import type { MetadataRoute } from "next";
import { loadPosts, buildSitemap } from "@strand/core";
import { POSTS, site, routes } from "@/lib/strand";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(loadPosts(POSTS), site, routes).map((e) => ({
    url: e.url, lastModified: e.lastModified,
    changeFrequency: e.changeFrequency, priority: e.priority,
  }));
}
`;
}

export function appRobots(): string {
  return `import type { MetadataRoute } from "next";
import { site } from "@/lib/strand";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: \`\${site.url}/sitemap.xml\` };
}
`;
}

export function appFeed(): string {
  return `import { loadPosts, buildRss } from "@strand/core";
import { POSTS, site, routes } from "@/lib/strand";

export function GET() {
  return new Response(buildRss(loadPosts(POSTS), site, routes), {
    headers: { "content-type": "application/rss+xml" },
  });
}
`;
}

export function appLlms(): string {
  return `import { loadPosts, buildLlmsTxt } from "@strand/core";
import { POSTS, site, routes } from "@/lib/strand";

export function GET() {
  return new Response(buildLlmsTxt(loadPosts(POSTS), site, routes), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
`;
}

export function appLlmsFull(): string {
  return `import { loadPosts, loadAuthors, buildLlmsFullTxt } from "@strand/core";
import { POSTS, AUTHORS, site, routes } from "@/lib/strand";

export function GET() {
  return new Response(
    buildLlmsFullTxt(loadPosts(POSTS), loadAuthors(AUTHORS), site, routes),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
`;
}

/* ------------------------------------------------------- analytics */

export function analyticsComponent(a: Answers): string | null {
  switch (a.analytics) {
    case "plausible":
      return `export default function Analytics() {
  // Cookieless. Replace data-domain with your domain.
  return <script defer data-domain="example.com" src="https://plausible.io/js/script.js" />;
}
`;
    case "umami":
      return `export default function Analytics() {
  // Cookieless. Set NEXT_PUBLIC_UMAMI_ID.
  return <script defer src="https://cloud.umami.is/script.js"
    data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID} />;
}
`;
    case "ga4":
      return `import Script from "next/script";
const ID = process.env.NEXT_PUBLIC_GA_ID;
export default function Analytics() {
  if (!ID) return null;
  return (
    <>
      <Script src={\`https://www.googletagmanager.com/gtag/js?id=\${ID}\`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{\`
        window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());gtag('config','\${ID}',{anonymize_ip:true});
      \`}</Script>
    </>
  );
}
`;
    case "posthog":
      return `"use client";
import { useEffect } from "react";
export default function Analytics() {
  useEffect(() => {
    // Configure PostHog with person_profiles:'identified_only' for cookieless-friendly mode.
    // import posthog from "posthog-js"; posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {...});
  }, []);
  return null;
}
`;
    default:
      return null;
  }
}

/* ---------------------------------------------------- subscriptions */

export function subscribeLib(a: Answers): string | null {
  if (a.subscriptions === "none") return null;
  const map: Record<string, string> = {
    buttondown: `  const r = await fetch("https://api.buttondown.email/v1/subscribers", {
    method: "POST",
    headers: { Authorization: \`Token \${process.env.BUTTONDOWN_API_KEY}\`, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return r.ok;`,
    convertkit: `  const r = await fetch(\`https://api.convertkit.com/v3/forms/\${process.env.CONVERTKIT_FORM_ID}/subscribe\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.CONVERTKIT_API_KEY, email }),
  });
  return r.ok;`,
    resend: `  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.contacts.create({ email, audienceId: process.env.RESEND_AUDIENCE_ID! });
  return !error;`,
  };
  return `/** Subscriptions adapter: ${a.subscriptions}. Server-side only. */
export async function subscribe(email: string): Promise<boolean> {
${map[a.subscriptions]}
}
`;
}

/* ----------------------------------------------------- validation */

export function validateScript(): string {
  return `import { readdirSync } from "node:fs";
import { join } from "node:path";
import { validatePostFile } from "@strand/core";

const dir = join(process.cwd(), "content/posts");
let bad = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))) {
  const r = validatePostFile(join(dir, f));
  if (r.ok) { console.log("\\u2713 " + f); continue; }
  bad++;
  console.error("\\u2717 " + f);
  for (const e of r.errors) console.error("   " + e.path + ": " + e.message);
}
if (bad) { console.error("\\n" + bad + " invalid post(s)."); process.exit(1); }
console.log("\\nAll posts valid.");
`;
}

export function ciWorkflow(): string {
  return `name: validate-content
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run validate
`;
}

/** Secrets the chosen deploy target needs (surfaced in the README). */
export function deploySecrets(a: Answers): string[] {
  switch (a.deployTarget) {
    case "vercel": return ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"];
    case "cloudflare": return ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"];
    case "netlify": return ["NETLIFY_AUTH_TOKEN", "NETLIFY_SITE_ID"];
    case "self-host": return ["SSH_HOST", "SSH_USER", "SSH_KEY", "DEPLOY_PATH"];
  }
}

/**
 * Deploy-on-merge workflow. Validation gates every deploy; pushes to main go to
 * production, PRs get a preview where the platform supports it. The SEO/GEO
 * artifacts (sitemap, JSON-LD, llms.txt, .md endpoints) regenerate as part of
 * the build, so a merge always reships them.
 */
export function deployWorkflow(a: Answers): string | null {
  if (a.frontend === "headless") return null;

  const head = `name: deploy
on:
  push: { branches: [main] }
  pull_request:
concurrency:
  group: deploy-\${{ github.ref }}
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run validate          # gate: never deploy invalid content`;

  if (a.deployTarget === "vercel") {
    return `${head}
      # Zero-config alternative: connect the repo in the Vercel dashboard.
      - run: npm i -g vercel@latest
      - run: vercel pull --yes --environment=\${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }} --token=\${{ secrets.VERCEL_TOKEN }}
      - run: vercel build \${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=\${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt \${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --token=\${{ secrets.VERCEL_TOKEN }}
    env:
      VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
`;
  }

  if (a.deployTarget === "cloudflare") {
    return `${head}
      # Next on Cloudflare Pages uses the next-on-pages adapter.
      - run: npx --yes @cloudflare/next-on-pages@1
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .vercel/output/static --project-name=${a.projectName}
`;
  }

  if (a.deployTarget === "netlify") {
    return `${head}
      # Netlify auto-detects Next via its runtime. Dashboard git-connect also works.
      - run: npm i -g netlify-cli
      - run: netlify deploy --build \${{ github.ref == 'refs/heads/main' && '--prod' || '' }} --message "\${{ github.sha }}"
    env:
      NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
      NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
`;
  }

  // self-host
  return `${head}
      - run: npm run build
      - name: Rsync build to server (main only)
        if: github.ref == 'refs/heads/main'
        run: |
          install -m 600 /dev/stdin "$HOME/key" <<< "\${{ secrets.SSH_KEY }}"
          rsync -az --delete -e "ssh -i $HOME/key -o StrictHostKeyChecking=accept-new" \\
            .next package.json public/ \${{ secrets.SSH_USER }}@\${{ secrets.SSH_HOST }}:\${{ secrets.DEPLOY_PATH }}
          ssh -i "$HOME/key" -o StrictHostKeyChecking=accept-new \\
            \${{ secrets.SSH_USER }}@\${{ secrets.SSH_HOST }} "cd \${{ secrets.DEPLOY_PATH }} && npm ci --omit=dev && pm2 reload ${a.projectName} || true"
`;
}

export function preCommitHook(): string {
  return `#!/bin/sh
# Strand: block commits that contain invalid post frontmatter.
npm run validate || {
  echo "Commit blocked: fix the post(s) above (or use the strand-content-schema skill)."
  exit 1
}
`;
}

/* ---------------------------------------- Hermes editor profile */

export function soulMd(a: Answers): string {
  const personas =
    a.personas === "multiple"
      ? "- `maria-petrova` — local/regional news, infrastructure, policy.\n- `staff` — general explainers."
      : "- `staff` — the single house byline.";
  return `# SOUL — ${a.projectName} Editor

You are the editor of ${a.projectName}, a Strand publication. You research, write,
optimize, and publish articles to a Git-backed MDX blog. You operate inside the
blog repo (your \`terminal.cwd\`) but are a separate agent from the repo itself.

## How you work
- **Satisfy the schema first.** Before publishing, every post must pass \`npm run validate\`
  (or the MCP \`validate_post\` tool). Use \`strand-content-schema\` to write/repair frontmatter.
- **Publish through PRs only.** Use \`strand-publish\`. Branch per post, open a PR, let CI run.
  Never push to \`main\`, never force-push. Unpublish = \`noindex: true\` + \`status: draft\`.
- **Cite everything factual.** Use \`strand-fact-check-cite\`: verify against primary sources,
  cite inline, populate \`sources[]\`. **Never invent a source, URL, statistic, or quote.**
- **Optimize for Google and AI search.** Lead with the answer. Fill \`summary\` and 2–5 \`faq\`
  pairs, set \`type\` (\`NewsArticle\` for time-sensitive), and add internal links.

## House voice
Clear, concrete, plain language. No hype. Explain, cite, move on.

## Author personas
${personas}

## Boundaries
You may research the web, edit repo files, run git, and call Strand MCP tools. You do not
change infrastructure, secrets, billing, or access controls. If you can't stand behind a
claim, stop and ask.
`;
}

export function profileConfigYaml(a: Answers): string {
  const cronEnabled = a.cron ? "true" : "false";
  return `# ${a.projectName}-editor — Hermes profile config.
# Keys confirmed from Hermes docs: model, provider, toolsets, terminal.cwd, compression.
# Keys marked (verify) follow conventions — confirm against the Hermes config reference.

model:
  default: anthropic/claude-sonnet-4
provider: nous

toolsets:
  - web
  - terminal
  - skills

terminal:
  backend: local
  cwd: REPLACE_WITH_ABSOLUTE_BLOG_REPO_PATH

compression:
  enabled: true
  threshold: 0.50

skills:                 # (verify key/shape)
  preload:
    - strand-content-schema
    - strand-fact-check-cite
    - strand-publish
    - copywriting
    - copy-editing
    - content-strategy
    - programmatic-seo
    - seo-audit
    - ai-seo
    - schema-markup
    - site-architecture
    - analytics-tracking

mcp_servers:            # (verify key/shape)
  - name: strand
    type: stdio
    command: strand
    args: ["mcp"]

cron:                   # (verify key/shape)
  - name: morning-draft
    schedule: "0 7 * * 1-5"
    prompt: >
      Review the backlog and today's sources. Draft one article: research and cite it,
      fill summary + faq, validate, and open a PR. Do not auto-merge.
    enabled: ${cronEnabled}
`;
}

export function profileReadme(a: Answers): string {
  return `# ${a.projectName}-editor (Strand editor — Hermes profile distribution)

Install on any machine:

\`\`\`bash
hermes profile install github.com/you/${a.projectName}-editor --alias
nano ~/.hermes/profiles/${a.projectName}-editor/.env          # per-machine secrets
${a.projectName}-editor config set terminal.cwd /abs/path/to/${a.projectName}
${a.projectName}-editor chat
\`\`\`

Update later (keeps your .env + memories): \`hermes profile update ${a.projectName}-editor\`.

The agent publishes **via pull request only** and never fabricates sources (see SOUL.md).
`;
}

/* -------------------------------------------------------- README */

export function readme(a: Answers): string {
  const agent =
    a.agentMode === "cli" ? "Skills + CLI"
    : a.agentMode === "mcp" ? "Skills + MCP"
    : "Skills + MCP + CLI";
  return `# ${a.projectName}

An agent-first publication built with **Strand**. Articles are MDX in \`content/posts\`,
validated on commit, rendered by ${a.frontend === "next" ? "Next.js" : a.frontend} with
SEO and AI-search (GEO) built in.

## Configuration
- Frontend: **${a.frontend}**
- Analytics: **${a.analytics}**
- Subscriptions: **${a.subscriptions}**
- Agent integration: **${agent}**
- Hermes editor profile: **${a.profile === "no" ? "not provisioned" : a.profile === "dist" ? "profile distribution" : "local profile"}**

## Develop
\`\`\`bash
npm install
${a.frontend === "next" ? "npm run dev\n" : ""}npm run validate     # check all post frontmatter
\`\`\`

## Write a post
Add \`content/posts/<slug>.mdx\` with valid frontmatter (the \`strand-content-schema\` skill
does this), then \`npm run validate\`. The \`strand-publish\` skill opens the PR.

## What Strand emits automatically
\`sitemap.xml\`, \`robots.txt\`, \`feed.xml\`, \`llms.txt\`, \`llms-full.txt\`, per-post JSON-LD
(Article/FAQPage/speakable + author entity), and a clean \`.md\` version of every post at
\`/blog/<slug>.md\` for AI crawlers.

In Next.js projects, the \`.md\` surface is served by the internal
\`app/blog-md/[slug]/route.ts\` route and rewritten from \`/blog/:slug.md\`. This avoids
Next App Router edge cases with suffixed dynamic segments while preserving the public
crawler-facing URL.

## Deploy
${a.frontend === "headless"
  ? `Headless build — wire your own deploy, or expose the content API from your host.`
  : `Pushes to \`main\` deploy to **${a.deployTarget}** via \`.github/workflows/deploy.yml\`
(validation gates every deploy; PRs get a preview where supported). Add these repo secrets:

${deploySecrets(a).map((s) => `- \`${s}\``).join("\n")}

The SEO/GEO artifacts regenerate on every build, so a merge always reships them. Connecting
the repo in the ${a.deployTarget} dashboard is the zero-config alternative.`}
`;
}

export function strandJson(a: Answers): string {
  return JSON.stringify({ strand: "0.0.1", ...a }, null, 2) + "\n";
}
