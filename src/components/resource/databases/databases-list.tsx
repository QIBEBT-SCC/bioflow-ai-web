'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDBList, useSearchDB } from '@/hooks/use-resource'

interface DatabasesListProps {
  searchQuery: string
  onSelectDatabase: (id: number) => void
  selectedDbId: number | null
}

export function DatabasesList({
  searchQuery,
  onSelectDatabase,
  selectedDbId,
}: DatabasesListProps) {
  const t = useTranslations('resource')
  const [offset, setOffset] = useState(0)
  const pageSize = 8
  const trimmedSearchQuery = searchQuery.trim()
  const isSearching = trimmedSearchQuery.length > 0
  const prevSearchQueryRef = useRef(trimmedSearchQuery)
  if (trimmedSearchQuery !== prevSearchQueryRef.current) {
    prevSearchQueryRef.current = trimmedSearchQuery
    setOffset(0)
  }

  const { data: listPage, isLoading: isLoadingList } = useDBList(
    offset,
    pageSize,
    !isSearching,
  )
  const { data: searchPage, isLoading: isLoadingSearch } = useSearchDB(
    trimmedSearchQuery,
    offset,
    pageSize,
  )
  const activePage = isSearching ? searchPage : listPage
  const databases = activePage?.data ?? []
  const totalCount = activePage?.total ?? 0
  const isLoading = isSearching ? isLoadingSearch : isLoadingList

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.floor(offset / pageSize) + 1

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset((prev) => prev - pageSize)
    }
  }

  const handleNextPage = () => {
    if (offset + pageSize < totalCount) {
      setOffset((prev) => prev + pageSize)
    }
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>{t('database_list')}</h2>

      {isLoading ? (
        <div className='py-12 text-center text-muted-foreground'>
          {t('loading')}
        </div>
      ) : databases.length > 0 ? (
        <>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db) => (
                  <TableRow
                    key={db.id}
                    className={`cursor-pointer ${selectedDbId === db.id ? 'bg-muted' : ''}`}
                    onClick={() => onSelectDatabase(db.id)}
                  >
                    <TableCell className='font-medium'>{db.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalCount > pageSize && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                {t('pagination', {
                  total: totalCount,
                  current: currentPage,
                  total_pages: totalPages,
                })}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  <ChevronLeftIcon className='size-4' />
                  {t('prev_page')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleNextPage}
                  disabled={offset + pageSize >= totalCount}
                >
                  {t('next_page')}
                  <ChevronRightIcon className='size-4' />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className='py-12 text-center text-muted-foreground'>
          {t('no_database_found')}
        </div>
      )}
    </div>
  )
}
