import type { Span, Turn } from '../types'

export const MAIN_LANE = 'main'

type Category = 'model' | 'read' | 'edit' | 'bash' | 'agent' | 'other'

// The surface draws the SVG as an isolated image, so the host theme never
// reaches it: these mid-tone colors are picked to read on light and dark.
const COLORS: Record<Category, string> = {
  model: '#8b6fd6',
  read: '#4a7fd4',
  edit: '#3a9d6a',
  bash: '#d08a2c',
  agent: '#2aa3a3',
  other: '#8a8f99',
}
const INK = '#8a8f99'
const ERROR = '#d9534f'

const LEGEND: readonly [Category, string][] = [
  ['model', 'モデル'],
  ['read', '読み取り・検索'],
  ['edit', '編集'],
  ['bash', 'Bash'],
  ['agent', 'サブエージェント'],
  ['other', 'その他'],
]

const READ_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch', 'ToolSearch'])
const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

export const categoryOf = (span: Span): Category => {
  if (span.kind === 'model') return 'model'
  if (span.label === 'Bash') return 'bash'
  if (span.label === 'Agent' || span.label === 'Task') return 'agent'
  if (EDIT_TOOLS.has(span.label)) return 'edit'
  if (READ_TOOLS.has(span.label)) return 'read'
  return 'other'
}

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`
  const seconds = ms / 1000
  if (seconds < 10) return `${seconds.toFixed(1)}s`
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds - minutes * 60)
  return rest === 0 ? `${minutes}m` : `${minutes}m${rest}s`
}

export const spanEnd = (span: Span, now: number): number => span.end ?? now

export const turnEnd = (turn: Turn, now: number): number =>
  Math.max(turn.end ?? now, ...turn.spans.map(span => spanEnd(span, now)))

export const laneLabels = (
  turn: Turn,
  names: Readonly<Record<string, string>>,
): Map<string, string> => {
  const order = [MAIN_LANE, ...new Set(turn.spans.map(span => span.lane))]
  const labels = new Map<string, string>()
  const used = new Map<string, number>()
  for (const lane of new Set(order)) {
    if (lane !== MAIN_LANE && !turn.spans.some(span => span.lane === lane)) continue
    const base = lane === MAIN_LANE ? 'lead' : (names[lane] ?? `agent ${lane.slice(0, 6)}`)
    const count = (used.get(base) ?? 0) + 1
    used.set(base, count)
    labels.set(lane, count === 1 ? base : `${base} #${count}`)
  }
  return labels
}

export const summarize = (turn: Turn, now: number): string => {
  const tools = turn.spans.filter(span => span.kind === 'tool')
  const models = turn.spans.filter(span => span.kind === 'model')
  const modelMs = models.reduce((sum, span) => sum + spanEnd(span, now) - span.start, 0)
  const agents = new Set(turn.spans.map(span => span.lane).filter(lane => lane !== MAIN_LANE))
  const parts = [
    `${formatDuration(turnEnd(turn, now) - turn.start)}${turn.end === null ? '（実行中）' : ''}`,
    `ツール ${tools.length} 回`,
    `モデル ${models.length} 回（${formatDuration(modelMs)}）`,
  ]
  if (agents.size > 0) parts.push(`サブエージェント ${agents.size}`)
  return parts.join(' · ')
}

export const slowest = (turn: Turn, now: number, count: number): Span[] =>
  turn.spans
    .filter(span => span.kind === 'tool')
    .sort((a, b) => spanEnd(b, now) - b.start - (spanEnd(a, now) - a.start))
    .slice(0, count)

const escape = (text: string): string =>
  text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char)

const STEPS_S = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]

const tickStep = (totalMs: number): number => {
  const step = STEPS_S.find(s => (totalMs / 1000) / s <= 6) ?? STEPS_S[STEPS_S.length - 1]!
  return step * 1000
}

