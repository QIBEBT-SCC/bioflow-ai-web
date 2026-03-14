'use client'

import {
  type Node,
  useNodeConnections,
  useNodeId,
  useNodesData,
  useReactFlow,
} from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDB } from '@/hooks/use-resource'
import type { HandleDefine } from '@/types/node.tsx'

const STRING_INPUT_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: [{ name: 'value', description: 'string value' }] as HandleDefine[],
}

const StringInputCard = memo(function StringInputCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData = useNodesData<Node<{ value: string }, 'value_string'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [args, setArgs] = useState<string>(nodeData?.data.value ?? '')

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.value !== undefined && nodeData.data.value !== args) {
      setArgs(nodeData.data.value)
    }
  }, [nodeData?.data.value])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { value: args })
  }, [nodeId, args, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Value:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter string value here...'
        value={args}
        onChange={(e) => setArgs(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  )
})

const StringInputNode = memo(function StringInputNode() {
  const nodeComponent = useMemo(() => <StringInputCard />, [])

  return (
    <BaseNode
      title='String Value'
      description='Simple string value.'
      handles={STRING_INPUT_HANDLES}
      color={colorSchemes.blue}
      nodeComponent={nodeComponent}
    />
  )
})

const FILE_INPUT_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: [
    { name: 'file_path', description: 'output file' },
  ] as HandleDefine[],
}

const FileInputCard = memo(() => {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ file_path: string }, 'resource_file'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [args, setArgs] = useState<string>(nodeData?.data.file_path ?? '')

  // 同步外部数据变化
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.file_path !== undefined &&
      nodeData.data.file_path !== args
    ) {
      setArgs(nodeData.data.file_path)
    }
  }, [nodeData?.data.file_path])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { file_path: args })
  }, [nodeId, args, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>File:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter file path here...'
        value={args}
        onChange={(e) => setArgs(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  )
})

