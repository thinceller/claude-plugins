# Conflict markers and ours/theirs semantics

## Anatomy of a conflict region

```
<<<<<<< HEAD
code from "our" side
=======
code from "their" side
>>>>>>> origin/main
```

- Everything between `<<<<<<<` and `=======` is **our** side.
- Everything between `=======` and `>>>>>>>` is **their** side.
- The label after `<<<<<<<` and `>>>>>>>` tells you which ref each side came from.

A single file can contain many independent conflict regions. Resolve each one on its own merits — they may need different decisions.

## The critical merge vs rebase swap

"ours" and "theirs" mean **opposite things** depending on the operation. Getting this backwards leads to resolutions that look plausible but invert the author's intent.

### During `git merge` (you are on your feature branch, merging main in)

- `<<<<<<< HEAD` = **ours** = your current branch (the feature branch you are on).
- `>>>>>>> origin/main` = **theirs** = the branch being merged in.

This is the intuitive case: HEAD is your work.

### During `git rebase origin/main` (replaying your commits onto main)

The roles are **reversed**, because rebase checks out the upstream branch first and then replays your commits on top one by one:

- `<<<<<<< HEAD` = **ours** = the branch you are rebasing **onto** (e.g. main + commits already replayed).
- `>>>>>>> <your-commit>` = **theirs** = the commit of yours currently being replayed.

So during a rebase, *your own changes* show up as "theirs". Always read the marker labels rather than assuming "ours = mine".

## Why this matters for resolution

The skill resolves conflicts by intent, not by side, so the swap rarely changes the *final* code — but it absolutely changes how you reason about each side. When you run `git log`/`git blame` to understand "why did this side change", you need to know which ref each side actually corresponds to. Read the labels on the markers, confirm the operation type (`.git/MERGE_HEAD` vs `.git/rebase-merge/`), and reason from there.

## `git checkout --ours` / `--theirs`

These shortcuts take an entire file from one side, discarding the other. They follow the same swapped semantics as above during a rebase. They are only safe when one side is unambiguously correct for the whole file — for example a regenerated lock file or generated client code. For hand-written source where both sides made meaningful edits, they destroy one side's intent; integrate by hand instead.
