'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import { useTaskCount, useTasks } from '@/hooks/use-task'
import { Status } from '@/types/run'

// 状态配置
const statusConfig = {
  [Status.WAITING]: {
    label: '等待中',
    variant: 'secondary' as const,
    icon: ClockIcon,
    color: 'text-yellow-600',
  },
  [Status.RUNNING]: {
    label: '运行中',
    variant: 'default' as const,
    icon: Loader2Icon,
    color: 'text-blue-600',
  },
  [Status.ERROR]: {
    label: '失败',
    variant: 'destructive' as const,
    icon: XCircleIcon,
    color: 'text-red-600',
  },
  [Status.SUCCESS]: {
    label: '成功',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
    color: 'text-green-600',
  },
}

// 格式化时间
function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
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
  if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
  const hours = Math.floor(duration / 3600)
  const mins = Math.floor((duration % 3600) / 60)
  return `${hours}h ${mins}m`
}

export function TaskTable() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const limit = 20

  const { data: taskCount = 0 } = useTaskCount()
  const { data: tasks = [], isLoading } = useTasks(page * limit, limit)

  // 过滤任务
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'all') return true
    return task.status === Number(statusFilter)
  })

  const totalPages = Math.ceil(taskCount / limit)

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
          共 {taskCount} 个任务
        </div>
      </div>

      {/* 表格 */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead className='w-[200px]'>任务名称</TableHead>
              <TableHead className='w-[200px]'>所属工作流</TableHead>
              <TableHead className='w-[100px]'>状态</TableHead>
              <TableHead className='w-[100px]'>创建者</TableHead>
              <TableHead className='w-[180px]'>创建时间</TableHead>
              <TableHead className='w-[180px]'>开始时间</TableHead>
              <TableHead className='w-[100px]'>运行时长</TableHead>
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
                  <TableCell>
                    <Skeleton className='h-5 w-[160px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[160px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-6 w-[80px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[60px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[140px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[140px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-[60px]' />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center'>
                  <div className='flex flex-col items-center justify-center text-muted-foreground'>
                    <ClockIcon className='size-8 mb-2' />
                    <p>暂无任务记录</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const config = statusConfig[task.status]
                const Icon = config.icon

                return (
                  <TableRow
                    key={task.uid}
                    className='hover:bg-muted/50 transition-colors'
                  >
                    {/* 任务名称 */}
                    <TableCell className='font-medium'>
                      <Link
                        href={`/task/${task.uid}`}
                        className='hover:underline line-clamp-1'
                      >
                        {task.name}
                      </Link>
                    </TableCell>

                    {/* 所属工作流 */}
                    <TableCell>
                      <Link
                        href={`/workflow/${task.run_instance.uid}`}
                        className='hover:underline text-sm text-muted-foreground line-clamp-1'
                      >
                        {task.run_instance.name}
                      </Link>
                    </TableCell>

                    {/* 状态 */}
                    <TableCell>
                      <Badge variant={config.variant} className='gap-1'>
                        <Icon
                          className={`size-3 ${
                            config.icon === Loader2Icon ? 'animate-spin' : ''
                          }`}
                        />
                        {config.label}
                      </Badge>
                    </TableCell>

                    {/* 创建者 */}
                    <TableCell className='text-sm'>
                      {task.owner.username}
                    </TableCell>

                    {/* 创建时间 */}
                    <TableCell className='text-sm'>
                      {formatDateTime(task.create_time)}
                    </TableCell>

                    {/* 开始时间 */}
                    <TableCell className='text-sm'>
                      {formatDateTime(task.start_time)}
                    </TableCell>

                    {/* 运行时长 */}
                    <TableCell className='text-sm'>
                      {calculateDuration(task.start_time, task.end_time)}
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
              <ChevronLeftIcon className='size-4 mr-1' />
              上一页
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              下一页
              <ChevronRightIcon className='size-4 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