const LABEL_W = 104
const CHART_W = 600
const PAD_R = 20
const SUB_ROW_H = 18
const LANE_GAP = 6
const BAR_H = 12
const TOP = 6
const AXIS_H = 18
const LEGEND_H = 22
const MAX_SUB_ROWS = 4
const SVG_LIMIT = 125_000

type Placed = { span: Span; y: number; row: number }

// Parallel tool calls overlap in time, so each lane is packed greedily into
// sub-rows; a lane never takes more than MAX_SUB_ROWS of them. `y` is the SVG
// position, `row` the plain sub-row index the terminal grid uses.
const pack = (turn: Turn, lanes: Map<string, string>, now: number) => {
  const placed: Placed[] = []
  const labels: { text: string; y: number; row: number }[] = []
  const separators: number[] = []
  let y = TOP
  let rowBase = 0
  for (const [lane, text] of lanes) {
    const spans = turn.spans.filter(span => span.lane === lane).sort((a, b) => a.start - b.start)
    const rowEnds: number[] = []
    for (const span of spans) {
      let row = rowEnds.findIndex(end => end <= span.start)
      if (row === -1) row = rowEnds.length < MAX_SUB_ROWS ? rowEnds.length : MAX_SUB_ROWS - 1
      rowEnds[row] = Math.max(rowEnds[row] ?? 0, spanEnd(span, now))
      placed.push({ span, y: y + row * SUB_ROW_H, row: rowBase + row })
    }
    labels.push({ text, y, row: rowBase })
    const rows = Math.max(1, rowEnds.length)
    y += rows * SUB_ROW_H + LANE_GAP
    rowBase += rows
    separators.push(y - LANE_GAP / 2)
  }
  return { placed, labels, separators, height: y, rowCount: rowBase }
}

