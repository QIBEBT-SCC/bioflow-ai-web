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
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDB } from '@/hooks/use-resource'
import type { HandleDefine } from '@/types/node.tsx'

const STRING_INPUT_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: [{ name: 'value', description: 'string value' }] as HandleDefine[],
}

const StringInputCard = memo(function StringInputCard() {
  const readOnly = useReadOnly()
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

  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { value: args })
  }, [nodeId, args, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Value:</Label>
      <Input
        className='w-full border-input focus-visible:ring focus-visible:ring-blue-400 focus-visible:ring-offset-2'
        placeholder='Enter string value here...'
        value={args}
        onChange={(e) => setArgs(e.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
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
  const readOnly = useReadOnly()
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

  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { file_path: args })
  }, [nodeId, args, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>File:</Label>
      <Input
        className='w-full border-input focus-visible:ring focus-visible:ring-green-400 focus-visible:ring-offset-2'
        placeholder='Enter file path here...'
        value={args}
        onChange={(e) => setArgs(e.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
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
  const readOnly = useReadOnly()
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

  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { r1: r1, r2: r2 })
  }, [nodeId, r1, r2, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>R1 path:</Label>
      <Input
        className='w-full border-input focus-visible:ring focus-visible:ring-green-400 focus-visible:ring-offset-2'
        placeholder='Enter arguments here...'
        value={r1}
        onChange={(e) => setR1(e.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
      />
      <Label className='pt-4 pb-2 font-medium'>R2 path:</Label>
      <Input
        className='w-full border-input focus-visible:ring focus-visible:ring-green-400 focus-visible:ring-offset-2'
        placeholder='Enter arguments here...'
        value={r2}
        onChange={(e) => setR2(e.target.value)}
        onBlur={saveNodeData}
        spellCheck={false}
        disabled={readOnly}
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
  const nodeData =
    useNodesData<Node<{ db_id: string; db_name: string }, 'resource_db'>>(
      nodeId,
    )

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
  const nodeData =
    useNodesData<Node<{ db_id: string; db_name: string }, 'resource_db'>>(
      nodeId,
    )
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

const GENOME_OUTPUTS = [
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
] as HandleDefine[]

const NCBI_GENOME_HANDLES = {
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
  outputs: GENOME_OUTPUTS,
}

const NcbiGenomeCard = memo(function NcbiGenomeCard() {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ required_index: string[] }, 'resource_ncbi_genome'>>(
      nodeId,
    )

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Species:</Label>
      <code className='max-w-full overflow-x-auto text-muted-foreground text-sm'>
        {String(nodeData?.data.required_index)}
      </code>
    </div>
  )
})

const NcbiGenomeNode = memo(function NcbiGenomeNode() {
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

  const nodeComponent = useMemo(() => <NcbiGenomeCard />, [])

  return (
    <BaseNode
      title='NCBI Genome'
      description='从NCBI获取参考基因组'
      handles={NCBI_GENOME_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

const GRCH38_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: GENOME_OUTPUTS,
}

const GRCh38Node = memo(function GRCh38Node() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='GRCh38'
      description='人类参考基因组 GRCh38 (hg38)'
      handles={GRCH38_HANDLES}
      color={colorSchemes.green}
      nodeComponent={nodeComponent}
    />
  )
})

const GRCM39_HANDLES = {
  inputs: [] as HandleDefine[],
  outputs: GENOME_OUTPUTS,
}

const GRCm39Node = memo(function GRCm39Node() {
  const nodeComponent = useMemo(() => <div />, [])
  return (
    <BaseNode
      title='GRCm39'
      description='小鼠参考基因组 GRCm39 (mm39)'
      handles={GRCM39_HANDLES}
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
  NcbiGenomeNode,
  GRCh38Node,
  GRCm39Node,
}
