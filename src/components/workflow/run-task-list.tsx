'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RUN_STATUS_APPEARANCE,
  RunStatusBadge,
} from '@/components/workflow/run-status'
import { useRunTasks } from '@/hooks/use-task'

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

export function RunTaskList({
  runUid,
  refetchInterval,
}: {
  runUid: string
  refetchInterval?: number | false
}) {
  const t = useTranslations('workflowMonitor.tasks')
  const taskT = useTranslations('task')
  const locale = useLocale()
  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
  } = useRunTasks(runUid, true, refetchInterval)
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    [locale],
  )

  if (isLoading) {
    return (
      <div className='space-y-2 rounded-lg border bg-background p-3'>
        {['task-1', 'task-2', 'task-3', 'task-4'].map((key) => (
          <Skeleton key={key} className='h-14 w-full' />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className='flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground'>
        <p>{t('loadError')}</p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => refetch()}
        >
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className='flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground'>
        {t('empty')}
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-lg border bg-background'>
      <div className='max-h-[380px] overflow-auto overscroll-contain'>
        <div className='min-w-[760px]'>
          <div className='sticky top-0 z-10 grid grid-cols-[minmax(220px,1.7fr)_140px_170px_150px] border-b bg-muted/95 px-4 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur'>
            <span>{t('name')}</span>
            <span>{t('status')}</span>
            <span>{t('startedAt')}</span>
            <span>{t('duration')}</span>
          </div>
          {tasks.map((task) => {
            const appearance = RUN_STATUS_APPEARANCE[task.status]
            return (
              <Link
                key={task.uid}
                href={`/task/${task.uid}`}
                aria-label={t('open', { name: task.name })}
                className='grid min-h-14 grid-cols-[minmax(220px,1.7fr)_140px_170px_150px] items-center border-b px-4 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
              >
                <div className='min-w-0 pr-4'>
                  <p className='truncate font-medium'>{task.name}</p>
                  <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                    {task.node_type} · {task.definition_node_id}
                  </p>
                </div>
                <div>
                  <RunStatusBadge
                    status={task.status}
                    label={taskT(`status.${appearance.labelKey}`)}
                  />
                </div>
                <span className='tabular-nums text-muted-foreground'>
                  {task.start_time
                    ? dateFormatter.format(new Date(task.start_time))
                    : '-'}
                </span>
                <span className='tabular-nums text-muted-foreground'>
                  {formatDuration(task.start_time, task.end_time, taskT)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
      <div className='border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground'>
        {t('count', { count: tasks.length })}
      </div>
    </div>
  )
}
