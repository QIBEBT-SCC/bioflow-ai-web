const TOKEN_UNITS = [
  { threshold: 1_000_000_000_000, suffix: 'T' },
  { threshold: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, suffix: 'M' },
  { threshold: 1_000, suffix: 'K' },
] as const

export function formatTokenCount(value: number) {
  const unit = TOKEN_UNITS.find(({ threshold }) => Math.abs(value) >= threshold)

  if (!unit) return value.toLocaleString()

  const compactValue = value / unit.threshold
  return `${compactValue.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}${unit.suffix}`
}
