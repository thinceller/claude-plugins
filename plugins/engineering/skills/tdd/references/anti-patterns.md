# Anti-patterns

## Implementation-coupled tests

The test reaches past the seam — mocking an internal collaborator, calling a private method, or checking a side channel (the database row) instead of the public result. The tell: it breaks when you refactor even though behavior hasn't changed.

```ts
// coupled to the internal collaborator, not the seam
expect(cartService.taxCalculator.compute).toHaveBeenCalledWith(cart);

// tests through the public interface instead
expect(cartService.checkout(cart).total).toBe(108);
```

## Tautological tests

The assertion recomputes the expected value the same way the code does, so it passes by construction and can never disagree with the code under test. Expected values need an independent source of truth — a known-good literal, a worked example, the spec.

```ts
// recomputes the same formula the implementation uses
expect(add(2, 3)).toBe(2 + 3);

// asserts a value from an independent source
expect(add(2, 3)).toBe(5);
```

## Horizontal slicing

Writing all the tests first, then all the implementation. The bulk of tests ends up verifying imagined shape rather than user-facing behavior, because nothing yet confirms the shape is right — and by the time implementation starts, the suite is already locked into a structure that hasn't been validated by any working code.

```
# horizontal: shape guessed up front, then built to match
write test_create(), test_update(), test_delete()
implement create(), update(), delete()

# vertical: one slice at a time, each informed by the last
write test_create() -> implement create() -> green
write test_update() -> implement update() -> green
```

Work in vertical slices instead: one test, one implementation, repeat — each test a tracer bullet informed by what the last cycle taught you.
