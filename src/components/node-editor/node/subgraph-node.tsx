'use client'

import { type NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useSubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { Button } from '@/components/ui/button'
import { emptyInterface } from '@/lib/subgraph'
import type { WorkflowDefinition } from '@/types/workflow'

export function SubgraphNode({ id, data }: NodeProps) {
  const t = useTranslations('editor.subgraph')
  const graph = data.workflow as WorkflowDefinition
  const iface = graph.interface ?? emptyInterface()
  const enter = useSubgraphNavigation()
  const updateInternals = useUpdateNodeInternals()
  const portKey = JSON.stringify(iface)

  // biome-ignore lint/correctness/useExhaustiveDependencies: React Flow must remeasure when the port schema changes.
  useEffect(() => {
    updateInternals(id)
  }, [id, portKey, updateInternals])

  return (
    <BaseNode
      title={String(data.name || t('title'))}
      description={String(data.description || '')}
      color={colorSchemes.blue}
      handles={{
        inputs: iface.inputs.map((port) => ({
          name: port.id,
          label: port.name,
          description: '',
        })),
        outputs: iface.outputs.map((port) => ({
          name: port.id,
          label: port.name,
          description: '',
        })),
      }}
      nodeComponent={
        <div className='nodrag nowheel px-3'>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => enter(id)}
          >
            {t('enter')} · {graph.nodes.length}
          </Button>
        </div>
      }
    />
  )
}
