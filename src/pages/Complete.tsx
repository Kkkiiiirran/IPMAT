import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { formatSeconds } from '../lib/format'
import { TABLE_MAX, TABLE_MIN } from '../types'

type CompleteState = {
  avgMs?: number | null
  correctCount?: number
}

export function Complete() {
  const { tableId } = useParams()
  const location = useLocation()
  const state = (location.state as CompleteState | null) ?? null
  const base = Number(tableId)
  const valid = Number.isInteger(base) && base >= TABLE_MIN && base <= TABLE_MAX

  if (!valid) {
    return <Navigate to="/tables" replace />
  }

  const avgMs = state?.avgMs ?? null

  return (
    <div className="screen screen--complete">
      <p className="complete__eyebrow">Session clear</p>
      <h1 className="complete__title">Table {base} mastered</h1>
      <p className="complete__sub">
        {avgMs == null
          ? 'All 10 facts answered in time. Nice work.'
          : `All 10 mastered · average ${formatSeconds(avgMs)} per correct answer.`}
      </p>

      <div className="complete__actions">
        <Link className="btn btn--primary" to={`/tables/${base}`}>
          Practice again
        </Link>
        <Link className="btn btn--ghost" to={`/analytics/tables/${base}`}>
          View analytics
        </Link>
        <Link className="btn btn--ghost" to="/tables">
          Another table
        </Link>
        <Link className="btn btn--ghost" to="/">
          Home
        </Link>
      </div>
    </div>
  )
}
