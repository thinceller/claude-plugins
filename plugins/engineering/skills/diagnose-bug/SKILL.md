---
name: diagnose-bug
description: A feedback-loop-first discipline for diagnosing hard bugs and performance regressions. Use when the user reports something broken, throwing, failing, flaky, or slow, or asks to "diagnose", "debug this", "原因を調べて".
---

A discipline for hard bugs and performance regressions. Skip phases only when explicitly justified.

## Phase 1 — Build a feedback loop

This is the skill. Everything else — bisection, hypothesis-testing, instrumentation — just consumes a tight pass/fail signal once you have one. Reading code to build a theory before that signal exists is the failure this skill prevents: stop and come back here.

Construct one, roughly in this order of preference: a failing test at whatever seam reaches the bug, a curl/CLI invocation diffed against a known-good snapshot, a headless browser script asserting on DOM/console/network, a replayed captured trace, a throwaway harness exercising the bug path in isolation, or a bisection/differential loop comparing two states or configs.

Once you have a loop, tighten it: faster (skip unrelated init, narrow scope), sharper (assert the specific symptom, not "didn't crash"), more deterministic (pin time, seed RNG, isolate filesystem/network). For non-deterministic bugs, aim for a higher reproduction rate rather than a clean repro — loop the trigger many times, parallelize, narrow timing windows, until the failure is frequent enough to debug against.

Phase 1 is done when you can name one command — already run, output pasted — that is red-capable (catches this specific bug, not just "errors"), deterministic, fast, and agent-runnable. If you genuinely cannot build a loop, say so explicitly, list what you tried, and ask the user for environment access or a captured artifact rather than proceeding to hypothesize without one.

## Phase 2 — Reproduce and minimise

Run the loop and confirm it produces the failure mode the user actually described, not a different one nearby.

Then shrink the repro to the smallest scenario that still goes red: cut inputs, callers, config, and steps one at a time, re-running after each cut. Done when every remaining element is load-bearing — removing any one of them makes the loop go green. This narrows the hypothesis space in Phase 3 and becomes the regression test in Phase 5.

## Phase 3 — Hypothesise

Generate 3–5 ranked hypotheses before testing any of them; a single hypothesis anchors on the first plausible idea. Each must be falsifiable: "If X is the cause, changing Y makes it disappear." Discard or sharpen anything you can't state as a prediction.

Show the ranked list to the user before testing — they often re-rank instantly with domain knowledge, or know hypotheses already ruled out. Don't block on a response if they're unavailable.

## Phase 4 — Instrument

Each probe should map to a specific prediction from Phase 3, changing one variable at a time. Prefer a debugger or REPL inspection over logs — one breakpoint beats ten logs. When logs are the only option, tag each with a unique prefix (e.g. `[DEBUG-a4f2]`) so cleanup is a single grep.

For performance regressions, logs are usually misleading. Measure a baseline first (timing harness, profiler, query plan), then bisect against it.

## Phase 5 — Fix and regression test

Write the regression test before the fix, but only if a correct seam exists — one where the test exercises the real bug pattern as it occurs at the call site, not a shallow substitute. If no correct seam exists, that's itself a finding: note it, the architecture is preventing the bug from being locked down.

When a seam exists: turn the minimised repro into a failing test there, watch it fail, apply the fix, watch it pass, then re-run the Phase 1 loop against the original, unminimised scenario.

## Phase 6 — Cleanup

Before declaring done: the original repro no longer reproduces, the regression test passes (or the missing seam is documented), all `[DEBUG-...]` instrumentation is removed, and the hypothesis that turned out correct is stated in the commit message so the next debugger learns.

An architectural cause behind the bug — no good seam, tangled callers — is worth recording; `record-adr` is a candidate.
