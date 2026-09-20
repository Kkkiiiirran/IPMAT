import { useEffect, useRef, useState } from 'react'

type TimeBarProps = {
  limitMs: number
  running: boolean
  resetKey: string | number
  onTimeout: () => void
}

export function TimeBar({ limitMs, running, resetKey, onTimeout }: TimeBarProps) {
  const [progress, setProgress] = useState(0)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    setProgress(0)
    if (!running) return

    const started = performance.now()
    let frame = 0
    let timedOut = false

    const tick = (now: number) => {
      const elapsed = now - started
      const ratio = Math.min(1, elapsed / limitMs)
      setProgress(ratio)
      if (ratio >= 1) {
        if (!timedOut) {
          timedOut = true
          onTimeoutRef.current()
        }
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [limitMs, running, resetKey])

  const remaining = Math.max(0, 1 - progress)
  const urgent = remaining < 0.25

  return (
    <div className="time-bar" role="timer" aria-valuenow={Math.round(remaining * 100)}>
      <div
        className={`time-bar__fill${urgent ? ' time-bar__fill--urgent' : ''}`}
        style={{ transform: `scaleX(${remaining})` }}
      />
    </div>
  )
}
