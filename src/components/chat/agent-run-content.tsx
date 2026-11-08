'use client'

import {
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  BrainIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  CirclePauseIcon,
  CircleSlashIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  FilePenLineIcon,
  FileTextIcon,
  FolderOpenIcon,
  GlobeIcon,
  HammerIcon,
  HourglassIcon,
  ImageIcon,
  ListChecksIcon,
  ListIcon,
  ListTodoIcon,
  LoaderCircleIcon,
  type LucideIcon,
  MessageCircleQuestionIcon,
  PencilLineIcon,
  PlusIcon,
  SaveIcon,
  ScrollTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  Trash2Icon,
  WaypointsIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { AgentArtifactCard } from '@/components/agent-artifact/agent-artifact-card'
import { Badge } from '@/components/ui/badge'
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockLine,
} from '@/components/ui/code-block'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/ui/trace'
import { useAgentRunArtifacts } from '@/hooks/use-agent-artifact'
import { useHighlightedCode } from '@/hooks/use-highlighted-code'
import { useTool } from '@/hooks/use-tool'
import { useWorkflow } from '@/hooks/use-workflow'
import { parseAgentQuestionAnswers } from '@/lib/agent-questions'
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
  /** Search keywords of a builder manager search. */
  keywords?: string[]
  /** Number of matches a finished search returned. */
  resultCount?: number
  /** Description of the tool memory an agent read. */
  memoryDescription?: string
  tool?: string
  step?: string
  action?: string
  completeMessage?: string
  toolCallId?: string
  toolStatus?: 'running' | 'completed' | 'skipped' | 'error'
  questionAnswers?: AgentQuestionAnswer[]
  /** Sub-agent nesting depth; 0 is the main agent. */
  depth: number
  /** Step whose task runs the sub-agent that emitted this activity. */
  parentId?: string
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
  return value === 'running' ||
    value === 'completed' ||
    value === 'skipped' ||
    value === 'error'
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
  const scope =
    typeof payload.scope === 'object' && payload.scope !== null
      ? (payload.scope as Record<string, unknown>)
      : undefined
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
    keywords: Array.isArray(source.keywords)
      ? source.keywords.filter(
          (keyword): keyword is string => typeof keyword === 'string',
        )
      : undefined,
    resultCount: numberValue(source.result_count),
    memoryDescription: stringValue(source.memory_description),
    tool: stringValue(source.tool),
    step: stringValue(source.step),
    action: stringValue(source.action),
    toolCallId: stringValue(source.tool_call_id),
    toolStatus: toolStatus(source.status),
    depth: numberValue(scope?.depth) ?? 0,
    parentId: stringValue(scope?.parent_id),
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

const AGENT_TOOL_ICONS: Record<string, LucideIcon> = {
  ask_human: MessageCircleQuestionIcon,
  summarize_work: ScrollTextIcon,
  load_skill: SparklesIcon,
  read_skill_resource: SparklesIcon,
  workflow_reader: BookOpenIcon,
  run_command: TerminalIcon,
  apply_patch: FilePenLineIcon,
  view_image: ImageIcon,
  write_diagnosis: FilePenLineIcon,
  read_node_memory: BrainIcon,
  write_node_memory: BrainIcon,
  fix_subgraph: HammerIcon,
  finalize_workflow_fix: ClipboardCheckIcon,
  wait_tool_generation: HourglassIcon,
  return_to_parent: ArrowUpRightIcon,
  container_command: TerminalIcon,
  search_local_image: SearchIcon,
  search_biodb: DatabaseIcon,
  search_tools_by_function: SearchIcon,
  read_tool_doc: BookOpenIcon,
  select_image: ImageIcon,
  select_tool: CircleCheckIcon,
  select_classification: ListIcon,
  set_file_mounts: FolderOpenIcon,
  set_command_detail: TerminalIcon,
  set_tool_info: PencilLineIcon,
  write_tool_report: FilePenLineIcon,
}

