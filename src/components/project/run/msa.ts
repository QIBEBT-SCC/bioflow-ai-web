export const MAX_MSA_SEQUENCES = 2_000
export const MAX_MSA_COLUMNS = 100_000
export const MAX_MSA_CELLS = 5_000_000

export type MsaFormat = 'fasta' | 'clustal' | 'stockholm' | 'phylip'
export type MsaAlphabet = 'nucleotide' | 'protein'

export type MsaSequence = {
  name: string
  description: string
  sequence: string
}

export type MsaAlignment = {
  format: MsaFormat
  alphabet: MsaAlphabet
  length: number
  sequences: MsaSequence[]
}

export type MsaErrorCode =
  | 'duplicateName'
  | 'empty'
  | 'inconsistentLength'
  | 'invalidPhylip'
  | 'invalidSequence'
  | 'phylipCount'
  | 'tooFewSequences'
  | 'tooManyCells'
  | 'tooManyColumns'
  | 'tooManySequences'
  | 'unsupportedFormat'

export class MsaParseError extends Error {
  constructor(public readonly code: MsaErrorCode) {
    super(code)
    this.name = 'MsaParseError'
  }
}

type RawSequence = {
  name: string
  description?: string
  sequence: string
}

const SEQUENCE_PATTERN = /^[A-Za-z*?.-]+$/
const NUCLEOTIDE_PATTERN = /^[ACGTUNRYKMSWBDHVX*?.-]+$/

function normalizeSequence(sequence: string): string {
  const normalized = sequence
    .replaceAll(/\s/g, '')
    .replaceAll('.', '-')
    .toUpperCase()
  if (!normalized || !SEQUENCE_PATTERN.test(normalized))
    throw new MsaParseError('invalidSequence')
  return normalized
}

function finalizeAlignment(
  format: MsaFormat,
  rawSequences: RawSequence[],
  expectedLength?: number,
): MsaAlignment {
  if (rawSequences.length < 2) throw new MsaParseError('tooFewSequences')
  if (rawSequences.length > MAX_MSA_SEQUENCES)
    throw new MsaParseError('tooManySequences')

  const names = new Set<string>()
  const sequences = rawSequences.map((item) => {
    if (!item.name) throw new MsaParseError('invalidSequence')
    if (names.has(item.name)) throw new MsaParseError('duplicateName')
    names.add(item.name)
    return {
      name: item.name,
      description: item.description ?? '',
      sequence: normalizeSequence(item.sequence),
    }
  })
  const length = sequences[0].sequence.length
  if (
    (expectedLength !== undefined && length !== expectedLength) ||
    sequences.some((item) => item.sequence.length !== length)
  )
    throw new MsaParseError('inconsistentLength')
  if (length > MAX_MSA_COLUMNS) throw new MsaParseError('tooManyColumns')
  if (length * sequences.length > MAX_MSA_CELLS)
    throw new MsaParseError('tooManyCells')

  const symbols = sequences.map((item) => item.sequence).join('')
  const alphabet: MsaAlphabet = NUCLEOTIDE_PATTERN.test(symbols)
    ? 'nucleotide'
    : 'protein'
  return { format, alphabet, length, sequences }
}

function parseFasta(lines: string[]): MsaAlignment {
  const sequences: RawSequence[] = []
  let current: RawSequence | null = null
  for (const line of lines) {
    if (line.startsWith('>')) {
      const header = line.slice(1).trim()
      const match = /^(\S+)(?:\s+(.*))?$/.exec(header)
      if (!match) throw new MsaParseError('invalidSequence')
      current = {
        name: match[1],
        description: match[2] ?? '',
        sequence: '',
      }
      sequences.push(current)
      continue
    }
    if (!line.trim()) continue
    if (!current) throw new MsaParseError('invalidSequence')
    current.sequence += line.trim()
  }
  return finalizeAlignment('fasta', sequences)
}

function appendBlockSequence(
  order: string[],
  chunks: Map<string, string>,
  name: string,
  chunk: string,
): void {
  if (!chunks.has(name)) order.push(name)
  chunks.set(name, (chunks.get(name) ?? '') + chunk)
}

function parseClustal(lines: string[]): MsaAlignment {
  const order: string[] = []
  const chunks = new Map<string, string>()
  for (const line of lines.slice(1)) {
    const trimmed = line.trim()
    if (!trimmed || /^[*:.\s]+$/.test(trimmed)) continue
    const match = /^(\S+)\s+([A-Za-z*?.-]+)(?:\s+\d+)?\s*$/.exec(line)
    if (!match) throw new MsaParseError('invalidSequence')
    appendBlockSequence(order, chunks, match[1], match[2])
  }
  return finalizeAlignment(
    'clustal',
    order.map((name) => ({ name, sequence: chunks.get(name) ?? '' })),
  )
}

function parseStockholm(lines: string[]): MsaAlignment {
  const order: string[] = []
  const chunks = new Map<string, string>()
  for (const line of lines.slice(1)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === '//' || trimmed.startsWith('#')) continue
    const match = /^(\S+)\s+([A-Za-z*?.-]+)\s*$/.exec(trimmed)
    if (!match) throw new MsaParseError('invalidSequence')
    appendBlockSequence(order, chunks, match[1], match[2])
  }
  return finalizeAlignment(
    'stockholm',
    order.map((name) => ({ name, sequence: chunks.get(name) ?? '' })),
  )
}

