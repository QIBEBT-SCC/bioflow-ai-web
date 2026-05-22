'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDBCount, useDBList } from '@/hooks/use-resource'

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
  const [offset, setOffset] = useState(0)
  const pageSize = 8

  const { data: databases = [], isLoading: isLoadingList } = useDBList(
    offset,
    !searchQuery, // 有搜索时不请求
  )
  const { data: totalCount = 0 } = useDBCount()

  const totalPages = Math.ceil(totalCount / pageSize)
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
      <h2 className='text-xl font-semibold'>数据库列表</h2>

      {isLoadingList ? (
        <div className='py-12 text-center text-muted-foreground'>加载中...</div>
      ) : databases.length > 0 ? (
        <>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
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
                共 {totalCount} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  <ChevronLeftIcon className='size-4' />
                  上一页
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleNextPage}
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
        <div className='py-12 text-center text-muted-foreground'>
          未找到数据库
        </div>
      )}
    </div>
  )
}
