type SparklineProps = {
  values: number[]
  /** Lower is better (speed) — invert fill emphasis */
  lowerIsBetter?: boolean
}

/** Tiny SVG sparkline for avg times over rounds. */
export function Sparkline({ values, lowerIsBetter = true }: SparklineProps) {
  if (values.length < 2) {
    return <span className="sparkline sparkline--empty">Not enough rounds</span>
  }

  const w = 120
  const h = 36
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 4) + 2
    const yNorm = (v - min) / span
    const y = lowerIsBetter ? 2 + yNorm * (h - 4) : 2 + (1 - yNorm) * (h - 4)
    return `${x},${y}`
  })

  const improved =
    lowerIsBetter
      ? values[values.length - 1] <= values[0]
      : values[values.length - 1] >= values[0]

  return (
    <svg
      className={`sparkline${improved ? ' sparkline--up' : ' sparkline--down'}`}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(' ')}
      />
    </svg>
  )
}
