<dev-practice-discipline>
Working discipline for code changes. It applies to the main session and to every subagent.

## Design Principle Priorities

Always keep the following priorities in mind when refactoring or designing code:

1. **Simplicity > Complexity**
   - Choose simple, easy-to-understand solutions
   - Avoid excessive abstraction or overuse of design patterns

2. **Clarity > Abstraction**
   - Prioritize code whose intent is clearly communicated
   - Prefer concrete, straightforward implementations over complexity for generality

3. **Practicality > Theory**
   - Focus on solving real problems
   - Avoid designs that are theoretically perfect but impractical

## Avoid Over-Engineering

**IMPORTANT**: Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused.

- **Scope**: Do not add features, refactor code, or make "improvements" beyond what was asked
- **Documentation**: Do not add docstrings, comments, or type annotations to code you did not change
- **Defensive coding**: Do not add error handling, fallbacks, or validation for scenarios that cannot happen
- **Abstractions**: Do not create helpers, utilities, or abstractions for one-time operations
- **Future-proofing**: Do not design for hypothetical future requirements; three similar lines is better than a premature abstraction

## Code Comments

**IMPORTANT**: Default to no comment. Write one only when the code cannot carry the information itself.

A comment earns its place when it tells a teammate who has **not** seen this conversation something they cannot get from the code, the name, or the type:

- **Why**, not what: a non-obvious decision, a constraint, a trade-off that was rejected
- **Invariants and gotchas**: ordering requirements, units, off-by-one traps, "looks wrong but is right"
- **Workarounds**: the bug or limitation being dodged, with a link (issue, ticket, upstream PR)
- **Public API contracts** where the language convention expects docstrings — describe the contract, never restate the signature
- **TODO/FIXME** with a ticket or owner

Never write:

- Comments that restate the code (`// increment counter`, `// return the result`, `# loop over items`)
- Change narration or session context (`// changed from X to Y`, `// as requested`, `// previously this did ...`, `// removed the old check`) — that belongs in the commit message
- Section banners (`// ===== Helpers =====`), `NOTE:`/`IMPORTANT:` prefixes, or step-by-step numbering inside a function
- Docstrings on private/trivial functions whose name already says everything
- Multi-sentence justification of an obvious choice, or hedging (`// this should work`, `// probably fine`)
- Comments addressed to the reviewer instead of the future maintainer

Before leaving a comment, test it: *Would it be wrong after a rename? Does it describe a moment in time rather than the code? Would deleting it lose nothing?* — if any is yes, delete it. One line by default; a paragraph only for a rationale that genuinely cannot be shorter. Match the comment density and language of the surrounding file (the session language setting governs replies, not code); if the file has no comments, yours must be exceptional.

## Refactoring Checklist

When improving code, always verify the following:

- **Appropriate call hierarchy between files**: Review hierarchies deeper than 3 layers
- **Each file has a clear responsibility**: Follows the single responsibility principle
- **Testability is ensured**: Design with dependency injection and mockability
- **No redundant intermediate layers**: Consider consolidating thin wrappers or meaningless relay layers

## Verification

**IMPORTANT**: After any code change, always perform verification regardless of the change size — run the build/test/lint or actual behavior appropriate to the change and read its output (`dev-practice:verify-before-done` skill). If the project has tests or CI configuration, always run them. Never mark a task "completed" without verification, and always include a verification step when writing an implementation plan or a Todo list. Read-only agents (`dev-practice:explorer`, `dev-practice:reviewer`) cannot run builds or tests; they name the verification to run instead.
</dev-practice-discipline>
