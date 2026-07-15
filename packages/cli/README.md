# @strand-cms/cli

The `strand` bin for [Strand](https://github.com/BowTiedSwan/strand) sites: the **MCP
server** that lets agents operate a publication with real git + filesystem operations,
and `strand validate` for CI/pre-commit content checks.

```bash
npm install --save-dev @strand-cms/cli
```

## Commands

```
strand mcp        start the Strand MCP server (stdio)
strand validate   validate post frontmatter in content/posts
```

Run from the root of a Strand site (where `strand.json` lives). `strand validate` exits
non-zero on any schema violation, so it slots straight into CI and pre-commit hooks.

## MCP server

`strand mcp` speaks MCP over stdio. Wire it into any MCP client:

```jsonc
// e.g. an MCP client config
{
  "mcpServers": {
    "strand": { "command": "npx", "args": ["strand", "mcp"], "cwd": "/path/to/your/site" }
  }
}
```

### Tools

| Tool | Mutates | What it does |
|---|---|---|
| `list_posts` | no | List posts with status/tag/author filters. |
| `get_post` | no | Read one post's frontmatter and MDX body by slug. |
| `search_content` | no | Full-text search; used to find internal-link targets. |
| `validate_post` | no | Validate a post (on disk, or an inline candidate) against the schema. Returns field-level errors so an agent can self-correct. |
| `create_draft` | yes | Create `content/posts/<slug>.mdx`. Validates first; does not publish. |
| `update_post` | yes | Update frontmatter and/or body. Validates first; does not publish. |
| `publish_post` | yes | Publish per the site's `publishMode` (see below). |
| `get_analytics` | no | Read pageviews/visitors/referrers — including AI/LLM referrers — from the configured adapter. |

## Safety model

Publication policy is the **site owner's scaffold-time decision** (`strand.json`
`publishMode`), not an agent flag — no tool argument or environment variable changes it:

- **`review`** (default) — `publish_post` branches, commits, and opens a PR; merging is
  the act of publishing. It refuses to commit to the base branch.
- **`direct`** — `publish_post` commits to the base branch and pushes.

In both modes frontmatter `status` is forced to `published` at publish time — everything
on the base branch is live. `publish_post` never force-pushes and only auto-merges when
the repo itself allows it. There is **no delete tool**; unpublish = `noindex` + draft via
`update_post`. All read tools are side-effect free.

## See also

[`@strand-cms/core`](https://www.npmjs.com/package/@strand-cms/core) — the schema and
loaders this CLI validates against. [`create-strand`](https://www.npmjs.com/package/create-strand)
scaffolds a site with this CLI, CI validation, and the pre-commit hook already wired.

MIT.
