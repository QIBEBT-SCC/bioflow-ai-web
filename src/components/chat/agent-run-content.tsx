'use client'

import {
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  DatabaseIcon,
  FilePenLineIcon,
  FolderOpenIcon,
  HammerIcon,
  ListIcon,
  ListTodoIcon,
  type LucideIcon,
  MessageCircleQuestionIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  ShieldCheckIcon,
  TerminalIcon,
  Trash2Icon,
  WaypointsIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { AgentArtifactCard } from '@/components/agent-artifact/agent-artifact-card'
import {
  QueueItem,
  QueueItemContent,
  QueueItemIndicator,
  type QueueItemStatus,
  QueueList,
} from '@/components/ai-elements/queue'
import { Shimmer } from '@/components/ai-elements/shimmer'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { useAgentRunArtifacts } from '@/hooks/use-agent-artifact'
import { useTool } from '@/hooks/use-tool'
import { useWorkflow } from '@/hooks/use-workflow'
import { parseAgentQuestionAnswers } from '@/lib/agent-questions'
import { cn } from '@/lib/utils'
import type {
  AgentEvent,
  AgentQuestionAnswer,
  AgentRun,
  AgentToolArtifact,
} from '@/types/agent'
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
  questionAnswers?: AgentQuestionAnswer[]
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
  if (!preview) return <TraceLabel label={label} active={active} />

  return (
    <Collapsible defaultOpen={active}>
      <CollapsibleTrigger className='group/command flex max-w-full items-center gap-1 text-left transition-colors hover:text-foreground'>
        <TraceLabel label={label} active={active} />
        <ChevronDownIcon className='size-3.5 shrink-0 -rotate-90 transition-transform group-data-[state=open]/command:rotate-0' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <code
          className='mt-1 block break-all rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-foreground/80'
          title={command}
        >
          {preview}
        </code>
      </CollapsibleContent>
    </Collapsible>
  )
}

const OPERATION_ICONS: Record<string, LucideIcon> = {
  search: SearchIcon,
  inspect: BookOpenIcon,
  list: ListIcon,
  add: PlusIcon,
  create: PlusIcon,
  delete: Trash2Icon,
  switch: ArrowLeftRightIcon,
  save: SaveIcon,
  fix: HammerIcon,
  update: PencilLineIcon,
}

function activityIcon(activity: ProgressActivity): LucideIcon {
  const text = activity.message.toLowerCase()
  if (activity.kind === 'workflow_phase') {
    if (activity.phase === 'sample_manager') return DatabaseIcon
    if (activity.phase === 'workflow_planner') return ListTodoIcon
    return WaypointsIcon
  }
  if (activity.kind === 'workflow_manager_action') {
    return OPERATION_ICONS[activity.operation ?? 'update'] ?? PencilLineIcon
  }
  if (activity.kind === 'sample_run_command') return TerminalIcon
  if (activity.kind === 'sample_set_base_dir') return FolderOpenIcon
  if (activity.kind === 'sample_list_project_samples') return ListIcon
  if (activity.kind.startsWith('sample_add_')) return DatabaseIcon
  if (activity.kind === 'sample_write_conclusion') return FilePenLineIcon
  if (activity.kind === 'sample_ask_human') return MessageCircleQuestionIcon
  if (activity.kind === 'validation') return ShieldCheckIcon
  if (/search|find|grep|look/.test(text)) return SearchIcon
  if (/read|inspect|view|load|open|check/.test(text)) return BookOpenIcon
  if (/list/.test(text)) return ListIcon
  if (/writ|save|report/.test(text)) return FilePenLineIcon
  if (/run|exec|command/.test(text)) return TerminalIcon
  if (/database|sample/.test(text)) return DatabaseIcon
  if (/create|generat|prepar|config|build/.test(text)) return WrenchIcon
  return CircleDotIcon
}

