---
name: write-spec
description: Synthesizes the current conversation and codebase understanding into a spec document, without interviewing. Use when the user asks to "write a spec", "turn this into a spec", "specにして", or after an interview reaches shared understanding.
---

Turn what's already been discussed into a spec. Do not interview the user — this skill synthesizes, it doesn't gather. If understanding of the problem is still thin, suggest `/grill` first and stop.

## Process

1. Explore the repo to confirm current-state understanding, if not already clear from the conversation.
2. Sketch the seams at which the feature will be tested — a seam is the public boundary where behavior gets observed (a function signature, an API response, a rendered view — not an internal call). Prefer existing seams over new ones, and the highest seam available; fewer seams is better, one is ideal. Confirm these with the user before finalizing the spec.
3. Write the spec with the sections below and save it per the doc placement protocol.

## Spec sections

- **Problem Statement** — the problem from the user's perspective.
- **Solution** — the solution from the user's perspective.
- **User Stories** — a numbered list, each as "As a `<actor>`, I want `<feature>`, so that `<benefit>`." Cover the feature extensively.
- **Implementation Decisions** — modules touched, interfaces, architectural and schema decisions, API contracts, specific interactions.
- **Testing Decisions** — what makes a good test here (external behavior, not implementation detail), which seams from step 2 get covered, and prior art for similar tests in this codebase.
- **Out of Scope** — what this spec deliberately excludes.

Leave out file paths and code snippets — they go stale fast. Exception: a snippet from a prototype that encodes a decision more precisely than prose (a state machine, reducer, schema, type shape) can be inlined under the relevant decision, trimmed to the decision-rich part and noted as prototype-derived.

## Saving the spec

Check `.claude/engineering.local.md` for a `specs:` key in its frontmatter — a path, or `none` to skip saving. If the file doesn't exist, ask once where (or whether) to save this spec, accept "don't save" as an answer, and mention `/setup-engineering` for making the choice permanent. Never write specs into CLAUDE.md or AGENTS.md.
