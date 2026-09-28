'use client'

import {
  CheckIcon,
  FileTextIcon,
  FolderOpenIcon,
  LayersIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
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
  relevanceOf,
  WorkflowLibrarySearch,
  WorkflowRelevanceBadge,
  WorkflowSearchFooter,
  WorkflowSearchResults,
} from '@/components/workflow/workflow-library-search'
import { useDeleteWorkflow, useUpdateWorkflow } from '@/hooks/use-workflow'
import { useWorkflowLibrarySearch } from '@/hooks/use-workflow-library-search'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import { ExecutionScope } from '@/types/workflow'

type InteractionState = {
  deletingUid: string | null
  renamingUid: string | null
  renameValue: string
}

type InteractionAction =
  | { type: 'START_RENAME'; uid: string; name: string }
  | { type: 'SET_RENAME_VALUE'; value: string }
  | { type: 'CANCEL_RENAME' }
  | { type: 'START_DELETE'; uid: string }
  | { type: 'CANCEL_DELETE' }

const INITIAL_INTERACTION: InteractionState = {
  deletingUid: null,
  renamingUid: null,
  renameValue: '',
}

function interactionReducer(
  state: InteractionState,
  action: InteractionAction,
): InteractionState {
  switch (action.type) {
    case 'START_RENAME':
      return { ...state, renamingUid: action.uid, renameValue: action.name }
    case 'SET_RENAME_VALUE':
      return { ...state, renameValue: action.value }
    case 'CANCEL_RENAME':
      return { ...state, renamingUid: null, renameValue: '' }
    case 'START_DELETE':
      return { ...state, deletingUid: action.uid }
    case 'CANCEL_DELETE':
      return { ...state, deletingUid: null }
  }
}

function DeleteWorkflowConfirmation({
  open,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean
  pending: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const t = useTranslations('editor.load_workflow_dialog')
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirm_delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirm_delete_description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onConfirm()}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {pending ? t('deleting') : t('confirm_delete_action')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function LoadWorkflowDialog() {
  const t = useTranslations('editor.load_workflow_dialog')
  const tSearch = useTranslations('WorkflowSearch')
  const [open, setOpen] = useState(false)
  const pageSize = 8
  const search = useWorkflowLibrarySearch(open, pageSize)

  const [{ deletingUid, renamingUid, renameValue }, dispatch] = useReducer(
    interactionReducer,
    INITIAL_INTERACTION,
  )

  const { currentWorkflowUid, setCurrentWorkflowUid } = useNodeEditorStore()
  const workflows = search.results
  const updateWorkflowMutation = useUpdateWorkflow()
  const deleteWorkflowMutation = useDeleteWorkflow()

  const handleOpenChange = (next: boolean) => {
    search.reset()
    setOpen(next)
  }

  const handleLoadWorkflow = (uid: string, name: string) => {
    setCurrentWorkflowUid(uid)
    handleOpenChange(false)
    toast.success(t('workflow_loaded', { name }))
  }

  const handleRenameStart = (uid: string, currentName: string) => {
    dispatch({ type: 'START_RENAME', uid, name: currentName })
  }

  const handleRenameConfirm = async () => {
    if (!renamingUid || !renameValue.trim()) return
    await updateWorkflowMutation.mutateAsync({
      uid: renamingUid,
      data: { name: renameValue.trim() },
    })
    search.invalidateSemantic()
    dispatch({ type: 'CANCEL_RENAME' })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUid) return
    await deleteWorkflowMutation.mutateAsync(deletingUid)
    search.invalidateSemantic()
    if (deletingUid === currentWorkflowUid) {
      setCurrentWorkflowUid('')
    }
    dispatch({ type: 'CANCEL_DELETE' })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant='ghost' size='sm'>
            <FolderOpenIcon className='size-4 mr-2' />
            {t('trigger')}
          </Button>
        </DialogTrigger>
        <DialogContent className='flex flex-col sm:max-w-xl max-h-[80vh]'>
          <DialogHeader className='shrink-0'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-primary/10 rounded-full'>
                <FolderOpenIcon className='size-5 text-primary' />
              </div>
              <DialogTitle>{t('title')}</DialogTitle>
            </div>
            <DialogDescription className='pt-1'>
              {t('description')}
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col min-h-0 flex-1 gap-3 overflow-hidden'>
            <WorkflowLibrarySearch
              search={search}
              placeholder={tSearch('namePlaceholder')}
            />
            <WorkflowSearchResults
              search={search}
              emptyLabel={t('empty')}
              noMatchesLabel={tSearch('noMatches')}
            >
              <ScrollArea className='flex-1 -mr-1 pr-1'>
                <div className='space-y-1.5'>
                  {workflows.map((workflow) => {
                    const isActive = workflow.uid === currentWorkflowUid
                    const isRenaming = renamingUid === workflow.uid
                    const relevance = relevanceOf(workflow)

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
                              onChange={(e) =>
                                dispatch({
                                  type: 'SET_RENAME_VALUE',
                                  value: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConfirm()
                                if (e.key === 'Escape')
                                  dispatch({ type: 'CANCEL_RENAME' })
                              }}
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
                              onClick={() =>
                                dispatch({ type: 'CANCEL_RENAME' })
                              }
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
                            <div className='mt-1 flex min-w-0 items-center gap-1.5'>
                              <Badge
                                variant='outline'
                                className='h-5 gap-1 rounded px-1.5 text-[11px]'
                              >
                                <LayersIcon className='size-3' />
                                {workflow.execution_scope ===
                                ExecutionScope.PROJECT_LEVEL
                                  ? t('scope_project')
                                  : t('scope_sample')}
                              </Badge>
                              {relevance !== undefined && (
                                <WorkflowRelevanceBadge score={relevance} />
                              )}
                              <span className='truncate text-xs text-muted-foreground/70'>
                                {workflow.description || t('no_description')}
                              </span>
                            </div>
                          </button>
                        )}

                        {isActive && !isRenaming && (
                          <span className='shrink-0 text-xs font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded'>
                            {t('current')}
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
                                {t('rename')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() =>
                                  dispatch({
                                    type: 'START_DELETE',
                                    uid: workflow.uid,
                                  })
                                }
                              >
                                <Trash2Icon className='size-4 mr-2' />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </WorkflowSearchResults>

            <WorkflowSearchFooter search={search} pageSize={pageSize} />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteWorkflowConfirmation
        open={!!deletingUid}
        pending={deleteWorkflowMutation.isPending}
        onClose={() => dispatch({ type: 'CANCEL_DELETE' })}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
