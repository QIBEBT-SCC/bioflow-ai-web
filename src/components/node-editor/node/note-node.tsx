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
import { Textarea } from '@/components/ui/textarea'

export const NoteNode = memo(function NoteNode() {
  const nodeId = useNodeId() ?? ''
  const nodeData = useNodesData<Node<{ args: string }, 'note'>>(nodeId)
  const { updateNodeData } = useReactFlow()
  const [args, setArgs] = useState<string>(nodeData?.data.args ?? '')

  // 同步外部数据变化到本地state

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.args !== undefined && nodeData.data.args !== args) {
      setArgs(nodeData.data.args)
    }
  }, [nodeData?.data.args])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { args: args })
  }, [nodeId, args, updateNodeData])

  return (
    <NodeCard className='flex h-[350px] w-[400px] flex-col'>
      <NodeCardHeader className={colorSchemes.gray.gradient}>
        <NodeTitle className='text-white'>Note</NodeTitle>
      </NodeCardHeader>
      <NodeCardContent className='flex flex-1 flex-col overflow-hidden pb-0'>
        <Textarea
          className='nowheel h-full w-full resize-none overflow-y-auto rounded-none border-none bg-white p-3 text-gray-700 focus-visible:border-none focus-visible:ring-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'
          placeholder='Enter notes here...'
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          onBlur={handleBlur}
        />
      </NodeCardContent>
    </NodeCard>
  )
})
