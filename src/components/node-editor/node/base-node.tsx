'use client'

import { Handle, Position, useNodeConnections, useNodeId } from '@xyflow/react'
import { InfoIcon } from 'lucide-react'
import React, {
    forwardRef,
    type HTMLAttributes,
    memo,
    useCallback,
    useMemo,
} from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet.tsx'
import { cn } from '@/lib/utils.ts'
import type { HandleDefine } from '@/types/node.tsx'

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
        gradient: string
        indicatorColors: string[]
    }
    nodeComponent: React.ReactNode
}

const BaseNode = memo(function BaseNode({
    title,
    description,
    handles,
    color,
    nodeComponent,
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

                // 使用 input 或 output 的 name 作为唯一 key，如果都存在则组合使用
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
                                        '!left-3 h-3 w-3 rounded-full border-2 border-green-600 shadow-sm transition-all duration-200 hover:scale-110',
                                        isConnected(
                                            `${nodeId}-in-${input.name}`,
                                        )
                                            ? '!bg-green-400'
                                            : '!bg-white',
                                    )}
                                    style={{
                                        top: `calc(var(--spacing) * ${calculateTopPos(index)})`,
                                    }}
                                />
                                <span
                                    className='-translate-y-1/2 absolute left-6 transform truncate text-gray-600 text-xs'
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
                                    className='-translate-y-1/2 absolute right-6 transform truncate text-gray-600 text-xs'
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
                                        '!right-3 h-3 w-3 rounded-full border-2 border-blue-600 shadow-sm transition-all duration-200 hover:scale-110',
                                        isConnected(
                                            `${nodeId}-out-${output.name}`,
                                        )
                                            ? '!bg-blue-400'
                                            : '!bg-white',
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

    const indicators = useMemo(
        () =>
            color.indicatorColors.map((colorClass, index) => (
                <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: no need
                    key={index}
                    className={cn('h-2 w-2 rounded-full', colorClass)}
                ></div>
            )),
        [color.indicatorColors],
    )

    return (
        <NodeCard>
            <NodeCardHeader className={color.gradient}>
                <NodeTitle className='text-white'>{title}</NodeTitle>
                <Sheet>
                    <SheetTrigger>
                        <InfoIcon className='h-3 w-3 text-gray-300' />
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
                <div
                    className='border-gray-100 border-b pb-3'
                    style={separatorStyle}
                />

                {nodeComponent}
            </NodeCardContent>
            <NodeCardFooter>{indicators}</NodeCardFooter>
        </NodeCard>
    )
})

const NodeCard = memo(
    forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
        ({ className, ...props }, ref) => (
            <div
                ref={ref}
                className={cn(
                    'relative w-[300px] font-sans',
                    'min-h-[150px] rounded-sm border bg-white',
                    'overflow-hidden',
                    'hover:ring-1 hover:ring-blue-100',
                    // 节点选中状态样式已移至 index.css
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
                'nodeDragable flex h-8 flex-row items-center gap-1.5 px-3',
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
    return <span className={cn('font-medium text-sm', className)} {...props} />
})

const NodeCardContent = memo(function NodeCardContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return <div className={cn('pb-3', className)} {...props} />
})

const NodeCardFooter = memo(function NodeCardFooter({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'absolute right-2 bottom-2 flex space-x-1',
                className,
            )}
            {...props}
        />
    )
})

export {
    BaseNode,
    NodeCard,
    NodeCardHeader,
    NodeTitle,
    NodeCardContent,
    NodeCardFooter,
}
