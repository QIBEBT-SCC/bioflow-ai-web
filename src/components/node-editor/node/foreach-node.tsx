'use client'

import { useQuery } from '@tanstack/react-query'
import {
  type NodeProps,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { useSubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { clientFetchV2 } from '@/lib/api-client'
import type { WorkflowDefinition } from '@/types/workflow'

interface ChildItem {
  key: string
  name: string
  run_uid: string
  status: string
  started: boolean
  settled: boolean
}
interface ChildPage {
  total: number
  has_more: boolean
  data: ChildItem[]
}

export function ForeachNode({ id, data }: NodeProps) {
  const t = useTranslations('editor.foreach')
  const graph = data.workflow as WorkflowDefinition
  const ports = graph.interface?.inputs ?? []
  const pattern = typeof data.pattern === 'string' ? data.pattern : ''
  const readOnly = useReadOnly()
  const { updateNodeData } = useReactFlow()
  const updateInternals = useUpdateNodeInternals()
  const enter = useSubgraphNavigation()
  const [open, setOpen] = useState(false)
  const [offset, setOffset] = useState(0)
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
  const items = useQuery({
    queryKey: ['foreach-items', parentUid, nodeUid, offset],
    queryFn: () =>
      clientFetchV2<ChildPage>(`/runs/${parentUid}/foreach/${nodeUid}/items`, {
        params: { offset: String(offset), limit: '50' },
      }),
    enabled: open && !!parentUid && !!nodeUid,
    refetchInterval: open ? 3000 : false,
  })
  const counts = runData?.item_statistics
  return (
    <>
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
            {counts && (
              <div className='text-xs'>
                {t('stats', {
                  total: counts.total,
                  pending: counts.pending,
                  running: counts.running,
                  succeeded: counts.succeeded,
                  failed: counts.failed,
                })}
              </div>
            )}
            {readOnly ? (
              <Button
                variant='outline'
                className='w-full'
                onClick={() => setOpen(true)}
              >
                {t('viewItems')}
              </Button>
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('items')}</DialogTitle>
          </DialogHeader>
          {items.isPending && <p>{t('loading')}</p>}
          {items.error && <p role='alert'>{items.error.message}</p>}
          {items.data?.data.map((item) => (
            <Link
              key={item.key}
              href={`/workflow/${item.run_uid}`}
              className='flex justify-between rounded border p-2 hover:bg-accent'
            >
              <span>{item.name}</span>
              <span>
                {item.started
                  ? t(
                      `status.${item.status as 'pending' | 'running' | 'succeeded' | 'failed'}`,
                    )
                  : t('waiting')}
              </span>
            </Link>
          ))}
          {items.data && (
            <div className='flex justify-between gap-2'>
              <Button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 50))}
              >
                {t('previous')}
              </Button>
              <span>
                {offset + 1}–{Math.min(offset + 50, items.data.total)} /{' '}
                {items.data.total}
              </span>
              <Button
                disabled={!items.data.has_more}
                onClick={() => setOffset(offset + 50)}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
