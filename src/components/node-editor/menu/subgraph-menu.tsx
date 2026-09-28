'use client'

import { useReactFlow } from '@xyflow/react'
import { WorkflowIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { getWorkflow } from '@/app/actions/workflow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  relevanceOf,
  WorkflowLibrarySearch,
  WorkflowRelevanceBadge,
  WorkflowSearchFooter,
  WorkflowSearchResults,
} from '@/components/workflow/workflow-library-search'
import { useWorkflowLibrarySearch } from '@/hooks/use-workflow-library-search'
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
  const tSearch = useTranslations('WorkflowSearch')
  const search = useWorkflowLibrarySearch(true, 8, WorkflowType.SUBMODULE)
  const [inserting, setInserting] = useState(false)
  const { screenToFlowPosition } = useReactFlow()
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
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t('library')}</DialogTitle>
        </DialogHeader>
        <WorkflowLibrarySearch
          search={search}
          placeholder={t('search_placeholder')}
        />
        <WorkflowSearchResults
          search={search}
          emptyLabel={t('empty')}
          noMatchesLabel={t('no_search_results')}
        >
          <div className='-mx-1 grid max-h-[55vh] gap-1.5 overflow-y-auto px-1 py-0.5'>
            {search.results.map((item) => {
              const relevance = relevanceOf(item)
              return (
                <button
                  key={item.uid}
                  type='button'
                  className='group flex w-full min-w-0 items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60'
                  disabled={inserting}
                  onClick={() => void insert(item.uid)}
                >
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
                    <WorkflowIcon className='size-4' />
                  </div>
                  <div className='min-w-0 flex-1 space-y-0.5'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <span className='truncate text-sm font-medium group-hover:text-primary'>
                        {item.name}
                      </span>
                      {relevance !== undefined && (
                        <WorkflowRelevanceBadge score={relevance} />
                      )}
                    </div>
                    <p className='line-clamp-2 text-xs text-muted-foreground'>
                      {item.description || tSearch('noDescription')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </WorkflowSearchResults>
        <WorkflowSearchFooter
          search={search}
          pageSize={8}
          disabled={inserting}
        />
      </DialogContent>
    </Dialog>
  )
}
