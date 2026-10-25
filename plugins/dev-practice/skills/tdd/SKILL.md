---
name: tdd
description: Test-first development anchored on pre-agreed seams — agree where tests will live before writing them, then run the red-green loop. Use when implementing features or bug fixes, when the user mentions "TDD", "red-green", "test first", or when deciding where tests belong.
---

# Test-Driven Development

TDD here means: agree where tests go before writing any of them, then work the red-green loop one seam at a time.

## Seams — agree before you test

A **seam** is the public boundary where behavior is observed without reaching inside — the interface a caller actually uses, not an internal method or a database row underneath it.

Before writing any test, write down the seams under test and confirm them with the user. No test gets written at a seam that hasn't been agreed. You can't test everything, so this is also where effort gets allocated: critical paths and complex logic earn tests, routine edges don't.

Ask: "What's the public interface here, and which seams should we test?"

## What a good test is

A good test verifies behavior through the public interface, not implementation details — the code inside can change entirely and the test shouldn't notice. It reads like a specification: a name like "user can checkout with an empty cart" tells you exactly what capability is being promised. And because it only watches the seam, it survives refactors that don't change behavior.

See [references/anti-patterns.md](references/anti-patterns.md) for the ways tests fail this bar in practice.

## The loop

- Red before green: write the failing test first, then only enough code to pass it.
- One slice at a time: one seam, one test, one minimal implementation per cycle. Don't anticipate the next test or add anything speculative.
- Refactoring isn't part of the loop — it belongs to review, once the cycle is green.

## Opting out

Test-first is the default recommendation here, not a mandate. Exploratory code, spikes, and UI tuning are legitimate reasons to skip it by explicit choice — the point of those is fast iteration on the unknown, and locking in tests before the shape of the thing exists would fight that. `verify-before-done` still applies regardless of whether tests came first.
