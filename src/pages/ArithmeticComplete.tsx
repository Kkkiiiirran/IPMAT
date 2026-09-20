import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { getLevel, modulePath, moduleTitle, type OpKind } from '../lib/arithmetic'
import { formatSeconds } from '../lib/format'

type CompleteState = {
  avgMs?: number | null
  label?: string
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

  return (
    <div className="screen screen--complete">
      <p className="complete__eyebrow">Session clear</p>
      <h1 className="complete__title">{label}</h1>
      <p className="complete__sub">
        {avgMs == null
          ? 'All 10 problems mastered. Nice work.'
          : `All 10 mastered · average ${formatSeconds(avgMs)} per correct answer.`}
      </p>

      <div className="complete__actions">
        <Link className="btn btn--primary" to={`${basePath}/${level.id}`}>
          Practice again
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
