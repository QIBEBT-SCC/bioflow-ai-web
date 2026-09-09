'use client'

import {
  BanIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  ListOrderedIcon,
  Loader2Icon,
  TerminalIcon,
  XCircleIcon,
} from 'lucide-react'
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
import { TaskLog } from '@/components/task/task-log'
import { TaskMonitor } from '@/components/task/task-monitor'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useTask } from '@/hooks/use-task'
import { NodeRunStatusV2, type NodeRunV2 } from '@/types/workflow-v2'

// 状态配置
const statusConfig = {
  [NodeRunStatusV2.PENDING]: {
    labelKey: 'pending',
    variant: 'secondary' as const,
    icon: ClockIcon,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-950',
  },
  [NodeRunStatusV2.READY]: {
    labelKey: 'ready',
    variant: 'secondary' as const,
    icon: CircleDotIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
  },
  [NodeRunStatusV2.QUEUED]: {
    labelKey: 'queued',
    variant: 'secondary' as const,
    icon: ListOrderedIcon,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
  },
  [NodeRunStatusV2.RUNNING]: {
    labelKey: 'running',
    variant: 'default' as const,
    icon: Loader2Icon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  [NodeRunStatusV2.FAILED]: {
    labelKey: 'failed',
    variant: 'destructive' as const,
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  [NodeRunStatusV2.SUCCEEDED]: {
    labelKey: 'succeeded',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  [NodeRunStatusV2.BLOCKED]: {
    labelKey: 'blocked',
    variant: 'outline' as const,
    icon: BanIcon,
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-50 dark:bg-zinc-950',
  },
}

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

  if (isLoading) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full size-8 border-b-2 border-primary mx-auto mb-2'></div>
          <p className='text-muted-foreground'>{t('detail.loading')}</p>
        </div>
      </SidebarInset>
    )
  }

  if (!task) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <XCircleIcon className='size-12 text-muted-foreground mx-auto mb-3' />
          <p className='text-muted-foreground'>{t('detail.notFound')}</p>
        </div>
      </SidebarInset>
    )
  }

  const config = statusConfig[task.status]
  const StatusIcon = config.icon
  const runHref = task.project_id
    ? `/project/${task.project_id}/${task.run_uid}`
    : `/workflow/${task.run_uid}`

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href='/task'>{t('title')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{task.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto p-6 max-w-7xl'>
          {/* 任务标题卡片 - 简约扁平化 */}
          <Card className='mb-6'>
            <CardContent className='pt-6'>
              <div className='flex items-start justify-between gap-6'>
                <div className='flex-1 min-w-0 space-y-3'>
                  <div className='flex items-center gap-3'>
                    <h1 className='text-2xl font-semibold'>{task.name}</h1>
                    <Badge variant={config.variant} className='gap-1.5'>
                      <StatusIcon
                        className={`size-3.5 ${
                          config.icon === Loader2Icon ? 'animate-spin' : ''
                        }`}
                      />
                      {t(`status.${config.labelKey}`)}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {task.tool_description ?? task.node_type}
                  </p>
                  <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                    <div>
                      <span className='font-medium'>{t('detail.taskId')}</span>{' '}
                      <span className='font-mono'>{task.uid}</span>
                    </div>
                    <Separator orientation='vertical' className='h-4' />
                    <div>
                      <span className='font-medium'>
                        {t('detail.workflow')}
                      </span>{' '}
                      <Link
                        href={runHref}
                        className='text-primary hover:underline'
                      >
                        {task.run_name}
                      </Link>
                    </div>
                    <Separator orientation='vertical' className='h-4' />
                    <div>
                      <span className='font-medium'>
                        {t('detail.duration')}
                      </span>{' '}
                      <span className='font-semibold text-foreground'>
                        {formatDuration(task.start_time, task.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主内容区 */}
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* 左侧主要内容 */}
            <div className='lg:col-span-3 space-y-6'>
              {/* 简单的视图切换按钮 */}
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setActiveView('result')}
                  className={activeView === 'result' ? 'bg-muted' : ''}
                >
                  {t('detail.result')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setActiveView('log')}
                  className={activeView === 'log' ? 'bg-muted' : ''}
                >
                  {t('detail.log')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setActiveView('monitor')}
                  className={activeView === 'monitor' ? 'bg-muted' : ''}
                >
                  {t('detail.monitor')}
                </Button>
              </div>

              {activeView === 'result' && <TaskResultView task={task} />}
              {activeView === 'log' && (
                <TaskLogView task={task} taskUid={taskUid} />
              )}
              {activeView === 'monitor' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('detail.monitor')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskMonitor taskUid={taskUid} />
                  </CardContent>
                </Card>
              )}
            </div>

            <TaskSidebar task={task} dateFormatter={dateFormatter} />
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}

