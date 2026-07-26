---
name: record-adr
description: Creates an Architecture Decision Record for a decision that is hard to reverse, surprising without context, and the result of a real trade-off. Use when such a decision has just been made, or the user asks to "record this decision", "ADRにして", or mentions decision records.
---

# Record ADR

Not every decision earns an ADR. Write one only when all three hold:

1. **Hard to reverse** — the cost of changing your mind later is meaningful.
2. **Surprising without context** — a future reader will look at the result and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and one was picked for specific reasons.

If any one is missing, skip the ADR and say why (easy to reverse, not surprising, or no real alternative existed) rather than writing one anyway.

## Writing it

Use [references/adr-template.md](references/adr-template.md). Fill in context, the decision, the alternatives considered, and the consequences — written so a future reader understands *why* without having seen the conversation that led here.

## Saving it

ADRs are numbered files (`NNNN-slug.md`), scanning the target directory for the highest existing number and incrementing by one. Check `.claude/engineering.local.md` for an `adr:` key in its frontmatter — a path to save into (suggest `docs/adr/` as the default). If the file doesn't exist, ask once where to save, and mention `/setup-engineering` for making the choice permanent. Never write ADRs into CLAUDE.md or AGENTS.md. Unlike specs or plans, an ADR the user asked for always gets saved somewhere — there's no "don't save" option here.

## Immutability

An accepted ADR doesn't get edited to reflect a change of mind. If the decision is later reversed, write a new ADR and set the old one's status to `superseded-by` the new one's number.
