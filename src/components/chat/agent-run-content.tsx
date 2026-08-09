'use client'

import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  DatabaseIcon,
  ListTodoIcon,
  type LucideIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemIndicator,
  type QueueItemStatus,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from '@/components/ai-elements/queue'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useTool } from '@/hooks/use-tool'
import type { AgentEvent, AgentRun, AgentToolArtifact } from '@/types/agent'
import { STREAMING_AGENT_STATUSES } from '@/types/agent'

interface ProgressActivity {
  id: number
  kind: string
  message: string
  completed?: number
  total?: number
  current?: string
  items?: TodoActivityItem[]
  count?: number
  sample?: string
  tag?: string
  keyword?: string
  path?: string
  command?: string
  phase?: string
  completeMessage?: string
  toolCallId?: string
  toolStatus?: 'running' | 'completed' | 'skipped'
}

interface TodoActivityItem {
  index?: number
  content: string
  status: 'pending' | 'in_progress' | 'completed'
}

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : undefined
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function toolStatus(value: unknown): ProgressActivity['toolStatus'] {
  return value === 'running' || value === 'completed' || value === 'skipped'
    ? value
    : undefined
}

function todoItems(value: unknown): TodoActivityItem[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.flatMap<TodoActivityItem>((item) => {
    if (!item || typeof item !== 'object') return []
    const candidate = item as Record<string, unknown>
    const content = stringValue(candidate.content)
    const status = candidate.status
    if (
      !content ||
      (status !== 'pending' &&
        status !== 'in_progress' &&
        status !== 'completed')
    ) {
      return []
    }
    return [
      {
        index: numberValue(candidate.index),
        content,
        status,
      },
    ]
  })
  return items.length > 0 ? items : undefined
}

function normalizeProgress(event: AgentEvent): ProgressActivity {
  const payload = event.payload
  const nestedTodo =
    typeof payload.todo === 'object' && payload.todo !== null
      ? (payload.todo as Record<string, unknown>)
      : undefined
  const source = nestedTodo ?? payload
  const kind = stringValue(payload.kind) ?? (nestedTodo ? 'todo' : 'activity')
  const current = stringValue(source.current)
  const message =
    stringValue(payload.info) ??
    stringValue(source.message) ??
    (kind === 'todo' ? current : undefined) ??
    stringValue(source.title) ??
    stringValue(source.status) ??
    ''

  return {
    id: event.id,
    kind,
    message,
    completed: numberValue(source.completed),
    total: numberValue(source.total),
    current,
    items: todoItems(source.items),
    count: numberValue(source.count),
    sample: stringValue(source.sample),
    tag: stringValue(source.tag),
    keyword: stringValue(source.keyword),
    path: stringValue(source.path),
    command: stringValue(source.command),
    phase: stringValue(source.phase),
    toolCallId: stringValue(source.tool_call_id),
    toolStatus: toolStatus(source.status),
  }
}

function mergeToolProgress(activities: ProgressActivity[]) {
  const merged: ProgressActivity[] = []
  const positions = new Map<string, number>()
  for (const activity of activities) {
    if (!activity.toolCallId) {
      merged.push(activity)
      continue
    }
    const position = positions.get(activity.toolCallId)
    if (position === undefined) {
      positions.set(activity.toolCallId, merged.length)
      merged.push(activity)
    } else {
      merged[position] = {
        ...merged[position],
        ...activity,
        id: merged[position].id,
      }
    }
  }
  return merged
}

const DETAIL_PREVIEW_LENGTH = 96

function detailPreview(value?: string) {
  if (!value) return undefined
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= DETAIL_PREVIEW_LENGTH) return normalized
  return `${normalized.slice(0, DETAIL_PREVIEW_LENGTH - 1)}…`
}

function CommandActivity({
  label,
  command,
  active,
}: {
  label: string
  command?: string
  active: boolean
}) {
  const preview = detailPreview(command)
  if (!preview) return label

  return (
    <Collapsible defaultOpen={active}>
      <CollapsibleTrigger className='group/command flex w-full items-center justify-between gap-2 text-left'>
        <span>{label}</span>
        <ChevronDownIcon className='size-3.5 shrink-0 transition-transform group-data-[state=open]/command:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <code
          className='mt-1.5 block font-mono text-[11px] text-foreground/70'
          title={command}
        >
          {preview}
        </code>
      </CollapsibleContent>
    </Collapsible>
  )
}

