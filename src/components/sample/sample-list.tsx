'use client'

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  Loader2,
  MoreHorizontal,
  Trash2Icon,
} from 'lucide-react'
import { Fragment, useState } from 'react'
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
  useDeleteSample,
  useDeleteSampleFile,
  useSample,
  useSamples,
} from '@/hooks/use-sample'
import type { SampleFileType } from '@/types/sample'
import { AddSampleFileDialog } from './add-sample-file-dialog'
import { CreateSampleDialog } from './create-sample-dialog'
import { EditSampleDialog } from './edit-sample-dialog'

interface SampleListProps {
  projectId: string
}

// 文件类型标签映射
const fileTypeLabels: Record<SampleFileType, string> = {
  0: '测序 R1',
  1: '测序 R2',
  2: '单端测序',
  3: '光谱',
  4: '图像',
}

// 文件类型颜色映射
const fileTypeColors: Record<SampleFileType, string> = {
  0: 'bg-blue-100 text-blue-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-cyan-100 text-cyan-800',
  3: 'bg-purple-100 text-purple-800',
  4: 'bg-green-100 text-green-800',
}

// 默认标签映射
const defaultTags: Record<SampleFileType, string> = {
  0: 'r1',
  1: 'r2',
  2: 'single',
  3: 'spectrum',
  4: 'image',
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function SampleList({ projectId }: SampleListProps) {
  const [expandedSamples, setExpandedSamples] = useState<
    Record<string, boolean>
  >({})
  const [editingSample, setEditingSample] = useState<string | null>(null)
  const [deletingSample, setDeletingSample] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState<{
    sampleUid: string
    fileUid: string
  } | null>(null)

  const { data: samples, isLoading } = useSamples(projectId)
  const deleteSampleMutation = useDeleteSample()
  const deleteFileMutation = useDeleteSampleFile()

  // 切换样本展开状态
  const toggleSampleExpand = (sampleUid: string) => {
    setExpandedSamples((prev) => ({
      ...prev,
      [sampleUid]: !prev[sampleUid],
    }))
  }

  // 获取展开样本的详细信息
  const { data: expandedSampleData } = useSample(
    projectId,
    Object.keys(expandedSamples).find((uid) => expandedSamples[uid]) || '',
  )

  // 获取正在编辑的样本的完整数据
  const { data: editingSampleData } = useSample(projectId, editingSample || '')

  const handleDelete = async (sampleUid: string) => {
    try {
      await deleteSampleMutation.mutateAsync({
        projectId,
        sampleUid,
      })

      toast.success('样本删除成功')

      setDeletingSample(null)
    } catch {
      toast.error('样本删除失败')
    }
  }

  const handleDeleteFile = async (sampleUid: string, fileUid: string) => {
    try {
      await deleteFileMutation.mutateAsync({
        projectId,
        sampleUid,
        fileUid,
      })

      toast.success('文件删除成功')

      setDeletingFile(null)
    } catch {
      toast.error('文件删除失败')
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
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>样本管理</CardTitle>
              <CardDescription>管理项目中的生物样本及其文件</CardDescription>
            </div>
            <CreateSampleDialog projectId={projectId} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[30px]'></TableHead>
                <TableHead className='w-[180px]'>样本名称</TableHead>
                <TableHead>元数据</TableHead>
                <TableHead className='w-[180px]'>创建时间</TableHead>
                <TableHead className='w-[100px]'>文件数量</TableHead>
                <TableHead className='w-[100px]'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!samples || samples.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center py-8 text-muted-foreground'
                  >
                    暂无样本数据,点击"添加样本"按钮创建新样本
                  </TableCell>
                </TableRow>
              ) : (
                samples.map((sample) => {
                  const isExpanded = expandedSamples[sample.uid]
                  const sampleDetails =
                    isExpanded && expandedSampleData?.uid === sample.uid
                      ? expandedSampleData
                      : null

                  return (
                    <Fragment key={sample.uid}>
                      <TableRow className='cursor-pointer hover:bg-muted/50'>
                        <TableCell
                          onClick={() => toggleSampleExpand(sample.uid)}
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className='size-4' />
                          ) : (
                            <ChevronRightIcon className='size-4' />
                          )}
                        </TableCell>
                        <TableCell
                          className='font-medium'
                          onClick={() => toggleSampleExpand(sample.uid)}
                        >
                          {sample.sample_name}
                        </TableCell>
                        <TableCell
                          onClick={() => toggleSampleExpand(sample.uid)}
                        >
                          <div className='flex flex-wrap gap-1'>
                            {Object.entries(sample.meta_data || {}).map(
                              ([key, value]) => (
                                <Badge
                                  key={key}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {key}: {String(value)}
                                </Badge>
                              ),
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          onClick={() => toggleSampleExpand(sample.uid)}
                          suppressHydrationWarning
                        >
                          {new Date(sample.create_time).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell
                          onClick={() => toggleSampleExpand(sample.uid)}
                        >
                          {sample.file_count}
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
                                onClick={() => setEditingSample(sample.uid)}
                              >
                                <EditIcon className='size-4 mr-2' />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeletingSample(sample.uid)}
                              >
                                <Trash2Icon className='size-4 mr-2' />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isExpanded && sampleDetails && (
                        <TableRow className='bg-muted/30'>
                          <TableCell colSpan={6} className='p-0'>
                            <div className='p-4'>
                              <div className='flex items-center justify-between mb-2'>
                                <h4 className='text-sm font-semibold'>
                                  样本文件
                                </h4>
                                <AddSampleFileDialog
                                  projectId={projectId}
                                  sampleUid={sampleDetails.uid}
                                />
                              </div>
                              {sampleDetails.files.length === 0 ? (
                                <p className='text-sm text-muted-foreground'>
                                  该样本暂无文件,点击"添加文件"按钮添加
                                </p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className='w-[180px]'>
                                        文件类型
                                      </TableHead>
                                      <TableHead>文件路径</TableHead>
                                      <TableHead className='w-[100px]'>
                                        格式
                                      </TableHead>
                                      <TableHead className='w-[100px]'>
                                        大小
                                      </TableHead>
                                      <TableHead className='w-[120px]'>
                                        MD5校验
                                      </TableHead>
                                      <TableHead className='w-[180px]'>
                                        上传时间
                                      </TableHead>
                                      <TableHead className='w-[80px]'>
                                        操作
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sampleDetails.files.map((file) => {
                                      const isDefaultTag =
                                        file.tag === defaultTags[file.data_type]
                                      return (
                                        <TableRow key={file.uid}>
                                          <TableCell>
                                            <div className='flex flex-wrap gap-1'>
                                              <Badge
                                                className={
                                                  fileTypeColors[file.data_type]
                                                }
                                              >
                                                {fileTypeLabels[file.data_type]}
                                              </Badge>
                                              {file.tag && (
                                                <Badge
                                                  variant='outline'
                                                  className={
                                                    isDefaultTag
                                                      ? 'text-muted-foreground'
                                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                                  }
                                                >
                                                  {file.tag}
                                                </Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className='font-mono text-xs'>
                                            {file.file_path}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant='outline'>
                                              {file.file_format}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            {formatFileSize(file.file_size)}
                                          </TableCell>
                                          <TableCell>
                                            <div className='flex items-center'>
                                              <CheckIcon className='size-4 text-green-500 mr-1' />
                                              <span
                                                className='text-xs truncate w-16'
                                                title={file.md5_checksum}
                                              >
                                                {file.md5_checksum.substring(
                                                  0,
                                                  8,
                                                )}
                                                ...
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className='text-xs' suppressHydrationWarning>
                                            {new Date(
                                              file.uploaded_time,
                                            ).toLocaleString('zh-CN')}
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant='ghost'
                                              size='icon'
                                              onClick={() =>
                                                setDeletingFile({
                                                  sampleUid: sampleDetails.uid,
                                                  fileUid: file.uid,
                                                })
                                              }
                                            >
                                              <Trash2Icon className='size-4 text-destructive' />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      {editingSample && editingSampleData && (
        <EditSampleDialog
          projectId={projectId}
          sample={editingSampleData}
          open={!!editingSample}
          onOpenChange={(open) => !open && setEditingSample(null)}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deletingSample}
        onOpenChange={(open) => !open && setDeletingSample(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个样本吗?此操作无法撤销,样本的所有文件信息也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSample && handleDelete(deletingSample)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteSampleMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除文件确认对话框 */}
      <AlertDialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && setDeletingFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文件</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个文件吗?此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingFile &&
                handleDeleteFile(deletingFile.sampleUid, deletingFile.fileUid)
              }
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteFileMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
