---
name: resolve-merge-conflicts
description: Resolves git merge and rebase conflicts by understanding the intent of both sides and integrating them correctly, then verifies the result. Use when asked to "resolve merge conflicts", "fix the conflicts", "merge main and resolve conflicts", "rebase onto main and fix conflicts", "解消して", or when a merge/rebase/pull stops with conflicts. Handles both merge and rebase conflict states.
argument-hint: "[branch]"
---

# Resolve Merge Conflicts

Resolve git conflicts that arise from a `merge` or `rebase`, then verify the working tree builds cleanly before completing the operation.

The goal is not to mechanically pick one side. A conflict means two changes touched the same lines, and the correct result is usually a *combination* that preserves the intent of both. Read each side, understand *why* it changed, and integrate accordingly.

If `$ARGUMENTS` names a branch, treat it as the branch to merge (or rebase onto) when starting a fresh operation.

## Step 1: Detect the current state

Run `git status` and inspect the repository to figure out which situation you are in:

- **Already mid-conflict** — `git status` shows "Unmerged paths" and the repo is in a `MERGE`, `REBASE`, or `CHERRY-PICK` state. Skip to Step 3.
- **Clean, conflict not started yet** — the user wants you to start a merge/rebase against a branch. Continue to Step 2.

To distinguish a merge from a rebase when already mid-conflict, check for state directories: `.git/MERGE_HEAD` indicates a merge in progress; `.git/rebase-merge/` or `.git/rebase-apply/` indicates a rebase. This matters because the completion and ours/theirs semantics differ (see Step 5 and the marker reference below).

## Step 2: Start the operation (only if not already mid-conflict)

1. Confirm the working tree is clean with `git status --short`. If there are uncommitted changes, stop and ask the user how to proceed (commit, stash, or abort) — never discard their work.
2. Fetch the latest target branch: `git fetch origin <branch>`.
3. Start the operation the user asked for:
   - Merge (default, creates a merge commit): `git merge --no-ff origin/<branch> --no-edit`
   - Rebase: `git rebase origin/<branch>`
4. If the operation completes with no conflicts, report that and stop — there is nothing to resolve.

If a command fails because of sandbox restrictions on git's index or SSH known_hosts (e.g. "Operation not permitted", "Unable to write index", "Host key verification failed"), rerun it with the sandbox disabled.

## Step 3: List the conflicted files

Run `git diff --name-only --diff-filter=U` to get the exact set of unmerged files. Work through them one at a time. Announce how many there are so the user knows the scope.

## Step 4: Resolve each conflict by understanding intent

For each conflicted file:

1. **Locate the conflict regions.** Search for the markers `<<<<<<<`, `=======`, `>>>>>>>`. A file may contain several independent regions.
2. **Read enough surrounding context** to understand what the code does — not just the conflicting lines. Read the whole function or block on both sides.
3. **Understand why each side changed.** If the intent is not obvious from the diff, use `git log` / `git blame` on the relevant lines of each side, or look at the commit that introduced each change. The two sides almost always have distinct, legitimate purposes.
4. **Integrate, don't just choose.** Decide the resolution from the combined intent:
   - Both sides added independent items to a list/array/imports → keep **both** (union), in a sensible order.
   - Both sides modified the same logic in compatible ways → combine the modifications so both intents survive.
   - One side's change supersedes the other (e.g. a refactor that removes the line the other side edited) → keep the superseding side, but make sure the other side's intent is still satisfied elsewhere.
   - Genuinely incompatible changes where you cannot infer the right answer → **stop and ask the user**, showing both sides and explaining the trade-off. Do not guess on semantically important conflicts.
5. **Edit the file** to the resolved state and remove all conflict markers.

See `references/conflict-markers.md` for what each marker section means and the critical ours/theirs swap between merge and rebase.

## Step 5: Verify before completing

Never complete the operation until the result is verified.

1. **No markers remain.** Grep the resolved files (and ideally the whole tree) for `<<<<<<<`, `=======`, `>>>>>>>`. Any leftover marker is a broken resolution.
2. **The project still builds.** Run the project's relevant checks for the files you touched — typecheck, lint, and/or tests. Prefer scoping to the affected files/packages to keep it fast. If checks fail, fix the resolution; do not complete with a known-broken tree.

If you ran git inside a sandbox and hit permission errors earlier, run these verification commands the same way that succeeded.

## Step 6: Complete the operation

1. **Stage the resolved files**: `git add <files>`.
2. **Finish according to the operation type:**
   - **Merge** — commit the merge. Use the default merge commit message: `git commit --no-edit`. Do not invent a custom message unless the user asks.
   - **Rebase** — continue the rebase: `git rebase --continue`. More conflicts may surface on the next replayed commit; if so, return to Step 3 and repeat until the rebase finishes.
3. **Confirm the final state** with `git status` (clean tree, no operation in progress) and `git log --oneline -3`.
4. Report what was resolved: the conflicted files, how each non-trivial conflict was integrated, and the verification result.

## Constraints

- **Never push and never create a PR** unless the user explicitly asks — resolving conflicts is a local operation.
- **Never discard the user's uncommitted work** to start an operation.
- **Never blindly resolve with `-X ours`/`-X theirs` or `git checkout --ours/--theirs`** for semantically important conflicts. These throw away one side's intent. Only acceptable for files where one side is unambiguously correct (e.g. regenerated lock files / generated code) and you have confirmed it.
- **Do not complete a merge or rebase with conflict markers or failing checks** in the tree.
- If you cannot determine the correct resolution, stop and ask rather than guessing.

## Recovering / aborting

If the resolution goes wrong or the user wants to back out, the operation can be safely undone before it is completed:

- Merge: `git merge --abort`
- Rebase: `git rebase --abort`

This returns the working tree to its pre-operation state.
