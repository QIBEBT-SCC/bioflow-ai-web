'use client'

import {
  ActivityIcon,
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { StatTile } from '@/components/layout/stat-tile'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskMonitor } from '@/hooks/use-task'

const TaskMonitorCharts = dynamic(
  () =>
    import('./task-monitor-charts').then((m) => ({
      default: m.TaskMonitorCharts,
    })),
  { ssr: false },
)

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
  const locale = useLocale()
  const t = useTranslations('task.monitor')
  const { data: monitors = [], isLoading } = useTaskMonitor(taskUid)
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    [locale],
  )

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
      time: timeFormatter.format(new Date(m.time)),
      cpu: Number(m.cpu_usage.toFixed(2)),
      memory: Number(m.mem_usage.toFixed(2)),
      memUsed: m.mem_used / 1024, // GB
      ioIn: m.io_in, // MB
      ioOut: m.io_out, // MB
    }))
  }, [monitors, timeFormatter])

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {['sk-0', 'sk-1', 'sk-2', 'sk-3'].map((key) => (
          <div key={key} className='space-y-2'>
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
        <ActivityIcon className='size-12 mx-auto mb-3 opacity-50' />
        <p>{t('empty')}</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* 统计卡片 */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatTile icon={<CpuIcon />} label={t('cpuUsage')}>
          <div className='text-2xl font-semibold tabular-nums'>
            {stats.avgCpu.toFixed(2)}%
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('peak', { value: `${stats.maxCpu.toFixed(2)}%` })}
          </p>
        </StatTile>
        <StatTile icon={<MemoryStickIcon />} label={t('memoryUsage')}>
          <div className='text-2xl font-semibold tabular-nums'>
            {stats.avgMem.toFixed(2)}%
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('peak', { value: `${stats.maxMem.toFixed(2)}%` })}
          </p>
        </StatTile>
        <StatTile icon={<MemoryStickIcon />} label={t('memoryUsed')}>
          <div className='text-2xl font-semibold tabular-nums'>
            {(stats.avgMemUsed / 1024).toFixed(2)} GB
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('peak', {
              value: `${(stats.maxMemUsed / 1024).toFixed(2)} GB`,
            })}
          </p>
        </StatTile>
        <StatTile icon={<HardDriveIcon />} label={t('ioStats')}>
          <dl className='space-y-1 text-sm'>
            <div className='flex justify-between'>
              <dt className='text-muted-foreground'>{t('input')}</dt>
              <dd className='font-medium tabular-nums'>
                {(() => {
                  const formatted = formatBytes(stats.avgIoIn * 1024 * 1024)
                  return `${formatted.value} ${formatted.unit}`
                })()}
              </dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-muted-foreground'>{t('output')}</dt>
              <dd className='font-medium tabular-nums'>
                {(() => {
                  const formatted = formatBytes(stats.avgIoOut * 1024 * 1024)
                  return `${formatted.value} ${formatted.unit}`
                })()}
              </dd>
            </div>
          </dl>
        </StatTile>
      </div>

      <TaskMonitorCharts chartData={chartData} />
    </div>
  )
}
