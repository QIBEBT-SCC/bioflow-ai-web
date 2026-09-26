'use client'

import { useReactFlow } from '@xyflow/react'
import { SearchIcon } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useSearchSubgraphs, useWorkflows } from '@/hooks/use-workflow'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [inserting, setInserting] = useState(false)
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300)
  const isSearching = searchQuery.trim().length > 0
  const isDebouncing = isSearching && debouncedQuery !== searchQuery.trim()
  const { screenToFlowPosition } = useReactFlow()
  const { data, isPending, error } = useWorkflows(
    offset,
    8,
    WorkflowType.SUBMODULE,
  )
  const semanticSearch = useSearchSubgraphs(debouncedQuery, 20)
  const activeItems = isSearching
    ? (semanticSearch.data ?? [])
    : (data?.data ?? [])
  const activePending = isSearching
    ? isDebouncing || semanticSearch.isPending
    : isPending
  const activeError = isSearching
    ? isDebouncing
      ? null
      : semanticSearch.error
    : error
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
        <div className='relative'>
          <SearchIcon className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='search'
            className='pl-9'
            aria-label={t('search_placeholder')}
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setOffset(0)
            }}
          />
        </div>
        {activePending && <p>{isSearching ? t('searching') : t('loading')}</p>}
        {activeError && <p role='alert'>{activeError.message}</p>}
        <div className='grid max-h-[60vh] gap-2 overflow-y-auto'>
          {!activePending &&
            !activeError &&
            activeItems.map((item) => (
              <Button
                key={item.uid}
                variant='outline'
                className='h-auto justify-start whitespace-normal text-left'
                disabled={inserting}
                onClick={() => void insert(item.uid)}
              >
                <span>
                  <strong>{item.name}</strong>
                  <span className='line-clamp-2 text-xs text-muted-foreground'>
                    {item.description}
                  </span>
                </span>
              </Button>
            ))}
        </div>
        {!activePending && !activeError && activeItems.length === 0 && (
          <p>{isSearching ? t('no_search_results') : t('empty')}</p>
        )}
        {isSearching ? (
          !activePending &&
          !activeError && (
            <p className='text-sm text-muted-foreground'>
              {t('search_results_count', { count: activeItems.length })}
            </p>
          )
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  )
}
