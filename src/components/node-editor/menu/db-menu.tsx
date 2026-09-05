'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('editor.menu')
  const [query, setQuery] = useState('')

  const hasQuery = query.trim() !== ''
  const { data: searchPage, isLoading } = useSearchDB(query)
  const searchResults = searchPage?.data ?? []
  const searchTotal = searchPage?.total ?? 0

  const handleDBSelect = (db: BioDb) => {
    onSelectDb('resource_db', String(db.id), db.name)
    setQuery('')
    onOpenChange(false)
  }

  const handleSearchChange = (value: string) => {
    setQuery(value)
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t('search_database')}
        value={query}
        onValueChange={handleSearchChange}
      />
      <CommandList>
        <CommandEmpty>
          {hasQuery ? t('no_database_found') : t('enter_keywords')}
        </CommandEmpty>

        {hasQuery &&
          (isLoading ? (
            <CommandGroup heading={t('searching')}>
              {['s1', 's2', 's3'].map((id) => (
                <div key={id}>
                  <DBSkeleton />
                </div>
              ))}
            </CommandGroup>
          ) : (
            searchResults.length > 0 && (
              <CommandGroup
                heading={t('search_results_count', { count: searchTotal })}
              >
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
                        {t('db_path', { path: db.path ?? '' })}
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
