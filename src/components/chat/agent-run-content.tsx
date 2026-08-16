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
  WaypointsIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useWorkflow } from '@/hooks/use-workflow'
import type { AgentEvent, AgentRun, AgentToolArtifact } from '@/types/agent'
import { STREAMING_AGENT_STATUSES } from '@/types/agent'

interface ProgressActivity {
  id: number
  kind: string
  message: string
  completed?: number
  total?: number
  current?: string
  currentIndex?: number
  items?: TodoActivityItem[]
  count?: number
  sample?: string
  tag?: string
  keyword?: string
  path?: string
  command?: string
  phase?: string
  manager?: string
  operation?: string
  subject?: string
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
    currentIndex: numberValue(source.current_index),
    items: todoItems(source.items),
    count: numberValue(source.count),
    sample: stringValue(source.sample),
    tag: stringValue(source.tag),
    keyword: stringValue(source.keyword),
    path: stringValue(source.path),
    command: stringValue(source.command),
    phase: stringValue(source.phase),
    manager: stringValue(source.manager),
    operation: stringValue(source.operation),
    subject: stringValue(source.subject),
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
  if (activity.kind === 'workflow_manager_action') {
    if (activity.manager === 'resource_node') return DatabaseIcon
    if (activity.manager === 'workflow') return WaypointsIcon
    if (activity.manager === 'tool_node') return WrenchIcon
    return SparklesIcon
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

function ActivityStep({
  activity,
  active,
  fallbackLabel,
}: {
  activity: ProgressActivity
  active: boolean
  fallbackLabel: string
}) {
  const label =
    (active ? activity.message : activity.completeMessage) ||
    activity.message ||
    fallbackLabel
  const detail = detailPreview(
    activity.kind === 'sample_set_base_dir' ? activity.path : undefined,
  )

  return (
    <ChainOfThoughtStep
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
}

function TodoActivityGroup({
  activities,
  active,
  fallbackLabel,
  label,
}: {
  activities: ProgressActivity[]
  active: boolean
  fallbackLabel: string
  label: string
}) {
  const [expanded, setExpanded] = useState(false)
  const activityListRef = useRef<HTMLDivElement>(null)
  const open = active || expanded
  const latestActivityId = activities.at(-1)?.id

  useEffect(() => {
    if (!active || latestActivityId === undefined || !activityListRef.current)
      return
    activityListRef.current.scrollTop = activityListRef.current.scrollHeight
  }, [active, latestActivityId])

  return (
    <Collapsible
      open={open}
      onOpenChange={(nextOpen) => {
        if (!active) setExpanded(nextOpen)
      }}
      className='ml-6'
    >
      <CollapsibleTrigger className='group/todo-activity flex w-[calc(100%-1.5rem)] items-center gap-2 text-left text-sm transition-colors hover:text-foreground'>
        <ListTodoIcon className='size-4 shrink-0' />
        <span className='min-w-0 flex-1 truncate' title={label}>
          {label}
        </span>
        <span className='shrink-0 text-xs tabular-nums'>
          {activities.length}
        </span>
        <ChevronDownIcon className='size-3.5 shrink-0 transition-transform group-data-[state=open]/todo-activity:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          ref={activityListRef}
          className='mt-2 ml-2 max-h-40 space-y-3 overflow-y-auto border-l pl-4 pr-2'
        >
          {activities.map((activity, index) => {
            const isActivityActive = activity.toolStatus
              ? active && activity.toolStatus === 'running'
              : active && index === activities.length - 1
            return (
              <ActivityStep
                key={`${activity.id}-${isActivityActive ? 'active' : 'complete'}`}
                activity={activity}
                active={isActivityActive}
                fallbackLabel={fallbackLabel}
              />
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function groupActivitiesByTodo(activities: ProgressActivity[]) {
  const standaloneActivities: ProgressActivity[] = []
  const activitiesByTodo = new Map<number, ProgressActivity[]>()
  let currentTodoIndex: number | undefined

  for (const activity of activities) {
    if (activity.kind === 'todo') {
      currentTodoIndex = activity.currentIndex
      continue
    }
    if (currentTodoIndex !== undefined && activity.kind !== 'workflow_phase') {
      const group = activitiesByTodo.get(currentTodoIndex) ?? []
      group.push(activity)
      activitiesByTodo.set(currentTodoIndex, group)
    } else {
      standaloneActivities.push(activity)
    }
  }
  return { standaloneActivities, activitiesByTodo }
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
    const normalized: ProgressActivity[] = []
    for (const event of events) {
      if (event.event_type === 'run.progress') {
        normalized.push(normalizeProgress(event))
      }
    }
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
        case 'workflow_manager_action': {
          const manager =
            activity.manager === 'tool_node'
              ? t('builder.manager.tool_node')
              : activity.manager === 'resource_node'
                ? t('builder.manager.resource_node')
                : activity.manager === 'utility_node'
                  ? t('builder.manager.utility_node')
                  : t('builder.manager.workflow')
          const operation = activity.operation ?? 'update'
          const subject = activity.subject ?? manager
          const values = { manager, subject }
          switch (operation) {
            case 'search':
              message = t('builder.operation.search.active', values)
              completeMessage = t('builder.operation.search.complete', values)
              break
            case 'inspect':
              message = t('builder.operation.inspect.active', values)
              completeMessage = t('builder.operation.inspect.complete', values)
              break
            case 'list':
              message = t('builder.operation.list.active', values)
              completeMessage = t('builder.operation.list.complete', values)
              break
            case 'add':
              message = t('builder.operation.add.active', values)
              completeMessage = t('builder.operation.add.complete', values)
              break
            case 'create':
              message = t('builder.operation.create.active', values)
              completeMessage = t('builder.operation.create.complete', values)
              break
            case 'delete':
              message = t('builder.operation.delete.active', values)
              completeMessage = t('builder.operation.delete.complete', values)
              break
            case 'switch':
              message = t('builder.operation.switch.active', values)
              completeMessage = t('builder.operation.switch.complete', values)
              break
            case 'save':
              message = t('builder.operation.save.active', values)
              completeMessage = t('builder.operation.save.complete', values)
              break
            case 'fix':
              message = t('builder.operation.fix.active', values)
              completeMessage = t('builder.operation.fix.complete', values)
              break
            default:
              message = t('builder.operation.update.active', values)
              completeMessage = t('builder.operation.update.complete', values)
          }
          break
        }
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
  const { standaloneActivities, activitiesByTodo } = useMemo(
    () => groupActivitiesByTodo(activities),
    [activities],
  )
  const currentInfo = standaloneActivities.at(-1)
  const todo = [...activities]
    .reverse()
    .find((activity) => activity.kind === 'todo')
  const visibleTodoItems =
    todo?.items ??
    (todo?.current
      ? [{ content: todo.current, status: 'in_progress' as const }]
      : [])
  const isActive = STREAMING_AGENT_STATUSES.includes(run.status)
  const groupedTodoItems = visibleTodoItems.flatMap((item) => {
    if (item.index === undefined) return []
    const groupedActivities = activitiesByTodo.get(item.index) ?? []
    return groupedActivities.length > 0
      ? [{ item, activities: groupedActivities }]
      : []
  })
  const builderPhaseActivities = standaloneActivities.filter(
    (activity) =>
      activity.kind === 'workflow_phase' &&
      activity.phase === 'workflow_builder',
  )
  const leadingActivities = isActive
    ? standaloneActivities
    : standaloneActivities.filter(
        (activity) =>
          activity.kind !== 'workflow_phase' ||
          activity.phase !== 'workflow_builder',
      )
  const trailingActivities = isActive ? [] : builderPhaseActivities
  const historyItemCount = standaloneActivities.length + groupedTodoItems.length

  if (!current) return null

  return (
    <div className='space-y-3'>
      {(currentInfo || groupedTodoItems.length > 0) && (
        <ChainOfThought defaultOpen={isActive}>
          <ChainOfThoughtHeader aria-live='polite'>
            {isActive
              ? t('running')
              : t('history_count', { count: historyItemCount })}
          </ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {leadingActivities.map((activity, index) => {
              const active = activity.toolStatus
                ? isActive && activity.toolStatus === 'running'
                : isActive && index === leadingActivities.length - 1
              return (
                <ActivityStep
                  key={`${activity.id}-${active ? 'active' : 'complete'}`}
                  activity={activity}
                  active={active}
                  fallbackLabel={t('fallback_activity')}
                />
              )
            })}
            {groupedTodoItems.map(({ item, activities: todoActivities }) => {
              const todoActive = item.status === 'in_progress' && isActive
              const position = (item.index ?? 0) + 1
              return (
                <TodoActivityGroup
                  key={`${item.index ?? 'todo'}-${item.content}`}
                  activities={todoActivities}
                  active={todoActive}
                  fallbackLabel={t('fallback_activity')}
                  label={t(
                    todoActive
                      ? 'todo_activity_active'
                      : 'todo_activity_complete',
                    {
                      index: position,
                      total: todo?.total ?? visibleTodoItems.length,
                      task: item.content,
                    },
                  )}
                />
              )
            })}
            {trailingActivities.map((activity, index) => (
              <ActivityStep
                key={`${activity.id}-complete-${index}`}
                activity={activity}
                active={false}
                fallbackLabel={t('fallback_activity')}
              />
            ))}
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

function WorkflowArtifactCard({
  uid,
  projectId,
}: {
  uid: string
  projectId: number | null
}) {
  const t = useTranslations('Chat.artifact')
  const { data: workflow } = useWorkflow(uid)
  const href = projectId
    ? `/editor?workflowUid=${uid}&projectId=${projectId}`
    : `/editor?workflowUid=${uid}`

  return (
    <Link
      href={href}
      title={uid}
      className='group relative block overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <span className='absolute inset-y-0 left-0 w-1 bg-sky-500' />
      <div className='flex items-start gap-3 pl-1'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm dark:bg-sky-500'>
          <WaypointsIcon className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='flex items-center gap-1.5 font-semibold text-[11px] text-foreground uppercase tracking-wide'>
            <CheckCircle2Icon className='size-3.5 text-sky-600 dark:text-sky-400' />
            <span>{t('workflow_created')}</span>
          </p>
          <p className='mt-1 truncate font-semibold text-sm'>
            {workflow?.name || t('workflow_fallback')}
          </p>
          {workflow?.description && (
            <p className='mt-1.5 line-clamp-2 text-foreground/70 text-xs leading-relaxed'>
              {workflow.description}
            </p>
          )}
        </div>
      </div>
      <div className='mt-3 flex items-center justify-between border-t pl-1 pt-2.5'>
        <span className='font-medium text-foreground text-xs'>
          {t('edit_workflow')}
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

  const workflowUids = Array.isArray(payload.workflow_uids)
    ? payload.workflow_uids.filter(
        (workflowUid): workflowUid is string => typeof workflowUid === 'string',
      )
    : []

  if (artifacts.length === 0 && workflowUids.length === 0) return null
  return (
    <div className='space-y-2'>
      {artifacts.map((artifact) => (
        <ToolArtifactCard key={artifact.uid} artifact={artifact} />
      ))}
      {workflowUids.map((uid) => (
        <WorkflowArtifactCard key={uid} uid={uid} projectId={run.project_id} />
      ))}
    </div>
  )
}