export const toSvg = (
  turn: Turn,
  names: Readonly<Record<string, string>>,
  now: number,
  withTitles = true,
): string => {
  const lanes = laneLabels(turn, names)
  const end = Math.max(turnEnd(turn, now), turn.start + 1000)
  const total = end - turn.start
  const x = (t: number) => LABEL_W + ((t - turn.start) / total) * CHART_W
  const { placed, labels, separators, height: lanesBottom } = pack(turn, lanes, now)
  const axisY = lanesBottom + 2
  const legendY = axisY + AXIS_H
  const width = LABEL_W + CHART_W + PAD_R
  const height = legendY + LEGEND_H

  const parts: string[] = []
  const step = tickStep(total)
  for (let t = 0; t <= total; t += step) {
    const tx = x(turn.start + t).toFixed(1)
    parts.push(`<line x1="${tx}" y1="${TOP}" x2="${tx}" y2="${lanesBottom}" stroke="${INK}" stroke-opacity="0.25"/>`)
    parts.push(`<text x="${tx}" y="${axisY + 12}" text-anchor="middle">${formatDuration(t)}</text>`)
  }
  for (const sy of separators.slice(0, -1)) {
    parts.push(`<line x1="0" y1="${sy}" x2="${width}" y2="${sy}" stroke="${INK}" stroke-opacity="0.15"/>`)
  }
  for (const label of labels) {
    parts.push(`<text x="4" y="${label.y + 12}">${escape(label.text.slice(0, 16))}</text>`)
  }
  for (const { span, y } of placed) {
    const x1 = x(span.start)
    const w = Math.max(2, x(spanEnd(span, now)) - x1)
    const isRunning = span.end === null
    const stroke = span.isError ? ` stroke="${ERROR}" stroke-width="1.5"` : ''
    const title = withTitles
      ? `<title>${escape(`${span.label} · ${formatDuration(spanEnd(span, now) - span.start)}${isRunning ? '（実行中）' : ''}${span.detail ? `\n${span.detail}` : ''}`)}</title>`
      : ''
    parts.push(
      `<rect x="${x1.toFixed(1)}" y="${y + (SUB_ROW_H - BAR_H) / 2}" width="${w.toFixed(1)}" height="${BAR_H}" rx="2" fill="${COLORS[categoryOf(span)]}" fill-opacity="${isRunning ? 0.5 : 0.95}"${stroke}>${title}</rect>`,
    )
  }
  let lx = 4
  for (const [category, text] of LEGEND) {
    parts.push(`<rect x="${lx}" y="${legendY + 6}" width="10" height="10" rx="2" fill="${COLORS[category]}"/>`)
    parts.push(`<text x="${lx + 14}" y="${legendY + 15}">${text}</text>`)
    lx += 22 + text.length * 11
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="${INK}">${parts.join('')}</svg>`
  return svg.length > SVG_LIMIT && withTitles ? toSvg(turn, names, now, false) : svg
}

export const legend = (): readonly { glyph: string; text: string; color: string }[] => [
  ...LEGEND.map(([category, text]) => ({ glyph: '█', text, color: COLORS[category] })),
  { glyph: '▒', text: '実行中', color: INK },
  { glyph: '█', text: 'エラー・中断', color: ERROR },
]

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export const toBase64 = (bytes: Uint8Array): string => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!
    const b = bytes[i + 1]
    const c = bytes[i + 2]
    out += BASE64[a >> 2]
    out += BASE64[((a & 3) << 4) | ((b ?? 0) >> 4)]
    out += b === undefined ? '=' : BASE64[((b & 15) << 2) | ((c ?? 0) >> 6)]
    out += c === undefined ? '=' : BASE64[c & 63]
  }
  return out
}

const hex = (color: string) => Number.parseInt(color.slice(1), 16)
const DEFAULT_COLOR = 0x01000000
const FULL_BLOCK = 0x2588
const SHADE = 0x2592
const DOT = 0x254e

export type RasterChart = {
  columns: number
  rows: number
  cells: string
  labels: readonly { text: string; row: number }[]
  axis: string
}

// The terminal draws no Svg, so there the chart is a Raster: one cell row per
// sub-row, the label column and the time axis drawn as Text beside it.
export const toRaster = (
  turn: Turn,
  names: Readonly<Record<string, string>>,
  now: number,
  columns: number,
): RasterChart => {
  const width = Math.max(10, Math.min(512, Math.floor(columns)))
  const lanes = laneLabels(turn, names)
  const { placed, labels, rowCount } = pack(turn, lanes, now)
  const rows = Math.max(1, Math.min(256, rowCount))
  const end = Math.max(turnEnd(turn, now), turn.start + 1000)
  const total = end - turn.start
  const col = (t: number) => Math.max(0, Math.min(width - 1, Math.floor(((t - turn.start) / total) * width)))

  const words = new Uint32Array(width * rows * 3)
  const paint = (row: number, column: number, glyph: number, fg: number) => {
    const at = (row * width + column) * 3
    words[at] = glyph
    words[at + 1] = fg
    words[at + 2] = DEFAULT_COLOR
  }
  const step = tickStep(total)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < width; column++) paint(row, column, 0x20, DEFAULT_COLOR)
    for (let t = 0; t <= total; t += step) paint(row, col(turn.start + t), DOT, hex(INK))
  }
  for (const { span, row } of placed) {
    if (row >= rows) continue
    const from = col(span.start)
    const to = Math.max(from, col(spanEnd(span, now)))
    const fg = hex(span.isError ? ERROR : COLORS[categoryOf(span)])
    for (let column = from; column <= to; column++) paint(row, column, span.end === null ? SHADE : FULL_BLOCK, fg)
  }

  const axis = Array.from({ length: width }, () => ' ')
  for (let t = 0; t <= total; t += step) {
    const text = formatDuration(t)
    const at = Math.min(col(turn.start + t), width - text.length)
    if (axis.slice(at, at + text.length).every(char => char === ' ')) axis.splice(at, text.length, ...text)
  }

  return {
    columns: width,
    rows,
    cells: toBase64(new Uint8Array(words.buffer)),
    labels: labels.filter(label => label.row < rows).map(({ text, row }) => ({ text, row })),
    axis: axis.join('').trimEnd(),
  }
}
