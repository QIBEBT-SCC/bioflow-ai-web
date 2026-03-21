'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  FolderOpenIcon,
  Loader2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWorkflowCount, useWorkflows } from '@/hooks/use-workflow'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

export function LoadWorkflowDialog() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 8

  const { currentWorkflowUid, setCurrentWorkflowUid } = useNodeEditorStore()
  const { data: workflows = [], isLoading } = useWorkflows(page * pageSize)
  const { data: totalCount = 0 } = useWorkflowCount()

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleLoadWorkflow = (uid: string, name: string) => {
    setCurrentWorkflowUid(uid)
    setOpen(false)
    toast.success(`已加载工作流: ${name}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm'>
          <FolderOpenIcon className='h-4 w-4 mr-2' />
          加载
        </Button>
      </DialogTrigger>
      <DialogContent className='flex flex-col sm:max-w-[520px] max-h-[80vh]'>
        <DialogHeader className='shrink-0'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-primary/10 rounded-full'>
              <FolderOpenIcon className='h-5 w-5 text-primary' />
            </div>
            <DialogTitle>加载工作流</DialogTitle>
          </div>
          <DialogDescription className='pt-1'>
            选择一个工作流加载到编辑器中
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col min-h-0 flex-1 gap-3'>
          {isLoading ? (
            <div className='flex items-center justify-center py-10'>
              <Loader2Icon className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : workflows.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
              <FileTextIcon className='h-12 w-12 mb-2 opacity-50' />
              <p>暂无工作流</p>
            </div>
          ) : (
            <ScrollArea className='flex-1 -mr-1 pr-1'>
              <div className='space-y-1.5'>
                {workflows.map((workflow) => {
                  const isActive = workflow.uid === currentWorkflowUid
                  return (
                    <button
                      key={workflow.uid}
                      type='button'
                      onClick={() =>
                        handleLoadWorkflow(workflow.uid, workflow.name)
                      }
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all hover:border-primary/60 hover:bg-accent ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <FileTextIcon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <div className='flex-1 min-w-0'>
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {workflow.name}
                          </p>
                          <p className='text-xs text-muted-foreground/70 truncate mt-0.5'>
                            {workflow.uid}
                          </p>
                        </div>
                        {isActive && (
                          <span className='shrink-0 text-xs font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded'>
                            当前
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {totalPages > 1 && (
            <div className='shrink-0 flex items-center justify-between pt-2 border-t'>
              <p className='text-xs text-muted-foreground'>
                {page + 1} / {totalPages} 页 · 共 {totalCount} 个
              </p>
              <div className='flex gap-1.5'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeftIcon className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRightIcon className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
