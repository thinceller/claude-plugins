import { atom, memberOf, read, update } from 'claude-code'
import type { ElementTable, EngineInterface, Register, RenderInput, Timer } from 'claude-code'

import type { Span, Turn, TurnEntry } from '../types'
import { MAIN_LANE, formatDuration, laneLabels, legend, slowest, spanEnd, summarize, toRaster, toSvg } from './chart'
import { measure, report, resetStats } from './stats'

const PANE = 'timeline'
const MAX_TURNS = 20
const MAX_SPANS = 400
const TITLE_PATTERN = /Turn #(\d+) のタイムライン/

const index = atom({ plugin: 'turn-timeline', key: 'index' } as const, [])
const lanes = atom({ plugin: 'turn-timeline', key: 'lanes' } as const, {})
const selected = atom({ plugin: 'turn-timeline', key: 'selected' } as const, null)
const seq = atom({ plugin: 'turn-timeline', key: 'seq' } as const, 0)
const tick = atom({ plugin: 'turn-timeline', key: 'tick' } as const, 0)
const isOpen = atom({ plugin: 'turn-timeline', key: 'isOpen' } as const, false)
const turnFamily = atom({ plugin: 'turn-timeline', key: 'turn' } as const, null)

// Spans go to the turn they belong to, not the newest one: a background
// subagent keeps working after the turn that spawned it has completed.
const turnFor = async ($: EngineInterface, lane: string): Promise<string | undefined> => {
  if (lane !== MAIN_LANE) {
    const owner = (await read($, lanes))[lane]
    if (owner !== undefined) return owner.turnId
  }
  return (await read($, index)).at(-1)?.id
}

// A main-lane span that lands after its turn completed (the turn was
// interrupted while the write was in flight) is stored closed, so it can
// never stay running. Subagent lanes legitimately outlive their turn.
const addSpan = ($: EngineInterface, turnId: string, span: Span) =>
  update($, memberOf(turnFamily, { requestId: turnId }), turn => {
    if (turn === null || turn.spans.length >= MAX_SPANS) return turn
    const stored = span.lane === MAIN_LANE && turn.end !== null ? { ...span, end: turn.end, isError: true } : span
    return { ...turn, spans: [...turn.spans, stored] }
  })

const endSpan = ($: EngineInterface, turnId: string, id: string, end: number, isError: boolean, detail?: string) =>
  update($, memberOf(turnFamily, { requestId: turnId }), turn =>
    turn === null || !turn.spans.some(span => span.id === id)
      ? turn
      : {
          ...turn,
          spans: turn.spans.map(span =>
            span.id === id ? { ...span, end, isError, detail: detail ?? span.detail } : span,
          ),
        },
  )

// Recording runs beside the tool or model request instead of in front of it:
// the hook hands `next` the call at once and waits for this only at the end.
const beginSpan = async ($: EngineInterface, span: Span, knownTurnId?: string): Promise<string | undefined> => {
  const began = performance.now()
  try {
    const start = await $.clock.now()
    const turnId = knownTurnId ?? (await turnFor($, span.lane))
    if (turnId !== undefined) {
      await addSpan($, turnId, { ...span, start })
      await startTicking($)
    }
    measure(`${span.kind}.record`, performance.now() - began)
    return turnId
  } catch {
    measure(`${span.kind}.record.failed`, performance.now() - began)
    return undefined
  }
}

// The critical path a call pays is `before` + `wait` + `after`: `wait` is the
// part of the recording still unfinished when the tool or request returned.
const finishSpan = async (
  $: EngineInterface,
  recording: Promise<string | undefined>,
  span: Span,
  isError: boolean,
  detail?: string,
) => {
  const end = await $.clock.now()
  const waited = performance.now()
  const turnId = await recording
  const written = performance.now()
  measure(`${span.kind}.wait`, written - waited)
  if (turnId !== undefined) await endSpan($, turnId, span.id, end, isError, detail)
  measure(`${span.kind}.after`, performance.now() - written)
}

