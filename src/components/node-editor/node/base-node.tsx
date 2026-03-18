'use client'

import { Handle, Position, useNodeConnections, useNodeId } from '@xyflow/react'
import {
  CheckCircle2Icon,
  ClockIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import React, {
  forwardRef,
  type HTMLAttributes,
  memo,
  useCallback,
  useMemo,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { HandleDefine } from '@/types/node'
import type { RunData } from '@/types/run'
import { Status } from '@/types/run'

// 纯函数定义 - 避免在组件内部重复创建
const calculateMaxRows = (
  inputs: HandleDefine[],
  outputs: HandleDefine[],
): number => {
  return Math.max(inputs.length, outputs.length)
}

const calculateTopPos = (index: number): number => {
  return (index + 2) * 6
}

interface BaseNodeProps {
  title: string
  description: string
  handles: {
    inputs: HandleDefine[]
    outputs: HandleDefine[]
  }
  color: {
    primary: string
    border: string
    bg: string
    indicatorColors: string[]
  }
  nodeComponent: React.ReactNode
  runData?: RunData
}

const BaseNode = memo(function BaseNode({
  title,
  description,
  handles,
  color,
  nodeComponent,
  runData,
}: BaseNodeProps) {
  const nodeId = useNodeId()
  const connections = useNodeConnections()

  const maxRows = useMemo(
    () => calculateMaxRows(handles.inputs, handles.outputs),
    [handles.inputs, handles.outputs],
  )

  const isConnected = useCallback(
    (handleId: string) => {
      return connections.some(
        (connection) =>
          connection.sourceHandle === handleId ||
          connection.targetHandle === handleId,
      )
    },
    [connections],
  )

  const handlesElements = useMemo(
    () =>
      Array.from({ length: maxRows }).map((_, index) => {
        const input = handles.inputs[index]
        const output = handles.outputs[index]

        // 使用 input 或 output 的 name 作为唯一 key
        const key =
          input && output
            ? `${input.name}-${output.name}`
            : input
              ? `in-${input.name}`
              : output
                ? `out-${output.name}`
                : `empty-${index}`

        return (
          <div key={key}>
            {/* Input Handle */}
            {input && (
              <>
                <Handle
                  id={`${nodeId}-in-${input.name}`}
                  type='target'
                  position={Position.Left}
                  className={cn(
                    '!left-3 h-2.5 w-2.5 rounded-full border !border-border !bg-background shadow-xs transition-all duration-200',
                    'hover:!border-primary/50 hover:!bg-primary/10 hover:!scale-110',
                    isConnected(`${nodeId}-in-${input.name}`) &&
                      '!border-teal-500 !bg-teal-100',
                  )}
                  style={{
                    top: `calc(var(--spacing) * ${calculateTopPos(index)})`,
                  }}
                />
                <span
                  className='absolute left-6 -translate-y-1/2 select-none truncate text-xs text-muted-foreground'
                  style={{
                    top: `calc(var(--spacing) * ${calculateTopPos(index)})`,
                  }}
                >
                  {input.name.replace('_', ' ')}
                </span>
              </>
            )}

            {/* Output Handle */}
            {output && (
              <>
                <span
                  className='absolute right-6 -translate-y-1/2 select-none truncate text-end text-xs text-muted-foreground'
                  style={{
                    top: `calc(var(--spacing) * ${calculateTopPos(index)})`,
                  }}
                >
                  {output.name.replace('_', ' ')}
                </span>
                <Handle
                  id={`${nodeId}-out-${output.name}`}
                  type='source'
                  position={Position.Right}
                  className={cn(
                    '!right-3 h-2.5 w-2.5 rounded-full border border-border !bg-background shadow-xs transition-all duration-200',
                    'hover:!border-primary/50 hover:!bg-primary/10 hover:!scale-110',
                    isConnected(`${nodeId}-out-${output.name}`) &&
                      '!border-indigo-500 !bg-indigo-100',
                  )}
                  style={{
                    top: `calc(var(--spacing) * ${calculateTopPos(index)})`,
                  }}
                />
              </>
            )}
          </div>
        )
      }),
    [maxRows, handles.inputs, handles.outputs, nodeId, isConnected],
  )

  const separatorStyle = useMemo(
    () => ({
      paddingTop: `calc(var(--spacing) * ${6 * maxRows})`,
    }),
    [maxRows],
  )

  return (
    <NodeCard className={cn('border-t-4', color.border)}>
      <NodeCardHeader className={cn(color.bg, 'border-b border-border/50')}>
        <NodeTitle className={color.primary}>{title}</NodeTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button className='text-muted-foreground/70 transition-colors !bg-transparent hover:text-foreground'>
              <InfoIcon className='h-3.5 w-3.5' />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </NodeCardHeader>
      <NodeCardContent>
        {handlesElements}
        {/* 调整分隔线样式 */}
        <div
          className='mb-2 border-b border-border/50 pb-3'
          style={separatorStyle}
        />

        {nodeComponent}
      </NodeCardContent>
      {/* 调整 footer 位置和样式 */}
      {runData && <RunStatusBar runData={runData} />}
    </NodeCard>
  )
})

const NodeCard = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          'relative min-h-[150px] w-[300px] font-sans',
          'rounded-xl border-x border-b border-border bg-white shadow-sm transition-shadow duration-200',
          'hover:shadow-md',
          // 选中样式优化：使用高对比度的中性色 ring + shadow，不改变 border 颜色
          '[&.selected]:ring-1 [&.selected]:ring-foreground [&.selected]:shadow-lg',
          className,
        )}
        {...props}
      />
    ),
  ),
)

