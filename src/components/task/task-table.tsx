'use client'

import {
  BanIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  ListOrderedIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useTasks } from '@/hooks/use-task'
import { NodeRunStatusV2 } from '@/types/workflow-v2'

// 状态配置
const statusConfig = {
  [NodeRunStatusV2.PENDING]: {
    labelKey: 'pending',
    variant: 'secondary' as const,
    icon: ClockIcon,
    color: 'text-slate-600',
  },
  [NodeRunStatusV2.READY]: {
    labelKey: 'ready',
    variant: 'secondary' as const,
    icon: CircleDotIcon,
    color: 'text-amber-600',
  },
  [NodeRunStatusV2.QUEUED]: {
    labelKey: 'queued',
    variant: 'secondary' as const,
    icon: ListOrderedIcon,
    color: 'text-violet-600',
  },
  [NodeRunStatusV2.RUNNING]: {
    labelKey: 'running',
    variant: 'default' as const,
    icon: Loader2Icon,
    color: 'text-blue-600',
  },
  [NodeRunStatusV2.FAILED]: {
    labelKey: 'failed',
    variant: 'destructive' as const,
    icon: XCircleIcon,
    color: 'text-red-600',
  },
  [NodeRunStatusV2.SUCCEEDED]: {
    labelKey: 'succeeded',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
    color: 'text-green-600',
  },
  [NodeRunStatusV2.BLOCKED]: {
    labelKey: 'blocked',
    variant: 'outline' as const,
    icon: BanIcon,
    color: 'text-zinc-600',
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

export function TaskTable() {
  const locale = useLocale()
  const t = useTranslations('task')
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<NodeRunStatusV2 | 'all'>(
    'all',
  )
  const limit = 20

  const { data: taskPage, isLoading } = useTasks(
    page * limit,
    limit,
    statusFilter === 'all' ? undefined : statusFilter,
  )
  const tasks = taskPage?.data ?? []
  const taskCount = taskPage?.total ?? 0
  const dateFormatters = useMemo(
    () => ({
      compact: new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
      full: new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
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

  const totalPages = Math.ceil(taskCount / limit)

  return (
    <div className='space-y-4'>
      <TaskTableToolbar
        statusFilter={statusFilter}
        taskCount={taskCount}
        onStatusChange={(status) => {
          setStatusFilter(status)
          setPage(0)
        }}
      />

      {/* 表格 */}
      <div className='overflow-hidden rounded-xl border bg-card [&_[data-slot=table-container]]:overflow-x-hidden'>
        <Table className='table-fixed'>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead className='w-[32%] px-3 md:w-[22%] lg:w-[20%] xl:w-[18%]'>
                {t('table.taskName')}
              </TableHead>
              <TableHead className='w-[26%] px-3 md:w-[20%] lg:w-[18%] xl:w-[17%]'>
                {t('table.workflow')}
              </TableHead>
              <TableHead className='w-[18%] px-3 md:w-[13%] lg:w-[11%] xl:w-[10%]'>
                {t('table.status')}
              </TableHead>
              <TableHead className='hidden px-3 xl:table-cell xl:w-[10%]'>
                {t('table.owner')}
              </TableHead>
              <TableHead className='hidden px-3 lg:table-cell lg:w-[17%] xl:w-[15%]'>
                {t('table.createdAt')}
              </TableHead>
              <TableHead className='hidden px-3 md:table-cell md:w-[16%] lg:w-[17%] xl:w-[15%]'>
                {t('table.startedAt')}
              </TableHead>
              <TableHead className='w-[24%] px-3 md:w-[13%] lg:w-[17%] xl:w-[15%]'>
                {t('table.duration')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 加载骨架屏
              [
                'sk-0',
                'sk-1',
                'sk-2',
                'sk-3',
                'sk-4',
                'sk-5',
                'sk-6',
                'sk-7',
                'sk-8',
                'sk-9',
              ].map((key) => (
                <TableRow key={key}>
                  <TableCell className='overflow-hidden px-3'>
                    <Skeleton className='h-5 w-full max-w-40' />
                  </TableCell>
                  <TableCell className='overflow-hidden px-3'>
                    <Skeleton className='h-5 w-full max-w-36' />
                  </TableCell>
                  <TableCell className='overflow-hidden px-3'>
                    <Skeleton className='h-6 w-full max-w-20' />
                  </TableCell>
                  <TableCell className='hidden overflow-hidden px-3 xl:table-cell'>
                    <Skeleton className='h-5 w-full max-w-16' />
                  </TableCell>
                  <TableCell className='hidden overflow-hidden px-3 lg:table-cell'>
                    <Skeleton className='h-5 w-full max-w-28' />
                  </TableCell>
                  <TableCell className='hidden overflow-hidden px-3 md:table-cell'>
                    <Skeleton className='h-5 w-full max-w-28' />
                  </TableCell>
                  <TableCell className='overflow-hidden px-3'>
                    <Skeleton className='h-5 w-full max-w-16' />
                  </TableCell>
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center'>
                  <div className='flex flex-col items-center justify-center text-muted-foreground'>
                    <ClockIcon className='size-8 mb-2' />
                    <p>{t('table.empty')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const config = statusConfig[task.status]
                const Icon = config.icon

                return (
                  <TableRow
                    key={task.uid}
                    className='hover:bg-muted/50 transition-colors'
                  >
                    {/* 任务名称 */}
                    <TableCell className='overflow-hidden px-3 font-medium'>
                      <Link
                        href={`/task/${task.uid}`}
                        title={task.name}
                        className='block truncate hover:underline'
                      >
                        {task.name}
                      </Link>
                    </TableCell>

                    {/* 所属工作流 */}
                    <TableCell className='overflow-hidden px-3'>
                      <Link
                        href={
                          task.project_id
                            ? `/project/${task.project_id}/${task.run_uid}`
                            : `/workflow/${task.run_uid}`
                        }
                        title={task.run_name}
                        className='block truncate text-sm text-muted-foreground hover:underline'
                      >
                        {task.run_name}
                      </Link>
                    </TableCell>

                    {/* 状态 */}
                    <TableCell className='overflow-hidden px-3'>
                      <Badge
                        variant={config.variant}
                        title={t(`status.${config.labelKey}`)}
                        className='max-w-full gap-1'
                      >
                        <Icon
                          className={`size-3 ${
                            task.status === NodeRunStatusV2.RUNNING
                              ? 'animate-spin'
                              : ''
                          }`}
                        />
                        <span className='hidden truncate sm:inline'>
                          {t(`status.${config.labelKey}`)}
                        </span>
                      </Badge>
                    </TableCell>

                    {/* 创建者 */}
                    <TableCell className='hidden overflow-hidden px-3 text-sm xl:table-cell'>
                      <span
                        className='block truncate'
                        title={task.owner_username}
                      >
                        {task.owner_username}
                      </span>
                    </TableCell>

                    {/* 创建时间 */}
                    <TableCell
                      title={formatDateTime(
                        dateFormatters.full,
                        task.create_time,
                      )}
                      className='hidden overflow-hidden px-3 text-sm tabular-nums lg:table-cell'
                    >
                      <span className='block truncate'>
                        {formatDateTime(
                          dateFormatters.compact,
                          task.create_time,
                        )}
                      </span>
                    </TableCell>

                    {/* 开始时间 */}
                    <TableCell
                      title={formatDateTime(
                        dateFormatters.full,
                        task.start_time,
                      )}
                      className='hidden overflow-hidden px-3 text-sm tabular-nums md:table-cell'
                    >
                      <span className='block truncate'>
                        {formatDateTime(
                          dateFormatters.compact,
                          task.start_time,
                        )}
                      </span>
                    </TableCell>

                    {/* 运行时长 */}
                    <TableCell className='overflow-hidden px-3 text-sm tabular-nums'>
                      <span
                        className='block truncate'
                        title={formatDuration(task.start_time, task.end_time)}
                      >
                        {formatDuration(task.start_time, task.end_time)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 ? (
        <TaskTablePagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}

interface TaskTableToolbarProps {
  statusFilter: NodeRunStatusV2 | 'all'
  taskCount: number
  onStatusChange: (status: NodeRunStatusV2 | 'all') => void
}

function TaskTableToolbar({
  statusFilter,
  taskCount,
  onStatusChange,
}: TaskTableToolbarProps) {
  const t = useTranslations('task')

  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='flex min-w-0 items-center gap-2'>
        <span className='hidden shrink-0 text-sm text-muted-foreground sm:inline'>
          {t('table.statusFilter')}
        </span>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusChange(value as NodeRunStatusV2 | 'all')
          }
        >
          <SelectTrigger className='w-32 sm:w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('table.all')}</SelectItem>
            <SelectItem value={NodeRunStatusV2.PENDING}>
              {t('status.pending')}
            </SelectItem>
            <SelectItem value={NodeRunStatusV2.READY}>
              {t('status.ready')}
            </SelectItem>
            <SelectItem value={NodeRunStatusV2.QUEUED}>
              {t('status.queued')}
            </SelectItem>
            <SelectItem value={NodeRunStatusV2.RUNNING}>
              {t('status.running')}
            </SelectItem>
            <SelectItem value={NodeRunStatusV2.SUCCEEDED}>
              {t('status.succeeded')}
            </SelectItem>
            <SelectItem value={NodeRunStatusV2.FAILED}>
              {t('status.failed')}
            </SelectItem>
            <SelectItem value={NodeRunStatusV2.BLOCKED}>
              {t('status.blocked')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='shrink-0 text-sm text-muted-foreground'>
        {t('table.total', { count: taskCount })}
      </div>
    </div>
  )
}

interface TaskTablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function TaskTablePagination({
  page,
  totalPages,
  onPageChange,
}: TaskTablePaginationProps) {
  const t = useTranslations('task')

  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='text-sm text-muted-foreground'>
        {t('table.page', { current: page + 1, total: totalPages })}
      </div>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          aria-label={t('table.previous')}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          <ChevronLeftIcon className='size-4 sm:mr-1' />
          <span className='hidden sm:inline'>{t('table.previous')}</span>
        </Button>
        <Button
          variant='outline'
          size='sm'
          aria-label={t('table.next')}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          <span className='hidden sm:inline'>{t('table.next')}</span>
          <ChevronRightIcon className='size-4 sm:ml-1' />
        </Button>
      </div>
    </div>
  )
}
