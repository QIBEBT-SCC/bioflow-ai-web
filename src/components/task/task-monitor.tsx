'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ActivityIcon,
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskMonitor } from '@/hooks/use-task'

interface TaskMonitorProps {
  taskUid: string
}

// 格式化字节大小,自动选择合适的单位
function formatBytes(
  bytes: number,
  decimals = 2,
): { value: number; unit: string } {
  if (bytes === 0) return { value: 0, unit: 'B' }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return {
    value: Number.parseFloat((bytes / k ** i).toFixed(dm)),
    unit: sizes[i],
  }
}

export function TaskMonitor({ taskUid }: TaskMonitorProps) {
  const { data: monitors = [], isLoading } = useTaskMonitor(taskUid)
  const [smoothCurve, setSmoothCurve] = useState(true)

  // 计算平均值和最大值
  const stats = useMemo(() => {
    if (monitors.length === 0) {
      return {
        avgCpu: 0,
        maxCpu: 0,
        avgMem: 0,
        maxMem: 0,
        avgMemUsed: 0,
        maxMemUsed: 0,
        avgIoIn: 0,
        maxIoIn: 0,
        avgIoOut: 0,
        maxIoOut: 0,
      }
    }

    const sum = monitors.reduce(
      (acc, m) => ({
        cpu: acc.cpu + m.cpu_usage,
        mem: acc.mem + m.mem_usage,
        memUsed: acc.memUsed + m.mem_used,
        ioIn: acc.ioIn + m.io_in,
        ioOut: acc.ioOut + m.io_out,
      }),
      { cpu: 0, mem: 0, memUsed: 0, ioIn: 0, ioOut: 0 },
    )

    return {
      avgCpu: sum.cpu / monitors.length,
      maxCpu: Math.max(...monitors.map((m) => m.cpu_usage)),
      avgMem: sum.mem / monitors.length,
      maxMem: Math.max(...monitors.map((m) => m.mem_usage)),
      avgMemUsed: sum.memUsed / monitors.length,
      maxMemUsed: Math.max(...monitors.map((m) => m.mem_used)),
      avgIoIn: sum.ioIn / monitors.length,
      maxIoIn: Math.max(...monitors.map((m) => m.io_in)),
      avgIoOut: sum.ioOut / monitors.length,
      maxIoOut: Math.max(...monitors.map((m) => m.io_out)),
    }
  }, [monitors])

  // 准备图表数据
  const chartData = useMemo(() => {
    return monitors.map((m) => ({
      time: format(new Date(m.time), 'HH:mm:ss', { locale: zhCN }),
      cpu: Number(m.cpu_usage.toFixed(2)),
      memory: Number(m.mem_usage.toFixed(2)),
      memUsed: m.mem_used / 1024, // GB
      ioIn: m.io_in, // MB
      ioOut: m.io_out, // MB
    }))
  }, [monitors])

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[...Array(4)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loading
          <div key={i} className='space-y-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-3 w-16' />
          </div>
        ))}
      </div>
    )
  }

  if (monitors.length === 0) {
    return (
      <div className='text-center text-muted-foreground py-12'>
        <ActivityIcon className='h-12 w-12 mx-auto mb-3 opacity-50' />
        <p>暂无监控数据</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* 统计卡片 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {/* CPU使用率 */}
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300'>
              <CpuIcon className='h-4 w-4' />
              CPU使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
              {stats.avgCpu.toFixed(2)}%
            </div>
            <p className='text-xs text-blue-600/70 dark:text-blue-400/70 mt-1'>
              峰值: {stats.maxCpu.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* 内存使用率 */}
        <Card className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300'>
              <MemoryStickIcon className='h-4 w-4' />
              内存使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-purple-600 dark:text-purple-400'>
              {stats.avgMem.toFixed(2)}%
            </div>
            <p className='text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>
              峰值: {stats.maxMem.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* 内存用量 */}
        <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300'>
              <MemoryStickIcon className='h-4 w-4' />
              内存用量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-green-600 dark:text-green-400'>
              {(stats.avgMemUsed / 1024).toFixed(2)} GB
            </div>
            <p className='text-xs text-green-600/70 dark:text-green-400/70 mt-1'>
              峰值: {(stats.maxMemUsed / 1024).toFixed(2)} GB
            </p>
          </CardContent>
        </Card>

        {/* IO统计 */}
        <Card className='bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300'>
              <HardDriveIcon className='h-4 w-4' />
              IO统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm space-y-1 text-orange-700 dark:text-orange-300'>
              <div className='flex justify-between'>
                <span className='text-orange-600/70 dark:text-orange-400/70'>
                  输入:
                </span>
                <span className='font-medium'>
                  {(() => {
                    const formatted = formatBytes(stats.avgIoIn * 1024 * 1024)
                    return `${formatted.value} ${formatted.unit}`
                  })()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-orange-600/70 dark:text-orange-400/70'>
                  输出:
                </span>
                <span className='font-medium'>
                  {(() => {
                    const formatted = formatBytes(stats.avgIoOut * 1024 * 1024)
                    return `${formatted.value} ${formatted.unit}`
                  })()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 曲线平滑开关 */}
      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setSmoothCurve(!smoothCurve)}
        >
          {smoothCurve ? '直线模式' : '平滑模式'}
        </Button>
      </div>

      {/* CPU 和内存使用率图表 */}
      <div>
        <h3 className='text-sm font-semibold mb-4'>CPU & 内存使用率趋势</h3>
        <div className='border rounded-lg p-4'>
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis
                dataKey='time'
                className='text-xs'
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className='text-xs'
                tick={{ fill: 'currentColor' }}
                label={{
                  value: '使用率 (%)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Area
                type={smoothCurve ? 'monotone' : 'linear'}
                dataKey='cpu'
                stroke='#3b82f6'
                strokeWidth={2}
                fill='#3b82f6'
                fillOpacity={0.2}
                name='CPU使用率'
                dot={false}
              />
              <Area
                type={smoothCurve ? 'monotone' : 'linear'}
                dataKey='memory'
                stroke='#a855f7'
                strokeWidth={2}
                fill='#a855f7'
                fillOpacity={0.2}
                name='内存使用率'
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 内存用量图表 */}
      <div>
        <h3 className='text-sm font-semibold mb-4'>内存用量趋势</h3>
        <div className='border rounded-lg p-4'>
          <ResponsiveContainer width='100%' height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis
                dataKey='time'
                className='text-xs'
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className='text-xs'
                tick={{ fill: 'currentColor' }}
                label={{
                  value: '内存 (GB)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => `${value.toFixed(2)} GB`}
              />
              <Legend />
              <Area
                type={smoothCurve ? 'monotone' : 'linear'}
                dataKey='memUsed'
                stroke='#10b981'
                strokeWidth={2}
                fill='#10b981'
                fillOpacity={0.2}
                name='内存用量'
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* IO 趋势图表 */}
      <div>
        <h3 className='text-sm font-semibold mb-4'>IO 读写趋势</h3>
        <div className='border rounded-lg p-4'>
          <ResponsiveContainer width='100%' height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis
                dataKey='time'
                className='text-xs'
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className='text-xs'
                tick={{ fill: 'currentColor' }}
                label={{ value: 'IO', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => {
                  const formatted = formatBytes(value * 1024 * 1024)
                  return `${formatted.value} ${formatted.unit}`
                }}
              />
              <Legend />
              <Area
                type={smoothCurve ? 'monotone' : 'linear'}
                dataKey='ioIn'
                stroke='#f97316'
                strokeWidth={2}
                fill='#f97316'
                fillOpacity={0.2}
                name='IO输入'
                dot={false}
              />
              <Area
                type={smoothCurve ? 'monotone' : 'linear'}
                dataKey='ioOut'
                stroke='#ef4444'
                strokeWidth={2}
                fill='#ef4444'
                fillOpacity={0.2}
                name='IO输出'
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
