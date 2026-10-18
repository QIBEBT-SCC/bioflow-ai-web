'use client'

import {
  CheckCircle2Icon,
  CircleDashedIcon,
  DatabaseIcon,
  DownloadIcon,
  FolderIcon,
  Loader2Icon,
  type LucideIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { SectionCard } from '@/components/layout/section-card'
import { DatabaseFormDialog } from '@/components/resource/databases/database-form-dialog'
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
import { CopyButton } from '@/components/ui/copy-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDB,
  useDeleteDB,
  useDownloadDB,
  useDownloadStatusStream,
} from '@/hooks/use-resource'
import { type StatusTone, statusToneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { BioDbDownloadStatus } from '@/types/resource'

interface DatabaseDetailProps {
  databaseId: number
  onDelete: () => void
}

const DOWNLOAD_STATUS_APPEARANCE: Record<
  BioDbDownloadStatus,
  {
    labelKey: 'status_ready' | 'downloading_status' | 'status_not_downloaded'
    icon: LucideIcon
    tone: StatusTone
  }
> = {
  ready: { labelKey: 'status_ready', icon: CheckCircle2Icon, tone: 'success' },
  downloading: {
    labelKey: 'downloading_status',
    icon: Loader2Icon,
    tone: 'info',
  },
  not_downloaded: {
    labelKey: 'status_not_downloaded',
    icon: CircleDashedIcon,
    tone: 'neutral',
  },
}

export function DatabaseDetail({ databaseId, onDelete }: DatabaseDetailProps) {
  const t = useTranslations('resource')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
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
      <div className='space-y-4' aria-busy='true'>
        <span className='sr-only'>{t('loading')}</span>
        <Skeleton className='h-16 rounded-xl' />
        <Skeleton className='h-12 rounded-xl' />
        <Skeleton className='h-64 rounded-xl' />
      </div>
    )
  }

  if (!database) {
    return (
      <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
        {t('database_not_found')}
      </div>
    )
  }

  const hasDownloadCommand = Boolean(database.download_command)

  return (
    <div className='min-w-0 space-y-6'>
      <header className='space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <DatabaseIcon className='size-5' />
            </span>
            <div className='min-w-0'>
              <h2 className='truncate text-lg font-semibold tracking-tight'>
                {database.name}
              </h2>
              <p className='text-sm text-pretty text-muted-foreground'>
                {database.description || t('no_description')}
              </p>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {hasDownloadCommand && (
              <Button
                variant='outline'
                onClick={handleDownload}
                disabled={isDownloading || downloadMutation.isPending}
              >
                {isDownloading ? (
                  <Loader2Icon className='size-4 animate-spin' />
                ) : database.path ? (
                  <RefreshCwIcon className='size-4' />
                ) : (
                  <DownloadIcon className='size-4' />
                )}
                {isDownloading
                  ? t('downloading_status')
                  : database.path
                    ? t('redownload')
                    : t('download')}
              </Button>
            )}
            <Button variant='outline' onClick={() => setIsEditDialogOpen(true)}>
              <PencilIcon className='size-4' />
              {t('edit')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={t('more_actions')}
                >
                  <MoreHorizontalIcon className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  variant='destructive'
                  disabled={deleteMutation.isPending}
                  onSelect={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2Icon className='size-4' />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm'>
          <DownloadStatusBadge status={downloadStatus} />
          <MetaItem label={t('size')} value={database.size} />
          <MetaItem label={t('last_update')} value={database.last_update} />
        </div>
      </header>

      <SectionCard
        icon={<FolderIcon />}
        title={t('data_source')}
        description={t('data_source_desc')}
        contentClassName='space-y-5'
      >
        <SourceField label={t('path')}>
          {database.path ? (
            <CodeValue value={database.path} />
          ) : (
            <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
              {t('not_downloaded_hint')}
            </p>
          )}
        </SourceField>

        {database.download_command && (
          <>
            <SourceField label={t('download_command')}>
              <CodeValue value={database.download_command} multiline />
            </SourceField>
            <SourceField label={t('download_image')}>
              {database.download_image ? (
                <CodeValue value={database.download_image} />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('default_image')}
                </p>
              )}
            </SourceField>
          </>
        )}
      </SectionCard>

      <DatabaseFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        database={database}
      />

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

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <span className='flex items-baseline gap-1.5'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='tabular-nums'>{value || '—'}</span>
    </span>
  )
}

function SourceField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className='space-y-1.5'>
      <h4 className='text-xs text-muted-foreground'>{label}</h4>
      {children}
    </div>
  )
}

function CodeValue({
  value,
  multiline = false,
}: {
  value: string
  multiline?: boolean
}) {
  return (
    <div className='flex items-start gap-1 rounded-lg bg-muted py-1 pr-1 pl-3'>
      <code
        className={cn(
          'min-w-0 flex-1 py-1.5 font-mono text-xs',
          multiline ? 'whitespace-pre-wrap break-all' : 'truncate',
        )}
        title={multiline ? undefined : value}
      >
        {value}
      </code>
      <CopyButton code={value} className='shrink-0' />
    </div>
  )
}

function DownloadStatusBadge({
  status,
}: {
  status: BioDbDownloadStatus | null
}) {
  const t = useTranslations('resource')
  if (status === null) return <Skeleton className='h-5 w-16 rounded-full' />

  const { labelKey, icon: Icon, tone } = DOWNLOAD_STATUS_APPEARANCE[status]
  return (
    <Badge
      variant='outline'
      className={cn('gap-1', statusToneClasses[tone].badge)}
    >
      <Icon
        className={cn('size-3', status === 'downloading' && 'animate-spin')}
      />
      {t(labelKey)}
    </Badge>
  )
}
