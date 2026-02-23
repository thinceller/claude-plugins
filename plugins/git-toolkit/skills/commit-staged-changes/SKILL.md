---
name: commit-staged-changes
description: Reviews staged file changes and automatically generates an appropriate commit message to commit them. Use when asked to "commit staged changes", "commit what's staged", "commit the staged files", or similar commit requests.
argument-hint: "[language]"
---

# Commit Staged Changes

Review staged file changes, auto-generate an appropriate commit message, and commit.

## Steps

1. **Check staged files**
   - Run `git status --short` to list staged files
   - If nothing is staged, notify the user and stop
   - NEVER auto-stage unstaged files (modified, untracked, etc.)

2. **Review changes in detail**
   - Run `git diff --cached` to inspect the full diff of staged files
   - Run `git diff --cached --stat` to get change statistics

3. **Generate commit message**
   - Analyze the changes and compose a commit message:
     - Determine the change type (feat/fix/refactor/docs/style/test, etc.)
     - Summarize the main changes concisely
     - If `$ARGUMENTS` is provided, write the message in that language (e.g., "japanese", "ja", "english", "en")
     - If no argument is given, write the message in English by default

4. **Execute the commit**
   - Commit with the generated message
   - Verify the result with `git log -1 --oneline`

## Constraints

- Only target staged files
- **NEVER auto-stage unstaged files, even if they exist**
- **Do NOT push to the remote repository**
- **Do NOT create a pull request**
- Auto-generate the commit message based on change content
- For large changesets, highlight the primary changes in the main message
