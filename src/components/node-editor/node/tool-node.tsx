'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToolArg } from '@/hooks/use-tool'
import type { RunData } from '@/types/run'

export const ToolNode = memo(function ToolNode() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const { updateNodeData } = useReactFlow()
  const t = useTranslations('editor.tool_node')
  const nodeData =
    useNodesData<
      Node<
        { tool_uid: string; modifiable_params?: string; run_data?: RunData },
        'tool'
      >
    >(nodeId)

  const { data: toolData, isLoading } = useToolArg(
    nodeData?.data.tool_uid ?? '',
  )
  const [args, setArgs] = useState<string>(
    nodeData?.data.modifiable_params ?? '',
  )

  // 同步外部数据变化到本地state
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.modifiable_params !== undefined &&
      nodeData.data.modifiable_params !== args
    ) {
      setArgs(nodeData.data.modifiable_params)
    }
  }, [nodeData?.data.modifiable_params])

  // 初始化参数：只在工具数据加载完成且节点尚未存储 modifiable_params 时写入默认值
  // biome-ignore lint/correctness/useExhaustiveDependencies: nodeData.data.modifiable_params intentionally omitted — we only want to run once when toolData first loads
  useEffect(() => {
    if (toolData && nodeData?.data.modifiable_params === undefined) {
      const modifiableParams = toolData.modifiable_static_params ?? ''
      setArgs(modifiableParams)
      updateNodeData(nodeId, { modifiable_params: modifiableParams })
    }
  }, [toolData, nodeId, updateNodeData])

  // 使用 useMemo 缓存 handles 对象，避免每次渲染都创建新对象
  const handles = useMemo(
    () => ({
      inputs: toolData?.input_handles || [],
      outputs: toolData?.output_handles || [],
    }),
    [toolData?.input_handles, toolData?.output_handles],
  )

  // 使用 useCallback 缓存 onBlur 回调
  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { modifiable_params: args })
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
                  {t('immutable_params')}
                </Label>
                <Textarea
                  className='h-[60px] w-full resize-none overflow-y-auto border-gray-200 text-sm bg-muted'
                  value='--'
                  disabled={true}
                />
              </div>
            )}
            <div>
              <Label className='pb-2 font-medium'>
                {t('modifiable_params')}
              </Label>
              <Textarea
                className='h-[100px] w-full resize-none overflow-y-auto border-gray-200 text-sm focus-visible:ring focus-visible:ring-rose-400 focus-visible:ring-offset-2'
                placeholder={t('args_placeholder')}
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
      runData={nodeData?.data.run_data}
      nodeComponent={
        <div className='nowheel p-3 space-y-3'>
          {hasImmutableParams && (
            <div>
              <Label className='pb-2 font-medium text-xs text-muted-foreground'>
                {t('immutable_params')}
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
            <Label className='pb-2 font-medium'>{t('modifiable_params')}</Label>
            <Textarea
              className='h-[100px] w-full resize-none overflow-y-auto border-gray-200 text-sm
              focus-visible:ring focus-visible:ring-rose-400 focus-visible:ring-offset-2
              [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'
              placeholder={t('args_placeholder')}
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              onBlur={saveNodeData}
              spellCheck={false}
              disabled={readOnly}
            />
          </div>
        </div>
      }
    />
  )
})