/** One flat trace line: muted icon + single-line label, Codex style. */
function TraceRow({
  icon: Icon,
  active,
  children,
  detail,
}: {
  icon: LucideIcon
  active: boolean
  children: ReactNode
  detail?: ReactNode
}) {
  return (
    <li
      className={cn(
        'flex min-w-0 items-start gap-2.5 py-1 text-sm',
        active ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0 opacity-70' />
      <div className='min-w-0 flex-1'>
        {children}
        {detail}
      </div>
    </li>
  )
}

function TraceLabel({ label, active }: { label: string; active: boolean }) {
  return active ? (
    <Shimmer as='span' className='block max-w-full truncate'>
      {label}
    </Shimmer>
  ) : (
    <span className='block truncate' title={label}>
      {label}
    </span>
  )
}

/** Keeps a scrolling trace pinned to its newest row while the run streams. */
function useFollowLatest(active: boolean, latestId: number | undefined) {
  const ref = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (!active || latestId === undefined || !ref.current) return
    ref.current.scrollTop = ref.current.scrollHeight
  }, [active, latestId])
  return ref
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
  const path =
    activity.kind === 'sample_set_base_dir'
      ? detailPreview(activity.path)
      : undefined

  return (
    <TraceRow
      icon={activityIcon(activity)}
      active={active}
      detail={
        path ? (
          <code
            className='mt-0.5 block truncate font-mono text-[11px] text-muted-foreground'
            title={activity.path}
          >
            {path}
          </code>
        ) : undefined
      }
    >
      {activity.kind === 'sample_ask_human' &&
      activity.questionAnswers?.length ? (
        <QuestionAnswerActivity
          answers={activity.questionAnswers}
          label={label}
        />
      ) : activity.kind === 'sample_run_command' ? (
        <CommandActivity
          label={label}
          command={activity.command}
          active={active}
        />
      ) : (
        <TraceLabel label={label} active={active} />
      )}
    </TraceRow>
  )
}

