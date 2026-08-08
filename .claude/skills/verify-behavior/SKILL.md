---
name: verify-behavior
description: Runs headless Claude Code behavior evals against plugin skills and hooks. Use when asked to "verify behavior", "run behavior evals", "挙動検証して", or after behavior-affecting changes to plugin skills or hooks.
disable-model-invocation: true
---

# Verify Behavior

Run the behavior evals in `evals/` to check that plugin skills and hooks produce the intended behavior in headless Claude Code sessions, and report the results.

## Steps

1. Run `evals/run.sh` — all scenarios by default, or only the scenario names passed as `$ARGUMENTS`. Read the output and report each scenario's PASS/FAIL and trial breakdown.

2. For any scenario that FAILs, re-run it with `KEEP_WORK=1` so the workdir and output file are preserved, then read them to determine whether the failure is a plugin regression or a stale/flaky scenario.

3. If the change being verified introduces new behavior not covered by an existing scenario, design and trial a new scenario for it, and add the ones that work reliably to `evals/scenarios/` (a `scenario.conf` + `check.sh` pair). Prefer mechanical checks (git status, grep on output, functional tests on files) over judgment calls; use TRIALS/PASS_MIN to absorb the model's inherent variance.

## Cost note

A full run spawns roughly 10 headless `claude -p` sessions and costs API tokens. Only run this after changes that affect plugin behavior — for structural-only changes, use the `verify` skill instead.