const closeLane = (turn: Turn, lane: string, end: number): Turn => ({
  ...turn,
  spans: turn.spans.map(span => (span.lane === lane && span.end === null ? { ...span, end, isError: true } : span)),
})

const describeInput = (input: Readonly<Record<string, unknown>>): string => {
  for (const key of ['command', 'file_path', 'pattern', 'url', 'query', 'description', 'prompt']) {
    const value = input[key]
    if (typeof value === 'string' && value !== '') return value.replace(/\s+/g, ' ').slice(0, 160)
  }
  return ''
}

type PaneControls = { entries: readonly TurnEntry[]; isPinned: boolean }

const LABEL_COLUMNS = 12

const draw = async ($: EngineInterface, e: RenderInput, turn: Turn, columns: number, controls?: PaneControls) => {
  const now = await $.clock.now()
  const names = Object.fromEntries(Object.entries(await read($, lanes)).map(([id, lane]) => [id, lane.label]))
  const labels = laneLabels(turn, names)
  // Every table is completed to every element name (a missing one draws a
  // fragment), so the surface, not `in`, decides what is really drawn.
  const els = $.ui.resolve(e)
  const { Box, Text, Svg, Button, Select } = els as ElementTable<'desktop'>
  const header = (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      <Text bold>Turn #{turn.seq}</Text>
      <Text dimColor>{summarize(turn, now)}</Text>
    </Box>
  )

  let chart
  if (e.surface === 'terminal') {
    const { Raster } = els as ElementTable<'terminal'>
    const grid = toRaster(turn, names, now, columns - LABEL_COLUMNS - 1)
    const rowLabels = Array.from({ length: grid.rows }, (_, row) => grid.labels.find(label => label.row === row)?.text ?? ' ')
    chart = (
      <Box flexDirection="column">
        <Box flexDirection="row" columnGap={1}>
          <Box flexDirection="column" width={LABEL_COLUMNS}>
            {rowLabels.map(text => (
              <Text dimColor wrap="truncate-end">{text}</Text>
            ))}
          </Box>
          <Raster key="chart" columns={grid.columns} rows={grid.rows} cells={grid.cells} />
        </Box>
        <Box flexDirection="row" columnGap={1}>
          <Box width={LABEL_COLUMNS} />
          <Text dimColor wrap="truncate-end">{grid.axis}</Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
          {legend().map(item => (
            <Box flexDirection="row" columnGap={1}>
              <Text color={item.color}>{item.glyph}</Text>
              <Text dimColor>{item.text}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  } else {
    chart = <Svg source={toSvg(turn, names, now)} alt={`Turn #${turn.seq} のモデル呼び出しとツール実行のタイムライン`} isInteractive />
  }

  const slow = slowest(turn, now, 3)
  const picker =
    controls !== undefined && e.surface !== 'mobile' && controls.entries.length > 1 ? (
      <Select
        key="turn"
        label="ターン"
        value={turn.id}
        options={[...controls.entries].reverse().map(entry => ({
          value: entry.id,
          label: `#${entry.seq} ${entry.prompt || '(継続)'}`,
        }))}
        onSelect={value => void update($, selected, () => value)}
      />
    ) : null

  return (
    <Box flexDirection="column" gap={1}>
      {header}
      {picker}
      {chart}
      {slow.length > 0 && (
        <Box flexDirection="column">
          <Text bold>時間がかかったツール</Text>
          {slow.map(span => (
            <Text wrap="truncate-end">
              {formatDuration(spanEnd(span, now) - span.start)} · {labels.get(span.lane) ?? span.lane} · {span.label}
              {span.detail ? ` · ${span.detail}` : ''}
            </Text>
          ))}
        </Box>
      )}
      {controls?.isPinned === true && (
        <Button key="follow" label="最新のターンに戻る" onPress={() => void update($, selected, () => null)} />
      )}
    </Box>
  )
}

let ticker: Timer | undefined

const advanceTick = async ($: EngineInterface) => {
  const began = performance.now()
  const recent = (await read($, index)).slice(-3)
  const turns = await Promise.all(recent.map(entry => read($, memberOf(turnFamily, { requestId: entry.id }))))
  const isRunning = turns.some(t => t !== null && (t.end === null || t.spans.some(s => s.end === null)))
  // The engine's record, not the atom: a pane closed on an unload never raises
  // the `ui.close` hook that would clear `isOpen`.
  const isShown = (await $.ui.panes()).some(pane => pane.id === PANE)
  if (!isShown) await update($, isOpen, () => false)
  if (!isRunning || !isShown) {
    ticker?.cancel()
    ticker = undefined
    return
  }
  await update($, tick, n => n + 1)
  measure('tick', performance.now() - began)
}

// Running bars grow with time, which no span write reflects. Only the Pane
// hook reads `tick`, so bumping it redraws the pane and nothing else; it runs
// only while the pane is open and the recent turns hold a running span.
const startTicking = async ($: EngineInterface) => {
  if (ticker !== undefined || !(await read($, isOpen))) return
  ticker ??= $.clock.every(1000, () => void advanceTick($))
}

const openPane = async ($: EngineInterface) => {
  await update($, selected, () => null)
  const opened = await $.ui.open({ id: PANE, title: 'Timeline' })
  await update($, isOpen, () => opened.isPlaced)
  await startTicking($)
  return opened
}

const togglePane = async ($: EngineInterface) => {
  if (await read($, isOpen)) {
    await $.ui.close({ id: PANE })
    await update($, isOpen, () => false)
  } else {
    await openPane($)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'timeline',
      description: 'ターン内のモデル呼び出しとツール実行をタイムラインで表示（inline でトランスクリプトに描く）',
      argumentHint: '[inline | stats | stats reset]',
      immediate: true,
    })
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    const start = await $.clock.now()
    const n = await update($, seq, value => value + 1)
    const prompt = e.text.replace(/\s+/g, ' ').slice(0, 60)
    await update($, memberOf(turnFamily, { requestId: e.turnId }), () => ({ id: e.turnId, seq: n, prompt, start, end: null, spans: [] }))
    const before = await read($, index)
    await update($, index, list => [...list, { id: e.turnId, seq: n, prompt }].slice(-MAX_TURNS))
    for (const evicted of before.slice(0, Math.max(0, before.length + 1 - MAX_TURNS))) {
      await update($, memberOf(turnFamily, { requestId: evicted.id }), () => null)
    }
    await startTicking($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const end = await $.clock.now()
    if (e.agentId === undefined) {
      await update($, memberOf(turnFamily, { requestId: e.turnId }), turn => (turn === null ? turn : { ...closeLane(turn, MAIN_LANE, end), end }))
    } else {
      const agentId = e.agentId
      const turnId = await turnFor($, agentId)
      if (turnId !== undefined) {
        await update($, memberOf(turnFamily, { requestId: turnId }), turn => (turn === null ? turn : closeLane(turn, agentId, end)))
      }
    }
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    const agentId = spawned.agentId
    const turnId = (await read($, index)).at(-1)?.id
    if (agentId !== undefined && turnId !== undefined) {
      await update($, lanes, all => ({ ...all, [agentId]: { label: e.name ?? e.subagentType, turnId } }))
      await startTicking($)
    }
    return spawned
  })

  on('tool.call', async ($, e, next) => {
    const entered = performance.now()
    const span: Span = {
      id: e.tool_use_id,
      lane: e.agentId ?? MAIN_LANE,
      kind: 'tool',
      label: e.tool,
      detail: describeInput(e as unknown as Record<string, unknown>),
      start: 0,
      end: null,
      isError: false,
    }
    const recording = beginSpan($, span)
    measure('tool.before', performance.now() - entered)
    let isError = true
    try {
      const ran = await next(e)
      isError = ran.deny !== undefined || ran.isError === true
      return ran
    } finally {
      await finishSpan($, recording, span, isError)
    }
  })

  on('turn.step', async function* ($, e, next) {
    const entered = performance.now()
    const lane = e.agentId ?? MAIN_LANE
    const span: Span = {
      id: `${lane}:${e.turnId}:${e.index}`,
      lane,
      kind: 'model',
      label: e.model,
      detail: `リクエスト #${e.index + 1}`,
      start: 0,
      end: null,
      isError: false,
    }
    const recording = beginSpan($, span, lane === MAIN_LANE ? e.turnId : undefined)
    measure('model.before', performance.now() - entered)
    let detail: string | undefined
    let isError = true
    try {
      const result = yield* next(e)
      isError = false
      if (result.usage) {
        const u = result.usage
        const input = u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
        detail = `${u.model} · 入力 ${input} tok · 出力 ${u.output_tokens} tok`
      }
      return result
    } finally {
      await finishSpan($, recording, span, isError, detail)
    }
  })

  on('command.run', { command: 'timeline' }, async ($, e) => {
    const args = e.args.trim()
    if (args === 'stats' || args === 'stats reset') {
      const lines = report()
      if (args === 'stats reset') resetStats()
      return { text: lines.length === 0 ? '計測値はまだありません。' : `turn-timeline の計測値（直近 500 件）\n${lines.join('\n')}` }
    }
    const latest = (await read($, index)).at(-1)
    const turn = latest === undefined ? null : await read($, memberOf(turnFamily, { requestId: latest.id }))
    if (turn === null) return { text: 'まだ記録したターンがありません。' }

    if (args !== 'inline') {
      const opened = await openPane($)
      if (opened.isPlaced) return { text: `タイムラインをペインに表示しました（最新は Turn #${turn.seq}）。` }
      await $.ui.close({ id: PANE })
      $.ui.log(`turn-timeline: ペインが配置されなかったのでインラインで描きます（${opened.reason}）`)
    }
    return { text: `Turn #${turn.seq} のタイムライン: ${summarize(turn, await $.clock.now())}` }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    await update($, isOpen, () => false)
    return next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const open = await read($, isOpen)
    return (
      <Box flexDirection="row" columnGap={1}>
        {e.props.modes.length > 0 && <Text dimColor>{e.props.modes.join(' & ')}</Text>}
        <Button key="timeline" plain dimColor label={open ? 'timeline ×' : 'timeline'} onPress={() => void togglePane($)} />
      </Box>
    )
  })

  on('ui.render', { component: 'CommandOutput', props: { command: 'timeline' } }, async ($, e, next) => {
    const match = TITLE_PATTERN.exec(e.props.text)
    const entry = match === null ? undefined : (await read($, index)).find(one => one.seq === Number(match[1]))
    const turn = entry === undefined ? null : await read($, memberOf(turnFamily, { requestId: entry.id }))
    if (turn === null) return next(e)
    // A command row is as wide as the transcript, which a docked pane narrows
    // below the screen; the row reports no width of its own, so stay narrow then.
    const screen = e.viewport?.columns ?? 80
    const isDocked = e.viewport?.isFullscreen === true && (await $.ui.panes()).some(pane => pane.isPlaced)
    return draw($, e, turn, isDocked ? Math.min(screen, 80) : screen)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await read($, tick)
    const entries = await read($, index)
    const pinned = await read($, selected)
    const entry = entries.find(one => one.id === pinned) ?? entries.at(-1)
    const turn = entry === undefined ? null : await read($, memberOf(turnFamily, { requestId: entry.id }))
    if (turn === null) {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>次のターンから記録します。</Text>
    }
    const began = performance.now()
    const tree = await draw($, e, turn, e.props.bodyColumns, { entries, isPinned: pinned !== null && entry?.id === pinned })
    measure('pane.render', performance.now() - began)
    return tree
  })
}
