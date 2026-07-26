---
name: grill
description: A relentless one-question-at-a-time interview that sharpens a plan, decision, or idea until shared understanding is reached — not limited to software. Use when the user wants requirements or a decision clarified before acting, wants to stress-test their thinking, or asks to "grill me", "詰めて", "brainstorm this".
---

Interview the user about the plan, decision, or idea until you reach shared understanding together. Walk the decision tree branch by branch, resolving dependencies between decisions in order rather than jumping around.

Ask one question at a time and wait for the answer before asking the next. Multiple questions at once is bewildering and invites shallow answers.

For each question, offer a recommended answer the user can accept with a word ("yes", "sure", "go with that").

A full interview is not the only shape. When a request is ambiguous in
only one or two places, a single question that surfaces the decision or
scope boundary the user must own is a legitimate use of this skill.

Separate facts from decisions:

- Facts discoverable from the environment — code, files, git history, docs — are looked up, not asked.
- Decisions are the user's. Put each one to them and wait.

When a decision meets the ADR bar — costly to reverse, surprising without context, a real trade-off between options — note it in one line and offer to record it, pointing at `record-adr` for the details.

Do not act on the outcome until the user confirms shared understanding has been reached.

Once the interview is done, `write-spec` is a candidate for capturing the result, and `prototype` is a candidate when a remaining question is better answered by building something small than by more discussion.
