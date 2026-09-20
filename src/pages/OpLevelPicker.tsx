import { Link } from 'react-router-dom'
import {
  getLevels,
  modulePath,
  moduleTitle,
  type OpKind,
} from '../lib/arithmetic'

type OpLevelPickerProps = {
  op: OpKind
}

export function OpLevelPicker({ op }: OpLevelPickerProps) {
  const levels = getLevels(op)
  const title = moduleTitle(op)
  const base = modulePath(op)

  return (
    <div className="screen">
      <header className="topbar">
        <Link to="/" className="topbar__back">
          ← Home
        </Link>
        <h1 className="topbar__title">{title}</h1>
        <p className="topbar__hint">Pick a level · 10 problems · until mastered</p>
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
              <span className="level-card__desc">{level.short}</span>
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
