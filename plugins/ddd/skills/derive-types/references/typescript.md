# TypeScript worked example

This is a pattern verified on one real project, not a recommended default. Library choice belongs to the project it's for — pick a schema library (or none) based on that project's own constraints, not this document. Treat every name below as a placeholder to swap.

## Constrained value types

A glossary term with a constraint becomes a branded type plus a thin constructor that parses raw input and returns a `Result`, so an invalid value can never exist once constructed:

```ts
type Quantity = Brand<number, "Quantity">;

function parseQuantity(input: number): Result<Quantity, ValidationError> {
  if (!Number.isInteger(input) || input < 0) {
    return err({ kind: "InvalidQuantity", input });
  }
  return ok(input as Quantity);
}
```

The schema/branding library is a project choice (Zod, valibot, io-ts, hand-rolled — whatever fits). What matters is the shape: parsing happens once, at a boundary, and produces a type nothing downstream can bypass.

## State as a discriminated union

Distinguish states the glossary actually distinguishes, rather than collapsing them into optional fields. "Quantity not yet entered" and "quantity is zero" are different states, not the same field with a falsy value:

```ts
type StockLevel =
  | { status: "unknown" }
  | { status: "counted"; quantity: Quantity };
```

An `if (quantity)` check over `quantity?: number` silently conflates "unknown" and "zero." The union makes the distinction impossible to skip.

## Workflow functions

A workflow function takes a command and the current state, and returns either a new state or an error — no event value, unless something downstream actually consumes the event:

```ts
function applyRestock(
  command: RestockCommand,
  state: StockLevel,
): Result<StockLevel, RestockError> { ... }
```

The function and test names carry the domain-event vocabulary ("restocked", "stock counted") even when no event object is returned.

## Error types

Errors are a discriminated union, not a bag of string messages — each variant carries the data a caller needs to react, and the type system forces every case to be handled:

```ts
type RestockError =
  | { kind: "InvalidQuantity"; input: number }
  | { kind: "StockLevelUnknown" };
```

## Boundary (shell) vs. core

Raw input — HTTP bodies, DB rows, CLI args — gets parsed into the constrained types at the boundary (the "shell"). The domain core never sees unparsed data; every function inside it can assume its inputs are already valid, which is what lets the state unions and constructors above stay load-bearing instead of decorative.
