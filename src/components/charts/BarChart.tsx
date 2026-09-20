export type BarItem = {
  id: string
  label: string
  value: number
}

type BarChartProps = {
  items: BarItem[]
  title?: string
  emptyText?: string
  onSelect?: (id: string) => void
}

export function BarChart({
  items,
  title,
  emptyText = 'No rounds yet',
  onSelect,
}: BarChartProps) {
  if (items.length === 0) {
    return (
      <div className="chart">
        {title && <p className="chart__title">{title}</p>}
        <p className="chart__empty">{emptyText}</p>
      </div>
    )
  }

  const max = Math.max(...items.map((i) => i.value), 1)
  const visible = items.slice(0, 8)

  return (
    <div className="chart">
      {title && <p className="chart__title">{title}</p>}
      <ul className="bar-chart">
        {visible.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="bar-chart__row"
              onClick={() => onSelect?.(item.id)}
            >
              <span className="bar-chart__label">{item.label}</span>
              <span className="bar-chart__track">
                <span
                  className="bar-chart__fill"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </span>
              <span className="bar-chart__value">{item.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
