---
name: review-changes
description: Reviews the diff since a fixed point along two axes run as parallel subagents — Spec (does the change match what was asked?) and Standards (repo conventions plus a code-smell baseline) — and reports them side by side. Use when the user asks to review a branch, work-in-progress changes, a diff, or "review since X".
---

Two-axis review of the diff between `HEAD` and a fixed point the user names.

## Fixed point

Whatever the user names — a SHA, branch, tag, `main`, `HEAD~5`. Ask if they haven't given one. Before dispatching anything, confirm it resolves (`git rev-parse <point>`) and the diff is non-empty (`git diff <point>...HEAD` — three-dot, against the merge-base, so unrelated history on the fixed point's side doesn't show up). A bad ref or empty diff should fail here, not inside two parallel subagents. Also capture the commit list: `git log <point>..HEAD --oneline`.

## The two axes

- **Spec** — does the change match what was asked?
- **Standards** — does the change follow this repo's conventions, including the smell baseline below?

Each runs as its own subagent so one axis's reasoning doesn't leak into the other's.

## Finding the spec

Look in this order: an agreement already reached in this conversation, a spec file the user points at, or a spec file that matches the branch or feature name. If none of these turn up anything, don't invent a spec — the Spec axis reports "no spec available" and stops there.

## Finding the standards

Whatever the repo documents — CONTRIBUTING, CLAUDE.md style notes, lint configs — plus the smell baseline in [references/smell-baseline.md](references/smell-baseline.md). The subagent can't read the plugin directory, so paste that file's contents into its prompt directly.

Two rules bind the baseline:

- documented repo standards override it — where the repo endorses something the baseline would flag, suppress the smell.
- every baseline hit is a judgment call, never a hard violation. Skip anything tooling already enforces (linter, formatter, type checker).

## Dispatching

Send both subagents in a single message so they run in parallel. Give each the diff command, the commit list, and a report brief capped at 400 words.

**Spec subagent** — gets the spec source (or the "no spec available" note) and reports: requirements missing or partial, behavior added that wasn't asked for (scope creep), and requirements that look implemented but wrong. Quote the spec line for each finding.

**Standards subagent** — gets the standards files found plus the full smell baseline pasted in, and reports: documented-standard violations (citing file and rule) and baseline smells spotted (naming the smell, quoting the hunk). Distinguish the two — documented-standard breaches can be hard violations, baseline smells are always judgment calls.

## Aggregating

Present the two reports under `## Spec` and `## Standards` headings, unmerged and unranked — a change can cleanly pass one axis and fail the other, and combining them would hide that. Close with one line per axis: total findings, and the worst issue within that axis. Don't pick a single winner across axes; that's the reranking the separation exists to prevent.
