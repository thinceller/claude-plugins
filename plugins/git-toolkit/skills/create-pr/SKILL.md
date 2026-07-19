---
name: create-pr
description: Creates a GitHub Pull Request using the gh CLI. Use when asked to "create a PR", "open a PR", "submit a PR", "make a pull request", or "send a PR". Supports draft and open statuses.
argument-hint: "[draft]"
---

# Create Pull Request

Create a GitHub Pull Request using the `gh` CLI. Analyze branch changes, detect PR templates, and generate structured PR descriptions.

If `$ARGUMENTS` contains `draft` or `--draft`, create the PR as a draft. Otherwise, create a regular (open) PR.

## Workflow

### Step 1: Gather Context

Run the following commands in parallel:

1. `git status` - Check for uncommitted changes (never use `-uall` flag)
2. `git branch --show-current` - Get current branch name
3. `git log --oneline -20` - Get recent commit history for message style reference

If there are uncommitted changes, warn the user and ask whether to proceed or commit first.

### Step 2: Identify Base Branch and Changes

Determine the base branch for the PR:

1. Detect the default branch: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
2. Use the default branch as the base unless the user specifies otherwise

Gather the full diff and commit log from the base branch:

1. `git log --oneline <base-branch>..HEAD` - All commits to include in the PR
2. `git diff <base-branch>...HEAD` - Full diff of changes
3. `git diff <base-branch>...HEAD --stat` - Summary statistics

If there are no commits ahead of the base branch, inform the user and stop.

### Step 3: Detect PR Templates

Search for PR templates in the repository in this order:

1. `.github/pull_request_template.md`
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `docs/pull_request_template.md`
4. `pull_request_template.md`
5. `.github/PULL_REQUEST_TEMPLATE/` directory (if multiple templates exist)

If a template is found:
- Read the template content
- Use it as the structure for the PR body
- Fill in each section based on the actual changes

When multiple templates exist in `.github/PULL_REQUEST_TEMPLATE/`, list them and ask the user which to use.

If no template is found, use the default format described in Step 4.

### Step 4: Compose PR Title and Body

#### Title

- Keep under 70 characters
- Summarize the primary change concisely
- Follow the commit message style observed in the repository (e.g., conventional commits if the repo uses them)

#### Body

The body exists to give reviewers what the diff view cannot. Reviewers will read the diff — the body's job is to prepare them for it, not to duplicate it.

Write only content that is invisible in the diff:

- **Why**: the motivation or problem being solved. This is the most important part — it cannot be recovered from the code. Link related issues if any.
- **What (high level)**: the approach and key design decisions, described in units of intent, not files. Note alternatives considered or trade-offs only when non-obvious.
- **Impact**: breaking changes, behavior changes, or migration steps — easy to miss when reading a diff.
- **Verification**: how the changes were tested.

Never include:

- File-by-file or commit-by-commit enumeration of changes — the diff view and commit list already show this better
- Prose restatement of the code ("changed X to Y in file Z")
- Boilerplate sections with nothing to say ("N/A", "None")

Match length to the change: a small fix needs 2-3 sentences total, not a full sectioned document. When unsure, shorter is better — a body the reviewer actually reads beats a thorough one they skip.

If a PR template was found in Step 3, populate its sections following the same principles.

If no template was found, use this default format, omitting any section that would be empty:

```markdown
## Why
<Motivation: the problem this solves and why it matters. Link issues.>

## What
<High-level approach and key design decisions. Not a file list.>

## Test Plan
<How the changes were verified>
```

Always append the following footer:

```markdown

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Step 5: Push and Create PR

1. Ensure the branch is pushed to the remote:
   - Check if remote tracking exists: `git rev-parse --abbrev-ref @{upstream} 2>/dev/null`
   - If not tracked, push with: `git push -u origin <current-branch>`
   - If tracked but local is ahead, push with: `git push`

2. Create the PR using `gh pr create`:

```bash
gh pr create \
  --title "PR title" \
  --body "$(cat <<'EOF'
PR body content here
EOF
)" \
  [--draft]  # Include if draft mode requested
```

Add `--draft` flag when draft mode is requested.

3. Run `gh pr view --json url,number,title,isDraft` to confirm creation and report the PR URL, number, title, and status (draft/open) to the user.

## Error Handling

- **No gh CLI**: Inform the user to install it
- **Not authenticated**: Guide the user to run `gh auth login`
- **No remote**: Inform the user that no remote is configured
- **Push failure**: Inform the user about potential conflicts

## Important Notes

- Never force-push unless the user explicitly requests it
- Always use `cat <<'EOF'` (single-quoted) for the body HEREDOC to prevent variable expansion
- Respect the repository's existing PR conventions when composing title and body
