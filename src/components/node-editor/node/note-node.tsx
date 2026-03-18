'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useState } from 'react'
import {
  NodeCard,
  NodeCardContent,
  NodeCardHeader,
  NodeTitle,
} from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export const NoteNode = memo(function NoteNode() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData = useNodesData<Node<{ content: string }, 'note'>>(nodeId)
  const { updateNodeData } = useReactFlow()
  const [args, setArgs] = useState<string>(nodeData?.data.content ?? '')

  // 同步外部数据变化到本地state

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.content !== undefined &&
      nodeData.data.content !== args
    ) {
      setArgs(nodeData.data.content)
    }
  }, [nodeData?.data.content])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { content: args })
  }, [nodeId, args, updateNodeData])

  return (
    <NodeCard
      className={cn(
        'flex h-[350px] w-[400px] flex-col border-t-4',
        colorSchemes.gray.border,
      )}
    >
      <NodeCardHeader
        className={cn(colorSchemes.gray.bg, 'border-b border-border/50')}
      >
        <NodeTitle className={colorSchemes.gray.primary}>Note</NodeTitle>
      </NodeCardHeader>
      <NodeCardContent className='flex flex-1 flex-col overflow-hidden p-2'>
        <Textarea
          className='nowheel h-full w-full resize-none overflow-y-auto rounded-md border-none bg-background p-3 text-sm focus-visible:border-none focus-visible:ring-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'
          placeholder='Enter notes here...'
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          onBlur={handleBlur}
          disabled={readOnly}
        />
      </NodeCardContent>
    </NodeCard>
  )
})
