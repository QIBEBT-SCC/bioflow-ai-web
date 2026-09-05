'use client'

import {
  BookOpenIcon,
  BrainIcon,
  ChevronDownIcon,
  FilePenLineIcon,
  FolderSearchIcon,
  GlobeIcon,
  SearchIcon,
  SquareTerminalIcon,
  WrenchIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ComponentType, useState } from 'react'
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
import {
  asRecord,
  type CodeAgentActivity,
  type CodeAgentTimelineItem,
  stringValue,
  type ToolKind,
} from '@/components/code/code-agent-activity'

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
  const statusLabel =
    activity.status === 'stopped'
      ? t('activityStopped')
      : t(ACTIVITY_LABEL_KEYS[activity.kind][phase])
  const summary = (
    <>
      <Icon className='size-3.5 shrink-0' />
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

type TaskItem = Exclude<CodeAgentTimelineItem, { type: 'message' }>

function TaskStep({ item }: { item: TaskItem }) {
  const t = useTranslations('code.Agent')
  if (item.type === 'thought') {
    return (
      <MessageResponse className='text-sm text-muted-foreground'>
        {item.text}
      </MessageResponse>
    )
  }
  if (item.type === 'plan') {
    return planEntries(item.payload).map((entry) => (
      <ChainOfThoughtStep
        key={entry.content}
        label={entry.content}
        status={entry.status}
      />
    ))
  }
  if (item.type === 'activity') {
    return <ActivityTimelineItem activity={item.activity} />
  }
  return (
    <Task defaultOpen={false}>
      <TaskTrigger title={t('terminal')}>
        <button
          type='button'
          className='group flex min-w-0 items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground'
        >
          <SquareTerminalIcon className='size-3.5' />
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
}

function TaskGroup({ items }: { items: TaskItem[] }) {
  const t = useTranslations('code.Agent')
  const active = items.some((item) =>
    item.type === 'activity'
      ? item.activity.status === 'pending' ||
        item.activity.status === 'in_progress'
      : item.active,
  )
  const [expanded, setExpanded] = useState<boolean | undefined>(undefined)
  return (
    <ChainOfThought open={expanded ?? active} onOpenChange={setExpanded}>
      <ChainOfThoughtHeader>
        {t(active ? 'taskRunning' : 'taskDetails', { count: items.length })}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {items.map((item) => (
          <TaskStep key={item.id} item={item} />
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}

export function CodeAgentTimeline({
  items,
}: {
  items: CodeAgentTimelineItem[]
}) {
  const groups: (
    | Extract<CodeAgentTimelineItem, { type: 'message' }>
    | { id: string; type: 'task'; items: TaskItem[] }
  )[] = []
  for (const item of items) {
    if (item.type === 'message') {
      groups.push(item)
      continue
    }
    if (item.type === 'thought' && !item.text.trim()) continue
    if (item.type === 'plan' && !planEntries(item.payload).length) continue
    const previous = groups.at(-1)
    if (previous?.type === 'task') previous.items.push(item)
    else groups.push({ id: item.id, type: 'task', items: [item] })
  }
  return groups.map((group) =>
    group.type === 'message' ? (
      <Message key={group.id} from={group.role}>
        <MessageContent>
          <MessageResponse>{group.text}</MessageResponse>
        </MessageContent>
      </Message>
    ) : (
      <TaskGroup key={group.id} items={group.items} />
    ),
  )
}
