'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecentTasks } from '@/hooks/use-task'
import { Status } from '@/types/run'
import type { SimpleTaskPublic } from '@/types/task'

// 状态颜色配置
const statusColors = {
  [Status.WAITING]: 'bg-yellow-500',
  [Status.RUNNING]: 'bg-blue-500',
  [Status.ERROR]: 'bg-red-500',
  [Status.SUCCESS]: 'bg-green-500',
}

interface TimelineTask {
  task: SimpleTaskPublic
  startPercent: number
  widthPercent: number
  row: number
}

export function TaskTimeline() {
  const { data: tasks = [], isLoading } = useRecentTasks(24) // 获取最近24小时的任务

  // 计算时间线数据
  const timelineData = useMemo(() => {
    if (tasks.length === 0)
      return { tasks: [], timeLabels: [], minTime: 0, maxTime: 0 }

    // 过滤有开始时间的任务
    const validTasks = tasks.filter((task) => task.start_time)

    if (validTasks.length === 0)
      return { tasks: [], timeLabels: [], minTime: 0, maxTime: 0 }

    // 找出时间范围
    const times = validTasks.map((task) => new Date(task.start_time!).getTime())
    const endTimes = validTasks.map((task) =>
      task.end_time ? new Date(task.end_time).getTime() : Date.now(),
    )

    const minTime = Math.min(...times)
    const maxTime = Math.max(...endTimes, Date.now())
    const timeRange = maxTime - minTime

    // 计算每个任务的位置和宽度
    const positioned: TimelineTask[] = []
    const rows: number[] = [] // 每行的最后结束时间

    for (const task of validTasks) {
      const startTime = new Date(task.start_time!).getTime()
      const endTime = task.end_time
        ? new Date(task.end_time).getTime()
        : Date.now()

      const startPercent = ((startTime - minTime) / timeRange) * 100
      const widthPercent = ((endTime - startTime) / timeRange) * 100

      // 找到可以放置的行
      let row = 0
      while (row < rows.length && rows[row] > startTime) {
        row++
      }

      positioned.push({
        task,
        startPercent,
        widthPercent: Math.max(widthPercent, 1), // 最小宽度1%
        row,
      })

      rows[row] = endTime
    }

    // 生成时间标签
    const timeLabels: { time: string; percent: number }[] = []
    const labelCount = 6
    for (let i = 0; i < labelCount; i++) {
      const time = minTime + (timeRange * i) / (labelCount - 1)
      timeLabels.push({
        time: format(new Date(time), 'HH:mm', { locale: zhCN }),
        percent: (i / (labelCount - 1)) * 100,
      })
    }

    return { tasks: positioned, timeLabels, minTime, maxTime }
  }, [tasks])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-48 w-full' />
        </CardContent>
      </Card>
    )
  }

  if (timelineData.tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center h-48 text-muted-foreground'>
            <Clock className='h-12 w-12 mb-3' />
            <p>最近24小时内暂无任务运行记录</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxRow = Math.max(...timelineData.tasks.map((t) => t.row))
  const rowHeight = 32

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <span>任务时间线</span>
          <span className='text-sm font-normal text-muted-foreground'>
            最近24小时 · {tasks.length} 个任务
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 时间线主体 */}
        <div className='relative bg-muted/30 rounded-lg p-4'>
          {/* 时间刻度 */}
          <div className='relative h-6 mb-2 border-b'>
            {timelineData.timeLabels.map((label, i) => (
              <div
                key={i}
                className='absolute top-0 text-xs text-muted-foreground'
                style={{
                  left: `${label.percent}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {label.time}
              </div>
            ))}
          </div>

          {/* 任务条 */}
          <div
            className='relative'
            style={{ height: `${(maxRow + 1) * rowHeight}px` }}
          >
            {timelineData.tasks.map((item, index) => {
              const color = statusColors[item.task.status]
              const isRunning = item.task.status === Status.RUNNING

              return (
                <div
                  key={item.task.uid}
                  className={`absolute ${color} rounded-md transition-all hover:opacity-80 cursor-pointer group`}
                  style={{
                    left: `${item.startPercent}%`,
                    width: `${item.widthPercent}%`,
                    top: `${item.row * rowHeight}px`,
                    height: `${rowHeight - 8}px`,
                  }}
                  title={`${item.task.name} - ${item.task.run_instance.name}`}
                >
                  {/* 任务名称 */}
                  <div className='absolute inset-0 flex items-center px-2 text-xs text-white font-medium overflow-hidden'>
                    {isRunning && (
                      <Loader2 className='h-3 w-3 mr-1 animate-spin flex-shrink-0' />
                    )}
                    <span className='truncate'>{item.task.name}</span>
                  </div>

                  {/* 悬浮提示 */}
                  <div className='absolute bottom-full left-0 mb-2 hidden group-hover:block z-10'>
                    <div className='bg-popover text-popover-foreground p-2 rounded-md shadow-lg text-xs whitespace-nowrap border'>
                      <div className='font-medium'>{item.task.name}</div>
                      <div className='text-muted-foreground mt-1'>
                        工作流: {item.task.run_instance.name}
                      </div>
                      <div className='text-muted-foreground'>
                        创建者: {item.task.owner.username}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 当前时间线 */}
          <div
            className='absolute top-8 bottom-4 w-0.5 bg-primary'
            style={{
              left: `${((Date.now() - timelineData.minTime) / (timelineData.maxTime - timelineData.minTime)) * 100}%`,
            }}
          >
            <div className='absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-primary' />
          </div>
        </div>

        {/* 图例 */}
        <div className='flex items-center justify-center gap-6 mt-4 text-sm'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-green-500 rounded' />
            <span className='text-muted-foreground'>成功</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-blue-500 rounded' />
            <span className='text-muted-foreground'>运行中</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-yellow-500 rounded' />
            <span className='text-muted-foreground'>等待中</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-red-500 rounded' />
            <span className='text-muted-foreground'>失败</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
