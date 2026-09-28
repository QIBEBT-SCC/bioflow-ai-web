'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { EyeIcon, PencilIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { CodeNodeDialog } from '@/components/node-editor/code-node-dialog'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CodeNodeType } from '@/types/code'

const EMPTY_DEPENDENCIES: string[] = []

interface CodeCardProps {
  nodeType: CodeNodeType
  title: string
  description: string
}

const CodeCard = memo(function CodeCard({
  nodeType,
  title,
  description,
}: CodeCardProps) {
  const t = useTranslations('editor.node')
  const readOnly = useReadOnly()
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<{ code: string; dependencies?: string[] }, typeof nodeType>
    >(nodeId)
  const { updateNodeData } = useReactFlow()
  const [open, setOpen] = useState(false)

  const code = nodeData?.data.code ?? ''
  const dependencies = nodeData?.data.dependencies ?? EMPTY_DEPENDENCIES
  const supportsDependencies = nodeType !== 'code_bash'

  const handleSave = useCallback(
    (value: { code: string; dependencies: string[] }) => {
      updateNodeData(nodeId, {
        code: value.code,
        ...(supportsDependencies && { dependencies: value.dependencies }),
      })
    },
    [nodeId, supportsDependencies, updateNodeData],
  )

  return (
    <div className='p-3'>
      <Label className='pb-2 font-medium'>Code:</Label>
      <button
        type='button'
        onClick={() => setOpen(true)}
        title={t(readOnly ? 'code_click_to_view' : 'code_click_to_edit')}
        className={cn(
          'nodrag group relative block h-[200px] w-full cursor-pointer overflow-hidden rounded-md border border-input bg-muted/30 text-left shadow-xs outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px]',
          colorSchemes.purple.focusRing,
        )}
      >
        <pre
          className={cn(
            'absolute inset-0 overflow-hidden whitespace-pre px-3 py-2 font-mono text-xs leading-5',
            !code && 'text-muted-foreground',
          )}
        >
          {code || t('code_empty')}
        </pre>
        <span className='pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end bg-linear-to-t from-background/95 via-background/60 to-transparent px-2 pt-8 pb-1.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100'>
          <span className='flex items-center gap-1 text-[11px]'>
            {readOnly ? (
              <EyeIcon className='size-3' />
            ) : (
              <PencilIcon className='size-3' />
            )}
            {t(readOnly ? 'code_click_to_view' : 'code_click_to_edit')}
          </span>
        </span>
      </button>
      {supportsDependencies && (
        <>
          <Label className='pt-4 pb-2 font-medium'>Dependencies:</Label>
          {dependencies.length ? (
            <div className='flex flex-wrap gap-1'>
              {dependencies.map((dependency) => (
                <Badge
                  key={dependency}
                  variant='secondary'
                  className='max-w-full border font-mono font-normal'
                >
                  <span className='truncate'>{dependency}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className='text-xs text-muted-foreground'>
              {t('code_dependencies', { count: 0 })}
            </p>
          )}
        </>
      )}
      <CodeNodeDialog
        open={open}
        onOpenChange={setOpen}
        nodeType={nodeType}
        title={title}
        description={description}
        code={code}
        dependencies={dependencies}
        readOnly={readOnly}
        onSave={handleSave}
      />
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
  const description = t('r_code_description')
  const nodeComponent = useMemo(
    () => (
      <CodeCard nodeType='code_R' title='R Code' description={description} />
    ),
    [description],
  )

  return (
    <BaseNode
      title='R Code'
      description={description}
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const PythonCodeNode = memo(function PythonCodeNode() {
  const t = useTranslations('editor.node')
  const description = t('python_code_description')
  const nodeComponent = useMemo(
    () => (
      <CodeCard
        nodeType='code_python'
        title='Python Code'
        description={description}
      />
    ),
    [description],
  )

  return (
    <BaseNode
      title='Python Code'
      description={description}
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const BashCodeNode = memo(function BashCodeNode() {
  const t = useTranslations('editor.node')
  const description = t('bash_code_description')
  const nodeComponent = useMemo(
    () => (
      <CodeCard
        nodeType='code_bash'
        title='Bash Code'
        description={description}
      />
    ),
    [description],
  )

  return (
    <BaseNode
      title='Bash Code'
      description={description}
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
