const LIMIT = 500

// Module-level on purpose: measuring must not add `$.state` writes of its own,
// so the samples start over on every reload of the mod.
const samples = new Map<string, number[]>()

export const measure = (name: string, ms: number) => {
  const list = samples.get(name) ?? []
  list.push(ms)
  if (list.length > LIMIT) list.shift()
  samples.set(name, list)
}

export const resetStats = () => samples.clear()

const at = (sorted: readonly number[], q: number): number =>
  sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0

const ms = (value: number) => `${value.toFixed(2)}ms`

export const report = (): string[] =>
  [...samples]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, list]) => {
      const sorted = [...list].sort((a, b) => a - b)
      return `${name}: n=${sorted.length} p50=${ms(at(sorted, 0.5))} p95=${ms(at(sorted, 0.95))} max=${ms(sorted.at(-1) ?? 0)}`
    })
