import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Sparkline } from '../components/Sparkline'
import { formatSeconds } from '../lib/format'
import {
  clearAllRounds,
  listRounds,
  listRoundsForSub,
  moduleLabel,
  summarizeSubModules,
  type ModuleId,
} from '../lib/rounds'

const MODULES: Array<ModuleId | 'all'> = [
  'all',
  'tables',
  'addition',
  'subtraction',
]

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isModuleId(v: string | undefined): v is ModuleId {
  return v === 'tables' || v === 'addition' || v === 'subtraction'
}

export function Analytics() {
  const { moduleId, subModuleId } = useParams()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)

  const activeModule: ModuleId | 'all' = isModuleId(moduleId) ? moduleId : 'all'
  const subFilter = subModuleId ? decodeURIComponent(subModuleId) : null

  const rounds = useMemo(() => {
    void tick
    if (activeModule === 'all') return listRounds().slice().reverse()
    if (subFilter) return listRoundsForSub(activeModule, subFilter).slice().reverse()
    return listRounds(activeModule).slice().reverse()
  }, [activeModule, subFilter, tick])

  const subStats = useMemo(() => {
    void tick
    if (activeModule === 'all') return summarizeSubModules()
    return summarizeSubModules(activeModule)
  }, [activeModule, tick])

  const filteredStats = subFilter
    ? subStats.filter((s) => s.subModule === subFilter)
    : subStats

  const totalRounds = rounds.length
  const overallAvgs = rounds
    .map((r) => r.avgCorrectMs)
    .filter((n): n is number => n != null)
  const latestTrend = overallAvgs.slice(0, 12).reverse()

  const setModule = (m: ModuleId | 'all') => {
    if (m === 'all') navigate('/analytics')
    else navigate(`/analytics/${m}`)
  }

  const clear = () => {
    if (!window.confirm('Clear all saved round history on this device?')) return
    clearAllRounds()
    setTick((n) => n + 1)
    navigate('/analytics')
  }

  return (
    <div className="screen screen--analytics">
      <header className="topbar">
        <Link to="/" className="topbar__back">
          ← Home
        </Link>
        <h1 className="topbar__title">Analytics</h1>
        <p className="topbar__hint">
          Saved on this phone · each finished round
        </p>
      </header>

      <div className="ana-tabs" role="tablist" aria-label="Module">
        {MODULES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            className={`ana-tab${activeModule === m ? ' ana-tab--on' : ''}`}
            aria-selected={activeModule === m}
            onClick={() => setModule(m)}
          >
            {m === 'all' ? 'All' : moduleLabel(m)}
          </button>
        ))}
      </div>

      {subFilter && filteredStats[0] && (
        <div className="ana-subhead">
          <button
            type="button"
            className="ana-back-sub"
            onClick={() => navigate(`/analytics/${activeModule}`)}
          >
            ← All {moduleLabel(activeModule as ModuleId)} levels
          </button>
          <h2 className="ana-subhead__title">{filteredStats[0].label}</h2>
        </div>
      )}

      <section className="ana-cards">
        <div className="ana-card">
          <span className="ana-card__label">Rounds</span>
          <span className="ana-card__value">{totalRounds}</span>
        </div>
        <div className="ana-card">
          <span className="ana-card__label">Best avg</span>
          <span className="ana-card__value">
            {overallAvgs.length
              ? formatSeconds(Math.min(...overallAvgs))
              : '—'}
          </span>
        </div>
        <div className="ana-card ana-card--wide">
          <span className="ana-card__label">Speed over time</span>
          <Sparkline values={latestTrend} />
        </div>
      </section>

      {!subFilter && (
        <section className="ana-section">
          <h2 className="ana-section__title">By level</h2>
          {filteredStats.length === 0 ? (
            <p className="ana-empty">No rounds yet — finish a session to see stats.</p>
          ) : (
            <ul className="ana-level-list">
              {filteredStats.map((s) => (
                <li key={`${s.module}-${s.subModule}`}>
                  <button
                    type="button"
                    className="ana-level"
                    onClick={() =>
                      navigate(
                        `/analytics/${s.module}/${encodeURIComponent(s.subModule)}`,
                      )
                    }
                  >
                    <div className="ana-level__top">
                      <span className="ana-level__name">{s.label}</span>
                      <span className="ana-level__meta">{s.rounds} rounds</span>
                    </div>
                    <div className="ana-level__row">
                      <span className="ana-level__stat">
                        Best{' '}
                        {s.bestAvgMs != null ? formatSeconds(s.bestAvgMs) : '—'}
                      </span>
                      <span className="ana-level__stat">
                        Latest{' '}
                        {s.latestAvgMs != null
                          ? formatSeconds(s.latestAvgMs)
                          : '—'}
                      </span>
                      <Sparkline values={s.avgHistory} />
                    </div>
                    {(activeModule === 'all') && (
                      <span className="ana-level__module">
                        {moduleLabel(s.module)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="ana-section">
        <h2 className="ana-section__title">Round history</h2>
        {rounds.length === 0 ? (
          <p className="ana-empty">No history yet.</p>
        ) : (
          <ul className="ana-history">
            {rounds.map((r) => (
              <li key={r.id} className="ana-history__item">
                <div className="ana-history__main">
                  <span className="ana-history__label">{r.label}</span>
                  <span className="ana-history__date">
                    {formatDate(r.completedAt)}
                  </span>
                </div>
                <div className="ana-history__stats">
                  <span>
                    Avg{' '}
                    {r.avgCorrectMs != null
                      ? formatSeconds(r.avgCorrectMs)
                      : '—'}
                  </span>
                  <span>Wrong {r.wrongCount}</span>
                  <span>Miss {r.timeoutCount}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="btn btn--ghost ana-clear" onClick={clear}>
        Clear history
      </button>
    </div>
  )
}
