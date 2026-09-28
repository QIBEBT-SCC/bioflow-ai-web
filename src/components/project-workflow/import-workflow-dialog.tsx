'use client'

import { LayersIcon, Loader2, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  relevanceOf,
  WorkflowLibrarySearch,
  WorkflowRelevanceBadge,
  WorkflowSearchFooter,
  WorkflowSearchResults,
} from '@/components/workflow/workflow-library-search'
import { useAddWorkflowToProject } from '@/hooks/use-project-workflow'
import { useWorkflowLibrarySearch } from '@/hooks/use-workflow-library-search'
import { cn } from '@/lib/utils'
import { ExecutionScope, WorkflowType } from '@/types/workflow'

interface ImportWorkflowDialogProps {
  projectId: string
}

export function ImportWorkflowDialog({ projectId }: ImportWorkflowDialogProps) {
  const t = useTranslations('Project.workflow.import')
  const tWorkflow = useTranslations('Project.workflow')
  const [open, setOpen] = useState(false)
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(
    new Set(),
  )
  const pageSize = 20
  const search = useWorkflowLibrarySearch(open, pageSize, WorkflowType.TEMPLATE)
  const workflows = search.results
  const addWorkflowMutation = useAddWorkflowToProject()

  const handleOpenChange = (next: boolean) => {
    search.reset()
    setOpen(next)
  }

  // 切换工作流选择
  const toggleWorkflow = (uid: string) => {
    setSelectedWorkflows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(uid)) {
        newSet.delete(uid)
      } else {
        newSet.add(uid)
      }
      return newSet
    })
  }

  // 导入选中的工作流
  const handleImport = async () => {
    if (selectedWorkflows.size === 0) {
      toast.error(t('selectAtLeastOne'))
      return
    }

    try {
      // 逐个导入工作流
      const promises = Array.from(selectedWorkflows).map((workflowUid) =>
        addWorkflowMutation.mutateAsync({
          projectId,
          data: { workflow_uid: workflowUid },
        }),
      )

      await Promise.all(promises)

      toast.success(t('importSuccess', { count: selectedWorkflows.size }))
      setSelectedWorkflows(new Set())
      handleOpenChange(false)
    } catch (error) {
      // 错误处理已在 mutation 中完成
      if (error instanceof Error) {
        if (error.message.includes('409')) {
          toast.error(t('someAlreadyExist'))
        } else {
          toast.error(t('importFailed'))
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className='size-4' />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className='w-[calc(100vw-2rem)] overflow-hidden sm:max-w-240'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <WorkflowLibrarySearch
          search={search}
          placeholder={t('searchPlaceholder')}
        />

        {/* 工作流列表 */}
        <ScrollArea className='h-100 w-full rounded-lg border p-3'>
          <WorkflowSearchResults
            search={search}
            emptyLabel={t('empty')}
            noMatchesLabel={t('noMatches')}
            skeletonRows={5}
          >
            <div className='min-w-0 space-y-2'>
              {workflows.map((workflow) => {
                const isSelected = selectedWorkflows.has(workflow.uid)
                const isProjectLevel =
                  workflow.execution_scope === ExecutionScope.PROJECT_LEVEL
                const relevance = relevanceOf(workflow)

                return (
                  <div
                    key={workflow.uid}
                    className={cn(
                      'flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    <Checkbox
                      aria-label={workflow.name}
                      checked={isSelected}
                      onCheckedChange={() => toggleWorkflow(workflow.uid)}
                    />
                    <button
                      type='button'
                      className='min-w-0 flex-1 space-y-2 text-left'
                      onClick={() => toggleWorkflow(workflow.uid)}
                    >
                      <div className='min-w-0 space-y-1.5'>
                        <h4
                          className='truncate text-sm font-medium'
                          title={workflow.name}
                        >
                          {workflow.name}
                        </h4>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'h-5 max-w-full gap-1 rounded px-1.5 text-[11px]',
                              isProjectLevel
                                ? 'border-info/30 bg-info/10 text-info'
                                : 'border-teal-200 bg-teal-50 text-teal-700',
                            )}
                          >
                            <LayersIcon className='size-3' />
                            {isProjectLevel
                              ? tWorkflow('projectLevel')
                              : tWorkflow('sampleLevel')}
                          </Badge>
                          {relevance !== undefined && (
                            <WorkflowRelevanceBadge score={relevance} />
                          )}
                        </div>
                      </div>
                      <p className='line-clamp-2 wrap-break-word text-xs text-muted-foreground'>
                        {workflow.description || t('noDescription')}
                      </p>
                    </button>
                  </div>
                )
              })}
            </div>
          </WorkflowSearchResults>
        </ScrollArea>

        <WorkflowSearchFooter search={search} pageSize={pageSize} />

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              selectedWorkflows.size === 0 || addWorkflowMutation.isPending
            }
          >
            {addWorkflowMutation.isPending ? (
              <>
                <Loader2 className='size-4 animate-spin' />
                {t('importing')}
              </>
            ) : (
              t('importSelected', { count: selectedWorkflows.size })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
