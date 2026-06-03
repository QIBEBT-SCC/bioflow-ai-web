'use client'

import { LayersIcon, Loader2, PlusIcon, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImagePagination } from '@/components/image/image-pagination'
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
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAddWorkflowToProject } from '@/hooks/use-project-workflow'
import { useWorkflows } from '@/hooks/use-workflow'
import { cn } from '@/lib/utils'
import { ExecutionScope } from '@/types/workflow'

interface ImportWorkflowDialogProps {
  projectId: string
}

export function ImportWorkflowDialog({ projectId }: ImportWorkflowDialogProps) {
  const t = useTranslations('Project.workflow.import')
  const tWorkflow = useTranslations('Project.workflow')
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(
    new Set(),
  )
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize

  const { data: workflowsPage, isLoading } = useWorkflows(offset, pageSize)
  const workflows = workflowsPage?.data ?? []
  const totalCount = workflowsPage?.total ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)
  const addWorkflowMutation = useAddWorkflowToProject()
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  const filteredWorkflows = normalizedSearchQuery
    ? workflows.filter((wf) => {
        const name = wf.name.toLowerCase()
        const description = wf.description.toLowerCase()

        return (
          name.includes(normalizedSearchQuery) ||
          description.includes(normalizedSearchQuery)
        )
      })
    : workflows

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
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
      setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className='size-4 mr-2' />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className='w-[calc(100vw-2rem)] overflow-hidden sm:max-w-240'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {/* 搜索框 */}
        <div className='relative min-w-0'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* 工作流列表 */}
        <ScrollArea className='h-100 w-full rounded-md border p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='size-8 animate-spin text-muted-foreground' />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              {searchQuery ? t('noMatches') : t('empty')}
            </div>
          ) : (
            <div className='min-w-0 space-y-2'>
              {filteredWorkflows.map((workflow) => {
                const isSelected = selectedWorkflows.has(workflow.uid)
                const isProjectLevel =
                  workflow.execution_scope === ExecutionScope.PROJECT_LEVEL

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
                        <Badge
                          variant='outline'
                          className={cn(
                            'h-5 max-w-full gap-1 rounded px-1.5 text-[11px]',
                            isProjectLevel
                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                              : 'border-teal-200 bg-teal-50 text-teal-700',
                          )}
                        >
                          <LayersIcon className='size-3' />
                          {isProjectLevel
                            ? tWorkflow('projectLevel')
                            : tWorkflow('sampleLevel')}
                        </Badge>
                      </div>
                      <p className='line-clamp-2 wrap-break-word text-xs text-muted-foreground'>
                        {workflow.description || t('noDescription')}
                      </p>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {totalPages > 1 && (
          <ImagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
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
                <Loader2 className='size-4 mr-2 animate-spin' />
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
