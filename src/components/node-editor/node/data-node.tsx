'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import type { HandleDefine } from '@/types/node'
import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const COPY2FOLDER_HANDLES = {
  inputs: [
    {
      name: 'files',
      description: 'All files to be copied over',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'folder',
      description: 'Folder path containing all files',
    },
  ] as HandleDefine[],
}

const GLOBAL_MARKER_HANDLES = {
  inputs: [
    {
      name: 'files',
      description: 'File to be marked as global use',
    },
  ] as HandleDefine[],
  outputs: [] as HandleDefine[],
}
const Copy2FolderNode = memo(function Copy2FolderNode() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='Copy To Folder'
      description='Copy files from multiple input sources to the same folder.'
      handles={COPY2FOLDER_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const GlobalFileCard = memo(function GlobalFileCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<
        { args: { mark_name: string; description: string } },
        'global_mark'
      >
    >(nodeId)
  const { updateNodeData } = useReactFlow()

  const [mark_name, setMarkName] = useState<string>(
    nodeData?.data.args.mark_name ?? '',
  )
  const [description, setDescription] = useState<string>(
    nodeData?.data.args.description ?? '',
  )

  // 同步外部数据变化
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.args.mark_name !== undefined &&
      nodeData.data.args.mark_name !== mark_name
    ) {
      setMarkName(nodeData.data.args.mark_name)
    }
  }, [nodeData?.data.args.mark_name])

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.args.description !== undefined &&
      nodeData.data.args.description !== description
    ) {
      setDescription(nodeData.data.args.description)
    }
  }, [nodeData?.data.args.description])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, {
      args: { mark_name: mark_name, description: description },
    })
  }, [nodeId, mark_name, description, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Mark Name:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter arguments here...'
        value={mark_name}
        onChange={(e) => setMarkName(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
      <Label className='pt-4 pb-2 font-medium'>Description:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter arguments here...'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  )
})

const GlobalMarkerNode = memo(function FileInputNode() {
  const nodeComponent = useMemo(() => <GlobalFileCard />, [])

  return (
    <BaseNode
      title='Global Marker'
      description='load file from local path.'
      handles={GLOBAL_MARKER_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

export { Copy2FolderNode, GlobalMarkerNode }
