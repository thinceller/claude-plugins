---
name: verify-before-done
description: Runs the relevant verification and reads its output before any claim that work is done, fixed, or passing. Use when about to report completion of a code change, bug fix, refactor, or task, or before committing and creating a PR.
---

Before claiming a change is done, fixed, or passing, run the verification appropriate to it — build, tests, lint, or the actual behavior — and read what it printed.

Evidence precedes assertion: the claim quotes or summarizes what the command actually output, not what it's expected to output.

Report failures as failures, with the output that shows them. If a verification was skipped, say so — don't imply it ran. No hedged success claims ("should work now", "this probably fixes it") in place of a result.
