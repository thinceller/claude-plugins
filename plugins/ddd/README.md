# ddd

Two skills for discovering a domain and turning what was discovered into types: `event-storming` runs the interview, `derive-types` converts its output.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `event-storming` | Runs an Event Storming session to map a domain into commands, events, aggregates, and ubiquitous language through interview. |
| `derive-types` | Derives domain types — value types, state unions, workflow signatures, error types — from an event-storming output or an equivalent agreed domain model. |

`event-storming` walks scope, starting points, a timeline per scene, commands/events/aggregates, policies and derivations, and ubiquitous language — one question at a time, with a recommended answer offered alongside each question. It writes up scenarios, a command/event/aggregate table, an aggregate table, policies and derivations, and a ubiquitous language table (column layouts in `references/notation.md`).

`derive-types` doesn't model — it converts an already-agreed domain model (from `event-storming` or any other source) into a mapping table: commands become workflow input types and signatures, aggregates become discriminated-union state, glossary terms with constraints become constructed value types, hotspots become error unions, read models become pure derivations. See `references/typescript.md` for a worked TypeScript example.

## Design stance

This plugin is strong at discovery and deliberately weak at convergence. Aggregate boundaries and other modeling decisions come out as proposals with a one-line reason, not verdicts — the call stays with the user. This follows from field reports on LLM-assisted DDD: glossary extraction, event sequencing, and boundary surfacing hold up well, but aggregate design and beyond tend to come out significantly finer-grained than practitioners find workable, so the skills stop short of deciding for you there.

There's no `SessionStart` hook. Event Storming is one methodology choice among several, not something to inject into every session — the skills surface themselves through their own descriptions instead.

There's no config file either. The only place a save location is needed is asking once where the deliverable goes.

This plugin has no dependency on `dev-practice`. If it's installed, `event-storming` mentions its `grill` skill for the interview technique, but no skill here assumes it exists.

## Typical flow

`event-storming` → (an ADR, if a modeling decision clears that bar) → `derive-types` → implementation.

1. `event-storming` interviews the domain until commands, events, aggregates, and vocabulary are agreed.
2. If a decision made along the way is hard to reverse and worth recording, record it as an ADR in the repository's own format.
3. `derive-types` converts the agreed model into value types, state unions, workflow signatures, and error types.
4. Implementation proceeds from there — by hand, or via `dev-practice`'s `write-plan` / `implement` if that plugin is installed.

Entering at `derive-types` directly is normal too, whenever a domain model already exists from a source other than `event-storming`.
