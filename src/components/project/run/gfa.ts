export const MAX_GFA_SEGMENTS = 1_000
export const MAX_GFA_LINKS = 3_000
export const MAX_GFA_PATHS = 200
export const MAX_GFA_PATH_STEPS = 20_000

export type GfaOrientation = '+' | '-'

export type GfaSegment = {
  name: string
  length: number | null
  depth: number | null
  tags: Record<string, string>
}

export type GfaLink = {
  id: number
  from: string
  fromOrientation: GfaOrientation
  to: string
  toOrientation: GfaOrientation
  overlap: string
}

export type GfaPathStep = {
  segment: string
  orientation: GfaOrientation
}

export type GfaPath = {
  name: string
  steps: GfaPathStep[]
}

export type GfaGraph = {
  version: string
  segments: GfaSegment[]
  links: GfaLink[]
  paths: GfaPath[]
  totalLength: number
  unknownLengthCount: number
  ignoredRecordCount: number
}

export type GfaErrorCode =
  | 'duplicateName'
  | 'duplicatePath'
  | 'duplicateSegment'
  | 'empty'
  | 'invalidOrientation'
  | 'invalidRecord'
  | 'missingSegment'
  | 'tooManyLinks'
  | 'tooManyPathSteps'
  | 'tooManyPaths'
  | 'tooManySegments'
  | 'unsupportedVersion'

export class GfaParseError extends Error {
  constructor(
    public readonly code: GfaErrorCode,
    public readonly line: number,
  ) {
    super(`${code} at line ${line}`)
    this.name = 'GfaParseError'
  }
}

type PendingLink = GfaLink & { line: number }
type PendingPath = GfaPath & { line: number }

function parseTags(fields: string[], line: number): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of fields) {
    const match = /^([A-Za-z][A-Za-z0-9]):([AifZJHB]):(.*)$/.exec(field)
    if (!match) throw new GfaParseError('invalidRecord', line)
    if (values[match[1]] !== undefined)
      throw new GfaParseError('invalidRecord', line)
    values[match[1]] = match[3]
  }
  return values
}

