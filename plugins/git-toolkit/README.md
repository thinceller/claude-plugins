# git-toolkit

Four skills for the parts of a git workflow that need judgment: deciding what belongs in a commit, writing what the diff cannot show, and integrating two changes that landed on the same lines.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `commit-staged-changes` | Reviews the staged diff, generates a commit message from it, and commits. Never stages anything itself. |
| `auto-group-commit` | Analyzes the whole working tree, groups it into semantic commits at hunk granularity, and commits them in order after approval. |
| `create-pr` | Opens a GitHub PR with `gh`: detects the base branch and PR template, composes a body about intent rather than files, pushes, and reports the URL. |
| `resolve-merge-conflicts` | Resolves merge and rebase conflicts by reading why each side changed, integrating both intents, then verifying the tree builds before completing. |

`commit-staged-changes` is the narrow one — it reads `git diff --cached`, infers the change type, and commits. Pass a language (`japanese`, `ja`, …) to write the message in it.

`auto-group-commit` is the wide one. It unstages everything first so the analysis sees a uniform tree, splits a single file's hunks across different commits when they serve different purposes, then prints the full plan and waits. `--yes` skips the wait; `--lang` sets the message language. During execution it re-reads each file's diff before staging, because line numbers shift as commits land. Patch construction is documented in `references/patch-format-example.md`.

`create-pr` fills a repository PR template when it finds one and otherwise falls back to Why / What / Test Plan. The body rules are the substance of the skill: write only what is invisible in the diff, never enumerate changes file by file, and match length to the change. For UI changes where seeing the result helps the reviewer, it attaches screenshots via `gh pr create --attach`. Pass `draft` to open it as a draft.

`resolve-merge-conflicts` works whether you are already mid-conflict or want it to start the merge or rebase. It handles both states, including the ours/theirs swap between them (`references/conflict-markers.md`), and runs typecheck, lint, or tests on the touched files before `git commit --no-edit` or `git rebase --continue`.

## Design stance

**One skill, one irreversible step.** Commit skills commit and stop — they do not push and do not open a PR. `create-pr` is the only skill that pushes, and only the current branch. Conflict resolution stays entirely local. This means a wrong call costs a `git reset`, not a force-push.

**The staging area is the user's statement of intent.** `commit-staged-changes` refuses to auto-stage even when unstaged changes are sitting right there. If you staged three files, you meant three files. `auto-group-commit` exists precisely for when you have not made that decision yet, and it makes the decision explicit by printing a plan and asking.

**Approval gates where the answer is a judgment call, not everywhere.** Hunk-level grouping is one, so `auto-group-commit` blocks on it. Semantically incompatible conflicts are another, so `resolve-merge-conflicts` stops and shows both sides rather than guessing. Under `--yes` the grouping plan is still printed — not to be read before the fact, but so the transcript shows what was committed and why.

**Conflicts are integrated, not picked.** Two changes touching the same lines usually both need to survive. The skill reads `git log` and `git blame` on each side to recover intent, and blanket `-X ours` / `-X theirs` is off-limits except for regenerated files where one side is unambiguously correct. It also refuses to finish with markers left in the tree or checks failing, which is the failure mode that turns a resolved conflict into a broken main branch.

**No force-push, no destructive operations, anywhere.** Every abort path (`git merge --abort`, `git rebase --abort`, a mid-sequence stop in `auto-group-commit`) leaves already-committed work in history and the rest in the working tree.

There is no `SessionStart` hook and no config file. The skills surface through their own descriptions when a commit, PR, or conflict is actually in front of you.

## Typical flow

`auto-group-commit` (or `commit-staged-changes`) → `create-pr`, with `resolve-merge-conflicts` whenever a merge or rebase stops partway.

1. Work accumulates in the tree. `auto-group-commit` splits it into commits, or `commit-staged-changes` commits what you staged deliberately.
2. `create-pr` pushes the branch and opens the PR.
3. When the base branch moves and a merge or rebase halts, `resolve-merge-conflicts` integrates both sides and verifies before completing.
