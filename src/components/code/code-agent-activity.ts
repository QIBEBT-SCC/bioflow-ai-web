export type ToolKind =
  | 'read'
  | 'edit'
  | 'delete'
  | 'move'
  | 'search'
  | 'execute'
  | 'think'
  | 'fetch'
  | 'other'

type ToolStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'stopped'

export interface CodeAgentActivity {
  callId?: string
  title: string
  kind: ToolKind
  status: ToolStatus
  statusProvided: boolean
  locations: string[]
  command?: string
  output?: string
}

export type CodeAgentTimelineItem =
  | {
      id: string
      type: 'message'
      role: 'user' | 'assistant'
      text: string
    }
  | {
      id: string
      type: 'plan'
      active: boolean
      payload: Record<string, unknown>
    }
  | {
      id: string
      type: 'thought'
      active: boolean
      text: string
    }
  | {
      id: string
      type: 'activity'
      activity: CodeAgentActivity
    }
  | {
      id: string
      type: 'terminal'
      output: string
      active: boolean
    }

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export function stringValue(
  record: Record<string, unknown> | undefined,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function activitySource(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return asRecord(payload.detail) ?? payload
}

function normalizeKind(value: unknown): ToolKind | undefined {
  return typeof value === 'string' &&
    [
      'read',
      'edit',
      'delete',
      'move',
      'search',
      'execute',
      'think',
      'fetch',
      'other',
    ].includes(value)
    ? (value as ToolKind)
    : undefined
}

function normalizeStatus(value: unknown): ToolStatus | undefined {
  return value === 'pending' ||
    value === 'in_progress' ||
    value === 'completed' ||
    value === 'failed'
    ? value
    : undefined
}

function extractLocations(source: Record<string, unknown>): string[] {
  if (!Array.isArray(source.locations)) return []
  return source.locations.flatMap((location) => {
    const path = stringValue(asRecord(location), 'path')
    return path ? [path] : []
  })
}

function extractCommand(source: Record<string, unknown>): string | undefined {
  if (typeof source.rawInput === 'string') return source.rawInput
  const input = asRecord(source.rawInput)
  const command = stringValue(input, 'command', 'cmd', 'input')
  if (command) return command
  const argv = input?.argv
  return Array.isArray(argv) && argv.every((part) => typeof part === 'string')
    ? argv.join(' ')
    : undefined
}

function extractOutput(
  payload: Record<string, unknown>,
  source: Record<string, unknown>,
): string | undefined {
  const direct = stringValue(payload, 'output') ?? stringValue(source, 'output')
  if (direct) return direct
  if (typeof source.rawOutput === 'string') return source.rawOutput
  return stringValue(asRecord(source.rawOutput), 'output', 'stdout', 'stderr')
}

export function codeAgentActivityFromPayload(
  payload: Record<string, unknown>,
): CodeAgentActivity | undefined {
  const source = activitySource(payload)
  const callId = stringValue(source, 'toolCallId')
  const kind = normalizeKind(source.kind ?? payload.kind)
  if (!kind && !callId) return undefined
  const status = normalizeStatus(source.status ?? payload.status)
  return {
    callId,
    title:
      stringValue(source, 'title', 'name') ??
      stringValue(payload, 'title', 'name') ??
      '',
    kind: kind ?? 'other',
    status: status ?? 'in_progress',
    statusProvided: Boolean(status),
    locations: extractLocations(source),
    command: extractCommand(source),
    output: extractOutput(payload, source),
  }
}

export function mergeCodeAgentActivity(
  current: CodeAgentActivity,
  update: CodeAgentActivity,
): CodeAgentActivity {
  return {
    callId: update.callId ?? current.callId,
    title: update.title || current.title,
    kind: update.kind === 'other' ? current.kind : update.kind,
    status: update.statusProvided ? update.status : current.status,
    statusProvided: current.statusProvided || update.statusProvided,
    locations: update.locations.length ? update.locations : current.locations,
    command: update.command ?? current.command,
    output: update.output ?? current.output,
  }
}
