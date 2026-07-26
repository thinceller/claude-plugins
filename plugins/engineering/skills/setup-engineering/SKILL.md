---
name: setup-engineering
description: Configures this repository for the engineering skills by writing .claude/engineering.local.md — where specs, plans, and ADRs are saved, if at all — and excluding it from git locally. Run once per repository before relying on doc-saving skills.
disable-model-invocation: true
---

# Setup Engineering

Scaffold `.claude/engineering.local.md`, the per-repo config that `write-spec`, `write-plan`, and `record-adr` read to know where — if anywhere — to save their output.

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the repo before asking anything:

- `docs/` layout — existing subdirectories for specs, plans, or design docs
- Existing ADR directories — `docs/adr/`, `docs/decisions/`, or similar, and whether entries are already numbered
- Existing spec/plan conventions — a `SPEC.md`, `PLAN.md`, or a docs folder with dated files
- Monorepo signals — `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or populated `packages/*/docs` — these suggest per-package paths might fit better than repo-root ones
- Whether `.claude/engineering.local.md` already exists — if so, this run is a redo, not a first setup

### 2. Present findings and confirm

Summarize what's present and missing, then propose one value per key, leading with the recommendation so the user can accept in a word. If `.claude/engineering.local.md` already exists, present its current values as the default for each key, and fall back to fresh exploration only to fill in whatever is missing.

- `specs:` — where spec documents go (an existing specs-shaped directory if found, otherwise `docs/specs`, or `none` to skip saving)
- `plans:` — where implementation plans go (same logic, e.g. `docs/plans`)
- `adr:` — where ADRs go (an existing ADR directory if found, otherwise `docs/adr`)

Ask about project notes only if exploration surfaced something worth recording (a non-obvious doc convention, a naming rule); otherwise leave the notes body empty and mention it can be filled in later.

Show the confirmed values and let the user edit before writing.

### 3. Write

Write `.claude/engineering.local.md` from [references/config-template.md](references/config-template.md), filling in the three keys and any notes.

Then check `.git/info/exclude` for a `.claude/engineering.local.md` line with grep, appending it only if absent. Leave `.gitignore`, `CLAUDE.md`, and `AGENTS.md` untouched — this file is local-only config, not a project convention worth sharing.

### 4. Done

Tell the user the file can be edited directly going forward — re-running this skill is only needed to start over.
