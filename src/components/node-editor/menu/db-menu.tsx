'use client'

import type React from 'react'
import { useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchDB } from '@/hooks/use-resource'
import type { BioDb } from '@/types/resource'

interface DBMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectDb: (toolType: string, toolUid: string, resourceName?: string) => void
}

// 数据库项骨架屏组件
const DBSkeleton = () => (
  <div className='p-3'>
    <Skeleton className='h-4 w-3/4 mb-2' />
    <Skeleton className='h-3 w-full' />
  </div>
)

export const DbMenu: React.FC<DBMenuProps> = ({
  isOpen,
  onOpenChange,
  onSelectDb,
}) => {
  const [query, setQuery] = useState('')

  // 只在有搜索查询时才调用API
  const hasQuery = query.trim() !== ''
  const { data: searchResults = [], isLoading } = useSearchDB(query)

  // 处理数据库选择
  const handleDBSelect = (db: BioDb) => {
    onSelectDb('resource_db', String(db.id), db.name)
    setQuery('') // 清空搜索
    onOpenChange(false)
  }

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setQuery(value)
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder='搜索数据库...'
        value={query}
        onValueChange={handleSearchChange}
      />
      <CommandList>
        <CommandEmpty>
          {hasQuery ? '未找到匹配的数据库' : '请输入关键词搜索数据库'}
        </CommandEmpty>

        {hasQuery &&
          (isLoading ? (
            // 搜索加载状态
            <CommandGroup heading='搜索中...'>
              {['s1', 's2', 's3'].map((id) => (
                <div key={id}>
                  <DBSkeleton />
                </div>
              ))}
            </CommandGroup>
          ) : (
            searchResults.length > 0 && (
              // 搜索结果
              <CommandGroup heading={`搜索结果 (${searchResults.length})`}>
                {searchResults.map((db) => (
                  <CommandItem
                    key={db.id}
                    value={db.name}
                    onSelect={() => handleDBSelect(db)}
                    className='cursor-pointer'
                  >
                    <div className='flex flex-col w-full'>
                      <span className='font-medium'>{db.name}</span>
                      {db.description && (
                        <span className='text-xs text-muted-foreground truncate'>
                          {db.description}
                        </span>
                      )}
                      <span className='text-xs text-muted-foreground truncate'>
                        路径: {db.path}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          ))}
      </CommandList>
    </CommandDialog>
  )
}
