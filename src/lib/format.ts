/** Format milliseconds as a short seconds label, e.g. 2.4s */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}
