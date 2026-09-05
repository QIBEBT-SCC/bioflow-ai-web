'use client'

import {
  BookOpenIcon,
  BrainIcon,
  ChevronDownIcon,
  FilePenLineIcon,
  FolderSearchIcon,
  GlobeIcon,
  Loader2Icon,
  SearchIcon,
  SquareTerminalIcon,
  WrenchIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ComponentType } from 'react'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { Task, TaskContent, TaskTrigger } from '@/components/ai-elements/task'
import {
  Terminal,
  TerminalContent,
  TerminalHeader,
  TerminalTitle,
} from '@/components/ai-elements/terminal'

type ToolKind =
  | 'read'
  | 'edit'
  | 'delete'
  | 'move'
  | 'search'
  | 'execute'
  | 'think'
  | 'fetch'
  | 'other'

type ToolStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

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
      type: 'event'
      name: string
    }
  | {
      id: string
      type: 'terminal'
      output: string
      active: boolean
    }

const TOOL_ICONS: Record<ToolKind, ComponentType<{ className?: string }>> = {
  read: BookOpenIcon,
  edit: FilePenLineIcon,
  delete: FilePenLineIcon,
  move: FilePenLineIcon,
  search: SearchIcon,
  execute: SquareTerminalIcon,
  think: BrainIcon,
  fetch: GlobeIcon,
  other: WrenchIcon,
}

