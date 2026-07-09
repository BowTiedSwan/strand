# &lt;blog&gt;-editor — Strand editor (Hermes profile distribution)

A dedicated Hermes agent that researches, writes, SEO/GEO-optimizes, and publishes
articles to a Strand blog. It is **separate from the blog content repo** — its only
link to the blog is `terminal.cwd` in `config.yaml`.

This package ships the **SOUL, config, skills, cron, and MCP connection**.
**Credentials, memories, and sessions stay on your machine** (`.env`, `state.db`).

## Install

```bash
# Install the whole agent from this git repo and create a command alias.
hermes profile install github.com/you/<blog>-editor --alias

# Configure per-machine secrets (model/provider keys, optional gateway tokens).
nano ~/.hermes/profiles/<blog>-editor/.env

# Point the agent at your local blog checkout.
<blog>-editor config set terminal.cwd /absolute/path/to/blog-repo

# Go.
<blog>-editor chat
```

## Update later (keeps your .env + memories)

```bash
hermes profile update <blog>-editor
```

## What it can do out of the box

- `<blog>-editor chat` — interactive editing/publishing session.
- Skills auto-register as slash commands, e.g. `/strand-publish`, `/ai-seo`, `/schema-markup`.
- Calls the Strand MCP tools (`create_draft`, `validate_post`, `publish_post`, `get_analytics`, …).
- Optional `morning-draft` cron (disabled by default — enable in `config.yaml`).
- Optional Telegram/Discord gateway — add a token in `.env` and `:` `<blog>-editor gateway start`.

## Local fallback (no git repo)

If you'd rather create the profile directly instead of from this distribution:

```bash
hermes profile create <blog>-editor \
  --description "Researches, writes, SEO/GEO-optimizes and publishes articles to the Strand MDX repo."
# then copy SOUL.md + config.yaml into ~/.hermes/profiles/<blog>-editor/
# and run the Strand skill resolver to sync the skill set.
```

## Safety

The agent publishes **via pull request only** — it never pushes to `main`, never
force-pushes, and never fabricates sources. See `SOUL.md` for the full editorial
contract.
