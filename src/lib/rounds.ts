export type ModuleId = 'tables' | 'addition' | 'subtraction'

export type RoundRecord = {
  id: string
  /** Epoch ms when the round finished */
  completedAt: number
  module: ModuleId
  /** e.g. "17" for tables, "2-1" for addition level */
  subModule: string
  label: string
  totalFacts: number
  correctCount: number
  wrongCount: number
  timeoutCount: number
  /** Average time for correct answers in this round */
  avgCorrectMs: number | null
  /** Wall-clock session length */
  durationMs: number
  /** Snapshot after session (addition/subtraction) */
  weakCount?: number
  masteredCount?: number
  seenCount?: number
}

export type SubModuleStats = {
  module: ModuleId
  subModule: string
  label: string
  rounds: number
  bestAvgMs: number | null
  latestAvgMs: number | null
  avgOfAvgsMs: number | null
  totalWrong: number
  totalTimeouts: number
  /** Oldest → newest avg times for sparkline */
  avgHistory: number[]
}

const ROUNDS_KEY = 'mental-maths:rounds:v1'

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function readAll(): RoundRecord[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RoundRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(rounds: RoundRecord[]): void {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds))
}

export function saveRound(
  input: Omit<RoundRecord, 'id' | 'completedAt'> & { completedAt?: number },
): RoundRecord {
  const record: RoundRecord = {
    id: uid(),
    completedAt: input.completedAt ?? Date.now(),
    module: input.module,
    subModule: input.subModule,
    label: input.label,
    totalFacts: input.totalFacts,
    correctCount: input.correctCount,
    wrongCount: input.wrongCount,
    timeoutCount: input.timeoutCount,
    avgCorrectMs: input.avgCorrectMs,
    durationMs: input.durationMs,
    weakCount: input.weakCount,
    masteredCount: input.masteredCount,
    seenCount: input.seenCount,
  }
  const all = readAll()
  all.push(record)
  writeAll(all)
  return record
}

export function listRounds(module?: ModuleId): RoundRecord[] {
  const all = readAll().sort((a, b) => a.completedAt - b.completedAt)
  return module ? all.filter((r) => r.module === module) : all
}

export function listRoundsForSub(
  module: ModuleId,
  subModule: string,
): RoundRecord[] {
  return listRounds(module).filter((r) => r.subModule === subModule)
}

export function clearAllRounds(): void {
  writeAll([])
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function summarizeSubModules(module?: ModuleId): SubModuleStats[] {
  const rounds = listRounds(module)
  const map = new Map<string, RoundRecord[]>()

  for (const r of rounds) {
    const key = `${r.module}::${r.subModule}`
    const list = map.get(key) ?? []
    list.push(r)
    map.set(key, list)
  }

  const stats: SubModuleStats[] = []
  for (const group of map.values()) {
    const sorted = [...group].sort((a, b) => a.completedAt - b.completedAt)
    const avgs = sorted
      .map((r) => r.avgCorrectMs)
      .filter((n): n is number => n != null)
    const first = sorted[0]
    stats.push({
      module: first.module,
      subModule: first.subModule,
      label: first.label,
      rounds: sorted.length,
      bestAvgMs: avgs.length ? Math.min(...avgs) : null,
      latestAvgMs: avgs.length ? avgs[avgs.length - 1] : null,
      avgOfAvgsMs: avg(avgs),
      totalWrong: sorted.reduce((s, r) => s + r.wrongCount, 0),
      totalTimeouts: sorted.reduce((s, r) => s + r.timeoutCount, 0),
      avgHistory: avgs,
    })
  }

  return stats.sort((a, b) => a.label.localeCompare(b.label))
}

export function moduleLabel(module: ModuleId): string {
  if (module === 'tables') return 'Tables'
  if (module === 'addition') return 'Addition'
  return 'Subtraction'
}

/** Avg correct ms series oldest → newest for charting */
export function avgSeries(module?: ModuleId, subModule?: string, limit = 20): number[] {
  let rounds = listRounds(module)
  if (subModule) rounds = rounds.filter((r) => r.subModule === subModule)
  return rounds
    .map((r) => r.avgCorrectMs)
    .filter((n): n is number => n != null)
    .slice(-limit)
}

export type BarDatum = { label: string; value: number; id: string }

export function roundsPerSubmodule(module?: ModuleId): BarDatum[] {
  return summarizeSubModules(module).map((s) => ({
    id: s.subModule,
    label: s.label,
    value: s.rounds,
  }))
}
