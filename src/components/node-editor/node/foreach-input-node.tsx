'use client'

import type { NodeProps } from '@xyflow/react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'

/** Runtime-only source for an item or shared path in a child DAG. */
export function ForeachInputNode({ data }: NodeProps) {
  return (
    <BaseNode
      title='ForEach input'
      description={String(data.path ?? '')}
      color={colorSchemes.blue}
      handles={{
        inputs: [],
        outputs: [{ name: 'file_path', description: 'Bound input path' }],
      }}
      nodeComponent={<div />}
    />
  )
}
