---
name: event-storming
description: Runs an Event Storming session to map a domain into commands, events, aggregates, and ubiquitous language through interview. Use when asked to "run event storming", "イベントストーミング", "ドメインを洗い出して", "map the domain", "ユビキタス言語を決めたい".
---

Not every domain needs this. Skip it, and say why, when:

- The domain is simple CRUD — storage matters more than behavior.
- Nobody in the conversation actually knows the domain — filling in events from guesswork isn't storming, it's fiction.
- Vocabulary and boundaries are already stable and just need maintaining.

Interview one question at a time, waiting for the answer before moving on. Offer a recommended answer with each question so a one-word reply ("that works") is enough to move forward. Facts the environment already knows — existing code, docs, git history — are looked up, not asked; decisions belong to the user. Don't start writing the deliverable until the user confirms understanding is shared. (If the `engineering` plugin is installed, `grill` covers the interview technique in more depth.)

## Separating what was said from what you inferred

When reflecting understanding back, mark the source of each item:

- What the user actually said, quoted where practical.
- What you inferred, flagged as unconfirmed and offered as a question, not a claim.

Blurring these into "so from what we discussed, X" risks attributing a guess to the user as if they said it. If that happens and gets caught, don't argue about who said what — restate only what's actually confirmed and continue from there.

## Walking the domain

Scope, then starting points, then a timeline per scene, then commands/events/aggregates, then policies and derivations, then ubiquitous language.

The standard entry point is the sequence of domain events in time. For user-facing apps, starting from the moment a user opens the app and working outward is a useful default — but it's a default, not the only path: backend, batch, and B2B domains often have no such moment, and starting cold from event sequencing works better there.

Favor coarse aggregates by default — LLM-drawn boundaries tend to run finer than practitioners find useful. Propose splitting only when you can name the reason in one line — an invariant, a transaction boundary, an independent lifecycle. No nameable reason, no split. Aggregate boundaries are a proposal, not a decision — leave the call to the user and don't auto-advance to the next phase.

## Deliverable

Write up: scenarios covered, a command/event/aggregate table, an aggregate table with notes, policies and derivations (event-free computations), and a ubiquitous language table. Column layouts are in [references/notation.md](references/notation.md). Tables are canonical; diagrams are optional extras. Note anything found this session that contradicts or extends existing specs or code but isn't written down anywhere yet.

## Saving

Suggest `docs/domain/` and ask once. Use an undated filename — this is a living document that gets updated as domain understanding changes, not a dated snapshot. Don't write it into CLAUDE.md or AGENTS.md.

If the `engineering` plugin is installed, `record-adr` is a candidate once a modeling decision here clears the ADR bar, and `derive-types` (same plugin) is a candidate once this is ready to become types.
