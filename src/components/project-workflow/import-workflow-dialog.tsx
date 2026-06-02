'use client'

import { Loader2, PlusIcon, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImagePagination } from '@/components/image/image-pagination'
import { Button } from '@/components/ui/button'
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

interface ImportWorkflowDialogProps {
  projectId: string
}

export function ImportWorkflowDialog({ projectId }: ImportWorkflowDialogProps) {
  const t = useTranslations('Project.workflow.import')
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const addWorkflowMutation = useAddWorkflowToProject()

  // 过滤工作流
  const filteredWorkflows = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {/* 搜索框 */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* 工作流列表 */}
        <ScrollArea className='h-100 rounded-md border p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='size-8 animate-spin text-muted-foreground' />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              {searchQuery ? t('noMatches') : t('empty')}
            </div>
          ) : (
            <div className='space-y-2'>
              {filteredWorkflows.map((workflow) => (
                <button
                  key={workflow.uid}
                  type='button'
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left w-full ${
                    selectedWorkflows.has(workflow.uid)
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleWorkflow(workflow.uid)}
                >
                  <div className='flex items-center h-5'>
                    <input
                      type='checkbox'
                      aria-label={workflow.name}
                      checked={selectedWorkflows.has(workflow.uid)}
                      onChange={() => toggleWorkflow(workflow.uid)}
                      className='size-4 rounded border-gray-300'
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-sm'>{workflow.name}</h4>
                    <p className='text-xs text-muted-foreground mt-1'>
                      UID: {workflow.uid}
                    </p>
                  </div>
                </button>
              ))}
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
