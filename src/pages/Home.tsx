import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="screen screen--home">
      <header className="brand">
        <p className="brand__eyebrow">Practice</p>
        <h1 className="brand__title">Mental Maths</h1>
        <p className="brand__sub">
          Tables, addition, and subtraction — at your pace.
        </p>
      </header>

      <nav className="module-list" aria-label="Modules">
        <Link className="module-card module-card--active" to="/tables">
          <span className="module-card__index">01</span>
          <span className="module-card__body">
            <span className="module-card__name">Tables</span>
            <span className="module-card__desc">One table · 2–25 · ×1–10</span>
          </span>
          <span className="module-card__chev" aria-hidden>
            →
          </span>
        </Link>

        <Link className="module-card module-card--active" to="/addition">
          <span className="module-card__index">02</span>
          <span className="module-card__body">
            <span className="module-card__name">Addition</span>
            <span className="module-card__desc">Single → triple digit levels</span>
          </span>
          <span className="module-card__chev" aria-hidden>
            →
          </span>
        </Link>

        <Link className="module-card module-card--active" to="/subtraction">
          <span className="module-card__index">03</span>
          <span className="module-card__body">
            <span className="module-card__name">Subtraction</span>
            <span className="module-card__desc">Same levels · negatives allowed</span>
          </span>
          <span className="module-card__chev" aria-hidden>
            →
          </span>
        </Link>

        <div className="module-card module-card--soon" aria-disabled="true">
          <span className="module-card__index">04</span>
          <span className="module-card__body">
            <span className="module-card__name">Mix tables</span>
            <span className="module-card__desc">Coming later</span>
          </span>
        </div>
      </nav>
    </div>
  )
}
