type NumberPadProps = {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'] as const

export function NumberPad({ value, onChange, onSubmit, disabled }: NumberPadProps) {
  const press = (key: (typeof KEYS)[number]) => {
    if (disabled) return
    if (key === 'clear') {
      onChange('')
      return
    }
    if (key === 'ok') {
      onSubmit()
      return
    }
    if (value.length >= 4) return
    onChange(value + key)
  }

  return (
    <div className="pad" aria-label="Number pad">
      {KEYS.map((key) => {
        const label = key === 'clear' ? 'C' : key === 'ok' ? 'OK' : key
        const className =
          key === 'ok' ? 'pad__key pad__key--ok' : key === 'clear' ? 'pad__key pad__key--clear' : 'pad__key'
        return (
          <button
            key={key}
            type="button"
            className={className}
            disabled={disabled}
            onClick={() => press(key)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
