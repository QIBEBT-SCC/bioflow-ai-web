'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { getDBCount, getDBList } from '@/app/actions/resource'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BioDbSimple } from '@/types/resource'

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
  const [databases, setDatabases] = useState<BioDbSimple[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [isPending, startTransition] = useTransition()
  const pageSize = 8

  // 加载数据
  useEffect(() => {
    if (!searchQuery) {
      startTransition(async () => {
        try {
          const [dbList, count] = await Promise.all([
            getDBList(offset, pageSize),
            getDBCount(),
          ])
          setDatabases(dbList)
          setTotalCount(count)
        } catch (error) {
          console.error('Failed to load databases:', error)
        }
      })
    }
  }, [offset, searchQuery])

  const totalPages = Math.ceil(totalCount / pageSize)
  const currentPage = Math.floor(offset / pageSize) + 1

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(offset - pageSize)
    }
  }

  const handleNextPage = () => {
    if (offset + pageSize < totalCount) {
      setOffset(offset + pageSize)
    }
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>数据库列表</h2>

      {databases.length > 0 ? (
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
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              共 {totalCount} 条记录，第 {currentPage} / {totalPages} 页
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handlePrevPage}
                disabled={offset === 0 || isPending}
              >
                <ChevronLeftIcon className='h-4 w-4' />
                上一页
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleNextPage}
                disabled={offset + pageSize >= totalCount || isPending}
              >
                下一页
                <ChevronRightIcon className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className='py-12 text-center text-muted-foreground'>
          {isPending ? '加载中...' : '未找到数据库'}
        </div>
      )}
    </div>
  )
}
