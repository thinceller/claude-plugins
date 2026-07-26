# engineering

A set of loosely-coupled software engineering skills for Claude Code. Each skill is useful on its own — enter at any point, skip any step, chain a few together, or use none of them. Nothing here enforces a pipeline. The catalog spans the parts of a change that tend to need the most deliberate handling: sharpening requirements, writing specs and plans, executing them, debugging, and reviewing — not deployment, infrastructure, or project management.

## Design stance

This plugin is meant to replace [superpowers](https://github.com/obra/superpowers) in day-to-day use, keeping the parts that earn their keep and dropping the rest. It keeps the subagent execution loop for implementation — fresh subagent per task, a reviewer between tasks, the main model planning and evaluating rather than writing code — and it keeps phase-shaped guidance for planning and review. What it drops is superpowers' fixed pipeline and its enforcement tone: no mandatory sequence of skills, no capitalized directives insisting a step happen.

In place of that, it borrows the concision of [mattpocock/skills](https://github.com/mattpocock/skills): a relentless one-question-at-a-time interview for sharpening ideas, agreeing on test seams before writing tests, and a feedback-loop-first discipline for debugging. It also adopts a two-axis review — spec compliance and repo standards, checked separately — rather than one review pass trying to do both jobs at once.

The instructions throughout favor advisory guidance over emphatic enforcement, in line with current Claude prompting practice: describe what good looks like and trust the model to apply judgment, rather than trying to force behavior with capitalized directive words. Where a superpowers-style skill might insist a step is mandatory, the equivalent instruction here reads more like "run the relevant verification and read its output before claiming the work is done" — a description of good practice, not a command backed by emphasis. That gives more autonomy to the model using these skills, at the cost of fewer rigid guarantees — a trade this plugin makes deliberately.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `grill` | A relentless one-question-at-a-time interview that sharpens a plan, decision, or idea until shared understanding is reached — not limited to software. |
| `write-spec` | Synthesizes the current conversation and codebase understanding into a spec document, without interviewing. |
| `write-plan` | Turns an agreed spec or conversation into an implementation plan of self-contained tasks ready for subagent delegation. |
| `implement` | Executes an implementation plan or agreed work by orchestrating fresh subagents — one implementer per task, a reviewer between tasks — while the main model plans, briefs, and evaluates without writing code itself. |
| `diagnose-bug` | A feedback-loop-first discipline for diagnosing hard bugs and performance regressions. |
| `tdd` | Test-first development anchored on pre-agreed seams — agree where tests will live before writing them, then run the red-green loop. |
| `review-changes` | Reviews the diff since a fixed point along two axes run as parallel subagents — Spec (does the change match what was asked?) and Standards (repo conventions plus a code-smell baseline) — and reports them side by side. |
| `verify-before-done` | Runs the relevant verification and reads its output before any claim that work is done, fixed, or passing. |
| `prototype` | Builds a clearly-marked throwaway prototype to answer a design question before committing to an implementation. |
| `record-adr` | Creates an Architecture Decision Record for a decision that is hard to reverse, surprising without context, and the result of a real trade-off. |
| `setup-engineering` | Configures this repository for the engineering skills by writing `.claude/engineering.local.md` — where specs, plans, and ADRs are saved, if at all — and excluding it from git locally. Run once per repository before relying on doc-saving skills. |

## Typical flows

**Feature work:** `grill` → `write-spec` → `write-plan` → `implement`.

1. `grill` interviews the idea one question at a time until the shape of the feature is clear.
2. `write-spec` turns that shared understanding into a spec document, without re-interviewing.
3. `write-plan` breaks the spec into self-contained tasks sized for subagent delegation.
4. `implement` executes the plan, spawning a fresh subagent per task with a reviewer between tasks.

**Bug work:** `diagnose-bug`, then a fix.

1. `diagnose-bug` runs a feedback-loop-first discipline: reproduce, narrow, form a hypothesis, test it, repeat, rather than guessing at a fix from the symptom alone.
2. Once the root cause is confirmed, fix it directly, or hand it to `implement` if the fix touches enough files to be worth breaking into subagent-sized tasks.

Neither flow is a requirement. Starting straight from `write-plan` because a spec already exists, skipping `grill` when the idea is already clear, or stopping after `write-spec` without ever running `implement`, are all expected usage rather than shortcuts being taken.

The remaining skills — `tdd`, `review-changes`, `verify-before-done`, `prototype`, and `record-adr` — are reached for as the situation calls for them, not as fixed stages of either flow. A mid-implementation TDD cycle, a review requested on a branch nobody planned with these skills, a quick prototype to settle a design question before `write-spec` is even run, and an ADR for a decision made outside any flow, are all normal.

## Configuration

`write-spec`, `write-plan`, and `record-adr` look for `.claude/engineering.local.md` to know where — if anywhere — to save the documents they produce. It has three keys:

- `specs` — where spec documents go, or `none` to skip saving
- `plans` — where implementation plans go, or `none` to skip saving
- `adr` — where ADRs go (ADRs are always saved)

Run `/setup-engineering` once per repository to generate this file. It explores the repo first — existing `docs/` layout, ADR directories, spec or plan conventions, monorepo signals — then proposes a value for each key and confirms with you before writing anything. A generated file looks roughly like:

```markdown
---
specs: docs/specs
plans: docs/plans
adr: docs/adr
---

## Notes for engineering skills

<!-- e.g. Specs and plans should reference the relevant ticket ID. -->
```

The file stays out of git via a line in `.git/info/exclude`, not `.gitignore`: it holds machine-local preferences about where one contributor likes their docs saved, not a convention the rest of the team needs to share. Re-running `/setup-engineering` overwrites it; editing it directly works too, and is the normal way to change a value afterward.

## How it works

A `SessionStart` hook prints a condensed version of the skill catalog above at the start of a session (and after `/clear` or a context compaction), so the model has the full list of what's available and the typical flows without needing to open this file or any individual `SKILL.md`. Each skill still describes its own trigger phrases in its own frontmatter — the hook is a reminder of what exists, not a router. The hook also carries one piece of entry guidance: an ambiguous one-line request is not yet an agreement — decisions and scope boundaries get surfaced to the user before `implement` is entered. If `.claude/engineering.local.md` exists, the hook also points at it so doc-placement settings are surfaced early rather than discovered mid-task.

## Requirements

Designed for Claude Code with subagent support. `implement` and `review-changes` in particular rely on spawning fresh subagents — one implementer per task, or parallel Spec and Standards reviewers — to keep the main model's own context focused on planning and evaluation rather than execution. Without subagent support, treat those two skills as guidance for structuring the work yourself rather than as literal instructions to spawn anything.
