'use client'

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  FolderOpenIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useDeleteWorkflow,
  useUpdateWorkflow,
  useWorkflowCount,
  useWorkflows,
} from '@/hooks/use-workflow'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

export function LoadWorkflowDialog() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 8

  const [deletingUid, setDeletingUid] = useState<string | null>(null)
  const [renamingUid, setRenamingUid] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const { currentWorkflowUid, setCurrentWorkflowUid } = useNodeEditorStore()
  const { data: workflows = [], isLoading } = useWorkflows(page * pageSize)
  const { data: totalCount = 0 } = useWorkflowCount()
  const updateWorkflowMutation = useUpdateWorkflow()
  const deleteWorkflowMutation = useDeleteWorkflow()

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleLoadWorkflow = (uid: string, name: string) => {
    setCurrentWorkflowUid(uid)
    setOpen(false)
    toast.success(`已加载工作流: ${name}`)
  }

  const handleRenameStart = (uid: string, currentName: string) => {
    setRenamingUid(uid)
    setRenameValue(currentName)
  }

  const handleRenameConfirm = async () => {
    if (!renamingUid || !renameValue.trim()) return
    await updateWorkflowMutation.mutateAsync({
      uid: renamingUid,
      data: { name: renameValue.trim() },
    })
    setRenamingUid(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUid) return
    await deleteWorkflowMutation.mutateAsync(deletingUid)
    if (deletingUid === currentWorkflowUid) {
      setCurrentWorkflowUid('')
    }
    setDeletingUid(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant='ghost' size='sm'>
            <FolderOpenIcon className='size-4 mr-2' />
            加载
          </Button>
        </DialogTrigger>
        <DialogContent className='flex flex-col sm:max-w-[520px] max-h-[80vh]'>
          <DialogHeader className='shrink-0'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-primary/10 rounded-full'>
                <FolderOpenIcon className='size-5 text-primary' />
              </div>
              <DialogTitle>加载工作流</DialogTitle>
            </div>
            <DialogDescription className='pt-1'>
              选择一个工作流加载到编辑器中
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col min-h-0 flex-1 gap-3 overflow-hidden'>
            {isLoading ? (
              <div className='flex items-center justify-center py-10'>
                <Loader2Icon className='size-6 animate-spin text-muted-foreground' />
              </div>
            ) : workflows.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
                <FileTextIcon className='size-12 mb-2 opacity-50' />
                <p>暂无工作流</p>
              </div>
            ) : (
              <ScrollArea className='flex-1 -mr-1 pr-1'>
                <div className='space-y-1.5'>
                  {workflows.map((workflow) => {
                    const isActive = workflow.uid === currentWorkflowUid
                    const isRenaming = renamingUid === workflow.uid

                    return (
                      <div
                        key={workflow.uid}
                        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all overflow-hidden min-w-0 ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/60 hover:bg-accent'
                        }`}
                      >
                        <FileTextIcon
                          className={`size-4 shrink-0 ${
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />

                        {isRenaming ? (
                          <div className='flex flex-1 items-center gap-1.5 min-w-0'>
                            <Input
                              className='h-7 text-sm'
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConfirm()
                                if (e.key === 'Escape') setRenamingUid(null)
                              }}
                              autoFocus
                            />
                            <Button
                              size='icon'
                              variant='ghost'
                              className='size-7 shrink-0'
                              onClick={handleRenameConfirm}
                              disabled={updateWorkflowMutation.isPending}
                            >
                              {updateWorkflowMutation.isPending ? (
                                <Loader2Icon className='size-3.5 animate-spin' />
                              ) : (
                                <CheckIcon className='size-3.5' />
                              )}
                            </Button>
                            <Button
                              size='icon'
                              variant='ghost'
                              className='size-7 shrink-0'
                              onClick={() => setRenamingUid(null)}
                            >
                              <XIcon className='size-3.5' />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type='button'
                            className='flex-1 w-2 text-left'
                            onClick={() =>
                              handleLoadWorkflow(workflow.uid, workflow.name)
                            }
                          >
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
                          </button>
                        )}

                        {isActive && !isRenaming && (
                          <span className='shrink-0 text-xs font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded'>
                            当前
                          </span>
                        )}

                        {!isRenaming && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontalIcon className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRenameStart(workflow.uid, workflow.name)
                                }
                              >
                                <PencilIcon className='size-4 mr-2' />
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeletingUid(workflow.uid)}
                              >
                                <Trash2Icon className='size-4 mr-2' />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
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
                    <ChevronLeftIcon className='size-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRightIcon className='size-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingUid}
        onOpenChange={(open) => !open && setDeletingUid(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个工作流吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteWorkflowMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
