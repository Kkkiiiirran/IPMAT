import {
  TIMER_BUFFER,
  TIMER_DEFAULT_MS,
  TIMER_HISTORY_SIZE,
  TIMER_MAX_MS,
  TIMER_MIN_MS,
  type TimingState,
} from '../types'

const STORAGE_KEY = 'mental-maths:v1'

type StoredData = {
  lastTable: number | null
  timing: TimingState
}

function clamp(ms: number): number {
  return Math.min(TIMER_MAX_MS, Math.max(TIMER_MIN_MS, Math.round(ms)))
}

export function defaultTiming(): TimingState {
  return {
    recentCorrectMs: [],
    currentLimitMs: TIMER_DEFAULT_MS,
  }
}

function read(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { lastTable: null, timing: defaultTiming() }
    }
    const parsed = JSON.parse(raw) as Partial<StoredData>
    return {
      lastTable:
        typeof parsed.lastTable === 'number' ? parsed.lastTable : null,
      timing: {
        recentCorrectMs: Array.isArray(parsed.timing?.recentCorrectMs)
          ? parsed.timing.recentCorrectMs.filter((n) => typeof n === 'number')
          : [],
        currentLimitMs:
          typeof parsed.timing?.currentLimitMs === 'number'
            ? clamp(parsed.timing.currentLimitMs)
            : TIMER_DEFAULT_MS,
      },
    }
  } catch {
    return { lastTable: null, timing: defaultTiming() }
  }
}

function write(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getLastTable(): number | null {
  return read().lastTable
}

export function setLastTable(table: number): void {
  const data = read()
  data.lastTable = table
  write(data)
}

export function getTiming(): TimingState {
  return read().timing
}

export function recordCorrectTime(elapsedMs: number): TimingState {
  const data = read()
  const recent = [...data.timing.recentCorrectMs, elapsedMs].slice(
    -TIMER_HISTORY_SIZE,
  )
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  const nextLimit = clamp(avg * TIMER_BUFFER)
  // Ease toward new limit so it doesn't jump abruptly
  const eased = clamp(data.timing.currentLimitMs * 0.4 + nextLimit * 0.6)
  data.timing = { recentCorrectMs: recent, currentLimitMs: eased }
  write(data)
  return data.timing
}
