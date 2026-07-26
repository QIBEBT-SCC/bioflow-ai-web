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
import { ImagePagination } from '@/components/image/image-pagination'
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
  useSamplesPage,
} from '@/hooks/use-sample'
import type { Sample } from '@/types/sample'
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

interface SampleDialogsProps {
  projectId: string
  editingSample: string | null
  editingSampleData?: Sample
  deletingSample: string | null
  deletingFile: { sampleUid: string; fileUid: string } | null
  isDeletingSample: boolean
  isDeletingFile: boolean
  onCloseEditing: () => void
  onCloseDeletingSample: () => void
  onCloseDeletingFile: () => void
  onDeleteSample: (sampleUid: string) => void
  onDeleteFile: (sampleUid: string, fileUid: string) => void
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
              <TableHead className='w-45'>{t('tag')}</TableHead>
              <TableHead>{t('filePath')}</TableHead>
              <TableHead className='w-25'>{t('format')}</TableHead>
              <TableHead className='w-25'>{t('size')}</TableHead>
              <TableHead className='w-30'>{t('md5')}</TableHead>
              <TableHead className='w-45'>{t('uploadedAt')}</TableHead>
              <TableHead className='w-20'>{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleDetails.files.map((file) => (
              <TableRow key={file.uid}>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <Badge
                      variant='outline'
                      className='bg-blue-50 text-blue-700 border-blue-200'
                    >
                      {file.tag}
                    </Badge>
                    {file.is_dynamic && (
                      <Badge variant='secondary'>{t('dynamic')}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {file.file_path}
                </TableCell>
                <TableCell>
                  <Badge variant='outline'>{file.file_format ?? '—'}</Badge>
                </TableCell>
                <TableCell>{formatFileSize(file.file_size)}</TableCell>
                <TableCell>
                  {file.md5_checksum ? (
                    <div className='flex items-center'>
                      <CheckIcon className='size-4 text-green-500 mr-1' />
                      <span
                        className='text-xs truncate w-16'
                        title={file.md5_checksum}
                      >
                        {file.md5_checksum.substring(0, 8)}...
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className='text-xs' suppressHydrationWarning>
                  {format(parseISO(file.uploaded_time), 'yyyy-MM-dd HH:mm:ss')}
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
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

function SampleDialogs({
  projectId,
  editingSample,
  editingSampleData,
  deletingSample,
  deletingFile,
  isDeletingSample,
  isDeletingFile,
  onCloseEditing,
  onCloseDeletingSample,
  onCloseDeletingFile,
  onDeleteSample,
  onDeleteFile,
}: SampleDialogsProps) {
  const t = useTranslations('Project.sample')
  const tFiles = useTranslations('Project.sample.files')

  return (
    <>
      {editingSample && editingSampleData && (
        <EditSampleDialog
          key={editingSampleData.uid}
          projectId={projectId}
          sample={editingSampleData}
          open={!!editingSample}
          onOpenChange={(open) => !open && onCloseEditing()}
        />
      )}

      <AlertDialog
        open={!!deletingSample}
        onOpenChange={(open) => !open && onCloseDeletingSample()}
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
              onClick={() => deletingSample && onDeleteSample(deletingSample)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeletingSample ? t('deleting') : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingFile}
        onOpenChange={(open) => !open && onCloseDeletingFile()}
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
                onDeleteFile(deletingFile.sampleUid, deletingFile.fileUid)
              }
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeletingFile ? t('deleting') : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SampleList({ projectId }: SampleListProps) {
  const t = useTranslations('Project.sample')
  const tFiles = useTranslations('Project.sample.files')
  const [expandedSamples, setExpandedSamples] = useState<
    Record<string, boolean>
  >({})
  const [listState, setListState] = useState<{
    editingSample: string | null
    deletingSample: string | null
    deletingFile: { sampleUid: string; fileUid: string } | null
    currentPage: number
  }>({
    editingSample: null,
    deletingSample: null,
    deletingFile: null,
    currentPage: 1,
  })
  const itemsPerPage = 20
  const { currentPage, deletingFile, deletingSample, editingSample } = listState
  const offset = (currentPage - 1) * itemsPerPage
  const updateListState = (state: Partial<typeof listState>) => {
    setListState((prev) => ({ ...prev, ...state }))
  }

  const { data: samplesPage, isLoading } = useSamplesPage(
    projectId,
    offset,
    itemsPerPage,
  )
  const samples = samplesPage?.data ?? []
  const totalCount = samplesPage?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
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

      updateListState({ deletingSample: null })
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

      updateListState({ deletingFile: null })
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
                <TableHead className='w-7.5'></TableHead>
                <TableHead className='w-45'>{t('sampleName')}</TableHead>
                <TableHead>{t('metadata')}</TableHead>
                <TableHead className='w-45'>{t('createdAt')}</TableHead>
                <TableHead className='w-25'>{t('fileCount')}</TableHead>
                <TableHead className='w-25'>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.length === 0 ? (
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
                                onClick={() =>
                                  updateListState({
                                    editingSample: sample.uid,
                                  })
                                }
                              >
                                <EditIcon className='size-4 mr-2' />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() =>
                                  updateListState({
                                    deletingSample: sample.uid,
                                  })
                                }
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
                                updateListState({
                                  deletingFile: {
                                    sampleUid: sampleDetails.uid,
                                    fileUid,
                                  },
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
          {totalPages > 1 && (
            <ImagePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => updateListState({ currentPage: page })}
            />
          )}
        </CardContent>
      </Card>

      <SampleDialogs
        projectId={projectId}
        editingSample={editingSample}
        editingSampleData={editingSampleData}
        deletingSample={deletingSample}
        deletingFile={deletingFile}
        isDeletingSample={deleteSampleMutation.isPending}
        isDeletingFile={deleteFileMutation.isPending}
        onCloseEditing={() => updateListState({ editingSample: null })}
        onCloseDeletingSample={() => updateListState({ deletingSample: null })}
        onCloseDeletingFile={() => updateListState({ deletingFile: null })}
        onDeleteSample={handleDelete}
        onDeleteFile={handleDeleteFile}
      />
    </>
  )
}
