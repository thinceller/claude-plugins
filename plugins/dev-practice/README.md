# dev-practice

Working discipline, role subagents, and a few skills for code changes, packaged so they behave the same in a local session, a cloud session, and a cloud thread in a Claude project.

## Why a plugin

A cloud session and a project thread never see your `~/.claude/CLAUDE.md`, `~/.claude/agents/`, or the plugins your machine or the repository's `.claude/settings.json` turns on. A project thread also skips the repository's `.claude/skills/`, `.claude/agents/`, and hooks. The one carrier that reaches all three is a plugin turned on for your claude.ai account: its skills, hooks, subagents, and the PreToolUse hooks that scope themselves to those subagents all load. So the discipline that used to live in the user-level `CLAUDE.md` lives here, injected by hooks.

Locally, keep the plugin turned on through the marketplace as well. A marketplace copy wins over the synced copy of the same name, so the two don't load twice, and it lets you try changes from a working tree with `claude --plugin-dir plugins/dev-practice`.

## What it contains

| Part | What it does |
| --- | --- |
| `context/lead.md` | Main session only, at `SessionStart`: entering implementation (an ambiguous one-line request is not yet an agreement; unattended runs record open decisions and stop), the Lead Agent Policy (active only on Fable), and post-implementation review |
| `context/discipline.md` | Main session at `SessionStart`, and every subagent at `SubagentStart`: design priorities, avoiding over-engineering, comment rules, the refactoring checklist, and verification |
| `context/skill-map.md` | Main session at `SessionStart`: the catalog below |
| `dev-practice:explorer` | Read-only investigator for sweeping reads and throwaway output (Haiku) |
| `dev-practice:worker` | Executes an agreed spec faithfully and reports deviations instead of deciding them (Opus) |
| `dev-practice:reviewer` | Fresh-context adversarial review of a finished diff (Opus, read-only) |
| `grill` | One-question-at-a-time interview that sharpens a plan, decision, or idea |
| `write-plan` | Turns agreed work into self-contained, subagent-ready tasks |
| `implement` | Runs a plan with a fresh `dev-practice:worker` per task and a review between tasks |
| `tdd` | Test-first at seams agreed before the tests are written |
| `verify-before-done` | Runs the relevant verification and reads its output before claiming done |

## How the hooks work

- `SessionStart` (startup, resume, clear, compact, fork) prints the lead and discipline text in one hook and the skill map in another, so each stays under the 10,000-character cap on a hook's output.
- `SubagentStart` returns the discipline text as `additionalContext`, because `SessionStart` output reaches only the main conversation and a subagent ignores a hook's plain stdout.
- `PreToolUse` on Bash runs `hooks/readonly-guard.sh`. A plugin hook fires for every Bash call in the session, so the script exits early unless the caller is `dev-practice:explorer` or `dev-practice:reviewer`, and then allows only read-only commands. Frontmatter `hooks` in a plugin subagent are ignored, which is why the guard lives here rather than in the agent files.

The hooks inject in every repository, including ones that hold no code. A gate was considered and left out: checking for build files misses repositories like this one, and a per-repository opt-out in `.claude/settings.json` is not read by project threads. The text costs roughly 2,500 tokens per session.
