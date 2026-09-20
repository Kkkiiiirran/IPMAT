import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { getLevel, modulePath, moduleTitle, SESSION_LENGTH, type OpKind } from '../lib/arithmetic'
import { formatSeconds } from '../lib/format'

type CompleteState = {
  avgMs?: number | null
  label?: string
  coverage?: string
  questions?: number
}

type ArithmeticCompleteProps = {
  op: OpKind
}

export function ArithmeticComplete({ op }: ArithmeticCompleteProps) {
  const { levelId } = useParams()
  const location = useLocation()
  const state = (location.state as CompleteState | null) ?? null
  const level = levelId ? getLevel(op, levelId) : undefined
  const basePath = modulePath(op)

  if (!level) {
    return <Navigate to={basePath} replace />
  }

  const avgMs = state?.avgMs ?? null
  const label = state?.label ?? level.label
  const questions = state?.questions ?? SESSION_LENGTH

  return (
    <div className="screen screen--complete">
      <p className="complete__eyebrow">Round complete</p>
      <h1 className="complete__title">{label}</h1>
      <p className="complete__sub">
        {avgMs == null
          ? `${questions} questions done.`
          : `${questions} questions · average ${formatSeconds(avgMs)} on correct answers.`}
      </p>
      {state?.coverage && (
        <p className="complete__coverage">{state.coverage}</p>
      )}

      <div className="complete__actions">
        <Link className="btn btn--primary" to={`${basePath}/${level.id}`}>
          Practice again
        </Link>
        <Link
          className="btn btn--ghost"
          to={`/analytics/${op === 'add' ? 'addition' : 'subtraction'}/${encodeURIComponent(level.id)}`}
        >
          View analytics
        </Link>
        <Link className="btn btn--ghost" to={basePath}>
          Other levels
        </Link>
        <Link className="btn btn--ghost" to="/">
          Home
        </Link>
      </div>
      <p className="complete__footnote">{moduleTitle(op)}</p>
    </div>
  )
}
