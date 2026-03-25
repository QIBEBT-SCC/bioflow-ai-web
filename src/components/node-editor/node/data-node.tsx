'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { HandleDefine } from '@/types/node'

const COPY2FOLDER_HANDLES = {
  inputs: [
    {
      name: 'files',
      description: 'All files to be copied over',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'folder_path',
      description: 'Path of the destination folder',
    },
  ] as HandleDefine[],
}

const Copy2FolderCard = memo(function Copy2FolderCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ folder_name: string }, 'copy2folder'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [folder_name, setFolderName] = useState<string>(
    nodeData?.data.folder_name ?? '',
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.folder_name !== undefined &&
      nodeData.data.folder_name !== folder_name
    ) {
      setFolderName(nodeData.data.folder_name)
    }
  }, [nodeData?.data.folder_name])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { folder_name })
  }, [nodeId, folder_name, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Folder Name:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter folder name...'
        value={folder_name}
        onChange={(e) => setFolderName(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
        disabled={readOnly}
      />
    </div>
  )
})

const Copy2FolderNode = memo(function Copy2FolderNode() {
  const nodeComponent = useMemo(() => <Copy2FolderCard />, [])

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

const GZIP_HANDLES = {
  inputs: [
    {
      name: 'file',
      description: 'File to be compressed',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'zipped_file',
      description: 'Gzip compressed file',
    },
  ] as HandleDefine[],
}

const GzipNode = memo(function GzipNode() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='Gzip'
      description='Compress a file using gzip.'
      handles={GZIP_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const RENAME_FILE_HANDLES = {
  inputs: [
    { name: 'old_file', description: 'File to be renamed' },
  ] as HandleDefine[],
  outputs: [
    { name: 'renamed_file', description: 'Renamed file' },
  ] as HandleDefine[],
}

const RenameFileCard = memo(function RenameFileCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ new_file_name: string }, 'rename_file'>>(nodeId)
  const { updateNodeData } = useReactFlow()
  const readOnly = useReadOnly()

  const [newFileName, setNewFileName] = useState<string>(
    nodeData?.data.new_file_name ?? '',
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.new_file_name !== undefined &&
      nodeData.data.new_file_name !== newFileName
    ) {
      setNewFileName(nodeData.data.new_file_name)
    }
  }, [nodeData?.data.new_file_name])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { new_file_name: newFileName })
  }, [nodeId, newFileName, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>New File Name:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter new file name...'
        value={newFileName}
        onChange={(e) => setNewFileName(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
        disabled={readOnly}
      />
    </div>
  )
})

const RenameFileNode = memo(function RenameFileNode() {
  const nodeComponent = useMemo(() => <RenameFileCard />, [])
  return (
    <BaseNode
      title='Rename File'
      description='Rename a file to a new name.'
      handles={RENAME_FILE_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const GLOBAL_MARKER_HANDLES = {
  inputs: [
    {
      name: 'files',
      description: 'File to be marked as global use',
    },
  ] as HandleDefine[],
  outputs: [] as HandleDefine[],
}

const GlobalFileCard = memo(function GlobalFileCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<{ mark_name: string; description: string }, 'global_mark'>
    >(nodeId)
  const { updateNodeData } = useReactFlow()

  const [mark_name, setMarkName] = useState<string>(
    nodeData?.data.mark_name ?? '',
  )
  const [description, setDescription] = useState<string>(
    nodeData?.data.description ?? '',
  )

  // 同步外部数据变化
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.mark_name !== undefined &&
      nodeData.data.mark_name !== mark_name
    ) {
      setMarkName(nodeData.data.mark_name)
    }
  }, [nodeData?.data.mark_name])

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.description !== undefined &&
      nodeData.data.description !== description
    ) {
      setDescription(nodeData.data.description)
    }
  }, [nodeData?.data.description])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, {
      mark_name: mark_name,
      description: description,
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
        disabled={readOnly}
      />
      <Label className='pt-4 pb-2 font-medium'>Description:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter arguments here...'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
        disabled={readOnly}
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

const SELECT_FILE_IN_FOLDER_HANDLES = {
  inputs: [
    { name: 'folder_path', description: 'Path of the folder to select from' },
  ] as HandleDefine[],
  outputs: [
    { name: 'file_path', description: 'Path of the selected file' },
  ] as HandleDefine[],
}

const SelectFileInFolderCard = memo(function SelectFileInFolderCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ file_name: string }, 'select_file_in_folder'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [file_name, setFileName] = useState<string>(
    nodeData?.data.file_name ?? '',
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.file_name !== undefined &&
      nodeData.data.file_name !== file_name
    ) {
      setFileName(nodeData.data.file_name)
    }
  }, [nodeData?.data.file_name])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { file_name })
  }, [nodeId, file_name, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>File Name:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter file name...'
        value={file_name}
        onChange={(e) => setFileName(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
        disabled={readOnly}
      />
    </div>
  )
})

const SelectFileInFolderNode = memo(function SelectFileInFolderNode() {
  const nodeComponent = useMemo(() => <SelectFileInFolderCard />, [])
  return (
    <BaseNode
      title='Select File in Folder'
      description='Select a specific file from a folder by name.'
      handles={SELECT_FILE_IN_FOLDER_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

export { Copy2FolderNode, GzipNode, RenameFileNode, GlobalMarkerNode, SelectFileInFolderNode }
