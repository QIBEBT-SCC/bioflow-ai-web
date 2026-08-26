'use client'

import {
  CalendarRangeIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRecentTasks } from '@/hooks/use-task'
import { cn } from '@/lib/utils'
import { Status } from '@/types/run'
import type { SimpleTaskPublic } from '@/types/task'

const RANGE_OPTIONS = [
  { hours: 6, labelKey: 'last6Hours' },
  { hours: 24, labelKey: 'last24Hours' },
  { hours: 72, labelKey: 'last3Days' },
  { hours: 168, labelKey: 'last7Days' },
] as const

const STATUS_OPTIONS = [
  {
    value: Status.RUNNING,
    labelKey: 'running',
    dotClassName: 'bg-sky-500',
  },
  {
    value: Status.WAITING,
    labelKey: 'waiting',
    dotClassName: 'bg-amber-500',
  },
  {
    value: Status.SUCCESS,
    labelKey: 'success',
    dotClassName: 'bg-emerald-500',
  },
  {
    value: Status.ERROR,
    labelKey: 'failed',
    dotClassName: 'bg-rose-500',
  },
] as const

const STATUS_APPEARANCE = {
  [Status.WAITING]: {
    icon: Clock3Icon,
    barClassName:
      'border-amber-400/50 bg-amber-500/15 text-amber-800 dark:text-amber-200',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  [Status.RUNNING]: {
    icon: Loader2Icon,
    barClassName:
      'border-sky-400/60 bg-sky-500/20 text-sky-800 dark:text-sky-100',
    iconClassName: 'text-sky-600 dark:text-sky-400',
  },
  [Status.ERROR]: {
    icon: XCircleIcon,
    barClassName:
      'border-rose-400/50 bg-rose-500/15 text-rose-800 dark:text-rose-200',
    iconClassName: 'text-rose-600 dark:text-rose-400',
  },
  [Status.SUCCESS]: {
    icon: CheckCircle2Icon,
    barClassName:
      'border-emerald-400/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
} as const

type RangeHours = (typeof RANGE_OPTIONS)[number]['hours']
type StatusFilter = Status | 'all'

interface TimelineItem {
  task: SimpleTaskPublic
  startTime: number
  endTime: number
  startPercent: number
  widthPercent: number
}

function parseTime(value?: string) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

function getTaskInterval(task: SimpleTaskPublic, now: number) {
  const startTime = parseTime(task.start_time) ?? parseTime(task.create_time)
  if (startTime === null) return null

  const recordedEndTime = parseTime(task.end_time)
  const endTime =
    recordedEndTime ?? (task.status === Status.RUNNING ? now : startTime)

  return {
    startTime,
    endTime: Math.max(startTime, endTime),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function TaskTimeline() {
  const [rangeHours, setRangeHours] = useState<RangeHours>(24)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [now, setNow] = useState(() => Date.now())
  const { data: tasks = [], isFetching, isLoading } = useRecentTasks(rangeHours)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const timeline = useMemo(() => {
    const rangeEnd = now
    const rangeStart = rangeEnd - rangeHours * 60 * 60 * 1000
    const duration = rangeEnd - rangeStart
    const ticks = Array.from({ length: 6 }, (_, index) => {
      const percent = index * 20
      return {
        percent,
        time: rangeStart + duration * (percent / 100),
      }
    })

    const items = tasks
      .map((task): TimelineItem | null => {
        const interval = getTaskInterval(task, now)
        if (!interval) return null
        if (interval.endTime < rangeStart || interval.startTime > rangeEnd) {
          return null
        }

        const visibleStart = clamp(interval.startTime, rangeStart, rangeEnd)
        const visibleEnd = clamp(interval.endTime, rangeStart, rangeEnd)

        return {
          task,
          startTime: interval.startTime,
          endTime: interval.endTime,
          startPercent: ((visibleStart - rangeStart) / duration) * 100,
          widthPercent: ((visibleEnd - visibleStart) / duration) * 100,
        }
      })
      .filter((item): item is TimelineItem => item !== null)
      .sort((a, b) => b.startTime - a.startTime)

    return { items, ticks }
  }, [now, rangeHours, tasks])

  const counts = useMemo(() => {
    const result = {
      all: timeline.items.length,
      [Status.WAITING]: 0,
      [Status.RUNNING]: 0,
      [Status.ERROR]: 0,
      [Status.SUCCESS]: 0,
    }

    for (const item of timeline.items) result[item.task.status]++
    return result
  }, [timeline.items])

  const visibleItems = useMemo(
    () =>
      statusFilter === 'all'
        ? timeline.items
        : timeline.items.filter((item) => item.task.status === statusFilter),
    [statusFilter, timeline.items],
  )

  return (
    <Card className='gap-0 overflow-hidden py-0 shadow-xs'>
      <TimelineHeader
        rangeHours={rangeHours}
        isRefreshing={isFetching && !isLoading}
        onRangeChange={setRangeHours}
      />
      <TimelineStatusFilters
        counts={counts}
        statusFilter={statusFilter}
        visibleCount={visibleItems.length}
        onStatusChange={setStatusFilter}
      />

      <CardContent className='px-0'>
        {isLoading ? (
          <TimelineSkeleton />
        ) : visibleItems.length === 0 ? (
          <TimelineEmptyState />
        ) : (
          <TimelineChart
            items={visibleItems}
            ticks={timeline.ticks}
            rangeHours={rangeHours}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface TimelineHeaderProps {
  rangeHours: RangeHours
  isRefreshing: boolean
  onRangeChange: (hours: RangeHours) => void
}

function TimelineHeader({
  rangeHours,
  isRefreshing,
  onRangeChange,
}: TimelineHeaderProps) {
  const t = useTranslations('task')

  return (
    <CardHeader className='gap-4 px-5 py-5 sm:px-6'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50'>
            <CalendarRangeIcon className='size-4 text-muted-foreground' />
          </div>
          <div className='min-w-0 space-y-1'>
            <CardTitle className='flex items-center gap-2'>
              {t('timeline.title')}
              {isRefreshing ? (
                <Loader2Icon className='size-3.5 animate-spin text-muted-foreground' />
              ) : null}
            </CardTitle>
            <CardDescription>{t('timeline.description')}</CardDescription>
          </div>
        </div>

        <div className='flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0'>
          <span className='shrink-0 text-xs font-medium text-muted-foreground'>
            {t('timeline.rangeLabel')}
          </span>
          <ButtonGroup className='shrink-0'>
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.hours}
                type='button'
                size='sm'
                variant={rangeHours === option.hours ? 'secondary' : 'outline'}
                aria-pressed={rangeHours === option.hours}
                onClick={() => onRangeChange(option.hours)}
              >
                {t(`timeline.${option.labelKey}`)}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>
    </CardHeader>
  )
}

interface TimelineStatusFiltersProps {
  counts: Record<Status | 'all', number>
  statusFilter: StatusFilter
  visibleCount: number
  onStatusChange: (status: StatusFilter) => void
}

function TimelineStatusFilters({
  counts,
  statusFilter,
  visibleCount,
  onStatusChange,
}: TimelineStatusFiltersProps) {
  const t = useTranslations('task')

  return (
    <div className='flex items-center gap-2 overflow-x-auto border-y bg-muted/20 px-5 py-3 sm:px-6'>
      <button
        type='button'
        aria-pressed={statusFilter === 'all'}
        onClick={() => onStatusChange('all')}
        className={cn(
          'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          statusFilter === 'all'
            ? 'border-foreground/15 bg-foreground text-background'
            : 'bg-background text-muted-foreground hover:text-foreground',
        )}
      >
        {t('timeline.allStatuses')} · {counts.all}
      </button>
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          type='button'
          aria-pressed={statusFilter === option.value}
          onClick={() => onStatusChange(option.value)}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
            statusFilter === option.value &&
              'border-foreground/20 bg-accent text-foreground shadow-xs',
          )}
        >
          <span className={cn('size-1.5 rounded-full', option.dotClassName)} />
          {t(`status.${option.labelKey}`)} · {counts[option.value]}
        </button>
      ))}
      <span className='ml-auto shrink-0 text-xs text-muted-foreground'>
        {t('timeline.showing', { visible: visibleCount, total: counts.all })}
      </span>
    </div>
  )
}

function TimelineEmptyState() {
  const t = useTranslations('task')

  return (
    <div className='flex h-64 flex-col items-center justify-center px-6 text-center'>
      <div className='mb-3 flex size-11 items-center justify-center rounded-full bg-muted'>
        <Clock3Icon className='size-5 text-muted-foreground' />
      </div>
      <p className='text-sm font-medium'>{t('timeline.empty')}</p>
      <p className='mt-1 max-w-sm text-xs text-muted-foreground'>
        {t('timeline.emptyHint')}
      </p>
    </div>
  )
}

interface TimelineTick {
  percent: number
  time: number
}

interface TimelineChartProps {
  items: TimelineItem[]
  ticks: TimelineTick[]
  rangeHours: RangeHours
}

function TimelineChart({ items, ticks, rangeHours }: TimelineChartProps) {
  const locale = useLocale()
  const t = useTranslations('task')
  const axisFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: rangeHours > 24 ? 'numeric' : undefined,
        day: rangeHours > 24 ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    [locale, rangeHours],
  )

  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[920px]'>
        <div className='grid grid-cols-[280px_minmax(640px,1fr)] border-b bg-muted/10'>
          <div className='sticky left-0 z-20 flex h-14 items-end border-r bg-card px-5 pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
            {t('timeline.taskColumn')}
          </div>
          <div className='relative h-14'>
            {ticks.map((tick, index) => (
              <div
                key={tick.time}
                className='absolute inset-y-0 border-l border-dashed border-border/70'
                style={{ left: `${tick.percent}%` }}
              >
                <span
                  className={cn(
                    'absolute bottom-3 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground',
                    index === 0 && 'translate-x-2',
                    index > 0 && index < ticks.length - 1 && '-translate-x-1/2',
                    index === ticks.length - 1 &&
                      '-translate-x-[calc(100%+0.5rem)]',
                  )}
                >
                  {index === ticks.length - 1
                    ? t('timeline.now')
                    : axisFormatter.format(tick.time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <TooltipProvider delayDuration={150}>
          <div className='max-h-[416px] overflow-y-auto'>
            {items.map((item) => (
              <TimelineRow key={item.task.uid} item={item} ticks={ticks} />
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}

interface TimelineRowProps {
  item: TimelineItem
  ticks: TimelineTick[]
}

function TimelineRow({ item, ticks }: TimelineRowProps) {
  const locale = useLocale()
  const t = useTranslations('task')
  const appearance = STATUS_APPEARANCE[item.task.status]
  const StatusIcon = appearance.icon
  const statusOption = STATUS_OPTIONS.find(
    (option) => option.value === item.task.status,
  )
  const durationSeconds = Math.max(
    0,
    Math.floor((item.endTime - item.startTime) / 1000),
  )
  const duration =
    durationSeconds < 60
      ? t('duration.seconds', { seconds: durationSeconds })
      : durationSeconds < 3600
        ? t('duration.minutesSeconds', {
            minutes: Math.floor(durationSeconds / 60),
            seconds: durationSeconds % 60,
          })
        : t('duration.hoursMinutes', {
            hours: Math.floor(durationSeconds / 3600),
            minutes: Math.floor((durationSeconds % 3600) / 60),
          })
  const dateTimeFormatter = useMemo(
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
  const startedAt = dateTimeFormatter.format(item.startTime)

  return (
    <div className='group/row grid grid-cols-[280px_minmax(640px,1fr)] border-b last:border-b-0 hover:bg-muted/20'>
      <div className='sticky left-0 z-10 flex h-16 min-w-0 items-center gap-3 border-r bg-card px-5 group-hover/row:bg-muted/20'>
        <StatusIcon
          className={cn(
            'size-4 shrink-0',
            appearance.iconClassName,
            item.task.status === Status.RUNNING &&
              'animate-spin motion-reduce:animate-none',
          )}
        />
        <div className='min-w-0'>
          <Link
            href={`/task/${item.task.uid}`}
            className='block truncate text-sm font-medium hover:underline'
          >
            {item.task.name}
          </Link>
          <p className='mt-0.5 truncate text-xs text-muted-foreground'>
            {item.task.run_instance.name}
          </p>
        </div>
      </div>

      <div className='relative h-16 overflow-hidden'>
        {ticks.map((tick) => (
          <div
            key={tick.time}
            className='absolute inset-y-0 border-l border-dashed border-border/60'
            style={{ left: `${tick.percent}%` }}
          />
        ))}
        <div className='absolute inset-y-0 right-0 w-px bg-primary/70' />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/task/${item.task.uid}`}
              aria-label={t('timeline.openTask', { name: item.task.name })}
              className={cn(
                'absolute top-[18px] flex h-7 min-w-2 items-center overflow-hidden rounded-md border px-2 text-[11px] font-medium shadow-xs transition-[filter,transform] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                appearance.barClassName,
              )}
              style={{
                left: `${Math.min(item.startPercent, 99.5)}%`,
                width: `max(${item.widthPercent}%, 10px)`,
                maxWidth: `${Math.max(0.5, 100 - item.startPercent)}%`,
              }}
            >
              {item.task.status === Status.RUNNING ? (
                <span className='absolute inset-0 animate-pulse bg-sky-500/10 motion-reduce:animate-none' />
              ) : null}
              <span className='relative truncate'>{duration}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            sideOffset={8}
            className='w-72 border bg-popover p-3 text-popover-foreground shadow-xl'
          >
            <div className='space-y-2'>
              <div className='flex items-start justify-between gap-3'>
                <p className='font-medium leading-snug'>{item.task.name}</p>
                <span className='shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                  {statusOption ? t(`status.${statusOption.labelKey}`) : null}
                </span>
              </div>
              <p className='truncate text-muted-foreground'>
                {item.task.run_instance.name}
              </p>
              <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t pt-2 text-[11px]'>
                <dt className='text-muted-foreground'>
                  {t('timeline.startedAt')}
                </dt>
                <dd className='text-right tabular-nums'>{startedAt}</dd>
                <dt className='text-muted-foreground'>
                  {t('timeline.duration')}
                </dt>
                <dd className='text-right tabular-nums'>{duration}</dd>
                <dt className='text-muted-foreground'>
                  {t('timeline.ownerLabel')}
                </dt>
                <dd className='truncate text-right'>
                  {item.task.owner.username}
                </dd>
              </dl>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div>
      <div className='grid h-14 grid-cols-[280px_1fr] border-b'>
        <div className='flex items-end border-r px-5 pb-3'>
          <Skeleton className='h-3 w-24' />
        </div>
        <div className='flex items-end justify-between px-4 pb-3'>
          {['tick-1', 'tick-2', 'tick-3', 'tick-4', 'tick-5'].map((key) => (
            <Skeleton key={key} className='h-3 w-10' />
          ))}
        </div>
      </div>
      {['row-1', 'row-2', 'row-3', 'row-4'].map((key, index) => (
        <div key={key} className='grid h-16 grid-cols-[280px_1fr] border-b'>
          <div className='flex items-center gap-3 border-r px-5'>
            <Skeleton className='size-4 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-3.5 w-32' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
          <div className='flex items-center px-8'>
            <Skeleton
              className='h-7 rounded-md'
              style={{
                width: `${24 + index * 11}%`,
                marginLeft: `${index * 8}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
