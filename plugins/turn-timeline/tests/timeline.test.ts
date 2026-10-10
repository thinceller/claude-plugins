import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Span } from '../types'
import { formatDuration, toBase64, toRaster, toSvg } from '../hooks/chart'
import { measure, report, resetStats } from '../hooks/stats'

const PLUGIN = 'turn-timeline'

const answerTurns = (on: On) => {
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
}

const inline = (seq: number) => ({
  command: 'timeline',
  args: 'inline',
  text: `Turn #${seq} のタイムライン: …`,
  isErrored: false,
})

const completion = (turnId: string) =>
  ({ answer: 'done', durationMs: 1, isAborted: false, turnId, model: 'opus', reason: 'answer' }) as const

test('records each lane of a turn and draws it inline', async ($, on) => {
  const clock = mock.clock(on, { now: 10_000 })
  answerTurns(on)
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'agent-1' }))
  on('tool.call', async () => {
    await clock.sleep(4_000)
    return { result: { stdout: 'ok', stderr: '', interrupted: false } } as never
  })

  await $.turn.start({ text: 'nix build して', turnId: 't1' })
  await $.agent.spawn({
    tool_use_id: 'u0',
    prompt: '調べて',
    description: '調査',
    subagentType: 'explorer',
    parentModel: 'opus',
    background: true,
    fork: false,
  } as never)
  const lead = $.tool.call({ tool: 'Bash', tool_use_id: 'u1', command: 'nix build .#a' } as never)
  const agent = $.tool.call({ tool: 'Grep', tool_use_id: 'u2', agentId: 'agent-1', pattern: 'comin' } as never)
  await clock.advance(4_000)
  await Promise.all([lead, agent])
  await $.turn.complete(completion('t1'))

  const props = inline(1)
  const desktop = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'CommandOutput', props })
  const source = String((await desktop.find({ type: 'Svg' }))?.props.source)
  expect(source).toContain('nix build .#a')
  expect(source).toContain('explorer')
  expect(source).toContain('comin')
  await desktop.unmount()

  const terminal = await $.ui.mount({
    plugin: PLUGIN,
    surface: 'terminal',
    component: 'CommandOutput',
    props,
    viewport: { columns: 100, rows: 40 },
  })
  const raster = await terminal.find({ type: 'Raster' })
  expect(raster?.props.columns).toBe(100 - 12 - 1)
  expect(raster?.props.rows).toBe(2)
  expect(await terminal.find({ type: 'Text', text: 'explorer' })).toBeDefined()
  expect(await terminal.find({ type: 'Svg' })).toBeUndefined()
  await terminal.unmount()
})

test('a background agent stays charted under the turn that spawned it', async ($, on) => {
  mock.clock(on, { now: 0 })
  answerTurns(on)
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'bg' }))
  on('tool.call', async () => ({ result: { stdout: 'ok' } }) as never)

  await $.turn.start({ text: 'first', turnId: 't1' })
  await $.agent.spawn({ tool_use_id: 'u0', prompt: 'p', description: 'd', subagentType: 'explorer', parentModel: 'opus', background: true, fork: false } as never)
  await $.turn.complete(completion('t1'))
  await $.turn.start({ text: 'second', turnId: 't2' })
  await $.tool.call({ tool: 'Grep', tool_use_id: 'u1', agentId: 'bg', pattern: 'late-agent-work' } as never)
  await $.tool.call({ tool: 'Read', tool_use_id: 'u2', file_path: 'lead-work.md' } as never)

  const sourceOf = async (seq: number) => {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'CommandOutput', props: inline(seq) })
    const source = String((await ui.find({ type: 'Svg' }))?.props.source)
    await ui.unmount()
    return source
  }
  const first = await sourceOf(1)
  const second = await sourceOf(2)
  expect(first).toContain('late-agent-work')
  expect(second).not.toContain('late-agent-work')
  expect(second).toContain('lead-work.md')
})

