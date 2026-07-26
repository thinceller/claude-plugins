---
name: implement
description: Executes an implementation plan or agreed work by orchestrating fresh subagents — one implementer per task, a reviewer between tasks — while the main model plans, briefs, and evaluates without writing code itself. Use when the user asks to "implement the plan", "start implementation", "実装して", or hands over a plan or spec to execute.
---

Execute a plan, spec, or in-conversation agreement by dispatching a fresh subagent per task, reviewing each task before the next begins. The main model orchestrates; it does not write code.

## Input

Start from a plan file, a spec, or whatever was agreed in conversation. First action: turn it into a task list — one entry per independent unit of work. If the input is too vague or coupled to break into tasks, say so and suggest `write-plan` first. If the agreement exists only in your own investigation — no plan, no spec, no decisions confirmed in conversation — it is not an agreement yet: present the decisions you made and the scope boundary (including docs and CI the change touches) in a few lines and get the user's confirmation before dispatching the first subagent.

## Orchestrator stance

Per task, build a self-contained brief and dispatch it to a fresh subagent — the brief template is in [references/briefing.md](references/briefing.md). A fresh subagent has no memory of prior tasks or this conversation, so the brief carries everything it needs: objective, files, interfaces from earlier tasks, verification commands, and boundaries. Never implement the task directly, even for a change that looks trivial — the point is that every line of code passes through an implementer-then-reviewer gate.

## Per-task loop

1. Dispatch an implementer subagent with the task brief. It implements, tests, and commits, then reports back.
2. Dispatch a reviewer subagent against the resulting diff. It checks two things: spec compliance (does the diff match the brief, nothing missing, nothing extra) and code quality.
3. If the reviewer raises critical or important findings, dispatch a fix subagent with the findings, then re-review. Repeat until clean.
4. Mark the task complete and move to the next one.

## Model selection

Use the cheapest model that can do the job, and say which model explicitly in every dispatch — an unstated model silently inherits the session's default, usually the most expensive one.

- Mechanical tasks (a clear spec, one or two files, no design judgment) — cheap model.
- Integration or judgment tasks (multi-file coordination, debugging, pattern matching across the codebase) — standard model.
- Reviews scale the same way: a small mechanical diff doesn't need a capable reviewer; a subtle or risky change does.

If the environment defines dedicated implementer or reviewer agents, prefer them over a generic subagent — they're already scoped for the role.

## Continuous execution

Don't check in between tasks. Work through the full task list without pausing for progress updates — the user handed over a plan to be executed, not narrated. Stop only for a blocker a subagent can't resolve itself, an ambiguity that genuinely prevents progress, or when all tasks are done.

## Closing

Once every task is reviewed clean, `review-changes` (a whole-branch pass) and `verify-before-done` are candidates for a final check before calling the work finished.
