---
name: derive-types
description: Derives domain types — value types, state unions, workflow signatures, error types — from an event-storming output or an equivalent agreed domain model. Use when asked to "derive types from the domain model", "型に落とす", "ドメインを型で表現したい", "turn the domain model into types", or "型定義に落とし込む".
---

Turn an agreed domain model into types. Do not discover the domain here — this skill converts, it doesn't model. If there's no event-storming output, or no domain vocabulary, commands, and aggregates already agreed in conversation, suggest `event-storming` as a candidate and stop. The source doesn't have to come from `event-storming` itself, though — a model built with a different tool or workshop works the same way, and so does revisiting types after the domain understanding has shifted.

## Mapping

| Model element | Derived type |
|---|---|
| Command | Input type, and the workflow function's signature |
| Aggregate | A discriminated union representing state, shaped so invalid states can't be constructed |
| Domain event | Vocabulary for function and test names (the success-side type, if returned as a value) |
| Glossary term + its constraint | A constrained value type, built through a constructor that can't produce an invalid value |
| Hotspot / constraint violation | A discriminated union of errors |
| Read model | A pure derivation from state, not a state transition |

The value-type row is easy to drop but tends to matter most in practice — a constraint like "quantity not yet entered" versus "quantity is zero" being distinct states is often buried in a glossary note or an aggregate's remarks column, not stated outright.

## Event as value, or event as vocabulary only

Whether a domain event becomes a runtime value or stays modeling vocabulary turns on whether the event has a receiver.

- No receiver (no notification, history, audit log, or propagation to another context) — returning it as a value only adds an interpreter layer with nothing to show for it. The workflow function returns "command + current state → new state or error," and the event name lives on as vocabulary for function and test names.
- A real receiver — returning the event as a value is warranted.

Domain Modeling Made Functional's workflows return events because that book's domain has real receivers, not because the technique requires it. If a receiver shows up later, a refactor of the pure function's return value covers the move — there's no need to build for it up front.

## Purity is necessary, not sufficient

A pure function isn't automatically domain logic. Formatting a date for display is pure and not domain. Deciding whether a date is in the past, given the current time as an argument, is pure and domain. The question is whether a business rule is being expressed — purity is a necessary condition for that, not a sufficient one.

## Next

The decisions made here — adopting this technique, how errors are represented, whether events become values — are costly to reverse and easy to misread without the context behind them; `record-adr` is a candidate if the `engineering` plugin is available. Once conventions settle, a repo-local skill and linter keep them followed going forward.

See [references/typescript.md](references/typescript.md) for a TypeScript worked example.
