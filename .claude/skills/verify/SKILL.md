---
name: verify
description: Validates plugin structure and metadata across the marketplace. Use when asked to "verify plugins", "validate plugin structure", "check plugins", or after making changes to plugin files.
---

# Verify Plugin Structure

Validate all plugins in the marketplace for correct structure and metadata.

## Steps

1. **Read marketplace.json** at `.claude-plugin/marketplace.json`. Verify it has `name`, `owner` (with `name` and `email`), and `plugins` array.

2. **For each plugin in the `plugins` array**, verify:
   - `source` path exists as a directory
   - `.claude-plugin/plugin.json` exists at the source path and contains required fields: `name`, `description`, `version`, `author`
   - `name` in plugin.json matches the `name` in the marketplace entry
   - `version` follows semver format (e.g., `0.2.0`, `1.0.0`)

3. **For each skill directory** under `plugins/<name>/skills/`:
   - `SKILL.md` exists
   - SKILL.md has YAML frontmatter with `name` and `description`
   - `description` includes trigger phrases
   - If `references/` directory exists, verify it contains at least one file

4. **Report results**:
   - List each plugin and its skills with pass/fail status
   - Summarize any issues found
   - If all checks pass, confirm the marketplace structure is valid
