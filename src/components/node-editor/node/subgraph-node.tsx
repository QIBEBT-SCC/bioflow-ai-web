'use client'

import { type NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useSubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { Button } from '@/components/ui/button'
import { emptyInterface } from '@/lib/subgraph'
import type { WorkflowDefinition, WorkflowInterface } from '@/types/workflow'

function SubgraphInterfaceDetails({ value }: { value: WorkflowInterface }) {
  const t = useTranslations('editor.subgraph')
  return (
    <div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-6'>
      {(['inputs', 'outputs'] as const).map((kind) => (
        <section key={kind} className='space-y-3'>
          <h3 className='font-semibold text-sm'>{t(kind)}</h3>
          {value[kind].length > 0 ? (
            <div className='space-y-2'>
              {value[kind].map((port) => (
                <div key={port.id} className='rounded-lg border p-3'>
                  <div className='font-medium text-sm'>{port.name}</div>
                  {port.description && (
                    <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
                      {port.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className='rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground'>
              {t('no_ports')}
            </p>
          )}
        </section>
      ))}
    </div>
  )
}

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
      detailsContent={<SubgraphInterfaceDetails value={iface} />}
      color={colorSchemes.blue}
      handles={{
        inputs: iface.inputs.map((port) => ({
          name: port.id,
          label: port.name,
          description: port.description,
        })),
        outputs: iface.outputs.map((port) => ({
          name: port.id,
          label: port.name,
          description: port.description,
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