/** Tool-creation sub-agent tools whose labels take an optional subject. */
const TOOL_CREATION_TOOLS = new Set([
  'wait_tool_generation',
  'return_to_parent',
  'container_command',
  'search_local_image',
  'search_biodb',
  'search_tools_by_function',
  'read_tool_doc',
  'select_image',
  'select_tool',
  'select_classification',
  'set_file_mounts',
  'set_command_detail',
  'set_tool_info',
  'write_tool_report',
])

const TOOL_GENERATOR_ICONS: Record<string, LucideIcon> = {
  select_image: SearchIcon,
  search_exist_tool: SearchIcon,
  get_report: TerminalIcon,
  choose_group: ListIcon,
  generate_tool_config: WrenchIcon,
  process_help_doc: FileTextIcon,
  save_tool: SaveIcon,
}

function activityIcon(activity: ProgressActivity): LucideIcon {
  const text = activity.message.toLowerCase()
  if (activity.kind === 'workflow_phase') {
    if (activity.phase === 'project_planner') return ListTodoIcon
    return WaypointsIcon
  }
  if (activity.kind === 'workflow_manager_action') {
    if (activity.action === 'read_node_memory') return BrainIcon
    return OPERATION_ICONS[activity.operation ?? 'update'] ?? PencilLineIcon
  }
  if (activity.kind === 'planner_run_command') return TerminalIcon
  if (activity.kind === 'planner_set_base_dir') return FolderOpenIcon
  if (activity.kind === 'planner_list_project_samples') return ListIcon
  if (activity.kind.startsWith('planner_add_')) return DatabaseIcon
  if (activity.kind === 'planner_ask_human') return MessageCircleQuestionIcon
  if (activity.kind === 'planner_write_file') return FilePenLineIcon
  if (activity.kind === 'planner_web_run') return GlobeIcon
  if (activity.kind === 'planner_view_pdf') return FileTextIcon
  if (activity.kind === 'planner_confirm_plan') return ClipboardCheckIcon
  if (activity.kind === 'validation') return ShieldCheckIcon
  if (activity.kind === 'agent_tool') {
    const icon = activity.tool ? AGENT_TOOL_ICONS[activity.tool] : undefined
    if (icon) return icon
  }
  if (activity.kind === 'tool_generator_step') {
    const icon = activity.step ? TOOL_GENERATOR_ICONS[activity.step] : undefined
    if (icon) return icon
  }
  if (/search|find|grep|look/.test(text)) return SearchIcon
  if (/read|inspect|view|load|open|check/.test(text)) return BookOpenIcon
  if (/list/.test(text)) return ListIcon
  if (/writ|save|report/.test(text)) return FilePenLineIcon
  if (/run|exec|command/.test(text)) return TerminalIcon
  if (/database|sample/.test(text)) return DatabaseIcon
  if (/create|generat|prepar|config|build/.test(text)) return WrenchIcon
  return CircleDotIcon
}

export type StepStatus =
  | 'running'
  | 'waiting'
  | 'error'
  | 'cancelled'
  | undefined

/** Summary icon of a Chain of Thought: spinner, pause, failure, cancel or done. */
function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'running') return <LoaderCircleIcon className='animate-spin' />
  if (status === 'waiting') return <CirclePauseIcon />
  if (status === 'cancelled') return <CircleSlashIcon />
  return status === 'error' ? <CircleAlertIcon /> : <CircleCheckIcon />
}

/** Trace line styling for a step status; waiting has no style of its own. */
function lineStatus(status: StepStatus) {
  if (status === 'running' || status === 'error') return status
  return status === 'cancelled' ? 'pending' : undefined
}

