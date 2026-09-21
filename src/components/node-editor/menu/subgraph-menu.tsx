'use client'

import { useReactFlow } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { getWorkflow } from '@/app/actions/workflow'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkflows } from '@/hooks/use-workflow'
import { makeSubgraph } from '@/lib/subgraph'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import { WorkflowType } from '@/types/workflow'

export function SubgraphMenu({
  position,
  onClose,
}: {
  position: { x: number; y: number }
  onClose: () => void
}) {
  const t = useTranslations('editor.subgraph')
  const [offset, setOffset] = useState(0)
  const [inserting, setInserting] = useState(false)
  const { screenToFlowPosition } = useReactFlow()
  const { data, isPending, error } = useWorkflows(
    offset,
    8,
    WorkflowType.SUBMODULE,
  )
  const insert = async (uid: string) => {
    if (inserting) return
    setInserting(true)
    try {
      const saved = await getWorkflow(uid)
      if (!saved.workflow.interface) {
        toast.error(t('legacy'))
        return
      }
      const node = makeSubgraph(saved.workflow, saved.name, uid)
      node.data.description = saved.description
      node.position = screenToFlowPosition(position)
      useNodeEditorStore.getState().setNodes((nodes) => [...nodes, node])
      onClose()
    } catch (error) {
      toast.error(String(error))
    } finally {
      setInserting(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !inserting) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('library')}</DialogTitle>
        </DialogHeader>
        {isPending && <p>{t('loading')}</p>}
        {error && <p role='alert'>{error.message}</p>}
        <div className='grid max-h-[60vh] gap-2 overflow-y-auto'>
          {data?.data.map((item) => (
            <Button
              key={item.uid}
              variant='outline'
              className='h-auto justify-start whitespace-normal text-left'
              disabled={inserting}
              onClick={() => void insert(item.uid)}
            >
              <span>
                <strong>{item.name}</strong>
                <span className='block text-xs text-muted-foreground'>
                  {item.description}
                </span>
              </span>
            </Button>
          ))}
        </div>
        {data?.total === 0 && <p>{t('empty')}</p>}
        <div className='flex justify-between'>
          <Button
            disabled={!offset || inserting || isPending}
            onClick={() => setOffset((current) => current - 8)}
          >
            {t('previous')}
          </Button>
          <Button
            disabled={!data?.has_more || inserting || isPending}
            onClick={() => setOffset((current) => current + 8)}
          >
            {t('next')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
