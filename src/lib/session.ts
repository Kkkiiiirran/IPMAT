import {
  MULTIPLIER_MAX,
  MULTIPLIER_MIN,
  type FactStatus,
} from '../types'

export function buildFactPool(): FactStatus[] {
  const facts: FactStatus[] = []
  for (let m = MULTIPLIER_MIN; m <= MULTIPLIER_MAX; m++) {
    facts.push({ multiplier: m, mastered: false, weight: 1 })
  }
  return facts
}

export function masteredCount(facts: FactStatus[]): number {
  return facts.filter((f) => f.mastered).length
}

export function allMastered(facts: FactStatus[]): boolean {
  return facts.every((f) => f.mastered)
}

/** Weighted random among non-mastered facts; weak facts weigh more. */
export function pickNextFact(
  facts: FactStatus[],
  avoidMultiplier?: number,
): FactStatus {
  const pending = facts.filter((f) => !f.mastered)
  if (pending.length === 0) {
    throw new Error('No pending facts')
  }

  // Prefer not repeating the exact same question when alternatives exist
  const candidates =
    pending.length > 1 && avoidMultiplier !== undefined
      ? pending.filter((f) => f.multiplier !== avoidMultiplier)
      : pending
  const pool = candidates.length > 0 ? candidates : pending

  const totalWeight = pool.reduce((sum, f) => sum + f.weight, 0)
  let roll = Math.random() * totalWeight
  for (const fact of pool) {
    roll -= fact.weight
    if (roll <= 0) return fact
  }
  return pool[pool.length - 1]
}

export function markCorrect(facts: FactStatus[], multiplier: number): FactStatus[] {
  return facts.map((f) =>
    f.multiplier === multiplier ? { ...f, mastered: true, weight: 1 } : f,
  )
}

export function markMiss(facts: FactStatus[], multiplier: number): FactStatus[] {
  return facts.map((f) =>
    f.multiplier === multiplier
      ? { ...f, mastered: false, weight: Math.min(f.weight + 2, 12) }
      : f,
  )
}

export function product(base: number, multiplier: number): number {
  return base * multiplier
}
