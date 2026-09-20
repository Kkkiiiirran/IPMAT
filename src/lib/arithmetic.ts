export type DigitSize = 1 | 2 | 3
export type OpKind = 'add' | 'sub'

export type OpLevel = {
  id: string
  label: string
  short: string
  left: DigitSize
  right: DigitSize
}

export const SESSION_LENGTH = 20

/** @deprecated use SESSION_LENGTH — kept for any lingering imports */
export const FACTS_PER_SESSION = SESSION_LENGTH

const DIGIT_LABEL: Record<DigitSize, string> = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
}

function level(
  left: DigitSize,
  right: DigitSize,
  opSymbol: '+' | '−',
): OpLevel {
  const id = `${left}-${right}`
  return {
    id,
    label: `${DIGIT_LABEL[left]} ${opSymbol} ${DIGIT_LABEL[right]}`,
    short: `${left} ${opSymbol} ${right} digit`,
    left,
    right,
  }
}

/** Addition sub-modules in learning order */
export const ADDITION_LEVELS: OpLevel[] = [
  level(1, 1, '+'),
  level(2, 1, '+'),
  level(1, 2, '+'),
  level(2, 2, '+'),
  level(3, 1, '+'),
  level(3, 2, '+'),
  level(2, 3, '+'),
  level(3, 3, '+'),
]

/** Subtraction sub-modules (same digit patterns; answers may be negative) */
export const SUBTRACTION_LEVELS: OpLevel[] = [
  level(1, 1, '−'),
  level(2, 1, '−'),
  level(1, 2, '−'),
  level(2, 2, '−'),
  level(3, 1, '−'),
  level(3, 2, '−'),
  level(2, 3, '−'),
  level(3, 3, '−'),
]

export function getLevels(op: OpKind): OpLevel[] {
  return op === 'add' ? ADDITION_LEVELS : SUBTRACTION_LEVELS
}

export function getLevel(op: OpKind, id: string): OpLevel | undefined {
  return getLevels(op).find((l) => l.id === id)
}

function rangeFor(digits: DigitSize): [number, number] {
  if (digits === 1) return [1, 9]
  if (digits === 2) return [10, 99]
  return [100, 999]
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export type ArithProblem = {
  id: string
  a: number
  b: number
  answer: number
}

export function makeProblem(op: OpKind, left: DigitSize, right: DigitSize): ArithProblem {
  const [lMin, lMax] = rangeFor(left)
  const [rMin, rMax] = rangeFor(right)
  const a = randInt(lMin, lMax)
  const b = randInt(rMin, rMax)
  const answer = op === 'add' ? a + b : a - b
  const sym = op === 'add' ? '+' : '-'
  return { id: `${a}${sym}${b}`, a, b, answer }
}

export type ArithFact = ArithProblem & {
  mastered: boolean
  weight: number
}

export function buildArithPool(op: OpKind, level: OpLevel): ArithFact[] {
  const seen = new Set<string>()
  const facts: ArithFact[] = []
  let guard = 0
  while (facts.length < FACTS_PER_SESSION && guard < 400) {
    guard += 1
    const p = makeProblem(op, level.left, level.right)
    if (seen.has(p.id)) continue
    seen.add(p.id)
    facts.push({ ...p, mastered: false, weight: 1 })
  }
  return facts
}

export function masteredCount(facts: ArithFact[]): number {
  return facts.filter((f) => f.mastered).length
}

export function allMastered(facts: ArithFact[]): boolean {
  return facts.length > 0 && facts.every((f) => f.mastered)
}

export function pickNextFact(facts: ArithFact[], avoidId?: string): ArithFact {
  const pending = facts.filter((f) => !f.mastered)
  if (pending.length === 0) throw new Error('No pending facts')

  const candidates =
    pending.length > 1 && avoidId
      ? pending.filter((f) => f.id !== avoidId)
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

export function markCorrect(facts: ArithFact[], id: string): ArithFact[] {
  return facts.map((f) =>
    f.id === id ? { ...f, mastered: true, weight: 1 } : f,
  )
}

export function markMiss(facts: ArithFact[], id: string): ArithFact[] {
  return facts.map((f) =>
    f.id === id ? { ...f, mastered: false, weight: Math.min(f.weight + 2, 12) } : f,
  )
}

export function opSymbol(op: OpKind): string {
  return op === 'add' ? '+' : '−'
}

export function modulePath(op: OpKind): string {
  return op === 'add' ? '/addition' : '/subtraction'
}

export function moduleTitle(op: OpKind): string {
  return op === 'add' ? 'Addition' : 'Subtraction'
}
