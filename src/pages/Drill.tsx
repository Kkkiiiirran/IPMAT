import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { NumberPad } from '../components/NumberPad'
import { TimeBar } from '../components/TimeBar'
import { average, formatSeconds } from '../lib/format'
import {
  allMastered,
  buildFactPool,
  markCorrect,
  markMiss,
  masteredCount,
  pickNextFact,
  product,
} from '../lib/session'
import { getTiming, recordCorrectTime } from '../lib/storage'
import { FACTS_PER_TABLE, TABLE_MAX, TABLE_MIN, type FactStatus } from '../types'

type Phase = 'answering' | 'feedback'

type Feedback = {
  kind: 'correct' | 'wrong' | 'timeout'
  expected: number
  given: string
}

export function Drill() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const base = Number(tableId)

  const [facts, setFacts] = useState<FactStatus[]>(() => buildFactPool())
  const [current, setCurrent] = useState<FactStatus | null>(null)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('answering')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [limitMs, setLimitMs] = useState(() => getTiming().currentLimitMs)
  const [roundId, setRoundId] = useState(0)
  const [sessionCorrectMs, setSessionCorrectMs] = useState<number[]>([])

  const startedAt = useRef(performance.now())
  const settling = useRef(false)
  const factsRef = useRef(facts)
  const currentRef = useRef(current)
  const phaseRef = useRef(phase)
  const answerRef = useRef(answer)
  const sessionCorrectMsRef = useRef(sessionCorrectMs)

  factsRef.current = facts
  currentRef.current = current
  phaseRef.current = phase
  answerRef.current = answer
  sessionCorrectMsRef.current = sessionCorrectMs

  const valid = Number.isInteger(base) && base >= TABLE_MIN && base <= TABLE_MAX

  const beginQuestion = useCallback((pool: FactStatus[], avoid?: number) => {
    const next = pickNextFact(pool, avoid)
    setCurrent(next)
    setAnswer('')
    answerRef.current = ''
    setFeedback(null)
    setPhase('answering')
    setLimitMs(getTiming().currentLimitMs)
    setRoundId((n) => n + 1)
    startedAt.current = performance.now()
    settling.current = false
  }, [])

  useEffect(() => {
    if (!valid) return
    const pool = buildFactPool()
    setFacts(pool)
    setSessionCorrectMs([])
    beginQuestion(pool)
  }, [valid, base, beginQuestion])

  const finishMiss = useCallback(
    (kind: 'wrong' | 'timeout', given: string) => {
      const cur = currentRef.current
      if (!cur || settling.current || phaseRef.current !== 'answering') return
      settling.current = true
      const expected = product(base, cur.multiplier)
      const nextFacts = markMiss(factsRef.current, cur.multiplier)
      setFacts(nextFacts)
      setFeedback({ kind, expected, given })
      setPhase('feedback')
    },
    [base],
  )

  const acceptCorrect = useCallback(
    (typed: string) => {
      const cur = currentRef.current
      if (!cur || settling.current || phaseRef.current !== 'answering') return
      settling.current = true
      const expected = product(base, cur.multiplier)
      const elapsed = performance.now() - startedAt.current
      const timing = recordCorrectTime(elapsed)
      setLimitMs(timing.currentLimitMs)
      setSessionCorrectMs((prev) => [...prev, elapsed])
      const nextFacts = markCorrect(factsRef.current, cur.multiplier)
      setFacts(nextFacts)
      setFeedback({ kind: 'correct', expected, given: typed })
      setPhase('feedback')
    },
    [base],
  )

  /** Tick: only used to flag a wrong answer (correct answers auto-advance). */
  const submitWrong = useCallback(() => {
    const cur = currentRef.current
    if (!cur || settling.current || phaseRef.current !== 'answering') return
    const typed = answerRef.current
    if (typed === '') return

    const expected = product(base, cur.multiplier)
    if (Number(typed) === expected) {
      acceptCorrect(typed)
      return
    }

    finishMiss('wrong', typed)
  }, [acceptCorrect, base, finishMiss])

  const onAnswerChange = useCallback(
    (next: string) => {
      setAnswer(next)
      answerRef.current = next
      if (phaseRef.current !== 'answering' || settling.current) return
      const cur = currentRef.current
      if (!cur || next === '') return
      const expected = product(base, cur.multiplier)
      if (Number(next) === expected) {
        acceptCorrect(next)
      }
    },
    [acceptCorrect, base],
  )

  const onTimeout = useCallback(() => {
    finishMiss('timeout', answerRef.current || '—')
  }, [finishMiss])

  useEffect(() => {
    if (phase !== 'feedback' || !current || !feedback) return

    const delay = feedback.kind === 'correct' ? 450 : 1600
    const t = window.setTimeout(() => {
      if (allMastered(factsRef.current)) {
        const avgMs = average(sessionCorrectMsRef.current)
        navigate(`/tables/${base}/done`, {
          replace: true,
          state: { avgMs, correctCount: sessionCorrectMsRef.current.length },
        })
        return
      }
      beginQuestion(factsRef.current, current.multiplier)
    }, delay)

    return () => window.clearTimeout(t)
  }, [phase, feedback, current, base, beginQuestion, navigate])

  if (!valid) {
    return <Navigate to="/tables" replace />
  }

  const done = masteredCount(facts)
  const sessionAvg = average(sessionCorrectMs)

  return (
    <div className="screen screen--drill">
      <header className="drill-top">
        <Link to="/tables" className="topbar__back">
          ← Tables
        </Link>
        <div className="drill-meta">
          <span className="drill-meta__table">Table {base}</span>
          <span className="drill-meta__progress">
            {done} / {FACTS_PER_TABLE}
          </span>
        </div>
        <p className="drill-avg" aria-live="polite">
          {sessionAvg === null
            ? 'Avg —'
            : `Avg ${formatSeconds(sessionAvg)}`}
        </p>
      </header>

      <div className="progress-track" aria-hidden>
        <div
          className="progress-track__fill"
          style={{ width: `${(done / FACTS_PER_TABLE) * 100}%` }}
        />
      </div>

      <TimeBar
        limitMs={limitMs}
        running={phase === 'answering'}
        resetKey={roundId}
        onTimeout={onTimeout}
      />

      <div className="prompt">
        {current && (
          <>
            <p className="prompt__eq">
              {base} <span className="prompt__op">×</span> {current.multiplier}
            </p>
            <p className="prompt__answer" aria-live="polite">
              {phase === 'answering' ? answer || '—' : feedback?.expected}
            </p>
          </>
        )}
      </div>

      {feedback && phase === 'feedback' && (
        <p className={`feedback feedback--${feedback.kind}`} role="status">
          {feedback.kind === 'correct' && 'Correct'}
          {feedback.kind === 'wrong' && `Wrong · answer is ${feedback.expected}`}
          {feedback.kind === 'timeout' && `Time’s up · answer is ${feedback.expected}`}
        </p>
      )}

      <NumberPad
        value={answer}
        onChange={onAnswerChange}
        onSubmit={submitWrong}
        disabled={phase !== 'answering'}
      />
    </div>
  )
}
