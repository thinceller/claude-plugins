---
name: auto-group-commit
description: Analyzes all changes in the working tree (staged, unstaged, and untracked), intelligently groups them into semantic commit units at hunk-level granularity, and commits them sequentially after user approval. Use when asked to "auto-commit", "group and commit", "split changes into commits", "organize my changes into commits", "batch commit", "smart commit", or "split my work into commits".
argument-hint: "[language]"
---

# Auto Group Commit

Analyze all working tree changes, group them into meaningful semantic commit units at hunk-level granularity, and commit them sequentially after user approval.

If `$ARGUMENTS` is provided, write all commit messages in that language (e.g., "japanese", "ja", "english", "en"). Default to English.

## Steps

### Step 1: Normalize working tree state

Ensure all changes are in an unstaged state for uniform analysis.

1. Run `git diff --cached --quiet` to check for staged changes
2. If there are staged changes, run `git reset HEAD` to unstage them (this is non-destructive — no work is lost)
3. Now all changes are either unstaged modifications or untracked files

This normalization is necessary because mixed staged/unstaged states complicate diff analysis and patch application.

### Step 2: Gather all changes

Run the following commands in parallel:

1. `git diff` — full unified diff of all modifications
2. `git diff --stat` — change statistics summary
3. `git status --short` — list of all changed and untracked files

For each untracked file shown by `git status` (lines starting with `??`), read its content. `git diff` does not include untracked files, so treat each untracked file as a "new file" addition.

If there are no changes at all (no modified, staged, or untracked files), notify the user and stop.

### Step 3: Analyze and group changes into semantic commit units

Analyze all diffs and untracked file contents, then group them into logical commit units. Each group represents one commit.

#### Grouping guidelines

- **Group by semantic purpose**: a feature addition, a bug fix, a refactor, a config change, documentation, tests, etc.
- **Hunk-level splitting**: A single file's hunks CAN be split across different groups if they serve different purposes.
- **Include untracked files**: New files should be grouped with their related changes.
- **Independent coherence**: Each group must make sense as a standalone commit.
- **Prefer smaller units**: Favor more small, focused commits over fewer large ones.

#### For each group, record

- A descriptive list of included items:
  - Specific hunks identified by file path and the nature of the change
  - Entire untracked files
- A proposed commit message following conventional commit style or the repository's existing convention
- The commit order (groups should be ordered so that foundational changes come first)

### Step 4: Present the grouping plan to the user

Display all groups in order using this format:

```
=== Commit 1/N ===
Message: <proposed commit message>

Changes:
  - <file path> (<brief description of included hunks>)
  - <file path> (new file)
  ...

=== Commit 2/N ===
Message: <proposed commit message>

Changes:
  - <file path> (<brief description of included hunks>)
  ...
```

Ask the user to approve the plan. If the user requests adjustments (reordering, merging groups, splitting further, changing messages), revise and re-present.

**Do NOT proceed to Step 5 without explicit user approval.**

### Step 5: Execute commits sequentially

For each group in order:

> **Important**: After each commit, HEAD changes and line numbers in the remaining diff may shift. Always work with the **current** diff state, not the original analysis. Re-read `git diff <file>` for each file to extract the correct hunks.

#### 5a. Stage the changes for this group

For each item in the group:

- **Entire file (all hunks belong to this group)**: Run `git add <file>`
- **Untracked (new) file**: Run `git add <file>`
- **Specific hunks from a file**:
  1. Run `git diff <file>` to get the current diff for the file
  2. Extract only the relevant hunks (matching by change content, not line numbers, since numbers may have shifted)
  3. Construct a valid unified diff patch containing only those hunks:
     - Include the `diff --git a/<file> b/<file>` header
     - Include the `--- a/<file>` and `+++ b/<file>` lines
     - Include the `@@ ... @@` hunk header with correct line numbers from the current diff
     - Include the hunk content (context lines, additions, removals)
  4. See `references/patch-format-example.md` for a concrete example of a correctly constructed patch
  5. Write the patch to a temporary file (e.g., `/tmp/auto-group-commit-N.patch`)
  6. Apply to staging area: `git apply --cached /tmp/auto-group-commit-N.patch`

#### 5b. Verify and commit

1. Run `git diff --cached --stat` to verify the staged content matches expectations
2. Commit with the approved message using HEREDOC format:
   ```bash
   git commit -m "$(cat <<'EOF'
   <commit message>
   EOF
   )"
   ```
3. Verify with `git log -1 --oneline`

#### 5c. Clean up

- Remove temporary patch files: `rm -f /tmp/auto-group-commit-N.patch`
- Proceed to the next group

### Step 6: Final verification

After all groups are committed:

1. Run `git log --oneline -N` (where N is the number of commit groups) to display all created commits
2. Run `git status --short` to confirm no unexpected changes remain

Report the results to the user.

## Error Handling

- **`git apply --cached` fails**:
  1. Run `git reset HEAD` to clear the staging area
  2. Report the error to the user
  3. Ask whether to: retry with adjusted patch, skip this group, or abort remaining groups

- **Commit fails (e.g., pre-commit hook)**:
  1. Run `git reset HEAD` to unstage
  2. Report the hook failure details to the user
  3. Ask whether to: fix the issue and retry, skip this group, or abort remaining groups

- **Mid-sequence abort**:
  - Already-committed groups are safely in git history
  - Remaining uncommitted changes stay in the working tree (unstaged)
  - No data is lost

## Constraints

- Only analyze and group changes — **do NOT push to the remote repository**
- **Do NOT create a pull request**
- **Always get user approval before executing any commits**
- If no changes exist, notify the user and stop
- Clean up all temporary patch files after use
- Always use `cat <<'EOF'` (single-quoted) for HEREDOC commit messages to prevent variable expansion
- Never force-push or perform destructive git operations
- If binary files are present in the diff, stage them with `git add <file>` rather than attempting patch construction
