'use client'

import { format, parseISO } from 'date-fns'
import {
  EditIcon,
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
import { Badge } from '@/components/ui/badge'
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
  useDeleteProjectFileMapping,
  useProjectFileMappings,
} from '@/hooks/use-sample'
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
            <div className='divide-y border-y'>
              <div className='hidden grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 bg-muted/30 px-6 py-2.5 text-xs font-medium text-muted-foreground lg:grid'>
                <span>{t('keyword')}</span>
                <span>{t('filePath')}</span>
                <span>{t('description')}</span>
                <span className='pr-11 text-right'>{t('createdAt')}</span>
              </div>
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className='grid min-w-0 gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-center'
                >
                  <div className='min-w-0'>
                    <div className='flex min-w-0 flex-wrap items-center gap-2 font-mono font-medium'>
                      <span className='break-all'>proj:{mapping.keyword}</span>
                      {mapping.is_dynamic && (
                        <Badge variant='secondary'>{t('dynamic')}</Badge>
                      )}
                    </div>
                  </div>
                  <div className='min-w-0'>
                    <p className='break-all font-mono text-xs'>
                      {mapping.file_path}
                    </p>
                  </div>
                  <div className='min-w-0'>
                    <p className='break-words text-sm'>
                      {mapping.description || '—'}
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
