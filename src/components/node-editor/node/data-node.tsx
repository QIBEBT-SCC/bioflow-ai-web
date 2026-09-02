'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  useEffect(() => {
    setFolderName(nodeData?.data.folder_name ?? '')
  }, [nodeData?.data.folder_name])

  const saveNodeData = useCallback(() => {
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
        onBlur={saveNodeData}
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

const COMPRESS_HANDLES = {
  inputs: [
    {
      name: 'input_path',
      description: 'File or directory to compress',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'compressed_path',
      description: 'Generated compressed file',
    },
  ] as HandleDefine[],
}

const COMPRESSION_FORMATS = [
  { suffix: '.zip', label: 'ZIP (.zip)' },
  { suffix: '.tar.gz', label: 'TAR + Gzip (.tar.gz)' },
  { suffix: '.tar.bz2', label: 'TAR + Bzip2 (.tar.bz2)' },
  { suffix: '.tar.xz', label: 'TAR + XZ (.tar.xz)' },
  { suffix: '.tar', label: 'TAR (.tar)' },
  { suffix: '.gz', label: 'Gzip (.gz, files only)' },
  { suffix: '.bz2', label: 'Bzip2 (.bz2, files only)' },
  { suffix: '.xz', label: 'XZ (.xz, files only)' },
] as const

type CompressionFormat = (typeof COMPRESSION_FORMATS)[number]['suffix']

const COMPRESSION_SUFFIXES = [
  '.tar.bz2',
  '.tar.gz',
  '.tar.xz',
  '.bz2',
  '.tar',
  '.zip',
  '.gz',
  '.xz',
] as const

function resolveCompressionFormat(
  format: string | undefined,
): CompressionFormat {
  const savedFormat = COMPRESSION_FORMATS.find(
    (item) => item.suffix === format,
  )?.suffix
  return savedFormat ?? '.zip'
}

function applyCompressionFormat(
  fileName: string,
  format: CompressionFormat,
): string {
  const trimmedFileName = fileName.trim()
  if (!trimmedFileName) return ''

  const currentSuffix = COMPRESSION_SUFFIXES.find((suffix) =>
    trimmedFileName.endsWith(suffix),
  )
  const baseName = currentSuffix
    ? trimmedFileName.slice(0, -currentSuffix.length)
    : trimmedFileName

  return `${baseName}${format}`
}

const CompressCard = memo(function CompressCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<
        {
          compressed_file_name: string
          compression_format: CompressionFormat
        },
        'compress'
      >
    >(nodeId)
  const { updateNodeData } = useReactFlow()

  const [fileName, setFileName] = useState(
    nodeData?.data.compressed_file_name ?? '',
  )
  const [compressionFormat, setCompressionFormat] = useState<CompressionFormat>(
    () => resolveCompressionFormat(nodeData?.data.compression_format),
  )

  useEffect(() => {
    const nextFileName = nodeData?.data.compressed_file_name ?? ''
    setFileName(nextFileName)
    setCompressionFormat(
      resolveCompressionFormat(nodeData?.data.compression_format),
    )
  }, [nodeData?.data.compressed_file_name, nodeData?.data.compression_format])

  const saveNodeData = useCallback(() => {
    const formattedFileName = applyCompressionFormat(
      fileName,
      compressionFormat,
    )
    setFileName(formattedFileName)
    updateNodeData(nodeId, {
      compressed_file_name: formattedFileName,
      compression_format: compressionFormat,
    })
  }, [compressionFormat, fileName, nodeId, updateNodeData])

  const changeCompressionFormat = useCallback(
    (format: CompressionFormat) => {
      const formattedFileName = applyCompressionFormat(fileName, format)
      setCompressionFormat(format)
      setFileName(formattedFileName)
      updateNodeData(nodeId, {
        compressed_file_name: formattedFileName,
        compression_format: format,
      })
    },
    [fileName, nodeId, updateNodeData],
  )

  return (
    <div className='space-y-3 p-3'>
      <div>
        <Label className='pb-2 font-medium'>Compression Format:</Label>
        <Select
          value={compressionFormat}
          onValueChange={(value) =>
            changeCompressionFormat(value as CompressionFormat)
          }
          disabled={readOnly}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPRESSION_FORMATS.map((format) => (
              <SelectItem key={format.suffix} value={format.suffix}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className='pb-2 font-medium'>Compressed File Name:</Label>
        <Input
          className='w-full border-input focus-visible:ring-ring'
          placeholder={`e.g. results${compressionFormat}`}
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
          onBlur={saveNodeData}
          spellCheck={false}
          disabled={readOnly}
        />
      </div>
    </div>
  )
})

const CompressNode = memo(function CompressNode() {
  const nodeComponent = useMemo(() => <CompressCard />, [])
  return (
    <BaseNode
      title='Compress'
      description='Compress a file or directory using the selected compression format.'
      handles={COMPRESS_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const DECOMPRESS_HANDLES = {
  inputs: [
    {
      name: 'compressed_path',
      description: 'Compressed file or archive',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'output_path',
      description: 'Decompressed file or extracted directory',
    },
  ] as HandleDefine[],
}

const DecompressNode = memo(function DecompressNode() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='Decompress'
      description='Automatically detect and decompress a supported file or archive.'
      handles={DECOMPRESS_HANDLES}
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

  useEffect(() => {
    setNewFileName(nodeData?.data.new_file_name ?? '')
  }, [nodeData?.data.new_file_name])

  const saveNodeData = useCallback(() => {
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
        onBlur={saveNodeData}
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

const ARTIFACT_MARK_HANDLES = {
  inputs: [
    {
      name: 'file',
      description: 'File or directory to publish',
    },
  ] as HandleDefine[],
  outputs: [] as HandleDefine[],
}

const ArtifactMarkCard = memo(function ArtifactMarkCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<
        { mark_name: string; description: string },
        'project_mark' | 'sample_mark'
      >
    >(nodeId)
  const { updateNodeData } = useReactFlow()

  const [mark_name, setMarkName] = useState<string>(
    nodeData?.data.mark_name ?? '',
  )
  const [description, setDescription] = useState<string>(
    nodeData?.data.description ?? '',
  )

  useEffect(() => {
    setMarkName(nodeData?.data.mark_name ?? '')
  }, [nodeData?.data.mark_name])

  useEffect(() => {
    setDescription(nodeData?.data.description ?? '')
  }, [nodeData?.data.description])

  const saveNodeData = useCallback(() => {
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
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
      />
      <Label className='pt-4 pb-2 font-medium'>Description:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter arguments here...'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
      />
    </div>
  )
})

const ProjectMarkNode = memo(function ProjectMarkNode() {
  const nodeComponent = useMemo(() => <ArtifactMarkCard />, [])

  return (
    <BaseNode
      title='Project Mark'
      description='Register a project-level output as soon as this node succeeds.'
      handles={ARTIFACT_MARK_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const SampleMarkNode = memo(function SampleMarkNode() {
  const nodeComponent = useMemo(() => <ArtifactMarkCard />, [])

  return (
    <BaseNode
      title='Sample Mark'
      description='Register an output immediately for the current sample.'
      handles={ARTIFACT_MARK_HANDLES}
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

  useEffect(() => {
    setFileName(nodeData?.data.file_name ?? '')
  }, [nodeData?.data.file_name])

  const saveNodeData = useCallback(() => {
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
        onBlur={saveNodeData}
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

const JOIN_PATH_HANDLES = {
  inputs: [
    { name: 'base_path', description: 'Base file or directory path' },
  ] as HandleDefine[],
  outputs: [{ name: 'path', description: 'Joined path' }] as HandleDefine[],
}

const JoinPathCard = memo(function JoinPathCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ relative_path: string }, 'join_path'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [relativePath, setRelativePath] = useState<string>(
    nodeData?.data.relative_path ?? '',
  )

  useEffect(() => {
    setRelativePath(nodeData?.data.relative_path ?? '')
  }, [nodeData?.data.relative_path])

  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { relative_path: relativePath })
  }, [nodeId, relativePath, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Relative Path:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='e.g. results/report.tsv'
        value={relativePath}
        onChange={(event) => setRelativePath(event.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
      />
    </div>
  )
})

const JoinPathNode = memo(function JoinPathNode() {
  const nodeComponent = useMemo(() => <JoinPathCard />, [])
  return (
    <BaseNode
      title='Join Path'
      description='Append a relative path to an upstream file or directory path.'
      handles={JOIN_PATH_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const BIND_PARAM_HANDLES = {
  inputs: [
    { name: 'file', description: 'Input file to bind parameter to' },
  ] as HandleDefine[],
  outputs: [
    { name: 'file_with_param', description: 'File with bound parameter' },
  ] as HandleDefine[],
}

const BindParamCard = memo(function BindParamCard() {
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ parameter: string }, 'bind_param'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [parameter, setParameter] = useState<string>(
    nodeData?.data.parameter ?? '',
  )

  useEffect(() => {
    setParameter(nodeData?.data.parameter ?? '')
  }, [nodeData?.data.parameter])

  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { parameter })
  }, [nodeId, parameter, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Parameter:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter parameter...'
        value={parameter}
        onChange={(e) => setParameter(e.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
      />
    </div>
  )
})

const BindParamNode = memo(function BindParamNode() {
  const nodeComponent = useMemo(() => <BindParamCard />, [])
  return (
    <BaseNode
      title='Bind Parameter'
      description='Bind a parameter to a file.'
      handles={BIND_PARAM_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

const COLLECT_MOUNT_DIR_HANDLES = {
  inputs: [
    {
      name: 'dirs',
      description: 'Tool working directories',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'mount_dir_list',
      description: 'Mount-list manifest for downstream tool input',
    },
  ] as HandleDefine[],
}

const CollectMountDirNode = memo(function CollectMountDirNode() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='Collect Mount Directories'
      description='Collects multiple upstream tool working directories and outputs a mount-list manifest.'
      handles={COLLECT_MOUNT_DIR_HANDLES}
      color={colorSchemes.orange}
      nodeComponent={nodeComponent}
    />
  )
})

export {
  Copy2FolderNode,
  CompressNode,
  DecompressNode,
  RenameFileNode,
  ProjectMarkNode,
  SampleMarkNode,
  SelectFileInFolderNode,
  JoinPathNode,
  BindParamNode,
  CollectMountDirNode,
}
