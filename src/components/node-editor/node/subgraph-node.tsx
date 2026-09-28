'use client'

import {
  type NodeProps,
  useEdges,
  useNodes,
  useUpdateNodeInternals,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { BatchItems } from '@/components/node-editor/node/batch-items'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useSubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { Button } from '@/components/ui/button'
import { emptyInterface } from '@/lib/subgraph'
import type { WorkflowDefinition, WorkflowInterface } from '@/types/workflow'

function SubgraphInterfaceDetails({
  value,
  itemPortId,
  batch,
}: {
  value: WorkflowInterface
  itemPortId?: string
  batch: boolean
}) {
  const t = useTranslations('editor.subgraph')
  return (
    <div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-6'>
      {(['inputs', 'outputs'] as const).map((kind) => (
        <section key={kind} className='space-y-3'>
          <h3 className='font-semibold text-sm'>{t(kind)}</h3>
          {(kind === 'outputs' && batch
            ? [
                {
                  id: 'results_folder',
                  name: t('batch_results'),
                  description: t('batch_results_description'),
                },
              ]
            : value[kind]
          ).length > 0 ? (
            <div className='space-y-2'>
              {(kind === 'outputs' && batch
                ? [
                    {
                      id: 'results_folder',
                      name: t('batch_results'),
                      description: t('batch_results_description'),
                    },
                  ]
                : value[kind]
              ).map((port) => (
                <div key={port.id} className='rounded-lg border p-3'>
                  <div className='font-medium text-sm'>
                    {port.name}
                    {kind === 'inputs' &&
                      batch &&
                      ` · ${t(port.id === itemPortId ? 'batch_item' : 'batch_shared')}`}
                  </div>
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
  const edges = useEdges()
  const nodes = useNodes()
  const batchEdge = edges.find(
    (edge) =>
      edge.target === id &&
      edge.sourceHandle === `${edge.source}-out-collection` &&
      nodes.some(
        (node) =>
          node.id === edge.source && node.type === 'collect_file_collection',
      ),
  )
  const runData = data.run_data as
    | {
        uid?: string
        run_uid?: string
        item_statistics?: Record<string, number>
      }
    | undefined
  const isBatch = !!batchEdge || !!runData?.uid
  const itemPortId = batchEdge?.targetHandle?.startsWith(`${id}-in-`)
    ? batchEdge.targetHandle.slice(`${id}-in-`.length)
    : undefined
  const portKey = JSON.stringify([iface, isBatch])

  // biome-ignore lint/correctness/useExhaustiveDependencies: React Flow must remeasure when the port schema changes.
  useEffect(() => {
    updateInternals(id)
  }, [id, portKey, updateInternals])

  return (
    <BaseNode
      title={String(data.name || t('title'))}
      description={
        isBatch ? t('batch_description') : String(data.description || '')
      }
      detailsContent={
        <SubgraphInterfaceDetails
          value={iface}
          itemPortId={itemPortId}
          batch={isBatch}
        />
      }
      color={colorSchemes.blue}
      handles={{
        inputs: iface.inputs.map((port) => ({
          name: port.id,
          label: isBatch
            ? `${port.name} · ${t(port.id === itemPortId ? 'batch_item' : 'batch_shared')}`
            : port.name,
          description: port.description,
        })),
        outputs: isBatch
          ? [
              {
                name: 'results_folder',
                label: t('batch_results'),
                description: t('batch_results_description'),
              },
            ]
          : iface.outputs.map((port) => ({
              name: port.id,
              label: port.name,
              description: port.description,
            })),
      }}
      nodeComponent={
        <div className='nodrag nowheel space-y-2 px-3'>
          {isBatch && runData?.uid && runData.run_uid && (
            <BatchItems
              nodeUid={runData.uid}
              runUid={runData.run_uid}
              counts={runData.item_statistics}
            />
          )}
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
