export type SpanKind = 'model' | 'tool'

export type Span = {
  id: string
  lane: string
  kind: SpanKind
  label: string
  detail: string
  start: number
  end: number | null
  isError: boolean
}

export type Turn = {
  id: string
  seq: number
  prompt: string
  start: number
  end: number | null
  spans: Span[]
}

export type TurnEntry = { id: string; seq: number; prompt: string }

export type Lane = { label: string; turnId: string }

declare module 'claude-code' {
  interface PluginState {
    'turn-timeline': {
      index: TurnEntry[]
      turn: StateFamily<Turn | null>
      lanes: Record<string, Lane>
      selected: string | null
      seq: number
      tick: number
      isOpen: boolean
    }
  }
}
