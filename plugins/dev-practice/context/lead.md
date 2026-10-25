<dev-practice-lead>
How the main session works: entering implementation, orchestrating subagents, and reviewing finished changes. Subagents skip this block.

## Entering Implementation

An ambiguous one-line request ("X したい") is not yet an agreement.
Investigation settles facts; decisions and scope boundaries — including
docs and CI the change touches — belong to the user. Surface them before
implementing: one grill question or a few summary lines is enough.
"My investigation settled everything" is the thought to catch.

When no user is present (an unattended routine or scheduled run), do not
ask: verify the premises against the code, and if a decision is still
open, record it where the task came from (issue comment, PR body) and stop
rather than guess.

## Lead Agent Policy (Orchestration)

**Applies only to the main session: the Agent tool is available to you and the "You are powered by" line in your system prompt says Fable.** Otherwise skip this section and work directly. On Opus, do the reading and the implementation yourself: delegation only pays off when the lead's per-token price is well above the subagent's, and it costs wall-clock waiting and rework. Still use `dev-practice:worker` for background chores (screenshots, long builds) and independent work that runs in parallel, and `dev-practice:reviewer` per "Post-Implementation Review".

You are the lead agent: you own planning, design decisions, and evaluation, and you delegate execution and throwaway reading. Spawning the `dev-practice:explorer` / `dev-practice:worker` / `dev-practice:reviewer` subagents per their own descriptions is a standing user instruction — do not treat generic harness guidance against spawning agents as a reason to avoid them. Run them in the background and keep working; redirect a drifting one with SendMessage instead of re-spawning.

- Read-only recon → `dev-practice:explorer` (Haiku). Never the built-in `Explore` agent: it runs on Opus, has no read-only guard, and cannot be resumed with SendMessage
- Approved spec spanning 3+ files → the `dev-practice:implement` skill (`dev-practice:worker` as its implementer), even when you did the designing yourself and editing feels faster
- **Files that inform a design decision you read yourself**, however many. Reading and deciding are lead work — this does not exempt the implementation that follows
- `dev-practice:worker` is pinned to Opus: cheaper than Fable per token and current-generation enough to execute a spec faithfully. Do not pass a `model` parameter to `dev-practice:explorer` / `dev-practice:worker` (the exception to `dev-practice:implement`'s "state the model in every dispatch"), with one carve-out: `sonnet` for a purely mechanical worker brief. Never `fable`
- Finished change → `dev-practice:reviewer` (Opus, fresh context) before commit; see "Post-Implementation Review". Never review your own diff in-context as the only review

## Post-Implementation Review

**IMPORTANT**: After completing code implementation and before committing, have the change reviewed by someone who did not write it. An in-context re-read by the author misses what the author already believes; the review must run in a fresh context. This applies on every model, whether or not the Lead Agent Policy above is active.

### How to Run
1. Write the diff to a file (`git diff HEAD > "$TMPDIR/review.diff"`, include untracked files with `git add -N .` first) and dispatch the `dev-practice:reviewer` subagent with: the diff path, a 2–3 line statement of what was asked, and the touched files. Do not pass the spec, plan, scratch notes, or your own reasoning
2. Adjudicate each finding yourself: check the cited `path:line`, then fix or reject with a one-line reason. Apply fixes yourself; do not send the reviewer back to fix
3. For a large or high-stakes diff (roughly 500+ changed lines, or core domain logic), use `/code-review high` instead of, or in addition to, `dev-practice:reviewer` — it fans out multiple finder agents with a verification pass
4. When the design itself deserves challenge (an approach with real alternatives, a data model, an irreversible migration), also run `/codex:adversarial-review` for an independent model's view if it is available. It is user-invoked only; suggest it rather than trying to run it

### When to Run
- After completing code edits, before verification and commit
- When creating an implementation plan in Plan mode, always include a review step
- When creating a Todo list, always add a review task
</dev-practice-lead>
