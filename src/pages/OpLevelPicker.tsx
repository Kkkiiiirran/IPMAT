import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getLevels,
  modulePath,
  moduleTitle,
  type OpKind,
} from '../lib/arithmetic'
import { coverageStats, formatCoverage } from '../lib/factMemory'

type OpLevelPickerProps = {
  op: OpKind
}

export function OpLevelPicker({ op }: OpLevelPickerProps) {
  const levels = getLevels(op)
  const title = moduleTitle(op)
  const base = modulePath(op)

  const coverages = useMemo(
    () => levels.map((level) => ({ id: level.id, text: formatCoverage(coverageStats(op, level)) })),
    [levels, op],
  )

  return (
    <div className="screen">
      <header className="topbar">
        <Link to="/" className="topbar__back">
          ← Home
        </Link>
        <h1 className="topbar__title">{title}</h1>
        <p className="topbar__hint">20 questions · weak items return · new facts unlock</p>
      </header>

      <nav className="level-list" aria-label={`${title} levels`}>
        {levels.map((level, i) => (
          <Link
            key={level.id}
            className="level-card"
            to={`${base}/${level.id}`}
          >
            <span className="level-card__index">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="level-card__body">
              <span className="level-card__name">{level.label}</span>
              <span className="level-card__desc">
                {coverages.find((c) => c.id === level.id)?.text ?? level.short}
              </span>
            </span>
            <span className="level-card__chev" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
