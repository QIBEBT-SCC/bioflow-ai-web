'use client'

import { type NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { BaseNode } from './base-node'
import { colorSchemes } from './color'

export function SubgraphInterfaceNode({ id, data }: NodeProps) {
  const t = useTranslations('editor.subgraph')
  const updateNodeInternals = useUpdateNodeInternals()
  const inputs = data.kind === 'inputs'
  const ports = data.ports as { id: string; name: string }[]
  // Handle order changes require React Flow to measure their new positions.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ports controls handle positions, including reorder without resize.
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, ports, updateNodeInternals])
  const handles = ports.map((port) => ({
    id: port.id,
    name: port.id,
    label: port.name,
    description: '',
  }))
  return (
    <BaseNode
      title={t(inputs ? 'public_inputs' : 'public_outputs')}
      description={t('interface_help')}
      handles={{
        inputs: inputs ? [] : handles,
        outputs: inputs ? handles : [],
      }}
      color={colorSchemes.blue}
      nodeComponent={
        !ports.length ? (
          <p className='px-4 text-xs text-muted-foreground'>
            {t('add_handles_hint')}
          </p>
        ) : null
      }
    />
  )
}
