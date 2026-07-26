---
name: prototype
description: Builds a clearly-marked throwaway prototype to answer a design question before committing to an implementation. Use when the user wants to sanity-check whether logic or a state model feels right, explore what a UI should look like, or asks to "prototype this", "試作して".
---

# Prototype

A prototype is throwaway code that answers a question. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [references/logic.md](references/logic.md). Build a minimal interactive terminal harness that pushes the state model through cases that are hard to reason about on paper.
- **"What should this look like?"** → [references/ui.md](references/ui.md). Generate several radically different UI variants on a single route, switchable via a URL search param.

Getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, infer from the surrounding code (a backend module → logic, a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway and named as such.** Locate the prototype near the module or page it's prototyping for, but name it so a casual reader sees it's a prototype, not production.
2. **One command to run.** Whatever the project's existing task runner supports — the user should never need to remember a path.
3. **No persistence by default.** State lives in memory. Persistence is what the prototype checks, not something it depends on.
4. **Skip the polish.** No tests, no error handling beyond what's needed to run, no abstractions.
5. **Surface the full state** after every action (logic) or on every variant switch (UI), so the user sees what changed.
6. **Capture and clean up when done.** Fold the validated decision into real code, then either delete the prototype or park it on a throwaway branch out of main — don't let it linger.
