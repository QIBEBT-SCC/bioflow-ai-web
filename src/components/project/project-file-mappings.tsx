'use client'

import {
  EditIcon,
  Loader2,
  MoreHorizontal,
  PlusIcon,
  Trash2Icon,
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
      toast.success('全局文件删除成功')
      setDeletingMapping(null)
    } catch {
      toast.error('全局文件删除失败')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
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
              <CardTitle>全局文件</CardTitle>
              <CardDescription>
                管理项目级共享资源，可在工作流中使用 proj:keyword 格式引用
              </CardDescription>
            </div>
            <AddProjectFileMappingDialog projectId={projectId} />
          </div>
        </CardHeader>
        <CardContent>
          {!mappings || mappings.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>
                暂无全局文件，点击"添加文件"按钮创建
              </p>
              <AddProjectFileMappingDialog
                projectId={projectId}
                trigger={
                  <Button>
                    <PlusIcon className='h-4 w-4 mr-2' />
                    添加文件
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[200px]'>关键字</TableHead>
                  <TableHead>文件路径</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className='w-[180px]'>创建时间</TableHead>
                  <TableHead className='w-[80px]'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className='font-mono font-medium'>
                      proj:{mapping.keyword}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {mapping.file_path}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {mapping.description}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {new Date(mapping.create_time).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => setEditingMapping(mapping)}
                          >
                            <EditIcon className='h-4 w-4 mr-2' />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => setDeletingMapping(mapping)}
                          >
                            <Trash2Icon className='h-4 w-4 mr-2' />
                            删除
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
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除全局文件 "proj:{deletingMapping?.keyword}" 吗？
              此操作无法撤销，使用此文件的工作流可能会受到影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
