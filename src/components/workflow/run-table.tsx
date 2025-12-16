'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import {Status} from "@/types/run";
import {useRunCount, useRuns} from "@/hooks/use-run";

// 状态配置
const statusConfig = {
  [Status.WAITING]: {
    label: '等待中',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  [Status.RUNNING]: {
    label: '运行中',
    variant: 'default' as const,
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  [Status.ERROR]: {
    label: '失败',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  [Status.SUCCESS]: {
    label: '成功',
    variant: 'outline' as const,
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
}

// 格式化时间
function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN })
  } catch {
    return '-'
  }
}

// 计算运行时长
function calculateDuration(startTime?: string, endTime?: string) {
  if (!startTime) return '-'
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) return `${duration}s`
  if (duration < 3600) return `${Math.floor(duration / 60)}m`
  const hours = Math.floor(duration / 3600)
  const mins = Math.floor((duration % 3600) / 60)
  return `${hours}h ${mins}m`
}

export function RunTables() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const limit = 10

  const { data: runCount = 0 } = useRunCount()
  const { data: runs = [], isLoading } = useRuns(page * limit, limit)

  // 过滤运行实例
  const filteredRuns = runs.filter((run) => {
    if (statusFilter === 'all') return true
    return run.status === Number(statusFilter)
  })

  const totalPages = Math.ceil(runCount / limit)

  return (
    <div className='space-y-4'>
      {/* 筛选器 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>状态筛选:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部</SelectItem>
              <SelectItem value={String(Status.WAITING)}>等待中</SelectItem>
              <SelectItem value={String(Status.RUNNING)}>运行中</SelectItem>
              <SelectItem value={String(Status.SUCCESS)}>成功</SelectItem>
              <SelectItem value={String(Status.ERROR)}>失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='text-sm text-muted-foreground'>
          共 {runCount} 个工作流
        </div>
      </div>

      {/* 表格 */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead className='w-[280px]'>工作流名称</TableHead>
              <TableHead className='w-[120px]'>状态</TableHead>
              <TableHead className='w-[180px]'>进度</TableHead>
              <TableHead className='w-[100px]'>创建者</TableHead>
              <TableHead className='w-[140px]'>开始时间</TableHead>
              <TableHead className='w-[100px]'>运行时长</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 加载骨架屏
              [...Array(5)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: no need
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className='h-5 w-[200px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-6 w-[80px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-full' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[60px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[100px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[60px]' />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredRuns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center'>
                  <div className='flex flex-col items-center justify-center text-muted-foreground'>
                    <Clock className='h-8 w-8 mb-2' />
                    <p>暂无工作流运行实例</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRuns.map((run) => {
                const config = statusConfig[run.status]
                const Icon = config.icon
                const taskStats = run.task_statistics
                const progress = taskStats
                  ? ((taskStats.success || 0) / taskStats.total) * 100
                  : 0

                return (
                  <TableRow
                    key={run.uid}
                    className='hover:bg-muted/50 transition-colors'
                  >
                    {/* 工作流名称 */}
                    <TableCell className='font-medium'>
                      <Link
                        href={`/workflow/${run.uid}`}
                        className='hover:underline line-clamp-2'
                      >
                        {run.name}
                      </Link>
                    </TableCell>

                    {/* 状态 */}
                    <TableCell>
                      <Badge variant={config.variant} className='gap-1'>
                        <Icon
                          className={`h-3 w-3 ${
                            config.icon === Loader2 ? 'animate-spin' : ''
                          }`}
                        />
                        {config.label}
                      </Badge>
                    </TableCell>

                    {/* 进度 */}
                    <TableCell>
                      {taskStats ? (
                        <div className='space-y-1'>
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <span>
                              {taskStats.success || 0}/{taskStats.total}
                            </span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className='h-1.5' />
                        </div>
                      ) : (
                        <span className='text-sm text-muted-foreground'>-</span>
                      )}
                    </TableCell>

                    {/* 创建者 */}
                    <TableCell className='text-sm'>
                      {run.owner.username}
                    </TableCell>

                    {/* 开始时间 */}
                    <TableCell className='text-sm'>
                      {formatDateTime(run.start_time)}
                    </TableCell>

                    {/* 运行时长 */}
                    <TableCell className='text-sm'>
                      {calculateDuration(run.start_time, run.end_time)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {!isLoading && totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            第 {page + 1} / {totalPages} 页
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              上一页
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              下一页
              <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
