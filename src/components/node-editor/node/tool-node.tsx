'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node.tsx'
import { colorSchemes } from '@/components/node-editor/node/color.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import { useToolArg } from '@/hooks/use-tool.tsx'

export const ToolNode = memo(function ToolNode() {
    const nodeId = useNodeId() ?? ''
    const { updateNodeData } = useReactFlow()
    const nodeData =
        useNodesData<Node<{ resource_uid: string; args: string }, 'tool'>>(
            nodeId,
        )

    const { data: toolData, isLoading } = useToolArg({
        uid: nodeData?.data.resource_uid ?? '',
    })
    const [args, setArgs] = useState<string>(nodeData?.data.args ?? '')

    // 同步外部数据变化到本地state
    useEffect(() => {
        if (nodeData?.data.args !== undefined && nodeData.data.args !== args) {
            setArgs(nodeData.data.args)
        }
    }, [nodeData?.data.args])

    // 初始化参数：只在工具数据加载完成且当前参数为空时同步默认参数
    useEffect(() => {
        if (toolData?.static_params !== undefined && !args) {
            const staticParams = toolData.static_params ?? ''
            setArgs(staticParams)
            updateNodeData(nodeId, { args: staticParams })
        }
    }, [toolData?.static_params, nodeId, updateNodeData, args])

    // 使用 useMemo 缓存 handles 对象，避免每次渲染都创建新对象
    const handles = useMemo(
        () => ({
            inputs: toolData?.input_handles || [],
            outputs: toolData?.output_handles || [],
        }),
        [toolData?.input_handles, toolData?.output_handles],
    )

    // 使用 useCallback 缓存 onBlur 回调
    const handleBlur = useCallback(() => {
        updateNodeData(nodeId, { args: args })
    }, [nodeId, args, updateNodeData])

    if (isLoading)
        return (
            <BaseNode
                title='--'
                description='--'
                handles={handles}
                color={colorSchemes.pink}
                nodeComponent={
                    <div className='p-3'>
                        <Label className='pb-2 font-medium'>Args:</Label>
                        <Textarea
                            className='h-[100px] w-full resize-none overflow-y-auto border-gray-200 text-sm focus-visible:ring-[2px] focus-visible:ring-rose-500 focus-visible:ring-offset-2'
                            placeholder='Enter arguments here...'
                            value='--'
                            disabled={true}
                        />
                    </div>
                }
            />
        )

    return (
        <BaseNode
            title={toolData?.name ?? '--'}
            description={toolData?.description ?? ''}
            handles={handles}
            color={colorSchemes.pink}
            nodeComponent={
                <div className='nowheel p-3'>
                    <Label className='pb-2 font-medium'>Args:</Label>
                    <Textarea
                        className='h-[100px] w-full resize-none overflow-y-auto border-gray-200 text-sm focus-visible:ring-[2px] focus-visible:ring-rose-500 focus-visible:ring-offset-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'
                        placeholder='Enter arguments here...'
                        value={args}
                        onChange={(e) => setArgs(e.target.value)}
                        onBlur={handleBlur}
                        spellCheck={false}
                    />
                </div>
            }
        />
    )
})
