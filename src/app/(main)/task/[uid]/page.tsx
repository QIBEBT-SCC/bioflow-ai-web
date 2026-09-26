'use client'

import { TerminalIcon, XCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import {
  Snippet,
  SnippetAddon,
  SnippetInput,
  SnippetText,
} from '@/components/ai-elements/snippet'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { SectionCard } from '@/components/layout/section-card'
import { TaskLog } from '@/components/task/task-log'
import { TaskMonitor } from '@/components/task/task-monitor'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RUN_STATUS_APPEARANCE,
  RunStatusBadge,
} from '@/components/workflow/run-status'
import { useTask } from '@/hooks/use-task'
import { NodeRunStatusV2, type NodeRunV2 } from '@/types/workflow-v2'

// 格式化时间
function formatDateTime(
  dateFormatter: Intl.DateTimeFormat,
  dateStr?: string | null,
) {
  if (!dateStr) return '-'
  try {
    return dateFormatter.format(new Date(dateStr))
  } catch {
    return '-'
  }
}

export default function TaskDetailPage() {
  const params = useParams()
  const locale = useLocale()
  const t = useTranslations('task')
  const workflowT = useTranslations('workflowMonitor')
  const taskUid = params.uid as string
  const { data: task, isLoading } = useTask(taskUid)
  const [activeView, setActiveView] = useState<'result' | 'log' | 'monitor'>(
    'result',
  )
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    [locale],
  )

  const formatDuration = (
    startTime?: string | null,
    endTime?: string | null,
  ) => {
    if (!startTime) return '-'
    const start = new Date(startTime).getTime()
    const end = endTime ? new Date(endTime).getTime() : Date.now()
    const duration = Math.floor((end - start) / 1000)

    if (duration < 60) return t('duration.seconds', { seconds: duration })
    if (duration < 3600) {
      return t('duration.minutesSeconds', {
        minutes: Math.floor(duration / 60),
        seconds: duration % 60,
      })
    }
    return t('duration.hoursMinutes', {
      hours: Math.floor(duration / 3600),
      minutes: Math.floor((duration % 3600) / 60),
    })
  }

  const runHref = task?.project_id
    ? `/project/${task.project_id}/${task.run_uid}`
    : `/workflow/${task?.run_uid}`

  return (
    <PageShell
      breadcrumbs={[
        { label: workflowT('title'), href: '/workflow' },
        { label: task?.name ?? t('detail.loading') },
      ]}
    >
      <PageContainer>
        {isLoading && (
          <div className='space-y-6'>
            <Skeleton className='h-16 w-96' />
            <div className='grid gap-6 lg:grid-cols-4'>
              <Skeleton className='h-96 rounded-xl lg:col-span-3' />
              <Skeleton className='h-96 rounded-xl' />
            </div>
          </div>
        )}

        {!isLoading && !task && (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <XCircleIcon />
              </EmptyMedia>
              <EmptyTitle>{t('detail.notFound')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {task && (
          <>
            <PageHeader
              title={task.name}
              titleAddon={
                <RunStatusBadge
                  status={task.status}
                  label={t(
                    `status.${RUN_STATUS_APPEARANCE[task.status].labelKey}`,
                  )}
                />
              }
              description={task.tool_description ?? task.node_type}
            />
            <dl className='-mt-3 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
              <div className='flex items-center gap-1.5'>
                <dt className='text-muted-foreground'>{t('detail.taskId')}</dt>
                <dd className='font-mono'>{task.uid}</dd>
              </div>
              <div className='flex items-center gap-1.5'>
                <dt className='text-muted-foreground'>
                  {t('detail.workflow')}
                </dt>
                <dd>
                  <Link
                    href={runHref}
                    className='font-medium text-primary hover:underline'
                  >
                    {task.run_name}
                  </Link>
                </dd>
              </div>
              <div className='flex items-center gap-1.5'>
                <dt className='text-muted-foreground'>
                  {t('detail.duration')}
                </dt>
                <dd className='font-medium tabular-nums'>
                  {formatDuration(task.start_time, task.end_time)}
                </dd>
              </div>
            </dl>

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
              <Tabs
                value={activeView}
                onValueChange={(value) =>
                  setActiveView(value as 'result' | 'log' | 'monitor')
                }
                className='min-w-0 gap-4 lg:col-span-3'
              >
                <TabsList>
                  <TabsTrigger value='result'>{t('detail.result')}</TabsTrigger>
                  <TabsTrigger value='log'>{t('detail.log')}</TabsTrigger>
                  <TabsTrigger value='monitor'>
                    {t('detail.monitor')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='result'>
                  <TaskResultView task={task} />
                </TabsContent>
                <TabsContent value='log'>
                  <TaskLogView task={task} taskUid={taskUid} />
                </TabsContent>
                <TabsContent value='monitor'>
                  <SectionCard title={t('detail.monitor')}>
                    <TaskMonitor taskUid={taskUid} />
                  </SectionCard>
                </TabsContent>
              </Tabs>

              <TaskSidebar task={task} dateFormatter={dateFormatter} />
            </div>
          </>
        )}
      </PageContainer>
    </PageShell>
  )
}

function TaskResultView({ task }: { task: NodeRunV2 }) {
  const t = useTranslations('task.detail')

  return (
    <SectionCard title={t('result')}>
      {task.error_message ? (
        <div className='mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 font-mono text-sm text-destructive'>
          {task.error_message}
        </div>
      ) : null}
      {task.tool_output?.result ? (
        <div className='divide-y rounded-lg border'>
          {Object.entries(task.tool_output.result).map(([key, value]) => (
            <div
              key={key}
              className='flex items-start justify-between gap-4 px-3 py-2'
            >
              <span className='text-sm font-medium text-muted-foreground'>
                {key}
              </span>
              <span className='font-mono text-sm text-right break-all max-w-2xl'>
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className='rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground'>
          <TerminalIcon className='mx-auto mb-3 size-8 opacity-50' />
          <p>{t('noResult')}</p>
        </div>
      )}
    </SectionCard>
  )
}

function TaskLogView({ task, taskUid }: { task: NodeRunV2; taskUid: string }) {
  const t = useTranslations('task.detail')

  return (
    <div className='space-y-4'>
      {task.commands && (
        <SectionCard title={t('command')}>
          <Snippet
            className='py-5 bg-muted text-sm font-mono'
            code={task.commands}
          >
            <SnippetAddon className='pl-1'>
              <SnippetText>$</SnippetText>
            </SnippetAddon>
            <SnippetInput />
            <SnippetAddon align='inline-end' className='pr-2'>
              <CopyButton code={task.commands} />
            </SnippetAddon>
          </Snippet>
        </SectionCard>
      )}
      <SectionCard title={t('log')}>
        <TaskLog
          taskUid={taskUid}
          isRunning={task.status === NodeRunStatusV2.RUNNING}
        />
      </SectionCard>
    </div>
  )
}

function TaskSidebar({
  task,
  dateFormatter,
}: {
  task: NodeRunV2
  dateFormatter: Intl.DateTimeFormat
}) {
  const t = useTranslations('task.detail')

  return (
    <aside className='space-y-4 lg:sticky lg:top-0 lg:self-start'>
      <SectionCard title={t('basicInfo')} contentClassName='space-y-3 text-sm'>
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>{t('nodeType')}</p>
          <p className='font-medium'>{task.tool_name ?? task.node_type}</p>
        </div>
        <Separator />
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>{t('owner')}</p>
          <p className='font-medium'>{task.owner_username}</p>
        </div>
        <Separator />
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>
            {t('definitionNodeId')}
          </p>
          <p className='break-all font-mono text-xs'>
            {task.definition_node_id}
          </p>
        </div>
      </SectionCard>

      <SectionCard title={t('timeInfo')} contentClassName='space-y-3 text-sm'>
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>{t('createdAt')}</p>
          <p className='font-mono text-xs'>
            {formatDateTime(dateFormatter, task.create_time)}
          </p>
        </div>
        <Separator />
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>{t('queuedAt')}</p>
          <p className='font-mono text-xs'>
            {formatDateTime(dateFormatter, task.queued_at)}
          </p>
        </div>
        <Separator />
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>{t('startedAt')}</p>
          <p className='font-mono text-xs'>
            {formatDateTime(dateFormatter, task.start_time)}
          </p>
        </div>
        <Separator />
        <div>
          <p className='mb-1 text-xs text-muted-foreground'>{t('endedAt')}</p>
          <p className='font-mono text-xs'>
            {formatDateTime(dateFormatter, task.end_time)}
          </p>
        </div>
      </SectionCard>

      {(task.system || task.hostname || task.worker_id) && (
        <SectionCard
          title={t('systemInfo')}
          contentClassName='space-y-3 text-sm'
        >
          {task.hostname && (
            <>
              <div>
                <p className='mb-1 text-xs text-muted-foreground'>
                  {t('host')}
                </p>
                <p className='font-mono text-xs'>{task.hostname}</p>
              </div>
              {task.system && <Separator />}
            </>
          )}
          {task.system && (
            <div>
              <p className='mb-1 text-xs text-muted-foreground'>
                {t('system')}
              </p>
              <p className='font-mono text-xs break-all'>{task.system}</p>
            </div>
          )}
          {task.worker_id && (
            <>
              {(task.hostname || task.system) && <Separator />}
              <div>
                <p className='mb-1 text-xs text-muted-foreground'>
                  {t('worker')}
                </p>
                <p className='font-mono text-xs break-all'>{task.worker_id}</p>
              </div>
            </>
          )}
        </SectionCard>
      )}
    </aside>
  )
}
