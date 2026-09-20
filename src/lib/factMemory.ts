import {
  makeProblem,
  type ArithProblem,
  type DigitSize,
  type OpKind,
  type OpLevel,
} from './arithmetic'

export type FactStatus = 'learning' | 'weak' | 'mastered'

export type FactRecord = {
  a: number
  b: number
  answer: number
  status: FactStatus
  correctStreak: number
  correctTotal: number
  wrongTotal: number
  lastSeenAt: number
}

type MemoryStore = Record<string, FactRecord>

const MEMORY_KEY = 'mental-maths:facts:v1'
const MASTERY_STREAK = 2

function rangeSize(digits: DigitSize): number {
  if (digits === 1) return 9
  if (digits === 2) return 90
  return 900
}

/** Exact pool size when enumerable; null when too large to treat as closed set. */
export function poolSize(level: OpLevel): number | null {
  const n = rangeSize(level.left) * rangeSize(level.right)
  return n <= 900 ? n : null
}

export function memoryKey(op: OpKind, levelId: string, problemId: string): string {
  return `${op}:${levelId}:${problemId}`
}

export function problemIdFromParts(op: OpKind, a: number, b: number): string {
  return op === 'add' ? `${a}+${b}` : `${a}-${b}`
}

function readStore(): MemoryStore {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MemoryStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: MemoryStore): void {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(store))
}

function levelPrefix(op: OpKind, levelId: string): string {
  return `${op}:${levelId}:`
}

function entriesForLevel(op: OpKind, levelId: string): Array<[string, FactRecord]> {
  const prefix = levelPrefix(op, levelId)
  return Object.entries(readStore()).filter(([k]) => k.startsWith(prefix))
}

function ensureRecord(
  store: MemoryStore,
  key: string,
  problem: ArithProblem,
): FactRecord {
  const existing = store[key]
  if (existing) return existing
  const fresh: FactRecord = {
    a: problem.a,
    b: problem.b,
    answer: problem.answer,
    status: 'learning',
    correctStreak: 0,
    correctTotal: 0,
    wrongTotal: 0,
    lastSeenAt: Date.now(),
  }
  store[key] = fresh
  return fresh
}

export function recordCorrect(
  op: OpKind,
  levelId: string,
  problem: ArithProblem,
): FactRecord {
  const store = readStore()
  const key = memoryKey(op, levelId, problem.id)
  const rec = ensureRecord(store, key, problem)
  rec.correctStreak += 1
  rec.correctTotal += 1
  rec.lastSeenAt = Date.now()
  rec.status = rec.correctStreak >= MASTERY_STREAK ? 'mastered' : 'learning'
  store[key] = rec
  writeStore(store)
  return rec
}

export function recordMiss(
  op: OpKind,
  levelId: string,
  problem: ArithProblem,
): FactRecord {
  const store = readStore()
  const key = memoryKey(op, levelId, problem.id)
  const rec = ensureRecord(store, key, problem)
  rec.correctStreak = 0
  rec.wrongTotal += 1
  rec.lastSeenAt = Date.now()
  rec.status = 'weak'
  store[key] = rec
  writeStore(store)
  return rec
}

export type CoverageStats = {
  seen: number
  weak: number
  mastered: number
  learning: number
  /** Set when pool is small enough to enumerate */
  total: number | null
}

export function coverageStats(op: OpKind, level: OpLevel): CoverageStats {
  const entries = entriesForLevel(op, level.id)
  let weak = 0
  let mastered = 0
  let learning = 0
  for (const [, rec] of entries) {
    if (rec.status === 'weak') weak += 1
    else if (rec.status === 'mastered') mastered += 1
    else learning += 1
  }
  return {
    seen: entries.length,
    weak,
    mastered,
    learning,
    total: poolSize(level),
  }
}

export function formatCoverage(stats: CoverageStats): string {
  if (stats.total != null) {
    return `${stats.mastered}/${stats.total} mastered · Weak ${stats.weak}`
  }
  return `Mastered ${stats.mastered} · Weak ${stats.weak} · Seen ${stats.seen}`
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function recordToProblem(op: OpKind, rec: FactRecord): ArithProblem {
  return {
    id: problemIdFromParts(op, rec.a, rec.b),
    a: rec.a,
    b: rec.b,
    answer: rec.answer,
  }
}

function knownProblemIds(op: OpKind, levelId: string): Set<string> {
  const prefix = levelPrefix(op, levelId)
  const ids = new Set<string>()
  for (const key of Object.keys(readStore())) {
    if (key.startsWith(prefix)) ids.add(key.slice(prefix.length))
  }
  return ids
}

function makeNewProblem(
  op: OpKind,
  level: OpLevel,
  avoidId?: string,
): ArithProblem {
  const known = knownProblemIds(op, level.id)
  const total = poolSize(level)
  let guard = 0
  while (guard < 80) {
    guard += 1
    const p = makeProblem(op, level.left, level.right)
    if (avoidId && p.id === avoidId) continue
    if (total != null && known.size >= total) {
      // Pool exhausted — allow repeats of non-avoided
      if (!avoidId || p.id !== avoidId) return p
      continue
    }
    if (!known.has(p.id)) return p
  }
  return makeProblem(op, level.left, level.right)
}

type Bucket = 'weak' | 'new' | 'review'

function chooseBucket(hasWeak: boolean, hasReview: boolean): Bucket {
  const roll = Math.random()
  if (roll < 0.5) {
    if (hasWeak) return 'weak'
    if (hasReview) return Math.random() < 0.2 ? 'review' : 'new'
    return 'new'
  }
  if (roll < 0.9) return 'new'
  if (hasReview) return 'review'
  if (hasWeak) return 'weak'
  return 'new'
}

export function pickNextProblem(
  op: OpKind,
  level: OpLevel,
  avoidId?: string,
): ArithProblem {
  const entries = entriesForLevel(op, level.id)
  const weak = entries
    .filter(([, r]) => r.status === 'weak')
    .map(([, r]) => r)
    .filter((r) => problemIdFromParts(op, r.a, r.b) !== avoidId)
  const mastered = entries
    .filter(([, r]) => r.status === 'mastered')
    .map(([, r]) => r)
    .filter((r) => problemIdFromParts(op, r.a, r.b) !== avoidId)

  const bucket = chooseBucket(weak.length > 0, mastered.length > 0)

  if (bucket === 'weak' && weak.length > 0) {
    return recordToProblem(op, pickRandom(weak))
  }
  if (bucket === 'review' && mastered.length > 0) {
    return recordToProblem(op, pickRandom(mastered))
  }
  return makeNewProblem(op, level, avoidId)
}
