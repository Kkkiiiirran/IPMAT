import { useState } from 'react'
import { formatSeconds } from '../../lib/format'

export type LinePoint = {
  xLabel: string
  value: number
}

type LineChartProps = {
  points: LinePoint[]
  title?: string
  emptyText?: string
}

export function LineChart({
  points,
  title,
  emptyText = 'Not enough data yet',
}: LineChartProps) {
  const [active, setActive] = useState<number | null>(null)

  if (points.length < 2) {
    return (
      <div className="chart">
        {title && <p className="chart__title">{title}</p>}
        <p className="chart__empty">{emptyText}</p>
      </div>
    )
  }

  const w = 320
  const h = 160
  const pad = { t: 16, r: 12, b: 28, l: 40 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const coords = points.map((p, i) => {
    const x = pad.l + (i / (points.length - 1)) * innerW
    const y = pad.t + (1 - (p.value - min) / span) * innerH
    return { x, y, ...p }
  })

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const activePoint = active != null ? coords[active] : null

  return (
    <div className="chart">
      {title && <p className="chart__title">{title}</p>}
      <svg
        className="chart__svg"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={title ?? 'Line chart'}
      >
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + t * innerH
          const val = max - t * span
          return (
            <g key={t}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={y}
                y2={y}
                className="chart__grid"
              />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" className="chart__axis">
                {formatSeconds(val)}
              </text>
            </g>
          )
        })}
        <path d={path} className="chart__line" fill="none" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={active === i ? 5 : 3.5}
            className="chart__dot"
            onClick={() => setActive(i)}
          />
        ))}
        {activePoint && (
          <g>
            <rect
              x={Math.min(activePoint.x - 36, w - 84)}
              y={Math.max(activePoint.y - 28, 4)}
              width="72"
              height="22"
              rx="6"
              className="chart__tip-bg"
            />
            <text
              x={Math.min(activePoint.x - 36, w - 84) + 36}
              y={Math.max(activePoint.y - 28, 4) + 15}
              textAnchor="middle"
              className="chart__tip"
            >
              {formatSeconds(activePoint.value)}
            </text>
          </g>
        )}
      </svg>
      <p className="chart__hint">Tap a point for value · lower is faster</p>
    </div>
  )
}
