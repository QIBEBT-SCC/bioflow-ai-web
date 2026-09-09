'use client'

import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RunTaskList } from '@/components/workflow/run-task-list'
import { useWorkflowMonitorRuns } from '@/hooks/use-workflow-monitor'
import { cn } from '@/lib/utils'
import { WorkflowRunStatusV2 } from '@/types/workflow-v2'

const STATUS_APPEARANCE = {
  [WorkflowRunStatusV2.PENDING]: {
    labelKey: 'pending',
    variant: 'secondary' as const,
    icon: Clock3Icon,
    iconClassName: 'text-amber-600',
  },
  [WorkflowRunStatusV2.RUNNING]: {
    labelKey: 'running',
    variant: 'default' as const,
    icon: Loader2Icon,
    iconClassName: 'text-blue-600',
  },
  [WorkflowRunStatusV2.SUCCEEDED]: {
    labelKey: 'succeeded',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
    iconClassName: 'text-emerald-600',
  },
  [WorkflowRunStatusV2.FAILED]: {
    labelKey: 'failed',
    variant: 'destructive' as const,
    icon: XCircleIcon,
    iconClassName: 'text-red-600',
  },
}

export function RunTables({
  refetchInterval,
}: {
  refetchInterval?: number | false
}) {
  const t = useTranslations('workflowMonitor')
  const taskT = useTranslations('task')
  const locale = useLocale()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<WorkflowRunStatusV2 | 'all'>(
    'all',
  )
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(() => new Set())
  const limit = 10
  const { data: runsPage, isLoading } = useWorkflowMonitorRuns(
    page * limit,
    limit,
    statusFilter === 'all' ? undefined : statusFilter,
    refetchInterval,
  )
  const runs = runsPage?.data ?? []
  const runCount = runsPage?.total ?? 0
  const totalPages = Math.ceil(runCount / limit)
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    [locale],
  )

  const toggleRun = (runUid: string) => {
    setExpandedRuns((current) => {
      const next = new Set(current)
      if (next.has(runUid)) next.delete(runUid)
      else next.add(runUid)
      return next
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            {t('table.statusFilter')}
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as WorkflowRunStatusV2 | 'all')
              setPage(0)
              setExpandedRuns(new Set())
            }}
          >
            <SelectTrigger className='w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('table.all')}</SelectItem>
              {Object.entries(STATUS_APPEARANCE).map(([status, appearance]) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${appearance.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='text-sm text-muted-foreground'>
          {t('table.total', { count: runCount })}
        </div>
      </div>

      <div className='overflow-x-auto rounded-xl border bg-card'>
        <Table className='min-w-[940px]'>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='w-12' />
              <TableHead className='w-[280px]'>{t('table.name')}</TableHead>
              <TableHead className='w-[130px]'>{t('table.status')}</TableHead>
              <TableHead className='w-[220px]'>{t('table.progress')}</TableHead>
              <TableHead className='w-[110px]'>{t('table.owner')}</TableHead>
              <TableHead className='w-[150px]'>
                {t('table.startedAt')}
              </TableHead>
              <TableHead className='w-[120px]'>{t('table.duration')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ['run-1', 'run-2', 'run-3', 'run-4', 'run-5'].map((key) => (
                <TableRow key={key}>
                  <TableCell>
                    <Skeleton className='size-8 rounded-md' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-52' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-6 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-full' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-14' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-24' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-16' />
                  </TableCell>
                </TableRow>
              ))
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center'>
                  <div className='flex flex-col items-center justify-center text-muted-foreground'>
                    <Clock3Icon className='mb-2 size-8' />
                    <p>{t('table.empty')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => {
                const appearance = STATUS_APPEARANCE[run.status]
                const StatusIcon = appearance.icon
                const stats = run.node_statistics
                const terminal = stats.succeeded + stats.failed + stats.blocked
                const progress =
                  stats.total > 0 ? (terminal / stats.total) * 100 : 0
                const expanded = expandedRuns.has(run.uid)
                const runHref = run.project_id
                  ? `/project/${run.project_id}/${run.uid}`
                  : `/workflow/${run.uid}`

                return (
                  <Fragment key={run.uid}>
                    <TableRow
                      className={cn(
                        'transition-colors hover:bg-muted/40',
                        expanded && 'bg-muted/30 hover:bg-muted/30',
                      )}
                    >
                      <TableCell className='pr-0'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          aria-expanded={expanded}
                          aria-controls={`run-tasks-${run.uid}`}
                          aria-label={t(
                            expanded ? 'table.collapse' : 'table.expand',
                            { name: run.name },
                          )}
                          onClick={() => toggleRun(run.uid)}
                        >
                          <ChevronDownIcon
                            className={cn(
                              'size-4 transition-transform',
                              !expanded && '-rotate-90',
                            )}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>
                        <Link
                          href={runHref}
                          className='block min-w-0 hover:underline'
                        >
                          <span className='block truncate'>{run.name}</span>
                          <span className='mt-0.5 block truncate font-mono text-[11px] font-normal text-muted-foreground'>
                            {run.uid}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <Badge variant={appearance.variant} className='gap-1'>
                            <StatusIcon
                              className={cn(
                                'size-3',
                                appearance.iconClassName,
                                run.status === WorkflowRunStatusV2.RUNNING &&
                                  'animate-spin motion-reduce:animate-none',
                              )}
                            />
                            {t(`status.${appearance.labelKey}`)}
                          </Badge>
                          {!run.settled ? (
                            <p className='text-[11px] text-muted-foreground'>
                              {t('table.unsettled')}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1.5'>
                          <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
                            <span>
                              {t('table.completed', {
                                completed: terminal,
                                total: stats.total,
                              })}
                            </span>
                            <span className='tabular-nums'>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={progress} className='h-1.5' />
                        </div>
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {t('table.ownerValue', { id: run.owner_id })}
                      </TableCell>
                      <TableCell className='text-sm tabular-nums text-muted-foreground'>
                        {run.start_time
                          ? dateFormatter.format(new Date(run.start_time))
                          : '-'}
                      </TableCell>
                      <TableCell className='text-sm tabular-nums text-muted-foreground'>
                        {formatDuration(run.start_time, run.end_time, taskT)}
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow
                        id={`run-tasks-${run.uid}`}
                        className='bg-muted/15 hover:bg-muted/15'
                      >
                        <TableCell colSpan={7} className='p-0'>
                          <div className='border-y border-dashed p-4 sm:p-5'>
                            <RunTaskList
                              runUid={run.uid}
                              refetchInterval={refetchInterval}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 ? (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            {t('table.page', { current: page + 1, total: totalPages })}
          </div>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => {
                setPage(Math.max(0, page - 1))
                setExpandedRuns(new Set())
              }}
              disabled={page === 0}
            >
              <ChevronLeftIcon className='mr-1 size-4' />
              {t('table.previous')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => {
                setPage(Math.min(totalPages - 1, page + 1))
                setExpandedRuns(new Set())
              }}
              disabled={page >= totalPages - 1}
            >
              {t('table.next')}
              <ChevronRightIcon className='ml-1 size-4' />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatDuration(
  startTime: string | null,
  endTime: string | null,
  t: ReturnType<typeof useTranslations>,
) {
  if (!startTime) return '-'
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const seconds = Math.max(0, Math.floor((end - start) / 1000))

  if (seconds < 60) return t('duration.seconds', { seconds })
  if (seconds < 3600) {
    return t('duration.minutesSeconds', {
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
    })
  }
  return t('duration.hoursMinutes', {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
  })
}
