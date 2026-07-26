# Logic Prototype

A tiny interactive terminal app that lets the user drive a state model by hand. Use this when the question is about business logic, state transitions, or data shape — the kind of thing that looks reasonable on paper but only feels wrong once pushed through real cases.

If the question is "what should this look like" instead, use [ui.md](ui.md).

## Shape

1. **State the question** — one line at the top of the file: what state model, what's being tested.
2. **Isolate the logic in a portable module.** Behind a small pure interface: a reducer (`(state, action) => state`), an explicit state machine, or a set of pure functions — whichever fits the question. No I/O, no terminal code, no `console.log` inside it. This is the part worth lifting into real code later.
3. **Build the smallest TUI that exposes the state.** On every tick, clear the screen and re-render the whole frame — one stable view, not scrollback. Each frame:
   - **Current state**, pretty-printed (one field per line, or formatted JSON).
   - **Keyboard shortcuts** at the bottom, e.g. `[a] add user  [d] delete user  [q] quit`.
   Read one keystroke, dispatch to a handler that mutates state, re-render, loop until quit.
4. **Make it runnable in one command** via the project's existing task runner.

## Variants

None — a logic prototype has one state model and one set of handlers, driven interactively. Adding handlers as the user asks "what if X" is expected; adding parallel implementations to compare is not the point of this shape (that's the UI branch).

## Anti-patterns

- No tests — a prototype that needs tests is no longer a prototype.
- No real database — in-memory unless persistence itself is the question.
- No generalizing — answer one question, not "what if we needed X later."
- Keep the logic module pure — if it references `console.log` or terminal escapes, it's no longer portable.
