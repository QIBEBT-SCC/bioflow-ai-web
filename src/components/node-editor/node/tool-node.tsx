'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToolArg } from '@/hooks/use-tool'

export const ToolNode = memo(function ToolNode() {
  const nodeId = useNodeId() ?? ''
  const { updateNodeData } = useReactFlow()
  const nodeData =
    useNodesData<Node<{ resource_uid: string; args: string }, 'tool'>>(nodeId)

  const { data: toolData, isLoading } = useToolArg(
    nodeData?.data.resource_uid ?? '',
  )
  const [args, setArgs] = useState<string>(nodeData?.data.args ?? '')

  // 同步外部数据变化到本地state
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.args !== undefined && nodeData.data.args !== args) {
      setArgs(nodeData.data.args)
    }
  }, [nodeData?.data.args])

  // 初始化参数：只在工具数据加载完成且当前参数为空时同步可修改的静态参数
  useEffect(() => {
    if (toolData && !args) {
      const modifiableParams = toolData.modifiable_static_params ?? ''
      if (modifiableParams) {
        setArgs(modifiableParams)
        updateNodeData(nodeId, { args: modifiableParams })
      }
    }
  }, [toolData, nodeId, updateNodeData, args])

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

  const immutableParams = toolData?.immutable_static_params ?? ''
  const hasImmutableParams = immutableParams.trim().length > 0

  if (isLoading)
    return (
      <BaseNode
        title='--'
        description='--'
        handles={handles}
        color={colorSchemes.pink}
        nodeComponent={
          <div className='p-3 space-y-3'>
            {hasImmutableParams && (
              <div>
                <Label className='pb-2 font-medium text-xs text-muted-foreground'>
                  不可变参数:
                </Label>
                <Textarea
                  className='h-[60px] w-full resize-none overflow-y-auto border-gray-200 text-sm bg-muted'
                  value='--'
                  disabled={true}
                />
              </div>
            )}
            <div>
              <Label className='pb-2 font-medium'>可修改参数:</Label>
              <Textarea
                className='h-[100px] w-full resize-none overflow-y-auto border-gray-200 text-sm focus-visible:ring focus-visible:ring-rose-400 focus-visible:ring-offset-2'
                placeholder='Enter arguments here...'
                value='--'
                disabled={true}
              />
            </div>
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
        <div className='nowheel p-3 space-y-3'>
          {hasImmutableParams && (
            <div>
              <Label className='pb-2 font-medium text-xs text-muted-foreground'>
                不可变参数:
              </Label>
              <Textarea
                className='h-[60px] w-full resize-none overflow-y-auto border-gray-200 text-sm bg-muted
                [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'
                value={immutableParams}
                disabled={true}
                spellCheck={false}
              />
            </div>
          )}
          <div>
            <Label className='pb-2 font-medium'>可修改参数:</Label>
            <Textarea
              className='h-[100px] w-full resize-none overflow-y-auto border-gray-200 text-sm
              focus-visible:ring focus-visible:ring-rose-400 focus-visible:ring-offset-2
              [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'
              placeholder='Enter arguments here...'
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              onBlur={handleBlur}
              spellCheck={false}
            />
          </div>
        </div>
      }
    />
  )
})
