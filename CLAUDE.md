# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code plugins marketplace repository. Each plugin lives under `plugins/<plugin-name>/` with its own `plugin.json` and skills.

## Plugin Structure

```
.claude-plugin/marketplace.json          # Marketplace metadata (plugin registry)
plugins/<name>/.claude-plugin/plugin.json # Plugin metadata (name, description, version, author)
plugins/<name>/skills/<skill>/SKILL.md    # Skill definition
plugins/<name>/skills/<skill>/references/ # Optional reference docs for a skill
```

When adding a new plugin, register it in `.claude-plugin/marketplace.json` under the `plugins` array with `name` and `source` fields.

## Skill Development

- SKILL.md frontmatter requires: `name`, `description`. Optional: `argument-hint`, `disable-model-invocation`.
- `description` must include trigger phrases (e.g., `Use when asked to "do X", "do Y"`)
- Use `$ARGUMENTS` in the body to accept user input
- For skills with side effects (deploy, destructive ops), set `disable-model-invocation: true`
- Reference docs go in `references/` subdirectory alongside SKILL.md

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`, `test:`
- Commit messages use HEREDOC with single-quoted delimiter to prevent variable expansion:
  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add new skill
  EOF
  )"
  ```

## Versioning

Bump `version` in `plugin.json` when releasing changes to a plugin. Follow semver.
