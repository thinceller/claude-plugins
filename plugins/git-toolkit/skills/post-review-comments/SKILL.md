---
name: post-review-comments
description: Posts review findings the user selected (from a code review earlier in the conversation, such as /code-review output) to a GitHub Pull Request as inline comments in a single review, labeled as written by Claude Code. Use when asked to "post these findings to the PR", "leave inline comments on the PR", "comment findings 1 and 3 on the PR", "PRにinlineコメントして", "指摘をレビューコメントして", or similar.
argument-hint: "[finding numbers] [PR number]"
---

# Post Review Comments

Post the findings the user picked to a GitHub Pull Request as inline review comments, using the `gh` CLI. All comments go into one review so the PR author gets a single notification.

`$ARGUMENTS` may contain the finding numbers to post (e.g. `1 2`) and a PR number or URL. Anything missing is taken from the conversation.

## Workflow

### Step 1: Identify the Findings

Find the review findings earlier in the conversation and the ones the user selected (by number, file, or description). For each selected finding, collect:

- The file path (repository-relative)
- The line the finding anchors to
- The problem, a concrete failure scenario, and the suggested fix

If it is unclear which findings were selected, or there are no findings in the conversation, ask the user. Post only the selected findings, never the whole list.

### Step 2: Resolve the PR

Run in parallel:

1. `gh pr view [<number>] --json number,url,headRefOid,baseRefName` - Use the PR given in `$ARGUMENTS`, otherwise the PR of the current branch
2. `git rev-parse HEAD`

If no PR is found, inform the user and stop.

If local `HEAD` differs from `headRefOid`, the line numbers from the review may not match the PR. Tell the user and ask whether they will push first or want to post against `headRefOid` anyway. Do not push yourself. If they push, re-run `gh pr view --json headRefOid` and use the new value from here on.

### Step 3: Pin Each Comment to a Diff Line

Inline comments can only be placed on lines that appear in the PR diff. For each finding:

1. Re-locate the line in the file as of `headRefOid`; line numbers in the review output can be off by a few lines. Use `git show <headRefOid>:<path> | grep -n '<pattern>'` (fetch the PR head first if the commit is not local). Read and grep on the working tree match only when `HEAD` equals `headRefOid` and the tree is clean. Anchor to the line the fix applies to (e.g. the `if` that needs an `else`, the call that double-escapes).
2. Check the line appears in a hunk of `gh pr diff <number>`, which is the diff GitHub validates against. Added and unchanged context lines in a hunk are both valid anchors.
3. If the relevant line is not in any hunk (the problem is in code the PR does not show), use the nearest line shown in a hunk that leads to it, and mention the real location in the body. If no line in that file's hunks makes sense, put the finding in the review's top-level `body` instead.

Use `side: "RIGHT"` and the new-file line number. For a finding about a removed line, use `side: "LEFT"` and the old-file line number. For a range, add `start_line` and `start_side`.

### Step 4: Write the Comment Bodies

Write each body in the language of the conversation with the user (or of the PR, if it clearly differs and the user does not say otherwise).

Start every body, including the top-level review `body` when used, with a label so readers know Claude Code wrote it:

```markdown
🤖 **Claude Code によるレビューコメント**
```

Use the equivalent label in the body's language (e.g. `🤖 **Review comment by Claude Code**`).

Then, for each finding:

- State the problem in one or two sentences, quoting the identifiers involved
- Give the concrete failure scenario (inputs or state → wrong result)
- Suggest the fix, with a short code block when it helps

Write for the PR author, who has not seen this conversation: do not refer to finding numbers, effort levels, or "the reviewer agent". Keep the wording a suggestion, not an order.

### Step 5: Post the Review

Use `event: "COMMENT"`; never `APPROVE` or `REQUEST_CHANGES` unless the user explicitly asks.

Comment bodies contain quotes, backslashes, and code blocks, so do not hand-escape them into JSON. Write each body to its own file and let `jq` build the payload (any JSON serializer works if `jq` is unavailable).

Write the files into a fresh directory from `mktemp -d`, and refer to it by the absolute path that command prints in every later command. Do not rely on `$TMPDIR` across commands: a sandboxed command and one run outside the sandbox (as `gh` often is) can see different `$TMPDIR` values, so the post can pick up a stale `review.json` left there by an earlier review, posting unrelated comments to the PR.

```bash
dir=$(mktemp -d) && echo "$dir"

cat > "$dir/body1.md" <<'EOF'
🤖 **Claude Code によるレビューコメント**

...
EOF

jq -n --rawfile b1 "$dir/body1.md" '{
  commit_id: "<headRefOid>",
  event: "COMMENT",
  comments: [
    {path: "path/to/file.php", line: 189, side: "RIGHT", body: $b1}
  ]
}' > "$dir/review.json"
```

Post in a separate command using the printed absolute path. Print what is about to be sent in the same command, so the output shows the payload that was actually posted:

```bash
jq -r '.commit_id, (.comments[] | "\(.path):\(.line) \(.body | split("\n")[0])")' /abs/path/review.json \
  && gh api repos/{owner}/{repo}/pulls/<number>/reviews --input /abs/path/review.json --jq '.id, .html_url'
```

Add a top-level `"body"` only when a finding could not be anchored inline (Step 3).

### Step 6: Verify and Report

Before reporting, read back the posted comments and confirm the paths, lines, and the label on the first line match what you wrote:

```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments --paginate \
  --jq '.[] | select(.pull_request_review_id == <review_id>) | "\(.path):\(.line) \(.body | split("\n")[0])"'
```

If they do not match, tell the user what was actually posted and ask before deleting or reposting anything. Otherwise report the review URL and list each posted comment as `path:line` with a one-line summary.

## Updating Posted Comments

To change a comment that was already posted, get its ID with `gh api repos/{owner}/{repo}/pulls/<number>/reviews/<review_id>/comments --jq '.[] | {id, path}'`, then edit it with `gh api -X PATCH repos/{owner}/{repo}/pulls/comments/<id> -f body="..."`. Fetch the current body first and edit it, rather than retyping it.

## Error Handling

- **No gh CLI**: Inform the user to install it
- **Not authenticated**: Guide the user to run `gh auth login`
- **422 "line must be part of the diff"**: The line is outside the diff; re-run Step 3 for that comment
- **422 "one pending review per pull request"**: The user has an unsubmitted review on the PR. Tell the user to submit or discard it, then retry; do not touch it yourself
- **TLS / x509 errors from `gh` inside a sandbox**: If the error is the sandbox blocking certificate verification, retry that `gh` command outside the sandbox. Do not bypass the sandbox for other `gh` errors

## Important Notes

- Post only the findings the user selected
- Post all comments as one review, not one review per comment
- Do not reply to or resolve existing review threads
- Use `cat <<'EOF'` (single-quoted) for the payload HEREDOC to prevent variable expansion
