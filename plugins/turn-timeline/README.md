# turn-timeline

A mod (a plugin of function hooks) that charts where each turn's time went: every model request and every tool call, laid out as a Gantt chart with one lane for the lead and one per subagent.

## Usage

| Entry point | What it does |
| --- | --- |
| `timeline` button in the prompt footer | Opens the pane; pressed again, closes it. |
| `/timeline` | Opens the pane. Where no pane can be placed, draws the chart inline in the transcript instead. |
| `/timeline inline` | Draws the latest turn's chart inline in the transcript. |
| `/timeline stats` | Prints the time the mod's own recording costs per tool call and model request (p50 / p95 / max). `stats reset` clears the samples. |

In the pane, running bars grow live, a picker switches between the last 20 turns, and the three slowest tool calls are listed under the chart. Hovering a bar shows its command, duration, and token counts. Colors are by kind: model, read/search, edit, Bash, subagent, other. A failed or interrupted call has a red outline in the `Svg` chart and is drawn red in the terminal grid.

The desktop app, VS Code, and mobile draw the chart as an `Svg`. The terminal draws the same chart as a `Raster` grid of colored cells, sized to the pane's body (inline, to the screen, capped at 80 columns while a pane is docked), with lane labels to its left and the time axis and legend below; running calls show as `▒`. Hover details are desktop-only.

## Design stance

Spans are charted under the turn that started them, not the newest turn: a background subagent keeps working after its turn completes, and its work stays with that turn.

Recording never runs in front of the call it records. The hook hands the tool or model request on at once and writes the span beside it, waiting for that write only at the end. `/timeline stats` reports the cost that remains on the critical path as `before` + `wait` + `after`, and `record` as what the write itself takes.

Each turn is its own `$.state` family member, so a write touches one turn and finished turns never redraw. The pane redraws once a second only while it is open and something is running.

Nothing the mod records is sent to the model. The only text that reaches the conversation is what `/timeline` prints: one line, or the stats table for `/timeline stats`.

## Development

```
claude plugin validate plugins/turn-timeline
claude plugin test plugins/turn-timeline
```

`tsconfig.json` extends `.claude-plugin/types/`, which the engine writes only when an interactive session hot-reloads the folder. Start one with `claude --plugin-dir plugins/turn-timeline` once; after that `tsc -p plugins/turn-timeline` type-checks. A marketplace install never writes it.
