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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('descriptionText')}</CardDescription>
            </div>
            <AddProjectFileMappingDialog projectId={projectId} />
          </div>
        </CardHeader>
        <CardContent>
          {!mappings || mappings.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>{t('empty')}</p>
              <AddProjectFileMappingDialog
                projectId={projectId}
                trigger={
                  <Button>
                    <PlusIcon className='size-4 mr-2' />
                    {t('add')}
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[200px]'>{t('keyword')}</TableHead>
                  <TableHead>{t('filePath')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className='w-[180px]'>{t('createdAt')}</TableHead>
                  <TableHead className='w-[80px]'>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className='font-mono font-medium'>
                      <div className='flex items-center gap-2'>
                        <span>proj:{mapping.keyword}</span>
                        {mapping.is_dynamic && (
                          <Badge variant='secondary'>{t('dynamic')}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {mapping.file_path}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {mapping.description}
                    </TableCell>
                    <TableCell className='text-xs' suppressHydrationWarning>
                      {format(
                        parseISO(mapping.create_time),
                        'yyyy-MM-dd HH:mm:ss',
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <MoreHorizontal className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => setEditingMapping(mapping)}
                          >
                            <EditIcon className='size-4 mr-2' />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => setDeletingMapping(mapping)}
                          >
                            <Trash2Icon className='size-4 mr-2' />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
