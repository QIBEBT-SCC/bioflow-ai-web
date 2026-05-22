'use client'

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

interface ChartDataPoint {
  time: string
  cpu: number
  memory: number
  memUsed: number
  ioIn: number
  ioOut: number
}

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

const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
}

export function TaskMonitorCharts({
  chartData,
}: {
  chartData: ChartDataPoint[]
}) {
  return (
    <>
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
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area
                type='monotone'
                dataKey='cpu'
                stroke='#3b82f6'
                strokeWidth={2}
                fill='#3b82f6'
                fillOpacity={0.2}
                name='CPU使用率'
                dot={false}
              />
              <Area
                type='monotone'
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
                contentStyle={tooltipStyle}
                formatter={(value: number) => `${value.toFixed(2)} GB`}
              />
              <Legend />
              <Area
                type='monotone'
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
                contentStyle={tooltipStyle}
                formatter={(value: number) => {
                  const formatted = formatBytes(value * 1024 * 1024)
                  return `${formatted.value} ${formatted.unit}`
                }}
              />
              <Legend />
              <Area
                type='monotone'
                dataKey='ioIn'
                stroke='#f97316'
                strokeWidth={2}
                fill='#f97316'
                fillOpacity={0.2}
                name='IO输入'
                dot={false}
              />
              <Area
                type='monotone'
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
    </>
  )
}