function QuestionAnswerActivity({
  answers,
  label,
}: {
  answers: AgentQuestionAnswer[]
  label: string
}) {
  const t = useTranslations('Chat.progress')

  return (
    <Collapsible>
      <CollapsibleTrigger className='group/question-answer flex max-w-full items-center gap-1 text-left transition-colors hover:text-foreground'>
        <span className='truncate'>{label}</span>
        <ChevronDownIcon className='size-3.5 shrink-0 -rotate-90 transition-transform group-data-[state=open]/question-answer:rotate-0' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='mt-1.5 space-y-3 rounded-lg bg-muted/50 p-3'>
          {answers.map((answer, index) => (
            <div key={`${index}-${answer.question}`}>
              <p className='whitespace-pre-wrap font-medium text-foreground text-xs leading-relaxed'>
                {answer.question}
              </p>
              <p className='mt-1 whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed'>
                <span className='mr-1 font-medium text-foreground/70'>
                  {t('answer')}:
                </span>
                {answer.answer}
              </p>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
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
  const open = active || expanded
  const listRef = useFollowLatest(active, activities.at(-1)?.id)

  return (
    <TraceRow icon={ListTodoIcon} active={active}>
      <Collapsible
        open={open}
        onOpenChange={(nextOpen) => {
          if (!active) setExpanded(nextOpen)
        }}
      >
        <CollapsibleTrigger className='group/todo-activity flex max-w-full items-center gap-1 text-left transition-colors hover:text-foreground'>
          <TraceLabel label={label} active={active} />
          <span className='shrink-0 text-xs tabular-nums opacity-70'>
            {activities.length}
          </span>
          <ChevronDownIcon className='size-3.5 shrink-0 -rotate-90 transition-transform group-data-[state=open]/todo-activity:rotate-0' />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul
            ref={listRef}
            className='mt-1 max-h-40 overflow-y-auto border-l pl-3'
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
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </TraceRow>
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

function useProgressActivities(events: AgentEvent[]) {
  const t = useTranslations('Chat.progress')
  return useMemo(() => {
    const normalized: ProgressActivity[] = []
    for (const event of events) {
      if (event.event_type === 'run.progress') {
        normalized.push(normalizeProgress(event))
      }
    }
    const mergedActivities = mergeToolProgress(normalized)
    const translatedActivities = mergedActivities.map((activity) => {
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
                  : activity.manager === 'subgraph'
                    ? t('builder.manager.subgraph')
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

    return translatedActivities.map((activity) => {
      if (activity.kind !== 'sample_ask_human') return activity

      const resumeEvent = events.find(
        (event) =>
          event.id > activity.id &&
          event.event_type === 'run.queued' &&
          event.payload.resume === true,
      )
      const feedback = resumeEvent?.payload.feedback
      const questionAnswers =
        typeof feedback === 'string'
          ? parseAgentQuestionAnswers(feedback)
          : undefined
      return questionAnswers ? { ...activity, questionAnswers } : activity
    })
  }, [events, t])
}

function TodoPlan({
  todo,
  total,
  items,
  active,
}: {
  todo: ProgressActivity
  total: number
  items: TodoActivityItem[]
  active: boolean
}) {
  const t = useTranslations('Chat.progress')
  const completed = Math.min(todo.completed ?? 0, total)

  return (
    <Collapsible
      defaultOpen={active}
      className='rounded-lg border bg-muted/30 px-3 py-2'
    >
      <CollapsibleTrigger className='group/plan flex w-full items-center gap-2 text-left text-muted-foreground text-sm transition-colors hover:text-foreground'>
        <ListTodoIcon className='size-4 shrink-0' />
        <span className='min-w-0 flex-1 truncate'>
          {todo.current || t('todo_complete')}
        </span>
        <span className='shrink-0 text-xs tabular-nums'>
          {completed}/{total}
        </span>
        <ChevronDownIcon className='size-4 shrink-0 transition-transform group-data-[state=open]/plan:rotate-180' />
      </CollapsibleTrigger>
      <Progress
        value={total > 0 ? (completed / total) * 100 : 0}
        aria-label={t('todo_title', {
          completed,
          total,
          current: todo.current ?? '',
        })}
        className='mt-2 h-1 bg-muted'
      />
      <CollapsibleContent>
        <QueueList className='mt-2 mb-0'>
          {items.map((item) => {
            const status = queueStatus(item.status)
            return (
              <QueueItem
                key={`${item.index ?? 'todo'}-${item.content}`}
                className='px-1 hover:bg-transparent'
              >
                <div className='flex items-start gap-2'>
                  <QueueItemIndicator status={status} className='mt-1' />
                  <QueueItemContent status={status}>
                    {item.content}
                  </QueueItemContent>
                </div>
              </QueueItem>
            )
          })}
        </QueueList>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AgentRunProgress({
  events,
  run,
}: {
  events: AgentEvent[]
  run: AgentRun
}) {
  const t = useTranslations('Chat.progress')
  const activities = useProgressActivities(events)
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

  const traceRef = useFollowLatest(isActive, current?.id)

  if (!current) {
    return isActive ? (
      <Shimmer as='span' className='text-sm'>
        {t('fallback_activity')}
      </Shimmer>
    ) : null
  }

  const currentLabel = current.message || t('fallback_activity')

  return (
    <>
      {(currentInfo || groupedTodoItems.length > 0) && (
        <Collapsible defaultOpen={isActive} className='group/trace'>
          <CollapsibleTrigger
            aria-live='polite'
            className='flex max-w-full items-center gap-1 text-left text-muted-foreground text-sm transition-colors hover:text-foreground'
          >
            {isActive ? (
              <Shimmer as='span' className='block max-w-full truncate'>
                {currentLabel}
              </Shimmer>
            ) : (
              <span className='truncate'>
                {t('history_count', { count: historyItemCount })}
              </span>
            )}
            <ChevronDownIcon className='size-3.5 shrink-0 -rotate-90 transition-transform group-data-[state=open]/trace:rotate-0' />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul ref={traceRef} className='mt-1 max-h-64 overflow-y-auto pr-1'>
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
                        index: (item.index ?? 0) + 1,
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
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      {todo && todo.total !== undefined && (
        <TodoPlan
          todo={todo}
          total={todo.total}
          items={visibleTodoItems}
          active={isActive}
        />
      )}
    </>
  )
}

function ArtifactLinkCard({
  href,
  title,
  icon: Icon,
  eyebrow,
  name,
  description,
  action,
}: {
  href: string
  title: string
  icon: LucideIcon
  eyebrow: string
  name: string
  description?: string | null
  action: string
}) {
  return (
    <Link
      href={href}
      title={title}
      className='group block rounded-xl border bg-card p-3 shadow-xs transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <div className='flex items-start gap-3'>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Icon className='size-4' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='flex items-center gap-1 text-success text-xs'>
            <CheckCircle2Icon className='size-3.5' />
            <span className='truncate'>{eyebrow}</span>
          </p>
          <p className='mt-0.5 truncate font-medium text-sm group-hover:text-primary'>
            {name}
          </p>
          {description && (
            <p className='mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed'>
              {description}
            </p>
          )}
        </div>
        <ArrowUpRightIcon
          aria-hidden='true'
          className='size-4 shrink-0 text-muted-foreground group-hover:text-primary'
        />
      </div>
      <span className='sr-only'>{action}</span>
    </Link>
  )
}

function ToolArtifactCard({ artifact }: { artifact: AgentToolArtifact }) {
  const t = useTranslations('Chat.artifact')
  const { data: tool } = useTool(artifact.uid)

  return (
    <ArtifactLinkCard
      href={`/tool/${artifact.uid}`}
      title={artifact.uid}
      icon={WrenchIcon}
      eyebrow={t('tool_created')}
      name={tool?.name || artifact.name || t('tool_fallback')}
      description={tool?.description || artifact.description}
      action={t('open_tool')}
    />
  )
}

function WorkflowArtifactCard({
  uid,
  projectId,
  subgraph = false,
}: {
  uid: string
  projectId: number | null
  subgraph?: boolean
}) {
  const t = useTranslations('Chat.artifact')
  const { data: workflow } = useWorkflow(uid)

  return (
    <ArtifactLinkCard
      href={
        projectId && !subgraph
          ? `/editor?workflowUid=${uid}&projectId=${projectId}`
          : `/editor?workflowUid=${uid}`
      }
      title={uid}
      icon={WaypointsIcon}
      eyebrow={t(subgraph ? 'subgraph_created' : 'workflow_created')}
      name={workflow?.name || t('workflow_fallback')}
      description={workflow?.description}
      action={t('edit_workflow')}
    />
  )
}

export function AgentRunArtifacts({ run }: { run: AgentRun }) {
  const { data: fileArtifacts = [] } = useAgentRunArtifacts(
    run.uid,
    run.status === 'completed' && run.project_id !== null,
  )
  const payload = run.result_payload ?? {}
  if (run.status !== 'completed') return null

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
  const subgraphUids = Array.isArray(payload.subgraph_uids)
    ? payload.subgraph_uids.filter(
        (subgraphUid): subgraphUid is string => typeof subgraphUid === 'string',
      )
    : []

  if (
    artifacts.length === 0 &&
    workflowUids.length === 0 &&
    subgraphUids.length === 0 &&
    fileArtifacts.length === 0
  )
    return null
  return (
    <div className='space-y-2'>
      {artifacts.map((artifact) => (
        <ToolArtifactCard key={artifact.uid} artifact={artifact} />
      ))}
      {workflowUids.map((uid) => (
        <WorkflowArtifactCard key={uid} uid={uid} projectId={run.project_id} />
      ))}
      {subgraphUids.map((uid) => (
        <WorkflowArtifactCard key={uid} uid={uid} projectId={null} subgraph />
      ))}
      {fileArtifacts.map((file) => (
        <AgentArtifactCard key={file.id} file={file} compact />
      ))}
    </div>
  )
}
