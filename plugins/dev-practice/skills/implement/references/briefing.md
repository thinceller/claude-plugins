# Task Brief Template

Give the implementer subagent exactly these fields — nothing from the wider plan or conversation.

- **Objective** — what this task accomplishes and how to know it's done (success criteria, not just a description).
- **Files in scope** — exact paths to create or modify.
- **Interfaces** — exact signatures this task consumes from earlier tasks and produces for later ones. Names and types, not descriptions.
- **Verification** — the exact command(s) to run and the expected result.
- **Out of scope** — what not to touch, so the subagent doesn't wander into adjacent cleanup.
- **Report format** — what to return: status (done / blocked / needs context), files changed, verification output, any concerns.

## Worked example

> **Objective**: Add a `slugify(title: string): string` helper that converts a post title into a URL-safe slug. Done when lowercase, non-alphanumeric runs collapse to a single hyphen, and leading/trailing hyphens are stripped.
>
> **Files in scope**: `src/lib/slugify.ts` (new), `src/lib/slugify.test.ts` (new).
>
> **Interfaces**: exports `function slugify(title: string): string`. `src/routes/posts.ts` will import this from `src/lib/slugify` in a later task — the name and signature must match exactly.
>
> **Verification**: `npm test -- slugify` passes, covering at minimum: mixed case, punctuation, repeated separators, and leading/trailing whitespace.
>
> **Out of scope**: don't wire `slugify` into `posts.ts` — that's a separate task.
>
> **Report format**: status; files changed; test command and pass/fail counts; any edge cases you weren't sure how to handle.