const NodeCardHeader = memo(function NodeCardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // remove duplicate borders/colors here, handled by parent
        'nodeDragable flex h-8 items-center justify-between px-4',
        className,
      )}
      {...props}
    />
  )
})

const NodeTitle = memo(function NodeTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  // 字体加粗，颜色加深
  return <span className={cn('font-semibold text-sm', className)} {...props} />
})

const NodeCardContent = memo(function NodeCardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('pb-3', className)} {...props} />
})

const statusConfig = {
  [Status.WAITING]: {
    label: '等待中',
    icon: ClockIcon,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  [Status.RUNNING]: {
    label: '运行中',
    icon: Loader2Icon,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  [Status.SUCCESS]: {
    label: '成功',
    icon: CheckCircle2Icon,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  [Status.ERROR]: {
    label: '失败',
    icon: XCircleIcon,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

function formatTime(dateStr?: string) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  } catch {
    return null
  }
}

function calcDuration(start?: string, end?: string) {
  if (!start) return null
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const sec = Math.floor((e - s) / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

const RunStatusBar = memo(function RunStatusBar({
  runData,
}: {
  runData: RunData
}) {
  if (runData.status === undefined) return null
  const cfg = statusConfig[runData.status]
  const Icon = cfg.icon
  const startStr = formatTime(runData.start_time)
  const duration = calcDuration(runData.start_time, runData.end_time)

  return (
    <div
      className={cn(
        'border-t rounded-b-2xl px-3 py-2 text-xs flex flex-col gap-1',
        cfg.className,
      )}
    >
      <div className='flex items-center gap-1.5 font-medium'>
        <Icon
          className={cn(
            'h-3 w-3',
            runData.status === Status.RUNNING && 'animate-spin',
          )}
        />
        {cfg.label}
      </div>
      {startStr && (
        <div className='text-[10px] opacity-70 flex gap-2'>
          <span>开始 {startStr}</span>
          {duration && <span>耗时 {duration}</span>}
        </div>
      )}
    </div>
  )
})

export { BaseNode, NodeCard, NodeCardHeader, NodeTitle, NodeCardContent }
