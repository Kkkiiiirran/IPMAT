type NumberPadProps = {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  disabled?: boolean
  /** Allow leading minus for negative answers (subtraction). */
  allowNegative?: boolean
  /** Max digit count (excluding minus). */
  maxLength?: number
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'] as const

export function NumberPad({
  value,
  onChange,
  onSubmit,
  disabled,
  allowNegative = false,
  maxLength = 4,
}: NumberPadProps) {
  const press = (key: (typeof KEYS)[number] | 'minus') => {
    if (disabled) return
    if (key === 'clear') {
      onChange('')
      return
    }
    if (key === 'ok') {
      onSubmit()
      return
    }
    if (key === 'minus') {
      if (value.startsWith('-')) onChange(value.slice(1))
      else onChange(`-${value}`)
      return
    }
    const digits = value.startsWith('-') ? value.slice(1) : value
    if (digits.length >= maxLength) return
    onChange(value + key)
  }

  return (
    <div className="pad" aria-label="Number pad">
      {KEYS.map((key) => {
        const label = key === 'clear' ? 'C' : key === 'ok' ? 'OK' : key
        const className =
          key === 'ok'
            ? 'pad__key pad__key--ok'
            : key === 'clear'
              ? 'pad__key pad__key--clear'
              : 'pad__key'
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
      {allowNegative && (
        <button
          type="button"
          className="pad__key pad__key--minus pad__key--wide"
          disabled={disabled}
          onClick={() => press('minus')}
        >
          − / +
        </button>
      )}
    </div>
  )
}
