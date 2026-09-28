'use client'

import {
  type NodeProps,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { BatchItems } from '@/components/node-editor/node/batch-items'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { useSubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { WorkflowDefinition } from '@/types/workflow'

export function ForeachNode({ id, data }: NodeProps) {
  const t = useTranslations('editor.foreach')
  const graph = data.workflow as WorkflowDefinition
  const ports = graph.interface?.inputs ?? []
  const pattern = typeof data.pattern === 'string' ? data.pattern : ''
  const readOnly = useReadOnly()
  const { updateNodeData } = useReactFlow()
  const updateInternals = useUpdateNodeInternals()
  const enter = useSubgraphNavigation()
  const runData = data.run_data as
    | {
        uid?: string
        run_uid?: string
        item_statistics?: Record<string, number>
      }
    | undefined
  const nodeUid = runData?.uid
  const parentUid = runData?.run_uid
  const portKey = JSON.stringify(ports)
  // biome-ignore lint/correctness/useExhaustiveDependencies: React Flow must remeasure when ports change.
  useEffect(() => updateInternals(id), [id, portKey, updateInternals])
  return (
    <BaseNode
      title={String(data.name || 'ForEach')}
      description={t('description')}
      color={colorSchemes.blue}
      handles={{
        inputs: [
          {
            name: 'folder_path',
            label: t('folder'),
            description: t('folderDescription'),
          },
          ...ports.slice(1).map((port) => ({
            name: port.id,
            label: port.name,
            description: port.description,
          })),
        ],
        outputs: [
          {
            name: 'results_folder',
            label: t('results'),
            description: t('resultsDescription'),
          },
        ],
      }}
      nodeComponent={
        <div className='nodrag nowheel space-y-2 p-3'>
          {readOnly ? (
            nodeUid &&
            parentUid && (
              <BatchItems
                nodeUid={nodeUid}
                runUid={parentUid}
                counts={runData?.item_statistics}
              />
            )
          ) : (
            <>
              <label className='text-xs' htmlFor={`${id}-pattern`}>
                {t('pattern')}
              </label>
              <Input
                id={`${id}-pattern`}
                value={pattern}
                placeholder={t('patternPlaceholder')}
                onChange={(event) =>
                  updateNodeData(id, { pattern: event.target.value })
                }
              />
              <Button
                variant='outline'
                className='w-full'
                onClick={() => enter(id)}
              >
                {t('editInner', { count: graph.nodes.length })}
              </Button>
            </>
          )}
        </div>
      }
    />
  )
}
