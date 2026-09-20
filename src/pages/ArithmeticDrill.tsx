import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { NumberPad } from '../components/NumberPad'
import { TimeBar } from '../components/TimeBar'
import {
  getLevel,
  modulePath,
  moduleTitle,
  opSymbol,
  SESSION_LENGTH,
  type ArithProblem,
  type OpKind,
} from '../lib/arithmetic'
import {
  coverageStats,
  formatCoverage,
  pickNextProblem,
  recordCorrect,
  recordMiss,
  type CoverageStats,
} from '../lib/factMemory'
import { average, formatSeconds } from '../lib/format'
import { saveRound } from '../lib/rounds'
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

  const [current, setCurrent] = useState<ArithProblem | null>(null)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>('answering')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [limitMs, setLimitMs] = useState(() => getTiming().currentLimitMs)
  const [roundId, setRoundId] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [sessionCorrectMs, setSessionCorrectMs] = useState<number[]>([])
  const [coverage, setCoverage] = useState<CoverageStats | null>(null)

  const startedAt = useRef(performance.now())
  const sessionStartedAt = useRef(performance.now())
  const settling = useRef(false)
  const currentRef = useRef(current)
  const phaseRef = useRef(phase)
  const answerRef = useRef(answer)
  const sessionCorrectMsRef = useRef(sessionCorrectMs)
  const answeredCountRef = useRef(0)
  const wrongCountRef = useRef(0)
  const timeoutCountRef = useRef(0)

  currentRef.current = current
  phaseRef.current = phase
  answerRef.current = answer
  sessionCorrectMsRef.current = sessionCorrectMs

  const refreshCoverage = useCallback(() => {
    if (!level) return
    setCoverage(coverageStats(op, level))
  }, [level, op])

  const beginQuestion = useCallback(
    (avoidId?: string) => {
      if (!level) return
      const next = pickNextProblem(op, level, avoidId)
      setCurrent(next)
      setAnswer('')
      answerRef.current = ''
      setFeedback(null)
      setPhase('answering')
      setLimitMs(getTiming().currentLimitMs)
      setRoundId((n) => n + 1)
      startedAt.current = performance.now()
      settling.current = false
      refreshCoverage()
    },
    [level, op, refreshCoverage],
  )

  useEffect(() => {
    if (!level) return
    setSessionCorrectMs([])
    setAnsweredCount(0)
    answeredCountRef.current = 0
    wrongCountRef.current = 0
    timeoutCountRef.current = 0
    sessionStartedAt.current = performance.now()
    beginQuestion()
  }, [level, op, beginQuestion])

  const finishSession = useCallback(() => {
    if (!level) return
    const avgMs = average(sessionCorrectMsRef.current)
    const cov = coverageStats(op, level)
    saveRound({
      module: op === 'add' ? 'addition' : 'subtraction',
      subModule: level.id,
      label: level.label,
      totalFacts: SESSION_LENGTH,
      correctCount: sessionCorrectMsRef.current.length,
      wrongCount: wrongCountRef.current,
      timeoutCount: timeoutCountRef.current,
      avgCorrectMs: avgMs,
      durationMs: performance.now() - sessionStartedAt.current,
      weakCount: cov.weak,
      masteredCount: cov.mastered,
      seenCount: cov.seen,
    })
    navigate(`${basePath}/${level.id}/done`, {
      replace: true,
      state: {
        avgMs,
        label: level.label,
        coverage: formatCoverage(cov),
        questions: SESSION_LENGTH,
      },
    })
  }, [basePath, level, navigate, op])

  const afterPrompt = useCallback(
    (prevId: string) => {
      const nextCount = answeredCountRef.current + 1
      answeredCountRef.current = nextCount
      setAnsweredCount(nextCount)
      refreshCoverage()
      if (nextCount >= SESSION_LENGTH) {
        finishSession()
        return
      }
      beginQuestion(prevId)
    },
    [beginQuestion, finishSession, refreshCoverage],
  )

  const finishMiss = useCallback(
    (kind: 'wrong' | 'timeout', given: string) => {
      const cur = currentRef.current
      if (!cur || !level || settling.current || phaseRef.current !== 'answering') return
      settling.current = true
      if (kind === 'wrong') wrongCountRef.current += 1
      else timeoutCountRef.current += 1
      recordMiss(op, level.id, cur)
      playSound('wrong')
      setFeedback({ kind, expected: cur.answer, given })
      setPhase('feedback')
    },
    [level, op],
  )

  const acceptCorrect = useCallback(
    (typed: string) => {
      const cur = currentRef.current
      if (!cur || !level || settling.current || phaseRef.current !== 'answering') return
      settling.current = true
      const elapsed = performance.now() - startedAt.current
      const timing = recordCorrectTime(elapsed)
      setLimitMs(timing.currentLimitMs)
      setSessionCorrectMs((prev) => [...prev, elapsed])
      recordCorrect(op, level.id, cur)
      playSound('correct')
      setFeedback({ kind: 'correct', expected: cur.answer, given: typed })
      setPhase('feedback')
    },
    [level, op],
  )

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
    if (phase !== 'feedback' || !current || !feedback) return

    const delay = feedback.kind === 'correct' ? 450 : 1600
    const t = window.setTimeout(() => {
      afterPrompt(current.id)
    }, delay)

    return () => window.clearTimeout(t)
  }, [phase, feedback, current, afterPrompt])

  if (!level) {
    return <Navigate to={basePath} replace />
  }

  const sessionAvg = average(sessionCorrectMs)
  const sym = opSymbol(op)
  const qNum = Math.min(answeredCount + 1, SESSION_LENGTH)

  return (
    <div className="screen screen--drill">
      <header className="drill-top">
        <Link to={basePath} className="topbar__back">
          ← {moduleTitle(op)}
        </Link>
        <div className="drill-meta">
          <span className="drill-meta__table">{level.label}</span>
          <span className="drill-meta__progress">
            Q {qNum} / {SESSION_LENGTH}
          </span>
        </div>
        <p className="drill-avg" aria-live="polite">
          {sessionAvg === null ? 'Avg —' : `Avg ${formatSeconds(sessionAvg)}`}
          {coverage ? ` · ${formatCoverage(coverage)}` : ''}
        </p>
      </header>

      <div className="progress-track" aria-hidden>
        <div
          className="progress-track__fill"
          style={{ width: `${(answeredCount / SESSION_LENGTH) * 100}%` }}
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
        maxLength={4}
      />
    </div>
  )
}
