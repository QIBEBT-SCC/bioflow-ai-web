'use client'

import {
  Handle,
  type Node,
  Position,
  useNodeConnections,
  useNodeId,
  useNodesData,
  useReactFlow,
} from '@xyflow/react'
import { ShieldAlertIcon, ShieldCheckIcon, UserRoundIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { ToolNodeDetails } from '@/components/node-editor/node/tool-node-details'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToolArg } from '@/hooks/use-tool'
import { cn } from '@/lib/utils'
import type { RunData } from '@/types/run'

const OUTPUT_FOLDER_HANDLE_NAME = 'workdir'

const toolCategoryConfig = {
  aiChecked: {
    label: 'AI Checked',
    icon: ShieldCheckIcon,
    className:
      'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800',
  },
  aiUnchecked: {
    label: 'AI Unchecked',
    icon: ShieldAlertIcon,
    className:
      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800',
  },
  userCustom: {
    label: 'User custom',
    icon: UserRoundIcon,
    className:
      'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800',
  },
} as const

const ToolOutputFolderHandle = memo(function ToolOutputFolderHandle() {
  const nodeId = useNodeId() ?? ''
  const connections = useNodeConnections()
  const handleId = [nodeId, 'out', OUTPUT_FOLDER_HANDLE_NAME].join('-')
  const isConnected = connections.some(
    (connection) => connection.sourceHandle === handleId,
  )

  return (
    <div className='absolute right-0 bottom-0 left-0 h-10 border-t border-border/50'>
      <span className='absolute top-1/2 right-6 -translate-y-1/2 select-none text-end text-xs leading-none text-muted-foreground'>
        {OUTPUT_FOLDER_HANDLE_NAME}
      </span>
      <Handle
        id={handleId}
        type='source'
        position={Position.Right}
        className={cn(
          'right-3! top-1/2! bottom-auto! size-2.5 rounded-full border border-border bg-background! shadow-xs transition-all duration-200',
          'hover:border-primary/50! hover:bg-primary/10! hover:scale-110!',
          isConnected && 'border-indigo-500! bg-indigo-100!',
        )}
      />
    </div>
  )
})
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
      outputs:
        toolData?.output_handles.filter(
          (handle) => handle.name !== OUTPUT_FOLDER_HANDLE_NAME,
        ) || [],
    }),
    [toolData?.input_handles, toolData?.output_handles],
  )

  // 使用 useCallback 缓存 onBlur 回调
  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { modifiable_params: args })
  }, [nodeId, args, updateNodeData])

  const immutableParams = toolData?.immutable_static_params ?? ''
  const hasImmutableParams = immutableParams.trim().length > 0
  const toolCategory = toolData?.tags.some((tag) => tag.name === 'AI Checked')
    ? toolCategoryConfig.aiChecked
    : toolData?.tags.some((tag) => tag.name === 'AI Unchecked')
      ? toolCategoryConfig.aiUnchecked
      : toolCategoryConfig.userCustom
  const ToolCategoryIcon = toolCategory.icon

  if (isLoading)
    return (
      <BaseNode
        title='--'
        description='--'
        detailsTrigger={null}
        handles={handles}
        color={colorSchemes.pink}
        nodeComponent={
          <div className='relative p-3 pb-10 space-y-3'>
            {hasImmutableParams && (
              <div>
                <Label className='pb-2 font-medium text-xs text-muted-foreground'>
                  {t('immutable_params')}
                </Label>
                <Textarea
                  className='h-15 w-full resize-none overflow-y-auto border-gray-200 text-sm bg-muted'
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
                className='h-25 w-full resize-none overflow-y-auto border-gray-200 text-sm focus-visible:ring focus-visible:ring-rose-400 focus-visible:ring-offset-2'
                placeholder={t('args_placeholder')}
                value='--'
                disabled={true}
              />
            </div>
            <ToolOutputFolderHandle />
          </div>
        }
      />
    )

  return (
    <BaseNode
      title={toolData?.name ?? '--'}
      description={toolData?.description ?? ''}
      detailsTrigger={
        <Button
          type='button'
          variant='outline'
          aria-label={`Open ${toolCategory.label} tool details`}
          title={toolCategory.label}
          className={cn(
            'nodrag h-5 shrink-0 gap-1 rounded-full px-1.5 text-[10px] shadow-none',
            toolCategory.className,
          )}
        >
          <ToolCategoryIcon className='size-3' />
          {toolCategory.label}
        </Button>
      }
      detailsContent={
        <ToolNodeDetails toolUid={nodeData?.data.tool_uid ?? ''} />
      }
      handles={handles}
      color={colorSchemes.pink}
      runData={nodeData?.data.run_data}
      nodeComponent={
        <div className='nowheel relative p-3 pb-10 space-y-3'>
          {hasImmutableParams && (
            <div>
              <Label className='pb-2 font-medium text-xs text-muted-foreground'>
                {t('immutable_params')}
              </Label>
              <Textarea
                className='h-15 w-full resize-none overflow-y-auto border-gray-200 text-sm bg-muted
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
              className='h-25 w-full resize-none overflow-y-auto border-gray-200 text-sm
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
          <ToolOutputFolderHandle />
        </div>
      }
    />
  )
})