/** A step's status from its own tool status and the run's. */
function stepStatus(
  activity: ProgressActivity,
  isLast: boolean,
  runStatus: AgentRun['status'],
): StepStatus {
  if (activity.toolStatus === 'error') return 'error'
  const unfinished = activity.toolStatus
    ? activity.toolStatus === 'running'
    : isLast
  if (!unfinished) return undefined
  if (STREAMING_AGENT_STATUSES.includes(runStatus)) return 'running'
  if (runStatus === 'waiting_input') return 'waiting'
  if (!activity.toolStatus) return undefined
  if (runStatus === 'failed') return 'error'
  return runStatus === 'cancelled' ? 'cancelled' : undefined
}

/** A run's overall status as shown on its Chain of Thought. */
function runStepStatus(runStatus: AgentRun['status']): StepStatus {
  if (STREAMING_AGENT_STATUSES.includes(runStatus)) return 'running'
  if (runStatus === 'waiting_input') return 'waiting'
  if (runStatus === 'failed') return 'error'
  return runStatus === 'cancelled' ? 'cancelled' : undefined
}

/** One trace step; steps with detail expand into it. */
export function Step({
  icon: Icon,
  title,
  status,
  description,
  defaultOpen,
  children,
}: {
  icon: LucideIcon
  title: string
  status?: StepStatus
  description?: string
  defaultOpen?: boolean
  children?: ReactNode
}) {
  const t = useTranslations('Chat.progress')
  const line = (
    <TraceLine status={lineStatus(status)}>
      <TraceIcon>
        {status === 'error' ? <CircleAlertIcon /> : <Icon />}
      </TraceIcon>
      <TraceTitle title={title}>{title}</TraceTitle>
      {status === 'error' ? (
        <TraceDescription>{t('step_failed')}</TraceDescription>
      ) : (
        description && <TraceDescription>{description}</TraceDescription>
      )}
    </TraceLine>
  )

  if (!children) return line

  return (
    <TraceCollapsible defaultOpen={defaultOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>{children}</TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

export function CommandDetail({ command }: { command: string }) {
  const lines = useHighlightedCode(command, 'bash')

  return (
    <CodeBlock size='sm'>
      <CodeBlockContent wrap className='max-h-48'>
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional and never reorder
          <CodeBlockLine key={index}>{line}</CodeBlockLine> // react-doctor-disable-line react-doctor/no-array-index-as-key
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

function QuestionAnswerDetail({ answers }: { answers: AgentQuestionAnswer[] }) {
  const t = useTranslations('Chat.progress')

  return (
    <dl className='flex flex-col gap-3 text-xs'>
      {answers.map((answer, index) => (
        <div
          key={`${index}-${answer.question}`}
          className='flex flex-col gap-1'
        >
          <dt className='whitespace-pre-wrap font-medium text-foreground'>
            {answer.question}
          </dt>
          <dd className='whitespace-pre-wrap'>
            <span className='mr-1 font-medium text-foreground/70'>
              {t('answer')}:
            </span>
            {answer.answer}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Keeps a scrolling trace pinned to its newest step while the run streams. */
function useFollowLatest(
  active: boolean,
  latestId: number | string | undefined,
) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active || latestId === undefined || !ref.current) return
    ref.current.scrollTop = ref.current.scrollHeight
  }, [active, latestId])
  return ref
}

function activityPath(activity: ProgressActivity) {
  if (
    activity.kind === 'planner_set_base_dir' ||
    activity.kind === 'planner_write_file'
  ) {
    return activity.path
  }
  return activity.kind === 'planner_web_run' ? activity.subject : undefined
}

/** Steps whose interrupt is answered through the question form. */
function asksHuman(activity: ProgressActivity) {
  return (
    activity.kind === 'planner_ask_human' ||
    (activity.kind === 'agent_tool' &&
      (activity.tool === 'ask_human' || activity.tool === 'write_node_memory'))
  )
}

function KeywordsDetail({ keywords }: { keywords: string[] }) {
  return (
    <div className='flex flex-wrap gap-1'>
      {keywords.map((keyword) => (
        <Badge key={keyword} variant='secondary' className='font-mono'>
          {keyword}
        </Badge>
      ))}
    </div>
  )
}

/** The expandable detail of a step, or nothing for a plain line. */
function activityDetail(activity: ProgressActivity) {
  if (activity.kind === 'workflow_manager_action' && activity.keywords?.length)
    return <KeywordsDetail keywords={activity.keywords} />
  if (
    (activity.action === 'read_node_memory' ||
      activity.tool === 'read_node_memory') &&
    activity.memoryDescription
  )
    return <p className='text-xs'>{activity.memoryDescription}</p>
  if (asksHuman(activity) && activity.questionAnswers?.length)
    return <QuestionAnswerDetail answers={activity.questionAnswers} />
  if (
    (activity.kind === 'planner_run_command' ||
      (activity.kind === 'agent_tool' &&
        (activity.tool === 'run_command' ||
          activity.tool === 'container_command'))) &&
    activity.command
  )
    return <CommandDetail command={activity.command} />
  const path = activityPath(activity)
  return path ? <p className='break-all font-mono text-xs'>{path}</p> : null
}

/** Steps grouped by the step that runs their sub-agent. */
interface StepTree {
  roots: ProgressActivity[]
  children: Map<string, ProgressActivity[]>
  todos: Map<string, ProgressActivity>
}

/**
 * Nests each sub-agent activity under the step whose task invoked it. Todo
 * updates are kept apart: the latest per parent step is shown with that
 * step, the main agent's in the pinned Queue. Activities without a known
 * parent stay at the top level.
 */
function stepTree(activities: ProgressActivity[]): StepTree {
  const stepIds = new Set(
    activities.flatMap((activity) =>
      activity.kind !== 'todo' && activity.toolCallId
        ? [activity.toolCallId]
        : [],
    ),
  )
  const tree: StepTree = { roots: [], children: new Map(), todos: new Map() }
  for (const activity of activities) {
    const parentId =
      activity.parentId && stepIds.has(activity.parentId)
        ? activity.parentId
        : undefined
    if (activity.kind === 'todo') {
      if (parentId) tree.todos.set(parentId, activity)
      continue
    }
    if (!parentId) {
      tree.roots.push(activity)
      continue
    }
    const siblings = tree.children.get(parentId)
    if (siblings) siblings.push(activity)
    else tree.children.set(parentId, [activity])
  }
  return tree
}

function todoQueueItems(todo: ProgressActivity | undefined) {
  return (
    todo?.items ??
    (todo?.current
      ? [{ content: todo.current, status: 'in_progress' as const }]
      : [])
  )
}

/** The steps of one level, each nesting the sub-agent work it ran. */
function StepList({
  steps,
  tree,
  runStatus,
  parentUnfinished = true,
}: {
  steps: ProgressActivity[]
  tree: StepTree
  runStatus: AgentRun['status']
  parentUnfinished?: boolean
}) {
  const t = useTranslations('Chat.progress')
  return steps.map((activity, index) => {
    const status = stepStatus(
      activity,
      parentUnfinished && index === steps.length - 1,
      runStatus,
    )
    return (
      <ActivityStep
        key={`${activity.id}-${status ?? 'complete'}`}
        activity={activity}
        status={status}
        tree={tree}
        runStatus={runStatus}
        fallbackLabel={t('fallback_activity')}
      />
    )
  })
}

/** Sub-agent work of one step: its todo list and its own steps. */
function SubAgentTrace({
  steps,
  todo,
  tree,
  runStatus,
  unfinished,
}: {
  steps: ProgressActivity[]
  todo?: ProgressActivity
  tree: StepTree
  runStatus: AgentRun['status']
  unfinished: boolean
}) {
  const t = useTranslations('Chat.progress')
  const todoItems = todoQueueItems(todo)
  return (
    <Trace
      aria-label={t('sub_agent')}
      className='ml-2 border-border border-l pl-3'
    >
      {todoItems.length > 0 && (
        <TodoQueue
          items={todoItems}
          active={unfinished && STREAMING_AGENT_STATUSES.includes(runStatus)}
        />
      )}
      <StepList
        steps={steps}
        tree={tree}
        runStatus={runStatus}
        parentUnfinished={unfinished}
      />
    </Trace>
  )
}

function ActivityStep({
  activity,
  status,
  tree,
  runStatus,
  fallbackLabel,
}: {
  activity: ProgressActivity
  status: StepStatus
  tree: StepTree
  runStatus: AgentRun['status']
  fallbackLabel: string
}) {
  const t = useTranslations('Chat.progress')
  const unfinished = status !== undefined
  const label =
    (unfinished ? activity.message : activity.completeMessage) ||
    activity.message ||
    fallbackLabel
  const childSteps = activity.toolCallId
    ? (tree.children.get(activity.toolCallId) ?? [])
    : []
  const childTodo = activity.toolCallId
    ? tree.todos.get(activity.toolCallId)
    : undefined
  const hasSubAgent = childSteps.length > 0 || childTodo !== undefined
  const detail = activityDetail(activity)

  return (
    <Step
      icon={activityIcon(activity)}
      title={label}
      status={status}
      description={
        childSteps.length > 0
          ? t('sub_step_count', { count: childSteps.length })
          : undefined
      }
      defaultOpen={
        status === 'running' && (hasSubAgent || Boolean(activity.command))
      }
    >
      {detail || hasSubAgent ? (
        <>
          {detail}
          {hasSubAgent && (
            <SubAgentTrace
              steps={childSteps}
              todo={childTodo}
              tree={tree}
              runStatus={runStatus}
              unfinished={status === 'running' || status === 'waiting'}
            />
          )}
        </>
      ) : null}
    </Step>
  )
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
          if (activity.phase === 'project_planner') {
            message = t('phase.project_planner.active')
            completeMessage =
              activity.toolStatus === 'skipped'
                ? t('phase.project_planner.reused')
                : t('phase.project_planner.complete')
          } else if (activity.phase === 'workflow_builder') {
            message = t('phase.workflow_builder.active')
            completeMessage = t('phase.workflow_builder.complete')
          }
          break
        case 'workflow_manager_action': {
          if (activity.action === 'read_node_memory') {
            message = t('builder.read_node_memory.active')
            completeMessage = t('builder.read_node_memory.complete')
            break
          }
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
          const values = { manager, subject: activity.subject ?? manager }
          switch (operation) {
            case 'search':
              // Keywords expand under the step; older events only carry a subject.
              if (activity.keywords?.length) {
                message = t('builder.operation.search.searching', values)
                completeMessage =
                  activity.resultCount === undefined
                    ? t('builder.operation.search.searched', values)
                    : t('builder.operation.search.found', {
                        ...values,
                        count: activity.resultCount,
                      })
              } else {
                message = t('builder.operation.search.active', values)
                completeMessage = t('builder.operation.search.complete', values)
              }
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
        case 'agent_tool': {
          const values = { subject: activity.subject ?? '…' }
          switch (activity.tool) {
            case 'ask_human':
              message = t('tool.ask_human.active')
              completeMessage = t('tool.ask_human.complete')
              break
            case 'summarize_work':
              message = t('tool.summarize_work.active')
              completeMessage = t('tool.summarize_work.complete')
              break
            case 'load_skill':
              message = t('tool.load_skill.active', values)
              completeMessage = t('tool.load_skill.complete', values)
              break
            case 'read_skill_resource':
              message = t('tool.read_skill_resource.active', values)
              completeMessage = t('tool.read_skill_resource.complete', values)
              break
            case 'workflow_reader':
              if (activity.action === 'node') {
                message = t('tool.workflow_reader.node.active', values)
                completeMessage = t(
                  'tool.workflow_reader.node.complete',
                  values,
                )
              } else if (activity.action === 'children') {
                message = t('tool.workflow_reader.children.active', values)
                completeMessage = t(
                  'tool.workflow_reader.children.complete',
                  values,
                )
              } else {
                message = t('tool.workflow_reader.overview.active')
                completeMessage = t('tool.workflow_reader.overview.complete')
              }
              break
            case 'run_command':
              message = t('tool.run_command.active', values)
              completeMessage = t('tool.run_command.complete', values)
              break
            case 'apply_patch':
              message = t('tool.apply_patch.active', {
                file: activity.path ?? '…',
              })
              completeMessage = t('tool.apply_patch.complete', {
                file: activity.path ?? '…',
              })
              break
            case 'view_image':
              message = t('tool.view_image.active', values)
              completeMessage = t('tool.view_image.complete', values)
              break
            case 'write_diagnosis':
              message = t('tool.write_diagnosis.active')
              completeMessage = t('tool.write_diagnosis.complete')
              break
            case 'read_node_memory':
              message = t('builder.read_node_memory.active')
              completeMessage = t('builder.read_node_memory.complete')
              break
            case 'write_node_memory':
              message = t('tool.write_node_memory.active')
              completeMessage = t('tool.write_node_memory.complete', {
                count: activity.resultCount ?? 0,
              })
              break
            case 'fix_subgraph':
              switch (activity.action) {
                case 'load':
                  message = t('tool.fix_subgraph.load.active', values)
                  completeMessage = t('tool.fix_subgraph.load.complete', values)
                  break
                case 'save':
                  message = t('tool.fix_subgraph.save.active')
                  completeMessage = t('tool.fix_subgraph.save.complete')
                  break
                case 'cancel':
                  message = t('tool.fix_subgraph.cancel.active')
                  completeMessage = t('tool.fix_subgraph.cancel.complete')
                  break
                case 'set_output':
                  message = t('tool.fix_subgraph.set_output.active')
                  completeMessage = t('tool.fix_subgraph.set_output.complete')
                  break
                default:
                  message = t('tool.fix_subgraph.view_interface.active')
                  completeMessage = t(
                    'tool.fix_subgraph.view_interface.complete',
                  )
              }
              break
            case 'finalize_workflow_fix':
              message = t('tool.finalize_workflow_fix.active')
              completeMessage = t('tool.finalize_workflow_fix.complete')
              break
            default:
              if (activity.tool && TOOL_CREATION_TOOLS.has(activity.tool)) {
                const variant = activity.subject ? 'subject' : 'plain'
                message = t(
                  `tool_creation.${activity.tool}.${variant}.active`,
                  values,
                )
                completeMessage = t(
                  `tool_creation.${activity.tool}.${variant}.complete`,
                  values,
                )
              }
          }
          break
        }
        case 'tool_generator_step':
          switch (activity.step) {
            case 'select_image':
              message = t('tool_generator.select_image.active')
              completeMessage = t('tool_generator.select_image.complete')
              break
            case 'search_exist_tool':
              message = t('tool_generator.search_exist_tool.active')
              completeMessage = t('tool_generator.search_exist_tool.complete')
              break
            case 'get_report':
              message = t('tool_generator.get_report.active')
              completeMessage = t('tool_generator.get_report.complete')
              break
            case 'choose_group':
              message = t('tool_generator.choose_group.active')
              completeMessage = t('tool_generator.choose_group.complete')
              break
            case 'generate_tool_config':
              message = t('tool_generator.generate_tool_config.active')
              completeMessage = t(
                'tool_generator.generate_tool_config.complete',
              )
              break
            case 'process_help_doc':
              message = t('tool_generator.process_help_doc.active')
              completeMessage = t('tool_generator.process_help_doc.complete')
              break
            case 'save_tool':
              message = t('tool_generator.save_tool.active')
              completeMessage = t('tool_generator.save_tool.complete')
              break
          }
          break
        case 'validation':
          message = t('validation.active')
          completeMessage = t('validation.complete')
          break
        case 'planner_list_project_samples':
          message = t('planner.list_project_samples.active')
          completeMessage = t('planner.list_project_samples.complete')
          break
        case 'planner_set_base_dir':
          message = t('planner.set_base_dir.active')
          completeMessage = t('planner.set_base_dir.complete')
          break
        case 'planner_run_command':
          message = t('planner.run_command.active')
          completeMessage = t('planner.run_command.complete')
          break
        case 'planner_add_samples':
          message = t('planner.add_samples.active', {
            count: activity.count ?? 0,
          })
          completeMessage = t('planner.add_samples.complete', {
            count: activity.count ?? 0,
          })
          break
        case 'planner_add_sample_file':
          message = t('planner.add_sample_file.active', {
            sample: activity.sample ?? 'sample',
            tag: activity.tag ?? 'file',
          })
          completeMessage = t('planner.add_sample_file.complete', {
            sample: activity.sample ?? 'sample',
            tag: activity.tag ?? 'file',
          })
          break
        case 'planner_add_project_file':
          message = t('planner.add_project_file.active', {
            keyword: activity.keyword ?? 'file',
          })
          completeMessage = t('planner.add_project_file.complete', {
            keyword: activity.keyword ?? 'file',
          })
          break
        case 'planner_ask_human':
          message = t('planner.ask_human.active')
          completeMessage = t('planner.ask_human.complete')
          break
        case 'planner_write_file':
          message = t('planner.write_file.active', {
            file: activity.path ?? 'file',
          })
          completeMessage = t('planner.write_file.complete', {
            file: activity.path ?? 'file',
          })
          break
        case 'planner_web_run':
          message = t('planner.web_run.active')
          completeMessage = t('planner.web_run.complete')
          break
        case 'planner_view_pdf':
          message = t('planner.view_pdf.active')
          completeMessage = t('planner.view_pdf.complete')
          break
        case 'planner_confirm_plan':
          message = t('planner.confirm_plan.active')
          completeMessage = t('planner.confirm_plan.complete')
          break
      }
      return { ...activity, message, completeMessage }
    })

    return translatedActivities.map((activity) => {
      if (!asksHuman(activity)) return activity

      const resumeEvent = events.find(
        (event) =>
          event.id > activity.id &&
          event.event_type === 'run.queued' &&
          event.payload.resume === true,
      )
      const feedback = stringValue(resumeEvent?.payload.feedback)
      if (!feedback) return activity
      const interrupt = events.find(
        (event) =>
          event.id > activity.id && event.event_type === 'run.interrupted',
      )?.payload.value
      const question =
        interrupt && typeof interrupt === 'object'
          ? stringValue((interrupt as Record<string, unknown>).question)
          : undefined
      const questionAnswers =
        parseAgentQuestionAnswers(feedback) ??
        (question ? [{ question, answer: feedback.trim() }] : undefined)
      return questionAnswers ? { ...activity, questionAnswers } : activity
    })
  }, [events, t])
}

function TodoLine({
  item,
  active,
}: {
  item: TodoActivityItem
  active: boolean
}) {
  return (
    <TraceLine
      status={active && item.status === 'in_progress' ? 'running' : undefined}
    >
      <TraceIcon>
        {item.status === 'completed' ? (
          <CircleCheckIcon />
        ) : item.status === 'in_progress' ? (
          <CircleDotIcon />
        ) : (
          <CircleIcon />
        )}
      </TraceIcon>
      <TraceTitle title={item.content}>{item.content}</TraceTitle>
    </TraceLine>
  )
}

function TodoQueueSection({
  icon: Icon,
  title,
  items,
  active,
  defaultOpen,
}: {
  icon: LucideIcon
  title: string
  items: TodoActivityItem[]
  active: boolean
  defaultOpen: boolean
}) {
  return (
    <TraceCollapsible defaultOpen={defaultOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine>
          <TraceIcon>
            <Icon />
          </TraceIcon>
          <TraceTitle>{title}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Trace>
          {items.map((item) => (
            <TodoLine
              key={`${item.index ?? 'todo'}-${item.content}`}
              item={item}
              active={active}
            />
          ))}
        </Trace>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

/** The agent's todo list, split into what is left and what is done. */
function TodoQueue({
  items,
  active,
}: {
  items: TodoActivityItem[]
  active: boolean
}) {
  const t = useTranslations('Chat.progress')
  const pending = items.filter((item) => item.status !== 'completed')
  const completed = items.filter((item) => item.status === 'completed')

  return (
    <Trace>
      {pending.length > 0 && (
        <TodoQueueSection
          icon={ListTodoIcon}
          title={t('queue_pending', { count: pending.length })}
          items={pending}
          active={active}
          defaultOpen
        />
      )}
      {completed.length > 0 && (
        <TodoQueueSection
          icon={ListChecksIcon}
          title={t('queue_completed', { count: completed.length })}
          items={completed}
          active={active}
          defaultOpen={false}
        />
      )}
    </Trace>
  )
}

/**
 * A run's steps folded under one summary line: the current step while it
 * runs, then the step count. It opens while running unless toggled.
 */
export function StepsSummary({
  status,
  currentLabel,
  count,
  latestId,
  children,
}: {
  status: StepStatus
  currentLabel: string
  count: number
  latestId: number | string | undefined
  children: ReactNode
}) {
  const t = useTranslations('Chat.progress')
  const [open, setOpen] = useState<boolean>()
  const isActive = status === 'running'
  const traceRef = useFollowLatest(isActive, latestId)

  return (
    <Trace>
      <TraceCollapsible open={open ?? isActive} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger aria-live='polite'>
          <TraceLine status={lineStatus(status)}>
            <TraceIcon>
              <StatusIcon status={status} />
            </TraceIcon>
            <TraceTitle>
              {isActive
                ? currentLabel
                : status === 'waiting'
                  ? t('waiting')
                  : t('history_count', { count })}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace ref={traceRef} className='max-h-64 overflow-y-auto pr-1'>
            {children}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

function RunChainOfThought({
  tree,
  runStatus,
  currentLabel,
  latestId,
}: {
  tree: StepTree
  runStatus: AgentRun['status']
  currentLabel: string
  latestId: number | undefined
}) {
  return (
    <StepsSummary
      status={runStepStatus(runStatus)}
      currentLabel={currentLabel}
      count={tree.roots.length}
      latestId={latestId}
    >
      <StepList steps={tree.roots} tree={tree} runStatus={runStatus} />
    </StepsSummary>
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
  const tree = useMemo(() => stepTree(activities), [activities])
  const isActive = STREAMING_AGENT_STATUSES.includes(run.status)
  const current = activities.at(-1)

  if (tree.roots.length === 0) {
    return isActive ? (
      <TraceLine status='running'>
        <TraceIcon>
          <StatusIcon status='running' />
        </TraceIcon>
        <TraceTitle>{current?.message || t('fallback_activity')}</TraceTitle>
      </TraceLine>
    ) : null
  }

  return (
    <RunChainOfThought
      tree={tree}
      runStatus={run.status}
      currentLabel={current?.message || t('fallback_activity')}
      latestId={current?.id}
    />
  )
}

/**
 * The main agent's latest todo list, pinned above the composer. Sub-agent
 * todo lists stay nested under the step that runs them.
 */
export function RunTodoQueue({
  events,
  run,
}: {
  events: AgentEvent[]
  run: AgentRun
}) {
  const activities = useProgressActivities(events)
  const items = todoQueueItems(
    activities.findLast(
      (activity) => activity.kind === 'todo' && activity.depth === 0,
    ),
  )

  if (items.length === 0) return null

  return (
    <div className='max-h-48 overflow-y-auto rounded-xl border bg-card px-3 py-2 shadow-xs'>
      <TodoQueue
        items={items}
        active={STREAMING_AGENT_STATUSES.includes(run.status)}
      />
    </div>
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
