export type GenomeViewport = { chrom: string; start: number; end: number }

export function parseLocus(value: string): GenomeViewport | null {
  const match = /^([^:\s]+):([\d,]+)-([\d,]+)$/.exec(value.trim())
  if (!match) return null
  const first = Number(match[2].replaceAll(',', ''))
  const last = Number(match[3].replaceAll(',', ''))
  if (
    !Number.isSafeInteger(first) ||
    !Number.isSafeInteger(last) ||
    first < 1 ||
    last < first
  )
    return null
  return { chrom: match[1], start: first - 1, end: last }
}