function activityIcon(activity: ProgressActivity): LucideIcon {
  const text = activity.message.toLowerCase()
  if (activity.kind === 'workflow_phase') {
    if (activity.phase === 'sample_manager') return DatabaseIcon
    if (activity.phase === 'workflow_planner') return ListTodoIcon
    return WrenchIcon
  }
  if (activity.kind === 'sample_run_command') return TerminalIcon
  if (activity.kind === 'sample_set_base_dir') return SearchIcon
  if (
    activity.kind === 'sample_list_project_samples' ||
    activity.kind.startsWith('sample_add_')
  ) {
    return DatabaseIcon
  }
  if (activity.kind === 'sample_ask_human') return ShieldCheckIcon
  if (activity.kind === 'validation') return ShieldCheckIcon
  if (/search|find|look/.test(text)) return SearchIcon
  if (/save|database/.test(text)) return DatabaseIcon
  if (/create|generat|prepar|config/.test(text)) return WrenchIcon
  return SparklesIcon
}

function queueStatus(status: TodoActivityItem['status']): QueueItemStatus {
  return status === 'in_progress' ? 'active' : status
}

export function AgentRunProgress({
  events,
  run,
}: {
  events: AgentEvent[]
  run: AgentRun
}) {
  const t = useTranslations('Chat.progress')
  const activities = useMemo(() => {
    const normalized = events
      .filter((event) => event.event_type === 'run.progress')
      .map(normalizeProgress)
    return mergeToolProgress(normalized).map((activity) => {
      let message = activity.message
      let completeMessage: string | undefined
      switch (activity.kind) {
        case 'workflow_phase':
          if (activity.phase === 'sample_manager') {
            message = t('phase.sample_manager.active')
            completeMessage =
              activity.toolStatus === 'skipped'
                ? t('phase.sample_manager.reused')
                : t('phase.sample_manager.complete')
          } else if (activity.phase === 'workflow_planner') {
            message = t('phase.workflow_planner.active')
            completeMessage =
              activity.toolStatus === 'skipped'
                ? t('phase.workflow_planner.reused')
                : t('phase.workflow_planner.complete')
          } else if (activity.phase === 'workflow_builder') {
            message = t('phase.workflow_builder.active')
            completeMessage = t('phase.workflow_builder.complete')
          }
          break
        case 'sample_list_project_samples':
          message = t('sample.list_project_samples.active')
          completeMessage = t('sample.list_project_samples.complete')
          break
        case 'sample_set_base_dir':
          message = t('sample.set_base_dir.active')
          completeMessage = t('sample.set_base_dir.complete')
          break
        case 'sample_run_command':
          message = t('sample.run_command.active')
          completeMessage = t('sample.run_command.complete')
          break
        case 'sample_add_samples':
          message = t('sample.add_samples.active', {
            count: activity.count ?? 0,
          })
          completeMessage = t('sample.add_samples.complete', {
            count: activity.count ?? 0,
          })
          break
        case 'sample_add_sample_file':
          message = t('sample.add_sample_file.active', {
            sample: activity.sample ?? 'sample',
            tag: activity.tag ?? 'file',
          })
          completeMessage = t('sample.add_sample_file.complete', {
            sample: activity.sample ?? 'sample',
            tag: activity.tag ?? 'file',
          })
          break
        case 'sample_add_project_file':
          message = t('sample.add_project_file.active', {
            keyword: activity.keyword ?? 'file',
          })
          completeMessage = t('sample.add_project_file.complete', {
            keyword: activity.keyword ?? 'file',
          })
          break
        case 'sample_write_conclusion':
          message = t('sample.write_conclusion.active')
          completeMessage = t('sample.write_conclusion.complete')
          break
        case 'sample_ask_human':
          message = t('sample.ask_human.active')
          completeMessage = t('sample.ask_human.complete')
          break
      }
      return { ...activity, message, completeMessage }
    })
  }, [events, t])
  const current = activities.at(-1)
  const infoActivities = activities.filter(
    (activity) => activity.kind !== 'todo',
  )
  const currentInfo = infoActivities.at(-1)
  const todo = [...activities]
    .reverse()
    .find((activity) => activity.kind === 'todo')
  const visibleTodoItems =
    todo?.items ??
    (todo?.current
      ? [{ content: todo.current, status: 'in_progress' as const }]
      : [])
  const isActive = STREAMING_AGENT_STATUSES.includes(run.status)

  if (!current) return null

  return (
    <div className='space-y-3'>
      {currentInfo && (
        <ChainOfThought defaultOpen={isActive}>
          <ChainOfThoughtHeader aria-live='polite'>
            {isActive
              ? t('running')
              : t('history_count', { count: infoActivities.length })}
          </ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {infoActivities.map((activity, index) => {
              const active = activity.toolStatus
                ? isActive && activity.toolStatus === 'running'
                : isActive && index === infoActivities.length - 1
              const label =
                (active ? activity.message : activity.completeMessage) ||
                activity.message ||
                t('fallback_activity')
              const detail = detailPreview(
                activity.kind === 'sample_set_base_dir'
                  ? activity.path
                  : undefined,
              )
              return (
                <ChainOfThoughtStep
                  key={`${activity.id}-${active ? 'active' : 'complete'}`}
                  icon={activityIcon(activity)}
                  label={
                    activity.kind === 'sample_run_command' ? (
                      <CommandActivity
                        label={label}
                        command={activity.command}
                        active={active}
                      />
                    ) : (
                      label
                    )
                  }
                  description={
                    detail ? (
                      <code
                        className='block font-mono text-[11px] text-foreground/70'
                        title={
                          activity.kind === 'sample_run_command'
                            ? activity.command
                            : activity.path
                        }
                      >
                        {detail}
                      </code>
                    ) : undefined
                  }
                  status={active ? 'active' : 'complete'}
                />
              )
            })}
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}

      {todo && todo.total !== undefined && (
        <Queue>
          <QueueSection defaultOpen={isActive}>
            <QueueSectionTrigger>
              <QueueSectionLabel
                icon={<ListTodoIcon className='size-4' />}
                label={
                  todo.current
                    ? t('todo_title', {
                        completed: todo.completed ?? 0,
                        total: todo.total,
                        current: todo.current,
                      })
                    : t('todo_complete')
                }
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {visibleTodoItems.map((item) => {
                  const status = queueStatus(item.status)
                  return (
                    <QueueItem key={`${item.index ?? 'todo'}-${item.content}`}>
                      <div className='flex items-start gap-2'>
                        <QueueItemIndicator status={status} />
                        <QueueItemContent status={status}>
                          {item.content}
                        </QueueItemContent>
                        {item.index !== undefined && (
                          <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                            {item.index + 1}/{todo.total}
                          </span>
                        )}
                      </div>
                    </QueueItem>
                  )
                })}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        </Queue>
      )}
    </div>
  )
}

function ToolArtifactCard({ artifact }: { artifact: AgentToolArtifact }) {
  const t = useTranslations('Chat.artifact')
  const { data: tool } = useTool(artifact.uid)
  const name = tool?.name || artifact.name || t('tool_fallback')
  const description = tool?.description || artifact.description

  return (
    <Link
      href={`/tool/${artifact.uid}`}
      title={artifact.uid}
      className='group relative block overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <span className='absolute inset-y-0 left-0 w-1 bg-emerald-500' />
      <div className='flex items-start gap-3 pl-1'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-sm'>
          <WrenchIcon className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='flex items-center gap-1.5 font-semibold text-[11px] text-foreground uppercase tracking-wide'>
            <CheckCircle2Icon className='size-3.5 text-emerald-600 dark:text-emerald-400' />
            <span>{t('tool_created')}</span>
          </p>
          <p className='mt-1 truncate font-semibold text-sm'>{name}</p>
          {description && (
            <p className='mt-1.5 line-clamp-2 text-foreground/70 text-xs leading-relaxed'>
              {description}
            </p>
          )}
        </div>
      </div>
      <div className='mt-3 flex items-center justify-between border-t pl-1 pt-2.5'>
        <span className='font-medium text-foreground text-xs'>
          {t('open_tool')}
        </span>
        <ArrowUpRightIcon className='size-4 text-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5' />
      </div>
    </Link>
  )
}

export function AgentRunArtifacts({ run }: { run: AgentRun }) {
  const payload = run.result_payload
  if (!payload || run.status !== 'completed') return null

  const artifacts = Array.isArray(payload.artifacts)
    ? payload.artifacts.filter(
        (artifact): artifact is AgentToolArtifact =>
          artifact?.type === 'tool' && typeof artifact.uid === 'string',
      )
    : typeof payload.tool_uid === 'string'
      ? [
          {
            type: 'tool' as const,
            uid: payload.tool_uid,
            name: payload.name,
          },
        ]
      : []

  if (artifacts.length === 0) return null
  return (
    <div className='space-y-2'>
      {artifacts.map((artifact) => (
        <ToolArtifactCard key={artifact.uid} artifact={artifact} />
      ))}
    </div>
  )
}
