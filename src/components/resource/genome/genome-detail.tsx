'use client'

import {
  CheckCircle2,
  FileText,
  Hammer,
  Loader2,
  MinusCircle,
  Trash2,
} from 'lucide-react'
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
  if (status === 'ready')
    return (
      <span className='text-emerald-600 dark:text-emerald-400 text-sm font-medium'>
        已就绪
      </span>
    )
  if (status === 'building')
    return (
      <span className='text-amber-600 dark:text-amber-400 text-sm font-medium'>
        构建中
      </span>
    )
  return <span className='text-muted-foreground text-sm'>未构建</span>
}

export function GenomeDetail({ genomeId, onDelete }: GenomeDetailProps) {
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
        基因组不存在或已被删除
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
              构建索引
            </Button>
          )}
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className='size-4 mr-1' />
            {deleteMutation.isPending ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            基本信息
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

      {/* 文件路径 */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-1'>
            <FileText className='size-4' />
            文件路径
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className='space-y-3'>
            {[
              { label: '基因组序列 (FASTA)', value: genome.genome_sequences },
              { label: 'GFF 注释', value: genome.annotation_gff },
              { label: 'GTF 注释', value: genome.annotation_gtf },
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

      {/* 索引状态 */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            比对索引状态
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
                        {tool.description}
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
            <AlertDialogTitle>确认删除参考基因组</AlertDialogTitle>
            <AlertDialogDescription>
              将从数据库中移除 <strong>{genome.name}</strong> (
              {genome.accession}) 的记录。 磁盘上的 FASTA 文件和索引文件
              <strong>不会被删除</strong>，但系统将无法再引用该基因组。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
