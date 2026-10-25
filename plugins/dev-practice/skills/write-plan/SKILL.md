---
name: write-plan
description: Turns an agreed spec or conversation into an implementation plan of self-contained tasks ready for subagent delegation. Distinct from Claude Code's built-in plan mode. Use when the user asks to "make an implementation plan", "break this into tasks", "計画を立てて", or before multi-task implementation work.
---

Turn an agreed spec or conversation into a plan a fresh subagent can execute one task at a time, with no other context.

## Global constraints

State project-wide requirements once, at the top of the plan — versions, naming conventions, style rules, anything that applies to every task. Every task's requirements implicitly include this section; don't repeat it per task.

## Task breakdown

A task is self-contained when a fresh subagent, given only that task's text, has everything it needs to do the work and know when it's done. That's the only sizing rule — no fixed step count or timing.

Each task states:

- **Goal** — what this task accomplishes.
- **Files** — exact paths to create or modify.
- **Interfaces** — what this task consumes from tasks it depends on (exact signatures, not descriptions) and what it produces for tasks that depend on it. This is how a task's implementer learns the names and types neighboring tasks use, without reading those tasks.
- **Verification** — the exact command to run and the expected result.

## No placeholders

Every task needs the actual content an implementer needs to act on. These are plan failures:

- "TBD", "handle edge cases", "add appropriate validation"
- "Similar to Task N" (write it out — the implementer may work tasks out of order)
- References to types or functions not defined in any task

## Self-review

Before finalizing, check the plan against the spec: does every requirement map to a task? Do names and signatures used in later tasks match what earlier tasks define? Fix inline rather than re-reviewing.

## Saving the plan

Follow the repository's convention for where plans go if it states one (CLAUDE.md, a docs README, or a `plans:` key in `.claude/engineering.local.md`). Otherwise ask once where (or whether) to save this plan, and accept "don't save" as an answer. Never write plans into CLAUDE.md or AGENTS.md.

Once the plan is saved, `implement` is a candidate for executing it.
