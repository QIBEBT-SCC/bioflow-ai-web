'use client'

import { format, parseISO } from 'date-fns'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  Loader2,
  MoreHorizontal,
  Trash2Icon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import type { Sample, SampleFileType } from '@/types/sample'
import { AddSampleFileDialog } from './add-sample-file-dialog'
import { CreateSampleDialog } from './create-sample-dialog'
import { EditSampleDialog } from './edit-sample-dialog'

interface SampleFilesSectionProps {
  projectId: string
  sampleDetails: Sample
  onDeleteFile: (fileUid: string) => void
}

interface SampleListProps {
  projectId: string
}

const fileTypeLabelKeys: Record<SampleFileType, string> = {
  0: 'sequencingR1',
  1: 'sequencingR2',
  2: 'sequencingSingle',
  3: 'spectrum',
  4: 'image',
}

function SampleFilesSection({
  projectId,
  sampleDetails,
  onDeleteFile,
}: SampleFilesSectionProps) {
  const t = useTranslations('Project.sample.files')

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-sm font-semibold'>{t('title')}</h4>
        <AddSampleFileDialog
          projectId={projectId}
          sampleUid={sampleDetails.uid}
        />
      </div>
      {sampleDetails.files.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[180px]'>{t('fileType')}</TableHead>
              <TableHead>{t('filePath')}</TableHead>
              <TableHead className='w-[100px]'>{t('format')}</TableHead>
              <TableHead className='w-[100px]'>{t('size')}</TableHead>
              <TableHead className='w-[120px]'>{t('md5')}</TableHead>
              <TableHead className='w-[180px]'>{t('uploadedAt')}</TableHead>
              <TableHead className='w-[80px]'>{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleDetails.files.map((file) => {
              const isDefaultTag = file.tag === defaultTags[file.data_type]
              return (
                <TableRow key={file.uid}>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      <Badge className={fileTypeColors[file.data_type]}>
                        {t(`types.${fileTypeLabelKeys[file.data_type]}`)}
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
                    <Badge variant='outline'>{file.file_format}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(file.file_size)}</TableCell>
                  <TableCell>
                    <div className='flex items-center'>
                      <CheckIcon className='size-4 text-green-500 mr-1' />
                      <span
                        className='text-xs truncate w-16'
                        title={file.md5_checksum}
                      >
                        {file.md5_checksum.substring(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-xs' suppressHydrationWarning>
                    {format(
                      parseISO(file.uploaded_time),
                      'yyyy-MM-dd HH:mm:ss',
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => onDeleteFile(file.uid)}
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
  )
}

// 文件类型标签映射
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
  const t = useTranslations('Project.sample')
  const tFiles = useTranslations('Project.sample.files')
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

      toast.success(t('deleteSuccess'))

      setDeletingSample(null)
    } catch {
      toast.error(t('deleteFailed'))
    }
  }

  const handleDeleteFile = async (sampleUid: string, fileUid: string) => {
    try {
      await deleteFileMutation.mutateAsync({
        projectId,
        sampleUid,
        fileUid,
      })

      toast.success(tFiles('deleteSuccess'))

      setDeletingFile(null)
    } catch {
      toast.error(tFiles('deleteFailed'))
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
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            <CreateSampleDialog projectId={projectId} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[30px]'></TableHead>
                <TableHead className='w-[180px]'>{t('sampleName')}</TableHead>
                <TableHead>{t('metadata')}</TableHead>
                <TableHead className='w-[180px]'>{t('createdAt')}</TableHead>
                <TableHead className='w-[100px]'>{t('fileCount')}</TableHead>
                <TableHead className='w-[100px]'>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!samples || samples.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center py-8 text-muted-foreground'
                  >
                    {t('empty')}
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
                          {format(
                            parseISO(sample.create_time),
                            'yyyy-MM-dd HH:mm:ss',
                          )}
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
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeletingSample(sample.uid)}
                              >
                                <Trash2Icon className='size-4 mr-2' />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isExpanded && sampleDetails && (
                        <TableRow className='bg-muted/30'>
                          <TableCell colSpan={6} className='p-0'>
                            <SampleFilesSection
                              projectId={projectId}
                              sampleDetails={sampleDetails}
                              onDeleteFile={(fileUid) =>
                                setDeletingFile({
                                  sampleUid: sampleDetails.uid,
                                  fileUid,
                                })
                              }
                            />
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
          key={editingSampleData.uid}
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
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSample && handleDelete(deletingSample)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteSampleMutation.isPending
                ? t('deleting')
                : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && setDeletingFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tFiles('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tFiles('deleteDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingFile &&
                handleDeleteFile(deletingFile.sampleUid, deletingFile.fileUid)
              }
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteFileMutation.isPending
                ? t('deleting')
                : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
