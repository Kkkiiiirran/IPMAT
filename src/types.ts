export const TABLE_MIN = 2
export const TABLE_MAX = 25
export const MULTIPLIER_MIN = 1
export const MULTIPLIER_MAX = 10
export const FACTS_PER_TABLE = 10

export const TIMER_DEFAULT_MS = 14_000
export const TIMER_MIN_MS = 4_000
export const TIMER_MAX_MS = 45_000
export const TIMER_BUFFER = 1.25
export const TIMER_HISTORY_SIZE = 5

export type FactStatus = {
  multiplier: number
  mastered: boolean
  /** Higher = more likely to be asked again */
  weight: number
}

export type SessionResult = 'correct' | 'wrong' | 'timeout'

export type TimingState = {
  recentCorrectMs: number[]
  currentLimitMs: number
}
