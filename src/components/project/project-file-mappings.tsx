'use client'

import { format, parseISO } from 'date-fns'
import {
  EditIcon,
  InfoIcon,
  Loader2,
  MoreHorizontal,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useDeleteProjectFileMapping,
  useProjectFileMappings,
} from '@/hooks/use-sample'
import { cn } from '@/lib/utils'
import type { ProjectFileMapping } from '@/types/sample'
import { AddProjectFileMappingDialog } from './add-project-file-mapping-dialog'
import { EditProjectFileMappingDialog } from './edit-project-file-mapping-dialog'

interface ProjectFileMappingsProps {
  projectId: string
}

export function ProjectFileMappings({ projectId }: ProjectFileMappingsProps) {
  const t = useTranslations('Project.fileMapping')
  const [editingMapping, setEditingMapping] =
    useState<ProjectFileMapping | null>(null)
  const [deletingMapping, setDeletingMapping] =
    useState<ProjectFileMapping | null>(null)

  const { data: mappings, isLoading } = useProjectFileMappings(projectId)
  const deleteMutation = useDeleteProjectFileMapping()

  const handleDelete = async () => {
    if (!deletingMapping) return

    try {
      await deleteMutation.mutateAsync({
        projectId,
        mappingId: deletingMapping.id,
      })
      toast.success(t('deleteSuccess'))
      setDeletingMapping(null)
    } catch {
      toast.error(t('deleteFailed'))
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className='min-w-0 gap-4 overflow-hidden'>
        <CardHeader>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='min-w-0'>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('descriptionText')}</CardDescription>
            </div>
            <AddProjectFileMappingDialog projectId={projectId} />
          </div>
        </CardHeader>
        <CardContent className='px-0'>
          {!mappings || mappings.length === 0 ? (
            <div className='px-6 py-12 text-center'>
              <p className='mb-4 text-muted-foreground'>{t('empty')}</p>
              <AddProjectFileMappingDialog
                projectId={projectId}
                trigger={
                  <Button>
                    <PlusIcon className='mr-2 size-4' />
                    {t('add')}
                  </Button>
                }
              />
            </div>
          ) : (
            <TooltipProvider>
              <div className='grid grid-cols-1 divide-y border-y lg:grid-cols-[max-content_minmax(0,1fr)_auto]'>
                <div className='col-span-full hidden grid-cols-subgrid gap-4 bg-muted/30 px-6 py-2.5 text-xs font-medium text-muted-foreground lg:grid'>
                  <span>{t('keyword')}</span>
                  <span>{t('filePath')}</span>
                  <span className='pr-11 text-right'>{t('createdAt')}</span>
                </div>
                {mappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className='grid min-w-0 gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-6 lg:col-span-full lg:grid-cols-subgrid lg:items-center'
                  >
                    <div
                      className={cn(
                        '-mx-3 -my-2 flex min-w-0 items-center rounded-md border-l-2 border-transparent px-3 py-2 lg:self-stretch',
                        mapping.is_dynamic &&
                          'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30',
                      )}
                    >
                      <div className='flex min-w-0 items-center gap-2 font-mono font-medium'>
                        <span className='whitespace-nowrap'>
                          proj:{mapping.keyword}
                        </span>
                        {mapping.description && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type='button'
                                className='shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                aria-label={t('description')}
                              >
                                <InfoIcon className='size-4' />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side='top'
                              align='start'
                              sideOffset={6}
                              className='max-w-sm whitespace-normal text-pretty'
                            >
                              {mapping.description}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {mapping.is_dynamic && (
                          <span className='sr-only'>{t('dynamic')}</span>
                        )}
                      </div>
                    </div>
                    <div className='min-w-0'>
                      <p className='break-all font-mono text-xs'>
                        {mapping.file_path}
                      </p>
                    </div>
                    <div className='flex items-center justify-between gap-3 lg:justify-end'>
                      <div className='text-xs lg:text-right'>
                        <p suppressHydrationWarning>
                          {format(
                            parseISO(mapping.create_time),
                            'yyyy-MM-dd HH:mm:ss',
                          )}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='shrink-0'
                          >
                            <MoreHorizontal className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => setEditingMapping(mapping)}
                          >
                            <EditIcon className='mr-2 size-4' />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => setDeletingMapping(mapping)}
                          >
                            <Trash2Icon className='mr-2 size-4' />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      {editingMapping && (
        <EditProjectFileMappingDialog
          key={editingMapping.id}
          projectId={projectId}
          mapping={editingMapping}
          open={!!editingMapping}
          onOpenChange={(open) => !open && setEditingMapping(null)}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deletingMapping}
        onOpenChange={(open) => !open && setDeletingMapping(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialogDescription', {
                keyword: `proj:${deletingMapping?.keyword ?? ''}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