function TaskResultView({ task }: { task: NodeRunV2 }) {
  const t = useTranslations('task.detail')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('result')}</CardTitle>
      </CardHeader>
      <CardContent>
        {task.error_message ? (
          <div className='mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 font-mono text-sm text-destructive'>
            {task.error_message}
          </div>
        ) : null}
        {task.tool_output?.result ? (
          <div className='space-y-2'>
            {Object.entries(task.tool_output.result).map(([key, value]) => (
              <div
                key={key}
                className='flex justify-between items-start py-2 px-3 rounded border'
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
          <div className='text-center text-muted-foreground py-12'>
            <TerminalIcon className='size-12 mx-auto mb-3 opacity-50' />
            <p>{t('noResult')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskLogView({ task, taskUid }: { task: NodeRunV2; taskUid: string }) {
  const t = useTranslations('task.detail')

  return (
    <div className='space-y-4'>
      {task.commands && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>{t('command')}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t('log')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskLog
            taskUid={taskUid}
            isRunning={task.status === NodeRunStatusV2.RUNNING}
          />
        </CardContent>
      </Card>
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
    <div className='space-y-4'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>{t('basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <p className='text-xs text-muted-foreground mb-1'>
              {t('nodeType')}
            </p>
            <p className='font-medium'>{task.tool_name ?? task.node_type}</p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>{t('owner')}</p>
            <p className='font-medium'>{task.owner_username}</p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>
              {t('definitionNodeId')}
            </p>
            <p className='break-all font-mono text-xs'>
              {task.definition_node_id}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>{t('timeInfo')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <p className='text-xs text-muted-foreground mb-1'>
              {t('createdAt')}
            </p>
            <p className='font-mono text-xs'>
              {formatDateTime(dateFormatter, task.create_time)}
            </p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>
              {t('queuedAt')}
            </p>
            <p className='font-mono text-xs'>
              {formatDateTime(dateFormatter, task.queued_at)}
            </p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>
              {t('startedAt')}
            </p>
            <p className='font-mono text-xs'>
              {formatDateTime(dateFormatter, task.start_time)}
            </p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>{t('endedAt')}</p>
            <p className='font-mono text-xs'>
              {formatDateTime(dateFormatter, task.end_time)}
            </p>
          </div>
        </CardContent>
      </Card>

      {(task.system || task.hostname || task.worker_id) && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>{t('systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            {task.hostname && (
              <>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>
                    {t('host')}
                  </p>
                  <p className='font-mono text-xs'>{task.hostname}</p>
                </div>
                {task.system && <Separator />}
              </>
            )}
            {task.system && (
              <div>
                <p className='text-xs text-muted-foreground mb-1'>
                  {t('system')}
                </p>
                <p className='font-mono text-xs break-all'>{task.system}</p>
              </div>
            )}
            {task.worker_id && (
              <>
                {(task.hostname || task.system) && <Separator />}
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>
                    {t('worker')}
                  </p>
                  <p className='font-mono text-xs break-all'>
                    {task.worker_id}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
