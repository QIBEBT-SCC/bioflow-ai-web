'use client'

import {
  CheckCircle2Icon,
  CircleDashedIcon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  useDB,
  useDeleteDB,
  useDownloadDB,
  useDownloadStatusStream,
} from '@/hooks/use-resource'

interface DatabaseDetailProps {
  databaseId: number
  onDelete: () => void
}

export function DatabaseDetail({ databaseId, onDelete }: DatabaseDetailProps) {
  const t = useTranslations('resource')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [restartToken, setRestartToken] = useState(0)

  const { data: database, isLoading } = useDB(databaseId)
  const deleteMutation = useDeleteDB()
  const downloadMutation = useDownloadDB()
  const downloadStatus = useDownloadStatusStream(databaseId, restartToken)

  const isDownloading = downloadStatus === 'downloading'

  const confirmDelete = () => {
    deleteMutation.mutate(databaseId, {
      onSuccess: () => {
        onDelete()
      },
    })
    setIsDeleteDialogOpen(false)
  }

  const handleDownload = () => {
    downloadMutation.mutate(databaseId, {
      onSuccess: () => {
        setRestartToken((prev) => prev + 1)
      },
    })
  }

  if (isLoading) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        {t('loading')}
      </div>
    )
  }

  if (!database) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        {t('database_not_found')}
      </div>
    )
  }

  const hasDownloadCommand = Boolean(database.download_command)

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-2xl font-semibold'>{database.name}</h2>
          <DownloadStatusBadge status={downloadStatus} />
        </div>
        <div className='flex gap-2'>
          {hasDownloadCommand && (
            <Button
              variant='outline'
              onClick={handleDownload}
              disabled={isDownloading || downloadMutation.isPending}
            >
              {isDownloading ? (
                <Loader2Icon className='mr-2 size-4 animate-spin' />
              ) : database.path ? (
                <RefreshCwIcon className='mr-2 size-4' />
              ) : (
                <DownloadIcon className='mr-2 size-4' />
              )}
              {isDownloading
                ? t('downloading_status')
                : database.path
                  ? t('redownload')
                  : t('download')}
            </Button>
          )}
          <Button
            variant='destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2Icon className='mr-2 size-4' />
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='col-span-2'>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('description_label')}
              </dt>
              <dd className='mt-1 text-sm'>
                {database.description || t('no_description')}
              </dd>
            </div>
            <div className='col-span-2'>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('path')}
              </dt>
              <dd className='mt-1 text-sm font-mono bg-muted p-2 rounded'>
                {database.path || t('not_downloaded_hint')}
              </dd>
            </div>
            {database.download_command && (
              <div className='col-span-2'>
                <dt className='text-sm font-medium text-muted-foreground'>
                  {t('download_command')}
                </dt>
                <dd className='mt-1 text-sm font-mono bg-muted p-2 rounded whitespace-pre-wrap break-all'>
                  {database.download_command}
                </dd>
              </div>
            )}
            {database.download_command && (
              <div className='col-span-2'>
                <dt className='text-sm font-medium text-muted-foreground'>
                  {t('download_image')}
                </dt>
                <dd className='mt-1 text-sm font-mono'>
                  {database.download_image || t('default_image')}
                </dd>
              </div>
            )}
            <div>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('size')}
              </dt>
              <dd className='mt-1 text-sm'>{database.size || '-'}</dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('last_update')}
              </dt>
              <dd className='mt-1 text-sm'>{database.last_update || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DownloadStatusBadge({
  status,
}: {
  status: 'not_downloaded' | 'downloading' | 'ready' | null
}) {
  const t = useTranslations('resource')

  if (status === 'ready') {
    return (
      <Badge
        variant='outline'
        className='border-green-500/50 text-green-600 dark:text-green-400'
      >
        <CheckCircle2Icon className='mr-1 size-3' />
        {t('status_ready')}
      </Badge>
    )
  }
  if (status === 'downloading') {
    return (
      <Badge
        variant='outline'
        className='border-blue-500/50 text-blue-600 dark:text-blue-400'
      >
        <Loader2Icon className='mr-1 size-3 animate-spin' />
        {t('downloading_status')}
      </Badge>
    )
  }
  if (status === 'not_downloaded') {
    return (
      <Badge variant='outline' className='text-muted-foreground'>
        <CircleDashedIcon className='mr-1 size-3' />
        {t('status_not_downloaded')}
      </Badge>
    )
  }
  return null
}
