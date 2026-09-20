import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getLastTable, setLastTable } from '../lib/storage'
import { TABLE_MAX, TABLE_MIN } from '../types'

export function TablePicker() {
  const navigate = useNavigate()
  const last = useMemo(() => getLastTable(), [])
  const tables = useMemo(
    () => Array.from({ length: TABLE_MAX - TABLE_MIN + 1 }, (_, i) => TABLE_MIN + i),
    [],
  )

  const start = (table: number) => {
    setLastTable(table)
    navigate(`/tables/${table}`)
  }

  return (
    <div className="screen">
      <header className="topbar">
        <Link to="/" className="topbar__back">
          ← Home
        </Link>
        <h1 className="topbar__title">Tables</h1>
        <p className="topbar__hint">Pick one table · 10 facts · until mastered</p>
      </header>

      <div className="table-grid">
        {tables.map((n) => (
          <button
            key={n}
            type="button"
            className={`table-chip${last === n ? ' table-chip--last' : ''}`}
            onClick={() => start(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
