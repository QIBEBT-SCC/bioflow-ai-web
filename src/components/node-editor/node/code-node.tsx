'use client'

import { type Node, useNodeId, useNodesData, useReactFlow } from '@xyflow/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CodeCardProps {
  nodeType: 'code_R' | 'code_python' | 'code_bash'
}

const CodeCard = memo(function CodeCard({ nodeType }: CodeCardProps) {
  const nodeId = useNodeId() ?? ''
  const nodeData =
    useNodesData<
      Node<{ args: { description: string; code: string } }, typeof nodeType>
    >(nodeId)
  const { updateNodeData } = useReactFlow()

  const [code, setCode] = useState<string>(nodeData?.data.args.code ?? '')
  const [prompt, setPrompt] = useState<string>(
    nodeData?.data.args.description ?? '',
  )

  // 同步外部数据变化到本地state
  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.args.code !== undefined &&
      nodeData.data.args.code !== code
    ) {
      setCode(nodeData.data.args.code)
    }
  }, [nodeData?.data.args.code])

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (
      nodeData?.data.args.description !== undefined &&
      nodeData.data.args.description !== prompt
    ) {
      setPrompt(nodeData.data.args.description)
    }
  }, [nodeData?.data.args.description])

  // onBlur 回调需要用 useCallback，因为它们依赖于多个变量
  const handlePromptBlur = useCallback(() => {
    updateNodeData(nodeId, {
      args: { description: prompt, code: code },
    })
  }, [nodeId, prompt, code, updateNodeData])

  const handleCodeBlur = useCallback(() => {
    updateNodeData(nodeId, {
      args: { description: prompt, code: code },
    })
  }, [nodeId, prompt, code, updateNodeData])

  return (
    <div className='p-3'>
      <div className='space-y-4'>
        <div>
          <Label className='pb-2 font-medium'>Description (AI Prompt):</Label>
          <Textarea
            className='h-[80px] w-full resize-none overflow-y-auto border-input text-sm'
            placeholder='输入代码编写需求，作为AI编程的prompt...'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={handlePromptBlur}
          />
        </div>
        <div>
          <Label className='pb-2 font-medium'>Code:</Label>
          <Textarea
            className='h-[120px] w-full resize-none overflow-y-auto border-input font-mono text-sm'
            placeholder='在这里编写或粘贴代码...'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={handleCodeBlur}
            spellCheck={false}
          />
        </div>
      </div>
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
  const nodeComponent = useMemo(() => <CodeCard nodeType='code_R' />, [])

  return (
    <BaseNode
      title='R Code'
      description='AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。'
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const PythonCodeNode = memo(function PythonCodeNode() {
  const nodeComponent = useMemo(() => <CodeCard nodeType='code_python' />, [])

  return (
    <BaseNode
      title='Python Code'
      description='AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。'
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

const BashCodeNode = memo(function PythonCodeNode() {
  const nodeComponent = useMemo(() => <CodeCard nodeType='code_bash' />, [])

  return (
    <BaseNode
      title='Bash Code'
      description='AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。'
      color={colorSchemes.purple}
      handles={CODE_HANDLES}
      nodeComponent={nodeComponent}
    />
  )
})

export { RCodeNode, PythonCodeNode, BashCodeNode }