function parsePhylipNamedLine(
  line: string,
): { name: string; sequence: string } | null {
  const trimmed = line.trim()
  const fields = trimmed.split(/\s+/)
  if (fields.length >= 2) {
    const sequence = fields.slice(1).join('')
    if (SEQUENCE_PATTERN.test(sequence)) return { name: fields[0], sequence }
  }
  if (line.length > 10) {
    const name = line.slice(0, 10).trim()
    const sequence = line.slice(10).replaceAll(/\s/g, '')
    if (name && SEQUENCE_PATTERN.test(sequence)) return { name, sequence }
  }
  return null
}

function parsePhylipInterleaved(
  lines: string[],
  sequenceCount: number,
  expectedLength: number,
): MsaAlignment {
  if (lines.length < sequenceCount) throw new MsaParseError('phylipCount')
  const sequences: RawSequence[] = []
  for (const line of lines.slice(0, sequenceCount)) {
    const parsed = parsePhylipNamedLine(line)
    if (!parsed) throw new MsaParseError('invalidPhylip')
    sequences.push({ ...parsed })
  }
  const remaining = lines.slice(sequenceCount)
  if (remaining.length % sequenceCount !== 0)
    throw new MsaParseError('phylipCount')
  remaining.forEach((line, index) => {
    const row = index % sequenceCount
    const parsed = parsePhylipNamedLine(line)
    const chunk =
      parsed?.name === sequences[row].name
        ? parsed.sequence
        : line.replaceAll(/\s/g, '')
    if (!SEQUENCE_PATTERN.test(chunk)) throw new MsaParseError('invalidPhylip')
    sequences[row].sequence += chunk
  })
  return finalizeAlignment('phylip', sequences, expectedLength)
}

function parsePhylipSequential(
  lines: string[],
  sequenceCount: number,
  expectedLength: number,
): MsaAlignment {
  const sequences: RawSequence[] = []
  let lineIndex = 0
  while (sequences.length < sequenceCount && lineIndex < lines.length) {
    const parsed = parsePhylipNamedLine(lines[lineIndex])
    if (!parsed) throw new MsaParseError('invalidPhylip')
    lineIndex += 1
    let sequence = parsed.sequence
    while (sequence.length < expectedLength && lineIndex < lines.length) {
      const line = lines[lineIndex]
      if (!/^\s/.test(line) && parsePhylipNamedLine(line)) break
      const chunk = line.replaceAll(/\s/g, '')
      if (!SEQUENCE_PATTERN.test(chunk))
        throw new MsaParseError('invalidPhylip')
      sequence += chunk
      lineIndex += 1
    }
    sequences.push({ name: parsed.name, sequence })
  }
  if (lineIndex !== lines.length || sequences.length !== sequenceCount)
    throw new MsaParseError('phylipCount')
  return finalizeAlignment('phylip', sequences, expectedLength)
}

function parsePhylip(lines: string[]): MsaAlignment {
  const header = /^\s*(\d+)\s+(\d+)\s*$/.exec(lines[0] ?? '')
  if (!header) throw new MsaParseError('invalidPhylip')
  const sequenceCount = Number(header[1])
  const expectedLength = Number(header[2])
  if (
    !Number.isSafeInteger(sequenceCount) ||
    !Number.isSafeInteger(expectedLength)
  )
    throw new MsaParseError('invalidPhylip')
  if (sequenceCount > MAX_MSA_SEQUENCES)
    throw new MsaParseError('tooManySequences')
  if (expectedLength > MAX_MSA_COLUMNS)
    throw new MsaParseError('tooManyColumns')
  if (sequenceCount * expectedLength > MAX_MSA_CELLS)
    throw new MsaParseError('tooManyCells')

  const dataLines = lines.slice(1).filter((line) => line.trim())
  try {
    return parsePhylipInterleaved(dataLines, sequenceCount, expectedLength)
  } catch (interleavedError) {
    try {
      return parsePhylipSequential(dataLines, sequenceCount, expectedLength)
    } catch {
      throw interleavedError
    }
  }
}

export function parseMsa(source: string): MsaAlignment {
  const lines = source
    .replace(/^\uFEFF/, '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
  const firstIndex = lines.findIndex((line) => line.trim())
  if (firstIndex === -1) throw new MsaParseError('empty')
  const contentLines = lines.slice(firstIndex)
  const first = contentLines[0].trim()
  if (first.startsWith('>')) return parseFasta(contentLines)
  if (/^#\s*STOCKHOLM\s+1\.0\b/i.test(first))
    return parseStockholm(contentLines)
  if (/^(CLUSTAL|MUSCLE|PROBCONS|T-COFFEE)\b/i.test(first))
    return parseClustal(contentLines)
  if (/^\d+\s+\d+$/.test(first)) return parsePhylip(contentLines)
  throw new MsaParseError('unsupportedFormat')
}

export function buildMsaConsensus(sequences: MsaSequence[]): string {
  const length = sequences[0]?.sequence.length ?? 0
  let consensus = ''
  for (let column = 0; column < length; column += 1) {
    const counts = new Map<string, number>()
    let residues = 0
    for (const item of sequences) {
      const residue = item.sequence[column]
      if (!residue || residue === '-' || residue === '?') continue
      counts.set(residue, (counts.get(residue) ?? 0) + 1)
      residues += 1
    }
    if (!residues) {
      consensus += ' '
      continue
    }
    const maximum = Math.max(...counts.values())
    if (counts.size === 1 && residues === sequences.length) consensus += '*'
    else if (maximum / residues >= 0.8) consensus += ':'
    else if (maximum / residues >= 0.5) consensus += '.'
    else consensus += ' '
  }
  return consensus
}