const FileInputNode = memo(function FileInputNode() {
  const nodeComponent = useMemo(() => <FileInputCard />, [])

  return (
    <BaseNode
      title='File Input'
      description='load file from local path.'
      handles={FILE_INPUT_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

const SEQUENCE_INPUT_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: [
    { name: 'r1', description: 'r1 file' },
    { name: 'r2', description: 'r2 file' },
  ] as HandleDefine[],
}

const SequenceInputCard = memo(function SequenceInputCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ r1: string; r2: string }, 'resource_sequence'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [r1, setR1] = useState<string>(nodeData?.data.r1 ?? '')
  const [r2, setR2] = useState<string>(nodeData?.data.r2 ?? '')

  // 同步外部数据变化
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.r1 !== undefined && nodeData.data.r1 !== r1) {
      setR1(nodeData.data.r1)
    }
  }, [nodeData?.data.r1])

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (nodeData?.data.r2 !== undefined && nodeData.data.r2 !== r2) {
      setR2(nodeData.data.r2)
    }
  }, [nodeData?.data.r2])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { r1: r1, r2: r2 })
  }, [nodeId, r1, r2, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>R1 path:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter arguments here...'
        value={r1}
        onChange={(e) => setR1(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
      <Label className='pt-4 pb-2 font-medium'>R2 path:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter arguments here...'
        value={r2}
        onChange={(e) => setR2(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  )
})

const SequenceInputNode = memo(function SequenceInputNode() {
  const nodeComponent = useMemo(() => <SequenceInputCard />, [])

  return (
    <BaseNode
      title='Pair-end Reads Input'
      description='用于手动指定双端测序文件输入'
      handles={SEQUENCE_INPUT_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

const DB_INPUT_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: [
    { name: 'file_path', description: 'output file' },
  ] as HandleDefine[],
}

const DBInputCard = memo(function DBInputCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData = useNodesData<Node<{ db_id: string; db_name: string }, 'resource_db'>>(nodeId)

  const { data: bioDb } = useDB(Number(nodeData?.data.db_id))

  return (
    <div className='p-3 space-y-1'>
      {bioDb?.size && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <span className='font-medium'>Size:</span>
          <span>{bioDb.size}</span>
        </div>
      )}
      {bioDb?.last_update && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <span className='font-medium'>Updated:</span>
          <span>{bioDb.last_update}</span>
        </div>
      )}
      {bioDb?.description && (
        <div className='text-xs text-muted-foreground line-clamp-2'>
          {bioDb.description}
        </div>
      )}
    </div>
  )
})

const DBInputNode = memo(function DBInputNode() {
  const nodeId = useNodeId() ?? ''
  const nodeData = useNodesData<Node<{ db_id: string; db_name: string }, 'resource_db'>>(nodeId)
  const nodeComponent = useMemo(() => <DBInputCard />, [])

  return (
    <BaseNode
      title={nodeData?.data.db_name || 'Biological Database'}
      description='分析软件所使用的生物信息数据库'
      handles={DB_INPUT_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

const REFERENCE_INPUT_HANDLES = {
  inputs: [
    {
      name: 'species_name',
      description: 'species name of the reference gene to be used',
    },
    {
      name: 'ncbi_tax_id',
      description:
        'NCBI taxonomy ID of the species of the reference gene to be used',
    },
  ] as HandleDefine[],
  outputs: [
    {
      name: 'genome_fasta',
      description: 'Gene fasta file of the reference genome',
    },
    {
      name: 'annotation_gff',
      description: 'GFF annotation file of the reference genome',
    },
    {
      name: 'annotation_gtf',
      description: 'GTF annotation file of the reference genome',
    },
    { name: 'bowtie2_index', description: '' },
    { name: 'bwa_index', description: '' },
    { name: 'hisat2_index', description: '' },
    { name: 'star_index', description: '' },
    { name: 'minimap2_index', description: '' },
  ] as HandleDefine[],
}

const ReferenceInputCard = memo(function ReferenceInputCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ required_index: string[] }, 'resource_genome'>>(nodeId)

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Species:</Label>
      <code className='max-w-full overflow-x-auto text-muted-foreground text-sm'>
        {String(nodeData?.data.required_index)}
      </code>
    </div>
  )
})

const ReferenceInputNode = memo(function ReferenceInputNode() {
  const nodeId = useNodeId() ?? ''
  const connections = useNodeConnections({ handleType: 'source' })
  const { updateNodeData } = useReactFlow()

  useEffect(() => {
    const indexes: string[] = connections.map((conn) => {
      // @ts-expect-error no need
      const parts = conn.sourceHandle.split('-out-')
      return parts[parts.length - 1]
    })
    updateNodeData(nodeId, { required_index: indexes })
  }, [connections, nodeId, updateNodeData])

  const nodeComponent = useMemo(() => <ReferenceInputCard />, [])

  return (
    <BaseNode
      title='Reference Genomes'
      description='参考基因组输入节点'
      handles={REFERENCE_INPUT_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

const GLOBAL_FILE_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: [
    { name: 'folder_path', description: 'output file' },
  ] as HandleDefine[],
}

const GlobalFileCard = memo(() => {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ mark_name: string }, 'resource_global_file'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [markName, setMarkName] = useState<string>(
    nodeData?.data.mark_name ?? '',
  )

  // 同步外部数据变化
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.mark_name !== undefined &&
      nodeData.data.mark_name !== markName
    ) {
      setMarkName(nodeData.data.mark_name)
    }
  }, [nodeData?.data.mark_name])

  const handleBlur = useCallback(() => {
    updateNodeData(nodeId, { mark_name: markName })
  }, [nodeId, markName, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>File:</Label>
      <Input
        className='w-full border-input focus-visible:ring-ring'
        placeholder='Enter file path here...'
        value={markName}
        onChange={(e) => setMarkName(e.target.value)}
        onBlur={handleBlur}
        spellCheck={false}
      />
    </div>
  )
})

const GlobalFileNode = memo(function FileInputNode() {
  const nodeComponent = useMemo(() => <GlobalFileCard />, [])

  return (
    <BaseNode
      title='Global File Input'
      description='load file from local path.'
      handles={GLOBAL_FILE_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

export {
  StringInputNode,
  FileInputNode,
  SequenceInputNode,
  DBInputNode,
  ReferenceInputNode,
  GlobalFileNode,
}
