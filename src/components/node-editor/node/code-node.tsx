'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CodeCardProps {
  nodeType: 'code_R' | 'code_python' | 'code_bash'
}

const CodeCard = memo(function CodeCard({ nodeType }: CodeCardProps) {
  const t = useTranslations('editor.node')
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<{ code: string; dependencies?: string[] }, typeof nodeType>
    >(nodeId)
  const { updateNodeData } = useReactFlow()

  const [code, setCode] = useState<string>(nodeData?.data.code ?? '')
  const [dependencies, setDependencies] = useState(
    nodeData?.data.dependencies?.join('\n') ?? '',
  )
  const supportsDependencies = nodeType !== 'code_bash'

  useEffect(() => {
    setCode(nodeData?.data.code ?? '')
  }, [nodeData?.data.code])

  useEffect(() => {
    setDependencies(nodeData?.data.dependencies?.join('\n') ?? '')
  }, [nodeData?.data.dependencies])

  const handleCodeBlur = useCallback(() => {
    updateNodeData(nodeId, {
      code,
      ...(supportsDependencies && {
        dependencies: dependencies.split('\n').flatMap((dependency) => {
          const normalized = dependency.trim()
          return normalized ? [normalized] : []
        }),
      }),
    })
  }, [code, dependencies, nodeId, supportsDependencies, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Code:</Label>
      <Textarea
        className={cn(
          'h-[200px] w-full resize-none overflow-y-auto border-input font-mono text-sm',
          colorSchemes.purple.focusRing,
        )}
        placeholder={t('code_placeholder')}
        value={code ?? ''}
        onChange={(e) => setCode(e.target.value)}
        onBlur={handleCodeBlur}
        spellCheck={false}
        disabled={readOnly}
      />
      {supportsDependencies && (
        <>
          <Label className='pt-4 pb-2 font-medium'>Dependencies:</Label>
          <Textarea
            className={cn(
              'h-[100px] w-full resize-y border-input font-mono text-sm',
              colorSchemes.purple.focusRing,
            )}
            placeholder={
              nodeType === 'code_python'
                ? 'One PEP 508 requirement per line, e.g.\npandas>=2'
                : 'One CRAN package name per line, e.g.\ndata.table'
            }
            value={dependencies}
            onChange={(event) => setDependencies(event.target.value)}
            onBlur={handleCodeBlur}
            spellCheck={false}
            disabled={readOnly}
          />
        </>
      )}
    </div>
  )
})

const CODE_HANDLES = {
  inputs: [
    {
      name: 'input_files',
      description: 'The files required by this code',
    },
  ],
  outputs: [
    {
      name: 'output_folder',
      description: 'The files required by this code',
    },
  ],
}

const RCodeNode = memo(function RCodeNode() {
  const t = useTranslations('editor.node')
  const nodeComponent = useMemo(() => <CodeCard nodeType='code_R' />, [])

  return (
    <BaseNode
      title='R Code'
      description={t('r_code_description')}
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const PythonCodeNode = memo(function PythonCodeNode() {
  const t = useTranslations('editor.node')
  const nodeComponent = useMemo(() => <CodeCard nodeType='code_python' />, [])

  return (
    <BaseNode
      title='Python Code'
      description={t('python_code_description')}
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const BashCodeNode = memo(function PythonCodeNode() {
  const t = useTranslations('editor.node')
  const nodeComponent = useMemo(() => <CodeCard nodeType='code_bash' />, [])

  return (
    <BaseNode
      title='Bash Code'
      description={t('bash_code_description')}
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const DOWNSTREAM_SUMMARY_HANDLES = {
  inputs: [
    {
      name: 'input_files',
      description: 'The input files for downstream summary',
    },
  ],
  outputs: [] as never[],
}

const DownstreamSummaryCard = memo(function DownstreamSummaryCard() {
  const t = useTranslations('editor.node')
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<Node<{ prompt: string }, 'downstream_summary'>>(nodeId)
  const { updateNodeData } = useReactFlow()

  const [prompt, setPrompt] = useState<string>(nodeData?.data.prompt ?? '')

  useEffect(() => {
    setPrompt(nodeData?.data.prompt ?? '')
  }, [nodeData?.data.prompt])

  const saveNodeData = useCallback(() => {
    updateNodeData(nodeId, { prompt })
  }, [nodeId, prompt, updateNodeData])

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Prompt:</Label>
      <Textarea
        className={cn(
          'h-[150px] w-full resize-none overflow-y-auto border-input text-sm',
          colorSchemes.purple.focusRing,
        )}
        placeholder={t('prompt_placeholder')}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={saveNodeData}
        disabled={readOnly}
      />
    </div>
  )
})

const DownstreamSummaryNode = memo(function DownstreamSummaryNode() {
  const t = useTranslations('editor.node')
  const nodeComponent = useMemo(() => <DownstreamSummaryCard />, [])

  return (
    <BaseNode
      title='Downstream Summary'
      description={t('downstream_summary_description')}
      color={colorSchemes.purple}
      handles={DOWNSTREAM_SUMMARY_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

export { RCodeNode, PythonCodeNode, BashCodeNode, DownstreamSummaryNode }