const ACTIVITY_LABEL_KEYS = {
  read: {
    running: 'activityLabels.read.running',
    completed: 'activityLabels.read.completed',
    failed: 'activityLabels.read.failed',
  },
  edit: {
    running: 'activityLabels.edit.running',
    completed: 'activityLabels.edit.completed',
    failed: 'activityLabels.edit.failed',
  },
  delete: {
    running: 'activityLabels.delete.running',
    completed: 'activityLabels.delete.completed',
    failed: 'activityLabels.delete.failed',
  },
  move: {
    running: 'activityLabels.move.running',
    completed: 'activityLabels.move.completed',
    failed: 'activityLabels.move.failed',
  },
  search: {
    running: 'activityLabels.search.running',
    completed: 'activityLabels.search.completed',
    failed: 'activityLabels.search.failed',
  },
  execute: {
    running: 'activityLabels.execute.running',
    completed: 'activityLabels.execute.completed',
    failed: 'activityLabels.execute.failed',
  },
  think: {
    running: 'activityLabels.think.running',
    completed: 'activityLabels.think.completed',
    failed: 'activityLabels.think.failed',
  },
  fetch: {
    running: 'activityLabels.fetch.running',
    completed: 'activityLabels.fetch.completed',
    failed: 'activityLabels.fetch.failed',
  },
  other: {
    running: 'activityLabels.other.running',
    completed: 'activityLabels.other.completed',
    failed: 'activityLabels.other.failed',
  },
} as const

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function stringValue(
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
  return typeof value === 'string' && value in TOOL_ICONS
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
  const kind = normalizeKind(source.kind ?? payload.kind)
  if (!kind) return undefined
  const status = normalizeStatus(source.status ?? payload.status)
  return {
    callId: stringValue(source, 'toolCallId', 'tool_call_id', 'id'),
    title:
      stringValue(source, 'title', 'name') ??
      stringValue(payload, 'title', 'name') ??
      '',
    kind,
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

interface PlanEntry {
  content: string
  status: 'complete' | 'active' | 'pending'
}

function normalizePlanStatus(value: unknown): PlanEntry['status'] {
  if (value === 'completed' || value === 'complete') return 'complete'
  if (value === 'in_progress' || value === 'active') return 'active'
  return 'pending'
}

function planEntries(payload: Record<string, unknown>): PlanEntry[] {
  if (Array.isArray(payload.entries)) {
    return payload.entries.flatMap((entry) => {
      const record = asRecord(entry)
      const content = stringValue(record, 'content', 'title', 'text')
      return content
        ? [{ content, status: normalizePlanStatus(record?.status) }]
        : []
    })
  }
  const content = stringValue(payload, 'content', 'plan', 'title')
  return content ? [{ content, status: 'active' }] : []
}

function activityTarget(activity: CodeAgentActivity): string {
  if (activity.kind === 'execute' && activity.command) return activity.command
  if (activity.locations.length) {
    return activity.locations
      .map((location) => location.split('/').at(-1) || location)
      .join(', ')
  }
  return activity.title || activity.kind
}

function ActivityTimelineItem({ activity }: { activity: CodeAgentActivity }) {
  const t = useTranslations('code.Agent')
  const Icon = TOOL_ICONS[activity.kind]
  const hasDetails = Boolean(
    activity.command || activity.output || activity.locations.length,
  )
  const phase =
    activity.status === 'completed'
      ? 'completed'
      : activity.status === 'failed'
        ? 'failed'
        : 'running'
  const statusLabel = t(ACTIVITY_LABEL_KEYS[activity.kind][phase])
  const summary = (
    <>
      {activity.status === 'in_progress' || activity.status === 'pending' ? (
        <Loader2Icon className='size-3.5 shrink-0 animate-spin' />
      ) : (
        <Icon className='size-3.5 shrink-0' />
      )}
      <span className='shrink-0'>{statusLabel}</span>
      <span className='min-w-0 truncate text-foreground/75'>
        {activityTarget(activity)}
      </span>
    </>
  )

  if (!hasDetails) {
    return (
      <div className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
        {summary}
      </div>
    )
  }

  return (
    <Task defaultOpen={activity.status === 'failed'}>
      <TaskTrigger title={activity.title}>
        <button
          type='button'
          className='group flex min-w-0 items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground'
        >
          {summary}
          <ChevronDownIcon className='ml-auto size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180' />
        </button>
      </TaskTrigger>
      <TaskContent className='space-y-2'>
        {activity.locations.map((location) => (
          <div
            key={location}
            className='flex items-center gap-2 text-xs text-muted-foreground'
          >
            <FolderSearchIcon className='size-3.5 shrink-0' />
            <code className='truncate'>{location}</code>
          </div>
        ))}
        {activity.command && (
          <pre className='overflow-x-auto rounded-md border bg-muted/40 p-2 font-mono text-[11px] leading-5 text-foreground'>
            {activity.command}
          </pre>
        )}
        {activity.output && (
          <Terminal output={activity.output} autoScroll={false}>
            <TerminalContent className='max-h-48 p-2 text-[11px]' />
          </Terminal>
        )}
      </TaskContent>
    </Task>
  )
}

function PlanTimelineItem({
  payload,
  active,
}: {
  payload: Record<string, unknown>
  active: boolean
}) {
  const t = useTranslations('code.Agent')
  const entries = planEntries(payload)
  if (!entries.length) return null
  return (
    <ChainOfThought defaultOpen={active}>
      <ChainOfThoughtHeader>
        {active ? t('thinking') : t('thought')}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {entries.map((entry) => (
          <ChainOfThoughtStep
            key={entry.content}
            label={entry.content}
            status={entry.status}
          />
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

function ThoughtTimelineItem({
  text,
  active,
}: {
  text: string
  active: boolean
}) {
  const t = useTranslations('code.Agent')
  if (!text.trim()) return null
  return (
    <ChainOfThought defaultOpen={active}>
      <ChainOfThoughtHeader>
        {active ? t('thinking') : t('thought')}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <MessageResponse className='text-sm text-muted-foreground'>
          {text}
        </MessageResponse>
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

export function CodeAgentTimeline({
  items,
}: {
  items: CodeAgentTimelineItem[]
}) {
  const t = useTranslations('code.Agent')
  return items.map((item) => {
    if (item.type === 'message') {
      return (
        <Message key={item.id} from={item.role}>
          <MessageContent>
            <MessageResponse>{item.text}</MessageResponse>
          </MessageContent>
        </Message>
      )
    }
    if (item.type === 'plan') {
      return (
        <PlanTimelineItem
          key={item.id}
          payload={item.payload}
          active={item.active}
        />
      )
    }
    if (item.type === 'thought') {
      return (
        <ThoughtTimelineItem
          key={item.id}
          text={item.text}
          active={item.active}
        />
      )
    }
    if (item.type === 'activity') {
      return <ActivityTimelineItem key={item.id} activity={item.activity} />
    }
    if (item.type === 'event') {
      return (
        <div
          key={item.id}
          className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'
        >
          <WrenchIcon className='size-3.5 shrink-0' />
          <span className='min-w-0 truncate'>{item.name}</span>
        </div>
      )
    }
    return (
      <Task key={item.id} defaultOpen={false}>
        <TaskTrigger title={t('terminal')}>
          <button
            type='button'
            className='group flex min-w-0 items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground'
          >
            {item.active ? (
              <Loader2Icon className='size-3.5 animate-spin' />
            ) : (
              <SquareTerminalIcon className='size-3.5' />
            )}
            <span>{t('terminal')}</span>
            <ChevronDownIcon className='ml-auto size-3.5 transition-transform group-data-[state=open]:rotate-180' />
          </button>
        </TaskTrigger>
        <TaskContent>
          <Terminal output={item.output} isStreaming={item.active}>
            <TerminalHeader>
              <TerminalTitle>{t('terminal')}</TerminalTitle>
            </TerminalHeader>
            <TerminalContent className='max-h-48 p-2 text-[11px]' />
          </Terminal>
        </TaskContent>
      </Task>
    )
  })
}