test('the pane follows the latest turn until another is picked', async ($, on) => {
  mock.clock(on, { now: 0 })
  answerTurns(on)
  for (const turnId of ['t1', 't2']) {
    await $.turn.start({ text: `prompt ${turnId}`, turnId })
    await $.turn.complete(completion(turnId))
  }

  const ui = await $.ui.mount({
    plugin: PLUGIN,
    surface: 'desktop',
    component: 'Pane',
    requestId: 'timeline',
    props: {
      title: 'Timeline',
      isFocused: true,
      bodyColumns: 80,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  })
  expect(await ui.find({ type: 'Text', text: 'Turn #2' })).toBeDefined()
  expect(await ui.find({ key: 'follow' })).toBeUndefined()

  await ui.select({ key: 'turn', value: 't1' })
  expect(await ui.find({ type: 'Text', text: 'Turn #1' })).toBeDefined()

  await ui.press({ key: 'follow' })
  expect(await ui.find({ type: 'Text', text: 'Turn #2' })).toBeDefined()
  await ui.unmount()
})

test('a tool call is recorded and its overhead measured', async ($, on) => {
  mock.clock(on, { now: 0 })
  answerTurns(on)
  on('tool.call', async () => ({ result: { stdout: 'ok' } }) as never)
  await $.turn.start({ text: 'x', turnId: 't1' })
  await $.tool.call({ tool: 'Read', tool_use_id: 'u1', file_path: 'a.md' } as never)

  const stats = await $.command.run({
    command: 'timeline',
    args: 'stats',
    origin: { kind: 'user' },
    presentation: { isFullscreen: false, columns: 80 },
  } as never)
  for (const name of ['tool.after', 'tool.before', 'tool.record', 'tool.wait']) expect(stats.text).toContain(`${name}: n=1`)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'CommandOutput', props: inline(1) })
  expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('a.md')
  await ui.unmount()
})

test('stats report percentiles per metric', async () => {
  resetStats()
  for (const value of [1, 2, 3, 4, 100]) measure('x', value)
  expect(report()).toEqual(['x: n=5 p50=3.00ms p95=100.00ms max=100.00ms'])
})

test('the footer button toggles the pane and keeps the engine modes', async ($, on) => {
  const opened: string[] = []
  const closed: string[] = []
  on('ui.open', (_$, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', (_$, e) => {
    closed.push(e.id)
    return { value: undefined }
  })

  for (const surface of ['desktop', 'terminal'] as const) {
    opened.length = 0
    closed.length = 0
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, component: 'SessionMode', props: { modes: ['focus'] } })
    expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()

    await ui.press({ key: 'timeline' })
    expect(opened).toEqual(['timeline'])
    expect((await ui.find({ key: 'timeline' }))?.props.label).toBe('timeline ×')

    await ui.press({ key: 'timeline' })
    expect(closed).toEqual(['timeline'])
    expect((await ui.find({ key: 'timeline' }))?.props.label).toBe('timeline')
    await ui.unmount()
  }
})

const span = (id: string, start: number, end: number, label: string, detail: string): Span => ({
  id,
  lane: 'main',
  kind: 'tool',
  label,
  detail,
  start,
  end,
  isError: false,
})

test('the chart packs overlapping calls into rows and escapes text', async () => {
  const turn = {
    id: 't',
    seq: 1,
    prompt: '',
    start: 0,
    end: 3_000,
    spans: [span('a', 0, 2_000, 'Bash', 'echo <x> & y'), span('b', 500, 1_500, 'Read', '')],
  }
  const svg = toSvg(turn, {}, 3_000)
  expect(svg).toContain('echo &lt;x&gt; &amp; y')
  const rows = [...svg.matchAll(/<rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="12"/g)].map(m => m[1])
  expect(new Set(rows).size).toBe(2)
  expect(formatDuration(75_000)).toBe('1m15s')
  expect(formatDuration(4_000)).toBe('4.0s')
})

test('the terminal grid packs rows and encodes cells as the Raster expects', async () => {
  expect(toBase64(new Uint8Array(Uint32Array.of(0x2588, 0xff8800, 0x01000000).buffer))).toBe('iCUAAACI/wAAAAAB')

  const turn = {
    id: 't',
    seq: 1,
    prompt: '',
    start: 0,
    end: 3_000,
    spans: [span('a', 0, 2_000, 'Bash', ''), span('b', 500, 1_500, 'Read', '')],
  }
  const grid = toRaster(turn, {}, 3_000, 40)
  expect(grid.columns).toBe(40)
  expect(grid.rows).toBe(2)
  expect(grid.labels).toEqual([{ text: 'lead', row: 0 }])
  expect(grid.cells.length).toBe(Math.ceil((40 * 2 * 12) / 3) * 4)
  expect(grid.axis.startsWith('0ms')).toBe(true)
})
