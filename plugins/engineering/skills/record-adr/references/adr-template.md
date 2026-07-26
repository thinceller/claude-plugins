# ADR Template

ADRs live in the configured `adr:` directory (default `docs/adr/`) and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc. Create the directory lazily — only when the first ADR is needed.

```md
# {Short title of the decision}

Status: proposed | accepted | superseded-by 000N

## Context

{What situation forced this decision? What constraints applied?}

## Decision

{What was decided, stated plainly.}

## Alternatives considered

{Genuine alternatives that were on the table, and why each was rejected.}

## Consequences

{What this makes easier, harder, or forecloses — including non-obvious downstream effects.}
```

## Numbering

Scan the ADR directory for the highest existing number and increment by one.
