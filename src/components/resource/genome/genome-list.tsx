'use client'

import {
  CheckCircle2,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  MinusCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useGenomeCount,
  useGenomeList,
  useSearchGenome,
} from '@/hooks/use-genome'
import { cn } from '@/lib/utils'
import type {
  GenomeIndexStatus,
  IndexStatus,
  ReferenceGenomeListItem,
} from '@/types/genome'
import { INDEX_TOOLS } from '@/types/genome'

interface GenomeListProps {
  searchQuery: string
  onSelectGenome: (id: number) => void
  selectedId: number | null
}

function IndexStatusBadge({
  status,
  label,
}: {
  status: IndexStatus
  label: string
}) {
  if (status === 'ready') {
    return (
      <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1'>
        <CheckCircle2 className='size-3' />
        {label}
      </Badge>
    )
  }
  if (status === 'building') {
    return (
      <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1'>
        <Loader2 className='size-3 animate-spin' />
        {label}
      </Badge>
    )
  }
  return (
    <Badge variant='outline' className='text-muted-foreground gap-1'>
      <MinusCircle className='size-3' />
      {label}
    </Badge>
  )
}

function IndexStatusRow({ status }: { status: GenomeIndexStatus }) {
  return (
    <div className='flex flex-wrap gap-1'>
      {INDEX_TOOLS.map((tool) => (
        <IndexStatusBadge
          key={tool.key}
          status={status[tool.key]}
          label={tool.label}
        />
      ))}
    </div>
  )
}

export function GenomeList({
  searchQuery,
  onSelectGenome,
  selectedId,
}: GenomeListProps) {
  const [offset, setOffset] = useState(0)
  const pageSize = 10

  const { data: list = [], isLoading: isLoadingList } = useGenomeList(
    offset,
    !searchQuery,
  )
  const { data: searchResults = [], isLoading: isLoadingSearch } =
    useSearchGenome(searchQuery)
  const { data: totalCount = 0 } = useGenomeCount()

  const isSearch = searchQuery.trim().length > 0
  const isLoading = isSearch ? isLoadingSearch : isLoadingList
  const genomes: ReferenceGenomeListItem[] = isSearch ? searchResults : list

  const totalPages = Math.ceil(totalCount / pageSize)
  const currentPage = Math.floor(offset / pageSize) + 1

  return (
    <div className='space-y-4'>
      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: no need
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      ) : genomes.length > 0 ? (
        <>
          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[200px]'>物种名</TableHead>
                  <TableHead>Accession</TableHead>
                  <TableHead>索引状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genomes.map((genome) => (
                  <TableRow
                    key={genome.id}
                    className={cn(
                      'cursor-pointer',
                      selectedId === genome.id && 'bg-muted',
                    )}
                    onClick={() => onSelectGenome(genome.id)}
                  >
                    <TableCell className='font-medium'>
                      <div>{genome.name}</div>
                      {genome.aliases && (
                        <div className='text-xs text-muted-foreground'>
                          {genome.aliases.split('|').join(' · ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                        {genome.accession}
                      </code>
                    </TableCell>
                    <TableCell>
                      <IndexStatusRow status={genome.index_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页（搜索模式下不显示） */}
          {!isSearch && totalCount > pageSize && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                共 {totalCount} 条，第 {currentPage} / {totalPages} 页
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setOffset(offset - pageSize)}
                  disabled={offset === 0}
                >
                  <ChevronLeftIcon className='size-4' />
                  上一页
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setOffset(offset + pageSize)}
                  disabled={offset + pageSize >= totalCount}
                >
                  下一页
                  <ChevronRightIcon className='size-4' />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className='py-16 text-center text-muted-foreground'>
          {isSearch
            ? `未找到包含 "${searchQuery}" 的参考基因组`
            : '暂无参考基因组，请点击"下载基因组"添加'}
        </div>
      )}
    </div>
  )
}

export { IndexStatusBadge, IndexStatusRow }