function parseNonnegativeNumber(value: string | undefined): number | null {
  if (value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseOrientation(value: string, line: number): GfaOrientation {
  if (value === '+' || value === '-') return value
  throw new GfaParseError('invalidOrientation', line)
}

function validName(value: string): boolean {
  return (
    /^[!-~]+$/.test(value) &&
    !value.startsWith('*') &&
    !value.startsWith('=') &&
    !value.includes('+,') &&
    !value.includes('-,')
  )
}

function parseSegment(fields: string[], line: number): GfaSegment {
  if (fields.length < 3 || !validName(fields[1]) || !fields[2])
    throw new GfaParseError('invalidRecord', line)
  const sequence = fields[2]
  if (sequence !== '*' && !/^[A-Za-z=.]+$/.test(sequence))
    throw new GfaParseError('invalidRecord', line)
  const tags = parseTags(fields.slice(3), line)
  const taggedLength = parseNonnegativeNumber(tags.LN)
  if (tags.LN !== undefined && taggedLength === null)
    throw new GfaParseError('invalidRecord', line)
  const length = sequence === '*' ? taggedLength : sequence.length
  const depth = parseNonnegativeNumber(tags.dp ?? tags.DP)
  return { name: fields[1], length, depth, tags }
}

function parseLink(fields: string[], line: number, id: number): PendingLink {
  if (
    fields.length < 6 ||
    !validName(fields[1]) ||
    !validName(fields[3]) ||
    !fields[5]
  )
    throw new GfaParseError('invalidRecord', line)
  parseTags(fields.slice(6), line)
  if (!/^(?:\*|(?:\d+[MIDNSHPX=])+)$/.test(fields[5]))
    throw new GfaParseError('invalidRecord', line)
  return {
    id,
    from: fields[1],
    fromOrientation: parseOrientation(fields[2], line),
    to: fields[3],
    toOrientation: parseOrientation(fields[4], line),
    overlap: fields[5],
    line,
  }
}

function parsePath(fields: string[], line: number): PendingPath {
  if (fields.length < 4 || !validName(fields[1]) || !fields[2] || !fields[3])
    throw new GfaParseError('invalidRecord', line)
  parseTags(fields.slice(4), line)
  const names = fields[2].split(/[;,]/)
  if (!names.length || names.some((name) => name.length < 2))
    throw new GfaParseError('invalidRecord', line)
  const steps = names.map((name): GfaPathStep => {
    const orientation = parseOrientation(name.at(-1) ?? '', line)
    const segment = name.slice(0, -1)
    if (!segment) throw new GfaParseError('invalidRecord', line)
    return { segment, orientation }
  })
  if (fields[3] !== '*') {
    const overlaps = fields[3].split(',')
    if (
      overlaps.length !== Math.max(0, steps.length - 1) ||
      overlaps.some(
        (overlap) => !/^(?:(?:\d+[MIDNSHPX=])+|[-+]?\d+J|\.)$/.test(overlap),
      )
    )
      throw new GfaParseError('invalidRecord', line)
  }
  return { name: fields[1], steps, line }
}

function readVersion(fields: string[], line: number): string | null {
  const tags = parseTags(fields.slice(1), line)
  const version = tags.VN
  if (!version) return null
  if (!/^1(?:\.\d+)?$/.test(version))
    throw new GfaParseError('unsupportedVersion', line)
  return version
}

export function parseGfa(source: string): GfaGraph {
  const lines = source
    .replace(/^\uFEFF/, '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
  const segments: GfaSegment[] = []
  const links: PendingLink[] = []
  const paths: PendingPath[] = []
  const segmentNames = new Set<string>()
  const pathNames = new Set<string>()
  let version = '1.x'
  let ignoredRecordCount = 0
  let totalPathSteps = 0
  let sawRecord = false

  lines.forEach((rawLine, index) => {
    const line = index + 1
    if (!rawLine.trim() || rawLine.startsWith('#')) return
    sawRecord = true
    const fields = rawLine.split('\t')
    const recordType = fields[0]
    if (recordType === 'H') {
      version = readVersion(fields, line) ?? version
      return
    }
    if (recordType === 'S') {
      if (segments.length >= MAX_GFA_SEGMENTS)
        throw new GfaParseError('tooManySegments', line)
      const segment = parseSegment(fields, line)
      if (segmentNames.has(segment.name))
        throw new GfaParseError('duplicateSegment', line)
      if (pathNames.has(segment.name))
        throw new GfaParseError('duplicateName', line)
      segmentNames.add(segment.name)
      segments.push(segment)
      return
    }
    if (recordType === 'L') {
      if (links.length >= MAX_GFA_LINKS)
        throw new GfaParseError('tooManyLinks', line)
      links.push(parseLink(fields, line, links.length))
      return
    }
    if (recordType === 'P') {
      if (paths.length >= MAX_GFA_PATHS)
        throw new GfaParseError('tooManyPaths', line)
      const path = parsePath(fields, line)
      if (pathNames.has(path.name))
        throw new GfaParseError('duplicatePath', line)
      if (segmentNames.has(path.name))
        throw new GfaParseError('duplicateName', line)
      totalPathSteps += path.steps.length
      if (totalPathSteps > MAX_GFA_PATH_STEPS)
        throw new GfaParseError('tooManyPathSteps', line)
      pathNames.add(path.name)
      paths.push(path)
      return
    }
    if (recordType === 'C' || recordType === 'J' || recordType === 'W') {
      ignoredRecordCount += 1
      return
    }
    if (['E', 'F', 'G', 'O', 'U'].includes(recordType))
      throw new GfaParseError('unsupportedVersion', line)
    throw new GfaParseError('invalidRecord', line)
  })

  if (!sawRecord || !segments.length) throw new GfaParseError('empty', 1)
  for (const link of links) {
    if (!segmentNames.has(link.from) || !segmentNames.has(link.to))
      throw new GfaParseError('missingSegment', link.line)
  }
  for (const path of paths) {
    if (path.steps.some((step) => !segmentNames.has(step.segment)))
      throw new GfaParseError('missingSegment', path.line)
  }

  const totalLength = segments.reduce(
    (sum, segment) => sum + (segment.length ?? 0),
    0,
  )
  return {
    version,
    segments,
    links: links.map(({ line: _line, ...link }) => link),
    paths: paths.map(({ line: _line, ...path }) => path),
    totalLength,
    unknownLengthCount: segments.filter((segment) => segment.length === null)
      .length,
    ignoredRecordCount,
  }
}
