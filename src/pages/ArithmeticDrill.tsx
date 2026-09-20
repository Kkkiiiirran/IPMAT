import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { NumberPad } from '../components/NumberPad'
import { TimeBar } from '../components/TimeBar'
import {
  allMastered,
  buildArithPool,
  FACTS_PER_SESSION,
  getLevel,
  markCorrect,
  markMiss,
  masteredCount,
  modulePath,
  moduleTitle,
  opSymbol,
  pickNextFact,
  type ArithFact,
  type OpKind,
} from '../lib/arithmetic'
import { average, formatSeconds } from '../lib/format'
import { getTiming, recordCorrectTime } from '../lib/storage'
import { playSound, unlockSounds } from '../lib/sounds'

type Phase = 'answering' | 'feedback'

type Feedback = {
  kind: 'correct' | 'wrong' | 'timeout'
  expected: number
  given: string
}

type ArithmeticDrillProps = {
  op: OpKind
}

function parseAnswer(raw: string): number | null {
  if (raw === '' || raw === '-' || raw === '+') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function ArithmeticDrill({ op }: ArithmeticDrillProps) {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const level = levelId ? getLevel(op, levelId) : undefined
  const basePath = modulePath(op)

  const [facts, setFacts] = useState<ArithFact[]>([])
  const [current, setCurrent] = useState<ArithFact | null>(null)
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

  const beginQuestion = useCallback((pool: ArithFact[], avoidId?: string) => {
    const next = pickNextFact(pool, avoidId)
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
    if (!level) return
    const pool = buildArithPool(op, level)
    setFacts(pool)
    setSessionCorrectMs([])
    beginQuestion(pool)
  }, [level, op, beginQuestion])

  const finishMiss = useCallback((kind: 'wrong' | 'timeout', given: string) => {
    const cur = currentRef.current
    if (!cur || settling.current || phaseRef.current !== 'answering') return
    settling.current = true
    const nextFacts = markMiss(factsRef.current, cur.id)
    setFacts(nextFacts)
    playSound('wrong')
    setFeedback({ kind, expected: cur.answer, given })
    setPhase('feedback')
  }, [])

  const acceptCorrect = useCallback((typed: string) => {
    const cur = currentRef.current
    if (!cur || settling.current || phaseRef.current !== 'answering') return
    settling.current = true
    const elapsed = performance.now() - startedAt.current
    const timing = recordCorrectTime(elapsed)
    setLimitMs(timing.currentLimitMs)
    setSessionCorrectMs((prev) => [...prev, elapsed])
    const nextFacts = markCorrect(factsRef.current, cur.id)
    setFacts(nextFacts)
    playSound('correct')
    setFeedback({ kind: 'correct', expected: cur.answer, given: typed })
    setPhase('feedback')
  }, [])

  const submitWrong = useCallback(() => {
    unlockSounds()
    const cur = currentRef.current
    if (!cur || settling.current || phaseRef.current !== 'answering') return
    const typed = answerRef.current
    const parsed = parseAnswer(typed)
    if (parsed === null) return

    if (parsed === cur.answer) {
      acceptCorrect(typed)
      return
    }
    finishMiss('wrong', typed)
  }, [acceptCorrect, finishMiss])

  const onAnswerChange = useCallback(
    (next: string) => {
      unlockSounds()
      setAnswer(next)
      answerRef.current = next
      if (phaseRef.current !== 'answering' || settling.current) return
      const cur = currentRef.current
      if (!cur) return
      const parsed = parseAnswer(next)
      if (parsed === null) return
      if (parsed === cur.answer) {
        acceptCorrect(next)
      }
    },
    [acceptCorrect],
  )

  const onTimeout = useCallback(() => {
    finishMiss('timeout', answerRef.current || '—')
  }, [finishMiss])

  useEffect(() => {
    if (phase !== 'feedback' || !current || !feedback || !level) return

    const delay = feedback.kind === 'correct' ? 450 : 1600
    const t = window.setTimeout(() => {
      if (allMastered(factsRef.current)) {
        navigate(`${basePath}/${level.id}/done`, {
          replace: true,
          state: {
            avgMs: average(sessionCorrectMsRef.current),
            label: level.label,
          },
        })
        return
      }
      beginQuestion(factsRef.current, current.id)
    }, delay)

    return () => window.clearTimeout(t)
  }, [phase, feedback, current, level, basePath, beginQuestion, navigate])

  if (!level) {
    return <Navigate to={basePath} replace />
  }

  const done = masteredCount(facts)
  const sessionAvg = average(sessionCorrectMs)
  const sym = opSymbol(op)

  return (
    <div className="screen screen--drill">
      <header className="drill-top">
        <Link to={basePath} className="topbar__back">
          ← {moduleTitle(op)}
        </Link>
        <div className="drill-meta">
          <span className="drill-meta__table">{level.label}</span>
          <span className="drill-meta__progress">
            {done} / {FACTS_PER_SESSION}
          </span>
        </div>
        <p className="drill-avg" aria-live="polite">
          {sessionAvg === null ? 'Avg —' : `Avg ${formatSeconds(sessionAvg)}`}
        </p>
      </header>

      <div className="progress-track" aria-hidden>
        <div
          className="progress-track__fill"
          style={{ width: `${(done / FACTS_PER_SESSION) * 100}%` }}
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
              {current.a} <span className="prompt__op">{sym}</span> {current.b}
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
        allowNegative={op === 'sub'}
        maxLength={op === 'add' ? 4 : 4}
      />
    </div>
  )
}
