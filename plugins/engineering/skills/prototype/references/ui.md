# UI Prototype

Generate several radically different UI variants on a single route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one (or steals bits from each), then the rest gets thrown away.

If the question is about logic/state rather than what something looks like, use [logic.md](logic.md).

## Where variants live

Prefer rendering variants **on an existing route** (or a section that would naturally live inside one), gated by a `?variant=` search param — real header, real data, real density judges variants far better than an empty page. Only create a throwaway route as a last resort, when there's genuinely no existing page to host it, and name it so it's obviously a prototype.

## Shape

1. **State the question and pick N** — default to 3 variants, cap at 5. Write the plan in one line: "Three variants of the settings page, switchable via `?variant=`, on the existing `/settings` route."
2. **Draft variants that are structurally different** — different layout, different information hierarchy, different primary affordance, not just different colors. Each gets a clear exported name (`VariantA`, `VariantB`, ...).
3. **Wire them together** with a switcher on the route: read `?variant=` (default `'A'`), render the matching component, keep all existing data fetching above the switch — only the rendered subtree changes per variant.
4. **Build a floating bottom-bar switcher**: left arrow (previous, wraps), current variant label, right arrow (next, wraps). Clicking or `←`/`→` updates the URL param via the router (don't intercept arrow keys while an input/textarea is focused). Make it visually distinct from the page, and gate it out of production builds.

## Print/render on switch

Every variant switch should make the current variant obvious from the label and URL — no separate state dump needed, the rendered variant *is* the state being judged.

## Anti-patterns

- Variants that differ only in color or copy — that's a tweak, not a prototype.
- Sharing a `<Layout>` between variants — a shared `<Header>` is fine, a shared layout defeats the point.
- Wiring variants to real mutations — read-only, or stubbed if a variant needs one.
- Promoting prototype code straight to production — rewrite it properly once it wins.
