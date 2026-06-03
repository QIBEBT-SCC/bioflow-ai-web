'use client'

import {
  CheckCircle2,
  FileText,
  Hammer,
  Loader2,
  MinusCircle,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { GenomeBuildIndexDialog } from '@/components/resource/genome/genome-build-index-dialog'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteGenome, useGenome } from '@/hooks/use-genome'
import type { IndexStatus } from '@/types/genome'
import { INDEX_TOOLS } from '@/types/genome'

interface GenomeDetailProps {
  genomeId: number
  onDelete: () => void
}

function IndexStatusIcon({ status }: { status: IndexStatus }) {
  if (status === 'ready')
    return <CheckCircle2 className='size-4 text-emerald-500' />
  if (status === 'building')
    return <Loader2 className='size-4 text-amber-500 animate-spin' />
  return <MinusCircle className='size-4 text-muted-foreground' />
}

function IndexStatusLabel({ status }: { status: IndexStatus }) {
  const t = useTranslations('resource')
  if (status === 'ready')
    return (
      <span className='text-emerald-600 dark:text-emerald-400 text-sm font-medium'>
        {t('genome.status_ready')}
      </span>
    )
  if (status === 'building')
    return (
      <span className='text-amber-600 dark:text-amber-400 text-sm font-medium'>
        {t('genome.status_building')}
      </span>
    )
  return (
    <span className='text-muted-foreground text-sm'>
      {t('genome.status_not_built')}
    </span>
  )
}

export function GenomeDetail({ genomeId, onDelete }: GenomeDetailProps) {
  const t = useTranslations('resource')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBuildIndexOpen, setIsBuildIndexOpen] = useState(false)

  const { data: genome, isLoading } = useGenome(genomeId)
  const deleteMutation = useDeleteGenome()

  const confirmDelete = () => {
    deleteMutation.mutate(genomeId, {
      onSuccess: () => onDelete(),
    })
    setIsDeleteDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-40 w-full' />
        <Skeleton className='h-60 w-full' />
      </div>
    )
  }

  if (!genome) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        {t('genome.not_found')}
      </div>
    )
  }

  const hasNotBuilt = INDEX_TOOLS.some(
    (t) => genome.index_status[t.key] === 'not_built',
  )

  return (
    <div className='space-y-4'>
      {/* 标题栏 */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>{genome.name}</h2>
          <code className='text-xs text-muted-foreground'>
            {genome.accession}
          </code>
          {genome.aliases && (
            <div className='flex flex-wrap gap-1 mt-1'>
              {genome.aliases.split('|').map((alias) => (
                <Badge key={alias} variant='secondary' className='text-xs'>
                  {alias}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className='flex gap-2 shrink-0'>
          {hasNotBuilt && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsBuildIndexOpen(true)}
            >
              <Hammer className='size-4 mr-1' />
              {t('genome.build_index')}
            </Button>
          )}
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className='size-4 mr-1' />
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            {t('genome.basic_info')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <dt className='text-xs font-medium text-muted-foreground'>
                NCBI Tax ID
              </dt>
              <dd className='mt-0.5 text-sm'>{genome.ncbi_tax_id}</dd>
            </div>
            <div>
              <dt className='text-xs font-medium text-muted-foreground'>
                Accession
              </dt>
              <dd className='mt-0.5'>
                <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                  {genome.accession}
                </code>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-1'>
            <FileText className='size-4' />
            {t('genome.file_paths')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className='space-y-3'>
            {[
              { label: t('genome.fasta_file'), value: genome.genome_sequences },
              { label: t('genome.gff_file'), value: genome.annotation_gff },
              { label: t('genome.gtf_file'), value: genome.annotation_gtf },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className='text-xs font-medium text-muted-foreground'>
                  {label}
                </dt>
                <dd className='mt-0.5'>
                  <code className='text-xs bg-muted px-2 py-1 rounded block break-all'>
                    {value}
                  </code>
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            {t('genome.index_status_card')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {INDEX_TOOLS.map((tool) => {
              const status = genome.index_status[tool.key]
              const indexPath = genome[tool.field as keyof typeof genome] as
                | string
                | null
              return (
                <div
                  key={tool.key}
                  className='flex items-start justify-between gap-4'
                >
                  <div className='flex items-center gap-2'>
                    <IndexStatusIcon status={status} />
                    <div>
                      <div className='text-sm font-medium'>{tool.label}</div>
                      <div className='text-xs text-muted-foreground'>
                        {t(tool.descKey as Parameters<typeof t>[0])}
                      </div>
                    </div>
                  </div>
                  <div className='text-right shrink-0'>
                    <IndexStatusLabel status={status} />
                    {status === 'ready' && indexPath && (
                      <div className='mt-0.5'>
                        <code className='text-xs text-muted-foreground'>
                          {indexPath.split('/').slice(-2).join('/')}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 构建索引对话框 */}
      <GenomeBuildIndexDialog
        open={isBuildIndexOpen}
        onOpenChange={setIsBuildIndexOpen}
        genome={genome}
      />

      {/* 删除确认对话框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('genome.delete_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {t.rich('genome.delete_confirm_desc', {
                  name: genome.name,
                  accession: genome.accession,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {t('genome.confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
